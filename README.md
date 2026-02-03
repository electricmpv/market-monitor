# 🎯 AI Market Monitor - 市场机会监控系统

> 多源数据采集 + 深度CODEX分析 + 自动推送语雀

## 📋 项目概览

AI Market Monitor 是一个自动化市场机会监控系统，从多个数据源采集 AI/技术领域的市场信号，使用深度分析框架进行 CODEX 分析，并自动生成专业的市场分析报告推送到语雀知识库。

### 核心特性

- **🌐 多源数据采集**：Twitter/X、Reddit、GitHub Trending、Hacker News
- **🧠 深度分析框架**：10 部分结构化分析，包含行业定位、用户画像、商业化路径、超级个人适配度评分
- **📊 高质量筛选**：173+ 关键词、53 位高质量影响者、智能信噪比评分
- **📤 自动发布**：一键推送到语雀知识库
- **⏰ 定时执行**：支持 cron 定时任务

## 🚀 快速开始

### 一键执行完整工作流

```bash
# 激活虚拟环境
source venv/bin/activate

# 执行完整工作流：采集 → 分析 → 推送语雀
python3 run_complete_workflow.py
```

### 单独运行各模块

```bash
# 1. 仅数据采集
python3 multi_source_collector.py

# 2. 采集 + CODEX 分析（不推送）
python3 run_codex_workflow.py

# 3. 推送已有报告到语雀
python3 push_deep_report_to_yuque.py /path/to/report.md
```

## 📁 项目结构

```
market-monitor/
├── config/                          # 配置文件
│   ├── data_sources.yaml           # 数据源配置（8个平台）
│   ├── high_signal_keywords.yaml   # 高信噪比关键词（173+）
│   ├── influencers.yaml            # 影响者名单（53位）
│   └── codex_analysis_prompt.yaml  # CODEX 深度分析提示词
│
├── data_collectors/                 # 数据采集器
│   ├── twitter_collector.py        # Twitter/X 采集
│   ├── reddit_collector.py         # Reddit 采集（RSS模式）
│   └── github_collector.py         # GitHub Trending 采集
│
├── enhanced_config_loader.py       # 统一配置加载器
├── multi_source_collector.py       # 多源数据采集管理器
├── run_complete_workflow.py        # 完整工作流入口
├── push_deep_report_to_yuque.py   # 语雀推送工具
│
├── extract_twitter_cookies_from_chrome.py  # Cookie 提取工具
├── setup_twitter_cookies.py               # Twitter 登录设置
├── setup_cron.sh                          # 定时任务配置脚本
│
└── README.md                       # 本文档
```

## ⚙️ 环境配置

### 1. Python 环境

```bash
# 激活虚拟环境（已存在）
source venv/bin/activate

# 已安装依赖
# twikit, praw, requests, beautifulsoup4, pyyaml, lxml
```

### 2. Twitter 认证配置

**方式一：从 Chrome 提取 Cookies（推荐）**

```bash
# 确保 Chrome 已登录 Twitter
python3 extract_twitter_cookies_from_chrome.py
```

**方式二：交互式登录**

```bash
python3 setup_twitter_cookies.py
```

提取的 cookies 会保存到 `twitter_cookies.json`（已加入 .gitignore）。

### 3. 语雀配置

环境变量或代码中配置：

```bash
export YUQUE_TOKEN="your_token_here"
export YUQUE_NAMESPACE="diandongmianbao"
export YUQUE_REPO_SLUG="cg40cd"
```

当前配置推送到：`https://www.yuque.com/diandongmianbao/cg40cd`

## 📊 数据源配置

### 当前监控的数据源

| 平台 | 类型 | 覆盖范围 | 权重 |
|------|------|----------|------|
| **Twitter/X** | 社交媒体 | AI 领域 KOL 动态 | 高 |
| **Reddit** | 社区论坛 | 18 个高优先级 subreddit | 高 |
| **GitHub Trending** | 开源项目 | Python/JavaScript/TypeScript/Rust | 中 |
| **Hacker News** | 技术新闻 | Top Stories | 中 |
| **Product Hunt** | 产品发布 | 新产品发现 | 待实现 |

### Reddit 高优先级 Subreddits

```
- r/ChatGPT (热度: 极高)
- r/LocalLLaMA (信噪比: 极高)
- r/OpenAI (官方动态)
- r/MachineLearning (技术深度)
- r/SideProject (商业化机会)
- ... 共 18 个
```

### 影响者监控（53 位）

分类：
- **AI 研究者**：Andrej Karpathy、Yann LeCun、Andrew Ng 等
- **科技创始人**：Sam Altman、Dario Amodei、Elon Musk 等
- **独立开发者**：Pieter Levels、Marc Louvion、Tony Dinh 等
- **投资人/分析师**：Marc Andreessen、Elad Gil 等

## 🧠 深度分析框架

### 10 部分分析结构

1. **核心发现**：紧急度评级、市场信号解读
2. **用户痛点分析**：痛点分类矩阵、深度剖析
3. **市场机会识别**：
   - 行业定位
   - 用户画像
   - 7 维度商业化路径对比（SaaS、API、一次性部署、开源+企业版等）
   - 8 维度超级个人适配度评分
   - MVP 建议与 ARR 预估
4. **技术趋势追踪**
5. **融资/项目动态**
6. **数据统计洞察**
7. **AI 分析师多视角点评**
8. **行动建议优先级矩阵**
9. **数据来源**
10. **未来展望**

### 商业化路径 7 维度对比

| 模式 | 定价策略 | 预估 ARR | 启动成本 | 获客难度 | 现金流周期 | 规模化潜力 | 适合人群 |
|------|---------|---------|----------|----------|-----------|-----------|----------|
| SaaS订阅 | ... | ... | ... | ... | ... | ... | ... |

### 超级个人适配度 8 维度评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 技术门槛 | X/10 | ... |
| 初始资金 | X/10 | ... |
| 时间投入 | X/10 | ... |
| 运营复杂度 | X/10 | ... |
| 市场验证速度 | X/10 | ... |
| 规模化难度 | X/10 | ... |
| 竞争壁垒 | X/10 | ... |
| 现金流健康 | X/10 | ... |
| **综合评分** | **X/10** | 推荐等级 |

## ⏰ 定时执行配置

### 使用 Cron

```bash
# 运行配置脚本（交互式）
bash setup_cron.sh

# 或手动添加
crontab -e

# 添加以下行（每天 9:00 和 15:00 执行）
0 9 * * * cd /home/git01/market-monitor && source venv/bin/activate && python3 run_complete_workflow.py >> /tmp/market-monitor.log 2>&1
0 15 * * * cd /home/git01/market-monitor && source venv/bin/activate && python3 run_complete_workflow.py >> /tmp/market-monitor.log 2>&1
```

### 查看日志

```bash
# 实时查看
tail -f /tmp/market-monitor.log

# 查看最近 100 行
tail -100 /tmp/market-monitor.log
```

## 🔧 故障排查

### Twitter 采集失败

**问题**：twikit 库报错 "'ClientTransaction' object has no attribute 'key'"

**解决方案**：
1. 重新提取 Chrome cookies：`python3 extract_twitter_cookies_from_chrome.py`
2. 确保 Chrome 已登录 Twitter 且会话有效
3. 如果仍失败，使用 Reddit、GitHub、HN 作为主要数据源

### 报告质量不佳

**检查点**：
- 是否使用了 `run_complete_workflow.py`？
- 配置文件 `config/codex_analysis_prompt.yaml` 是否存在？
- 查看生成的报告是否包含 10 个部分？

### 语雀推送失败

**检查点**：
- `YUQUE_TOKEN` 是否正确？
- 网络连接是否正常？
- 知识库权限是否足够？

## 📝 开发指南

### 添加新数据源

1. 在 `config/data_sources.yaml` 中添加配置
2. 创建新的 collector 类继承基础接口
3. 在 `multi_source_collector.py` 中注册

### 修改分析框架

编辑 `config/codex_analysis_prompt.yaml`，修改：
- 分析部分结构
- 商业化路径维度
- 评分标准

### 自定义关键词

编辑 `config/high_signal_keywords.yaml`：
- 添加痛点信号词
- 添加机会信号词
- 配置噪音过滤词

## 🔐 安全注意事项

- **敏感文件**：`cookies.json`、`twitter_cookies.json` 已加入 `.gitignore`
- **Token 管理**：不要将 `YUQUE_TOKEN` 提交到代码库
- **定期更新**：Twitter cookies 会过期，需定期重新提取

## 📈 性能数据

- **数据采集速度**：约 46 条/分钟（Reddit + GitHub + HN）
- **分析报告长度**：约 18,000 字符，~650 行
- **语雀推送时间**：< 5 秒

## 🤝 贡献指南

本项目使用 Git 进行版本控制：

```bash
# 当前分支
git branch
# * feature/llm-upgrade

# 提交更改
git add .
git commit -m "feat: description"

# 推送到远程（需要配置认证）
git push origin feature/llm-upgrade
```

## 🌐 远程仓库

### GitHub（云端备份）

```bash
# 推送到 GitHub（需要配置认证）
# 方式1：SSH Key（推荐）
git remote set-url origin git@github.com:electricmpv/market-monitor.git
git push origin feature/llm-upgrade

# 方式2：Personal Access Token
# 1. 访问 https://github.com/settings/tokens
# 2. 生成 token（repo权限）
# 3. 推送时使用：
git push https://YOUR_TOKEN@github.com/electricmpv/market-monitor.git feature/llm-upgrade
```

### Gitea（本地备份）

```bash
# 推送到本地 Gitea
git push gitea feature/llm-upgrade

# 查看 Gitea 仓库
# http://localhost:3000/git01/market-monitor
```

**重要**：建议同时推送到 GitHub 和 Gitea：
- GitHub：云端备份，防止服务器故障
- Gitea：本地快速访问

## 📄 许可证

请根据项目需求添加适当的许可证。

## 🆘 获取帮助

- 查看日志：`tail -f /tmp/market-monitor.log`
- 检查配置：`cat config/data_sources.yaml`
- 测试单个采集器：`python3 data_collectors/reddit_collector.py`

---

**最后更新**：2026年2月3日
**版本**：v5.0 (Multi-source + Deep Analysis)
