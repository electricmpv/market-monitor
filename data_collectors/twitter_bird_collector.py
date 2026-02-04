#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Twitter/X 数据采集器 - 使用 bird CLI"""

import json
import os
import subprocess
import time
from datetime import datetime
from pathlib import Path


class TwitterBirdCollector:
    """使用 bird CLI 的 Twitter 数据采集器"""

    def __init__(self):
        """初始化采集器"""
        self.auth_token = None
        self.ct0 = None
        self._load_credentials()

    def _load_credentials(self):
        """从配置文件或环境变量加载认证信息"""
        # 先尝试加载 .env 文件
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except:
            pass

        # 尝试从环境变量读取
        self.auth_token = os.getenv('AUTH_TOKEN')
        self.ct0 = os.getenv('CT0')

        # 如果环境变量不存在，尝试从配置文件读取
        if not self.auth_token or not self.ct0:
            config_file = Path.home() / '.config' / 'bird' / 'config.json'
            if config_file.exists():
                try:
                    with open(config_file, 'r') as f:
                        config = json.load(f)
                        self.auth_token = config.get('auth_token')
                        self.ct0 = config.get('ct0')
                except Exception as e:
                    print(f"  ⚠️  读取配置文件失败: {e}")

    def _run_bird_command(self, command, timeout=30):
        """运行 bird 命令"""
        try:
            # 设置环境变量
            env = os.environ.copy()
            if self.auth_token:
                env['AUTH_TOKEN'] = self.auth_token
            if self.ct0:
                env['CT0'] = self.ct0

            full_command = f"bird {command}"
            result = subprocess.run(
                full_command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env
            )

            if result.returncode != 0:
                if result.stderr:
                    print(f"  ⚠️  Bird错误: {result.stderr[:200]}")
                return None

            return result.stdout

        except subprocess.TimeoutExpired:
            print(f"  ⚠️  命令超时: {command}")
            return None
        except Exception as e:
            print(f"  ❌ 命令执行失败: {e}")
            return None

    def initialize(self):
        """检查 bird 是否可用"""
        try:
            # 检查 bird 命令
            result = subprocess.run(
                "which bird",
                shell=True,
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode != 0:
                print("  ❌ bird CLI 未安装")
                print("  💡 请运行: npm install -g @steipete/bird")
                return False

            # 检查认证
            if not self.auth_token or not self.ct0:
                print("  ❌ 缺少 Twitter 认证信息")
                print("  💡 请设置环境变量 AUTH_TOKEN 和 CT0")
                return False

            # 测试认证
            output = self._run_bird_command("whoami", timeout=30)
            if output and "🙋" in output:
                print("  ✅ Bird CLI 已就绪")
                return True
            else:
                print("  ❌ Bird 认证失败")
                return False

        except Exception as e:
            print(f"  ⚠️  初始化检查失败: {e}")
            return False

    def collect_by_keywords(self, keywords, max_results=20):
        """
        根据关键词采集 tweets

        Args:
            keywords: 关键词列表
            max_results: 每个关键词最多采集多少条

        Returns:
            采集到的 tweets 列表
        """
        all_tweets = []

        for keyword in keywords:
            try:
                print(f"  🔍 搜索: {keyword}")

                # 使用 bird search 命令
                output = self._run_bird_command(
                    f'search "{keyword}" --json',
                    timeout=30
                )

                if not output:
                    print(f"    ⚠️  搜索失败")
                    continue

                # 解析 JSON
                tweets_data = json.loads(output)

                # 转换为统一格式
                for tweet in tweets_data[:max_results]:
                    tweet_obj = {
                        'text': tweet.get('text', ''),
                        'user': tweet.get('author', {}).get('name', 'Unknown'),
                        'username': tweet.get('author', {}).get('username', 'unknown'),
                        'created_at': tweet.get('createdAt', ''),
                        'likes': tweet.get('likeCount', 0),
                        'retweets': tweet.get('retweetCount', 0),
                        'replies': tweet.get('replyCount', 0),
                        'url': f"https://twitter.com/{tweet.get('author', {}).get('username', 'x')}/status/{tweet.get('id', '')}",
                        'keyword': keyword,
                        'source': 'twitter'
                    }
                    all_tweets.append(tweet_obj)

                print(f"    ✅ 采集到 {len(tweets_data[:max_results])} 条")

                # 避免速率限制
                time.sleep(2)

            except json.JSONDecodeError as e:
                print(f"    ⚠️  JSON解析失败: {e}")
                continue
            except Exception as e:
                print(f"    ⚠️  搜索 '{keyword}' 失败: {e}")
                continue

        return all_tweets

    def collect_from_users(self, usernames, max_tweets=10):
        """
        采集指定用户的最新 tweets

        Args:
            usernames: 用户名列表（不含 @）
            max_tweets: 每个用户采集多少条

        Returns:
            采集到的 tweets 列表
        """
        all_tweets = []

        for username in usernames:
            try:
                print(f"  👤 采集用户: @{username}")

                # 使用 bird user-tweets 命令
                output = self._run_bird_command(
                    f'user-tweets {username} --json',
                    timeout=30
                )

                if not output:
                    print(f"    ⚠️  采集失败")
                    continue

                # 解析 JSON
                tweets_data = json.loads(output)

                # 转换为统一格式
                for tweet in tweets_data[:max_tweets]:
                    tweet_obj = {
                        'text': tweet.get('text', ''),
                        'user': tweet.get('author', {}).get('name', username),
                        'username': username,
                        'created_at': tweet.get('createdAt', ''),
                        'likes': tweet.get('likeCount', 0),
                        'retweets': tweet.get('retweetCount', 0),
                        'replies': tweet.get('replyCount', 0),
                        'url': f"https://twitter.com/{username}/status/{tweet.get('id', '')}",
                        'source': 'twitter'
                    }
                    all_tweets.append(tweet_obj)

                print(f"    ✅ 采集到 {len(tweets_data[:max_tweets])} 条")

                # 避免速率限制
                time.sleep(2)

            except json.JSONDecodeError as e:
                print(f"    ⚠️  JSON解析失败: {e}")
                continue
            except Exception as e:
                print(f"    ⚠️  采集 @{username} 失败: {e}")
                continue

        return all_tweets

    def get_trending_news(self):
        """
        获取 Twitter 热门新闻和趋势

        Returns:
            新闻和趋势列表
        """
        try:
            print(f"  📰 获取热门新闻和趋势")

            # 使用 bird news 命令
            output = self._run_bird_command('news --json', timeout=30)

            if not output:
                print(f"    ⚠️  获取失败")
                return []

            # 解析 JSON
            news_data = json.loads(output)
            print(f"    ✅ 获取到 {len(news_data)} 条")

            return news_data

        except Exception as e:
            print(f"    ⚠️  获取热门新闻失败: {e}")
            return []


# 快速测试
if __name__ == "__main__":
    collector = TwitterBirdCollector()

    if collector.initialize():
        # 测试关键词搜索
        keywords = ["ChatGPT expensive", "AI tool problem"]
        tweets = collector.collect_by_keywords(keywords, max_results=5)

        print(f"\n✅ 采集到 {len(tweets)} 条 tweets")
        for tweet in tweets[:3]:
            print(f"  - @{tweet['username']}: {tweet['text'][:60]}...")

        # 保存测试结果
        output_file = "/tmp/twitter_bird_test_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(tweets, f, indent=2, ensure_ascii=False)
        print(f"\n💾 测试结果已保存: {output_file}")
