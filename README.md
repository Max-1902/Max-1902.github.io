# Maximilian Wojciechowski — Portfolio

A static personal portfolio in plain HTML, CSS and JavaScript. No framework, build step or backend.

## Files

- `index.html` — page structure and content (all facts come from the CV)
- `styles.css` — layout, colors, typography, responsive styling
- `script.js` — scroll-driven hero, journey chapters, horizontal project gallery, section transitions
- `images/` — illustrations for the hero, each journey chapter and each project
- `Maximilian_Wojciechowski_CV.pdf` — the CV behind the "Download CV" button in the header; replace this file (same name) to update it

## Run locally

From the project directory:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. If you don't see your latest changes, hard-refresh with Cmd + Shift + R.

## Using real photos

Each illustration in `images/` can be swapped for a photo. Save the photo (for example `images/berlin.jpg`) and change the matching `src` in `index.html`. Portrait photos (4:5) fit the arches and project frames best. `hero.svg` is used for both the opening image and the Chicago chapter.

## Design

- Warm, editorial look: bone, ink and terracotta colors, Instrument Serif headings, Inter body text
- Hero: an arch-shaped image that opens up to full screen as you scroll
- Journey: six chapters (Germany → Wichita → New Orleans → Berlin → Frankfurt → Chicago); a sticky arch on the left wipes to each chapter's image and a route line tracks progress
- Projects: a horizontal gallery driven by vertical scrolling on desktop; a stacked layout on phones
- Menu links use a curtain transition instead of a plain jump
- Respects reduced-motion settings; content stays readable without JavaScript

## Publish

Any static host works (Cloudflare Pages, GitHub Pages, Netlify). Upload the whole folder, including `images/`.
