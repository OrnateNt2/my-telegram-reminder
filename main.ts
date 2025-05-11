import { Plugin, TFile, normalizePath } from "obsidian";
import {
	MyTelegramReminderSettings,
	DEFAULT_SETTINGS,
	MyTelegramReminderSettingTab,
} from "./src/settings";

const TASK_REGEX = /\[ \] (.+?)\s+\(@(.+?)\)/;

export default class MyTelegramReminderPlugin extends Plugin {
	settings!: MyTelegramReminderSettings;
	private timer: number | null = null;
	private sentTasks = new Set<string>();
	private lastUpdateId = 0;

	/* ---------- lifecycle ---------- */

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MyTelegramReminderSettingTab(this.app, this));
		console.log("✅ Telegram Reminder загружен");
		this.timer = window.setInterval(() => this.tick(), 1000);
	}

	onunload() {
		if (this.timer) clearInterval(this.timer);
		console.log("🛑 Telegram Reminder выгружен");
	}

	/* ---------- tick ---------- */

	private async tick() {
		if (!this.settings.chatId && this.settings.botToken) await this.tryFetchChatId();
		await this.checkTasks(false);
	}

	/* ---------- задачи ---------- */

	private async checkTasks(force: boolean) {
		const now = window.moment();
		for (const file of this.getFilesToScan()) {
			const lines = (await this.app.vault.read(file)).split("\n");
			for (const line of lines) {
				const match = line.match(TASK_REGEX);
				if (!match) continue;

				const taskText = match[1].trim();
				const raw      = match[2].trim();
				const key      = `${file.path}::${line}`;
				if (!force && this.sentTasks.has(key)) continue;

				const when = this.parseDate(raw, now);
				if (!when?.isValid()) continue;

				const diffMs  = when.diff(now);
				const diffSec = Math.round(diffMs / 1000);
				console.log(`⏳ "${taskText}" через ${diffSec}s (${when.format("YYYY-MM-DD HH:mm")})`);

				if (force || (diffMs <= 1000 && diffMs > -1000)) {
					await this.sendTelegram(taskText, when.format(this.settings.dateFormat));
					this.sentTasks.add(key);
				}
			}
		}
	}

	/* ---------- дата с шаблоном XX ---------- */

	private parseDate(raw: string, now: moment.Moment) {
		const xx = /^(\\d{4}|XX)-(\\d{2}|XX)-(\\d{2}|XX) (\\d{2}|XX):(\\d{2}|XX)$/;
		const m  = raw.match(xx);
		if (m) {
			const [, y, M, d, h, mi] = m;

			const dtConfig = {
				year  : y  === "XX" ? now.year()      : Number(y),
				month : M  === "XX" ? now.month()     : Number(M) - 1,
				day   : d  === "XX" ? now.date()      : Number(d),
				hour  : h  === "XX" ? now.hour()      : Number(h),
				minute: mi === "XX" ? now.minute()    : Number(mi),
			};
			const dt = window.moment(dtConfig);            // <-- const достаточно

			if (dt.isBefore(now)) {
				if (h === "XX" || mi === "XX") dt.add(1, "hour");
				else if (d === "XX")           dt.add(1, "day");
				else if (M === "XX")           dt.add(1, "month");
				else if (y === "XX")           dt.add(1, "year");
			}
			return dt;
		}

		let dt = window.moment(raw, this.settings.dateFormat, true);
		if (!dt.isValid() && raw.match(/^\\d{4}-\\d{2}-\\d{2}$/)) {
			dt = window.moment(`${raw} ${this.settings.defaultTime}`, this.settings.dateFormat, true);
		}
		return dt;
	}

	/* ---------- Telegram ---------- */

	private async tryFetchChatId() {
		const token = this.settings.botToken.trim();
		const res   = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
		const data  = await res.json();
		if (!data.ok) return;

		for (const u of data.result) {
			if (u.update_id <= this.lastUpdateId) continue;
			this.lastUpdateId = u.update_id;
			if (u.message?.text !== "/start") continue;

			const id = String(u.message.chat.id);
			this.settings.chatId = id;
			await this.saveSettings();
			await this.sendTelegram("Chat ID получен", id);
			console.log("📟 chat_id сохранён:", id);
		}
	}

	private async sendTelegram(text: string, when: string) {
		if (!this.settings.botToken || !this.settings.chatId) return;
		await fetch(`https://api.telegram.org/bot${this.settings.botToken}/sendMessage`, {
			method : "POST",
			headers: { "Content-Type": "application/json" },
			body   : JSON.stringify({ chat_id: this.settings.chatId, text: `🔔 ${text}\n🗓 ${when}` })
		});
	}

	/* ---------- утиль ---------- */

	private getFilesToScan(): TFile[] {
		const list = this.settings.foldersToScan.split(",").map(s => s.trim()).filter(Boolean);
		const files = this.app.vault.getMarkdownFiles();
		return list.length === 0
			? files
			: files.filter(f => list.some(p => f.path.startsWith(normalizePath(p))));
	}

	clearCache() {
		this.sentTasks.clear();
		console.log("🧹 Кэш очищен");
	}

	async runSendAllNow() {
		console.log("⚡ /schedule — отправляю всё немедленно");
		await this.checkTasks(true);
	}

	/* ---------- settings helpers ---------- */

	public async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}
}
