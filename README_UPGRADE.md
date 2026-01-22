# 🚀 AI 市场机会监控系统 v2.0 - 升级版

## 📋 项目概述

这是一套**完整的 AI 市场监控系统**，能够 24 小时自动运行，主动发现全球 AI 市场机会、融资项目、技术突破和创业趋势。

### ✨ 核心特性

| 特性 | 说明 |
|------|------|
| **双引擎架构** | 痛点雷达 + 机会猎手 |
| **多数据源** | Twitter、GitHub、Reddit、Product Hunt、Hugging Face、Y Combinator、Google Trends |
| **智能去重** | MD5 指纹 + 语义相似度 + 时间窗口 |
| **关键词配置** | 独立 YAML 文件，随时修改 |
| **Docker 部署** | 一键部署到任何服务器 |
| **低成本运营** | ~$1.5/月 API 成本 |
| **完全隐私** | 本地存储，无数据上传 |

## 🏗️ 项目结构

```
market_monitor_v2/
├── pain_radar_v2.py              # 痛点雷达模块
├── opportunity_hunter.py         # 机会猎手模块
├── rss_hunter.py                 # RSS 数据源模块（新增）
├── config_loader.py              # 关键词配置加载器（新增）
├── run_monitor.py                # 主启动器
├── run_monitor.sh                # Shell 启动脚本
│
├── config/
│   └── keywords.yaml             # 关键词配置文件（新增）
│
├── docker-compose.yml            # Docker Compose 配置（新增）
├── Dockerfile                    # Docker 镜像定义（新增）
├── .env.example                  # 环境变量示例（新增）
├── .gitignore                    # Git 忽略文件（新增）
│
├── requirements.txt              # Python 依赖
├── README.md                     # 原始文档
├── README_UPGRADE.md             # 升级版文档（本文件）
├── DOCKER_DEPLOYMENT.md          # Docker 部署指南（新增）
│
└── my_market_brain/              # 数据目录（自动创建）
    ├── pain_points_v2/
    ├── opportunities_v2/
    └── chroma.db
```

## 🎯 新增功能

### 1. RSS 数据源（无需 API Key）

新增 `rss_hunter.py` 模块，支持以下免费数据源：

| 数据源 | 说明 | 关键词 |
|-------|------|-------|
| **Reddit** | 社区讨论 | LocalLLaMA, OpenAI, Claude, Cursor |
| **Product Hunt** | 新产品发布 | AI, 自动化, 生产力 |
| **Hugging Face** | 最新论文 | Agent, Browser Use, Optimization |
| **Y Combinator** | 创业融资 | AI, 机器学习, 自动化 |
| **Google Trends** | 热搜趋势 | AI, ChatGPT, 机器学习 |

### 2. 关键词独立配置

新增 `config/keywords.yaml` 文件，支持：

- 按产品分类的痛点关键词
- 按平台分类的机会关键词
- 优先级配置（高/中/低）
- 排除词配置
- 平台特定参数

**修改关键词无需重启系统**，直接编辑 YAML 文件即可。

### 3. Docker Compose 部署

完整的 Docker 支持：

- 一键部署到 Debian 12 或任何 Linux 服务器
- 自动数据持久化
- 健康检查和自动重启
- 资源限制和日志轮转
- 支持代理和自定义网络

### 4. 配置加载器

新增 `config_loader.py` 模块，支持：

- 动态加载 YAML 配置
- 添加/删除关键词
- 导出为 JSON
- 配置缓存和热重载

## 🚀 快速开始

### 本地运行（开发）

```bash
# 1. 进入目录
cd market_monitor_v2

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
nano .env

# 4. 运行一次
python3 run_monitor.py --all

# 5. 查看报告
ls -la reports/
```

### Docker 部署（生产）

```bash
# 1. 进入目录
cd market_monitor_v2

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 启动容器
docker compose up -d

# 4. 查看日志
docker compose logs -f market-monitor

# 5. 查看报告
docker compose exec market-monitor ls -la reports/
```

详见 [Docker 部署指南](./DOCKER_DEPLOYMENT.md)

## 📊 关键词配置

### 编辑关键词

```bash
# 编辑配置文件
nano config/keywords.yaml
```

### 添加新关键词

```yaml
pain_radar:
  chatgpt:
    - "your_new_keyword"
```

### 删除关键词

直接从 YAML 文件中删除即可。

### 使用 Python API

```python
from config_loader import ConfigLoader

loader = ConfigLoader()

# 添加关键词
loader.add_keyword('pain_radar', 'chatgpt', 'new_keyword')

# 删除关键词
loader.remove_keyword('pain_radar', 'chatgpt', 'old_keyword')

# 导出配置
loader.export_to_json('keywords.json')
```

## 🔄 运行模式

### 模式 1: 手动运行

```bash
python3 run_monitor.py --all
```

适合测试和调试。

### 模式 2: 定时运行（推荐）

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天 6:30 运行）
30 6 * * * cd /path/to/market_monitor_v2 && python3 run_monitor.py --all
```

### 模式 3: 守护进程

```bash
python3 run_monitor.py --daemon --interval 3600
```

后台持续运行，每小时执行一次。

### 模式 4: Docker 容器

```bash
docker compose up -d
```

容器默认每小时运行一次，可通过修改 `docker-compose.yml` 调整。

## 📈 监控数据源

### 痛点雷达

监控用户吐槽，发现市场机会：

```
Twitter/HN 用户吐槽 
    ↓
AI 诊断痛点类型
    ↓
生成市场机会分析
    ↓
推送 Word 报告 + 微信
```

### 机会猎手

监控融资和技术，发现创业趋势：

```
GitHub/HN/RSS 新闻
    ↓
AI 分析商业价值
    ↓
识别投资信号
    ↓
推送 Word 报告 + 微信
```

## 💰 成本分析

| 项目 | 成本 | 说明 |
|------|------|------|
| Gemini API | ~$1.5/月 | 免费额度内 |
| Twitter API | 免费 | 需付费账户 |
| GitHub API | 免费 | 无限制 |
| RSS 源 | 免费 | 无需 API Key |
| PushPlus | 免费 | 微信推送 |
| 服务器 | 0-5$/月 | 可选 |
| **总计** | **$1.5-6.5/月** | **极低成本** |

## 🔐 隐私与安全

- ✅ 所有数据存储在本地
- ✅ 不上传个人信息到云端
- ✅ 仅通过 PushPlus 推送摘要
- ✅ API 密钥存储在 `.env` 文件（不提交到 Git）
- ✅ 支持代理和 VPN

## 📚 文档

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | 原始文档 |
| [README_UPGRADE.md](./README_UPGRADE.md) | 升级版文档（本文件） |
| [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) | Docker 部署指南 |
| [config/keywords.yaml](./config/keywords.yaml) | 关键词配置文件 |

## 🛠️ 故障排除

### 容器无法启动

```bash
docker compose logs market-monitor
```

### 没有生成报告

```bash
# 检查 API 密钥
cat .env | grep GEMINI_API_KEY

# 手动运行测试
docker compose exec market-monitor python3 run_monitor.py --all
```

### 内存不足

编辑 `docker-compose.yml`，增加 `memory` 限制。

### 网络连接问题

```bash
# 测试网络
docker compose exec market-monitor curl -I https://www.google.com

# 检查代理设置
cat .env | grep PROXY
```

## 🎓 学习资源

- [Gemini API 文档](https://ai.google.dev/)
- [ChromaDB 文档](https://docs.trychroma.com/)
- [Docker 官方文档](https://docs.docker.com/)
- [YAML 语法](https://yaml.org/spec/1.2/spec.html)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 更新日志

### v2.0 (2026-01-22)

- ✨ 新增 RSS 数据源（Reddit、Product Hunt、Hugging Face、Y Combinator）
- ✨ 新增关键词独立配置文件（YAML）
- ✨ 新增 Docker Compose 部署支持
- ✨ 新增配置加载器和热重载
- 📚 完整的 Docker 部署指南
- 🐛 多项 Bug 修复和性能优化

### v1.0 (2026-01-22)

- 初始版本
- 痛点雷达和机会猎手模块
- Twitter、GitHub、Hacker News 支持

## 📞 联系方式

- **作者**: 电动面包
- **邮箱**: your-email@example.com
- **GitHub**: https://github.com/your-username/market-monitor

## 📄 许可证

MIT License

---

**最后更新**: 2026-01-22  
**版本**: 2.0  
**状态**: 生产就绪 ✅

祝你使用愉快！🚀
