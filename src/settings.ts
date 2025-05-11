import { App, PluginSettingTab, Setting } from "obsidian";
import type MyTelegramReminderPlugin from "../main";


export interface MyTelegramReminderSettings {
	botToken: string;
	chatId: string;
	dateFormat: string;       // например, "YYYY-MM-DD HH:mm"
	defaultTime: string;      // если указана только дата, например, "09:00"
	foldersToScan: string;    // через запятую: "inbox, tasks/daily"
}

export const DEFAULT_SETTINGS: MyTelegramReminderSettings = {
	botToken: "",
	chatId: "",
	dateFormat: "YYYY-MM-DD HH:mm",
	defaultTime: "09:00",
	foldersToScan: ""
};

export class MyTelegramReminderSettingTab extends PluginSettingTab {
	plugin: MyTelegramReminderPlugin;

	constructor(app: App, plugin: MyTelegramReminderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}


	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h2", { text: "Настройки Telegram Reminder" });

		new Setting(containerEl)
			.setName("Telegram Bot Token")
			.setDesc("Токен бота от @BotFather")
			.addText(text => text
				.setPlaceholder("123456:ABC-DEF...")
				.setValue(this.plugin.settings.botToken)
				.onChange(async (value) => {
					this.plugin.settings.botToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Chat ID")
			.setDesc("Куда отправлять сообщения (обычно — твой user ID)")
			.addText(text => text
				.setPlaceholder("123456789")
				.setValue(this.plugin.settings.chatId)
				.onChange(async (value) => {
					this.plugin.settings.chatId = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Формат даты")
			.setDesc("Например: YYYY-MM-DD HH:mm")
			.addText(text => text
				.setPlaceholder("YYYY-MM-DD HH:mm")
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Дефолтное время")
			.setDesc("Если в задаче указана только дата")
			.addText(text => text
				.setPlaceholder("09:00")
				.setValue(this.plugin.settings.defaultTime)
				.onChange(async (value) => {
					this.plugin.settings.defaultTime = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Папки для сканирования")
			.setDesc("Через запятую, относительные пути: tasks, daily")
			.addText(text => text
				.setPlaceholder("tasks, daily")
				.setValue(this.plugin.settings.foldersToScan)
				.onChange(async (value) => {
					this.plugin.settings.foldersToScan = value;
					await this.plugin.saveSettings();
				}));
	}
}
