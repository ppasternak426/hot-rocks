export interface Event {
  slug: string;
  title: string;
  description: string;
}

// Event content will be added after it has been confirmed by the owners.
export const events: Event[] = [];
