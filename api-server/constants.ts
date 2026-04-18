export const abandonedMatchStatusExpiryInDays = 30;

export enum ProgramType {
  "movie" = "movie",
  "series" = "series",
}

export enum MatchStatus {
  "pending" = "pending",
  "matched" = "matched",
  "abandoned" = "abandoned",
}
