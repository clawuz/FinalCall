# Final Call — Brand Palette

Dark theme, violet + amber accents on black. Gold bell is the brand mark.

## CSS Custom Properties

```css
:root {
  /* Surfaces */
  --bg-base:          #000000;
  --bg-elevated:      #141414;
  --bg-card:          #1a1a1a;

  /* Accents */
  --accent-violet:        #a78bfa;
  --accent-violet-bright: #c4b5fd;
  --accent-violet-glow:   #8b5cf6;
  --accent-violet-bg:     rgba(167, 139, 250, 0.12);
  --accent-violet-border: rgba(167, 139, 250, 0.25);

  --accent-amber:         #f59e0b;
  --accent-amber-bright:  #fbb040;

  --accent-coral:         #ff5e6e;   /* urgent / soon */

  /* Text */
  --text-primary:    #ffffff;
  --text-secondary:  #f4eeda;
  --text-muted:      #a89a82;
  --text-subtle:     #8a8276;
  --text-faint:      #6b6258;

  /* Borders */
  --border-subtle:   rgba(255, 255, 255, 0.06);
  --border-divider:  rgba(255, 255, 255, 0.08);
}
```

## Tailwind config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#000000',
          elevated: '#141414',
          card: '#1a1a1a',
        },
        violet: {
          DEFAULT: '#a78bfa',
          bright: '#c4b5fd',
          glow: '#8b5cf6',
        },
        amber: {
          DEFAULT: '#f59e0b',
          bright: '#fbb040',
        },
        coral: '#ff5e6e',
      },
    },
  },
};
```

## Swift (UIColor)

```swift
extension UIColor {
  static let fcBgBase     = UIColor(red: 0, green: 0, blue: 0, alpha: 1)
  static let fcBgElevated = UIColor(white: 0.078, alpha: 1)     // #141414
  static let fcViolet     = UIColor(red: 0.655, green: 0.545, blue: 0.980, alpha: 1)  // #a78bfa
  static let fcVioletGlow = UIColor(red: 0.545, green: 0.361, blue: 0.965, alpha: 1)  // #8b5cf6
  static let fcAmber      = UIColor(red: 0.961, green: 0.620, blue: 0.043, alpha: 1)  // #f59e0b
  static let fcCoral      = UIColor(red: 1.000, green: 0.369, blue: 0.431, alpha: 1)  // #ff5e6e
  static let fcTextMuted  = UIColor(red: 0.659, green: 0.604, blue: 0.510, alpha: 1)  // #a89a82
}
```

## Kotlin (Android)

```kotlin
// colors.kt
object FinalCallColors {
  val BgBase     = Color(0xFF000000)
  val BgElevated = Color(0xFF141414)
  val Violet     = Color(0xFFA78BFA)
  val VioletGlow = Color(0xFF8B5CF6)
  val Amber      = Color(0xFFF59E0B)
  val Coral      = Color(0xFFFF5E6E)
  val TextMuted  = Color(0xFFA89A82)
}
```

```xml
<!-- res/values/colors.xml -->
<resources>
  <color name="bg_base">#FF000000</color>
  <color name="bg_elevated">#FF141414</color>
  <color name="violet">#FFA78BFA</color>
  <color name="violet_glow">#FF8B5CF6</color>
  <color name="amber">#FFF59E0B</color>
  <color name="coral">#FFFF5E6E</color>
  <color name="text_muted">#FFA89A82</color>
</resources>
```

## Gradients

### Background ambient (radial)
```css
background:
  radial-gradient(60% 45% at 18% 12%, rgba(139, 92, 246, 0.42) 0%, transparent 65%),
  radial-gradient(70% 55% at 88% 78%, rgba(245, 158, 11, 0.32) 0%, transparent 65%),
  #000000;
```

### Gold bell (linear, vertical)
```
#fdeec0  →  #f0c873  →  #c08a2e  →  #6e4810  →  #3a2604
 0%         20%          55%          85%          100%
```

### CTA button (linear, 135deg)
```css
background: linear-gradient(135deg, #a78bfa, #f59e0b);
color: #0a0a0a;
```

## Countdown number colors (semantic)

| Days remaining | Color        | Meaning           |
|----------------|--------------|-------------------|
| 60+            | `#a89a82`    | Plenty of time    |
| 30–59          | `#fbb040`    | Approaching       |
| 7–29           | `#f59e0b`    | Soon              |
| 1–6            | `#ff5e6e`    | Urgent · final call |
| 0 (today)      | `#ff5e6e` + pulse | Last day          |

## Typography

- **Display**: SF Pro Display / system-ui, weight 700, letter-spacing -0.5px
- **Body**: SF Pro Text / system-ui, weight 400–500
- **Mono** (numbers): SF Mono / ui-monospace, weight 700

"Final Call" wordmark: 36px display weight, "Call" in violet, rest in white.
