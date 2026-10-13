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
  /** TEMPORARY: recent recognition events (transcripts/errors), newest
   * first, shown on-screen to diagnose why a device isn't recognizing
   * Greek speech. Remove once voice commands are confirmed working. */
  debugLog: string[];
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
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const logDebug = useCallback((line: string) => {
    setDebugLog((prev) => [line, ...prev].slice(0, 6));
  }, []);

  const stepRef = useRef<VoiceStep>('idle');
  const speakingRef = useRef(false);
  const shouldListenRef = useRef(false);
  const pendingMethodRef = useRef<TillMethod | null>(null);
  const permissionRequestedRef = useRef(false);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const setStep = useCallback((next: VoiceStep) => {
    stepRef.current = next;
    setStepState(next);
  }, []);

  const startListening = useCallback(() => {
    if (!SUPPORTED || !shouldListenRef.current || speakingRef.current) return;
    try {
      // continuous:true hung indefinitely (no result/error/end at all) on
      // at least one real device — stick to one-shot sessions and rely on
      // our own 'end'-triggered restart loop below to approximate
      // always-on listening instead.
      ExpoSpeechRecognitionModule.start({
        lang: VOICE_LANG,
        interimResults: false,
        continuous: false,
      });
      // Watchdog: if a session never produces a single event (same hang as
      // continuous:true above, just in case it recurs some other way),
      // force it to restart instead of silently listening forever.
      clearWatchdog();
      watchdogRef.current = setTimeout(() => {
        logDebug('⏱ watchdog: no events, restarting');
        try {
          ExpoSpeechRecognitionModule.abort();
        } catch {
          // ignore
        }
      }, 12000);
    } catch {
      // Will retry on the next 'end' cycle.
    }
  }, [clearWatchdog, logDebug]);

  const stopListening = useCallback(() => {
    if (!SUPPORTED) return;
    clearWatchdog();
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Already stopped — nothing to do.
    }
  }, [clearWatchdog]);

  // Request mic/speech permission once, the first time a shift starts, and
  // log what speech recognition services this device actually has — the
  // "service-not-allowed" error points at the backing service, not our own
  // app permission, so this tells us what's really available on-device.
  useEffect(() => {
    if (!SUPPORTED || !shiftActive || permissionRequestedRef.current) return;
    permissionRequestedRef.current = true;
    ExpoSpeechRecognitionModule.requestPermissionsAsync()
      .then((res) => logDebug(`🔑 permission: granted=${res.granted}`))
      .catch((err) => logDebug(`🔑 permission error: ${String(err)}`));
    try {
      const services = ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
      logDebug(`🧩 services: ${services.length ? services.join(', ') : '(none)'}`);
    } catch (err) {
      logDebug(`🧩 services error: ${String(err)}`);
    }
    try {
      const def = ExpoSpeechRecognitionModule.getDefaultRecognitionService();
      logDebug(`🧩 default: ${def.packageName || '(none)'}`);
    } catch (err) {
      logDebug(`🧩 default error: ${String(err)}`);
    }
  }, [shiftActive, logDebug]);

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

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    logDebug('▶️ start');
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    clearWatchdog();
    logDebug('⏹ end');
    // Android speech recognition sessions commonly end on their own (e.g. a
    // few seconds of silence) — restart automatically so listening is
    // effectively continuous for as long as the shift is active.
    if (shouldListenRef.current && !speakingRef.current) {
      setTimeout(() => startListening(), 300);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    clearWatchdog();
    logDebug(`❌ error: ${event.error} ${event.message || ''}`);
  });

  useSpeechRecognitionEvent('nomatch', () => {
    logDebug('🤷 nomatch');
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
    const transcript = event.results?.[0]?.transcript;
    logDebug(`💬 ${event.isFinal ? 'final' : 'interim'}: "${transcript || ''}"`);
    if (!event.isFinal || !transcript) return;
    handleTranscript(transcript);
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
    debugLog,
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
