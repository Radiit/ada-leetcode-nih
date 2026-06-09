import { Submission, Member } from '../types';

export interface INotifier {
  notify(member: Member, submission: Submission): Promise<void>;
}
