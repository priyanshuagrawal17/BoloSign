# Coordinate Calculation Explanation

## The Problem

Web browsers and PDF files use fundamentally different coordinate systems:

### Browser (CSS Pixels)
- **Origin**: Top-left corner (0, 0)
- **Units**: CSS pixels (typically 96 DPI)
- **Y-axis**: Increases downward
- **Coordinate**: (x, y) where x goes left-to-right, y goes top-to-bottom

### PDF (Points)
- **Origin**: Bottom-left corner (0, 0)
- **Units**: Points (72 DPI)
- **Y-axis**: Increases upward
- **Coordinate**: (x, y) where x goes left-to-right, y goes bottom-to-top

## The Solution

The transformation function `cssPixelsToPdfPoints` in `backend/services/pdfService.js` handles this conversion:

```javascript
function cssPixelsToPdfPoints(cssX, cssY, viewportWidth, viewportHeight, pdfWidth, pdfHeight, pdfPageHeight) {
  // Calculate the scale factor between viewport (CSS pixels) and PDF (points)
  const scaleX = pdfWidth / viewportWidth;
  const scaleY = pdfHeight / viewportHeight;
  
  // Convert CSS X coordinate to PDF X coordinate
  // Direct scaling since both use left-to-right
  const pdfX = cssX * scaleX;
  
  // Convert CSS Y coordinate to PDF Y coordinate
  // PDF uses bottom-left origin, browser uses top-left origin
  // So we need to: 1) Scale the Y coordinate, 2) Flip it relative to PDF height
  const pdfY = pdfPageHeight - (cssY * scaleY);
  
  return { x: pdfX, y: pdfY };
}
```

## Step-by-Step Math

### Example: Placing a field at (100, 200) in the browser viewport

**Given:**
- Browser viewport: 800px × 1200px
- PDF page: 595 points × 842 points (A4)
- Field position in browser: x = 100px, y = 200px

**Step 1: Calculate Scale Factors**
```
scaleX = 595 / 800 = 0.74375 points per pixel
scaleY = 842 / 1200 = 0.70167 points per pixel
```

**Step 2: Convert X Coordinate**
```
pdfX = 100 × 0.74375 = 74.375 points
```
X is straightforward - both systems go left-to-right.

**Step 3: Convert Y Coordinate**
```
scaledY = 200 × 0.70167 = 140.334 points
pdfY = 842 - 140.334 = 701.666 points
```
Y requires flipping because:
- Browser: y=0 at top, y=200 means 200px from top
- PDF: y=0 at bottom, so we subtract from total height

## Responsive Behavior

The key insight is that the scale factors account for:
1. **Zoom level**: If the PDF is zoomed to 150%, viewport dimensions change
2. **Screen size**: Different screen sizes render the PDF at different viewport sizes
3. **Aspect ratio**: The PDF maintains its aspect ratio, so scaleX and scaleY may differ slightly

When a user places a field on a desktop screen and then switches to mobile:
- The viewport dimensions change
- But the scale factors are recalculated based on the new viewport
- The field's position relative to the PDF content remains correct

## Visual Example

```
Browser Viewport (800×1200px)          PDF Page (595×842 points)
┌─────────────────────┐                ┌─────────────────────┐
│ (0,0)               │                │                     │
│                     │                │                     │
│     ┌───┐           │                │                     │
│     │   │ Field     │                │                     │
│     └───┘           │                │                     │
│         (100,200)   │                │                     │
│                     │                │     ┌───┐           │
│                     │                │     │   │ Field     │
│                     │                │     └───┘           │
│                     │                │         (74,702)    │
│                     │                │                     │
│              (0,1200)                │              (0,0)  │
└─────────────────────┘                └─────────────────────┘
```

## Why This Works

1. **Proportional Scaling**: The scale factors ensure that a field at 25% from the left edge in the browser will be at 25% from the left edge in the PDF.

2. **Y-Axis Flipping**: By subtracting the scaled Y from the PDF height, we correctly flip the coordinate system.

3. **Viewport Independence**: As long as we know the viewport dimensions and PDF dimensions, we can calculate the correct position regardless of screen size.

## Testing the Math

To verify the calculation works:
1. Place a field on a specific paragraph in the PDF on desktop
2. Switch to mobile view (Chrome DevTools)
3. The field should still be anchored to the same paragraph
4. Sign the document and verify the signature appears in the correct location

The math ensures that the visual position relative to the PDF content is preserved, not the absolute pixel position.

