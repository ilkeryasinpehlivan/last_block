# ADMOB_SETUP.md

Rehber: Reklamları canlıya almak için aşağıdaki adımları izleyin.

## 1. AdMob ID'lerini Güncelleme

`capacitor.config.json` ve `AdManager.js` içindeki şu ID'leri kendi AdMob hesabınızdan aldığınız ID'lerle değiştirin:

- **App ID**: `ca-app-pub-xxxxxxxx~xxxxxxxx`
- **Banner ID**: `ca-app-pub-xxxxxxxx/xxxxxxxx`
- **Rewarded ID**: `ca-app-pub-xxxxxxxx/xxxxxxxx`

## 2. Android Manifest Güncelleme

`android/app/src/main/AndroidManifest.xml` dosyasında `<application>` etiketi içine şu meta-data'yı ekleyin:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="YOUR_ADMOB_APP_ID"/>
```

## 3. Test Cihazları

Geliştirme aşamasında kendi cihazınızın reklam ID'sini `testingDevices` listesine eklemeyi unutmayın, aksi takdirde AdMob hesabınız askıya alınabilir.
