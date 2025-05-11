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

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MyTelegramReminderSettingTab(this.app, this));
		console.log("✅ Telegram Reminder plugin loaded");

		this.startScheduler();
	}

	onunload() {
		if (this.timer) clearInterval(this.timer);
		console.log("🛑 Telegram Reminder plugin unloaded");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	startScheduler() {
		this.timer = window.setInterval(() => this.checkTasks(), 1000);
		console.log("⏱️ Планировщик запущен (раз в секунду)");
	}

	async checkTasks() {
		console.log("🔍 Проверка задач началась");
		const files = this.getFilesToScan();
		const now = window.moment();
		console.log("🕓 Сейчас:", now.format("YYYY-MM-DD HH:mm:ss"));

		for (const file of files) {
			//console.log("📄 Читаю файл:", file.path);
			const content = await this.app.vault.read(file);
			const lines = content.split("\n");

			for (const line of lines) {
				//console.log("📜 Строка:", line);
				const match = line.match(TASK_REGEX);
				if (!match) continue;

				const taskText = match[1].trim();
				const datetimeRaw = match[2].trim();
				const taskKey = `${file.path}::${line}`;

				if (this.sentTasks.has(taskKey)) continue;

				console.log("✅ Найдена задача:", taskText, "| Время:", datetimeRaw);

                let datetime = window.moment(datetimeRaw, this.settings.dateFormat, true);
				if (!datetime.isValid()) {
					const withDefault = `${datetimeRaw} ${this.settings.defaultTime}`;
					datetime = window.moment(withDefault, this.settings.dateFormat, true);
				}

				console.log("📅 Распаршенная дата:", datetime.format(), "| Валидна:", datetime.isValid());
				if (!datetime.isValid()) continue;

				const diffMs = datetime.diff(now);
				console.log("⏳ До задачи (мс):", diffMs);

				if (diffMs <= 1000 && diffMs > -1000) {
					console.log("📤 Время пришло — отправляем задачу в Telegram:", taskText);
					await this.sendTelegramNotification(taskText, datetime.format(this.settings.dateFormat));
					this.sentTasks.add(taskKey);
				}
			}
		}
	}

	getFilesToScan(): TFile[] {
		const folders = this.settings.foldersToScan.split(",").map(p => p.trim()).filter(Boolean);
		const allFiles = this.app.vault.getMarkdownFiles();

		if (folders.length === 0) {
			console.log("📁 Сканируем весь vault (все .md)");
			return allFiles;
		}

		const normalized = folders.map(f => normalizePath(f));
		const result = allFiles.filter(file =>
			normalized.some(folder => file.path.startsWith(folder))
		);
		console.log("📁 Сканируем только:", normalized, "| Найдено файлов:", result.length);
		return result;
	}

	async sendTelegramNotification(taskText: string, datetime: string) {
		const token = this.settings.botToken.trim();
		const chatId = this.settings.chatId.trim();
		if (!token || !chatId) {
			console.warn("⚠️ Не указан botToken или chatId — уведомление не отправлено");
			return;
		}

		const url = `https://api.telegram.org/bot${token}/sendMessage`;
		const message = `🕒 Напоминание:\n${taskText}\n⏰ ${datetime}`;

		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					text: message,
				}),
			});

			const json = await res.json();
			if (!json.ok) {
				console.error("❌ Ошибка Telegram API:", json);
			} else {
				console.log("✅ Уведомление отправлено:", message);
			}
		} catch (e) {
			console.error("🔥 Ошибка при отправке Telegram:", e);
		}
	}
}
