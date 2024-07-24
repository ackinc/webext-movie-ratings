import { mapLimit } from "async";
import { waitFor } from "./common";

let contentContainer;
let pageFontFamily;

if (window.navigation) {
  window.navigation.addEventListener("navigate", () => main());
}

main();

async function main() {
  contentContainer = await waitFor(() =>
    document.querySelector(".infinite-scroll-component")
  );
  pageFontFamily = window
    .getComputedStyle(document.body)
    .getPropertyValue("font-family");
  addMovieRatings(contentContainer);

  const observer = new MutationObserver(mutationCallback);
  observer.observe(contentContainer, { subtree: true, childList: true });
}

async function addMovieRatings(startNode = document.body) {
  const movies = findMoviesOnPage(startNode);
  await mapLimit(movies, 10, fetchAndAddRating);
}

function findMoviesOnPage(startNode) {
  const movieNodes = Array.from(
    startNode.querySelectorAll(".slick-slide a")
  ).filter(checkNodeIsForMovieOrTVShow);

  const titles = movieNodes.map(getTitle);

  return movieNodes.map((node, idx) => ({ node, title: titles[idx] }));
}

function checkNodeIsForMovieOrTVShow(node) {
  const href = node.getAttribute("href");
  return href.startsWith("/movies") || href.startsWith("/tv-shows");
}

function getTitle(movieNode) {
  return movieNode
    .getAttribute("aria-label")
    .split(/(:|-)\sWatch/)[0]
    .trim();
}

async function fetchAndAddRating(movie) {
  const rating = await fetchRating(movie);
  addRatingToPage(movie, rating);
}

async function fetchRating(movie) {
  // TODO
  return Promise.resolve(10.0);
}

function addRatingToPage(movie, rating) {
  if (movie.node.querySelector("p.rating")) return;

  const ratingNode = document.createElement("p");
  ratingNode.classList.add("rating");
  ratingNode.style.setProperty("color", "#999999");
  ratingNode.style.setProperty("font-family", pageFontFamily);
  ratingNode.style.setProperty("font-size", "12px");
  ratingNode.style.setProperty("font-weight", "bold");
  ratingNode.style.setProperty("margin", "-6px 0 0 4px");
  ratingNode.innerText = `IMDb ${rating}`;

  movie.node.appendChild(ratingNode);
}

function mutationCallback(mutationList) {
  mutationList
    .filter(checkRecordIndicatesMoviesWereAdded)
    .forEach(({ addedNodes, target }) => {
      addedNodes.forEach((node) => {
        if (node.nodeType !== 1) {
          // not an element node; do nothing
        } else if (node.querySelector(".slick-track")) {
          // a whole list of movies was added
          addMovieRatings(node);
        } else if (node.nodeName === "A" && node.classList.contains("block")) {
          addMovieRatings(target);
        }
      });
    });
}

function checkRecordIndicatesMoviesWereAdded(record) {
  let moviesWereAdded = false;

  for (let i = 0; i < record.addedNodes.length; i++) {
    const node = record.addedNodes[i];

    if (node.nodeType !== 1) {
      // not an element node
      continue;
    }

    if (node.querySelector(".slick-track")) {
      // a whole list of movies was added
      moviesWereAdded = true;
      break;
    }

    if (
      (node.nodeName === "A" && node.classList.contains("block")) ||
      (node.querySelector && node.querySelector("a.block"))
    ) {
      // one or more movies were added to an existing list
      moviesWereAdded = true;
      break;
    }
  }

  return moviesWereAdded;
}
