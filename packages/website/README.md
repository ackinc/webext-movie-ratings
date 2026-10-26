# Sift - [Landing page](https://getsift.today)

This is a static site built with [Astro](https://astro.build/) and React islands.

## Getting Started

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321) with your browser. The site has pages at `/`, `/privacy`, and `/uninstall`.

Astro pages and layout are in `src/`; interactive UI remains in the existing React components.

## Building and Deployment

Build the production site with `pnpm --filter sift-website build`. The generated files are written to `dist/`.

The `deployWebsite.yaml` GH Actions workflow (defined in `.github/workflows`) should take care of deploying the website automatically when source files are changed.
