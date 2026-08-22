export const RATING_QUESTIONS = [
  { key: 'overall', label: 'How would you rate this session overall?' },
  { key: 'engaging', label: 'How engaging was the speaker/activity?' },
  { key: 'relevant', label: 'How relevant was the session for students?' },
  { key: 'duration', label: 'Was the duration appropriate?' },
  { key: 'venue', label: 'How comfortable was the venue/environment?' },
] as const;

export const OPEN_QUESTIONS = [
  { key: 'likedMost', label: 'What did you like most about this event?' },
  { key: 'improvements', label: 'What should be improved next time?' },
  { key: 'suggestions', label: 'Any suggestions for future sessions?' },
] as const;

export type RatingKey = (typeof RATING_QUESTIONS)[number]['key'];
export type OpenKey = (typeof OPEN_QUESTIONS)[number]['key'];

export interface FeedbackRatings {
  overall: number;
  engaging: number;
  relevant: number;
  duration: number;
  venue: number;
}

export interface FeedbackSubmission {
  ratings: FeedbackRatings;
  likedMost: string;
  improvements: string;
  suggestions: string;
}
