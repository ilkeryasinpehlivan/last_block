/**
 * AdManager.js
 * Manages AdMob via Capacitor global bridge (No-bundler version)
 */

export const AdManager = {
    async initialize() {
        if (!window.Capacitor || !window.Capacitor.Plugins.AdMob) {
            console.warn("Capacitor AdMob plugin not found. Running in browser mode?");
            return;
        }

        const { AdMob } = window.Capacitor.Plugins;

        await AdMob.initialize({
            requestTrackingAuthorization: true,
            testingDevices: ['2077ef9a67fb34d3d254558e8b0b8c65'],
            initializeOnBlur: true,
        });

        // Add Listeners
        AdMob.addListener('bannerAdFailedToLoad', (info) => {
            console.warn('Banner Ad failed to load:', info);
        });

        AdMob.addListener('rewardVideoAdFailedToLoad', (info) => {
            console.warn('Rewarded Ad failed to load:', info);
        });

        AdMob.addListener('rewardVideoAdReceived', (reward) => {
            console.log('Reward received:', reward);
        });
    },

    async showBanner() {
        if (!window.Capacitor || !window.Capacitor.Plugins.AdMob) return;
        const { AdMob } = window.Capacitor.Plugins;

        const options = {
            adId: 'ca-app-pub-6902386403067914/2312943037',
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: false
        };
        await AdMob.showBanner(options);
    },

    async showRewarded(callback) {
        if (!window.Capacitor || !window.Capacitor.Plugins.AdMob) {
            // Simulate for browser testing
            setTimeout(() => callback(true), 1000);
            return;
        }
        const { AdMob } = window.Capacitor.Plugins;

        const options = {
            adId: 'ca-app-pub-6902386403067914/9827278037',
            isTesting: false
        };
        await AdMob.prepareRewardVideoAd(options);
        const reward = await AdMob.showRewardVideoAd();
        if (reward) {
            callback(true);
        } else {
            callback(false);
        }
    }
};

window.AdManager = AdManager;
