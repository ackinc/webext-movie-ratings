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

export type SWErrorResponse = {
  error: Error;
};

export type OmdbApiResponse =
  | {
      Error: string;
    }
  | {
      imdbID: string;
      imdbRating: string;
    };

export type LowRatedProgramFilterSettings = {
  minRating: number;
  transparency: number;
};
