#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
多数据源采集管理器
整合 Twitter、Reddit、GitHub、Hacker News 等数据源
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent))

from data_collectors import TwitterCollector, RedditCollector, GitHubCollector
from enhanced_config_loader import EnhancedConfigLoader


class MultiSourceCollector:
    """多数据源采集管理器"""

    def __init__(self, config_dir='config'):
        """初始化采集管理器"""
        # 加载配置
        self.config = EnhancedConfigLoader(config_dir)

        # 初始化采集器
        self.twitter = TwitterCollector()
        self.reddit = RedditCollector()
        self.github = GitHubCollector()

        # 采集结果
        self.results = {
            'twitter': [],
            'reddit': [],
            'github': [],
            'hackernews': []
        }

    def collect_all(self):
        """采集所有数据源"""
        print("\n" + "="*60)
        print("🚀 开始多数据源采集")
        print("="*60 + "\n")

        # 1. Twitter
        self._collect_twitter()

        # 2. Reddit
        self._collect_reddit()

        # 3. GitHub
        self._collect_github()

        # 4. Hacker News
        self._collect_hackernews()

        # 统计
        total = sum(len(v) for v in self.results.values())
        print("\n" + "="*60)
        print(f"✅ 采集完成！总计 {total} 条数据")
        print("="*60)

        for source, data in self.results.items():
            if data:
                print(f"  - {source.capitalize()}: {len(data)} 条")

        return self.results

    def _collect_twitter(self):
        """采集 Twitter 数据"""
        print("📱 [1/4] 采集 Twitter/X 数据...")

        try:
            # 初始化（bird采集器是同步的）
            if not self.twitter.initialize():
                print("  ⚠️  Twitter 采集器初始化失败，跳过")
                return

            # 获取配置
            twitter_config = self.config.get_platform_config('twitter')
            if not twitter_config:
                print("  ⚠️  Twitter 配置未找到")
                return

            # 方式1: 关键词搜索
            keywords = []
            keyword_config = twitter_config.get('keywords', {})
            for category, words in keyword_config.items():
                keywords.extend(words[:3])  # 每个类别取前3个

            if keywords:
                tweets = self.twitter.collect_by_keywords(keywords[:5], max_results=5)
                self.results['twitter'].extend(tweets)

            # 方式2: 监控 Influencers
            influencers = self.config.get_influencers_by_priority('high')
            usernames = [
                inf.get('twitter', '').replace('@', '')
                for inf in influencers[:5]  # 前5个高优先级
                if inf.get('twitter')
            ]

            if usernames:
                user_tweets = self.twitter.collect_from_users(usernames, max_tweets=3)
                self.results['twitter'].extend(user_tweets)

            print(f"  ✅ Twitter 采集完成: {len(self.results['twitter'])} 条\n")

        except Exception as e:
            print(f"  ❌ Twitter 采集失败: {e}\n")

    def _collect_reddit(self):
        """采集 Reddit 数据"""
        print("📱 [2/4] 采集 Reddit 数据...")

        try:
            # 初始化
            if not self.reddit.initialize():
                print("  ⚠️  Reddit 采集器初始化失败，跳过")
                return

            # 获取配置的 subreddits
            subreddits = self.config.get_reddit_subreddits(priority='high')
            subreddit_names = [sr['name'] for sr in subreddits[:5]]  # 前5个

            if subreddit_names:
                posts = self.reddit.collect_from_subreddits(
                    subreddit_names,
                    min_score=20,  # 降低阈值以获得更多数据
                    max_posts=5
                )
                self.results['reddit'].extend(posts)

            print(f"  ✅ Reddit 采集完成: {len(self.results['reddit'])} 条\n")

        except Exception as e:
            print(f"  ❌ Reddit 采集失败: {e}\n")

    def _collect_github(self):
        """采集 GitHub 数据"""
        print("🐙 [3/4] 采集 GitHub Trending...")

        try:
            # 采集 Trending
            repos = self.github.collect_trending(
                languages=['python', 'typescript', 'javascript'],
                time_range='daily',
                max_repos=5
            )
            self.results['github'].extend(repos)

            print(f"  ✅ GitHub 采集完成: {len(self.results['github'])} 条\n")

        except Exception as e:
            print(f"  ❌ GitHub 采集失败: {e}\n")

    def _collect_hackernews(self):
        """采集 Hacker News 数据"""
        print("📰 [4/4] 采集 Hacker News...")

        try:
            import requests

            # 获取热门故事
            response = requests.get(
                'https://hacker-news.firebaseio.com/v0/topstories.json',
                timeout=10
            )
            top_ids = response.json()[:20]

            for item_id in top_ids:
                try:
                    item = requests.get(
                        f'https://hacker-news.firebaseio.com/v0/item/{item_id}.json',
                        timeout=10
                    ).json()

                    if item and item.get('score', 0) >= 50:
                        hn_data = {
                            'title': item.get('title', ''),
                            'text': item.get('text', ''),
                            'score': item.get('score', 0),
                            'url': item.get('url', f"https://news.ycombinator.com/item?id={item_id}"),
                            'by': item.get('by', 'Unknown'),
                            'comments': item.get('descendants', 0),
                            'source': 'hackernews'
                        }
                        self.results['hackernews'].append(hn_data)

                        if len(self.results['hackernews']) >= 10:
                            break

                except:
                    continue

            print(f"  ✅ Hacker News 采集完成: {len(self.results['hackernews'])} 条\n")

        except Exception as e:
            print(f"  ❌ Hacker News 采集失败: {e}\n")

    def save_results(self, output_file=None):
        """保存采集结果"""
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"/tmp/market_data_{timestamp}.json"

        data = {
            'collected_at': datetime.now().isoformat(),
            'sources': list(self.results.keys()),
            'total_items': sum(len(v) for v in self.results.values()),
            **self.results
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"\n💾 数据已保存: {output_file}")
        return output_file

    def get_summary(self):
        """获取采集摘要"""
        total = sum(len(v) for v in self.results.values())

        summary = {
            'total_items': total,
            'by_source': {
                source: len(data)
                for source, data in self.results.items()
            },
            'collected_at': datetime.now().isoformat()
        }

        return summary


def main():
    """主函数"""
    # 创建采集器
    collector = MultiSourceCollector()

    # 采集所有数据
    results = collector.collect_all()

    # 保存结果
    output_file = collector.save_results()

    # 打印摘要
    summary = collector.get_summary()
    print(f"\n📊 采集摘要:")
    print(f"   总计: {summary['total_items']} 条")
    for source, count in summary['by_source'].items():
        if count > 0:
            print(f"   - {source}: {count} 条")

    return output_file


if __name__ == "__main__":
    main()
