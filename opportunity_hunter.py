#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔍 机会猎手 v2.0 - 融资、创业、技术突破监控
Author: 电动面包
Purpose: 发现融资项目、创业团队、技术突破
"""

import os
import datetime
import time
import hashlib
import json
import sys
from pathlib import Path

try:
    import requests
    import chromadb
    from docx import Document
    from docx.shared import Pt, RGBColor
    from llm_client import LLMClient
    from yuque_report_generator import YuqueReportGenerator
    from telegram_notifier import TelegramNotifier
except ImportError as e:
    print(f"❌ 依赖库缺失: {e}")
    print("请运行: pip install -r requirements.txt")
    sys.exit(1)

# ==================== 🛠️ 用户配置区 ====================

LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'deepseek')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '')

YOUR_PORT = int(os.getenv('PROXY_PORT', 19828))
USE_PROXY = YOUR_PORT > 0

# GitHub搜索关键词 - 精确版
GITHUB_KEYWORDS = [
    # AI Agent框架
    'AI agent framework', 'LLM agent', 'autonomous agent',
    'agent orchestration', 'multi-agent',
    
    # RAG系统
    'RAG pipeline', 'retrieval augmented', 'vector database',
    'semantic search', 'knowledge graph',
    
    # 提示工程
    'prompt engineering', 'prompt optimization',
    'prompt template', 'few-shot learning',
    
    # 自动化
    'workflow automation', 'task automation',
    'browser automation', 'API automation',
    
    # 新工具
    'LLM framework', 'AI framework', 'generative AI',
    'DeepSeek', 'Claude integration', 'GPT wrapper'
]

# GitHub过滤
MIN_STARS = 300
DAYS_SINCE_UPDATE = 90

# Hacker News关键词
HN_KEYWORDS = [
    'AI', 'machine learning', 'LLM', 'GPT', 'Claude',
    'startup', 'funding', 'Series A', 'Series B',
    'open source', 'breakthrough', 'SOTA'
]

# =======================================================================

if USE_PROXY:
    PROXY_URL = f'http://127.0.0.1:{YOUR_PORT}'
    os.environ['http_proxy'] = PROXY_URL
    os.environ['https_proxy'] = PROXY_URL
    print(f"📡 代理已启用: {PROXY_URL}")

DATA_DIR = Path('./my_market_brain')
DATA_DIR.mkdir(exist_ok=True)

print(f"🔍 机会猎手 v2.0 启动... [时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")

try:
    llm = LLMClient(provider=LLM_PROVIDER)
    yuque_gen = YuqueReportGenerator()
    telegram = TelegramNotifier()
    chroma_client = chromadb.PersistentClient(path=str(DATA_DIR))
    opportunity_collection = chroma_client.get_or_create_collection(name="opportunities_v2")
    print("✅ 所有组件加载完毕")
except Exception as e:
    print(f"❌ 初始化失败: {e}")
    print(f"提示: 请检查 .env 文件中的配置")
    sys.exit(1)

current_session_opportunities = []

# ==================== 工具函数 ====================

def create_robust_session():
    """创建抗网络波动的会话"""
    session = requests.Session()
    if USE_PROXY:
        session.proxies = {"http": PROXY_URL, "https": PROXY_URL}
    return session

http = create_robust_session()

def save_opportunity(source, title, description, link, metadata):
    """保存机会"""
    try:
        content = f"{source}: {title} | {description}"
        content_fingerprint = hashlib.md5(content.encode('utf-8')).hexdigest()
        doc_id = f"OPP_{source}_{content_fingerprint}"
        
        # 检查重复
        existing = opportunity_collection.get(ids=[doc_id])
        if existing and existing['ids']:
            return False
        
        current_time = datetime.datetime.now().isoformat()
        opportunity_collection.upsert(
            documents=[content],
            metadatas=[{
                "source": source,
                "title": title,
                "type": metadata.get('type', 'unknown'),
                "time": current_time,
                "link": link
            }],
            ids=[doc_id]
        )
        
        current_session_opportunities.append({
            'source': source,
            'title': title,
            'description': description,
            'link': link,
            'metadata': metadata,
            'time': current_time
        })
        
        print(f"  💡 [{source}] {title[:50]}...")
        return True
    except Exception as e:
        print(f"  ⚠️ 保存失败: {e}")
        return False

def hunt_github():
    """GitHub项目猎手"""
    print("\n🐙 [1/2] 正在扫描 GitHub...")
    count = 0
    
    headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MarketHunter/v2'
    }
    if GITHUB_TOKEN:
        headers['Authorization'] = f'token {GITHUB_TOKEN}'
    
    try:
        for keyword in GITHUB_KEYWORDS[:5]:  # 每次选5个关键词
            print(f"  🔍 搜索: {keyword}")
            
            api_url = f"https://api.github.com/search/repositories?q={keyword}+stars:>{MIN_STARS}&sort=updated&order=desc&per_page=3"
            
            try:
                resp = http.get(api_url, headers=headers, timeout=15)
                
                if resp.status_code == 200:
                    items = resp.json().get('items', [])
                    
                    for item in items:
                        updated_at = item['updated_at'][:10]
                        last_update = datetime.datetime.strptime(updated_at, "%Y-%m-%d")
                        days_diff = (datetime.datetime.now() - last_update).days
                        
                        if days_diff > DAYS_SINCE_UPDATE:
                            continue
                        
                        if save_opportunity(
                            source="GitHub",
                            title=item['full_name'],
                            description=item['description'] or "No description",
                            link=item['html_url'],
                            metadata={
                                'type': 'OpenSource',
                                'stars': item['stargazers_count'],
                                'language': item['language'],
                                'updated': updated_at
                            }
                        ):
                            count += 1
                
                elif resp.status_code == 403:
                    print("⛔ GitHub API 频率超限")
                    break
                
                time.sleep(1)
                
            except Exception as e:
                print(f"     ⚠️ 搜索出错: {e}")
                continue
    
    except Exception as e:
        print(f"❌ GitHub 扫描失败: {e}")
    
    return count

def hunt_hacker_news():
    """Hacker News机会猎手"""
    print("\n📰 [2/2] 正在扫描 Hacker News...")
    count = 0
    
    try:
        resp = requests.get(
            'https://hacker-news.firebaseio.com/v0/topstories.json',
            timeout=10
        )
        top_ids = resp.json()[:15]
        
        for item_id in top_ids:
            try:
                item = requests.get(
                    f'https://hacker-news.firebaseio.com/v0/item/{item_id}.json',
                    timeout=10
                ).json()
                
                if item and item.get('score', 0) >= 150:
                    title = item.get('title', '')
                    text = item.get('text', '')
                    url = item.get('url', '')
                    
                    # 检查是否包含机会关键词
                    content_lower = (title + text).lower()
                    is_opportunity = False
                    opp_type = 'News'
                    
                    if any(kw in content_lower for kw in ['funding', 'series', 'raised', 'investment']):
                        is_opportunity = True
                        opp_type = 'Funding'
                    elif any(kw in content_lower for kw in ['startup', 'founded', 'launch']):
                        is_opportunity = True
                        opp_type = 'Startup'
                    elif any(kw in content_lower for kw in ['breakthrough', 'SOTA', 'new', 'release']):
                        is_opportunity = True
                        opp_type = 'Technology'
                    
                    if is_opportunity:
                        if save_opportunity(
                            source="HackerNews",
                            title=title,
                            description=text[:200],
                            link=url,
                            metadata={
                                'type': opp_type,
                                'score': item.get('score', 0)
                            }
                        ):
                            count += 1
                
                time.sleep(0.5)
            except:
                pass
    
    except Exception as e:
        print(f"❌ HN 扫描失败: {e}")
    
    return count

def analyze_opportunities_ai(raw_data):
    """AI分析机会"""
    print("\n🧠 正在用AI分析机会...")
    
    prompt = f"""
# Role: Investment & Startup Analyst
# Task: 从技术新闻和开源项目中识别商业机会

## 分析维度
1. **融资信号** - 哪些创业公司获得融资？为什么？
2. **技术趋势** - 哪些技术方向在升温？
3. **工具机会** - 哪些开源项目可能商业化？
4. **市场缺口** - 还有哪些未被满足的需求？

## 数据
{raw_data}

## 输出格式
### 🎯 Top 5 机会

1. [机会名称]
   - 类型: [融资/技术/工具/市场]
   - 核心价值: ...
   - 为什么重要: ...
   - 你的行动: ...

2. [机会名称]
   ...

### 📊 趋势总结
- 最热话题: ...
- 融资热度: ...
- 技术方向: ...
"""
    
    try:
        # 使用新的 LLM 客户端
        analysis = llm.analyze(prompt)
        return analysis
    except Exception as e:
        print(f"❌ LLM分析失败: {e}")
        return "❌ AI分析失败，请检查API密钥和网络连接"
    
    return "❌ AI分析失败"

async def deliver_report(content):
    """交付报告"""
    if content.startswith("❌"):
        print(f"\n🚫 {content}")
        return

    today = datetime.date.today().strftime("%Y-%m-%d")
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"Opportunities_Report_{timestamp}.docx"

    # 1. 保存本地 Word 文档
    try:
        # 确保 reports 目录存在
        reports_dir = Path('./reports')
        reports_dir.mkdir(exist_ok=True)

        doc = Document()
        doc.add_heading(f'🔍 机会发现报告 - {today}', 0)
        doc.add_paragraph(f"生成时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        doc.add_paragraph(f"发现机会数: {len(current_session_opportunities)}")
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
            'platforms_count': 2,  # GitHub + HN
            'raw_data_count': len(current_session_opportunities),
            'quality_opportunities': min(5, len(current_session_opportunities)),
            'pain_points_count': 0,
            'tech_trends_count': len(current_session_opportunities),
            'tech_trends': [
                {
                    'title': o['title'],
                    'description': o['description'][:100]
                }
                for o in current_session_opportunities[:5]
            ],
            'sources': [
                {
                    'platform': o['source'],
                    'url': o.get('url', '#')
                }
                for o in current_session_opportunities[:5]
            ]
        }

        yuque_url = yuque_gen.create_report(data)
        print(f"✅ 语雀报告: {yuque_url}")
    except Exception as e:
        print(f"❌ 语雀报告生成失败: {e}")

    # 3. 发送 Telegram 通知
    try:
        summary = f"发现 {len(current_session_opportunities)} 个机会"
        await telegram.send_report_notification(summary, yuque_url)
        print("✅ Telegram 通知已发送")
    except Exception as e:
        print(f"❌ Telegram 通知失败: {e}")

# ==================== 主程序 ====================

async def main():
    print("\n" + "="*60)
    print("🚀 开始机会猎手循环")
    print("="*60)

    c1 = hunt_github()
    c2 = hunt_hacker_news()

    total = c1 + c2
    print(f"\n📊 本次发现机会数: {total}")

    if total > 0:
        raw_opps = "\n".join([
            f"【{o['source']}】{o['title']}: {o['description']}"
            for o in current_session_opportunities
        ])

        analysis = analyze_opportunities_ai(raw_opps)
        await deliver_report(analysis)
    else:
        print("🤷 未发现新机会")

    print("\n✅ 机会猎手循环完成")

if __name__ == "__main__":
    import asyncio
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ 用户中断")
    except Exception as e:
        print(f"\n❌ 程序错误: {e}")
        import traceback
        traceback.print_exc()
