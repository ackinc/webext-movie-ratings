export type ProgramContainer = {
  node: HTMLElement;
  title: string;
};

export type Program = {
  node: HTMLElement;
  title: string;
  type?: "movie" | "series";
  year?: string;
};

export type IMDBData = {
  imdbID: string;
  imdbRating: string;
};
