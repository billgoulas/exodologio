import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useAppContext } from './app-context';
import { parseSpokenAmount, normalizeGreek } from './greek-number-parser';
import { TillMethod } from './types';

type VoiceStep = 'idle' | 'trigger' | 'method' | 'receipt' | 'amount';

const VOICE_LANG = 'el-GR';
// Native speech recognition is unsupported on web; the Ταμείο voice flow is
// simply a no-op there.
const SUPPORTED = Platform.OS !== 'web';

interface TillVoiceContextType {
  listening: boolean;
  speaking: boolean;
  step: VoiceStep;
  voiceAmountText: string | null;
  consumeVoiceAmount: () => void;
  voiceConfirmNonce: number;
  /** Re-arms listening for the "εγγραφή" trigger word. Call when the main
   * Ταμείο screen regains focus, so the flow resets correctly regardless of
   * whether the previous transaction was finished by voice or by touch. */
  resetToTrigger: () => void;
}

const TillVoiceContext = createContext<TillVoiceContextType | undefined>(undefined);

function speak(text: string): Promise<void> {
  if (!SUPPORTED) return Promise.resolve();
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: VOICE_LANG,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function TillVoiceProvider({ children }: { children: ReactNode }) {
  const { state } = useAppContext();
  const shiftActive = state.till.shiftActive;

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [step, setStepState] = useState<VoiceStep>('idle');
  const [voiceAmountText, setVoiceAmountText] = useState<string | null>(null);
  const [voiceConfirmNonce, setVoiceConfirmNonce] = useState(0);

  const stepRef = useRef<VoiceStep>('idle');
  const speakingRef = useRef(false);
  const shouldListenRef = useRef(false);
  const pendingMethodRef = useRef<TillMethod | null>(null);
  const permissionRequestedRef = useRef(false);

  const setStep = useCallback((next: VoiceStep) => {
    stepRef.current = next;
    setStepState(next);
  }, []);

  const startListening = useCallback(() => {
    if (!SUPPORTED || !shouldListenRef.current || speakingRef.current) return;
    try {
      ExpoSpeechRecognitionModule.start({
        lang: VOICE_LANG,
        interimResults: false,
        continuous: true,
      });
    } catch {
      // Will retry on the next 'end' cycle.
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!SUPPORTED) return;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Already stopped — nothing to do.
    }
  }, []);

  // Request mic/speech permission once, the first time a shift starts.
  useEffect(() => {
    if (!SUPPORTED || !shiftActive || permissionRequestedRef.current) return;
    permissionRequestedRef.current = true;
    ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => {});
  }, [shiftActive]);

  // The whole voice flow lives and dies with the shift.
  useEffect(() => {
    if (!SUPPORTED) return;
    if (shiftActive) {
      shouldListenRef.current = true;
      setStep('trigger');
      startListening();
    } else {
      shouldListenRef.current = false;
      setStep('idle');
      stopListening();
    }
  }, [shiftActive, setStep, startListening, stopListening]);

  useSpeechRecognitionEvent('start', () => setListening(true));

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    // Android speech recognition sessions commonly end on their own (e.g. a
    // few seconds of silence) — restart automatically so listening is
    // effectively continuous for as long as the shift is active.
    if (shouldListenRef.current && !speakingRef.current) {
      setTimeout(() => startListening(), 300);
    }
  });

  useSpeechRecognitionEvent('error', () => {
    // Swallowed — the 'end' handler above restarts listening.
  });

  const handleTranscript = useCallback(
    async (rawTranscript: string) => {
      const normalized = normalizeGreek(rawTranscript);
      const words = normalized.split(/\s+/).filter(Boolean);
      const currentStep = stepRef.current;

      if (currentStep === 'trigger') {
        if (!words.some((w) => w.startsWith('εγγραφ'))) return;
        stopListening();
        setStep('method');
        speakingRef.current = true;
        setSpeaking(true);
        await speak('Εφαρμογή, μετρητά ή POS;');
        speakingRef.current = false;
        setSpeaking(false);
        startListening();
        return;
      }

      if (currentStep === 'method') {
        let method: TillMethod | null = null;
        if (words.some((w) => w.startsWith('εφαρμογ'))) method = 'app';
        else if (words.some((w) => w.startsWith('μετρητ'))) method = 'cash';
        else if (words.includes('pos') || words.includes('ποσ')) method = 'appointment';
        if (!method) return;

        pendingMethodRef.current = method;
        stopListening();
        router.push({ pathname: '/till-receipt', params: { method } });
        setStep('receipt');
        speakingRef.current = true;
        setSpeaking(true);
        await speak('Με απόδειξη ή χωρίς απόδειξη;');
        speakingRef.current = false;
        setSpeaking(false);
        startListening();
        return;
      }

      if (currentStep === 'receipt') {
        let receipt: boolean | null = null;
        if (words.some((w) => w.startsWith('χωρις'))) receipt = false;
        else if (words.some((w) => w.startsWith('αποδειξ'))) receipt = true;
        if (receipt === null || !pendingMethodRef.current) return;

        stopListening();
        router.push({
          pathname: '/till-amount',
          params: { method: pendingMethodRef.current, receipt: receipt ? '1' : '0' },
        });
        setStep('amount');
        startListening();
        return;
      }

      if (currentStep === 'amount') {
        if (words.some((w) => w.startsWith('εντερ')) || words.includes('enter')) {
          setVoiceConfirmNonce((n) => n + 1);
          return;
        }
        const parsed = parseSpokenAmount(rawTranscript);
        if (parsed) setVoiceAmountText(parsed);
      }
    },
    [setStep, startListening, stopListening]
  );

  useSpeechRecognitionEvent('result', (event) => {
    if (!event.isFinal || !event.results?.length) return;
    const transcript = event.results[0]?.transcript;
    if (transcript) handleTranscript(transcript);
  });

  const consumeVoiceAmount = useCallback(() => setVoiceAmountText(null), []);

  const resetToTrigger = useCallback(() => {
    pendingMethodRef.current = null;
    if (!shouldListenRef.current) return;
    setStep('trigger');
    startListening();
  }, [setStep, startListening]);

  const value: TillVoiceContextType = {
    listening,
    speaking,
    step,
    voiceAmountText,
    consumeVoiceAmount,
    voiceConfirmNonce,
    resetToTrigger,
  };

  return <TillVoiceContext.Provider value={value}>{children}</TillVoiceContext.Provider>;
}

export function useTillVoice() {
  const ctx = useContext(TillVoiceContext);
  if (!ctx) {
    throw new Error('useTillVoice must be used within TillVoiceProvider');
  }
  return ctx;
}
