/**
 * ui.js (Updated for Tetromino Pivot)
 */

const UI = {
    screens: {},
    currentScreen: 'menu-screen',
    slots: [],

    init: function () {
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
        this.setupAndroidBackButton();
    },

    setupAndroidBackButton: function () {
        document.addEventListener("backbutton", (e) => {
            e.preventDefault();
            this.handleBackButton();
        }, false);
        window.onpopstate = () => this.handleBackButton();
    },

    handleBackButton: function () {
        if (this.currentScreen === 'game') {
            if (confirm("Oyundan çıkmak istiyor musunuz?")) this.showScreen('menu');
        } else if (this.currentScreen !== 'menu') {
            this.showScreen('menu');
        }
    },

    setupEventListeners: function () {
        document.getElementById('start-btn').addEventListener('click', () => {
            SoundManager.playClick();
            this.showScreen('game');
            Game.start();
            Game.resize(); // Ensure canvas is correctly sized
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            SoundManager.playClick();
            this.showScreen('settings');
        });

        document.getElementById('settings-close-btn').addEventListener('click', () => {
            SoundManager.playClick();
            this.showScreen('menu');
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            SoundManager.playClick();
            Game.start();
            this.showScreen('game');
        });

        document.getElementById('home-btn').addEventListener('click', () => {
            SoundManager.playClick();
            this.showScreen('menu');
            this.updateHighScoreDisplay();
        });

        document.getElementById('watch-ad-btn').addEventListener('click', () => {
            SoundManager.playClick();
            this.handleRewardedAd();
        });

        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            const settings = StorageManager.getSettings();
            settings.sound = e.target.checked;
            StorageManager.saveSettings(settings);
        });

        document.getElementById('vibe-toggle').addEventListener('change', (e) => {
            const settings = StorageManager.getSettings();
            settings.vibration = e.target.checked;
            StorageManager.saveSettings(settings);
        });
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
        const settings = StorageManager.getSettings();
        document.getElementById('sound-toggle').checked = settings.sound;
        document.getElementById('vibe-toggle').checked = settings.vibration;
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
