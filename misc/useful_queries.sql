SELECT
  titles.id, titles.title, titles.type, titles.year, titles.status,
  imdbTitles.id, imdbTitles.title, imdbTitles.type, imdbTitles.year
FROM titles
LEFT JOIN imdbTitles ON titles.imdbId = imdbTitles.id;

SELECT meta ->> 'originallyRequestedFrom' src, COUNT(*) n
FROM titles
GROUP BY src
ORDER BY n DESC;

SELECT status, COUNT(*) n
FROM titles
GROUP BY status
ORDER BY n DESC;

-- identify problem-sites; can then dig deeper into the specific titles
--   associated with a particular dt+src combo, and see if there's a
--   pattern in the unmatched-titles we can take advantage of
SELECT
  date(createdAt) dt, meta ->> 'originallyRequestedFrom' src,
  COUNT(*) n, ROUND((1.0 * SUM(status = 'matched'))/COUNT(*), 4) * 100 pcMatched
FROM "prod_titles"
GROUP BY dt, src
HAVING n >= 20 AND pcMatched < 50
ORDER BY dt, src;
