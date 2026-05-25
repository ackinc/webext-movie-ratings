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