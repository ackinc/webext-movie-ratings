SELECT
    titles.id, titles.title, titles.type, titles.year, titles.status,
	imdbTitles.id, imdbTitles.title, imdbTitles.type, imdbTitles.year
FROM titles
LEFT JOIN imdbTitles ON titles.imdbId = imdbTitles.id;