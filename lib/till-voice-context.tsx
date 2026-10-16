import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useAppContext } from './app-context';
import { parseSpokenAmount, normalizeGreek } from './greek-number-parser';
import { TillMethod } from './types';

type VoiceStep = 'idle' | 'trigger' | 'method' | 'appMethod' | 'receipt' | 'amount';

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
  // Tracks the most recent amount parsed during the current amount-step
  // session, so it can be read back to the user for confirmation once the
  // recognizer session ends (see the 'end' handler below). Cleared once
  // read back, or once the user confirms with "Έντερ".
  const lastSpokenAmountRef = useRef<string | null>(null);
  const permissionRequestedRef = useRef(false);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Fires a short time after the last successfully-parsed amount update,
  // forcing the recognizer session to end right away instead of waiting on
  // Android's own silence/minimum-length timers (see the amount branch of
  // handleTranscript below for why this cuts the readback delay a lot).
  const amountSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const clearAmountSettleTimer = useCallback(() => {
    if (amountSettleTimerRef.current) {
      clearTimeout(amountSettleTimerRef.current);
      amountSettleTimerRef.current = null;
    }
  }, []);

  const setStep = useCallback((next: VoiceStep) => {
    stepRef.current = next;
    setStepState(next);
  }, []);

  const startListening = useCallback(() => {
    if (!SUPPORTED || !shouldListenRef.current || speakingRef.current) return;
    clearAmountSettleTimer();
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
        // This device's recognizer often reports the correct word(s) as an
        // interim result and then ends the session in "nomatch" without
        // ever sending a final one — with interimResults:false we were
        // silently discarding transcripts we'd already correctly heard.
        // Interim results are now acted on everywhere, including amount
        // entry (see the 'result' handler below).
        interimResults: true,
        continuous: false,
        // The rapid restart-on-end loop now needed for responsiveness
        // means the (system, not ours) start/end recognizer beep fires
        // very often while idle, which the user reported as an annoying
        // constant sound. VOICE_SEARCH_HANDS_FREE is the Android intent
        // action meant for exactly this kind of always-listening, no-UI
        // voice flow, so it may suppress those UI/attention beeps where
        // the default RECOGNIZE_SPEECH action does not.
        androidIntent: 'android.speech.action.VOICE_SEARCH_HANDS_FREE',
        // EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS is a floor on how long
        // Android will keep a session open before it's allowed to decide
        // "no speech" and end it on its own — it does NOT delay reacting
        // to real speech. That only used to be true back when we only
        // acted on *final* results (gated behind this same floor); now
        // that trigger/method/receipt act on *interim* results and call
        // our own stopListening() the instant a keyword is heard, a real
        // match is never held up by this value.
        // That means it's safe to raise it a lot for the idle waiting
        // steps, and doing so directly fixes the "constant beep" problem:
        // every session that ends on its own (e.g. "no speech" while
        // nobody is talking) triggers Android's start/end UI sound on
        // restart, and at 1500ms minimum that was happening every few
        // seconds while just waiting. 10000ms means roughly 1/6th as many
        // idle restarts — and so 1/6th as many beeps — with no added lag
        // for an actual "εγγραφή"/method/receipt answer.
        // The amount step keeps its own short, snappy settings: the user
        // asked for the spoken amount to be read back immediately with no
        // perceptible delay, and that readback fires off the recognizer's
        // own 'end' event, so a long floor there would reintroduce exactly
        // the lag that was fixed earlier.
        androidIntentOptions:
          stepRef.current === 'amount'
            ? {
                EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 1500,
                EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 500,
                EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 500,
              }
            : {
                EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 10000,
                EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1200,
                EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1200,
              },
      });
      // Watchdog: if a session never produces a single event (same hang as
      // continuous:true above, just in case it recurs some other way),
      // force it to restart instead of silently listening forever.
      clearWatchdog();
      watchdogRef.current = setTimeout(() => {
        try {
          ExpoSpeechRecognitionModule.abort();
        } catch {
          // ignore
        }
      }, 20000);
    } catch {
      // Will retry on the next 'end' cycle.
    }
  }, [clearWatchdog, clearAmountSettleTimer]);

  const stopListening = useCallback(() => {
    if (!SUPPORTED) return;
    clearWatchdog();
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Already stopped — nothing to do.
    }
  }, [clearWatchdog]);

  // Speaks a prompt, then re-arms the microphone. Speech.speak's onDone can
  // fire slightly before the audio has actually finished coming out of the
  // speaker — starting to listen immediately after let the device pick up
  // the tail of its own voice (e.g. "...πείτε Μετρητά.") and treat the
  // last word as the user's answer, instantly skipping ahead a step (this
  // is what caused saying "Εφαρμογή" to also immediately open the receipt
  // screen, as if "Μετρητά" had already been answered too). A short pause
  // after speaking lets any residual audio clear before the mic re-arms.
  const speakThenListen = useCallback(
    async (text: string) => {
      speakingRef.current = true;
      setSpeaking(true);
      await speak(text);
      speakingRef.current = false;
      setSpeaking(false);
      await new Promise((resolve) => setTimeout(resolve, 500));
      startListening();
    },
    [startListening]
  );

  // Request mic/speech permission once, the first time a shift starts.
  useEffect(() => {
    if (!SUPPORTED || !shiftActive || permissionRequestedRef.current) return;
    permissionRequestedRef.current = true;
    ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => {
      // If permission is denied, voice commands simply won't trigger;
      // touch-based entry still works.
    });
  }, [shiftActive]);

  // The whole voice flow lives and dies with the shift. On start, announce
  // the trigger word once before listening begins — this effect only
  // re-runs when shiftActive actually flips, so it naturally fires once
  // per shift start, not on every render.
  useEffect(() => {
    if (!SUPPORTED) return;
    if (shiftActive) {
      shouldListenRef.current = true;
      setStep('trigger');
      speakThenListen('Αν θέλετε να κάνετε καταχώρηση μίας νέας εγγραφής πείτε εγγραφή.');
    } else {
      shouldListenRef.current = false;
      setStep('idle');
      stopListening();
    }
  }, [shiftActive, setStep, stopListening, speakThenListen]);

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    clearWatchdog();
    clearAmountSettleTimer();
    if (!shouldListenRef.current || speakingRef.current) return;

    // The recognizer session just ended (e.g. the user paused after
    // saying the amount). If we're still on the amount step and captured
    // a value during that session, read it back so the user can confirm
    // it was heard correctly before committing it — rather than
    // restarting listening silently.
    if (stepRef.current === 'amount' && lastSpokenAmountRef.current) {
      const amount = lastSpokenAmountRef.current;
      lastSpokenAmountRef.current = null;
      speakThenListen(`Το ποσό που καταχωρήσατε είναι ${amount} ευρώ. Για επιβεβαίωση πείτε Έντερ.`);
      return;
    }

    // Android speech recognition sessions commonly end on their own (e.g. a
    // few seconds of silence) — restart automatically so listening is
    // effectively continuous for as long as the shift is active.
    setTimeout(() => startListening(), 600);
  });

  useSpeechRecognitionEvent('error', () => {
    clearWatchdog();
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
        // "POS" is spelled out as the Greek letter names, accented
        // ("πί όου Ες") so the TTS engine stresses the right syllables —
        // Greek TTS can't read the Latin "POS" at all, and the unaccented
        // fused spelling ("πιοουες") came out with the wrong stress. This
        // only affects what's spoken; the on-screen button still reads
        // "POS". This first screen's three options are Εφαρμογή, Μετρητά,
        // POS — "Εφαρμογή" is not itself a final payment method, it's a
        // category that opens a second screen (see the 'method' branch
        // below) asking how that app order was actually settled.
        await speakThenListen(
          'Για πληρωμή με εφαρμογή πείτε Εφαρμογή, για πληρωμή με μετρητά πείτε Μετρητά, για πληρωμή με πί όου Ες πείτε πί όου Ες.'
        );
        return;
      }

      if (currentStep === 'method') {
        let method: TillMethod | null = null;
        if (words.some((w) => w.startsWith('εφαρμογ'))) method = 'app';
        else if (words.some((w) => w.startsWith('μετρητ'))) method = 'cash';
        // The app itself now asks for this option by saying the accented
        // Greek letter names ("πί όου Ες"), since TTS can't pronounce the
        // Latin "POS" — so the user's reply is expected to echo that
        // (normalizeGreek strips the accents before this check runs). Also
        // accept "POS"/"ΠΟΣ" as a single word and the fused spelling, in
        // case the recognizer transcribes it differently.
        else if (
          words.includes('pos') ||
          words.includes('ποσ') ||
          words.some((w) => w.startsWith('πιοουες') || w.startsWith('πιουες')) ||
          (words.includes('πι') && words.includes('ες'))
        )
          method = 'appointment';
        if (!method) return;

        // "Εφαρμογή" opens a second screen asking how the app order was
        // actually settled — it never gets recorded as the final method
        // itself. "Μετρητά"/"POS" chosen directly here ARE final.
        if (method === 'app') {
          stopListening();
          router.push('/till-app-method');
          setStep('appMethod');
          await speakThenListen(
            'Για πληρωμή μέσα στην εφαρμογή πείτε APP, για πληρωμή με πί όου Ες πείτε πί όου Ες, για πληρωμή με μετρητά πείτε Μετρητά.'
          );
          return;
        }

        pendingMethodRef.current = method;
        stopListening();
        router.push({ pathname: '/till-receipt', params: { method } });
        setStep('receipt');
        await speakThenListen('Με απόδειξη ή χωρίς απόδειξη;');
        return;
      }

      if (currentStep === 'appMethod') {
        let method: TillMethod | null = null;
        if (words.some((w) => w.startsWith('μετρητ'))) method = 'cash';
        else if (
          words.includes('pos') ||
          words.includes('ποσ') ||
          words.some((w) => w.startsWith('πιοουες') || w.startsWith('πιουες')) ||
          (words.includes('πι') && words.includes('ες'))
        )
          method = 'appointment';
        // This screen's third option is announced and answered as "APP"
        // only — NOT the "εφαρμογ" stem. That stem is what the FIRST
        // screen matches to get here in the first place, and recognizer
        // sessions sometimes deliver one more (stale, already-finalizing)
        // "Εφαρμογή" result right after we've already transitioned to
        // this step — if this branch also accepted "εφαρμογ", that stale
        // leftover event would immediately match here too and skip ahead
        // to the receipt screen on its own, which is exactly the bug
        // where saying "Εφαρμογή" opened both this screen and the receipt
        // screen at once.
        else if (words.includes('app')) method = 'app';
        if (!method) return;

        pendingMethodRef.current = method;
        stopListening();
        router.push({ pathname: '/till-receipt', params: { method } });
        setStep('receipt');
        await speakThenListen('Με απόδειξη ή χωρίς απόδειξη;');
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
        await speakThenListen('Πείτε το ποσό συναλλαγής.');
        return;
      }

      if (currentStep === 'amount') {
        if (words.some((w) => w.startsWith('εντερ')) || words.includes('enter')) {
          clearAmountSettleTimer();
          lastSpokenAmountRef.current = null;
          setVoiceConfirmNonce((n) => n + 1);
          return;
        }
        const parsed = parseSpokenAmount(rawTranscript);
        if (parsed) {
          setVoiceAmountText(parsed);
          lastSpokenAmountRef.current = parsed;
          // Don't wait for Android's own silence/minimum-length timers to
          // decide the utterance is complete (that floor is what was
          // making the "what did I hear" readback feel so slow) — force
          // the session to end shortly after the last update instead, so
          // the readback fires almost immediately once the user stops
          // speaking the number. Each new parsed update pushes this back,
          // so it only fires once speech has actually paused.
          clearAmountSettleTimer();
          amountSettleTimerRef.current = setTimeout(() => {
            stopListening();
          }, 400);
        }
      }
    },
    [setStep, speakThenListen, stopListening, clearAmountSettleTimer]
  );

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (!transcript) return;
    // This device's recognizer rarely sends a final result at all (most
    // sessions end in "nomatch" after only interim callbacks), so gating
    // the amount step on isFinal left it almost never updating. Act on
    // every result everywhere instead. For amount, Android's interim
    // transcript for a one-shot session is cumulative ("τέσσερα" →
    // "τέσσερα κόμμα" → "τέσσερα κόμμα επτά"), so re-parsing it on each
    // callback naturally updates the keypad field as the user speaks,
    // digit by digit — exactly like typing it live. The actual entry is
    // only ever committed on the explicit "Έντερ" word, so a half-spoken
    // or momentarily-wrong partial amount on screen is harmless.
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
