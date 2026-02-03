#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Reddit 数据采集器"""

import os
import time


class RedditCollector:
    """Reddit 数据采集器"""

    def __init__(self):
        """初始化 Reddit 采集器"""
        self.reddit = None

    def initialize(self):
        """初始化 Reddit 客户端"""
        try:
            import praw

            # Reddit API 配置
            # 注意：需要在 https://www.reddit.com/prefs/apps 创建应用
            client_id = os.getenv('REDDIT_CLIENT_ID', 'YOUR_CLIENT_ID')
            client_secret = os.getenv('REDDIT_CLIENT_SECRET', 'YOUR_CLIENT_SECRET')
            user_agent = 'MarketMonitor/1.0 (by /u/YourUsername)'

            # 如果没有配置 Reddit API，使用只读模式（无需认证）
            if client_id == 'YOUR_CLIENT_ID':
                print("  ⚠️  Reddit API 未配置，使用公共 RSS 模式")
                return self._initialize_rss_mode()

            self.reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent
            )

            print("  ✅ Reddit API 已初始化")
            return True

        except ImportError:
            print("  ❌ praw 未安装")
            return False
        except Exception as e:
            print(f"  ⚠️  Reddit API 初始化失败: {e}")
            print("  💡 尝试使用 RSS 模式...")
            return self._initialize_rss_mode()

    def _initialize_rss_mode(self):
        """使用 RSS 模式（无需 API）"""
        self.mode = 'rss'
        return True

    def collect_from_subreddits(self, subreddits, min_score=50, max_posts=10):
        """
        从指定 subreddits 采集数据

        Args:
            subreddits: subreddit 名称列表
            min_score: 最小评分
            max_posts: 每个 subreddit 最多采集多少帖子

        Returns:
            采集到的帖子列表
        """
        all_posts = []

        for subreddit_name in subreddits:
            try:
                print(f"  📱 采集 r/{subreddit_name}")

                if hasattr(self, 'mode') and self.mode == 'rss':
                    # RSS 模式
                    posts = self._collect_via_rss(subreddit_name, min_score, max_posts)
                else:
                    # API 模式
                    posts = self._collect_via_api(subreddit_name, min_score, max_posts)

                all_posts.extend(posts)
                print(f"    ✅ 采集到 {len(posts)} 条")

                # 避免速率限制
                time.sleep(1)

            except Exception as e:
                print(f"    ⚠️  采集 r/{subreddit_name} 失败: {e}")
                continue

        return all_posts

    def _collect_via_api(self, subreddit_name, min_score, max_posts):
        """通过 API 采集"""
        posts = []

        subreddit = self.reddit.subreddit(subreddit_name)

        for submission in subreddit.hot(limit=max_posts * 2):  # 多采集一些，过滤后可能不够
            if submission.score >= min_score:
                post_data = {
                    'title': submission.title,
                    'text': submission.selftext[:500] if submission.selftext else '',
                    'score': submission.score,
                    'comments': submission.num_comments,
                    'url': f"https://reddit.com{submission.permalink}",
                    'author': str(submission.author) if submission.author else '[deleted]',
                    'subreddit': subreddit_name,
                    'created_utc': submission.created_utc,
                    'source': 'reddit'
                }

                posts.append(post_data)

                if len(posts) >= max_posts:
                    break

        return posts

    def _collect_via_rss(self, subreddit_name, min_score, max_posts):
        """通过 RSS 采集（无需 API）"""
        import requests
        import feedparser

        posts = []

        # Reddit RSS URL
        rss_url = f"https://www.reddit.com/r/{subreddit_name}/hot/.rss"

        try:
            # 添加 User-Agent 避免被封
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            response = requests.get(rss_url, headers=headers, timeout=10)
            feed = feedparser.parse(response.content)

            for entry in feed.entries[:max_posts * 2]:
                # 从 entry 中提取信息
                # RSS feed 不直接提供 score，我们只能采集热门帖子
                post_data = {
                    'title': entry.get('title', ''),
                    'text': entry.get('summary', '')[:500] if 'summary' in entry else '',
                    'score': 0,  # RSS 不提供 score
                    'comments': 0,
                    'url': entry.get('link', ''),
                    'author': entry.get('author', 'Unknown'),
                    'subreddit': subreddit_name,
                    'created_utc': None,
                    'source': 'reddit'
                }

                posts.append(post_data)

                if len(posts) >= max_posts:
                    break

        except Exception as e:
            print(f"    ⚠️  RSS 采集失败: {e}")

        return posts

    def search_by_keywords(self, keywords, subreddit='all', min_score=20, max_results=10):
        """
        在 Reddit 搜索关键词

        Args:
            keywords: 关键词列表
            subreddit: 搜索范围（'all' 或具体 subreddit）
            min_score: 最小评分
            max_results: 每个关键词最多采集多少结果

        Returns:
            搜索结果列表
        """
        all_results = []

        if not self.reddit:
            print("  ⚠️  Reddit 搜索需要 API，当前为 RSS 模式")
            return []

        for keyword in keywords:
            try:
                print(f"  🔍 搜索: {keyword}")

                subreddit_obj = self.reddit.subreddit(subreddit)
                results = subreddit_obj.search(keyword, limit=max_results * 2)

                count = 0
                for submission in results:
                    if submission.score >= min_score:
                        result_data = {
                            'title': submission.title,
                            'text': submission.selftext[:500] if submission.selftext else '',
                            'score': submission.score,
                            'comments': submission.num_comments,
                            'url': f"https://reddit.com{submission.permalink}",
                            'author': str(submission.author) if submission.author else '[deleted]',
                            'subreddit': submission.subreddit.display_name,
                            'keyword': keyword,
                            'source': 'reddit'
                        }

                        all_results.append(result_data)
                        count += 1

                        if count >= max_results:
                            break

                print(f"    ✅ 找到 {count} 条结果")

                time.sleep(1)

            except Exception as e:
                print(f"    ⚠️  搜索 '{keyword}' 失败: {e}")
                continue

        return all_results


# 快速测试
if __name__ == "__main__":
    collector = RedditCollector()

    if collector.initialize():
        # 测试采集 subreddits
        subreddits = ['LocalLLaMA', 'OpenAI', 'Cursor']
        posts = collector.collect_from_subreddits(subreddits, min_score=10, max_posts=5)

        print(f"\n✅ 采集到 {len(posts)} 条帖子")
        for post in posts[:3]:
            print(f"  - r/{post['subreddit']}: {post['title'][:60]}...")
