# UICloner

Chrome extension that extracts any webpage's full DOM structure, computed CSS, and Tailwind suggestions into AI-friendly JSON. Feed the output to AI tools like Claude or ChatGPT to accurately recreate any UI with pixel-perfect CSS values — no more guessing from screenshots.

## Features

- **Full Page Scan** — Auto-scrolls and extracts every visible element with computed CSS
- **Element Selection** — Click any element to extract only that subtree
- **CSS Extraction** — Design-relevant properties filtered against browser defaults (no noise)
- **Tailwind Suggestions** — Each element gets matching Tailwind utility classes
- **React Component Detection** — Identifies React component names via fiber tree
- **Duplicate Grouping** — Repeated structures (e.g. 50 product cards) compressed to one example + count
- **Semantic Sectioning** — Output split by `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`
- **Pseudo-Elements** — `::before` and `::after` styles included
- **SVG & Image Handling** — Image URLs with optional placeholder mode, SVG size/color extraction
- **Copy & Download** — One-click clipboard copy or JSON file download

## Installation (Local Development)

```bash
# Clone the repository
git clone https://github.com/Volkarslan/ui-cloner.git
cd ui-cloner

# Install dependencies
npm install

# Build the extension
npm run build

# For development with auto-rebuild
npm run watch
```

Then load in Chrome:

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `dist/` folder

## Usage

1. Navigate to any webpage
2. Click the **UICloner** extension icon — side panel opens
3. Choose **"Scan Page"** (full page) or **"Select Element"** (click to pick)
4. Wait for extraction to complete (progress bar shows status)
5. **Copy** the JSON or **Download** as a file
6. Paste the JSON into Claude, ChatGPT, or any AI tool to recreate the UI

## Output Example

```json
{
  "url": "https://example.com",
  "title": "Example Site",
  "sections": [
    {
      "section": "header",
      "tag": "header",
      "css": { "display": "flex", "justify-content": "space-between", "padding": "16px" },
      "tailwind": "flex justify-between p-4",
      "children": [
        {
          "tag": "a",
          "textContent": "Brand",
          "css": { "font-size": "24px", "font-weight": "700" },
          "tailwind": "text-2xl font-bold"
        }
      ]
    },
    {
      "section": "main",
      "tag": "main",
      "children": [
        {
          "tag": "div",
          "reactComponent": "ProductCard",
          "css": { "padding": "16px", "border-radius": "8px" },
          "tailwind": "p-4 rounded-lg",
          "repeated": { "count": 24, "note": "24 identical elements with this structure" },
          "children": [
            {
              "tag": "img",
              "src": "https://example.com/product.jpg",
              "css": { "width": "100%", "border-radius": "4px" },
              "tailwind": "w-full rounded"
            }
          ]
        }
      ]
    }
  ]
}
```

## Options

| Option | Description |
|--------|-------------|
| **Use placeholder images** | Replaces image URLs with `placeholder://WxH` format |
| **Auto-scroll page** | Scrolls the entire page to capture lazy-loaded content |

## Tech Stack

- Chrome Extension Manifest V3
- Side Panel API
- esbuild (bundler)
- Vanilla JavaScript (no framework dependencies)

## Project Structure

```
├── manifest.json              # Extension manifest (MV3)
├── background/
│   └── service-worker.js      # Message routing, side panel management
├── content/
│   ├── content-main.js        # Entry point (orchestrates all modules)
│   └── modules/
│       ├── dom-traversal.js       # Recursive DOM tree walker
│       ├── css-extractor.js       # Computed CSS extraction
│       ├── tailwind-mapper.js     # CSS → Tailwind conversion
│       ├── react-detector.js      # React fiber component detection
│       ├── auto-scroller.js       # Page auto-scroll
│       ├── element-picker.js      # Click-to-select mode
│       ├── duplicate-detector.js  # Structural deduplication
│       ├── semantic-sectioner.js  # Landmark-based sectioning
│       ├── pseudo-elements.js     # ::before/::after extraction
│       └── visibility-checker.js  # Hidden element filtering
├── sidepanel/
│   ├── sidepanel.html
│   ├── sidepanel.css
│   └── sidepanel.js
└── build.js                   # esbuild bundler script
```

## License

[MIT](LICENSE)
