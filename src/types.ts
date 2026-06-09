export interface Submission {
  id: string;
  title: string;
  slug: string;
  timestamp: number;
  url: string;
}

export interface Member {
  username: string;
  platform: 'LeetCode';
  displayName?: string;
}

export interface State {
  members: Member[];
  lastIds: { [key: string]: string };
  telegramLastUpdateId?: number;
}
