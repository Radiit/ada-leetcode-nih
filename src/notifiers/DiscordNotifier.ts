import axios from 'axios';
import { INotifier } from './INotifier';
import { Submission, Member } from '../types';

export class DiscordNotifier implements INotifier {
  constructor(private webhookUrl: string) {}

  async notify(member: Member, submission: Submission): Promise<void> {
    const name = member.displayName || member.username;
    const embed = {
      title: '🚀 New Problem Solved!',
      color: 0xffa116,
      fields: [
        { name: 'User', value: name, inline: true },
        { name: 'Problem', value: `[${submission.title}](${submission.url})` },
      ],
      timestamp: new Date(submission.timestamp).toISOString(),
    };

    try {
      await axios.post(this.webhookUrl, { embeds: [embed] });
    } catch (error) {
      console.error('Discord error:', error);
    }
  }
}
