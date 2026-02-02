# Migration Guide: v3.x → v4.0

本文档指导如何从旧版本升级到 v4.0（LLM 升级版）。

---

## 🔄 主要变更

### 1. LLM 提供商变更

**旧版本** (v3.x):
- 使用 Google Gemini API
- 环境变量: `GEMINI_API_KEY`

**新版本** (v4.0):
- 支持多个 LLM 提供商（OpenAI/Claude/DeepSeek）
- 环境变量: `LLM_PROVIDER`, `OPENAI_API_KEY` 等

### 2. 通知方式变更

**旧版本**:
- PushPlus 微信推送
- 环境变量: `PUSHPLUS_TOKEN`

**新版本**:
- Telegram Bot 推送
- 语雀精美报告
- 环境变量: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

### 3. 新增功能

- GitHub OAuth 认证
- FastAPI Web API
- 配置管理界面（后端）
- 关键词/博主管理（后端）

---

## 📋 升级步骤

### 步骤 1: 备份现有数据

```bash
# 备份数据库
cp -r my_market_brain my_market_brain.backup

# 备份配置
cp .env .env.backup

# 备份报告
cp -r reports reports.backup  # 如果存在
```

### 步骤 2: 切换到新分支

```bash
# 如果使用 Git
git fetch origin
git checkout feature/llm-upgrade

# 或者直接拉取最新代码
git pull origin feature/llm-upgrade
```

### 步骤 3: 安装新依赖

```bash
# 更新 pip
pip install --upgrade pip

# 安装新依赖
pip install -r requirements.txt
```

### 步骤 4: 配置环境变量

```bash
# 查看新配置模板
cat .env.example

# 编辑现有 .env 文件
nano .env
```

**需要添加的新配置**:

```bash
# === GitHub OAuth 认证（可选，仅在使用 Web 界面时需要）===
GITHUB_CLIENT_ID=<your_github_oauth_client_id>
GITHUB_CLIENT_SECRET=<your_github_oauth_client_secret>
GITHUB_ALLOWED_USERS=electricmpv

# === JWT Token 配置（可选） ===
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=720

# === 前端 URL（可选） ===
FRONTEND_URL=https://your-domain.com

# === LLM Configuration（必需） ===
LLM_PROVIDER=deepseek  # 或 openai, anthropic

# 选择对应的 API Key（必需）
DEEPSEEK_API_KEY=sk-...  # 如果使用 DeepSeek
# OPENAI_API_KEY=sk-...  # 如果使用 OpenAI
# ANTHROPIC_API_KEY=sk-ant-...  # 如果使用 Claude

# === Telegram（必需） ===
TELEGRAM_BOT_TOKEN=8495761885:AAFoQqcBHw46ybJFHdeKLz02zw22RsO4nFc
TELEGRAM_CHAT_ID=<your_chat_id>  # 需要先获取
```

**需要移除的旧配置**:

```bash
# 以下配置不再使用，可以删除或注释
# GEMINI_API_KEY=...
# PUSHPLUS_TOKEN=...
```

### 步骤 5: 获取必需的 API Keys

#### 5.1 获取 Telegram Chat ID

```bash
# 1. 先给 Bot 发送 /start 消息
# Bot 地址: @bigBread_NEWBOT

# 2. 运行以下命令获取 Chat ID
curl "https://api.telegram.org/bot8495761885:AAFoQqcBHw46ybJFHdeKLz02zw22RsO4nFc/getUpdates" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); \
  print('Chat ID:', data['result'][-1]['message']['chat']['id'] if data['result'] else 'No messages')"
```

#### 5.2 获取 LLM API Key

选择一个提供商:

- **DeepSeek** (推荐): https://platform.deepseek.com/
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/

### 步骤 6: 测试新系统

```bash
# 测试 LLM 客户端
python3 -c "from llm_client import LLMClient; \
  llm = LLMClient(provider='deepseek'); \
  print(llm.analyze('测试: ChatGPT太贵了'))"

# 测试 Telegram 通知
python3 -c "import asyncio; from telegram_notifier import TelegramNotifier; \
  notifier = TelegramNotifier(); \
  asyncio.run(notifier.send_alert('测试', '这是一条测试消息'))"

# 测试完整流程
python pain_radar_v2.py
```

### 步骤 7: 更新定时任务（如果使用 cron）

旧的定时任务仍然有效，无需修改。但确保 Python 路径正确:

```bash
crontab -e

# 确认路径（如果使用虚拟环境）
0 10 * * * cd /home/git01/market-monitor && /home/git01/market-monitor/venv/bin/python pain_radar_v2.py
0 14 * * * cd /home/git01/market-monitor && /home/git01/market-monitor/venv/bin/python opportunity_hunter.py
```

---

## 🔧 配置对比表

| 功能 | v3.x | v4.0 |
|------|------|------|
| **LLM** | Gemini | OpenAI/Claude/DeepSeek |
| **推送** | PushPlus | Telegram |
| **报告** | Word 文档 | Word + 语雀 |
| **认证** | 无 | GitHub OAuth |
| **Web API** | 无 | FastAPI |
| **配置管理** | 手动编辑 .env | API + Web 界面 |

---

## ⚠️ 注意事项

### 1. 成本变化

- **v3.x**: Gemini API (~$1.50/月)
- **v4.0**:
  - DeepSeek: ~$0.1-0.5/月（更便宜）
  - OpenAI GPT-3.5: ~$0.5-1/月
  - OpenAI GPT-4: ~$3-5/月
  - Claude: ~$3-5/月

### 2. 数据兼容性

- ChromaDB 数据库完全兼容，无需迁移
- 旧的 Word 报告保持不变
- 新报告会额外生成语雀链接

### 3. PushPlus 推送

如果你仍需要 PushPlus 推送，可以保留相关代码。但建议迁移到 Telegram，因为:
- 推送更快
- 支持 Markdown
- 无需关注公众号

---

## 🆘 回滚到旧版本

如果升级后遇到问题，可以回滚:

```bash
# 1. 切换回旧分支
git checkout main  # 或你之前使用的分支

# 2. 恢复旧配置
cp .env.backup .env

# 3. 恢复旧数据（如果有修改）
cp -r my_market_brain.backup my_market_brain

# 4. 重新安装旧依赖
pip install -r requirements.txt
```

---

## 📞 获取帮助

如果升级过程中遇到问题:

1. 查看 [README_v4.md](README_v4.md) 中的故障排查章节
2. 提交 [GitHub Issue](https://github.com/electricmpv/market-monitor/issues)
3. 加入讨论组（待建立）

---

## ✅ 升级检查清单

完成以下检查确保升级成功:

- [ ] 已备份所有数据
- [ ] 已安装新依赖（`pip install -r requirements.txt`）
- [ ] 已更新 .env 文件
- [ ] 已获取 Telegram Chat ID
- [ ] 已获取 LLM API Key
- [ ] 已测试 LLM 客户端
- [ ] 已测试 Telegram 通知
- [ ] 已运行完整监控流程
- [ ] 已收到语雀报告链接
- [ ] 已收到 Telegram 通知
- [ ] （可选）已配置 GitHub OAuth
- [ ] （可选）已启动 API 服务器
- [ ] （可选）已更新定时任务

---

Happy upgrading! 🚀
