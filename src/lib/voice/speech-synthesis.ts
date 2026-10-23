/**
 * Yo Siri — Phase 3: Speech Synthesis Service
 * Native Web Speech Synthesis API (window.speechSynthesis)
 */

import { SpeechVoiceOption } from './types';

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export interface SpeechSynthesisHandlers {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class BrowserSpeechSynthesizer {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechVoiceOption[] = [];
  private selectedVoiceURI: string | null = null;
  private speechRate = 1.0;
  private speechPitch = 1.0;
  private isSpeakingActive = false;
  private isPausedActive = false;

  constructor() {
    if (isSpeechSynthesisSupported()) {
      this.loadVoices();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  public loadVoices(): SpeechVoiceOption[] {
    if (!isSpeechSynthesisSupported()) return [];

    const rawVoices = window.speechSynthesis.getVoices();
    // Prioritize English voices since Yo Siri focuses on spoken English
    this.voices = rawVoices.map((v) => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      isDefault: v.default,
      isLocalService: v.localService,
    }));

    return this.voices;
  }

  public getEnglishVoices(): SpeechVoiceOption[] {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    const english = this.voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    return english.length > 0 ? english : this.voices;
  }

  public setVoiceURI(uri: string | null): void {
    this.selectedVoiceURI = uri;
  }

  public setRate(rate: number): void {
    this.speechRate = Math.min(2.0, Math.max(0.5, rate));
  }

  public setPitch(pitch: number): void {
    this.speechPitch = Math.min(1.5, Math.max(0.7, pitch));
  }

  public isSupported(): boolean {
    return isSpeechSynthesisSupported();
  }

  public isSpeaking(): boolean {
    return this.isSpeakingActive && typeof window !== 'undefined' && window.speechSynthesis?.speaking;
  }

  public isPaused(): boolean {
    return this.isPausedActive;
  }

  /**
   * Speak text aloud. Automatically cancels any active speech first to prevent overlapping speech.
   */
  public speak(text: string, handlers?: SpeechSynthesisHandlers): boolean {
    if (!this.isSupported() || !text.trim()) {
      handlers?.onEnd?.();
      return false;
    }

    try {
      this.cancel(); // Stop any overlapping audio immediately

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;

      // Select chosen voice or natural English voice
      const allVoices = window.speechSynthesis.getVoices();
      if (this.selectedVoiceURI) {
        const found = allVoices.find((v) => v.voiceURI === this.selectedVoiceURI);
        if (found) utterance.voice = found;
      } else {
        // Prefer natural / google / apple english voices
        const naturalEn = allVoices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
        ) || allVoices.find((v) => v.lang.startsWith('en'));

        if (naturalEn) utterance.voice = naturalEn;
      }

      utterance.onstart = () => {
        this.isSpeakingActive = true;
        this.isPausedActive = false;
        handlers?.onStart?.();
      };

      utterance.onpause = () => {
        this.isPausedActive = true;
        handlers?.onPause?.();
      };

      utterance.onresume = () => {
        this.isPausedActive = false;
        handlers?.onResume?.();
      };

      utterance.onend = () => {
        this.isSpeakingActive = false;
        this.isPausedActive = false;
        this.currentUtterance = null;
        handlers?.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.isSpeakingActive = false;
        this.isPausedActive = false;
        this.currentUtterance = null;
        // Interrupted/cancelled is normal when user interrupts
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          handlers?.onError?.(`Speech synthesis error: ${e.error}`);
        } else {
          handlers?.onEnd?.();
        }
      };

      // Keep reference to prevent GC bug in Chromium
      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err: unknown) {
      this.isSpeakingActive = false;
      this.isPausedActive = false;
      this.currentUtterance = null;
      handlers?.onError?.(`Failed to initiate speech: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  /**
   * Pause speech synthesis where supported
   */
  public pause(): void {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.isPausedActive = true;
    }
  }

  /**
   * Resume paused speech synthesis
   */
  public resume(): void {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.isPausedActive = false;
    }
  }

  /**
   * Cancel and halt all speech immediately
   */
  public cancel(): void {
    if (isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isSpeakingActive = false;
    this.isPausedActive = false;
    this.currentUtterance = null;
  }
}

export const speechSynthesizer = new BrowserSpeechSynthesizer();

