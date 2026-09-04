import { Howl } from 'howler';

/**
 * Notification Sound Service using Howler.js
 *
 * Provides rich, reliable notification sounds with volume control,
 * cooldown prevention (no spam), and graceful fallback.
 */

// Notification sound - a pleasant two-tone chime generated as a base64 WAV
// This ensures the sound works without needing an external audio file
let notificationSound: Howl | null = null;
let lastPlayedAt = 0;
const COOLDOWN_MS = 1500; // Prevent sound spam

/**
 * Generate a simple notification chime using Web Audio API and return as a Blob URL.
 */
function generateChimeUrl(): string {
    const sampleRate = 44100;
    const duration = 0.5;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    // Two-tone chime: E5 (659Hz) → A5 (880Hz)
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 6); // Quick decay

        // First tone (E5)
        const tone1 = Math.sin(2 * Math.PI * 659.25 * t) * 0.3;
        // Second tone (A5), delayed slightly
        const tone2 = t > 0.08 ? Math.sin(2 * Math.PI * 880.0 * (t - 0.08)) * 0.25 : 0;
        // Soft harmonic
        const harmonic = Math.sin(2 * Math.PI * 1318.5 * t) * 0.08;

        buffer[i] = (tone1 + tone2 + harmonic) * envelope;
    }

    // Encode as WAV
    const wavBuffer = encodeWAV(buffer, sampleRate);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
}

/**
 * Encode Float32Array PCM samples into a WAV ArrayBuffer.
 */
function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = samples.length * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
    }

    return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

let scanSuccessSound: Howl | null = null;
let scanErrorSound: Howl | null = null;
let scanLateSound: Howl | null = null;
let lastScanPlayedAt = 0;
const SCAN_COOLDOWN_MS = 250;

/**
 * Generate a crisp, high-pitch scanner confirmation beep (C6 -> E6).
 */
function generateScanSuccessUrl(): string {
    const sampleRate = 44100;
    const duration = 0.22;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 12); // Snappy decay

        // Short dual tone beep
        const tone1 = Math.sin(2 * Math.PI * 1046.5 * t) * 0.35; // C6
        const tone2 = t > 0.05 ? Math.sin(2 * Math.PI * 1567.98 * (t - 0.05)) * 0.4 : 0; // G6
        const overtone = Math.sin(2 * Math.PI * 2093.0 * t) * 0.1;

        buffer[i] = (tone1 + tone2 + overtone) * envelope;
    }

    const wavBuffer = encodeWAV(buffer, sampleRate);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
}

/**
 * Generate a low error buzz tone.
 */
function generateScanErrorUrl(): string {
    const sampleRate = 44100;
    const duration = 0.28;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 5);

        // Low buzz (combination of square-ish 220Hz and 180Hz)
        const tone1 = Math.sin(2 * Math.PI * 220.0 * t) * 0.3;
        const tone2 = Math.sin(2 * Math.PI * 440.0 * t) * 0.15;
        const sub = Math.sin(2 * Math.PI * 110.0 * t) * 0.1;

        buffer[i] = (tone1 + tone2 + sub) * envelope;
    }

    const wavBuffer = encodeWAV(buffer, sampleRate);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
}

/**
 * Generate a distinct chime for late scan.
 */
function generateScanLateUrl(): string {
    const sampleRate = 44100;
    const duration = 0.35;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 7);

        // Descending warning chime (880Hz -> 659Hz)
        const tone1 = Math.sin(2 * Math.PI * 880.0 * t) * 0.3;
        const tone2 = t > 0.08 ? Math.sin(2 * Math.PI * 659.25 * (t - 0.08)) * 0.3 : 0;

        buffer[i] = (tone1 + tone2) * envelope;
    }

    const wavBuffer = encodeWAV(buffer, sampleRate);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
}

/**
 * Get or create the Howl instance for notification sounds.
 */
function getNotificationSound(): Howl {
    if (!notificationSound) {
        const chimeUrl = generateChimeUrl();
        notificationSound = new Howl({
            src: [chimeUrl],
            format: ['wav'],
            volume: 0.5,
            preload: true,
        });
    }
    return notificationSound;
}

function getScanSuccessSound(): Howl {
    if (!scanSuccessSound) {
        const url = generateScanSuccessUrl();
        scanSuccessSound = new Howl({
            src: [url],
            format: ['wav'],
            volume: 0.75,
            preload: true,
        });
    }
    return scanSuccessSound;
}

function getScanErrorSound(): Howl {
    if (!scanErrorSound) {
        const url = generateScanErrorUrl();
        scanErrorSound = new Howl({
            src: [url],
            format: ['wav'],
            volume: 0.65,
            preload: true,
        });
    }
    return scanErrorSound;
}

function getScanLateSound(): Howl {
    if (!scanLateSound) {
        const url = generateScanLateUrl();
        scanLateSound = new Howl({
            src: [url],
            format: ['wav'],
            volume: 0.7,
            preload: true,
        });
    }
    return scanLateSound;
}

/**
 * Play sound when student attendance scan is successful.
 */
export function playScanSuccessSound(): void {
    const now = Date.now();
    if (now - lastScanPlayedAt < SCAN_COOLDOWN_MS) return;
    lastScanPlayedAt = now;

    try {
        const sound = getScanSuccessSound();
        sound.play();
    } catch (e) {
        console.warn('[ScannerSound] Failed to play success sound:', e);
    }
}

/**
 * Play sound when student attendance scan is rejected or invalid.
 */
export function playScanErrorSound(): void {
    const now = Date.now();
    if (now - lastScanPlayedAt < SCAN_COOLDOWN_MS) return;
    lastScanPlayedAt = now;

    try {
        const sound = getScanErrorSound();
        sound.play();
    } catch (e) {
        console.warn('[ScannerSound] Failed to play error sound:', e);
    }
}

/**
 * Play sound when student attendance scan is recorded as late.
 */
export function playScanLateSound(): void {
    const now = Date.now();
    if (now - lastScanPlayedAt < SCAN_COOLDOWN_MS) return;
    lastScanPlayedAt = now;

    try {
        const sound = getScanLateSound();
        sound.play();
    } catch (e) {
        console.warn('[ScannerSound] Failed to play late sound:', e);
    }
}

/**
 * Play the notification sound.
 * Respects cooldown to prevent rapid-fire spam.
 */
export function playNotificationSound(): void {
    const now = Date.now();
    if (now - lastPlayedAt < COOLDOWN_MS) {
        return; // Skip if within cooldown period
    }
    lastPlayedAt = now;

    try {
        const sound = getNotificationSound();
        sound.play();
    } catch (e) {
        console.warn('[NotificationSound] Failed to play:', e);
    }
}

/**
 * Set the notification sound volume (0.0 - 1.0).
 */
export function setNotificationVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    const sound = getNotificationSound();
    sound.volume(clamped);
}

/**
 * Mute / unmute notification sounds.
 */
export function muteNotificationSound(muted: boolean): void {
    const sound = getNotificationSound();
    sound.mute(muted);
}

