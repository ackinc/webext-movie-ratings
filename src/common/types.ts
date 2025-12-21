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

export type CachedIMDBData = IMDBData & { expiry: number };

export enum MessageType {
  fetchIMDBRating = "fetchIMDBRating",
}

export type SWErrorResponse = {
  error: any;
};
