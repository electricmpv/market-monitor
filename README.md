# 🎯 AI Market Hunter v3.0

> **24小时自动发现市场机会的智能系统**  
> 三雷达 + 三层过滤 + 五维评分 + 学习回路

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/electricmpv/market-monitor)

---

## 📖 项目简介

**AI Market Hunter** 是一套为 Solopreneur 打造的市场机会监控系统。它通过 AI 自动分析全球技术社区的信息，帮助你发现：

- 💡 **真实的市场痛点** - 用户在 Twitter/Reddit 上的抱怨
- 🔬 **前沿技术趋势** - GitHub/Hugging Face 上的新技术
- 💰 **融资动态** - Y Combinator/Product Hunt 上的热门项目

系统会自动过滤噪音，只推送**高质量、适合单人创业**的机会。

---

## ✨ 核心特性

### 🎯 三雷达架构

| 雷达 | 功能 | 数据源 |
|------|------|--------|
| **痛点猎手** | 发现用户抱怨和市场需求 | **Twitter (BYOC)**, Reddit, Hacker News |
| **技术侦察** | 追踪前沿技术和开源项目 | GitHub, Hugging Face |
| **融资监控** | 监控创业动态和融资信息 | Y Combinator, Product Hunt |

### 🔍 三层过滤系统

```
Layer 0: 硬过滤
  ↓ 语言/长度/黑名单/最低热度
Layer 1: LLM 语义分析
  ↓ 相关性/情感/意图识别
Layer 2: 主题聚类 + 跨平台共识
  ↓ 去重/聚合/共识检测
```

### 📊 五维评分系统

- **加速度 (Velocity)**: 话题热度增长速度
- **共识度 (Consensus)**: 跨平台讨论一致性
- **可信度 (Credibility)**: 来源权威性
- **适合度 (Solopreneur Fit)**: 单人可做性
- **新颖度 (Novelty)**: 创新程度

### 🧠 三人格 AI 分析

每个机会都会由三个 AI 人格分析：

1. **毒舌 PM** - 从产品角度看市场需求
2. **技术大牛** - 从技术角度看可行性
3. **VC 分析师** - 从投资角度看商业价值

### 🔄 学习回路

系统会根据你的操作（收藏/跳过/标记要做）自动学习你的偏好，越用越懂你。

### 🤖 动态 LLM 配置

支持任意 LLM 提供商，无需硬编码：

- **搜索引擎 (快速)**: 用于快速过滤和语义分析 (推荐 Gemini Flash / DeepSeek)
- **报告引擎 (深度)**: 用于深度分析和报告生成 (推荐 Gemini Pro / Claude)
- **支持的提供商**: OpenAI, Gemini, DeepSeek, Anthropic, 自定义
- **前端配置**: 在设置页面填入 Base URL、API Key、模型名称即可

### 🐦 Twitter BYOC (Bring Your Own Cookie)

无需付费 API，使用你自己的 Twitter Cookies 抓取 KOL 推文：

- **零成本**: 不需要 Twitter Enterprise API ($42,000/月)
- **高质量**: 直接抓取你关注的 KOL 列表
- **安全**: Cookies 存储在你的数据库，不会泄露
- **简单**: 使用 EditThisCookie 插件导出，粘贴到设置页面即可

---

## 🚀 快速开始

### 前置要求

- Docker 24.0+
- Docker Compose 2.20+
- 2GB+ RAM
- 10GB+ 存储空间

### 一键部署 (5 分钟)

```bash
# 1. 克隆项目
git clone https://github.com/electricmpv/market-monitor.git
cd market-monitor

# 2. 配置环境变量
cp .env.example .env
nano .env  # 填入你的 API Keys

# 3. 启动服务
docker compose up -d

# 4. 查看日志
docker compose logs -f market-monitor

# 5. 访问系统
# 打开浏览器: http://your-server-ip:3000
```

### 环境变量配置

在 `.env` 文件中配置以下变量：

```env
# 数据库 (使用外部 MySQL/TiDB)
DATABASE_URL=mysql://user:password@host:3306/database?ssl=true

# 微信推送 (PushPlus)
PUSHPLUS_TOKEN=your_pushplus_token

# JWT Secret (随机字符串)
JWT_SECRET=your_random_jwt_secret

# 时区
TZ=America/Los_Angeles
```

**重要提示**: 
- **LLM API Keys** 不需要在 `.env` 中配置，在前端设置页面的 **"模型"** 标签页中配置
- **Twitter Cookies** 在前端设置页面的 **"Twitter"** 标签页中配置

**获取 API Key:**
- **PushPlus**: https://www.pushplus.plus
- **LLM API Keys**: 在设置页面配置，支持 OpenAI/Gemini/DeepSeek/Anthropic 等任意提供商

---

## 📱 使用指南

### 1. 首次使用

1. 访问系统并登录
2. 进入**设置页面**
3. **配置 LLM 模型** (模型标签页):
   - 搜索引擎: 填入 Base URL、API Key、模型名称
   - 报告引擎: 填入 Base URL、API Key、模型名称
   - 点击“测试连接”验证，然后保存
4. **配置 Twitter Cookies** (Twitter 标签页, 可选):
   - 使用 [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg) 插件导出 Cookies
   - 粘贴到 Twitter Cookies 输入框
   - 点击保存
5. **初始化种子数据** (初始化标签页) - 导入预设的关键词和 KOL
6. 返回**控制台**，点击**同步数据** - 获取最新信息
7. 点击**AI 分析** - 开始智能分析

### 2. 查看机会

- **桌面端**: 三列布局，分别显示痛点/技术/融资
- **移动端**: 顶部 Tabs 切换不同雷达

每个机会卡片显示：
- 标题和摘要
- 五维评分
- 来源数量
- 操作按钮（有趣/要做/跳过）

### 3. 深度分析

点击任意机会卡片，查看：
- 三人格 AI 分析（PM/技术/VC 视角）
- 详细的五维评分
- 相关链接和来源

### 4. 自定义关键词

编辑 `config/keywords.yaml` 文件：

```yaml
track1_pain_hunter:
  - keyword: "your new keyword"
    category: your_category
```

修改后重启容器：

```bash
docker compose restart market-monitor
```

### 5. 推送设置

在**设置页面**配置：
- 推送时间（默认 08:30）
- 推送内容（新机会/要做列表）
- 测试推送

---

## 🎨 UI 设计

### Modern Emerald 主题

- **主色调**: 祖母绿 (Emerald) - 代表增长和机会
- **强调色**: 青柠绿 (Lime) - 高亮重要信息
- **质感**: 玻璃拟态 (Glassmorphism) - 现代感
- **字体**: 等宽数字 - 专业感

### 响应式设计

- **桌面端** (≥768px): 三列网格布局
- **移动端** (<768px): Tabs 切换布局
- **卡片**: 自适应高度，隐藏次要信息

---

## 🛠️ 技术栈

### 前端
- **React 19** - UI 框架
- **Tailwind CSS 4** - 样式系统
- **shadcn/ui** - 组件库
- **tRPC** - 类型安全的 API 调用

### 后端
- **Node.js 22** - 运行时
- **Express 4** - Web 框架
- **Drizzle ORM** - 数据库 ORM
- **MySQL/TiDB** - 数据库

### AI & 数据
- **Gemini API** - LLM 分析
- **ChromaDB** - 向量数据库（去重）
- **RSS Parser** - 数据采集

### 部署
- **Docker** - 容器化
- **Docker Compose** - 编排

---

## 📊 数据源

| 平台 | 用途 | 频率 |
|------|------|------|
| **Hacker News** | 技术讨论、创业动态 | 每小时 |
| **GitHub Trending** | 热门开源项目 | 每天 |
| **Reddit** | 社区讨论、痛点 | 每小时 |
| **Product Hunt** | 新产品发布 | 每天 |
| **Hugging Face** | AI 论文、模型 | 每天 |
| **Y Combinator** | 创业融资 | 每天 |

---

## 💰 成本估算

| 项目 | 月成本 |
|------|--------|
| Gemini API (Flash) | ~$1.5 |
| Gemini API (Pro) | ~$2.0 |
| 服务器 (可选) | $0-5 |
| **总计** | **$3.5-8.5/月** |

---

## 🔧 运维命令

```bash
# 查看日志
docker compose logs -f market-monitor

# 重启服务
docker compose restart market-monitor

# 停止服务
docker compose down

# 更新代码并重新部署
git pull
docker compose up -d --build

# 查看容器状态
docker compose ps

# 进入容器调试
docker compose exec market-monitor sh

# 备份数据
tar -czvf backup-$(date +%Y%m%d).tar.gz ./data ./logs

# 恢复数据
tar -xzvf backup-20260123.tar.gz
```

---

## 📁 项目结构

```
market-monitor/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # UI 组件
│   │   └── lib/           # 工具函数
│   └── public/            # 静态资源
├── server/                # 后端代码
│   ├── services/          # 业务逻辑
│   │   ├── dataCollector.ts    # 数据采集
│   │   ├── filterEngine.ts     # 三层过滤
│   │   ├── aiAnalyzer.ts       # AI 分析
│   │   ├── learningLoop.ts     # 学习回路
│   │   └── pushService.ts      # 推送服务
│   ├── routers.ts         # API 路由
│   └── db.ts              # 数据库查询
├── drizzle/               # 数据库 Schema
├── config/                # 配置文件
│   └── keywords.yaml      # 关键词配置
├── docker-compose.yml     # Docker 编排
├── Dockerfile             # Docker 镜像
└── README.md              # 本文件
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [Gemini API](https://ai.google.dev/) - AI 分析能力
- [shadcn/ui](https://ui.shadcn.com/) - 优秀的 UI 组件
- [Tailwind CSS](https://tailwindcss.com/) - 强大的样式系统
- [tRPC](https://trpc.io/) - 类型安全的 API

---

## 📮 联系方式

- **GitHub**: [@electricmpv](https://github.com/electricmpv)
- **项目主页**: https://github.com/electricmpv/market-monitor
- **Issue 反馈**: https://github.com/electricmpv/market-monitor/issues

---

## 🎯 路线图

- [ ] 支持更多数据源 (Twitter API, Discord)
- [ ] 增加数据可视化 (趋势图、热力图)
- [ ] 支持多用户协作
- [ ] 移动端 App (React Native)
- [ ] Chrome 插件 (快速标记)

---

**AI Market Hunter v3.0** - 让 AI 成为你的 24 小时市场雷达 🚀

---

## 📸 截图

### 控制台 - 桌面端
![Dashboard Desktop](https://via.placeholder.com/800x450?text=Dashboard+Desktop)

### 控制台 - 移动端
![Dashboard Mobile](https://via.placeholder.com/400x700?text=Dashboard+Mobile)

### 设置页面
![Settings](https://via.placeholder.com/800x450?text=Settings+Page)

---

**Made with ❤️ by [@electricmpv](https://github.com/electricmpv)**
