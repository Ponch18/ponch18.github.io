# ponch18.github.io

Personal presentation site of Doriano Ponzo, Senior Software Developer (Dynamics 365 Business Central and AI agents).

Live at https://ponch18.github.io/

Plain static files with no framework and no build step. GitHub Pages serves the repository root of the `main` branch.

## Where to edit

| What | Where |
| --- | --- |
| All text: hero, About, cards, experience, skills, contact | `index.html`, one commented block per section |
| Page title, description, social sharing tags | `<head>` of `index.html` |
| Colors, font, spacing, layout, motion | `styles.css`, tokens at the top under `:root` |
| Theme toggle, mobile menu, current section, typed prompts, highlight, footer year | `script.js` |
| Profile photo | `assets/profile.jpg` (square, 480 x 480 px works well). If it is missing, the hero shows the initials DP |
| Logo, favicon | `assets/brand/*.svg` and `favicon.svg` (the DP letters are outlines, so they need no font) |
| Image shown when the site is shared | `assets/og-card.jpg` (1200 x 630 px) |
| Banner of the LinkedIn profile | `assets/linkedin-banner.jpg` (1584 x 396 px), made from `brand/linkedin-banner.html` |
| Font (the only one) | `assets/fonts/jetbrains-mono-latin-wght.woff2` (license: `assets/fonts/OFL-JetBrainsMono.txt`) |

Open items are marked with `TODO` HTML comments in `index.html`.

Writing rule for this site: no en dash or em dash characters anywhere. Write date ranges as "Jun 2024 to present".

## Look

The look is called "Agent session": the page is one terminal session, a prompt line followed by its output, set in a single monospaced font (JetBrains Mono). **Teal is the agent, and it appears only where something is live, current or actionable**: the cursor at the end of the page, `HEAD` on the current role, the prompt and nav tab of the section being read, links and buttons. The colors, type and spacing are tokens at the top of `styles.css`.

Each section of the site has a decorative prompt line (hidden from screen readers) and its real content under it, with normal headings, lists and links. Experience is a git log, skills are a YAML file.

Effects, all optional and off with reduced motion: typed prompts, the git log graph that draws itself, the first paragraph of About that streams in word by word, and a theme change that spreads from the toggle (a color fade on touch screens). The last prompt of the page is a real command line (type `help`). All of it lives in `script.js` and the "Effects" part of `styles.css`.

The logo files and the share card are finished assets in `assets/`. The sources used to make them are not kept in this repository. The only source kept is the LinkedIn banner: to remake it, open `brand/linkedin-banner.html` at exactly 1584 x 396 px and export a JPEG to `assets/linkedin-banner.jpg`. The left 30% of the banner stays empty on purpose, because the LinkedIn profile photo covers it.

## Preview locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/

## Checks before publishing

This prints nothing when all files are clean (no dash characters or other non-ASCII characters):

```sh
grep -rnP '[^\x00-\x7F]' --include='*.html' --include='*.css' --include='*.js' --include='*.md' --include='*.svg' --include='*.txt' --include='*.xml' .
```

## Files

- `index.html`: the page
- `styles.css`: tokens, components, light and dark theme, motion, print
- `script.js`: small enhancements; the page works without it
- `favicon.svg`: DP monogram icon
- `assets/profile.jpg`: profile photo
- `assets/og-card.jpg`: social sharing image
- `assets/linkedin-banner.jpg`: banner for the LinkedIn profile
- `brand/linkedin-banner.html`: source of the LinkedIn banner (not linked from the site, kept out of search results)
- `assets/brand/`: logo files (monogram and lockup, on paper and on navy)
- `assets/fonts/`: the font and its license
- `robots.txt` and `sitemap.xml`: tell search engines they can read the site and where its one page is
- `llms.txt`: a short plain summary of the site for AI tools, as proposed at llmstxt.org
- `.nojekyll`: tells GitHub Pages to serve the files as they are, without Jekyll
