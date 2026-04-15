import type { ErrorDetails, WebpageStats } from "../common/types";

export interface DashboardData {
  nProgramRatingRequests: {
    timestamp: number;
    value: number;
    metadata: { pageUrl: string };
  }[];
  nRatingsApiRequests: { timestamp: number; value: number }[];
  ratingsApiResponseTimes: { timestamp: number; value: number[] }[];
  webpageRatingStats: {
    timestamp: number;
    value: WebpageStats;
    metadata: {
      pageUrl: string;
      sessionStartTime: string;
      statsCollectionTime: string;
    };
  }[];
  errors: { timestamp: number; value: ErrorDetails[] }[];
}
