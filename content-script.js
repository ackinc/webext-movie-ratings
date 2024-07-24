function findMoviesOnPage() {
  const movies = [];

  const movieLists = document.querySelectorAll(".slick-track");

  movieLists.forEach((movieList) => {
    const movieNodes = movieList.querySelectorAll(".slick-slide a");
    const titles = Array.from(movieNodes).map(getTitle);
    movieNodes.forEach((node, idx) => {
      movies.push({ node, title: titles[idx] });
    });
  });

  return movies;
}

function getTitle(movieNode) {
  return movieNode.getAttribute("aria-label");
}
