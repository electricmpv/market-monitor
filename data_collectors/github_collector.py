#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GitHub Trending 数据采集器"""

import requests
import time
from bs4 import BeautifulSoup


class GitHubCollector:
    """GitHub Trending 采集器"""

    def __init__(self):
        """初始化 GitHub 采集器"""
        self.base_url = 'https://github.com'
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def collect_trending(self, languages=None, time_range='daily', max_repos=10):
        """
        采集 GitHub Trending 仓库

        Args:
            languages: 语言列表（如 ['python', 'javascript']），None 表示全部
            time_range: 时间范围 ('daily', 'weekly', 'monthly')
            max_repos: 每个语言最多采集多少仓库

        Returns:
            采集到的仓库列表
        """
        if languages is None:
            languages = ['']  # 空字符串表示所有语言

        all_repos = []

        for language in languages:
            try:
                lang_name = language if language else 'All'
                print(f"  🔥 采集 GitHub Trending ({lang_name})...")

                repos = self._scrape_trending(language, time_range, max_repos)
                all_repos.extend(repos)

                print(f"    ✅ 采集到 {len(repos)} 个仓库")

                time.sleep(1)

            except Exception as e:
                print(f"    ⚠️  采集失败: {e}")
                continue

        return all_repos

    def _scrape_trending(self, language, time_range, max_repos):
        """抓取 Trending 页面"""
        repos = []

        # 构建 URL
        url = f"{self.base_url}/trending"
        if language:
            url += f"/{language}"

        params = {'since': time_range}

        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # 查找仓库列表
            repo_items = soup.find_all('article', class_='Box-row')

            for item in repo_items[:max_repos]:
                try:
                    # 提取仓库信息
                    h2 = item.find('h2', class_='h3')
                    if not h2:
                        continue

                    repo_link = h2.find('a')
                    repo_name = repo_link.get('href', '').strip('/') if repo_link else ''

                    # 描述
                    desc_elem = item.find('p', class_='col-9')
                    description = desc_elem.text.strip() if desc_elem else ''

                    # Stars
                    stars_elem = item.find('svg', {'aria-label': 'star'})
                    stars = 0
                    if stars_elem:
                        stars_parent = stars_elem.find_parent('a')
                        if stars_parent:
                            stars_text = stars_parent.text.strip()
                            stars = self._parse_number(stars_text)

                    # Language
                    lang_elem = item.find('span', {'itemprop': 'programmingLanguage'})
                    repo_language = lang_elem.text.strip() if lang_elem else language or 'Unknown'

                    # Today stars
                    today_stars_elem = item.find('span', class_='d-inline-block float-sm-right')
                    today_stars = 0
                    if today_stars_elem:
                        today_text = today_stars_elem.text.strip()
                        today_stars = self._parse_number(today_text.split()[0])

                    repo_data = {
                        'name': repo_name,
                        'description': description,
                        'stars': stars,
                        'today_stars': today_stars,
                        'language': repo_language,
                        'url': f"{self.base_url}/{repo_name}",
                        'source': 'github'
                    }

                    repos.append(repo_data)

                except Exception as e:
                    print(f"      ⚠️  解析仓库失败: {e}")
                    continue

        except Exception as e:
            raise Exception(f"抓取 Trending 失败: {e}")

        return repos

    def _parse_number(self, text):
        """解析数字（处理 k、m 等单位）"""
        text = text.replace(',', '').strip()

        if 'k' in text.lower():
            return int(float(text.lower().replace('k', '')) * 1000)
        elif 'm' in text.lower():
            return int(float(text.lower().replace('m', '')) * 1000000)
        else:
            try:
                return int(text)
            except:
                return 0

    def search_repositories(self, keywords, min_stars=100, max_results=10):
        """
        搜索 GitHub 仓库（使用 GitHub API）

        Args:
            keywords: 关键词列表
            min_stars: 最小 star 数
            max_results: 每个关键词最多采集多少仓库

        Returns:
            搜索结果列表
        """
        all_results = []

        # GitHub API endpoint
        api_url = 'https://api.github.com/search/repositories'

        for keyword in keywords:
            try:
                print(f"  🔍 搜索: {keyword}")

                # 构建搜索查询
                query = f"{keyword} stars:>={min_stars}"

                params = {
                    'q': query,
                    'sort': 'stars',
                    'order': 'desc',
                    'per_page': max_results
                }

                response = requests.get(api_url, headers=self.headers, params=params, timeout=10)
                response.raise_for_status()

                data = response.json()

                for item in data.get('items', []):
                    result_data = {
                        'name': item.get('full_name', ''),
                        'description': item.get('description', ''),
                        'stars': item.get('stargazers_count', 0),
                        'forks': item.get('forks_count', 0),
                        'language': item.get('language', 'Unknown'),
                        'url': item.get('html_url', ''),
                        'keyword': keyword,
                        'source': 'github'
                    }

                    all_results.append(result_data)

                print(f"    ✅ 找到 {len(data.get('items', []))} 个仓库")

                # GitHub API 速率限制
                time.sleep(2)

            except Exception as e:
                print(f"    ⚠️  搜索 '{keyword}' 失败: {e}")
                continue

        return all_results


# 快速测试
if __name__ == "__main__":
    collector = GitHubCollector()

    # 测试 Trending
    repos = collector.collect_trending(languages=['python', 'typescript'], max_repos=5)

    print(f"\n✅ 采集到 {len(repos)} 个仓库")
    for repo in repos[:3]:
        print(f"  - {repo['name']}: {repo['description'][:60]}...")
