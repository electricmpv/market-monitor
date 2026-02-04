# 🎯 AI Market Monitor

> 🤖 智能化的 AI 市场机会监控系统 - 自动采集、深度分析、智能推送

[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Bird CLI](https://img.shields.io/badge/Twitter-Bird%20CLI-1DA1F2.svg)](https://github.com/steipete/bird)
[![Codex](https://img.shields.io/badge/AI-Codex%20CLI-purple.svg)](https://codex.sh)

## 📖 项目简介

AI Market Monitor 是一个全自动的市场机会监控系统，专注于 AI 领域的市场洞察。系统通过多源数据采集、AI 深度分析和自动报告生成，帮助独立开发者和小团队快速发现市场机会。

### 🌟 核心特性

- ✅ **多源数据采集**
  - 🐦 Twitter/X（使用 [Bird CLI](https://github.com/steipete/bird)）
  - 📱 Reddit（技术社区热门讨论）
  - 🐙 GitHub Trending（趋势项目）
  - 📰 Hacker News（社区热门）

- ✅ **智能分析引擎**
  - 🧠 集成 Codex CLI（GPT-4/o3）
  - 📊 多维度市场洞察
  - 💡 机会评分与可行性分析
  - 🎯 用户痛点深度挖掘

- ✅ **自动化工作流**
  - ⏰ 定时任务支持（cron）
  - 📄 自动生成精美报告
  - 🔗 一键推送到语雀知识库
  - 📧 支持多渠道通知

### 🎨 报告示例

生成的报告包含：
- **核心发现**：TOP 3 市场洞察（带评分）
- **用户痛点分析**：按产品/领域分类，标注严重程度
- **市场机会识别**：4+ 个可执行机会方向（含 MVP 路线图）
- **技术趋势追踪**：GitHub 项目推荐和技术栈分析
- **多视角点评**：产品经理、技术专家、投资人三重视角

📍 **示例报告**：[查看最新报告](https://www.yuque.com/diandongmianbao/cg40cd)

---

## 🚀 快速开始

### 前置要求

- Python 3.11+
- Node.js 16+（用于 Bird CLI）
- Git
- 已登录 Twitter 的浏览器（Chrome/Firefox）

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/market-monitor.git
cd market-monitor
```

#### 2. 安装 Python 依赖

```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. 安装 Bird CLI（Twitter 采集工具）

```bash
npm install -g @steipete/bird
```

#### 4. 安装 browser-use（可选，用于提取 cookies）

```bash
pip install "browser-use[cli]"
browser-use install
```

#### 5. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的配置
```

**必需配置**：

```env
# Twitter Bird CLI 认证
AUTH_TOKEN=your_twitter_auth_token
CT0=your_twitter_ct0_token

# 语雀 API（用于报告推送）
YUQUE_TOKEN=your_yuque_token
YUQUE_NAMESPACE=your_namespace
YUQUE_REPO_SLUG=your_repo_slug
```

#### 6. 提取 Twitter Cookies

使用 browser-use 自动提取（推荐）：

```bash
# 确保 Chrome 已登录 Twitter
source venv/bin/activate
browser-use --browser real open https://x.com
browser-use cookies get --url https://x.com
```

从输出中找到 `auth_token` 和 `ct0` 两个值，复制到 `.env` 文件。

---

## 📚 使用方法

### 方式一：一键执行（推荐）

运行完整工作流（采集 → 分析 → 推送）：

```bash
source venv/bin/activate
python3 run_workflow.py
```

### 方式二：分步执行

#### 1. 数据采集

```bash
python3 multi_source_collector.py
```

输出：`/tmp/market_data_YYYYMMDD_HHMMSS.json`

#### 2. Codex 分析（需要 Codex CLI）

```bash
# 安装 Codex CLI（如果未安装）
# 参考：https://codex.sh

python3 /tmp/run_codex_analysis.py
```

输出：`/tmp/codex_analysis.md`

#### 3. 推送到语雀

```bash
python3 /tmp/push_to_yuque.py
```

### 方式三：定时任务

设置每日自动执行（9:00 和 15:00）：

```bash
bash setup_cron.sh
```

或手动配置 crontab：

```bash
crontab -e
```

添加：

```cron
0 9 * * * cd /home/git01/market-monitor && source venv/bin/activate && python3 run_workflow.py >> /tmp/market-monitor.log 2>&1
0 15 * * * cd /home/git01/market-monitor && source venv/bin/activate && python3 run_workflow.py >> /tmp/market-monitor.log 2>&1
```

---

## 🔧 配置说明

### 数据源配置

#### Twitter/X（Bird CLI）

- **优点**：快速、稳定、无需 API Key
- **限制**：仅用于只读操作，不要发推文
- **配置**：需要 `AUTH_TOKEN` 和 `CT0` cookies

#### Reddit

- **当前模式**：公共 RSS Feed（无需认证）
- **可选**：配置 Reddit API 获取更多数据

#### GitHub Trending

- **模式**：公开 API（无需认证）
- **采集**：Python、TypeScript、JavaScript 趋势项目

#### Hacker News

- **模式**：Official API（无需认证）
- **采集**：热门故事和评论

### 关键词与博主配置

#### 高信噪比关键词

编辑 `config/high_signal_keywords.yaml`：

```yaml
strong_pain_signals:
  frustration:
    - "so frustrating"
    - "driving me crazy"
  unmet_needs:
    - "looking for alternative"
    - "need something that"
```

#### 高质量博主列表

编辑 `config/influencers.yaml`：

```yaml
ai_researchers:
  - name: "Andrej Karpathy"
    twitter: "@karpathy"
    priority: "high"
```

---

## 📂 项目结构

```
market-monitor/
├── config/                      # 配置文件
│   ├── data_sources.yaml       # 数据源配置
│   ├── influencers.yaml        # 博主列表
│   ├── high_signal_keywords.yaml  # 高信噪比关键词
│   └── codex_analysis_prompt.yaml # Codex 提示词模板
│
├── data_collectors/            # 数据采集器
│   ├── __init__.py
│   ├── twitter_bird_collector.py  # Twitter（Bird CLI）
│   ├── reddit_collector.py     # Reddit
│   └── github_collector.py     # GitHub
│
├── multi_source_collector.py   # 多源采集管理器
├── run_workflow.py             # 完整工作流入口
├── enhanced_config_loader.py   # 配置加载器
├── yuque_report_generator.py   # 语雀报告生成器
├── push_deep_report_to_yuque.py # 语雀推送工具
│
├── requirements.txt            # Python 依赖
├── .env.example               # 环境变量模板
├── .gitignore                 # Git 忽略规则
├── README.md                  # 项目说明（本文件）
├── USAGE_GUIDE.md            # 详细使用指南
└── setup_cron.sh              # Cron 配置脚本
```

---

## 🛠️ 技术栈

### 数据采集

- **Bird CLI** - Twitter/X 数据采集
- **PRAW** - Reddit API
- **BeautifulSoup4** - HTML 解析
- **Requests** - HTTP 客户端

### 分析引擎

- **Codex CLI** - AI 深度分析
- **GPT-4 / o3** - 大语言模型

### 自动化

- **Python 3.11+**
- **Cron** - 定时任务
- **dotenv** - 环境变量管理

### 推送与通知

- **语雀 API** - 知识库推送
- **Markdown** - 报告格式

---

## 📊 数据采集说明

### Twitter 采集（Bird CLI）

Bird CLI 是一个快速、安全的 X/Twitter CLI 工具：

- ✅ **优势**：
  - 99.8% 可靠性（官方测试）
  - 无需 API Key
  - 使用浏览器 cookies 认证
  - JSON 输出，易于解析

- ⚠️ **注意事项**：
  - **仅用于只读操作**（搜索、读取时间线）
  - **不要用于发推文**（有封号风险）
  - Cookie 需定期更新

- 📚 **相关资源**：
  - [Bird GitHub](https://github.com/steipete/bird)
  - [Bird 文档](https://bird.fast/)

### 采集策略

#### 关键词搜索

系统使用高信噪比关键词：
- 痛点信号：`ChatGPT expensive`, `ChatGPT slow`
- 需求信号：`need AI tool`, `looking for alternative`
- 质量信号：`ChatGPT hallucination`

#### 博主监控

关注 AI 领域高质量博主：
- AI 研究者（Karpathy、LeCun、Andrew Ng 等）
- 开发者工具专家
- AI 创业者

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献方向

- 🔹 添加新的数据源
- 🔹 优化 Codex 分析提示词
- 🔹 改进报告格式
- 🔹 添加新的通知渠道
- 🔹 提升采集效率

---

## 📝 更新日志

### v2.0.0 (2026-02-04)

- ✨ **重大更新**：使用 Bird CLI 替换 twikit
- ✨ 新增：Codex CLI 深度分析集成
- ✨ 新增：语雀知识库自动推送
- ✨ 新增：高信噪比关键词配置
- ✨ 新增：完整的使用指南文档
- 🐛 修复：Twitter 采集稳定性问题
- 🎨 优化：报告格式和可读性

### v1.0.0

- 🎉 初始版本发布

---

## ❓ 常见问题

### Q: Bird CLI 提示 "Missing credentials"？

A: 确保 `.env` 文件中配置了 `AUTH_TOKEN` 和 `CT0`。可以使用 browser-use 工具从浏览器中提取。

### Q: Codex 分析失败？

A: 检查 Codex CLI 是否正确安装和配置。某些模型（如 o3）需要特定的账户类型。

### Q: 语雀推送失败？

A: 检查 `YUQUE_TOKEN`、`YUQUE_NAMESPACE` 和 `YUQUE_REPO_SLUG` 是否正确配置。

### Q: Twitter 账号会被封吗？

A: Bird CLI 仅用于只读操作（搜索、读取），风险极低。**不要使用它发推文**。

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [Bird CLI](https://github.com/steipete/bird) - 优秀的 Twitter CLI 工具
- [Codex CLI](https://codex.sh) - 强大的 AI 分析引擎
- [语雀](https://www.yuque.com) - 知识库平台

---

## 📧 联系方式

- **作者**：电动面包
- **GitHub**：[@YOUR_USERNAME](https://github.com/YOUR_USERNAME)
- **问题反馈**：[GitHub Issues](https://github.com/YOUR_USERNAME/market-monitor/issues)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by 电动面包

</div>
