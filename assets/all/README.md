# Final Call — Brand Assets

Marketing reward reminder app · dark palette · gold bell + violet accent.

## 📁 Structure

```
deliverables/
├── icons/                  App icon — all platform sizes
│   ├── icon.svg            Source vector (1024×1024 viewBox)
│   ├── icon-1024.png       iOS App Store
│   ├── icon-512.png        PWA · Google Play
│   ├── icon-432.png        Android adaptive · foreground layer
│   ├── icon-192.png        PWA standard
│   ├── icon-180.png        iPhone @3x
│   ├── icon-167.png        iPad Pro
│   ├── icon-152.png        iPad @2x
│   ├── icon-120.png        iPhone @2x
│   ├── icon-64.png         Favicon (large)
│   ├── icon-48.png         Favicon
│   ├── icon-32.png         Favicon (standard)
│   └── icon-16.png         Favicon (small)
│
├── splash/                 Splash / launch screen
│   ├── splash.svg          Canonical source vector (final frame)
│   ├── splash-square-1200.svg
│   ├── splash-animated.html  Drop-in animated splash (3.0s loop)
│   │
│   ├── splash-iphone-1170x2532.png   iPhone 14/15/16
│   ├── splash-iphone-1290x2796.png   iPhone Pro Max
│   ├── splash-iphone-1242x2208.png   iPhone 8 Plus / older
│   ├── splash-android-1080x1920.png  Android FHD
│   ├── splash-android-1080x2400.png  Android tall (20:9)
│   ├── splash-ipad-2048x2732.png     iPad Pro 12.9"
│   └── splash-square-1200.png        Social cards / OG image
│
├── colors.md               Brand palette reference
└── README.md               (this file)
```

---

## 🎨 Brand colors

| Token              | Hex          | Usage                                |
|--------------------|--------------|--------------------------------------|
| `--bg-base`        | `#000000`    | Primary background                   |
| `--bg-elevated`    | `#141414`    | Cards · elevated surfaces            |
| `--accent-violet`  | `#a78bfa`    | Primary accent · "Call" wordmark · CTAs |
| `--accent-violet-glow` | `#8b5cf6` | Ambient violet blob (top-left)      |
| `--accent-amber`   | `#f59e0b`    | Countdown numbers · ambient glow     |
| `--accent-amber-2` | `#fbb040`    | Active tab / icon                    |
| `--accent-coral`   | `#ff5e6e`    | Urgent / "soon" countdown            |
| `--text-primary`   | `#ffffff`    | Headings · primary text              |
| `--text-secondary` | `#a89a82`    | Body text · muted                    |
| `--text-tertiary`  | `#6b6258`    | Labels · metadata                    |
| `--border-subtle`  | `rgba(255,255,255,0.06)` | Card borders               |

**Wordmark:** "Final" in `--text-primary`, "Call" in `--accent-violet`.

**Gold bell gradient** (top → bottom):
`#fdeec0 → #f0c873 → #c08a2e → #6e4810 → #3a2604`

---

## 🛠 Integration

### iOS (Swift / SwiftUI)

1. Drag `icons/icon-1024.png` into `Assets.xcassets → AppIcon`. Xcode 14+ auto-generates all sizes; or use the individual `icon-180/167/152/120.png` for legacy targets.
2. For the launch screen:
   - **Static**: Use `splash-iphone-1170x2532.png` (or matching device res) in `LaunchScreen.storyboard` as an `UIImageView` with `scaleAspectFill`.
   - **Animated**: Show a static splash first, then transition to the animated version. Embed `splash-animated.html` in a `WKWebView` on first launch.

### Android (Kotlin)

1. **App icon** (adaptive):
   - Foreground: `icons/icon-432.png` → `res/mipmap-anydpi-v26/ic_launcher_foreground.png`
   - Background: solid black `#000000` color resource
   - Or paste `icons/icon.svg` into Android Studio's Asset Studio for one-click adaptive.
2. **Splash Screen API (Android 12+)**:
   ```xml
   <style name="Theme.App.Starting" parent="Theme.SplashScreen">
     <item name="windowSplashScreenBackground">#000000</item>
     <item name="windowSplashScreenAnimatedIcon">@drawable/ic_launcher_foreground</item>
   </style>
   ```
3. **Legacy splash (< Android 12)**: use `splash-android-1080x2400.png` as a fullscreen `ImageView`.

### Web / PWA

```html
<!-- favicons -->
<link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png">

<!-- PWA manifest.json -->
{
  "name": "Final Call",
  "short_name": "Final Call",
  "background_color": "#000000",
  "theme_color": "#a78bfa",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

<!-- OG / Twitter card -->
<meta property="og:image" content="/splash/splash-square-1200.png">
```

### React Native

```js
// react-native.config.js — link asset directories
module.exports = {
  assets: ['./assets/icons', './assets/splash'],
};

// app.json (Expo)
{
  "expo": {
    "icon": "./assets/icons/icon-1024.png",
    "splash": {
      "image": "./assets/splash/splash-iphone-1290x2796.png",
      "backgroundColor": "#000000",
      "resizeMode": "cover"
    }
  }
}
```

---

## 🎬 Splash animation

The animated splash is a 3-second sequence:

| Time | Event |
|------|-------|
| 0.0s–0.25s | Background fades in (violet + amber glows) |
| 0.25s–0.95s | Gold bell scales up with overshoot easing |
| 0.95s–2.4s | Bell rings (rotation oscillation, dampened) |
| 0.95s–2.6s | Three sound-wave pulses expand outward |
| 1.0s–1.6s | "Final Call" wordmark fades up below |
| 2.6s–3.0s | Hold for handoff to app content |

To use the animated version natively:

- **iOS**: Show a static splash from `LaunchScreen.storyboard` (required by Apple), then on first frame of the app, present an overlay `WKWebView` loading `splash-animated.html` for ~3s, dismiss when done.
- **Android 12+**: Splash Screen API supports an animated vector drawable; convert `splash.svg` to AnimatedVectorDrawable XML, or use the same WebView overlay approach.
- **Web/PWA**: Add `splash-animated.html` as the loading screen before your app's bundle finishes parsing.

---

## ⚠️ Notes

- **Black background is mandatory.** Don't change the splash background to white — the gold bell loses contrast.
- **Wordmark color:** "Call" is always violet (`#a78bfa`), never any other color.
- **Min splash duration:** 1.5s recommended so users see the wordmark; max 3.0s before it feels slow.
- **Icon adaptive masking:** The current icon design survives all Android adaptive masks (square / rounded / circle) because the bell is centered with comfortable margin. Don't crop tighter than 40px on a 1024 icon.

---

_Generated · Final Call splash + icon kit · 2026_
