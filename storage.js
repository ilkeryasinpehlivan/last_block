/**
 * storage.js
 * Handles game data persistence and settings using localStorage.
 */

const STORAGE_KEYS = {
    HIGH_SCORE: 'neon_puzzle_high_score',
    SETTINGS: 'neon_puzzle_settings'
};

const StorageManager = {
    /**
     * Get the current high score.
     * @returns {number}
     */
    getHighScore: function () {
        const score = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
        return score ? parseInt(score, 10) : 0;
    },

    /**
     * Save a new high score if it's higher than the existing one.
     * @param {number} score 
     */
    saveHighScore: function (score) {
        const currentHigh = this.getHighScore();
        if (score > currentHigh) {
            localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score);
            return true;
        }
        return false;
    },

    /**
     * Get user settings (sound, vibration).
     * @returns {Object}
     */
    getSettings: function () {
        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return settings ? JSON.parse(settings) : {
            sound: true,
            vibration: true,
            lang: 'tr'
        };
    },

    /**
     * Save user settings.
     * @param {Object} settings 
     */
    saveSettings: function (settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
};

/**
 * Simple Synth Sound Manager
 */
const SoundManager = {
    audioCtx: null,

    init: function () {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    },

    playMatch: function () {
        if (!StorageManager.getSettings().sound) return;
        this._beep(440, 100, 'sine');
        setTimeout(() => this._beep(880, 100, 'sine'), 50);
    },

    playClick: function () {
        if (!StorageManager.getSettings().sound) return;
        this._beep(220, 50, 'square');
    },

    _beep: function (freq, duration, type) {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration / 1000);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration / 1000);
    }
};

window.StorageManager = StorageManager;
window.SoundManager = SoundManager;
