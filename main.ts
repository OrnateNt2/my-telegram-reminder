import { Plugin } from 'obsidian';

export default class MyTelegramReminderPlugin extends Plugin {
	async onload() {
		console.log('Telegram Reminder plugin loaded');
	}

	onunload() {
		console.log('Telegram Reminder plugin unloaded');
	}
}
