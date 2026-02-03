# Market Monitor 配置文件说明

## 📁 配置文件结构

```
config/
├── README.md                        # 本文件
├── keywords.yaml                    # 基础关键词配置（现有）
├── data_sources.yaml                # 数据源配置（新增）⭐
├── influencers.yaml                 # 博主/KOL 名单（新增）⭐
├── high_signal_keywords.yaml        # 高信噪比关键词（新增）⭐
├── codex_analysis_prompt.yaml       # CODEX 分析提示词（新增）⭐
├── influencers.json.example         # 示例文件
├── keywords.json.example            # 示例文件
└── platforms.json.example           # 示例文件
```

## 🎯 新增配置文件详解

### 1. `data_sources.yaml` - 多平台数据源配置

**用途**：定义所有数据采集平台的详细配置

**主要内容**：
- **Twitter/X**: 关键词、过滤条件、排除规则
- **Reddit**: subreddits 列表、评分阈值、优先级
- **Hacker News**: 内容类型、过滤条件
- **VC 渠道**: VC 博客 RSS、Twitter 账号
- **Product Hunt**: 分类、过滤条件
- **GitHub Trending**: 语言、关键词
- **Indie Hackers**: 板块、过滤条件
- **Dev.to/Medium**: 标签、最小反应数

**使用示例**：
```python
import yaml

with open('config/data_sources.yaml') as f:
    config = yaml.safe_load(f)

# 获取 Reddit 配置
reddit_config = config['reddit']
subreddits = [sr['name'] for sr in reddit_config['subreddits']['ai_ml']]

# 获取 VC Twitter 账号
vc_accounts = config['vc_channels']['vc_twitter_accounts']
```

**关键特性**：
- ✅ 按优先级分类（high/medium/low）
- ✅ 支持代理配置（美西服务器）
- ✅ 全局排除规则（垃圾过滤）
- ✅ 优先级权重配置

---

### 2. `influencers.yaml` - 高质量博主和 KOL 名单

**用途**：定义值得重点监控的高影响力账号

**主要内容**：
- **AI 研究者**: Andrej Karpathy, Yann LeCun, Andrew Ng 等
- **AI 产品创始人**: Sam Altman, Dario Amodei 等
- **Indie Hackers**: Pieter Levels, Linus Ekenstam 等
- **VC 和投资人**: Marc Andreessen, Paul Graham, Naval 等
- **开发工具专家**: DHH, Simon Willison 等
- **产品和设计**: Patrick McKenzie, Andrew Chen 等

**使用示例**：
```python
import yaml

with open('config/influencers.yaml') as f:
    influencers = yaml.safe_load(f)

# 获取高优先级 indie hackers
indie_hackers = [
    person for person in influencers['indie_hackers']
    if person['priority'] == 'high'
]

# 获取所有 Twitter 账号
all_twitter = [
    person['twitter']
    for category in influencers.values()
    if isinstance(category, list)
    for person in category
    if 'twitter' in person
]
```

**关键特性**：
- ✅ 按类别分组（研究者、创始人、投资人等）
- ✅ 优先级标注（high/medium/low）
- ✅ 多平台账号（Twitter、GitHub 等）
- ✅ 互动阈值配置（按优先级差异化）

---

### 3. `high_signal_keywords.yaml` - 高信噪比关键词

**用途**：精选的高质量关键词，用于过滤噪音，聚焦高价值内容

**主要内容**：
- **强痛点信号词**: 挫败感、未满足需求、功能缺失、质量问题、成本问题
- **市场机会信号词**: 产品发布、融资、增长里程碑、市场验证
- **技术趋势信号词**: AI 前沿、开发工具、自动化
- **用户画像关键词**: 开发者、创作者、创业者、企业用户
- **行业细分关键词**: AI 开发工具、内容生成、数据分析等
- **噪音过滤词**: 垃圾营销、低质量讨论、诈骗

**使用示例**：
```python
import yaml

with open('config/high_signal_keywords.yaml') as f:
    keywords = yaml.safe_load(f)

# 获取强痛点信号词
pain_signals = []
for category, words in keywords['strong_pain_signals'].items():
    pain_signals.extend(words)

# 获取噪音过滤词（用于排除）
spam_words = keywords['noise_filters']['spam_indicators']

# 使用组合规则
def is_high_signal(text):
    # 示例：检查是否匹配"产品名 + 痛点词"模式
    products = keywords['competitor_keywords']['ai_products']
    pain_words = pain_signals

    for product in products:
        if product.lower() in text.lower():
            for pain in pain_words:
                if pain.lower() in text.lower():
                    return True
    return False
```

**关键特性**：
- ✅ 组合规则定义（如：产品名 + 痛点词）
- ✅ 权重配置（用于排序）
- ✅ 情感分析支持
- ✅ 评估指标基准

---

### 4. `codex_analysis_prompt.yaml` - CODEX 分析提示词模板

**用途**：指导 CODEX (GPT-5.2) 进行深度市场分析的提示词模板

**主要内容**：
- **主提示词**: 完整的分析框架和输出要求
- **数据概览模板**: 格式化数据摘要
- **原始数据模板**: 格式化原始数据
- **评分标准**: 超级个人适配度评分规则
- **商业化路径**: 7 种主要商业化模式详解

**输出报告包含 10 大部分**：
1. 🔥 核心发现
2. 😤 用户痛点分析
3. 💡 市场机会识别
   - 行业定位
   - 用户画像
   - **商业化路径分析**（7 种模式对比）
   - **超级个人适配度评估**（8 维度评分）
   - 竞争对手分析
   - MVP 建议
   - 风险与挑战
4. 🚀 技术趋势追踪
5. 💰 融资动态分析
6. 📊 数据统计洞察
7. 🧠 AI 分析师多视角点评（产品经理、技术专家、投资人）
8. 🎯 行动建议优先级矩阵
9. 📎 数据来源与引用
10. 🔮 未来展望

**使用示例**：
```python
import yaml

with open('config/codex_analysis_prompt.yaml') as f:
    prompt_config = yaml.safe_load(f)

# 构建数据概览
data_overview = prompt_config['data_overview_template'].format(
    timestamp="2024-02-02 10:00",
    platforms="Twitter, Reddit, HN",
    total_count=150,
    twitter_count=80,
    reddit_count=50,
    hn_count=20,
    github_count=0,
    other_count=0
)

# 格式化原始数据
raw_data = prompt_config['raw_data_template'].format(
    twitter_data="...",
    reddit_data="...",
    hn_data="...",
    github_data="...",
    other_data="..."
)

# 构建完整提示词
full_prompt = prompt_config['main_prompt'].format(
    data_overview=data_overview,
    raw_data=raw_data
)

# 调用 CODEX
# result = codex_client.analyze(full_prompt)
```

**关键特性**：
- ✅ 结构化输出格式
- ✅ 多维度分析框架
- ✅ 商业化路径详解（7 种模式）
- ✅ 超级个人适配度评分（8 维度）
- ✅ 评分标准和基准

---

## 🚀 快速开始

### 方法 1: 直接使用现有脚本

现有的 `run_codex_workflow.py` 已更新，自动加载新的提示词模板：

```bash
python run_codex_workflow.py
```

### 方法 2: 在代码中使用配置

```python
import yaml

# 加载所有配置
def load_all_configs():
    configs = {}

    # 数据源
    with open('config/data_sources.yaml') as f:
        configs['data_sources'] = yaml.safe_load(f)

    # Influencers
    with open('config/influencers.yaml') as f:
        configs['influencers'] = yaml.safe_load(f)

    # 高信噪比关键词
    with open('config/high_signal_keywords.yaml') as f:
        configs['keywords'] = yaml.safe_load(f)

    # CODEX 提示词
    with open('config/codex_analysis_prompt.yaml') as f:
        configs['codex_prompt'] = yaml.safe_load(f)

    return configs

# 使用
configs = load_all_configs()
```

---

## 📊 配置优先级和权重

### 数据源优先级

| 平台 | 权重 | 说明 |
|------|------|------|
| VC Blogs | 1.8 | 融资和趋势信号强 |
| Hacker News | 1.5 | 技术社区，质量高 |
| GitHub Trending | 1.3 | 实际项目，可操作性强 |
| Twitter/X | 1.2 | 实时性强，但噪音多 |
| Reddit | 1.0 | 讨论深入，但需过滤 |
| Product Hunt | 0.9 | 产品多，但商业价值参差 |

### Influencer 优先级

- **High**: 30 分钟检查一次，最小互动阈值：10 赞 + 2 转发
- **Medium**: 2 小时检查一次，最小互动阈值：20 赞 + 5 转发
- **Low**: 6 小时检查一次，最小互动阈值：50 赞 + 10 转发

---

## 🔄 定期维护建议

### 每月更新
- [ ] 审查关键词效果，删除低效关键词
- [ ] 添加新兴趋势关键词
- [ ] 更新 Influencer 名单（新增/移除）

### 每季度更新
- [ ] 评估数据源质量，调整权重
- [ ] 更新商业化路径（新模式）
- [ ] 优化 CODEX 提示词

### 评估指标
- **信噪比**: 高质量内容占比 > 70%
- **准确率**: 匹配内容相关性 > 80%
- **召回率**: 相关内容被匹配率 > 60%
- **可执行率**: 可转化为行动的内容 > 30%

---

## 🛠️ 故障排查

### Q: CODEX 分析返回格式不符合预期？
**A**: 检查 `codex_analysis_prompt.yaml` 中的 `main_prompt`，确保模板变量正确替换。

### Q: 数据采集到太多垃圾内容？
**A**:
1. 调整 `data_sources.yaml` 中的过滤阈值
2. 添加更多 `global_exclusions` 排除词
3. 使用 `high_signal_keywords.yaml` 中的噪音过滤词

### Q: 某些 Influencer 内容质量下降？
**A**: 降低其优先级（high → medium → low）或直接移除。

---

## 📞 反馈和建议

如有问题或建议，请提交 GitHub Issue：
https://github.com/electricmpv/market-monitor/issues

---

**最后更新**: 2024-02-02
