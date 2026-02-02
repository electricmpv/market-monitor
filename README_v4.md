# Market Monitor v4.0 - 实施指南

> AI 市场机会监控系统 - 升级版
> 新增功能: LLM 升级 + GitHub OAuth + Web 管理界面 + 语雀报告 + Telegram 通知

---

## 🎯 核心升级内容

### ✅ 已完成的核心模块

1. **LLM 客户端** (`llm_client.py`)
   - 支持 OpenAI/Claude/DeepSeek
   - 统一接口，易于切换
   - 自动重试和错误处理

2. **语雀报告生成器** (`yuque_report_generator.py`)
   - 自动创建精美 Markdown 报告
   - 自动管理知识库
   - 支持目录、表格、链接

3. **Telegram 通知器** (`telegram_notifier.py`)
   - 实时推送监控结果
   - 支持紧急提醒
   - Markdown 格式支持

4. **FastAPI 后端** (`api/`)
   - GitHub OAuth 认证
   - JWT Token 管理
   - 完整的配置管理 API
   - 关键词/博主管理 API
   - 报告查询 API

5. **监控引擎升级**
   - `pain_radar_v2.py` 已适配新 LLM
   - `opportunity_hunter.py` 已适配新 LLM
   - 集成语雀和 Telegram

---

## 📋 准备工作（必须完成）

### 0.1 获取 Telegram Chat ID (5分钟)

```bash
# 1. 先给 Bot 发送 /start 消息
# Bot 地址: @bigBread_NEWBOT

# 2. 运行以下命令获取 Chat ID:
curl "https://api.telegram.org/bot8495761885:AAFoQqcBHw46ybJFHdeKLz02zw22RsO4nFc/getUpdates" | python3 -c "import sys, json; data=json.load(sys.stdin); print('Chat ID:', data['result'][-1]['message']['chat']['id'] if data['result'] else 'No messages')"

# 3. 将获取的 Chat ID 填入 .env 文件
```

### 0.2 创建 GitHub OAuth App (10分钟)

1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写信息:
   - Application name: `Market Monitor`
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/api/auth/callback`
   - Description: `AI 市场机会监控系统`
4. 创建后获取:
   - Client ID (立即显示)
   - Client Secret (点击 "Generate a new client secret" 生成)
5. **重要**: 保存 Client Secret（仅显示一次！）

### 0.3 生成 JWT Secret (1分钟)

```bash
# 使用 OpenSSL 生成随机密钥
openssl rand -hex 32

# 或者使用 Python
python3 -c "import secrets; print(secrets.token_hex(32))"

# 将生成的密钥填入 .env 文件的 JWT_SECRET
```

### 0.4 选择 LLM 提供商并获取 API Key (10分钟)

推荐选项（按性价比排序）:

1. **DeepSeek** (推荐 - 性价比最高)
   - 访问: https://platform.deepseek.com/
   - 注册并获取 API Key
   - 成本: ~$0.1-0.5/月

2. **OpenAI** (GPT-4/3.5)
   - 访问: https://platform.openai.com/api-keys
   - 成本: ~$0.5-5/月

3. **Anthropic** (Claude)
   - 访问: https://console.anthropic.com/
   - 成本: ~$3-5/月

---

## 🔧 安装步骤

### 步骤 1: 克隆项目（如果尚未克隆）

```bash
git clone https://github.com/your-repo/market-monitor.git
cd market-monitor
git checkout feature/llm-upgrade
```

### 步骤 2: 安装 Python 依赖

```bash
# 创建虚拟环境（可选但推荐）
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装所有依赖
pip install -r requirements.txt
```

### 步骤 3: 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，填写以下必需的配置:
nano .env
```

**必填配置**:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=<your_github_oauth_client_id>
GITHUB_CLIENT_SECRET=<your_github_oauth_client_secret>
GITHUB_ALLOWED_USERS=electricmpv  # 你的 GitHub 用户名

# JWT Secret
JWT_SECRET=<使用步骤0.3生成的密钥>

# 前端 URL
FRONTEND_URL=https://your-domain.com  # 或 http://localhost:3000 (开发环境)

# LLM 配置
LLM_PROVIDER=deepseek  # 或 openai, anthropic
DEEPSEEK_API_KEY=sk-...  # 对应提供商的 API Key

# Telegram
TELEGRAM_CHAT_ID=<步骤0.1获取的Chat ID>

# 语雀（使用默认值或替换为你的）
YUQUE_TOKEN=EmucIYlJro7ic4O4ZS6UujQZm89tXmwor7PwNYmL
YUQUE_NAMESPACE=diandongmianbao
```

### 步骤 4: 创建必要的目录

```bash
mkdir -p reports config my_market_brain
```

---

## 🚀 运行系统

### 启动 API 服务器

```bash
# 方式 1: 使用启动脚本（推荐）
./start_server.sh

# 方式 2: 直接使用 uvicorn
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

服务启动后访问:
- API 文档: http://localhost:8000/docs
- API 端点: http://localhost:8000/api/

### 手动运行监控引擎

```bash
# 运行痛点扫描
python pain_radar_v2.py

# 运行机会猎手
python opportunity_hunter.py
```

### 完整工作流测试

```bash
# 1. 测试 LLM 客户端
python3 -c "from llm_client import LLMClient; llm = LLMClient(provider='deepseek'); print(llm.analyze('测试: ChatGPT太贵了'))"

# 2. 测试 Telegram 通知
python3 -c "import asyncio; from telegram_notifier import TelegramNotifier; notifier = TelegramNotifier(); asyncio.run(notifier.send_alert('测试', '这是一条测试消息'))"

# 3. 测试完整流程
python pain_radar_v2.py
```

---

## 🌐 部署到生产环境（使用 1panel）

### 前置要求

1. 服务器已安装 1panel
2. 已配置域名和 SSL 证书
3. 已开放端口 8000 或配置反向代理

### Nginx 反向代理配置（在 1panel 中）

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书（1panel 自动管理）
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 代理到 FastAPI
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP 强制跳转 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 使用 systemd 管理服务

```bash
# 创建服务文件
sudo nano /etc/systemd/system/market-monitor.service
```

内容:

```ini
[Unit]
Description=Market Monitor API Service
After=network.target

[Service]
Type=simple
User=git01
WorkingDirectory=/home/git01/market-monitor
Environment="PATH=/home/git01/market-monitor/venv/bin"
ExecStart=/home/git01/market-monitor/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable market-monitor
sudo systemctl start market-monitor
sudo systemctl status market-monitor
```

---

## 📊 API 使用示例

### 认证流程

1. 访问 `https://your-domain.com/api/auth/login`
2. 授权 GitHub 登录
3. 获取 JWT Token（自动存储在前端）
4. 后续请求携带 Token: `Authorization: Bearer <token>`

### API 端点示例

```bash
# 验证 Token
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/auth/verify

# 获取 LLM 配置
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/config/llm

# 保存 LLM 配置
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"provider":"deepseek","api_key":"sk-..."}' \
  https://your-domain.com/api/config/llm

# 获取关键词列表
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/keywords

# 添加关键词
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"AI Agent","category":"pain","product":"ChatGPT"}' \
  https://your-domain.com/api/keywords

# 获取报告列表
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/reports
```

---

## 🔍 故障排查

### 1. GitHub OAuth 登录失败

**症状**: 点击登录后跳转到 GitHub，但授权后出错

**可能原因**:
- GitHub OAuth App 的回调 URL 配置错误
- HTTPS 未启用（OAuth 要求 HTTPS）
- Client ID 或 Client Secret 错误

**解决方案**:
```bash
# 1. 检查 GitHub OAuth App 配置
# 回调 URL 必须是: https://your-domain.com/api/auth/callback

# 2. 检查环境变量
cat .env | grep GITHUB

# 3. 检查 FastAPI 日志
# 查看是否有 OAuth 相关错误
```

### 2. Telegram 通知失败

**症状**: `TELEGRAM_CHAT_ID 未设置` 错误

**解决方案**:
```bash
# 1. 确保已给 Bot 发送过消息
# 2. 重新获取 Chat ID（见步骤 0.1）
# 3. 检查 .env 文件
cat .env | grep TELEGRAM_CHAT_ID
```

### 3. LLM 调用失败

**症状**: `LLM调用失败` 错误

**解决方案**:
```bash
# 1. 检查 API Key
python3 -c "from llm_client import LLMClient; llm = LLMClient(provider='deepseek'); print(llm.analyze('test'))"

# 2. 检查网络连接
curl https://api.deepseek.com/v1/models

# 3. 检查余额（如果使用付费 API）
```

### 4. 语雀报告生成失败

**症状**: `语雀文档创建失败` 错误

**可能原因**:
- YUQUE_TOKEN 无效或过期
- YUQUE_NAMESPACE 不正确
- 知识库不存在

**解决方案**:
```bash
# 1. 验证 Token
curl -H "X-Auth-Token: $YUQUE_TOKEN" \
  https://www.yuque.com/api/v2/user

# 2. 检查知识库
curl -H "X-Auth-Token: $YUQUE_TOKEN" \
  https://www.yuque.com/api/v2/users/$YUQUE_NAMESPACE/repos
```

---

## 📈 下一步（可选）

### 开发前端界面

前端尚未实现，需要:

1. 创建 React 项目
2. 实现登录页面
3. 实现配置中心
4. 实现关键词/博主管理
5. 实现报告中心

详细步骤请参考原计划文档。

### 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天 10:00 运行痛点扫描，14:00 运行机会猎手）
0 10 * * * cd /home/git01/market-monitor && /home/git01/market-monitor/venv/bin/python pain_radar_v2.py
0 14 * * * cd /home/git01/market-monitor && /home/git01/market-monitor/venv/bin/python opportunity_hunter.py
```

---

## 📝 更新日志

### v4.0 (2024-02-02)

**新增功能**:
- ✅ LLM 客户端（支持 OpenAI/Claude/DeepSeek）
- ✅ 语雀报告生成器
- ✅ Telegram 通知
- ✅ GitHub OAuth 认证
- ✅ FastAPI 后端 API
- ✅ JWT Token 管理
- ✅ 配置管理 API
- ✅ 关键词/博主管理 API
- ✅ 报告查询 API

**移除功能**:
- ❌ Gemini API（已替换为统一 LLM 客户端）
- ❌ PushPlus 推送（已替换为 Telegram）

**升级内容**:
- 📦 `pain_radar_v2.py` 适配新 LLM
- 📦 `opportunity_hunter.py` 适配新 LLM
- 📦 `requirements.txt` 更新依赖
- 📦 `.env.example` 更新配置模板

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

---

## 📄 许可证

MIT License

---

## 📧 联系方式

- GitHub: [@electricmpv](https://github.com/electricmpv)
- 问题反馈: [GitHub Issues](https://github.com/electricmpv/market-monitor/issues)
