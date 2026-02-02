#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎯 痛点雷达 v2.0 - 精确市场机会监控系统
Author: 电动面包 (AI Solopreneur)
Purpose: 从全网用户吐槽中提取可商业化的市场机会
"""

import os
import asyncio
import datetime
import time
import hashlib
import random
import json
import sys
from pathlib import Path

try:
    from twikit import Client
    import requests
    import chromadb
    from docx import Document
    from llm_client import LLMClient
    from yuque_report_generator import YuqueReportGenerator
    from telegram_notifier import TelegramNotifier
except ImportError as e:
    print(f"❌ 依赖库缺失: {e}")
    print("请运行: pip install -r requirements.txt")
    sys.exit(1)

# ==================== 🛠️ 用户配置区 ====================

# LLM 和服务配置
LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'deepseek')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '')

# 网络配置
YOUR_PORT = int(os.getenv('PROXY_PORT', 19828))  # 梯子端口，如果不需要代理设为0
USE_PROXY = YOUR_PORT > 0

# 监控配置 - 精确关键词（已优化）
PAIN_KEYWORDS = {
    'ChatGPT': [
        'can\'t', 'doesn\'t work', 'error', 'failed',
        'slow', 'expensive', 'confusing', 'limitation'
    ],
    'Claude': [
        'can\'t', 'doesn\'t support', 'bug', 'api down',
        'rate limit', 'context window', 'expensive'
    ],
    'DeepSeek': [
        'slow', 'error', 'hallucination', 'can\'t',
        'doesn\'t work', 'quality issue'
    ],
    'Cursor': [
        'bug', 'crash', 'doesn\'t work', 'slow',
        'indexing fail', 'completion wrong'
    ],
    'Midjourney': [
        'hands weird', 'broken', 'ugly', 'consistency',
        'text fail', 'quality drop'
    ],
    'Sora': [
        'physics fail', 'movement unnatural', 'face melting',
        'flicker', 'artifact', 'quality'
    ]
}

# 垃圾词黑名单
SPAM_FILTERS = [
    '100+ AI Tools', 'Check my bio', 'Sign up now',
    'Top 10 tools', 'Affiliate', 'Giveaway', 'NFT',
    'crypto', 'bitcoin', 'follow me', 'DM me'
]

# =======================================================================

# 环境配置
if USE_PROXY:
    PROXY_URL = f'http://127.0.0.1:{YOUR_PORT}'
    os.environ['http_proxy'] = PROXY_URL
    os.environ['https_proxy'] = PROXY_URL
    os.environ['HTTP_PROXY'] = PROXY_URL
    os.environ['HTTPS_PROXY'] = PROXY_URL
    print(f"📡 代理已启用: {PROXY_URL}")
else:
    print("📡 代理已禁用（直连模式）")

# 创建数据目录
DATA_DIR = Path('./my_market_brain')
DATA_DIR.mkdir(exist_ok=True)

print(f"🎯 痛点雷达 v2.0 启动... [时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")

# 初始化组件
try:
    llm = LLMClient(provider=LLM_PROVIDER)
    yuque_gen = YuqueReportGenerator()
    telegram = TelegramNotifier()
    chroma_client = chromadb.PersistentClient(path=str(DATA_DIR))
    pain_collection = chroma_client.get_or_create_collection(name="pain_points_v2")
    print("✅ 所有组件加载完毕")
except Exception as e:
    print(f"❌ 初始化失败: {e}")
    print(f"提示: 请检查 .env 文件中的配置")
    sys.exit(1)

current_session_pains = []

# ==================== 工具函数 ====================

def is_spam(text):
    """垃圾内容检测"""
    text_lower = text.lower()
    for spam_word in SPAM_FILTERS:
        if spam_word.lower() in text_lower:
            return True
    return False

def save_pain(source, author, content, product):
    """保存痛点到数据库"""
    try:
        if is_spam(content):
            return False
            
        current_time = datetime.datetime.now().isoformat()
        content_fingerprint = hashlib.md5(content.encode('utf-8')).hexdigest()
        doc_id = f"PAIN_{source}_{product}_{content_fingerprint}"
        
        # 检查是否已存在
        existing = pain_collection.get(ids=[doc_id])
        if existing and existing['ids']:
            return False
        
        pain_collection.upsert(
            documents=[content],
            metadatas=[{
                "source": source,
                "author": str(author),
                "product": product,
                "type": "pain",
                "time": current_time
            }],
            ids=[doc_id]
        )
        current_session_pains.append({
            'source': source,
            'author': author,
            'product': product,
            'content': content,
            'time': current_time
        })
        print(f"  🩸 [{product}] {content[:50]}...")
        return True
    except Exception as e:
        print(f"  ⚠️ 保存失败: {e}")
        return False

async def scan_twitter():
    """扫描Twitter痛点"""
    print("\n🐦 [1/3] 正在扫描 Twitter...")
    client = Client(language='en-US')
    count = 0
    
    try:
        client.load_cookies('cookies.json')
        
        # 构建搜索查询
        search_queries = []
        for product, keywords in PAIN_KEYWORDS.items():
            for keyword in keywords[:2]:  # 每个产品选2个关键词
                search_queries.append(f'"{product}" {keyword}')
        
        # 随机选择5个查询
        selected_queries = random.sample(search_queries, min(5, len(search_queries)))
        print(f"  🎯 今日搜索词: {selected_queries}")
        
        for query in selected_queries:
            try:
                print(f"  🔍 搜索: {query}")
                tweets = await client.search_tweet(query, product='Latest', count=3)
                
                if not tweets:
                    continue
                
                for tweet in tweets:
                    text = tweet.text.replace('\n', ' ')
                    user = tweet.user.name if tweet.user else "Unknown"
                    
                    # 提取产品名
                    product = None
                    for prod in PAIN_KEYWORDS.keys():
                        if prod.lower() in query.lower():
                            product = prod
                            break
                    
                    if product and save_pain("Twitter", user, text, product):
                        count += 1
                
                await asyncio.sleep(1)
            except Exception as e:
                print(f"     ⚠️ 搜索出错: {e}")
                continue
                
    except Exception as e:
        print(f"❌ Twitter 扫描失败: {e}")
    
    return count

def scan_hacker_news():
    """扫描Hacker News"""
    print("\n📰 [2/3] 正在扫描 Hacker News...")
    count = 0
    
    try:
        # 获取热门故事
        resp = requests.get(
            'https://hacker-news.firebaseio.com/v0/topstories.json',
            timeout=10
        )
        top_ids = resp.json()[:10]
        
        for item_id in top_ids:
            try:
                item = requests.get(
                    f'https://hacker-news.firebaseio.com/v0/item/{item_id}.json',
                    timeout=10
                ).json()
                
                if item and item.get('score', 0) >= 100:
                    title = item.get('title', '')
                    text = item.get('text', '')
                    
                    # 检查是否包含痛点关键词
                    for product, keywords in PAIN_KEYWORDS.items():
                        for keyword in keywords:
                            if keyword.lower() in (title + text).lower():
                                content = f"Title: {title} | Text: {text[:100]}"
                                if save_pain("HackerNews", "Tech", content, product):
                                    count += 1
                                break
                
                time.sleep(0.5)
            except:
                pass
                
    except Exception as e:
        print(f"❌ HN 扫描失败: {e}")
    
    return count

def analyze_opportunities(raw_data):
    """用AI分析市场机会"""
    print("\n🧠 [3/3] AI 正在分析市场机会...")

    prompt = f"""
# Role: Market Opportunity Analyst
# Task: 从用户吐槽中提取可商业化的市场机会

## 分析框架
1. **痛点分类**
   - 功能缺陷 (Feature Gap)
   - 性能问题 (Performance Issue)
   - 成本问题 (Cost Issue)
   - 易用性 (UX Issue)

2. **机会评估**
   - 受众规模 (Market Size)
   - 解决难度 (Technical Difficulty)
   - 商业可行性 (Business Viability)

3. **产品建议**
   - 微产品形态 (Micro-SaaS)
   - 核心功能 (MVP)
   - 定价策略 (Pricing)

## 用户数据
{raw_data}

## 输出格式
### 🎯 Top 3 商业机会

1. [机会名称]
   - 痛点: ...
   - 市场规模: ...
   - 解决方案: ...
   - 建议行动: ...

2. [机会名称]
   ...

3. [机会名称]
   ...

### 📊 数据统计
- 总痛点数: ...
- 主要产品: ...
- 最热话题: ...
"""

    try:
        # 使用新的 LLM 客户端
        analysis = llm.analyze(prompt)
        return analysis
    except Exception as e:
        print(f"❌ LLM分析失败: {e}")
        return "❌ AI分析失败，请检查API密钥和网络连接"

async def deliver_report(content):
    """交付报告"""
    if content.startswith("❌"):
        print(f"\n🚫 {content}")
        return

    today = datetime.date.today().strftime("%Y-%m-%d")
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"Market_Opportunities_{timestamp}.docx"

    # 1. 保存本地 Word 文档
    try:
        # 确保 reports 目录存在
        reports_dir = Path('./reports')
        reports_dir.mkdir(exist_ok=True)

        doc = Document()
        doc.add_heading(f'🎯 市场机会分析报告 - {today}', 0)
        doc.add_paragraph(f"生成时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        doc.add_paragraph(f"捕获痛点数: {len(current_session_pains)}")
        doc.add_paragraph("=" * 50)

        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue
            if line.startswith('# '):
                doc.add_heading(line.replace('# ', ''), level=1)
            elif line.startswith('## '):
                doc.add_heading(line.replace('## ', ''), level=2)
            elif line.startswith('### '):
                doc.add_heading(line.replace('### ', ''), level=3)
            else:
                doc.add_paragraph(line)

        doc.save(reports_dir / filename)
        print(f"\n💾 ✅ 本地报告已生成: {filename}")
    except Exception as e:
        print(f"❌ Word生成失败: {e}")

    # 2. 生成语雀报告
    yuque_url = "生成失败"
    try:
        # 准备数据
        data = {
            'platforms_count': 2,  # Twitter + HN
            'raw_data_count': len(current_session_pains),
            'quality_opportunities': min(3, len(current_session_pains)),
            'pain_points_count': len(current_session_pains),
            'tech_trends_count': 0,
            'pain_points': [
                {
                    'product': p['product'],
                    'content': p['content'][:100]
                }
                for p in current_session_pains[:5]
            ],
            'sources': [
                {
                    'platform': p['source'],
                    'url': '#'
                }
                for p in current_session_pains[:5]
            ]
        }

        yuque_url = yuque_gen.create_report(data)
        print(f"✅ 语雀报告: {yuque_url}")
    except Exception as e:
        print(f"❌ 语雀报告生成失败: {e}")

    # 3. 发送 Telegram 通知
    try:
        summary = f"发现 {len(current_session_pains)} 个痛点"
        await telegram.send_report_notification(summary, yuque_url)
        print("✅ Telegram 通知已发送")
    except Exception as e:
        print(f"❌ Telegram 通知失败: {e}")

# ==================== 主程序 ====================

async def main():
    print("\n" + "="*60)
    print("🚀 开始监控循环")
    print("="*60)
    
    # 执行扫描
    c1 = await scan_twitter()
    c2 = scan_hacker_news()
    
    total = c1 + c2
    print(f"\n📊 本次捕获痛点数: {total}")
    
    if total > 0:
        # 格式化痛点数据
        raw_pains = "\n".join([
            f"【{p['source']}】({p['product']}) @{p['author']}: {p['content']}"
            for p in current_session_pains
        ])
        
        # AI分析
        analysis = analyze_opportunities(raw_pains)

        # 交付报告
        await deliver_report(analysis)
    else:
        print("🤷 未捕获到新痛点")
    
    print("\n✅ 监控循环完成")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ 用户中断")
    except Exception as e:
        print(f"\n❌ 程序错误: {e}")
        import traceback
        traceback.print_exc()
