"""
RSS 数据源模块 - 监控 Reddit、Product Hunt、Hugging Face、Y Combinator
无需 API Key，完全免费且稳定
"""

import feedparser
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
import hashlib
from urllib.parse import quote

logger = logging.getLogger(__name__)


class RSSHunter:
    """RSS 数据源监控器"""
    
    # RSS 源配置
    RSS_SOURCES = {
        'reddit_localllama': {
            'url': 'https://www.reddit.com/r/LocalLLaMA/new/.rss',
            'name': 'Reddit - LocalLLaMA',
            'category': 'community'
        },
        'reddit_openai': {
            'url': 'https://www.reddit.com/r/OpenAI/new/.rss',
            'name': 'Reddit - OpenAI',
            'category': 'community'
        },
        'reddit_claude': {
            'url': 'https://www.reddit.com/r/Claude_AI/new/.rss',
            'name': 'Reddit - Claude',
            'category': 'community'
        },
        'reddit_cursor': {
            'url': 'https://www.reddit.com/r/Cursor/new/.rss',
            'name': 'Reddit - Cursor',
            'category': 'community'
        },
        'reddit_ml': {
            'url': 'https://www.reddit.com/r/MachineLearning/new/.rss',
            'name': 'Reddit - Machine Learning',
            'category': 'research'
        },
        'huggingface_papers': {
            'url': 'https://huggingface.co/papers/daily',
            'name': 'Hugging Face - Daily Papers',
            'category': 'research',
            'type': 'html'  # 特殊处理
        },
        'ycombinator': {
            'url': 'https://www.ycombinator.com/rss',
            'name': 'Y Combinator - Launches',
            'category': 'startup'
        },
        'producthunt': {
            'url': 'https://www.producthunt.com/feed.xml',
            'name': 'Product Hunt - Daily',
            'category': 'product'
        },
    }
    
    def __init__(self, keywords_config: Dict = None, timeout: int = 10):
        """
        初始化 RSS 监控器
        
        Args:
            keywords_config: 关键词配置字典
            timeout: 请求超时时间
        """
        self.keywords_config = keywords_config or {}
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_rss_feed(self, source_key: str) -> List[Dict]:
        """
        获取 RSS 源数据
        
        Args:
            source_key: RSS 源键名
            
        Returns:
            文章列表
        """
        if source_key not in self.RSS_SOURCES:
            logger.warning(f"Unknown RSS source: {source_key}")
            return []
        
        source = self.RSS_SOURCES[source_key]
        articles = []
        
        try:
            # 特殊处理 Hugging Face
            if source.get('type') == 'html':
                articles = self._fetch_huggingface_papers()
            else:
                # 标准 RSS 处理
                feed = feedparser.parse(source['url'])
                
                if feed.bozo:
                    logger.warning(f"RSS 解析警告 {source_key}: {feed.bozo_exception}")
                
                for entry in feed.entries[:50]:  # 限制前50条
                    article = self._parse_rss_entry(entry, source)
                    if article:
                        articles.append(article)
            
            logger.info(f"✅ 获取 {source['name']}: {len(articles)} 条")
            return articles
            
        except Exception as e:
            logger.error(f"❌ 获取 RSS 源失败 {source_key}: {str(e)}")
            return []
    
    def _parse_rss_entry(self, entry, source: Dict) -> Optional[Dict]:
        """
        解析 RSS 条目
        
        Args:
            entry: RSS 条目
            source: 源配置
            
        Returns:
            解析后的文章字典
        """
        try:
            title = entry.get('title', '')
            summary = entry.get('summary', '')
            link = entry.get('link', '')
            published = entry.get('published', '')
            
            # 提取发布时间
            try:
                pub_time = datetime(*entry.published_parsed[:6])
            except:
                pub_time = datetime.now()
            
            # 生成内容指纹
            content_hash = hashlib.md5(
                f"{title}{summary}".encode()
            ).hexdigest()
            
            return {
                'title': title,
                'summary': summary[:500],  # 限制长度
                'link': link,
                'source': source['name'],
                'source_key': source.get('category', 'other'),
                'published_at': pub_time.isoformat(),
                'content_hash': content_hash,
                'platform': 'RSS',
                'type': 'article'
            }
        except Exception as e:
            logger.warning(f"解析 RSS 条目失败: {str(e)}")
            return None
    
    def _fetch_huggingface_papers(self) -> List[Dict]:
        """
        获取 Hugging Face Daily Papers
        
        Returns:
            论文列表
        """
        articles = []
        try:
            url = 'https://huggingface.co/papers'
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            # 简单的 HTML 解析 (如果需要更复杂的解析，可以使用 BeautifulSoup)
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 查找论文条目
            papers = soup.find_all('article', limit=50)
            
            for paper in papers:
                try:
                    title_elem = paper.find('h3')
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    link = paper.find('a')['href'] if paper.find('a') else ''
                    
                    # 获取摘要
                    summary_elem = paper.find('p')
                    summary = summary_elem.get_text(strip=True) if summary_elem else ''
                    
                    content_hash = hashlib.md5(
                        f"{title}{summary}".encode()
                    ).hexdigest()
                    
                    articles.append({
                        'title': title,
                        'summary': summary[:500],
                        'link': f"https://huggingface.co{link}" if link else '',
                        'source': 'Hugging Face - Daily Papers',
                        'source_key': 'research',
                        'published_at': datetime.now().isoformat(),
                        'content_hash': content_hash,
                        'platform': 'RSS',
                        'type': 'paper'
                    })
                except Exception as e:
                    logger.debug(f"解析论文失败: {str(e)}")
                    continue
            
            logger.info(f"✅ 获取 Hugging Face Papers: {len(articles)} 篇")
            return articles
            
        except Exception as e:
            logger.error(f"❌ 获取 Hugging Face Papers 失败: {str(e)}")
            return []
    
    def fetch_all_sources(self) -> Dict[str, List[Dict]]:
        """
        获取所有 RSS 源数据
        
        Returns:
            按源分类的文章字典
        """
        all_articles = {}
        
        for source_key in self.RSS_SOURCES.keys():
            articles = self.fetch_rss_feed(source_key)
            all_articles[source_key] = articles
        
        return all_articles
    
    def filter_by_keywords(self, articles: List[Dict], keywords: List[str]) -> List[Dict]:
        """
        按关键词过滤文章
        
        Args:
            articles: 文章列表
            keywords: 关键词列表
            
        Returns:
            过滤后的文章列表
        """
        filtered = []
        keywords_lower = [k.lower() for k in keywords]
        
        for article in articles:
            title_lower = article['title'].lower()
            summary_lower = article['summary'].lower()
            
            # 检查是否包含任何关键词
            for keyword in keywords_lower:
                if keyword in title_lower or keyword in summary_lower:
                    filtered.append(article)
                    break
        
        return filtered
    
    def get_recent_articles(self, hours: int = 24) -> List[Dict]:
        """
        获取最近 N 小时的文章
        
        Args:
            hours: 小时数
            
        Returns:
            最近的文章列表
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)
        all_articles = self.fetch_all_sources()
        
        recent = []
        for source_articles in all_articles.values():
            for article in source_articles:
                try:
                    pub_time = datetime.fromisoformat(article['published_at'])
                    if pub_time > cutoff_time:
                        recent.append(article)
                except:
                    recent.append(article)  # 如果无法解析时间，默认包含
        
        # 按发布时间排序
        recent.sort(
            key=lambda x: x.get('published_at', ''),
            reverse=True
        )
        
        return recent
    
    def analyze_trends(self, articles: List[Dict]) -> Dict:
        """
        分析趋势
        
        Args:
            articles: 文章列表
            
        Returns:
            趋势分析结果
        """
        trends = {
            'total_articles': len(articles),
            'sources': {},
            'top_keywords': {},
            'categories': {}
        }
        
        # 统计来源
        for article in articles:
            source = article.get('source', 'Unknown')
            trends['sources'][source] = trends['sources'].get(source, 0) + 1
            
            category = article.get('source_key', 'other')
            trends['categories'][category] = trends['categories'].get(category, 0) + 1
        
        return trends


class GoogleTrendsMonitor:
    """Google Trends 监控器"""
    
    def __init__(self, timeout: int = 10):
        """初始化 Google Trends 监控器"""
        self.timeout = timeout
        self.session = requests.Session()
    
    def get_trending_searches(self, region: str = 'US') -> List[Dict]:
        """
        获取 Google Trends 热搜
        
        Args:
            region: 地区代码 (如 'US', 'CN', 'GB')
            
        Returns:
            热搜列表
        """
        try:
            # 使用 Google Trends API (需要 pytrends 库)
            try:
                from pytrends.request import TrendReq
                
                pytrends = TrendReq(hl='en-US', tz=360)
                
                # 获取实时热搜
                trending = pytrends.trending_searches(pn=region)
                
                results = []
                for idx, trend in enumerate(trending.iterrows()):
                    results.append({
                        'rank': idx + 1,
                        'keyword': trend[1][0],
                        'source': 'Google Trends',
                        'region': region,
                        'timestamp': datetime.now().isoformat()
                    })
                
                logger.info(f"✅ 获取 Google Trends ({region}): {len(results)} 条")
                return results
                
            except ImportError:
                logger.warning("pytrends 库未安装，跳过 Google Trends")
                return []
        
        except Exception as e:
            logger.error(f"❌ 获取 Google Trends 失败: {str(e)}")
            return []


def main():
    """测试 RSS 监控器"""
    logging.basicConfig(level=logging.INFO)
    
    # 创建监控器
    hunter = RSSHunter()
    
    # 获取所有源
    print("\n🔍 获取所有 RSS 源...\n")
    all_articles = hunter.fetch_all_sources()
    
    # 统计
    total = sum(len(articles) for articles in all_articles.values())
    print(f"\n📊 总共获取 {total} 条文章\n")
    
    # 显示样本
    for source_key, articles in all_articles.items():
        if articles:
            print(f"\n📰 {RSSHunter.RSS_SOURCES[source_key]['name']} (前3条):")
            for article in articles[:3]:
                print(f"  - {article['title'][:60]}...")
    
    # 获取最近24小时的文章
    print("\n\n⏰ 最近24小时的文章:")
    recent = hunter.get_recent_articles(hours=24)
    print(f"共 {len(recent)} 条\n")
    
    # 分析趋势
    trends = hunter.analyze_trends(recent)
    print(f"📈 趋势分析:")
    print(f"  来源分布: {trends['sources']}")
    print(f"  分类分布: {trends['categories']}")


if __name__ == '__main__':
    main()
