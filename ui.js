/**
 * ui.js (Updated for Tetromino Pivot)
 */

const UI = {
    screens: {},
    currentScreen: 'menu-screen',
    slots: [],

    translations: {
        tr: {
            start: "OYUNA BAŞLA",
            settings: "AYARLAR",
            highScore: "EN YÜKSEK SKOR",
            score: "SKOR",
            time: "SÜRE",
            gameOver: "EYVAH!",
            restart: "YENİDEN BAŞLA",
            home: "ANA MENÜ",
            watchAd: "🎥 REKLAM İZLE VE DEVAM ET",
            sound: "SES",
            vibration: "TİTREŞİM",
            lang: "DİL",
            back: "GERİ",
            rotateHint: "Dokunarak Döndür • Sürükleyerek Yerleştir",
            exitConfirm: "Oyundan çıkmak istiyor musunuz?"
        },
        en: {
            start: "START GAME",
            settings: "SETTINGS",
            highScore: "HIGH SCORE",
            score: "SCORE",
            time: "TIME",
            gameOver: "OH NO!",
            restart: "RESTART",
            home: "MAIN MENU",
            watchAd: "🎥 WATCH AD TO CONTINUE",
            sound: "SOUND",
            vibration: "VIBRATION",
            lang: "LANGUAGE",
            back: "BACK",
            rotateHint: "Tap to Rotate • Drag to Place",
            exitConfirm: "Do you want to exit the game?"
        }
    },

    init: function () {
        console.log("UI: Initializing...");
        try {
            this.screens = {
                menu: document.getElementById('menu-screen'),
                game: document.getElementById('game-screen'),
                gameOver: document.getElementById('game-over-screen'),
                settings: document.getElementById('settings-screen')
            };

            this.slots = Array.from(document.querySelectorAll('.inventory-slot'));

            this.setupEventListeners();
            this.updateHighScoreDisplay();
            this.loadSettingsToUI();
            this.updateLanguage(); // Apply initial language
            this.setupAndroidBackButton();

            // Explicitly show menu
            this.showScreen('menu');

            // Remove startup guard
            const guard = document.getElementById('startup-guard');
            if (guard) guard.style.display = 'none';

            console.log("UI: Initialization Success");
        } catch (e) {
            console.error("UI: Initialization Failed", e);
        }
    },

    updateLanguage: function () {
        const lang = StorageManager.getSettings().lang || 'tr';
        const t = this.translations[lang];

        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        const setSelectorText = (selector, text) => {
            const el = document.querySelector(selector);
            if (el) el.textContent = text;
        };

        // Update UI Text
        setText('start-btn', t.start);
        setText('settings-btn', t.settings);
        setSelectorText('.high-score-label', t.highScore);

        // Game Screen
        setSelectorText('#game-screen .stat-box:nth-child(1) .stat-label', t.score);
        setSelectorText('#game-screen .stat-box:nth-child(2) .stat-label', t.time);
        setSelectorText('.rotation-hint span', t.rotateHint);

        // Game Over
        setSelectorText('#game-over-screen h2', t.gameOver);
        const finalScoreLabel = document.querySelector('#game-over-screen .final-stats p:nth-child(1)');
        if (finalScoreLabel) finalScoreLabel.innerHTML = `${t.score}: <span id="final-score">0</span>`;

        const finalHighLabel = document.querySelector('#game-over-screen .final-stats p:nth-child(2)');
        if (finalHighLabel) finalHighLabel.innerHTML = `${t.highScore}: <span id="final-high-score">0</span>`;

        setText('watch-ad-btn', t.watchAd);
        setText('restart-btn', t.restart);
        setText('home-btn', t.home);

        // Settings
        setSelectorText('#settings-screen h2', t.settings);
        setText('label-lang', t.lang);
        setText('label-sound', t.sound);
        setText('label-vibe', t.vibration);
        setText('settings-close-btn', t.back);

        // Active Button States
        const trBtn = document.getElementById('lang-tr-btn');
        const enBtn = document.getElementById('lang-en-btn');
        if (trBtn) trBtn.classList.toggle('active', lang === 'tr');
        if (enBtn) enBtn.classList.toggle('active', lang === 'en');
    },

    setupAndroidBackButton: function () {
        document.addEventListener("backbutton", (e) => {
            e.preventDefault();
            this.handleBackButton();
        }, false);
        window.onpopstate = () => this.handleBackButton();
    },

    handleBackButton: function () {
        const lang = StorageManager.getSettings().lang || 'tr';
        const t = this.translations[lang];

        if (this.currentScreen === 'game') {
            if (confirm(t.exitConfirm)) this.showScreen('menu');
        } else if (this.currentScreen !== 'menu') {
            this.showScreen('menu');
        }
    },

    setupEventListeners: function () {
        const addSafeListener = (id, event, cb) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, cb);
        };

        addSafeListener('start-btn', 'click', () => {
            SoundManager.playClick();
            this.showScreen('game');
            Game.start();
            Game.resize();
        });

        addSafeListener('settings-btn', 'click', () => {
            SoundManager.playClick();
            this.showScreen('settings');
        });

        addSafeListener('settings-close-btn', 'click', () => {
            SoundManager.playClick();
            this.showScreen('menu');
        });

        addSafeListener('restart-btn', 'click', () => {
            SoundManager.playClick();
            Game.start();
            this.showScreen('game');
        });

        addSafeListener('home-btn', 'click', () => {
            SoundManager.playClick();
            this.showScreen('menu');
            this.updateHighScoreDisplay();
        });

        addSafeListener('watch-ad-btn', 'click', () => {
            SoundManager.playClick();
            this.handleRewardedAd();
        });

        addSafeListener('lang-tr-btn', 'click', () => {
            const settings = StorageManager.getSettings();
            settings.lang = 'tr';
            StorageManager.saveSettings(settings);
            this.updateLanguage();
            SoundManager.playClick();
        });

        addSafeListener('lang-en-btn', 'click', () => {
            const settings = StorageManager.getSettings();
            settings.lang = 'en';
            StorageManager.saveSettings(settings);
            this.updateLanguage();
            SoundManager.playClick();
        });

        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                const settings = StorageManager.getSettings();
                settings.sound = e.target.checked;
                StorageManager.saveSettings(settings);
            });
        }

        const vibeToggle = document.getElementById('vibe-toggle');
        if (vibeToggle) {
            vibeToggle.addEventListener('change', (e) => {
                const settings = StorageManager.getSettings();
                settings.vibration = e.target.checked;
                StorageManager.saveSettings(settings);
            });
        }
    },

    showScreen: function (screenKey) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        const target = this.screens[screenKey];
        if (target) {
            target.classList.add('active');
            this.currentScreen = screenKey;

            // Critical: If showing game, sync the canvas size
            if (screenKey === 'game' && window.Game) {
                window.Game.resize();
            }
        }
    },

    updateScore: function (score) {
        document.getElementById('current-score').textContent = score;
    },

    updateTimer: function (minutes, seconds) {
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');
        document.getElementById('game-timer').textContent = `${m}:${s}`;
    },

    showGameOver: function (finalScore) {
        const highScore = StorageManager.getHighScore();
        const isNewHigh = StorageManager.saveHighScore(finalScore);
        document.getElementById('final-score').textContent = finalScore;
        document.getElementById('final-high-score').textContent = isNewHigh ? finalScore : highScore;
        this.showScreen('gameOver');
    },

    updateHighScoreDisplay: function () {
        document.getElementById('menu-high-score').textContent = StorageManager.getHighScore();
    },

    loadSettingsToUI: function () {
        try {
            const settings = StorageManager.getSettings();
            const soundToggle = document.getElementById('sound-toggle');
            if (soundToggle) soundToggle.checked = settings.sound;

            const vibeToggle = document.getElementById('vibe-toggle');
            if (vibeToggle) vibeToggle.checked = settings.vibration;
        } catch (e) {
            console.error("UI: Failed to load settings", e);
        }
    },

    renderInventory: function (inventory) {
        this.slots.forEach((slot, i) => {
            slot.innerHTML = '';
            const piece = inventory[i];
            if (piece && !piece.placed) {
                const canvas = document.createElement('canvas');
                canvas.width = 60;
                canvas.height = 60;
                this.drawPiecePreview(canvas, piece);
                slot.appendChild(canvas);
            }
        });
    },

    drawPiecePreview: function (canvas, piece) {
        const ctx = canvas.getContext('2d');
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        const size = Math.min(canvas.width / cols, canvas.height / rows) * 0.8;

        ctx.fillStyle = piece.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = piece.color;

        const offsetX = (canvas.width - cols * size) / 2;
        const offsetY = (canvas.height - rows * size) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (piece.shape[r][c] === 1) {
                    ctx.beginPath();
                    ctx.roundRect(offsetX + c * size + 1, offsetY + r * size + 1, size - 2, size - 2, 4);
                    ctx.fill();
                }
            }
        }
    },

    getSlotIndexAt: function (x, y) {
        for (let i = 0; i < this.slots.length; i++) {
            const rect = this.slots[i].getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return i;
            }
        }
        return -1;
    },

    selectSlot: function (index) {
        this.slots.forEach((slot, i) => {
            if (i === index) slot.classList.add('selected');
            else slot.classList.remove('selected');
        });
    },

    handleRewardedAd: function () {
        showRewardedAd((success) => {
            if (success) {
                Game.resumeAfterAd();
                this.showScreen('game');
            }
        });
    }
};

window.UI = UI;

/**
 * Android Ad Implementation Placeholders
 */
function showBannerAd() {
    console.log("AdMob: showBannerAd called");
    if (window.AdManager && window.AdManager.showBanner) {
        window.AdManager.showBanner();
    }
}

function showRewardedAd(callback) {
    console.log("AdMob: showRewardedAd called");
    if (window.AdManager && window.AdManager.showRewarded) {
        window.AdManager.showRewarded(callback);
    } else {
        // Fallback for browser testing
        setTimeout(() => callback(true), 1000);
    }
}

window.showBannerAd = showBannerAd;
window.showRewardedAd = showRewardedAd;
