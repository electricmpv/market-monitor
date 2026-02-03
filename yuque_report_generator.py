"""语雀报告生成器"""

import requests
import os
from datetime import datetime


class YuqueReportGenerator:
    def __init__(self):
        self.token = os.getenv('YUQUE_TOKEN', 'EmucIYlJro7ic4O4ZS6UujQZm89tXmwor7PwNYmL')
        self.base_url = 'https://www.yuque.com/api/v2'
        self.namespace = os.getenv('YUQUE_NAMESPACE', 'diandongmianbao')
        self.repo_slug = os.getenv('YUQUE_REPO_SLUG', 'cg40cd')  # 使用用户指定的知识库

    def _get_or_create_repo(self):
        """获取或创建报告知识库"""
        # 尝试获取已存在的知识库
        repos_url = f"{self.base_url}/users/{self.namespace}/repos"
        headers = {'X-Auth-Token': self.token}

        try:
            response = requests.get(repos_url, headers=headers)

            if response.status_code == 200:
                repos_data = response.json()
                repos = repos_data.get('data', []) if isinstance(repos_data, dict) else []

                # 查找 market-monitor-reports 知识库
                for repo in repos:
                    if repo.get('slug') == 'market-monitor-reports':
                        print(f"✅ 找到已存在的知识库: market-monitor-reports")
                        return repo['slug']

            # 如果不存在，创建新知识库
            print("📝 创建新知识库: market-monitor-reports")
            create_url = f"{self.base_url}/repos"
            payload = {
                'name': 'Market Monitor Reports',
                'slug': 'market-monitor-reports',
                'description': 'AI 市场机会监控报告',
                'public': 0  # 私有知识库
            }

            response = requests.post(create_url, headers=headers, json=payload)

            if response.status_code in [200, 201]:
                created_repo = response.json()
                if isinstance(created_repo, dict) and 'data' in created_repo:
                    print(f"✅ 知识库创建成功")
                    return created_repo['data']['slug']
                else:
                    print(f"⚠️ 知识库创建响应格式异常，使用默认slug")
                    return 'market-monitor-reports'
            else:
                print(f"❌ 创建知识库失败: {response.status_code} - {response.text}")
                return 'market-monitor-reports'

        except Exception as e:
            print(f"⚠️ 获取/创建知识库失败: {e}")
            return 'market-monitor-reports'  # 使用默认值

    def create_report(self, data):
        """生成精美的语雀报告"""

        # 构建精美的 Markdown
        markdown = self._build_markdown(data)

        # 创建文档
        doc_url = f"{self.base_url}/repos/{self.namespace}/{self.repo_slug}/docs"
        headers = {
            'X-Auth-Token': self.token,
            'Content-Type': 'application/json'
        }

        title = f"市场监控日报 - {datetime.now().strftime('%Y年%m月%d日')}"
        slug = f"report-{datetime.now().strftime('%Y%m%d')}"

        payload = {
            'title': title,
            'slug': slug,
            'body': markdown,
            'public': 0
        }

        response = requests.post(doc_url, headers=headers, json=payload)

        if response.status_code == 200:
            doc_data = response.json()['data']
            return f"https://www.yuque.com/{self.namespace}/{self.repo_slug}/{slug}"
        else:
            raise Exception(f"语雀文档创建失败: {response.text}")

    def _build_markdown(self, data):
        """构建精美的 Markdown 报告"""

        content = f"""# 🎯 AI 市场机会监控日报

> 📅 生成时间：{datetime.now().strftime('%Y年%m月%d日 %H:%M')}
> 🤖 数据来源：Twitter/X, Reddit, Hacker News, GitHub, Product Hunt

---

## 📌 目录
[[TOC]]

---

## 🔥 今日核心发现

### 📊 数据概览

| 指标 | 数值 |
|------|------|
| 监控平台数 | {data.get('platforms_count', 5)} |
| 原始数据量 | {data.get('raw_data_count', 0)} |
| 高质量机会 | {data.get('quality_opportunities', 0)} |
| 痛点发现 | {data.get('pain_points_count', 0)} |
| 技术趋势 | {data.get('tech_trends_count', 0)} |

---

## 💡 Top 3 商业机会

{self._format_opportunities(data.get('top_opportunities', []))}

---

## 😤 用户痛点分析

{self._format_pain_points(data.get('pain_points', []))}

---

## 🚀 技术趋势追踪

{self._format_tech_trends(data.get('tech_trends', []))}

---

## 📎 数据来源

{self._format_sources(data.get('sources', []))}

---

> 🤖 本报告由 AI Market Monitor 自动生成
> 📧 反馈建议：[GitHub Issues](https://github.com/electricmpv/market-monitor/issues)
"""
        return content

    def _format_opportunities(self, opportunities):
        """格式化机会列表"""
        if not opportunities:
            return "暂无新机会发现"

        formatted = ""
        for i, opp in enumerate(opportunities[:3], 1):
            formatted += f"""
### {i}. {opp.get('title', '未命名机会')}

**机会类型**：{opp.get('type', 'Unknown')}
**市场规模**：{opp.get('market_size', 'Unknown')}
**技术难度**：{'⭐' * opp.get('difficulty', 3)}
**Solopreneur 适配度**：{opp.get('solo_fit', 5)}/10

**描述**：
{opp.get('description', '无描述')}

**数据来源**：
{self._format_source_links(opp.get('sources', []))}

---
"""
        return formatted

    def _format_pain_points(self, pain_points):
        """格式化痛点"""
        if not pain_points:
            return "暂无新痛点发现"

        formatted = ""
        for i, pain in enumerate(pain_points[:5], 1):
            formatted += f"- **{pain.get('product', 'Unknown')}**: {pain.get('content', '')}\n"

        return formatted

    def _format_tech_trends(self, trends):
        """格式化技术趋势"""
        if not trends:
            return "暂无新趋势发现"

        formatted = ""
        for trend in trends[:5]:
            formatted += f"- {trend.get('title', '')}: {trend.get('description', '')}\n"

        return formatted

    def _format_sources(self, sources):
        """格式化来源"""
        formatted = ""
        for source in sources:
            formatted += f"- [{source.get('platform', 'Unknown')}]({source.get('url', '#')})\n"

        return formatted or "- 暂无来源"

    def _format_source_links(self, sources):
        """格式化来源链接"""
        if not sources:
            return "暂无来源"

        links = []
        for source in sources:
            links.append(f"- [{source.get('platform', 'Unknown')}]({source.get('url', '#')})")

        return '\n'.join(links)
