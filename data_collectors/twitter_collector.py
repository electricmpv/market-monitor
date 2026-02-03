#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Twitter/X 数据采集器 - 使用 Twikit"""

import asyncio
import os
from datetime import datetime
from pathlib import Path


class TwitterCollector:
    """Twitter/X 数据采集器"""

    def __init__(self, cookies_file='twitter_cookies.json'):
        """
        初始化 Twitter 采集器

        Args:
            cookies_file: Twitter cookies 文件路径
        """
        self.cookies_file = cookies_file
        self.client = None

    async def initialize(self):
        """初始化 Twitter 客户端"""
        try:
            from twikit import Client

            self.client = Client(language='en-US')

            # 检查 cookies 文件是否存在
            if Path(self.cookies_file).exists():
                self.client.load_cookies(self.cookies_file)
                print("  ✅ Twitter cookies 已加载")
            else:
                print(f"  ⚠️  Twitter cookies 文件不存在: {self.cookies_file}")
                print("  💡 请先运行登录脚本生成 cookies 文件")
                return False

            return True

        except ImportError:
            print("  ❌ twikit 未安装")
            return False
        except Exception as e:
            print(f"  ❌ Twitter 初始化失败: {e}")
            return False

    async def collect_by_keywords(self, keywords, max_results=20):
        """
        根据关键词采集 tweets

        Args:
            keywords: 关键词列表
            max_results: 每个关键词最多采集多少条

        Returns:
            采集到的 tweets 列表
        """
        if not self.client:
            print("  ⚠️  Twitter 客户端未初始化")
            return []

        all_tweets = []

        for keyword in keywords:
            try:
                print(f"  🔍 搜索: {keyword}")

                # 搜索 tweets
                tweets = await self.client.search_tweet(
                    keyword,
                    product='Latest',
                    count=max_results
                )

                # 提取数据
                for tweet in tweets:
                    tweet_data = {
                        'text': tweet.text,
                        'user': tweet.user.name if tweet.user else "Unknown",
                        'username': tweet.user.screen_name if tweet.user else "unknown",
                        'created_at': str(tweet.created_at) if hasattr(tweet, 'created_at') else None,
                        'likes': tweet.favorite_count if hasattr(tweet, 'favorite_count') else 0,
                        'retweets': tweet.retweet_count if hasattr(tweet, 'retweet_count') else 0,
                        'url': f"https://twitter.com/{tweet.user.screen_name}/status/{tweet.id}" if tweet.user and hasattr(tweet, 'id') else None,
                        'keyword': keyword,
                        'source': 'twitter'
                    }

                    all_tweets.append(tweet_data)

                print(f"    ✅ 采集到 {len(tweets)} 条")

                # 避免速率限制
                await asyncio.sleep(2)

            except Exception as e:
                print(f"    ⚠️  搜索 '{keyword}' 失败: {e}")
                continue

        return all_tweets

    async def collect_from_users(self, usernames, max_tweets=10):
        """
        采集指定用户的最新 tweets

        Args:
            usernames: 用户名列表（不含 @）
            max_tweets: 每个用户采集多少条

        Returns:
            采集到的 tweets 列表
        """
        if not self.client:
            print("  ⚠️  Twitter 客户端未初始化")
            return []

        all_tweets = []

        for username in usernames:
            try:
                print(f"  👤 采集用户: @{username}")

                # 获取用户时间线
                user = await self.client.get_user_by_screen_name(username)
                tweets = await user.get_tweets('Tweets', count=max_tweets)

                # 提取数据
                for tweet in tweets:
                    tweet_data = {
                        'text': tweet.text,
                        'user': tweet.user.name if tweet.user else username,
                        'username': username,
                        'created_at': str(tweet.created_at) if hasattr(tweet, 'created_at') else None,
                        'likes': tweet.favorite_count if hasattr(tweet, 'favorite_count') else 0,
                        'retweets': tweet.retweet_count if hasattr(tweet, 'retweet_count') else 0,
                        'url': f"https://twitter.com/{username}/status/{tweet.id}" if hasattr(tweet, 'id') else None,
                        'source': 'twitter'
                    }

                    all_tweets.append(tweet_data)

                print(f"    ✅ 采集到 {len(tweets)} 条")

                # 避免速率限制
                await asyncio.sleep(2)

            except Exception as e:
                print(f"    ⚠️  采集 @{username} 失败: {e}")
                continue

        return all_tweets


# 快速测试
if __name__ == "__main__":
    async def test():
        collector = TwitterCollector()

        if await collector.initialize():
            # 测试关键词搜索
            keywords = ["ChatGPT expensive", "AI tool problem"]
            tweets = await collector.collect_by_keywords(keywords, max_results=5)

            print(f"\n✅ 采集到 {len(tweets)} 条 tweets")
            for tweet in tweets[:3]:
                print(f"  - @{tweet['username']}: {tweet['text'][:60]}...")

    asyncio.run(test())
