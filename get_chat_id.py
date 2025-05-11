import telebot
import logging

BOT_TOKEN = ""

# Настрой логирование в файл и консоль
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("bot.log"),
        logging.StreamHandler()
    ]
)

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
def send_chat_id(message):
    chat_id = message.chat.id
    logging.info(f"Получена команда /start от chat_id: {chat_id}")
    bot.send_message(chat_id, f"👋 Ваш chat_id: {chat_id}")

logging.info("Бот запущен. Ожидаем команду /start...")
bot.polling(none_stop=True)
