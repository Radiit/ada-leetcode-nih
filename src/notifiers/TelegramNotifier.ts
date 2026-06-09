import axios from 'axios';
import { INotifier } from './INotifier';
import { Submission, Member } from '../types';

export class TelegramNotifier implements INotifier {
  constructor(private botToken: string, private chatId: string) {}

  async notify(member: Member, submission: Submission): Promise<void> {
    const name = member.displayName || member.username;
    const text = `🚀 *New Problem Solved!*\n\n` +
                 `👤 *User:* ${name}\n` +
                 `📝 *Problem:* [${submission.title}](${submission.url})\n\n` +
                 `_Keep grinding!_`;

    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error('Telegram error:', error);
    }
  }

  async sendMessage(text: string): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error('Telegram message error:', error);
    }
  }
}
