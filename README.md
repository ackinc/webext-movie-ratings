# ![](images/logoCircularMinimal32.png) Sift

This web extension:

- adds the IMDB rating of a movie / tv show next to it's tile on the page
- clicking on the rating opens the movie's IMDB page in a new tab

### Get it for:

[![Chrome](images/chrome32.png)][chrome-link] &nbsp; [![Edge](images/edge32.png)][edge-link] &nbsp; [![Firefox](images/firefox32.png)][firefox-link]

### Supported OTT platforms:

- JioHotstar
- SonyLIV
- Netflix
- Amazon Prime Video
- AppleTV+
- Crunchyroll

### Build instructions

- Tested with node v24.0.1 and pnpm v10.26.0
- Build commands:
  - `pnpm run build --target=chrome` for chrome
  - `pnpm run build --target=firefox` for firefox
  - `pnpm run build --target=edge` for edge
- Install dev dependencies before building

### Misc

- Movie ratings are sourced from Brian Fritz's [OMDB API][omdbapi-link]; if you found this extension useful, consider donating via Brian's [Patreon][omdbapi-patreon-link]

[chrome-link]: https://chromewebstore.google.com/detail/sift-imdb-ratings-on-indi/pfnhkljamlclkackkndllofcfhihacna
[edge-link]: https://microsoftedge.microsoft.com/addons/detail/odgepppomekmdiifmjmocpjhopdmgjnl
[firefox-link]: https://addons.mozilla.org/en-US/firefox/addon/imdb-ratings-for-various-ott/
[omdbapi-link]: https://omdbapi.com
[omdbapi-patreon-link]: https://www.patreon.com/join/omdb
