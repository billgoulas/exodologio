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
  /** TEMPORARY: static one-time info (available services, default service)
   * that must stay visible rather than scroll off with the rolling log. */
  debugServiceInfo: string[];
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
  const [debugServiceInfo, setDebugServiceInfo] = useState<string[]>([]);

  const logDebug = useCallback((line: string) => {
    setDebugLog((prev) => [line, ...prev].slice(0, 6));
  }, []);

  const logServiceInfo = useCallback((line: string) => {
    setDebugServiceInfo((prev) => [...prev, line]);
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
      // Forcing androidRecognitionServicePackage to the on-device
      // "com.google.android.as" service failed with language-not-supported
      // (no Greek pack installed there) on a real test device — leaving the
      // package unset (system default) instead produced a clean
      // start/end/no-speech cycle, so the default IS a working recognizer
      // for this device; the earlier failures look like timing, not a
      // broken backend.
      ExpoSpeechRecognitionModule.start({
        lang: VOICE_LANG,
        // This device's recognizer often reports the correct word as an
        // interim result and then ends the session in "nomatch" without
        // ever sending a final one — with interimResults:false we were
        // silently discarding a transcript we'd already correctly heard.
        // Turn interim results on and act on them for the short keyword
        // steps (trigger/method/receipt); only the amount step still waits
        // for a final result, since numbers are more likely to still be
        // mid-utterance in an interim callback.
        interimResults: true,
        continuous: false,
        // EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS is NOT "wait up to this
        // long for speech" — it's "never finalize a result before this much
        // time has passed", even if the user already said a single short
        // word. The previous 15000ms value here was almost certainly the
        // cause of the "it hears me but with a huge delay" reports: a
        // 1-word trigger like "εγγραφή" would get stuck for 15 real
        // seconds before the recognizer was even allowed to finish. Keep
        // this short so short utterances finalize quickly, while still
        // giving a little silence tolerance so a word isn't cut off
        // mid-syllable.
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 1500,
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1200,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1200,
        },
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
      }, 20000);
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
      .then((res) => logServiceInfo(`🔑 permission: granted=${res.granted}`))
      .catch((err) => logServiceInfo(`🔑 permission error: ${String(err)}`));
    try {
      const services = ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
      logServiceInfo(`🧩 services: ${services.length ? services.join(', ') : '(none)'}`);
    } catch (err) {
      logServiceInfo(`🧩 services error: ${String(err)}`);
    }
    try {
      const def = ExpoSpeechRecognitionModule.getDefaultRecognitionService();
      logServiceInfo(`🧩 default: ${def.packageName || '(none)'}`);
    } catch (err) {
      logServiceInfo(`🧩 default error: ${String(err)}`);
    }
  }, [shiftActive, logServiceInfo]);

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
      setTimeout(() => startListening(), 600);
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
    if (!transcript) return;
    // Only the amount step requires a final result — a number is more
    // likely to still be mid-utterance in an interim callback. The
    // trigger/method/receipt steps act on interim results too, since a
    // matched keyword immediately advances the step (stopping listening
    // first), so a stale interim arriving after that has no effect.
    if (!event.isFinal && stepRef.current === 'amount') return;
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
    debugServiceInfo,
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
