import { App, PluginSettingTab, Setting } from "obsidian";
import type MyTelegramReminderPlugin from "../main";

export interface MyTelegramReminderSettings {
  botToken: string;
  chatId: string;
  dateFormat: string;
  defaultTime: string;
  foldersToScan: string;
}

export const DEFAULT_SETTINGS: MyTelegramReminderSettings = {
  botToken: "",
  chatId: "",
  dateFormat: "YYYY-MM-DD HH:mm",
  defaultTime: "09:00",
  foldersToScan: ""
};

export class MyTelegramReminderSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: MyTelegramReminderPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Telegram Reminder – настройки" });

    /* token */
    new Setting(containerEl)
      .setName("Bot Token")
      .setDesc("Токен бота из @BotFather")
      .addText(t =>
        t.setValue(this.plugin.settings.botToken)
          .onChange(async v => {
            this.plugin.settings.botToken = v.trim();
            await this.plugin.saveSettings();
          })
      );

    /* chat id */
    new Setting(containerEl)
      .setName("Chat ID")
      .setDesc("Оставь пустым, затем напиши боту /start")
      .addText(t =>
        t.setValue(this.plugin.settings.chatId)
          .onChange(async v => {
            this.plugin.settings.chatId = v.trim();
            await this.plugin.saveSettings();
          })
      );

    /* date format */
    new Setting(containerEl)
      .setName("Формат даты")
      .addText(t =>
        t.setValue(this.plugin.settings.dateFormat)
          .onChange(async v => {
            this.plugin.settings.dateFormat = v.trim();
            await this.plugin.saveSettings();
          })
      );

    /* default time */
    new Setting(containerEl)
      .setName("Дефолтное время")
      .addText(t =>
        t.setValue(this.plugin.settings.defaultTime)
          .onChange(async v => {
            this.plugin.settings.defaultTime = v.trim();
            await this.plugin.saveSettings();
          })
      );

    /* folders */
    new Setting(containerEl)
      .setName("Папки для сканирования")
      .setDesc("Через запятую; пусто — весь vault")
      .addText(t =>
        t.setValue(this.plugin.settings.foldersToScan)
          .onChange(async v => {
            this.plugin.settings.foldersToScan = v.trim();
            await this.plugin.saveSettings();
          })
      );

    /* buttons */
    new Setting(containerEl)
      .setName("Отправить все задачи сейчас")
      .addButton(b =>
        b.setButtonText("📨 /schedule")
          .setCta()
          .onClick(() => this.plugin.runSendAllNow())
      );

    new Setting(containerEl)
      .setName("Очистить кэш отправленных")
      .addButton(b =>
        b.setButtonText("🧹 Очистить")
          .onClick(() => this.plugin.clearCache())
      );
  }
}
