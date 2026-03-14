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
        try {
            const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : {
                sound: true,
                vibration: true,
                music: true,
                lang: 'tr'
            };
        } catch (e) {
            console.error("StorageManager: getSettings failed", e);
            return { sound: true, vibration: true, lang: 'tr' };
        }
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
    bgMusic: null,
    audioInitialized: false,

    init: function () {
        if (this.audioInitialized) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Müzik elementini yapılandır
            this.bgMusic = new Audio('bg_music.mp3'); 
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.4;
            
            this.audioInitialized = true;
            this.initAppStateListener();
        } catch (e) {
            console.error("SoundManager: Init failed", e);
        }
    },

    initAppStateListener: function() {
        // Standart tarayıcı görünürlük (WebView dahil) dinleyicisi
        document.addEventListener('visibilitychange', () => {
            console.log('Document visibility changed. hidden:', document.hidden);
            
            if (document.hidden) {
                console.log("Uygulama arka plana geçti, müzik duraklatılıyor...");
                if (this.bgMusic) this.bgMusic.pause();
                if (this.audioCtx && this.audioCtx.state === 'running') {
                    this.audioCtx.suspend();
                }
            } else {
                console.log("Uygulama ön plana geçti, müzik devam ediyor...");
                const settings = StorageManager.getSettings();
                if (settings.music && this.bgMusic) {
                    this.bgMusic.play().catch(e => console.warn(e));
                }
                if (this.audioCtx && this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }
            }
        });

        // Capacitor App eklentisi yüklüyse (yedek olarak)
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            const { App } = window.Capacitor.Plugins;
            
            App.addListener('appStateChange', ({ isActive }) => {
                console.log('App state changed. isActive:', isActive);
                
                if (!isActive) {
                    if (this.bgMusic) this.bgMusic.pause();
                    if (this.audioCtx && this.audioCtx.state === 'running') {
                        this.audioCtx.suspend();
                    }
                } else {
                    const settings = StorageManager.getSettings();
                    if (settings.music && this.bgMusic) {
                        this.bgMusic.play().catch(e => console.warn(e));
                    }
                    if (this.audioCtx && this.audioCtx.state === 'suspended') {
                        this.audioCtx.resume();
                    }
                }
            });
        }
    },

    playMusic: function() {
        const settings = StorageManager.getSettings();
        if (!settings.music) return;
        
        if (!this.audioInitialized) this.init();
        
        if (this.bgMusic) {
            this.bgMusic.play().catch(e => {
                console.warn("Müzik ilk etkileşimden önce başlatılamadı:", e);
                // Kullanıcı ekrana dokunduğunda çalması için tek seferlik dinleyici
                const playOnInteract = () => {
                    this.bgMusic.play();
                    window.removeEventListener('click', playOnInteract);
                    window.removeEventListener('touchstart', playOnInteract);
                };
                window.addEventListener('click', playOnInteract);
                window.addEventListener('touchstart', playOnInteract);
            });
        }
    },

    stopMusic: function() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
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
