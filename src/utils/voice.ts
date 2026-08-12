import { AppSettings } from '../types';

class VoiceService {
  private synth: SpeechSynthesis | null = null;
  private indonesianVoice: SpeechSynthesisVoice | null = null;
  private lastSpeechTime: number = 0;
  private isSpeaking: boolean = false;
  private speechQueue: string[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize Indonesian voice
    const indonesian = voices.find(
      (v) => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
    );
    if (indonesian) {
      this.indonesianVoice = indonesian;
    } else if (voices.length > 0) {
      // Fallback
      this.indonesianVoice = voices[0];
    }
  }

  public speak(text: string, settings: AppSettings, priority: boolean = false): void {
    if (!settings.voiceEnabled || !this.synth) return;

    // Clean text: remove hashtag (#), numeric IDs (#001 or 001), percentages, and clean spaces
    const cleanText = text
      .replace(/#\d+/gi, '')
      .replace(/#/g, '')
      .replace(/\b\d{3}\b/g, '')
      .replace(/\(\d+%\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const now = Date.now();
    const cooldownMs = settings.voiceCooldownSec * 1000;

    // Check cooldown unless priority event
    if (!priority && now - this.lastSpeechTime < cooldownMs) {
      return;
    }

    if (this.synth.speaking && !priority) {
      return;
    }

    if (priority) {
      this.synth.cancel(); // Stop current speech if priority
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.indonesianVoice) {
      utterance.voice = this.indonesianVoice;
      utterance.lang = 'id-ID';
    } else {
      utterance.lang = 'id-ID';
    }

    utterance.rate = settings.voiceSpeed || 1.0;
    utterance.pitch = settings.voicePitch || 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.lastSpeechTime = Date.now();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e?.error || e?.type || 'Speech error');
      this.isSpeaking = false;
    };

    this.synth.speak(utterance);
  }

  public speakEvent(
    eventMessage: string,
    settings: AppSettings,
    isPriority: boolean = false
  ): void {
    this.speak(eventMessage, settings, isPriority);
  }

  public testSpeech(settings: AppSettings): void {
    const testPhrase = 'Sistem notifikasi suara AI Motion Object Sensor siap digunakan.';
    this.speak(testPhrase, { ...settings, voiceEnabled: true }, true);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}

export const voiceService = new VoiceService();
