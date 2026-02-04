#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Twitter/X 数据采集器 - 使用 browser-use"""

import json
import re
import subprocess
import time
from datetime import datetime
from pathlib import Path


class TwitterBrowserCollector:
    """使用 browser-use 的 Twitter 数据采集器"""

    def __init__(self):
        """初始化采集器"""
        self.browser_active = False

    def _run_browser_command(self, command, timeout=30):
        """运行 browser-use 命令"""
        try:
            # 使用虚拟环境中的browser-use
            venv_path = Path(__file__).parent.parent / "venv"
            browser_use_path = venv_path / "bin" / "browser-use"

            full_command = f"{browser_use_path} {command}"
            result = subprocess.run(
                full_command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=Path(__file__).parent.parent
            )
            if result.returncode != 0 and result.stderr:
                print(f"  ⚠️  浏览器错误: {result.stderr[:200]}")
            return result.stdout
        except subprocess.TimeoutExpired:
            print(f"  ⚠️  命令超时: {command}")
            return None
        except Exception as e:
            print(f"  ❌ 命令执行失败: {e}")
            return None

    def initialize(self):
        """初始化浏览器会话"""
        try:
            # 检查浏览器是否已打开
            result = self._run_browser_command("state", timeout=5)
            if result and "url:" in result:
                self.browser_active = True
                print("  ✅ 浏览器会话已存在")
                return True

            print("  ℹ️  浏览器会话未激活，将在首次搜索时打开")
            return True
        except Exception as e:
            print(f"  ⚠️  初始化检查失败: {e}")
            return True  # 仍然返回True，因为可以在搜索时打开

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

                # 构建搜索URL（使用最新标签）
                search_url = f'https://twitter.com/search?q="{keyword}"&src=typed_query&f=live'

                # 打开搜索页面
                output = self._run_browser_command(f'--browser real open {search_url}', timeout=30)
                if not output:
                    print(f"    ⚠️  打开搜索页面失败")
                    continue

                # 等待页面加载
                time.sleep(3)

                # 滚动加载更多内容
                for _ in range(2):  # 滚动2次
                    self._run_browser_command("scroll down", timeout=10)
                    time.sleep(1)

                # 获取页面HTML
                html = self._run_browser_command("get html", timeout=30)
                if not html:
                    print(f"    ⚠️  获取页面HTML失败")
                    continue

                # 解析推文
                tweets = self._parse_tweets_from_html(html, keyword)
                all_tweets.extend(tweets[:max_results])

                print(f"    ✅ 采集到 {len(tweets[:max_results])} 条")

                # 避免速率限制
                time.sleep(3)

            except Exception as e:
                print(f"    ⚠️  搜索 '{keyword}' 失败: {e}")
                continue

        return all_tweets

    def _parse_tweets_from_html(self, html, keyword):
        """从HTML中解析推文数据"""
        tweets = []

        try:
            from bs4 import BeautifulSoup

            soup = BeautifulSoup(html, 'html.parser')

            # 查找所有推文 - Twitter 使用 article 标签，data-testid="tweet"
            articles = soup.find_all('article', {'role': 'article', 'data-testid': 'tweet'})

            # 如果没找到，尝试只用role=article
            if len(articles) == 0:
                articles = soup.find_all('article', {'role': 'article'})

            for article in articles:
                try:
                    # 提取推文文本 - 查找 data-testid="tweetText"
                    tweet_text_elem = article.find('div', {'data-testid': 'tweetText'})
                    tweet_text = tweet_text_elem.get_text(separator=' ', strip=True) if tweet_text_elem else ""

                    # 如果没有找到推文文本或不包含关键词，跳过
                    if not tweet_text:
                        continue
                    if keyword and keyword.lower() not in tweet_text.lower():
                        continue

                    # 提取用户名 - 查找 data-testid="User-Name"
                    username_elem = article.find('div', {'data-testid': 'User-Name'})
                    if username_elem:
                        # 在User-Name div中查找包含用户名的链接
                        username_link = username_elem.find('a', href=re.compile(r'^/[^/]+$'))
                        username = username_link.get('href', '').strip('/') if username_link else "unknown"

                        # 提取显示名称
                        display_name_spans = username_elem.find_all('span')
                        display_name = display_name_spans[0].get_text(strip=True) if display_name_spans else username
                    else:
                        username = "unknown"
                        display_name = "unknown"

                    # 提取时间戳
                    time_elem = article.find('time')
                    created_at = time_elem.get('datetime', '') if time_elem else None

                    # 提取推文链接
                    tweet_link = article.find('a', href=re.compile(r'/status/\d+'))
                    tweet_url = f"https://twitter.com{tweet_link.get('href')}" if tweet_link else None

                    # 提取互动数据（可选）
                    def extract_interaction_count(testid):
                        elem = article.find('button', {'data-testid': testid})
                        if elem:
                            aria_label = elem.get('aria-label', '')
                            match = re.search(r'(\d+)', aria_label)
                            return int(match.group(1)) if match else 0
                        return 0

                    likes = extract_interaction_count('like')
                    retweets = extract_interaction_count('retweet')
                    replies = extract_interaction_count('reply')

                    tweet_data = {
                        'text': tweet_text,
                        'user': display_name,
                        'username': username,
                        'created_at': created_at,
                        'likes': likes,
                        'retweets': retweets,
                        'replies': replies,
                        'url': tweet_url,
                        'keyword': keyword,
                        'source': 'twitter'
                    }

                    tweets.append(tweet_data)

                except Exception as e:
                    print(f"      ⚠️  解析单条推文失败: {e}")
                    continue

        except Exception as e:
            print(f"    ⚠️  HTML解析失败: {e}")

        return tweets

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

                # 打开用户时间线
                user_url = f'https://twitter.com/{username}'
                output = self._run_browser_command(f'--browser real open {user_url}', timeout=30)
                if not output:
                    print(f"    ⚠️  打开用户页面失败")
                    continue

                # 等待页面加载
                time.sleep(3)

                # 滚动加载更多内容
                for _ in range(2):
                    self._run_browser_command("scroll down", timeout=10)
                    time.sleep(1)

                # 获取页面HTML
                html = self._run_browser_command("get html", timeout=30)
                if not html:
                    print(f"    ⚠️  获取页面HTML失败")
                    continue

                # 解析推文
                tweets = self._parse_tweets_from_html(html, keyword="")
                all_tweets.extend(tweets[:max_tweets])

                print(f"    ✅ 采集到 {len(tweets[:max_tweets])} 条")

                # 避免速率限制
                time.sleep(3)

            except Exception as e:
                print(f"    ⚠️  采集 @{username} 失败: {e}")
                continue

        return all_tweets

    def close(self):
        """关闭浏览器会话"""
        try:
            self._run_browser_command("close", timeout=10)
            print("  ✅ 浏览器会话已关闭")
        except Exception as e:
            print(f"  ⚠️  关闭浏览器失败: {e}")


# 快速测试
if __name__ == "__main__":
    collector = TwitterBrowserCollector()

    if collector.initialize():
        # 测试关键词搜索
        keywords = ["ChatGPT expensive", "AI tool problem"]
        tweets = collector.collect_by_keywords(keywords, max_results=5)

        print(f"\n✅ 采集到 {len(tweets)} 条 tweets")
        for tweet in tweets[:3]:
            print(f"  - @{tweet['username']}: {tweet['text'][:60]}...")

        # 保存测试结果
        output_file = "/tmp/twitter_test_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(tweets, f, indent=2, ensure_ascii=False)
        print(f"\n💾 测试结果已保存: {output_file}")

        # 关闭浏览器
        collector.close()
