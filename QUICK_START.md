# 🎯 Quick Reference Guide - Character HUD System

## 🌐 Live Deployment

**GitHub Pages URL:**
```
https://Rachith183.github.io/dual-persona-simulator/
```

**Repository:**
```
https://github.com/Rachith183/dual-persona-simulator
```

---

## 🎮 Panel Navigation

| Panel | Purpose | Key Features |
|-------|---------|--------------|
| **CH Core** | Character Display | Monochrome white background, expression controls, reaction buttons |
| **Goal Tracker** | Objectives | Long-term, mid-term, daily targets |
| **Calendar** | Task View | Single-month sheet, task indicators (✓/✕), prev/next navigation |
| **Distraction Tracker** | Focus Metrics | Interruption tracking, session logging |
| **User Profile** | Context Info | Academic details, routine, physical metrics |

---

## 🎨 UI Architecture

### Color Palette
```
Primary Background:  #0B0F19 (Deep Ink-Black)
Monochrome Panel:    #FFFFFF (Pure White)
Text Dark:           #000000 (Ink Black)
Text Light:          #5C6479 (Steel Gray)
Accent Success:      #00F5A0 (Emerald Mint)
Accent Alert:        #FF3366 (Vivid Coral)
```

### Layout Structure
```
┌─────────────────────────────────────────┐
│ ☰  Character HUD System      [DESKTOP]  │ 60px Header
├─────────────────┬───────────────────────┤
│                 │                       │
│   SIDEBAR       │   MAIN CONTENT        │
│   (280px)       │   (Responsive)        │
│                 │                       │
│  • CH Core      │  ┌─────────────────┐  │
│  • Goals        │  │  Panel Content  │  │
│  • Calendar     │  │  (Dynamic)      │  │
│  • Distraction  │  │                 │  │
│  • Profile      │  └─────────────────┘  │
│                 │                       │
└─────────────────┴───────────────────────┘
```

---

## ⌨️ Keyboard Shortcuts

### Character Control (In CH Core Panel)
```
Expression States:
  1 → Smiling      4 → Focused
  2 → Angry        5 → Surprised
  3 → Thinking     6 → Neutral

Reactions:
  H → Happy (bounce)
  S → Sad (shake)
  C → Confused (tilt)
  E → Excited (vibrate)
```

---

## 🔄 Responsive Breakpoints

```
Desktop:      ≥ 768px   • Sidebar visible • Full layout
Mobile:       < 768px   • Hamburger menu • Stacked layout
Extra Small:  < 480px   • Compact header • Single column
```

---

## 📊 Calendar Indicators

| Indicator | Meaning | Color |
|-----------|---------|-------|
| ✓ | 2+ tasks completed | #00F5A0 Emerald Mint |
| ✕ | 1 task pending | #FF3366 Vivid Coral |
| — | No tasks | Gray background |

---

## 🎭 Character Expressions

```javascript
Available Expressions:
  • neutral      • smiling      • angry
  • thinking     • focused      • surprised
  • melancholy   • relieved     • playful
  • determined   • calm-happy   • serious
```

---

## 📁 Frontend File Summary

| File | Purpose | Size |
|------|---------|------|
| `index.html` | DOM structure + 5 panels | ~6KB |
| `app.js` | Router, calendar, animations | ~12KB |
| `style.css` | Responsive design + dark theme | ~18KB |
| `layer-animations.css` | Character animation system | ~28KB |
| `layer-animator.js` | Animation controller class | ~15KB |
| `config.js` | API configuration | <1KB |

---

## 🚀 Deployment Workflow

```
Local Dev
   ↓
git commit (write message)
   ↓
git push origin main
   ↓
GitHub Actions Triggered
   ↓
node scripts/prepare-pages.mjs
   ↓
Upload to dist/github-pages
   ↓
Deploy to GitHub Pages
   ↓
🌐 Live at GitHub Pages URL
```

---

## 🔧 Quick Commands

```bash
# Local development
npm run dev                    # Start backend server

# GitHub Pages preparation
node scripts/prepare-pages.mjs # Prepare static files

# Git workflow
git add -A                     # Stage all changes
git commit -m "message"        # Commit with message
git push origin main           # Push to GitHub

# Check deployment status
# Visit: https://github.com/Rachith183/dual-persona-simulator/actions
```

---

## 🎯 Character Layer Animation Usage

### Basic Setup
```javascript
// Automatically initialized in app.js
const animator = UIState.characterAnimator;

// Set expression
animator.setExpression('smiling');

// Trigger reaction
animator.triggerReaction('happy');

// Control mouth
animator.setMouthState('speaking');
```

### Advanced Routines
```javascript
// Play sequence
await animator.playExpressionSequence(
  ['angry', 'thinking', 'smiling'],
  1500  // ms per expression
);

// Complex routine
await animator.playComplexRoutine(AnimationRoutines.greetingRoutine);
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Sidebar not visible on mobile | CSS media query | Check viewport meta tag |
| Animations not playing | Missing CSS link | Add `layer-animations.css` to HTML |
| Calendar not showing | No task metrics | Populate `UIState.taskMetrics` |
| Deployment not updating | Wrong branch | Push to `main` branch |

---

## 📈 Performance Metrics

- **Page Load**: ~2-3s (with assets)
- **Animation FPS**: 60 (hardware accelerated)
- **CSS Animations**: GPU-accelerated (transform, opacity)
- **Bundle Size**: ~80KB total (minified ~25KB)

---

## ✨ Key Improvements

✅ Complete UI rewrite from scratch  
✅ Responsive sidebar matrix (Chess.com style)  
✅ Monochrome HUD for character panel  
✅ Advanced layer animation system  
✅ Single-month calendar engine  
✅ GitHub Pages auto-deployment  
✅ Comprehensive documentation  
✅ Keyboard shortcuts for testing  

---

## 🎓 Learning Resources

- **Layer Animation API**: See `layer-animator.js` class documentation
- **CSS Animations**: Check `layer-animations.css` for all keyframes
- **Responsive Design**: Review `style.css` media queries
- **State Management**: Study `app.js` UIState object
- **Full Changelog**: Read `CHANGELOG.md` for detailed improvements

---

**Status**: ✅ Live & Fully Functional  
**Last Deploy**: Today  
**Next Steps**: Add Firebase integration, voice input, advanced features
