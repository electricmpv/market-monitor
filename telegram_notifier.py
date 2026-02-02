"""Telegram 通知器"""

import os
import asyncio
from datetime import datetime
from telegram import Bot


class TelegramNotifier:
    def __init__(self):
        self.bot_token = os.getenv('TELEGRAM_BOT_TOKEN', '8495761885:AAFoQqcBHw46ybJFHdeKLz02zw22RsO4nFc')
        self.chat_id = os.getenv('TELEGRAM_CHAT_ID')

        if not self.chat_id:
            raise ValueError("TELEGRAM_CHAT_ID 未设置！请先获取 Chat ID")

        self.bot = Bot(token=self.bot_token)

    async def send_report_notification(self, summary, yuque_url):
        """发送报告通知"""

        message = f"""📊 **市场监控日报已生成**

📅 日期：{datetime.now().strftime('%Y-%m-%d')}

📈 本次发现：
{summary}

🔗 完整报告：{yuque_url}

---
🤖 由 Market Monitor 自动生成
"""

        await self.bot.send_message(
            chat_id=self.chat_id,
            text=message,
            parse_mode='Markdown'
        )

    async def send_alert(self, title, content, priority='normal'):
        """发送紧急提醒"""

        emoji = '🚨' if priority == 'high' else '💡'

        message = f"{emoji} **{title}**\n\n{content}"

        await self.bot.send_message(
            chat_id=self.chat_id,
            text=message,
            parse_mode='Markdown'
        )


# 测试脚本
if __name__ == "__main__":
    async def test():
        notifier = TelegramNotifier()
        await notifier.send_alert("测试", "这是一条测试消息")

    asyncio.run(test())
