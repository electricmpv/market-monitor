"""数据采集器模块"""

from .twitter_collector import TwitterCollector
from .reddit_collector import RedditCollector
from .github_collector import GitHubCollector

__all__ = ['TwitterCollector', 'RedditCollector', 'GitHubCollector']
