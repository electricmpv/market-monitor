# 下一步行动清单

> 核心后端已完成！按照此清单完成配置和测试。

---

## ✅ 必需配置（约 30 分钟）

### [ ] 1. 获取 Telegram Chat ID (5 分钟)

```bash
# 步骤 1: 给 Bot 发送 /start 消息
# Bot 地址: https://t.me/bigBread_NEWBOT

# 步骤 2: 获取 Chat ID
curl "https://api.telegram.org/bot8495761885:AAFoQqcBHw46ybJFHdeKLz02zw22RsO4nFc/getUpdates" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); \
  print('Chat ID:', data['result'][-1]['message']['chat']['id'] if data['result'] else 'No messages')"

# 步骤 3: 记录下来
# Chat ID: __________
```

### [ ] 2. 选择并获取 LLM API Key (10 分钟)

**推荐选项**（按性价比排序）:

- [ ] **DeepSeek** (推荐)
  - 访问: https://platform.deepseek.com/
  - 成本: ~$0.1-0.5/月
  - API Key: sk-________________

- [ ] **OpenAI**
  - 访问: https://platform.openai.com/api-keys
  - 成本: ~$0.5-5/月
  - API Key: sk-________________

- [ ] **Anthropic (Claude)**
  - 访问: https://console.anthropic.com/
  - 成本: ~$3-5/月
  - API Key: sk-ant-________________

### [ ] 3. 配置 .env 文件 (10 分钟)

```bash
# 复制示例文件
cp .env.example .env

# 编辑配置
nano .env
```

**必填字段**:
```bash
# LLM 配置
LLM_PROVIDER=deepseek  # 或 openai, anthropic
DEEPSEEK_API_KEY=sk-___________  # 填入步骤 2 获取的 Key

# Telegram 配置
TELEGRAM_CHAT_ID=___________  # 填入步骤 1 获取的 Chat ID

# 语雀配置（可使用默认值）
YUQUE_TOKEN=EmucIYlJro7ic4O4ZS6UujQZm89tXmwor7PwNYmL
YUQUE_NAMESPACE=diandongmianbao
```

### [ ] 4. 安装依赖 (5 分钟)

```bash
# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

---

## 🧪 测试验证（约 10 分钟）

### [ ] 5. 运行快速测试

```bash
./quick_test.sh
```

**预期结果**:
- ✅ LLM 客户端测试成功
- ✅ Telegram 通知发送成功（检查手机）
- ✅ 语雀报告生成成功（返回 URL）

### [ ] 6. 测试完整监控流程

```bash
# 测试痛点扫描
python pain_radar_v2.py
```

**预期结果**:
- Twitter/HackerNews 数据采集成功
- LLM 分析完成
- Word 报告生成（保存在 reports/ 目录）
- 语雀报告生成（打印 URL）
- Telegram 通知发送（检查手机）

---

## 🔧 可选配置（如需 Web 界面）

### [ ] 7. 创建 GitHub OAuth App (10 分钟)

只有在需要 Web 管理界面时才需要：

1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写信息:
   - Application name: `Market Monitor`
   - Homepage URL: `https://your-domain.com`
   - Callback URL: `https://your-domain.com/api/auth/callback`
4. 记录:
   - Client ID: ____________________
   - Client Secret: ____________________

### [ ] 8. 生成 JWT Secret

```bash
# 生成随机密钥
openssl rand -hex 32

# 记录并填入 .env
# JWT_SECRET=____________________
```

### [ ] 9. 启动 API 服务器

```bash
./start_server.sh

# 访问 API 文档
# http://localhost:8000/docs
```

---

## 📅 设置定时任务（可选）

### [ ] 10. 配置 Cron 定时执行

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天 10:00 运行痛点扫描，14:00 运行机会猎手）
0 10 * * * cd /home/git01/market-monitor && /home/git01/market-monitor/venv/bin/python pain_radar_v2.py
0 14 * * * cd /home/git01/market-monitor && /home/git01/market-monitor/venv/bin/python opportunity_hunter.py
```

---

## 🚀 部署到生产环境（可选）

### [ ] 11. 配置 1panel 反向代理

只有在需要公网访问 API 时才需要。

详细步骤请参考 `README_v4.md` 的部署章节。

---

## 📋 验收清单

确认以下所有项目都正常工作：

### 核心功能
- [ ] LLM 客户端可以成功分析文本
- [ ] 语雀可以成功创建精美报告
- [ ] Telegram 可以成功发送通知
- [ ] pain_radar_v2 完整流程可运行
- [ ] opportunity_hunter 完整流程可运行
- [ ] 本地 Word 报告正确生成

### 数据流
- [ ] Twitter 数据采集正常
- [ ] HackerNews 数据采集正常
- [ ] GitHub 数据采集正常（opportunity_hunter）
- [ ] ChromaDB 存储正常
- [ ] 去重机制正常工作

### 通知和报告
- [ ] Telegram 收到报告通知
- [ ] 语雀报告可以访问
- [ ] 报告内容格式正确
- [ ] 数据统计准确

---

## 🆘 遇到问题？

### 常见问题快速解决

**1. Telegram 通知失败**
```bash
# 检查 Chat ID 是否正确
echo $TELEGRAM_CHAT_ID

# 手动测试
python3 -c "import asyncio; from telegram_notifier import TelegramNotifier; \
  notifier = TelegramNotifier(); \
  asyncio.run(notifier.send_alert('测试', '这是测试消息'))"
```

**2. LLM 调用失败**
```bash
# 检查 API Key 是否正确
echo $DEEPSEEK_API_KEY  # 或对应的提供商

# 手动测试
python3 -c "from llm_client import LLMClient; \
  llm = LLMClient(provider='deepseek'); \
  print(llm.analyze('test'))"
```

**3. 语雀报告失败**
```bash
# 检查 Token
echo $YUQUE_TOKEN

# 验证 Token
curl -H "X-Auth-Token: $YUQUE_TOKEN" \
  https://www.yuque.com/api/v2/user
```

### 详细故障排查

查看 `README_v4.md` 的"故障排查"章节。

---

## 📚 文档索引

- **快速入门**: `README_v4.md`
- **迁移指南**: `MIGRATION_GUIDE.md`（从 v3.x 升级）
- **实施总结**: `IMPLEMENTATION_SUMMARY.md`
- **API 文档**: http://localhost:8000/docs（启动服务器后）

---

## ✅ 完成标志

当你看到以下内容时，说明配置成功：

1. ✅ `./quick_test.sh` 全部测试通过
2. ✅ 运行 `python pain_radar_v2.py` 后：
   - 控制台显示采集和分析日志
   - `reports/` 目录下生成 Word 文档
   - 收到 Telegram 通知
   - 控制台显示语雀 URL
3. ✅ 打开语雀 URL，看到精美的报告

---

**祝你使用愉快！** 🎉

如有问题，请提交 [GitHub Issue](https://github.com/electricmpv/market-monitor/issues)。
