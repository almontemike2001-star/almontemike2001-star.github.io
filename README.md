# Mike Jay-Vee Almonte · Portfolio Website

Personal portfolio site: static HTML, CSS and vanilla JavaScript. It has no build step and no dependencies.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages (free)

1. Create a public repo named `almontemike2001-star.github.io` on GitHub.
2. Push this folder to it:
   ```bash
   git remote add origin git@github-personal:almontemike2001-star/almontemike2001-star.github.io.git
   git push -u origin main
   ```
3. In the repo, open **Settings → Pages**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. The site goes live at `https://almontemike2001-star.github.io` within a minute or two.

Netlify, Vercel and Cloudflare Pages also work: drag the folder in, or connect the repo. No build command is needed.

## Structure

```text
index.html            single-page site
404.html              not-found page (GitHub Pages serves it automatically)
assets/css/style.css  all styles, with light and dark themes
assets/js/data.js     project numbers, pipeline stages, gallery list
assets/js/charts.js   dependency-free SVG/HTML charts
assets/js/main.js     theme, nav, reveal, pipeline, gallery, contact form
assets/img/           dashboard screenshots
```

## Updating content

- **Text** (experience, skills, contact): edit `index.html`.
- **BeanFlow numbers, pipeline copy, screenshots**: edit `assets/js/data.js`.
- **New project**: copy the `#project` section in `index.html`.
