# 📚 AI Market Monitor - 完整使用指南

> 本文档提供详细的使用说明，适合其他 CLI 工具（如 OpenClaw、Claude Code 等）参考使用

---

## 📋 目录

1. [系统架构](#系统架构)
2. [完整工作流程](#完整工作流程)
3. [关键组件说明](#关键组件说明)
4. [配置详解](#配置详解)
5. [故障排除](#故障排除)
6. [最佳实践](#最佳实践)
7. [OpenClaw 集成指南](#openclaw-集成指南)

---

## 🏗️ 系统架构

### 整体流程

```
┌─────────────────┐
│  数据采集层      │
│  (Collectors)   │
└────────┬────────┘
         │
         ├─→ Twitter (Bird CLI)
         ├─→ Reddit (RSS/API)
         ├─→ GitHub (Trending API)
         └─→ Hacker News (API)
         │
         ↓
┌─────────────────┐
│  数据聚合层      │
│  (Aggregator)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  AI 分析层       │
│  (Codex CLI)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  报告生成层      │
│  (Generator)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  推送发布层      │
│  (Publisher)    │
└─────────────────┘
```

### 核心组件

1. **多源采集器** (`multi_source_collector.py`)
   - 统一管理所有数据源
   - 并行采集、错误处理
   - 输出标准化 JSON

2. **Codex 分析引擎** (`/tmp/run_codex_analysis.py`)
   - 构建分析提示词
   - 调用 Codex CLI
   - 生成 Markdown 报告

3. **语雀推送模块** (`/tmp/push_to_yuque.py`)
   - 格式化报告
   - API 调用
   - 错误重试

---

## 🔄 完整工作流程

### 方式一：一键执行（推荐）

```bash
cd /home/git01/market-monitor
source venv/bin/activate
python3 run_workflow.py
```

**流程说明**：
1. ✅ 检查环境变量（AUTH_TOKEN, CT0, YUQUE_TOKEN）
2. 📊 执行多源数据采集
3. 🧠 调用 Codex CLI 深度分析
4. 📄 生成精美 Markdown 报告
5. 🔗 推送到语雀知识库

**预计耗时**：5-10 分钟

---

### 方式二：分步执行（调试用）

#### 步骤 1：数据采集

```bash
cd /home/git01/market-monitor
source venv/bin/activate
python3 multi_source_collector.py
```

**输出文件**：`/tmp/market_data_YYYYMMDD_HHMMSS.json`

**数据结构**：
```json
{
  "collected_at": "2026-02-04T08:39:18.043869",
  "sources": ["twitter", "reddit", "github", "hackernews"],
  "total_items": 86,
  "twitter": [...],
  "reddit": [...],
  "github": [...],
  "hackernews": [...]
}
```

**重点检查**：
- Twitter 数据是否成功采集（40 条）
- 各数据源是否均有数据
- 是否有错误提示

---

#### 步骤 2：Codex 深度分析

```bash
# 编辑数据文件路径（如果需要）
nano /tmp/run_codex_analysis.py
# 修改 DATA_FILE 变量为你的数据文件路径

# 执行分析
python3 /tmp/run_codex_analysis.py
```

**输出文件**：`/tmp/codex_analysis.md`

**关键参数**：
- 提示词长度：约 24,000 字符
- 模型：GPT-4（默认）
- 超时：300 秒（5 分钟）

**提示词结构**：
```
1. 数据概览
2. 原始数据（分平台展示）
3. 分析要求（6 大维度）
4. 输出格式要求
```

---

#### 步骤 3：推送到语雀

```bash
# 确保环境变量已设置
source .env
export YUQUE_TOKEN
export YUQUE_NAMESPACE

# 执行推送
python3 /tmp/push_to_yuque.py
```

**输出**：
- ✅ 成功：返回语雀文档 URL
- ❌ 失败：保存本地备份到 `/tmp/yuque_report_*.md`

---

## 🔑 关键组件说明

### 1. Twitter 采集器（Bird CLI）

**文件**：`data_collectors/twitter_bird_collector.py`

**核心方法**：
- `initialize()` - 检查认证和 bird 可用性
- `collect_by_keywords()` - 按关键词搜索
- `collect_from_users()` - 采集指定用户推文

**认证方式**：
```python
# 环境变量方式（推荐）
os.environ['AUTH_TOKEN'] = 'your_token'
os.environ['CT0'] = 'your_ct0'

# 或 .env 文件
AUTH_TOKEN=your_token
CT0=your_ct0
```

**命令示例**：
```bash
# 测试认证
export AUTH_TOKEN="..."
export CT0="..."
bird whoami

# 搜索推文
bird search "AI tool" --json

# 获取用户推文
bird user-tweets karpathy --json
```

**重要提示**：
- ⚠️ **仅用于只读操作**
- ⚠️ **Cookie 有效期约 30 天**
- ⚠️ **需要定期更新**

---

### 2. Reddit 采集器

**文件**：`data_collectors/reddit_collector.py`

**模式**：
- 默认：RSS Feed（无需认证）
- 可选：PRAW API（需要 Reddit API Key）

**采集的 Subreddits**：
- r/LocalLLaMA
- r/OpenAI
- r/Claude_AI
- r/LanguageModels
- r/Cursor

**数据结构**：
```python
{
  'title': '帖子标题',
  'selftext': '帖子内容',
  'score': 分数,
  'comments': 评论数,
  'url': 'Reddit URL',
  'subreddit': 'subreddit 名称',
  'source': 'reddit'
}
```

---

### 3. GitHub Trending 采集器

**文件**：`data_collectors/github_collector.py`

**采集语言**：
- Python
- TypeScript
- JavaScript

**时间范围**：daily

**数据结构**：
```python
{
  'name': '项目名称',
  'description': '项目描述',
  'stars': 星标数,
  'language': '编程语言',
  'url': 'GitHub URL',
  'source': 'github'
}
```

---

### 4. Codex 分析引擎

**关键文件**：
- `/tmp/run_codex_analysis.py` - 分析脚本
- `/tmp/codex_prompt.txt` - 生成的提示词
- `/tmp/codex_analysis.md` - 分析结果

**提示词模板**：
```python
prompt = f"""
# AI 市场机会深度分析任务

## 📊 数据概览
{data_overview}

## 📝 原始数据
{formatted_data}

## 🎯 分析要求
1. 核心发现（Executive Summary）
2. 用户痛点深度分析
3. 市场机会识别（重点）
4. 技术趋势追踪
5. 数据统计洞察
6. 多视角点评

## 📋 输出格式要求
- Markdown 格式
- 数据驱动
- 可执行性
"""
```

**Codex CLI 调用**：
```bash
codex exec -o /tmp/codex_analysis.md - < /tmp/codex_prompt.txt
```

**模型选择**：
- 默认模型：GPT-4
- 不支持的模型：o3, gpt-5.2-higthinking（ChatGPT 账户）

---

### 5. 语雀推送模块

**API 端点**：
```
POST https://www.yuque.com/api/v2/repos/{namespace}/{repo}/docs
```

**请求头**：
```python
headers = {
    'X-Auth-Token': YUQUE_TOKEN,
    'Content-Type': 'application/json'
}
```

**请求体**：
```python
payload = {
    'title': '文档标题',
    'slug': '文档 slug',
    'body': 'Markdown 内容',
    'public': 0,  # 私密文档
    'format': 'markdown'
}
```

**错误处理**：
- 200/201：成功
- 其他：保存本地备份

---

## ⚙️ 配置详解

### 环境变量（.env）

```env
# Twitter Bird CLI 认证（必需）
AUTH_TOKEN=7dfea72a18dd2f24a3295b3e62cd431a8fcd0922
CT0=c02cb58a8a59404b4658ee7a2aae020cde265b448316b225dda20ccbd9fabdb8376792000993c40bdd1f324f4d0ba9651c9e79b2566bd26abe9523c74b112f2710e9eee6af5ef31448b97d6636116843

# 语雀 API（必需）
YUQUE_TOKEN=EmucIYlJro7ic4O4ZS6UujQZm89tXmwor7PwNYmL
YUQUE_NAMESPACE=diandongmianbao
YUQUE_REPO_SLUG=cg40cd

# Reddit API（可选）
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=
```

---

### 高信噪比关键词配置

**文件**：`config/high_signal_keywords.yaml`

```yaml
strong_pain_signals:
  # 挫败感
  frustration:
    - "so frustrating"
    - "driving me crazy"
    - "waste of time"
    
  # 未满足的需求
  unmet_needs:
    - "wish there was"
    - "need something that"
    - "looking for alternative"
    
  # 功能缺失
  missing_features:
    - "doesn't support"
    - "can't do"
    - "missing feature"
    
  # 质量问题
  quality_issues:
    - "too slow"
    - "keeps failing"
    - "not reliable"
```

**使用场景**：
- Twitter 关键词搜索
- 痛点信号识别
- 市场机会发现

---

### 高质量博主配置

**文件**：`config/influencers.yaml`

```yaml
ai_researchers:
  - name: "Andrej Karpathy"
    twitter: "@karpathy"
    category: "AI Research"
    priority: "high"
    description: "前 Tesla AI 总监"
    
  - name: "Yann LeCun"
    twitter: "@ylecun"
    category: "AI Research"
    priority: "high"
    description: "Meta AI 首席科学家"
```

**优先级**：
- `high` - 每次必采集
- `medium` - 轮流采集
- `low` - 偶尔采集

---

## 🔧 故障排除

### 问题 1：Bird CLI 认证失败

**错误信息**：
```
❌ Bird 认证失败
⚠️  Missing credentials
```

**解决方案**：

1. 检查环境变量：
```bash
echo $AUTH_TOKEN
echo $CT0
```

2. 重新提取 cookies：
```bash
source venv/bin/activate
browser-use --browser real open https://x.com
browser-use cookies get --url https://x.com
```

3. 更新 .env 文件

---

### 问题 2：Codex 执行失败

**错误信息**：
```
ERROR: {"detail":"The 'o3' model is not supported..."}
```

**解决方案**：

使用默认模型：
```python
# 不指定模型
result = subprocess.run(
    ['codex', 'exec', '-o', OUTPUT_FILE, '-'],
    stdin=f,
    ...
)
```

---

### 问题 3：语雀推送失败

**错误信息**：
```
❌ 语雀推送失败 (401)
```

**解决方案**：

1. 检查 Token：
```bash
curl -H "X-Auth-Token: $YUQUE_TOKEN" \
  https://www.yuque.com/api/v2/user
```

2. 检查命名空间和仓库：
```bash
curl -H "X-Auth-Token: $YUQUE_TOKEN" \
  https://www.yuque.com/api/v2/repos/{namespace}/{repo}
```

---

### 问题 4：Python 依赖错误

**错误信息**：
```
ModuleNotFoundError: No module named 'xxx'
```

**解决方案**：

重新安装依赖：
```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

## 💡 最佳实践

### 1. Cookie 管理

**更新频率**：每 30 天

**自动化脚本**：
```bash
#!/bin/bash
# update_twitter_cookies.sh

cd /home/git01/market-monitor
source venv/bin/activate

# 提取 cookies
browser-use --browser real open https://x.com
sleep 3
browser-use cookies get --url https://x.com > /tmp/cookies.txt

# 解析并更新 .env
# （这里添加解析逻辑）
```

---

### 2. 定时任务配置

**推荐时间**：
- 上午 9:00（捕捉欧美夜间内容）
- 下午 15:00（捕捉上午活跃内容）

**Cron 配置**：
```cron
0 9 * * * source venv/bin/activate && python3 run_workflow.py >> /tmp/market-monitor.log 2>&1
0 15 * * * cd /home/git01/market-monitor && source venv/bin/activate && python3 run_workflow.py >> /tmp/market-monitor.log 2>&1
```

**日志管理**：
```bash
# 定期清理日志（保留最近 7 天）
find /tmp -name "market-monitor.log" -mtime +7 -delete
```

---

### 3. 数据质量优化

**关键词优化**：
- 定期review采集结果
- 删除低质量关键词
- 添加新的痛点词

**博主列表优化**：
- 监控博主活跃度
- 替换不活跃账号
- 添加新的高质量账号

---

## 🦞 OpenClaw 集成指南

### 使用 OpenClaw 执行项目

**方式一：直接执行工作流**

```bash
openclaw agent --local "请执行 /home/git01/market-monitor 项目的完整工作流"
```

**方式二：分步执行**

```bash
# 1. 数据采集
openclaw agent --local "cd /home/git01/market-monitor && 执行 multi_source_collector.py"

# 2. 分析
openclaw agent --local "执行 Codex 分析，数据文件在 /tmp/market_data_*.json"

# 3. 推送
openclaw agent --local "将分析结果推送到语雀"
```

---

### OpenClaw 工作提示词模板

```
任务：执行 AI Market Monitor 完整工作流

项目路径：/home/git01/market-monitor

步骤：
1. 进入项目目录
2. 激活虚拟环境（source venv/bin/activate）
3. 检查环境变量（.env 文件）
4. 执行 python3 run_workflow.py
5. 监控执行过程，报告结果

预期输出：
- 数据采集成功（86+ 条数据）
- Codex 分析完成
- 语雀报告 URL

注意事项：
- 确保 AUTH_TOKEN 和 CT0 环境变量已设置
- 整个流程约需 5-10 分钟
- 如遇错误，查看日志并报告
```

---

### 环境变量传递

**方法一：使用 .env 文件**

```bash
openclaw agent --local "source /home/git01/market-monitor/.env && python3 run_workflow.py"
```

**方法二：显式设置**

```bash
openclaw agent --local "
export AUTH_TOKEN='...'
export CT0='...'
export YUQUE_TOKEN='...'
cd /home/git01/market-monitor
python3 run_workflow.py
"
```

---

## 📊 性能指标

### 数据采集

- Twitter: 40 条 / 约 2 分钟
- Reddit: 21 条 / 约 30 秒
- GitHub: 15 条 / 约 20 秒
- HN: 10 条 / 约 15 秒

**总计**：约 3 分钟

### Codex 分析

- 提示词长度：24,000 字符
- 分析时间：2-3 分钟
- 输出大小：10,000 字节

### 语雀推送

- 报告生成：5 秒
- API 调用：2 秒

**端到端总时间**：5-10 分钟

---

## 📝 更新日志

### v2.0.0 (2026-02-04)

- ✨ 使用 Bird CLI 替换 twikit
- ✨ 集成 Codex CLI 分析
- ✨ 添加语雀自动推送
- 📚 创建完整使用指南

---

## 📧 支持与反馈

- **问题报告**：GitHub Issues
- **功能建议**：Pull Requests
- **技术讨论**：项目 Wiki

---

**项目路径**：`/home/git01/market-monitor`

**最后更新**：2026-02-04
