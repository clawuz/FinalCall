# Final Call — Splash Animation Outputs

## What's in this folder

```
exports/
├── icon.svg                              ← master app icon SVG (V2)
├── splash-bell.svg                       ← bell only (no bg)
├── splash-iphone-1170x2532.svg           ← static splash, iPhone aspect
├── splash-iphone-1242x2688.svg
├── splash-android-1080x2400.svg
├── splash-1024-square.svg
│
├── icons/                                ← rasterized icon PNGs
│   ├── icon-ios-{1024,180,167,152,120,87,80,60,58,40}.png
│   ├── icon-android-{512,432,192,144,96}.png
│   └── favicon-{16,32,48,64,192,512}.png
│
├── splash/
│   ├── splash-iphone-1170x2532.png       ← static launch image (iOS)
│   ├── splash-iphone-1242x2688.png       ← iPhone Max sizes
│   ├── splash-android-1080x2400.png
│   ├── splash-1024-square.png
│   ├── splash-hero-still-1170x2532-v2.png ← final hold frame, full res
│   ├── animation-contact-sheet-v2.png    ← 6-up keyframe overview
│   └── frames/
│       └── frame-00.png … frame-11.png   ← 12 frames @ 4fps for GIF assembly
│
└── ios/
    └── FinalCallSplashView.swift         ← native SwiftUI implementation
```

## How to use — iOS

**Option A — SwiftUI (recommended)**
1. Drop `exports/ios/FinalCallSplashView.swift` into your Xcode project
2. Replace the `Image(systemName: "bell.fill")` placeholder inside the `Bell` view with the actual SVG bell — use [SwiftDraw](https://github.com/swhitty/SwiftDraw) or [PocketSVG](https://github.com/pocketsvg/PocketSVG) to load `exports/splash-bell.svg`
3. Show `FinalCallSplashView` on top of your root view at app launch; dismiss on `onFinished`

**Option B — Static launch screen + animated video**
1. Use `splash-iphone-1170x2532.png` as the static `LaunchScreen.storyboard` background
2. Screen-record `Final Call - Splash Fullscreen.html` on an iPhone simulator with QuickTime to produce an `.mov`
3. Play the recorded video as an `AVPlayerLayer` overlay at launch, hide when finished

**Option C — Lottie**
- The frame sequence in `splash/frames/` can be converted to a Lottie JSON via After Effects + Bodymovin, or you can hand-author the Lottie keyframes using the timing reference at the bottom of `FinalCallSplashView.swift`

## How to use — Android

1. Set up Android 12+ Splash Screen API in your manifest pointing to the 432×432 adaptive icon (`icons/icon-android-432.png`)
2. After the system splash, show an animated overlay using the same approach as iOS (Lottie, or hand-coded `ValueAnimator`)
3. The 1080×2400 PNG works as a fallback static splash for older Android versions

## Animation timing (3.0s loop)

| t | event |
|---|---|
| 0.00 – 0.25s | Background gradient fades in |
| 0.25 – 0.95s | Bell scales up with easeOutBack overshoot |
| 0.95 – 2.75s | Bell rings (dampened sine, 12° amplitude) |
| 1.01 – 2.81s | Clapper lags 60ms behind, 18° amplitude |
| 0.95 – 2.25s | Three sound-wave pulses, staggered 0.3s apart |
| 1.00 – 1.60s | Wordmark + tagline fade up |
| 2.50 – 3.00s | Hold at final state |

## Recording your own MP4

Open `Final Call - Splash Fullscreen.html` in Safari on an iPhone (or in an iOS Simulator), then:
- **On device**: Control Center → Screen Recording (start before the page loads, stop after 3.5s)
- **Simulator**: File → Record Screen, save as `.mov`, convert to `.mp4` with `ffmpeg -i input.mov output.mp4`
