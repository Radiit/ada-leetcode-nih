import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import { LeetCodePlatform } from './leetcode';
import { DiscordNotifier } from './notifiers/DiscordNotifier';
import { TelegramNotifier } from './notifiers/TelegramNotifier';
import { INotifier } from './notifiers/INotifier';
import { State, Member } from './types';

import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(__dirname, '../data/state.json');

async function handleTelegramCommands(state: State, telegram: TelegramNotifier): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return false;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  // Clear webhook to ensure getUpdates works
  try {
    await axios.get(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
  } catch (e) {}

  const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
  const offset = state.telegramLastUpdateId ? state.telegramLastUpdateId + 1 : 0;

  try {
    console.log(`Checking Telegram updates with offset ${offset}...`);
    const response = await axios.get(url, { params: { offset, timeout: 10 } });
    const updates = response.data?.result || [];
    console.log(`Found ${updates.length} new Telegram updates.`);
    
    let updated = false;

    for (const update of updates) {
      state.telegramLastUpdateId = update.update_id;
      const message = update.message;
      if (!message) continue;

      const text = message.text || '';
      const senderChatId = message.chat.id.toString();
      
      console.log(`Processing message from ${senderChatId}: ${text}`);

      if (text.startsWith('/add')) {
        const parts = text.split(' ');
        if (parts.length >= 3) {
          const username = parts[1];
          const displayName = parts.slice(2).join(' ');

          if (!state.members.find(m => m.username === username)) {
            state.members.push({ username, platform: 'LeetCode', displayName });
            await telegram.sendMessage(`✅ Berhasil mendaftarkan *${displayName}* (@${username})`, senderChatId);
            updated = true;
          } else {
            await telegram.sendMessage(`⚠️ User *${username}* sudah terdaftar.`, senderChatId);
          }
        } else {
          await telegram.sendMessage('❌ Format salah! Gunakan: `/add <username_leetcode> <nama_asli>`', senderChatId);
        }
      } else if (text === '/start') {
        await telegram.sendMessage('👋 Halo! Kirim `/add <username_leetcode> <nama>` untuk mendaftarkan member baru.', senderChatId);
      }
    }
    return updated;
  } catch (error) {
    console.error('Telegram command error:', error);
    return false;
  }
}

async function run() {
  const state: State = await fs.readJson(STATE_FILE);
  const leetcode = new LeetCodePlatform();
  const notifiers: INotifier[] = [];

  if (process.env.DISCORD_WEBHOOK_URL) {
    notifiers.push(new DiscordNotifier(process.env.DISCORD_WEBHOOK_URL));
  }

  let telegram: TelegramNotifier | undefined;
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    telegram = new TelegramNotifier(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID);
    notifiers.push(telegram);
  }

  // 1. Handle Registrasi via Telegram
  let hasUpdates = false;
  if (telegram) {
    const registered = await handleTelegramCommands(state, telegram);
    if (registered) hasUpdates = true;
  }

  // 2. Check Submissions
  for (const member of state.members) {
    console.log(`Checking ${member.username}...`);
    const submissions = await leetcode.getRecentSubmissions(member);
    
    const lastId = state.lastIds[member.username];
    const newSubmissions = lastId 
      ? submissions.filter(s => s.id > lastId).sort((a, b) => a.timestamp - b.timestamp)
      : submissions.slice(0, 1);

    for (const sub of newSubmissions) {
      console.log(`New submission: ${sub.title}`);
      for (const notifier of notifiers) {
        await notifier.notify(member, sub);
      }
      state.lastIds[member.username] = sub.id;
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await fs.writeJson(STATE_FILE, state, { spaces: 2 });
    console.log('State updated.');
  }
}

run().catch(console.error);
