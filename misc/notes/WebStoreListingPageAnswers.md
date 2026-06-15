# Listing page answers

## Single purpose description

This extension adds IMDB ratings next to the program tiles on streaming platforms' (netflix etc.) websites to help users choose what to watch faster, and/or find great movies/shows they would otherwise overlook

## Full description

This extension:

- adds the IMDB rating of a movie / tv show next to it's tile on the page
- clicking on the rating opens the movie's IMDB page in a new tab
- allows you to "fade-to-black" programs that are low-rated
- requests permissions **only** for the sites you enable it on after installation
- is free & open-source; source code: https://github.com/ackinc/webext-movie-ratings

Watch a 20s demo video here: https://youtu.be/0nacMtjRhk4

Supported streaming platforms: https://getsift.today#platforms

The IMDB ratings come from the free OMDB API, maintained by Brian Fritz. If you're enjoying using the extension, please consider donating to his Patreon to keep the service going! https://www.patreon.com/join/omdb

## Permission justification - scripting

Post-installation, users can choose exactly which streaming websites they want the extension to operate on. The extension adds/removes content scripts from the relevant open tabs dynamically as users enable/disable it on specific websites.

## Permission justification - storage

The extension fetches IMDB ratings from an external API service and caches them in extension storage. It also stores various settings in extension storage.
