# 🎯 AI市场机会监控系统 v2.0

> 一套24小时自动运行的AI市场情报系统，为独立开发者发现创业机会、融资信息、技术突破和用户痛点。

**作者**: 电动面包 (AI Solopreneur)  
**目标**: 帮助你在睡觉时自动捕获全球AI市场最有价值的信息

---

## 📊 系统架构

```
┌─────────────────────────────────────────────────────┐
│         🎯 市场机会监控系统 v2.0                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📡 痛点雷达 (Pain Radar)                           │
│  └─ Twitter + Hacker News 用户吐槽扫描             │
│  └─ AI诊断市场机会                                 │
│  └─ 输出: 市场机会分析报告                         │
│                                                     │
│  🔍 机会猎手 (Opportunity Hunter)                  │
│  └─ GitHub 高星项目发现                            │
│  └─ Hacker News 融资/创业新闻                      │
│  └─ AI分析商业价值                                 │
│  └─ 输出: 机会发现报告                             │
│                                                     │
│  📨 统一交付 (Unified Delivery)                    │
│  └─ Word文档生成                                   │
│  └─ 微信推送                                       │
│  └─ 本地向量数据库存储                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 第一步：安装依赖

```bash
# 克隆或下载本项目
cd market_monitor_v2

# 安装Python依赖
pip install google-genai twikit requests chromadb python-docx

# 或使用requirements.txt
pip install -r requirements.txt
```

### 第二步：配置API密钥

编辑 `config.env` 文件，填入你的API密钥：

```bash
# 1. Gemini API密钥
# 申请地址: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_key_here

# 2. PushPlus Token (微信推送)
# 申请地址: http://www.pushplus.plus/
PUSHPLUS_TOKEN=your_token_here

# 3. GitHub Token (可选，用于提高API限制)
# 申请地址: https://github.com/settings/tokens
GITHUB_TOKEN=your_token_here

# 4. 代理端口 (如果需要)
PROXY_PORT=19828
```

### 第三步：获取Twitter Cookies (可选)

如果要监控Twitter，需要获取登录凭证：

1. 在Chrome浏览器安装插件 "EditThisCookie"
2. 登录你的Twitter账号
3. 点击插件 → 导出 → JSON格式
4. 保存为 `cookies.json` 到项目目录

### 第四步：运行系统

```bash
# 方式1: 运行一次
python run_monitor.py --all

# 方式2: 仅运行痛点雷达
python run_monitor.py --pain

# 方式3: 仅运行机会猎手
python run_monitor.py --opportunity

# 方式4: 后台守护进程 (每小时运行一次)
python run_monitor.py --daemon --interval 3600
```

---

## 📋 监控内容详解

### 📡 痛点雷达 (Pain Radar)

**功能**: 从全网用户吐槽中发现市场机会

**监控平台**:
- **Twitter/X**: 实时用户吐槽、产品反馈
- **Hacker News**: 技术社区讨论、深度分析

**监控产品** (可自定义):
- ChatGPT, Claude, DeepSeek
- Cursor, Midjourney, Sora
- 等等...

**监控痛点类型**:
- 功能缺陷: "can't", "doesn't work", "broken"
- 性能问题: "slow", "expensive", "rate limit"
- 易用性: "confusing", "hard to use", "steep learning curve"
- 集成困难: "api down", "integration fail"

**输出**:
- 市场机会分析报告 (Word)
- 微信推送
- 本地数据库存储

### 🔍 机会猎手 (Opportunity Hunter)

**功能**: 发现融资项目、创业团队、技术突破

**监控平台**:
- **GitHub**: 高星开源项目、新框架发布
- **Hacker News**: 融资新闻、创业动态、技术突破

**监控关键词** (可自定义):
- 融资: "Series A", "funding", "raised"
- 创业: "startup", "founded", "launch"
- 技术: "breakthrough", "SOTA", "new release"
- 工具: "AI agent", "RAG", "framework"

**输出**:
- 机会发现报告 (Word)
- 微信推送
- 本地数据库存储

---

## 🛠️ 自定义配置

### 修改监控关键词

编辑 `pain_radar_v2.py`:

```python
PAIN_KEYWORDS = {
    'ChatGPT': [
        'can\'t', 'doesn\'t work', 'error',  # 添加你的关键词
        '你的自定义词'
    ],
    # 添加更多产品...
}
```

编辑 `opportunity_hunter.py`:

```python
GITHUB_KEYWORDS = [
    'AI agent framework',
    '你的自定义关键词',
    # 添加更多...
]
```

### 修改过滤条件

```python
# GitHub最小星数 (越高越精准)
MIN_STARS = 500

# Hacker News最小分数
HN_MIN_SCORE = 200

# 项目最近更新天数
DAYS_SINCE_UPDATE = 60
```

### 修改推送方式

目前支持:
- **微信推送** (通过PushPlus)
- **本地Word文件** (自动生成)
- **本地数据库** (ChromaDB)

可扩展:
- 钉钉推送
- Slack推送
- 邮件推送
- 自定义Webhook

---

## 📈 API成本估算

### 每日成本 (假设每天运行3次)

| 服务 | 调用次数 | 成本 |
|------|--------|------|
| Gemini API | 30次 | ~$0.05 |
| Twitter API | 100次 | 免费* |
| GitHub API | 30次 | 免费 |
| Hacker News API | 20次 | 免费 |
| PushPlus | 3次 | 免费 |
| **月成本** | - | **~$1.5** |

*Twitter需要付费账户，但可选

### 成本优化建议

1. **使用免费API优先** (GitHub, HN, Reddit)
2. **本地向量数据库** (ChromaDB) 避免云存储成本
3. **智能缓存** 避免重复调用
4. **按需调用** 仅在发现新机会时调用Gemini

---

## 🔧 故障排除

### 问题1: 无法连接到API

**症状**: `ConnectionError`, `ProxyError`

**解决**:
```bash
# 检查代理设置
echo $http_proxy  # Linux/Mac
echo %http_proxy%  # Windows

# 如果不需要代理，设置
PROXY_PORT=0

# 如果需要代理，检查端口是否正确
# 常见端口: 7890, 7897, 10809
```

### 问题2: Twitter无法登录

**症状**: `401 Unauthorized`

**解决**:
1. 重新导出 `cookies.json`
2. 确保cookies.json包含: `auth_token`, `ct0`
3. 检查是否需要更新 `twikit` 库
   ```bash
   pip install --upgrade twikit
   ```

### 问题3: Gemini API错误

**症状**: `429 Too Many Requests`, `Invalid API Key`

**解决**:
1. 检查API密钥是否正确
2. 检查API配额是否用尽
3. 添加重试逻辑 (已内置)
4. 考虑使用其他模型 (GLM, 本地LLM)

### 问题4: Word文档乱码

**症状**: 生成的Word文件中文乱码

**解决**:
```python
# 确保文件名使用UTF-8编码
filename = f"Report_{datetime.now().strftime('%Y-%m-%d')}.docx"
```

---

## 🌙 后台运行

### Linux/Mac (使用nohup)

```bash
# 后台运行，每小时执行一次
nohup python run_monitor.py --daemon --interval 3600 > monitor.log 2>&1 &

# 查看日志
tail -f monitor.log

# 停止
pkill -f run_monitor.py
```

### Linux/Mac (使用systemd)

创建 `/etc/systemd/system/market-monitor.service`:

```ini
[Unit]
Description=AI Market Monitor
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/market_monitor_v2
ExecStart=/usr/bin/python3 run_monitor.py --daemon --interval 3600
Restart=always
RestartSec=60

[Install]
WantedBy=multi-user.target
```

启动:
```bash
sudo systemctl enable market-monitor
sudo systemctl start market-monitor
sudo systemctl status market-monitor
```

### Linux/Mac (使用cron)

```bash
# 编辑crontab
crontab -e

# 添加定时任务 (每天早上6:30运行)
30 6 * * * cd /home/ubuntu/market_monitor_v2 && python run_monitor.py --all >> monitor.log 2>&1
```

### Windows (使用任务计划程序)

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器: 每天 06:30
4. 操作: 启动程序
   - 程序: `C:\Python\python.exe`
   - 参数: `run_monitor.py --all`
   - 起始于: `C:\path\to\market_monitor_v2`

---

## 📊 数据存储

### 本地向量数据库 (ChromaDB)

所有信息都存储在 `./my_market_brain/` 目录:

```
my_market_brain/
├── pain_points_v2/      # 痛点数据
├── opportunities_v2/    # 机会数据
└── chroma.db           # 数据库文件
```

**查询数据**:

```python
import chromadb

client = chromadb.PersistentClient(path="./my_market_brain")
collection = client.get_collection(name="pain_points_v2")

# 查询所有痛点
results = collection.get()
print(results)

# 语义搜索
results = collection.query(
    query_texts=["AI绘画手指问题"],
    n_results=5
)
```

---

## 🎯 最佳实践

### 1. 定期审视关键词

每周检查一次:
- 哪些关键词产生了有价值的信息？
- 哪些关键词产生了噪音？
- 需要添加新的关键词吗？

### 2. 建立反馈循环

```
发现机会 → 验证可行性 → 采取行动 → 记录结果 → 优化关键词
```

### 3. 去重和聚合

系统已内置:
- MD5内容指纹 (避免重复)
- 语义相似度检测 (ChromaDB)
- 时间窗口聚合 (24小时内只推送一次)

### 4. 隐私保护

- 所有数据存储在本地
- 不上传个人信息到云端
- 仅通过PushPlus推送摘要

---

## 🔮 未来计划

- [ ] 支持Reddit、Discord监控
- [ ] 支持钉钉、Slack推送
- [ ] 支持邮件推送
- [ ] 支持本地LLM (Ollama)
- [ ] 支持多语言分析
- [ ] 支持Web界面
- [ ] 支持实时仪表板

---

## 📞 支持

遇到问题？

1. 检查 `README.md` 的故障排除部分
2. 查看代码中的注释
3. 检查日志文件 `monitor.log`
4. 提交Issue (如果开源)

---

## 📄 许可证

本项目仅供学习和个人使用。

**免责声明**:
- 请遵守各平台的ToS
- 不要用于大规模爬取
- 使用本工具产生的后果由使用者自行承担

---

## 🙏 致谢

感谢以下开源项目:
- [Twikit](https://github.com/d60/twikit) - Twitter API
- [ChromaDB](https://www.trychroma.com/) - 向量数据库
- [Google Generative AI](https://ai.google.dev/) - Gemini API
- [python-docx](https://python-docx.readthedocs.io/) - Word生成

---

**Happy Hunting! 🚀**

*最后更新: 2026-01-22*
