// FinalCallSplashView.swift
//
// Native SwiftUI implementation of the Final Call splash screen animation.
// Drop into any iOS 16+ project, present at app launch over your storyboard
// launch screen, and dismiss after `onFinished` fires (~3.0s).
//
// Usage:
//   @State private var showSplash = true
//   var body: some View {
//     ZStack {
//       MainAppContent()
//       if showSplash {
//         FinalCallSplashView { withAnimation { showSplash = false } }
//           .transition(.opacity)
//       }
//     }
//   }

import SwiftUI

// MARK: - Public view
struct FinalCallSplashView: View {
    var onFinished: () -> Void = {}
    @State private var t: CGFloat = 0
    private let duration: CGFloat = 3.0

    var body: some View {
        TimelineView(.animation) { context in
            let now = context.date.timeIntervalSinceReferenceDate
            let phase = CGFloat(now.truncatingRemainder(dividingBy: Double(duration)))
            content(for: min(phase, duration))
                .onChange(of: phase) { newValue in
                    if newValue > duration - 0.05 { onFinished() }
                }
        }
        .ignoresSafeArea()
    }

    @ViewBuilder
    private func content(for t: CGFloat) -> some View {
        GeometryReader { geo in
            let W = geo.size.width
            let H = geo.size.height
            ZStack {
                // ───── Background
                background(opacity: easeFade(t))
                    .ignoresSafeArea()

                // ───── Sound waves (3 staggered pulses)
                ForEach([0.95, 1.25, 1.6], id: \.self) { startT in
                    if let pulse = pulseState(t: t, start: startT) {
                        SoundWaves()
                            .frame(width: min(W*0.7, H*0.42) * pulse.scale)
                            .opacity(pulse.opacity)
                            .position(x: W/2, y: H * 0.38)
                    }
                }

                // ───── Bell
                Bell(ringRotation: ringRotation(t),
                     clapperRotation: clapperRotation(t))
                    .frame(width: min(W*0.7, H*0.42),
                           height: min(W*0.7, H*0.42))
                    .scaleEffect(bellEntryScale(t), anchor: .top)
                    .position(x: W/2, y: H * 0.38)

                // ───── Wordmark
                wordmark
                    .opacity(wordmarkOpacity(t))
                    .offset(y: (1 - wordmarkOpacity(t)) * 14)
                    .position(x: W/2, y: H * 0.72)

                // ───── Footer
                Text("GLOBAL MARKETING AWARDS")
                    .font(.system(size: max(W*0.022, 10), weight: .medium))
                    .tracking(W*0.022 * 0.2)
                    .foregroundColor(Color(red: 1, green: 0.95, blue: 0.76))
                    .opacity(easeFade(t) * 0.45)
                    .position(x: W/2, y: H * 0.93)
            }
        }
    }

    // MARK: - Subviews

    private func background(opacity: CGFloat) -> some View {
        ZStack {
            Color(red: 0.04, green: 0.01, blue: 0.02)
            RadialGradient(
                gradient: Gradient(stops: [
                    .init(color: Color(red: 1.00, green: 0.48, blue: 0.23), location: 0.0),
                    .init(color: Color(red: 0.85, green: 0.18, blue: 0.12), location: 0.38),
                    .init(color: Color(red: 0.43, green: 0.06, blue: 0.03), location: 0.75),
                    .init(color: Color(red: 0.17, green: 0.02, blue: 0.03), location: 1.0),
                ]),
                center: UnitPoint(x: 0.5, y: 0.38),
                startRadius: 0, endRadius: 600
            )
            .opacity(opacity)
            RadialGradient(
                gradient: Gradient(colors: [.clear, Color.black.opacity(0.45)]),
                center: .center, startRadius: 200, endRadius: 800
            )
            .opacity(opacity)
        }
    }

    private var wordmark: some View {
        VStack(spacing: 6) {
            Text("Final Call")
                .font(.system(size: 44, weight: .bold))
                .kerning(-1)
                .foregroundColor(Color(red: 1, green: 0.97, blue: 0.81))
            Text("ÖDÜLÜNÜ KAÇIRMA")
                .font(.system(size: 13, weight: .medium))
                .tracking(4)
                .foregroundColor(Color(red: 1, green: 0.95, blue: 0.76).opacity(0.7))
        }
    }

    // MARK: - Animation curves

    private func easeFade(_ t: CGFloat) -> CGFloat {
        min(1, t / 0.25)
    }

    private func bellEntryScale(_ t: CGFloat) -> CGFloat {
        if t < 0.25 { return 0 }
        if t > 0.95 { return 1 }
        let p = (t - 0.25) / 0.7
        return easeOutBack(p)
    }

    private func ringRotation(_ t: CGFloat) -> Angle {
        guard t >= 0.95, t - 0.95 <= 1.8 else { return .zero }
        let tr = t - 0.95
        let decay = max(0, 1 - tr / 1.8)
        return .degrees(Double(sin(tr * .pi * 4.5) * 12 * decay))
    }

    private func clapperRotation(_ t: CGFloat) -> Angle {
        guard t >= 1.01 else { return .zero }
        let trc = t - 1.01
        guard trc <= 1.8 else { return .zero }
        let decay = max(0, 1 - trc / 1.8)
        return .degrees(Double(sin(trc * .pi * 4.5) * 18 * decay))
    }

    private func wordmarkOpacity(_ t: CGFloat) -> CGFloat {
        max(0, min(1, (t - 1.0) / 0.6))
    }

    private func pulseState(t: CGFloat, start: CGFloat) -> (scale: CGFloat, opacity: CGFloat)? {
        let pt = (t - start) / 1.3
        guard pt >= 0, pt <= 1 else { return nil }
        let eased = 1 - (1 - pt) * (1 - pt)
        return (0.5 + eased * 2.0, (1 - eased) * 0.85)
    }

    private func easeOutBack(_ t: CGFloat) -> CGFloat {
        let c1: CGFloat = 1.70158, c3 = c1 + 1
        return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2)
    }
}

// MARK: - Bell shape (vector, scales to any size)
struct Bell: View {
    var ringRotation: Angle
    var clapperRotation: Angle

    var body: some View {
        ZStack {
            // The bell SVG is a single 1024x1024 viewBox rendered as
            // overlapping shapes. For brevity here we use SF Symbol
            // "bell.fill" as a high-fidelity stand-in — replace with the
            // exact paths from exports/splash-bell.svg for the production
            // skeuomorphic look (use SwiftDraw or PocketSVG to load the SVG
            // directly into a Path).
            Image(systemName: "bell.fill")
                .resizable()
                .scaledToFit()
                .symbolRenderingMode(.palette)
                .foregroundStyle(
                    LinearGradient(
                        colors: [
                            Color(red: 1.00, green: 0.95, blue: 0.71),
                            Color(red: 1.00, green: 0.85, blue: 0.29),
                            Color(red: 0.90, green: 0.66, blue: 0.07),
                            Color(red: 0.61, green: 0.42, blue: 0.02)
                        ],
                        startPoint: .top, endPoint: .bottom
                    )
                )
                .shadow(color: .black.opacity(0.35), radius: 24, y: 10)
                .rotationEffect(ringRotation, anchor: .init(x: 0.5, y: 0.15))
        }
    }
}

// MARK: - Sound waves (two arcs facing left and right)
struct SoundWaves: View {
    var body: some View {
        ZStack {
            ArcShape(side: .left)
            ArcShape(side: .right)
        }
        .stroke(Color(red: 1, green: 0.95, blue: 0.76),
                style: StrokeStyle(lineWidth: 3, lineCap: .round))
    }
}

struct ArcShape: Shape {
    enum Side { case left, right }
    var side: Side
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let r = rect.width / 2
        let cy = rect.midY
        if side == .left {
            p.move(to: CGPoint(x: rect.midX - r * 0.78, y: cy - r * 0.55))
            p.addQuadCurve(
                to: CGPoint(x: rect.midX - r * 0.78, y: cy + r * 0.55),
                control: CGPoint(x: rect.midX - r * 0.98, y: cy)
            )
        } else {
            p.move(to: CGPoint(x: rect.midX + r * 0.78, y: cy - r * 0.55))
            p.addQuadCurve(
                to: CGPoint(x: rect.midX + r * 0.78, y: cy + r * 0.55),
                control: CGPoint(x: rect.midX + r * 0.98, y: cy)
            )
        }
        return p
    }
}

// MARK: - Preview
#Preview {
    FinalCallSplashView()
}

/*
 ── Animation timing reference (matches the HTML reference) ─────────────────
 0.00 – 0.25s   Background gradient fades in
 0.25 – 0.95s   Bell scales up with easeOutBack overshoot
 0.95 – 2.75s   Bell rings (dampened sine, 12° amplitude)
 1.01 – 2.81s   Clapper lags 60ms behind, 18° amplitude
 0.95 – 2.25s   Three sound-wave pulses, staggered every 0.3s, expanding out
 1.00 – 1.60s   Wordmark "Final Call" + tagline fade up
 2.50 – 3.00s   Hold at final state
 3.00s          onFinished fires — dismiss the splash
 ────────────────────────────────────────────────────────────────────────────
*/
