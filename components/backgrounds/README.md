# Background System Documentation

## Overview
Sistem background yang fleksibel dengan berbagai pilihan modern, termasuk Vanta.js 3D effects dan berbagai gradient patterns yang terinspirasi dari shadcn/ui design.

## Available Backgrounds

### 1. **Gradient** (Default) 🌈
- Animated gradient blobs yang bergerak
- Menggunakan canvas untuk rendering smooth
- Warna: Indigo, Purple, Blue, Sky
- Performance: Excellent
- Best for: Dashboard, general pages

### 2. **Grid** ⚡
- Grid pattern dengan spotlight effects
- Animated floating spotlights
- Mask gradient untuk efek fade
- Performance: Excellent
- Best for: Technical/data pages

### 3. **Mesh** ✨
- Interactive mesh gradient
- Responds to mouse movement
- Multiple floating gradient orbs
- Noise texture overlay
- Performance: Good
- Best for: Landing pages, interactive sections

### 4. **Dots** 🔵
- Dot pattern dengan parallax effect
- Mouse-responsive parallax movement
- Animated gradient orbs
- Performance: Excellent
- Best for: Modern, clean interfaces

### 5. **Vanta (3D)** 🌫️
- 3D fog effect menggunakan Three.js
- Original Vanta.js implementation
- Interactive mouse controls
- Performance: Moderate (GPU intensive)
- Best for: Hero sections, special pages

### 6. **None** ⬜
- No background effect
- Solid color only
- Performance: Best
- Best for: Maximum performance

## Usage

### Basic Implementation
```tsx
import BackgroundManager from '@/components/backgrounds/BackgroundManager';

// In your layout or page
<BackgroundManager 
  defaultBackground="gradient" 
  allowSwitch={true} 
/>
```

### Props
- `defaultBackground`: BackgroundType - Default background to show ('vanta' | 'gradient' | 'grid' | 'mesh' | 'dots' | 'none')
- `allowSwitch`: boolean - Show background switcher UI (default: true)

### User Preference
Background preference otomatis disimpan di localStorage dengan key `preferred-background`. Saat user memilih background, pilihan akan tersimpan dan digunakan pada kunjungan berikutnya.

### Automatic Map Page Handling
Background otomatis tidak ditampilkan pada halaman `/map` untuk performa optimal.

## File Structure
```
components/
├── backgrounds/
│   ├── BackgroundManager.tsx       # Main manager component
│   ├── ModernGradientBg.tsx        # Gradient background
│   ├── ModernGradientBg.module.css
│   ├── GridPatternBg.tsx           # Grid pattern background
│   ├── GridPatternBg.module.css
│   ├── MeshGradientBg.tsx          # Mesh gradient background
│   ├── MeshGradientBg.module.css
│   ├── DotPatternBg.tsx            # Dot pattern background
│   └── DotPatternBg.module.css
└── VantaFog.tsx                    # Original Vanta.js component
```

## Customization

### Adding New Background
1. Create new background component in `components/backgrounds/`
2. Import in `BackgroundManager.tsx`
3. Add to `BackgroundType` type
4. Add case in `renderBackground()` switch
5. Add button in UI with emoji

### Modifying Colors
Each background component has its own CSS module. Modify the gradient colors in the respective `.module.css` file.

Example for ModernGradientBg:
```css
/* Change blob colors */
rgba(99, 102, 241, 0.3)  /* indigo */
rgba(168, 85, 247, 0.25) /* purple */
rgba(59, 130, 246, 0.28) /* blue */
```

## Performance Considerations

1. **Canvas-based backgrounds** (Gradient): Best performance, smooth animations
2. **CSS-based backgrounds** (Grid, Dots): Excellent performance, GPU accelerated
3. **Interactive backgrounds** (Mesh): Good performance, slight overhead for mouse tracking
4. **3D backgrounds** (Vanta): Moderate performance, requires WebGL support

## Browser Compatibility

All backgrounds support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (with reduced animations on low-end devices)

Vanta.js requires WebGL support. Falls back to gradient if WebGL is not available.

## Accessibility

- Background switcher includes `title` attributes for tooltips
- All backgrounds use `pointer-events: none` to not interfere with page interaction
- Sufficient contrast maintained for text readability
- Reduced motion support can be added via CSS media queries

## Future Enhancements

Possible additions:
- [ ] Particle effects background
- [ ] Wave animation background
- [ ] Custom image background with overlay
- [ ] Dark mode variants
- [ ] Reduced motion support
- [ ] Performance monitoring
- [ ] Background intensity slider
