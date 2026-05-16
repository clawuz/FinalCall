# Final Call — UI Design Overhaul Spec

**Date:** 2026-05-16  
**Status:** Approved  
**Audience:** Advertising professionals, art directors, senior creatives  
**Goal:** "Wow" reaction — premium design that rivals best-in-class creative industry apps

---

## 1. Design Tone: Aurora Refined

Dark glassmorphism base (`#07070C` background) preserved. Every surface is a glass panel — `rgba(255,255,255,0.03)` fills, `rgba(255,255,255,0.08)` borders. Typography and interaction system upgraded for premium feel. No flat colors, no boring transitions — every element glows, breathes, and responds.

---

## 2. Color System

### Award Colors (per-award, stored in Firestore `color` field)

| Name   | Hex       | Usage                        |
|--------|-----------|------------------------------|
| Amber  | `#FFB347` | Cannes Lions, default        |
| Violet | `#B47AFF` | D&AD, One Show               |
| Teal   | `#4DCDBE` | Kristal Elma, regional       |
| Red    | `#FF5A5A` | Clio, aggressive deadlines   |
| Gold   | `#FFC832` | Effie, effectiveness awards  |
| Blue   | `#64B4FF` | Webby, digital awards        |

Each award card derives its border, countdown number gradient, and glow from this color.

### Tab Bar Colors (per-tab, fixed)

| Tab     | Icon | Hex       | Name   |
|---------|------|-----------|--------|
| Ödüller | ✦    | `#FFB347` | Amber  |
| Keşfet  | ◉    | `#4DCDBE` | Teal   |
| Takip   | ◆    | `#B47AFF` | Violet |
| Haberler| ⊡    | `#64B4FF` | Blue   |
| Ayarlar | ⊛    | `#FF7A7A` | Rose   |

---

## 3. Tab Bar

**Icons:** Ultra Premium Unicode symbols — ✦ ◉ ◆ ⊡ ⊛  
**Inactive state:** Icon color `rgba(255,255,255,0.22)`, no background  
**Active state:**
- Rounded box (12px radius, 38×38) behind icon
- Box background: `rgba(<color-rgb>, 0.15)`
- Box shadow: `0 0 20px rgba(<color-rgb>, 0.35), 0 0 40px rgba(<color-rgb>, 0.15)`
- Icon color: tab's accent color
- Icon text-shadow: `0 0 12px rgba(<color-rgb>, 0.8)`
- Label color: tab's accent color

**Tab switch animation:** Scale + glow burst — icon scales from 1.0 → 1.3 → 1.0 with spring curve (`cubic-bezier(0.34, 1.2, 0.64, 1)`), glow fades in simultaneously.

---

## 4. Award Cards (Home Screen)

### Card Structure
```
┌─────────────────────────────────────────┐
│ [FLAG] COUNTRY                    [NUM] │
│ Award Name (gradient text)        GÜN   │
│                                         │
│ ░░░░░░░░░░░░░░ scan line ░░░░░░░░░░░░░ │
└─────────────────────────────────────────┘
```

### Styling
- Background: `linear-gradient(135deg, rgba(<color>, 0.08), rgba(255,255,255,0.02))`
- Border: `1px solid rgba(<color>, 0.2)`
- Box shadow: `0 4px 30px rgba(<color>, 0.08)`
- Award name: gradient text from `#fff` → `rgba(<color>, 0.8)`
- Countdown number: large (44px, weight 900), gradient from light → accent color
- Unit label (GÜN/SAAT): `9px`, `letter-spacing: 2px`, `rgba(<color>, 0.5)`

### Scan Line Animation
Looping light sweep across card surface:
- `linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)`
- Animates `background-position` from -100% to 200% over 4s, infinite

### Count-Up Animation (first app open per session)
- Countdown number animates from 0 → actual value on mount
- Duration: 800ms, easing: ease-out
- Only plays once per cold start

### Dramatic Glow Pulse
- Number glows with `rgba(<color>, 0.5)` text-shadow
- Pulses softly every 3s: glow intensity 0.3 → 0.7 → 0.3

---

## 5. "Takibe Al" Button — Particle Burst

When user adds an award to tracking:
1. Button scales down (0.95) then snaps back (spring)
2. 8 particles emit from button center in all directions
3. Particles: small circles (4–8px), award's accent color, fade out over 600ms
4. Button label briefly shows "✓ Eklendi" then reverts

Implementation: React Native `Animated` API or `react-native-reanimated` + absolute-positioned particle views.

---

## 6. Onboarding Screens

### Layout
3–4 screens with slide+fade transition (translateX + opacity).

### Per-Screen Design
Each screen features:
- Large floating icon (the relevant Unicode symbol or award emoji)
- **Float animation:** Icon bobs up/down, 3px amplitude, 2s cycle, infinite, using `Animated.sequence` with `Animated.timing`
- Headline text + body text
- Progress dots at bottom

### Progress Dots
- Inactive: small dot, `rgba(255,255,255,0.2)`
- Active: pill shape (animates width from dot to elongated), filled with current screen's accent color from the tab color palette
- Transition: spring animation on width change

### Screen Accent Colors
- Screen 1 (Welcome): Amber `#FFB347`
- Screen 2 (Track Awards): Teal `#4DCDBE`
- Screen 3 (Notifications): Violet `#B47AFF`
- Screen 4 (Let's Go): Gold `#FFC832`

---

## 7. Typography Refinements

- **Primary font:** Outfit (already in project)
- **Hero numbers (countdown):** Weight 900, tight letter-spacing (-2px)
- **Section headers:** Weight 800, 18–20px
- **Card titles:** Weight 700, 17px
- **Body / descriptions:** Weight 400, 14px, `rgba(255,255,255,0.6)`
- **Labels / metadata:** Weight 400, 9–11px, letter-spacing 1.5–2px, uppercase

---

## 8. General Interaction Principles

- No interaction is silent — every tap has a visual response
- Spring animations preferred over linear (`damping: 12, stiffness: 180`)
- Glow effects on all interactive elements in active/pressed state
- Haptic feedback on primary actions (add to tracking, notifications toggle)

---

## 9. Data Layer Changes

### Firestore Award Document
Add `color` field to each award document:
```typescript
interface Award {
  // ... existing fields
  color: 'amber' | 'violet' | 'teal' | 'red' | 'gold' | 'blue';
}
```

### Color Resolution
```typescript
const AWARD_COLORS = {
  amber:  { hex: '#FFB347', rgb: '255,179,71'  },
  violet: { hex: '#B47AFF', rgb: '180,122,255' },
  teal:   { hex: '#4DCDBE', rgb: '77,205,190'  },
  red:    { hex: '#FF5A5A', rgb: '255,90,90'   },
  gold:   { hex: '#FFC832', rgb: '255,200,50'  },
  blue:   { hex: '#64B4FF', rgb: '100,180,255' },
} as const;
```

Default: `amber` when `color` field is absent.

---

## 10. Files to Create / Modify

| File | Action |
|------|--------|
| `constants/AwardColors.ts` | Create — color map as above |
| `components/AwardCard.tsx` | Modify — per-color theming, scan line, glow pulse, count-up |
| `components/TabBar.tsx` | Create (custom) — symbol icons with per-tab glow |
| `app/(tabs)/_layout.tsx` | Modify — use custom TabBar |
| `app/onboarding.tsx` | Modify — float animation, pill dots, slide transitions |
| `components/ParticleBurst.tsx` | Create — particle animation component |
| `app/(tabs)/index.tsx` | Modify — integrate updated AwardCard |
| `constants/Theme.ts` | Modify — typography scale updates |
