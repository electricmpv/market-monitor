#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Market Monitor - 完整工作流
数据采集 → Codex 分析 → 语雀报告
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 确保环境变量已设置
if not os.getenv('AUTH_TOKEN') or not os.getenv('CT0'):
    print("❌ 缺少 Twitter 认证信息")
    print("💡 请在 .env 文件中设置 AUTH_TOKEN 和 CT0")
    sys.exit(1)

print("="*60)
print("🎯 Market Monitor - 完整工作流")
print("="*60)

# ==================== 步骤 1: 数据采集 ====================

def collect_all_data():
    """使用 multi_source_collector 采集所有数据"""
    print("\n📊 [1/4] 数据采集...")

    try:
        from multi_source_collector import MultiSourceCollector

        collector = MultiSourceCollector()
        results = collector.collect_all()
        data_file = collector.save_results()

        print(f"  ✅ 数据采集完成: {data_file}")
        return data_file, results

    except Exception as e:
        print(f"  ❌ 数据采集失败: {e}")
        import traceback
        traceback.print_exc()
        return None, None


# ==================== 步骤 2: Codex 分析 ====================

def analyze_with_codex(data_file):
    """使用 Codex 分析数据"""
    print("\n🧠 [2/4] Codex 深度分析...")

    if not data_file or not os.path.exists(data_file):
        print("  ❌ 数据文件不存在")
        return None

    # 读取数据
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 加载提示词模板
    import yaml

    try:
        with open('config/codex_analysis_prompt.yaml', 'r', encoding='utf-8') as f:
            prompt_config = yaml.safe_load(f)

        # 构建数据概览
        data_overview = prompt_config['data_overview_template'].format(
            timestamp=data.get('collected_at', datetime.now().isoformat()),
            platforms="Twitter/X, Reddit, GitHub, Hacker News",
            total_count=data.get('total_items', 0),
            twitter_count=len(data.get('twitter', [])),
            reddit_count=len(data.get('reddit', [])),
            hn_count=len(data.get('hackernews', [])),
            github_count=len(data.get('github', [])),
            other_count=0
        )

        # 格式化各平台数据
        def format_items(items, item_format):
            return "\n".join([
                item_format.format(i=i+1, **item)
                for i, item in enumerate(items[:30])  # 限制数量
            ])

        twitter_formatted = format_items(
            data.get('twitter', []),
            "**{i}. @{username}** ({created_at})\n{text}\n[链接]({url})\n"
        ) or "无数据"

        reddit_formatted = format_items(
            data.get('reddit', []),
            "**{i}. {title}** (r/{subreddit}, {score} pts)\n{selftext}\n[链接]({url})\n"
        ) or "无数据"

        hn_formatted = format_items(
            data.get('hackernews', []),
            "**{i}. {title}** (Score: {score})\n{text}\n[链接]({url})\n"
        ) or "无数据"

        github_formatted = format_items(
            data.get('github', []),
            "**{i}. {name}** (⭐{stars})\n{description}\n[链接]({url})\n"
        ) or "无数据"

        raw_data = prompt_config['raw_data_template'].format(
            twitter_data=twitter_formatted,
            reddit_data=reddit_formatted,
            hn_data=hn_formatted,
            github_data=github_formatted,
            other_data="无数据"
        )

        # 构建完整提示词
        prompt = prompt_config['main_prompt'].format(
            data_overview=data_overview,
            raw_data=raw_data
        )

    except Exception as e:
        print(f"  ⚠️  加载提示词模板失败: {e}，使用简化版...")

        # 简化版提示词
        prompt = f"""
# 任务：AI 市场机会深度分析

请对以下数据进行多维度深度分析。

## 数据概览
- 采集时间: {data.get('collected_at')}
- Twitter: {len(data.get('twitter', []))} 条
- Reddit: {len(data.get('reddit', []))} 条
- HackerNews: {len(data.get('hackernews', []))} 条
- GitHub: {len(data.get('github', []))} 条

## 原始数据
{json.dumps(data, indent=2, ensure_ascii=False)[:10000]}

请输出 Markdown 格式的分析报告，包含：
1. 核心发现（Top 3）
2. 用户痛点分析
3. 市场机会识别
4. 技术趋势追踪
5. 数据统计洞察
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
        with open(prompt_file, 'r') as f:
            result = subprocess.run(
                ['codex', 'exec', '--model', 'gpt-5.2-codex', '-o', output_file, '--json', '-'],
                stdin=f,
                capture_output=True,
                text=True,
                timeout=180
            )

        if result.returncode == 0 and os.path.exists(output_file):
            print("  ✅ Codex 分析完成")
            return output_file
        else:
            print(f"  ❌ Codex 执行失败: {result.stderr}")
            return None

    except Exception as e:
        print(f"  ❌ Codex 调用失败: {e}")
        return None


# ==================== 步骤 3: 生成语雀报告 ====================

def generate_yuque_report(analysis_file, data_file):
    """生成并发布语雀报告"""
    print("\n📄 [3/4] 生成语雀报告...")

    try:
        from push_deep_report_to_yuque import push_report_to_yuque

        # 读取分析结果
        if analysis_file and os.path.exists(analysis_file):
            with open(analysis_file, 'r', encoding='utf-8') as f:
                analysis = f.read()
        else:
            analysis = "❌ Codex 分析未完成"

        # 读取原始数据
        with open(data_file, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)

        # 构建完整报告
        timestamp = datetime.now().strftime('%Y年%m月%d日 %H:%M')
        title = f"市场监控日报 - {datetime.now().strftime('%Y-%m-%d')}"

        report = f"""# 🎯 AI 市场机会监控日报

> 📅 生成时间：{timestamp}
> 🤖 数据来源：Twitter/X, Reddit, GitHub, Hacker News
> 🧠 分析引擎：Codex (GPT-5.2)

---

## 📊 数据概览

| 指标 | 数值 |
|------|------|
| 监控平台数 | 4 |
| 原始数据量 | {raw_data.get('total_items', 0)} |
| Twitter 数据 | {len(raw_data.get('twitter', []))} 条 |
| Reddit 数据 | {len(raw_data.get('reddit', []))} 条 |
| HackerNews 数据 | {len(raw_data.get('hackernews', []))} 条 |
| GitHub 数据 | {len(raw_data.get('github', []))} 条 |

---

## 🧠 Codex AI 深度分析

{analysis}

---

## 📎 原始数据样本

### Twitter 样本
{chr(10).join([f"- @{t.get('username', 'unknown')}: {t.get('text', '')[:100]}..." for t in raw_data.get('twitter', [])[:5]])}

### Reddit 样本
{chr(10).join([f"- r/{r.get('subreddit', 'unknown')}: {r.get('title', '')[:100]}..." for r in raw_data.get('reddit', [])[:5]])}

### HackerNews 样本
{chr(10).join([f"- [{h.get('score', 0)} pts] {h.get('title', '')[:100]}..." for h in raw_data.get('hackernews', [])[:5]])}

### GitHub 样本
{chr(10).join([f"- ⭐{g.get('stars', 0)} {g.get('name', '')}: {g.get('description', '')[:100]}..." for g in raw_data.get('github', [])[:5]])}

---

> 🤖 本报告由 Market Monitor 自动生成 | 使用 Bird CLI 采集 Twitter 数据
"""

        # 推送到语雀
        yuque_url = push_report_to_yuque(title, report)

        if yuque_url:
            print(f"  ✅ 语雀报告已发布")
            print(f"  🔗 报告链接: {yuque_url}")
            return yuque_url
        else:
            # 保存本地备份
            backup_file = f"/tmp/yuque_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            with open(backup_file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"  💾 报告已保存到本地: {backup_file}")
            return backup_file

    except Exception as e:
        print(f"  ❌ 生成语雀报告失败: {e}")
        import traceback
        traceback.print_exc()
        return None


# ==================== 主流程 ====================

def main():
    print("\n开始执行完整工作流...\n")

    # 1. 数据采集
    data_file, results = collect_all_data()
    if not data_file:
        print("\n❌ 数据采集失败，终止流程")
        return

    # 2. Codex 分析
    analysis_file = analyze_with_codex(data_file)

    # 3. 生成语雀报告
    yuque_url = generate_yuque_report(analysis_file, data_file)

    # 4. 总结
    print("\n" + "="*60)
    print("✅ 完整工作流执行完成")
    print("="*60)
    print(f"\n📁 原始数据: {data_file}")
    if analysis_file:
        print(f"🧠 Codex 分析: {analysis_file}")
    if yuque_url:
        print(f"🔗 语雀报告: {yuque_url}")
    print("")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  用户中断")
    except Exception as e:
        print(f"\n❌ 程序错误: {e}")
        import traceback
        traceback.print_exc()
