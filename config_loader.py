"""
关键词配置加载器 - 支持 YAML 配置文件的动态加载
"""

import yaml
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class KeywordsConfig:
    """关键词配置数据类"""
    pain_radar: Dict[str, List[str]]
    opportunity_hunter: Dict[str, List[str]]
    research: Dict[str, List[str]]
    startup: Dict[str, List[str]]
    trends: Dict[str, List[str]]
    exclude_keywords: List[str]
    priority_keywords: Dict[str, List[str]]
    platforms: Dict[str, Dict]
    timing: Dict[str, Any]
    output: Dict[str, Any]


class ConfigLoader:
    """配置文件加载器"""
    
    def __init__(self, config_dir: str = './config'):
        """
        初始化配置加载器
        
        Args:
            config_dir: 配置文件目录
        """
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.keywords_file = self.config_dir / 'keywords.yaml'
        self.config_cache = {}
    
    def load_keywords(self, reload: bool = False) -> KeywordsConfig:
        """
        加载关键词配置
        
        Args:
            reload: 是否强制重新加载
            
        Returns:
            关键词配置对象
        """
        if not reload and 'keywords' in self.config_cache:
            logger.debug("使用缓存的关键词配置")
            return self.config_cache['keywords']
        
        if not self.keywords_file.exists():
            logger.error(f"关键词配置文件不存在: {self.keywords_file}")
            return self._get_default_config()
        
        try:
            with open(self.keywords_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            config = KeywordsConfig(
                pain_radar=data.get('pain_radar', {}),
                opportunity_hunter=data.get('opportunity_hunter', {}),
                research=data.get('research', {}),
                startup=data.get('startup', {}),
                trends=data.get('trends', {}),
                exclude_keywords=data.get('exclude_keywords', []),
                priority_keywords=data.get('priority_keywords', {}),
                platforms=data.get('platforms', {}),
                timing=data.get('timing', {}),
                output=data.get('output', {})
            )
            
            self.config_cache['keywords'] = config
            logger.info(f"✅ 成功加载关键词配置: {self.keywords_file}")
            return config
            
        except Exception as e:
            logger.error(f"❌ 加载关键词配置失败: {str(e)}")
            return self._get_default_config()
    
    def _get_default_config(self) -> KeywordsConfig:
        """获取默认配置"""
        return KeywordsConfig(
            pain_radar={
                'chatgpt': ['can\'t', 'doesn\'t work', 'error', 'slow', 'expensive'],
                'claude': ['can\'t', 'doesn\'t support', 'bug', 'rate limit'],
                'deepseek': ['slow', 'error', 'hallucination'],
                'cursor': ['bug', 'crash', 'slow'],
                'midjourney': ['hands weird', 'broken', 'ugly'],
                'sora': ['physics fail', 'movement unnatural', 'face melting'],
            },
            opportunity_hunter={
                'github': ['AI agent', 'RAG', 'prompt engineering', 'automation'],
                'hackernews': ['funding', 'series', 'startup', 'breakthrough'],
                'producthunt': ['AI', 'automation', 'productivity'],
                'reddit': ['looking for', 'need', 'help with', 'bug'],
            },
            research={
                'huggingface': ['Agent', 'Browser Use', 'Optimization', 'Model'],
            },
            startup={
                'ycombinator': ['AI', 'machine learning', 'automation', 'productivity'],
            },
            trends={
                'keywords': ['AI', 'ChatGPT', 'machine learning', 'automation'],
            },
            exclude_keywords=['spam', 'scam', 'fake', 'clickbait'],
            priority_keywords={
                'high': ['funding', 'breakthrough', 'launch'],
                'medium': ['bug', 'error', 'feature'],
                'low': ['question', 'discussion'],
            },
            platforms={
                'github': {'min_stars': 300, 'min_forks': 10},
                'reddit': {'min_score': 10, 'min_comments': 5},
                'twitter': {'min_retweets': 5, 'min_likes': 10},
            },
            timing={'check_interval': 3600, 'retention_days': 90},
            output={'max_results': 100, 'sort_by_priority': True}
        )
    
    def get_pain_radar_keywords(self, product: Optional[str] = None) -> List[str]:
        """
        获取痛点雷达关键词
        
        Args:
            product: 产品名称 (如 'chatgpt', 'claude')，None 则返回所有
            
        Returns:
            关键词列表
        """
        config = self.load_keywords()
        
        if product:
            return config.pain_radar.get(product, [])
        else:
            # 返回所有关键词
            all_keywords = []
            for keywords in config.pain_radar.values():
                all_keywords.extend(keywords)
            return all_keywords
    
    def get_opportunity_keywords(self, platform: Optional[str] = None) -> List[str]:
        """
        获取机会猎手关键词
        
        Args:
            platform: 平台名称 (如 'github', 'hackernews')，None 则返回所有
            
        Returns:
            关键词列表
        """
        config = self.load_keywords()
        
        if platform:
            return config.opportunity_hunter.get(platform, [])
        else:
            # 返回所有关键词
            all_keywords = []
            for keywords in config.opportunity_hunter.values():
                all_keywords.extend(keywords)
            return all_keywords
    
    def get_exclude_keywords(self) -> List[str]:
        """获取排除关键词"""
        config = self.load_keywords()
        return config.exclude_keywords
    
    def get_priority_keywords(self, priority: str = 'high') -> List[str]:
        """
        获取优先级关键词
        
        Args:
            priority: 优先级 ('high', 'medium', 'low')
            
        Returns:
            关键词列表
        """
        config = self.load_keywords()
        return config.priority_keywords.get(priority, [])
    
    def get_platform_config(self, platform: str) -> Dict:
        """
        获取平台特定配置
        
        Args:
            platform: 平台名称
            
        Returns:
            平台配置字典
        """
        config = self.load_keywords()
        return config.platforms.get(platform, {})
    
    def add_keyword(self, category: str, subcategory: str, keyword: str) -> bool:
        """
        添加新关键词
        
        Args:
            category: 分类 (pain_radar, opportunity_hunter 等)
            subcategory: 子分类 (chatgpt, github 等)
            keyword: 关键词
            
        Returns:
            是否成功
        """
        try:
            with open(self.keywords_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            if category not in data:
                data[category] = {}
            
            if subcategory not in data[category]:
                data[category][subcategory] = []
            
            if keyword not in data[category][subcategory]:
                data[category][subcategory].append(keyword)
            
            with open(self.keywords_file, 'w', encoding='utf-8') as f:
                yaml.dump(data, f, allow_unicode=True, default_flow_style=False)
            
            # 清除缓存
            self.config_cache.clear()
            
            logger.info(f"✅ 添加关键词: {category}/{subcategory}/{keyword}")
            return True
            
        except Exception as e:
            logger.error(f"❌ 添加关键词失败: {str(e)}")
            return False
    
    def remove_keyword(self, category: str, subcategory: str, keyword: str) -> bool:
        """
        删除关键词
        
        Args:
            category: 分类
            subcategory: 子分类
            keyword: 关键词
            
        Returns:
            是否成功
        """
        try:
            with open(self.keywords_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            if (category in data and 
                subcategory in data[category] and 
                keyword in data[category][subcategory]):
                
                data[category][subcategory].remove(keyword)
            
            with open(self.keywords_file, 'w', encoding='utf-8') as f:
                yaml.dump(data, f, allow_unicode=True, default_flow_style=False)
            
            # 清除缓存
            self.config_cache.clear()
            
            logger.info(f"✅ 删除关键词: {category}/{subcategory}/{keyword}")
            return True
            
        except Exception as e:
            logger.error(f"❌ 删除关键词失败: {str(e)}")
            return False
    
    def export_to_json(self, output_file: str) -> bool:
        """
        导出配置为 JSON
        
        Args:
            output_file: 输出文件路径
            
        Returns:
            是否成功
        """
        try:
            config = self.load_keywords()
            
            data = {
                'pain_radar': config.pain_radar,
                'opportunity_hunter': config.opportunity_hunter,
                'research': config.research,
                'startup': config.startup,
                'trends': config.trends,
                'exclude_keywords': config.exclude_keywords,
                'priority_keywords': config.priority_keywords,
                'platforms': config.platforms,
                'timing': config.timing,
                'output': config.output,
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ 导出配置到 JSON: {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"❌ 导出配置失败: {str(e)}")
            return False
    
    def print_summary(self):
        """打印配置摘要"""
        config = self.load_keywords()
        
        print("\n" + "="*60)
        print("📋 关键词配置摘要")
        print("="*60)
        
        print("\n🔴 痛点雷达关键词:")
        for product, keywords in config.pain_radar.items():
            print(f"  {product}: {len(keywords)} 个关键词")
        
        print("\n🟢 机会猎手关键词:")
        for platform, keywords in config.opportunity_hunter.items():
            print(f"  {platform}: {len(keywords)} 个关键词")
        
        print("\n🔵 研究关键词:")
        for source, keywords in config.research.items():
            print(f"  {source}: {len(keywords)} 个关键词")
        
        print("\n🟡 创业关键词:")
        for source, keywords in config.startup.items():
            print(f"  {source}: {len(keywords)} 个关键词")
        
        print("\n⚪ 排除关键词:")
        print(f"  共 {len(config.exclude_keywords)} 个")
        
        print("\n" + "="*60 + "\n")


def main():
    """测试配置加载器"""
    logging.basicConfig(level=logging.INFO)
    
    loader = ConfigLoader()
    
    # 加载配置
    config = loader.load_keywords()
    
    # 打印摘要
    loader.print_summary()
    
    # 获取特定关键词
    print("ChatGPT 痛点关键词:")
    print(loader.get_pain_radar_keywords('chatgpt'))
    
    print("\nGitHub 机会关键词:")
    print(loader.get_opportunity_keywords('github'))
    
    # 添加新关键词
    print("\n\n添加新关键词...")
    loader.add_keyword('pain_radar', 'chatgpt', 'context limit')
    
    # 导出为 JSON
    print("\n导出配置...")
    loader.export_to_json('/tmp/keywords.json')


if __name__ == '__main__':
    main()
