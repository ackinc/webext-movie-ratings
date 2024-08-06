### Desc

Sift is a chrome extension that adds IMDB ratings to Indian OTT platforms' websites

Get it from the Chrome web store: [link](https://chromewebstore.google.com/detail/sift-imdb-ratings-on-indi/pfnhkljamlclkackkndllofcfhihacna)

### Currently supported platforms:

- JioCinema
- Hotstar
- SonyLIV

### Build instructions

- Tested with node v20.14.0 and pnpm v9.6.0
- Build commands:
  - `pnpm run build` for chrome
  - `pnpm run build --target=firefox` for firefox
- Install dev dependencies before building

### Misc

- Movie ratings are sourced from Brian Fritz's [OMDB API](https://omdbapi.com); if you found this extension useful, consider donating via Brian's [Patreon](https://www.patreon.com/join/omdb)
