

# ![Logo de Sift](images/logoCircularMinimal32.png) Sift

## ¿Qué hace esta extensión? [Demo de 20s][demo-video-link]

- agrega la calificación de IMDB de una película / serie de TV junto a su tarjeta en la página
- hacer clic en la calificación abre la página de IMDB de la película en una nueva pestaña
- solicita permisos **solo** para los sitios en los que la habilites después de la instalación
- te permite aplicar "fade-to-black" a los programas con baja calificación

![Sift](misc/screenshots/what_does_this_extension_do.png)

## Disponible para

[![Chrome](images/chrome32.png)][chrome-link] &nbsp; [![Edge](images/edge32.png)][edge-link] &nbsp; [![Firefox](images/firefox32.png)][firefox-link]

## Plataformas OTT compatibles

Consulta las plataformas compatibles [aquí][supported-platforms-link]

## Instrucciones de compilación

- Para compilar la extensión:
  - `cd packages/extension && pnpm install`, luego
    - `pnpm run build --target=chrome` para Chrome
    - `pnpm run build --target=firefox` para Firefox
    - `pnpm run build --target=edge` para Edge
- Probado con Node v24 y pnpm v10

## Varios

- Lee la [política de privacidad][privacy-policy-link] de la extensión

- Las calificaciones de las películas provienen de la [OMDB API][omdbapi-link] de Brian Fritz; si te resultó útil esta extensión, considera hacer una donación a través del [Patreon][omdbapi-patreon-link] de Brian

[chrome-link]: https://chromewebstore.google.com/detail/sift-imdb-ratings-on-indi/pfnhkljamlclkackkndllofcfhihacna
[edge-link]: https://microsoftedge.microsoft.com/addons/detail/odgepppomekmdiifmjmocpjhopdmgjnl
[firefox-link]: https://addons.mozilla.org/firefox/addon/sift-imdb-ratings/
[omdbapi-link]: https://omdbapi.com
[omdbapi-patreon-link]: https://www.patreon.com/join/omdb
[demo-video-link]: https://youtu.be/0nacMtjRhk4
[github-link]: https://github.com/ackinc/webext-movie-ratings
[privacy-policy-link]: https://getsift.today/privacy
[supported-platforms-link]: https://getsift.today#platforms
