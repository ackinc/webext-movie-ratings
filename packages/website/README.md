# Sift - [Landing page](https://getsift.today)

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Building and Deployment

The husky pre-commit hook (`.husky/pre-commit`) will take care of building the website when its source files are changed.

The `deployWebsite.yaml` GH Actions workflow (defined in `.github/workflows`) should take care of deploying the website automatically when source files are changed.
