# Server-side

The main purpose of having a server-side component to Sift is to enable "program-matching", i.e. linking the details (title, type, year) of a program extracted from a streaming platform's web page to an IMDB Id.

Sift has a few different things happening server-side to support this:

1. An API server that reads from and writes to a SQLite DB
2. A search engine, with IMDB titles indexed
3. A cron to back-up the DB in AWS S3
4. A cron to refresh the search engine's index with data from the IMDB non-commercial dataset
5. A cron (runs locally) that makes data from the prod. DB available locally for analysis (pulls the daily backup from AWS S3)
