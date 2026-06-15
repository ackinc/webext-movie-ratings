// We only want to time the fetchImdbRating message-handling operation to
//   time-out when we're faced with an unknown delay
// The longest known delay as of now is a write-locked database on the
//   sift-server-side, which lasts up to 5s
export const FETCH_IMDB_RATING_TIMEOUT_MS = 15000;
