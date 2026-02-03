#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Market Monitor - Codex 工作流版本
数据采集 → Codex 分析 → 语雀报告
"""

import os
import asyncio
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

print("="*60)
print("🎯 Market Monitor - Codex 工作流")
print("="*60)

# ==================== 步骤 1: 数据采集 ====================

async def collect_twitter_data():
    """采集 Twitter 数据"""
    print("\n📱 [1/4] 正在采集 Twitter 数据...")

    try:
        from twikit import Client

        client = Client(language='en-US')
        client.load_cookies('cookies.json')

        # 搜索关键词
        search_queries = [
            '"ChatGPT" expensive',
            '"Claude" slow',
            '"AI tool" problem',
        ]

        tweets_data = []
        for query in search_queries[:2]:  # 限制查询数量，避免限流
            print(f"  🔍 搜索: {query}")
            try:
                tweets = await client.search_tweet(query, product='Latest', count=5)

                for tweet in tweets:
                    tweets_data.append({
                        'text': tweet.text,
                        'user': tweet.user.name if tweet.user else "Unknown",
                        'created_at': str(tweet.created_at) if hasattr(tweet, 'created_at') else None,
                        'url': f"https://twitter.com/i/status/{tweet.id}" if hasattr(tweet, 'id') else None
                    })

                await asyncio.sleep(2)  # 避免限流
            except Exception as e:
                print(f"     ⚠️ 搜索 '{query}' 出错: {e}")
                continue

        print(f"  ✅ 采集到 {len(tweets_data)} 条 tweets")
        return tweets_data

    except Exception as e:
        print(f"  ❌ Twitter 采集失败: {e}")
        return []


def collect_hackernews_data():
    """采集 HackerNews 数据"""
    print("\n📰 [2/4] 正在采集 Hacker News 数据...")

    try:
        import requests

        # 获取热门故事
        resp = requests.get(
            'https://hacker-news.firebaseio.com/v0/topstories.json',
            timeout=10
        )
        top_ids = resp.json()[:15]

        hn_data = []
        for item_id in top_ids:
            try:
                item = requests.get(
                    f'https://hacker-news.firebaseio.com/v0/item/{item_id}.json',
                    timeout=10
                ).json()

                if item and item.get('score', 0) >= 50:
                    hn_data.append({
                        'title': item.get('title', ''),
                        'text': item.get('text', ''),
                        'score': item.get('score', 0),
                        'url': item.get('url', f"https://news.ycombinator.com/item?id={item_id}"),
                        'by': item.get('by', 'Unknown')
                    })
            except:
                continue

        print(f"  ✅ 采集到 {len(hn_data)} 条 HN 故事")
        return hn_data

    except Exception as e:
        print(f"  ❌ HackerNews 采集失败: {e}")
        return []


# ==================== 步骤 2: 保存数据 ====================

def save_collected_data(twitter_data, hn_data):
    """保存采集的数据"""
    print("\n💾 保存采集数据...")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    data_file = f"/tmp/market_data_{timestamp}.json"

    data = {
        'collected_at': datetime.now().isoformat(),
        'twitter': twitter_data,
        'hackernews': hn_data,
        'total_items': len(twitter_data) + len(hn_data)
    }

    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"  ✅ 数据已保存: {data_file}")
    return data_file


# ==================== 步骤 3: Codex 分析 ====================

def analyze_with_codex(data_file):
    """使用 Codex 分析数据"""
    print("\n🧠 [3/4] 使用 Codex 分析数据...")

    # 读取数据
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 加载 CODEX 分析提示词模板
    import yaml

    prompt_template_path = 'config/codex_analysis_prompt.yaml'
    try:
        with open(prompt_template_path, 'r', encoding='utf-8') as f:
            prompt_config = yaml.safe_load(f)

        # 构建数据概览
        data_overview = prompt_config['data_overview_template'].format(
            timestamp=data['collected_at'],
            platforms="Twitter/X, Hacker News",
            total_count=len(data['twitter']) + len(data['hackernews']),
            twitter_count=len(data['twitter']),
            reddit_count=0,
            hn_count=len(data['hackernews']),
            github_count=0,
            other_count=0
        )

        # 格式化原始数据
        twitter_formatted = "\n".join([
            f"**{i+1}. @{t['user']}** ({t.get('created_at', 'N/A')})\n{t['text']}\n[链接]({t.get('url', '#')})\n"
            for i, t in enumerate(data['twitter'][:30])  # 限制数量避免token溢出
        ])

        hn_formatted = "\n".join([
            f"**{i+1}. {h['title']}** (Score: {h['score']})\n{h.get('text', '')}\n[链接]({h.get('url', '#')})\n"
            for i, h in enumerate(data['hackernews'][:30])
        ])

        raw_data = prompt_config['raw_data_template'].format(
            twitter_data=twitter_formatted or "无数据",
            reddit_data="无数据（未采集）",
            hn_data=hn_formatted or "无数据",
            github_data="无数据（未采集）",
            other_data="无数据"
        )

        # 构建完整提示词
        prompt = prompt_config['main_prompt'].format(
            data_overview=data_overview,
            raw_data=raw_data
        )

    except Exception as e:
        print(f"  ⚠️ 无法加载提示词模板: {e}")
        print("  📝 使用默认提示词...")

        # 回退到简化版提示词
        prompt = f"""
# 任务：AI 市场机会深度分析

你是一位资深的市场分析专家。请对以下数据进行多维度深度分析。

## 数据概览
- 采集时间: {data['collected_at']}
- Twitter 数据: {len(data['twitter'])} 条
- HackerNews 数据: {len(data['hackernews'])} 条

## Twitter 数据
{json.dumps(data['twitter'][:20], indent=2, ensure_ascii=False)}

## HackerNews 数据
{json.dumps(data['hackernews'][:20], indent=2, ensure_ascii=False)}

请输出包含以下内容的 Markdown 报告：
1. 核心发现 (Top 3)
2. 用户痛点分析（按产品分类，标注严重程度）
3. 市场机会识别（包含行业定位、用户画像、商业化路径、超级个人适配度）
4. 技术趋势追踪
5. 数据统计洞察
6. AI 分析师多视角点评（产品经理、技术专家、投资人）

请开始分析。
"""

    # 保存提示词
    prompt_file = "/tmp/codex_prompt.txt"
    with open(prompt_file, 'w', encoding='utf-8') as f:
        f.write(prompt)

    # 输出文件
    output_file = "/tmp/codex_analysis.md"

    print("  📝 提示词已准备")
    print("  🚀 调用 Codex CLI...")

    # 调用 Codex
    try:
        result = subprocess.run(
            [
                'codex', 'exec',
                '--model', 'gpt-5.2-codex',  # 使用 Codex 支持的模型
                '-o', output_file,
                '--json',  # JSON 输出便于解析
                '-'  # 从 stdin 读取
            ],
            stdin=open(prompt_file, 'r'),
            capture_output=True,
            text=True,
            timeout=180  # 3分钟超时
        )

        if result.returncode == 0:
            print("  ✅ Codex 分析完成")
            return output_file
        else:
            print(f"  ❌ Codex 执行失败:")
            print(f"     返回码: {result.returncode}")
            print(f"     错误: {result.stderr}")
            return None

    except subprocess.TimeoutExpired:
        print("  ❌ Codex 执行超时")
        return None
    except Exception as e:
        print(f"  ❌ 调用 Codex 失败: {e}")
        return None


# ==================== 步骤 4: 生成语雀报告 ====================

def generate_yuque_report(analysis_file, raw_data_file):
    """生成语雀报告"""
    print("\n📄 [4/4] 生成语雀报告...")

    try:
        from yuque_report_generator import YuqueReportGenerator

        # 读取 Codex 分析结果
        if analysis_file and os.path.exists(analysis_file):
            with open(analysis_file, 'r', encoding='utf-8') as f:
                analysis = f.read()
        else:
            analysis = "❌ Codex 分析未完成"

        # 读取原始数据
        with open(raw_data_file, 'r') as f:
            raw_data = json.load(f)

        # 准备报告数据
        report_data = {
            'platforms_count': 2,
            'raw_data_count': raw_data['total_items'],
            'quality_opportunities': len(raw_data['twitter']),
            'pain_points_count': len(raw_data['hackernews']),
            'tech_trends_count': 0,
            'analysis_by_codex': analysis,  # Codex 的分析
            'raw_data': raw_data,  # 原始数据
        }

        # 生成语雀报告
        gen = YuqueReportGenerator()

        # 构建完整的 Markdown
        markdown = f"""# 🎯 AI 市场机会监控日报

> 📅 生成时间：{datetime.now().strftime('%Y年%m月%d日 %H:%M')}
> 🤖 数据来源：Twitter/X, Hacker News
> 🧠 分析引擎：Codex (GPT-4)

---

## 📊 数据概览

| 指标 | 数值 |
|------|------|
| 监控平台数 | 2 (Twitter, HN) |
| 原始数据量 | {raw_data['total_items']} |
| Twitter 数据 | {len(raw_data['twitter'])} 条 |
| HackerNews 数据 | {len(raw_data['hackernews'])} 条 |

---

## 🧠 Codex AI 分析

{analysis}

---

## 📎 原始数据

### Twitter 数据

{chr(10).join([f"**@{t['user']}**: {t['text'][:200]}..." for t in raw_data['twitter'][:10]])}

### HackerNews 数据

{chr(10).join([f"**[{h['score']} pts]** {h['title']}" for h in raw_data['hackernews'][:10]])}

---

> 🤖 本报告由 Market Monitor (Codex Workflow) 自动生成
> 📧 反馈建议：[GitHub Issues](https://github.com/electricmpv/market-monitor/issues)
"""

        # 直接创建语雀文档（使用用户的命名空间）
        title = f"市场监控日报 - {datetime.now().strftime('%Y年%m月%d日')}"
        slug = f"report-{datetime.now().strftime('%Y%m%d-%H%M')}"  # 加上时间避免冲突

        import requests

        # 使用个人空间而不是知识库
        doc_url = f"https://www.yuque.com/api/v2/repos/{gen.namespace}/docs"
        headers = {
            'X-Auth-Token': gen.token,
            'Content-Type': 'application/json'
        }

        payload = {
            'title': title,
            'slug': slug,
            'body': markdown,
            'public': 0,
            'format': 'markdown'
        }

        print(f"  📝 创建文档: {title}")
        response = requests.post(doc_url, headers=headers, json=payload)

        if response.status_code in [200, 201]:
            result = response.json()
            # 尝试从响应中获取 URL
            if isinstance(result, dict) and 'data' in result:
                doc_slug = result['data'].get('slug', slug)
                yuque_url = f"https://www.yuque.com/{gen.namespace}/{doc_slug}"
            else:
                yuque_url = f"https://www.yuque.com/{gen.namespace}/{slug}"

            print(f"  ✅ 语雀报告已生成")
            print(f"  🔗 报告链接: {yuque_url}")
            return yuque_url
        else:
            print(f"  ❌ 语雀报告生成失败 ({response.status_code}): {response.text}")
            # 保存本地备份
            backup_file = f"/tmp/yuque_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            with open(backup_file, 'w', encoding='utf-8') as f:
                f.write(markdown)
            print(f"  💾 报告已保存到本地: {backup_file}")
            return backup_file

    except Exception as e:
        print(f"  ❌ 生成语雀报告失败: {e}")
        import traceback
        traceback.print_exc()
        return None


# ==================== 主流程 ====================

async def main():
    print("\n开始执行 Codex 工作流...\n")

    # 1. 数据采集
    twitter_data = await collect_twitter_data()
    hn_data = collect_hackernews_data()

    if not twitter_data and not hn_data:
        print("\n❌ 未采集到任何数据，终止流程")
        return

    # 2. 保存数据
    data_file = save_collected_data(twitter_data, hn_data)

    # 3. Codex 分析
    analysis_file = analyze_with_codex(data_file)

    # 4. 生成语雀报告
    yuque_url = generate_yuque_report(analysis_file, data_file)

    # 总结
    print("\n" + "="*60)
    print("✅ Codex 工作流执行完成")
    print("="*60)
    print(f"\n📁 原始数据: {data_file}")
    if analysis_file:
        print(f"🧠 Codex 分析: {analysis_file}")
    if yuque_url:
        print(f"🔗 语雀报告: {yuque_url}")
    print("")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ 用户中断")
    except Exception as e:
        print(f"\n❌ 程序错误: {e}")
        import traceback
        traceback.print_exc()
