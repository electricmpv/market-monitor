#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版配置加载器
统一管理所有配置文件：数据源、Influencers、关键词、CODEX 提示词
"""

import os
import yaml
import json
from pathlib import Path
from typing import Dict, List, Any, Optional


class EnhancedConfigLoader:
    """增强版配置加载器"""

    def __init__(self, config_dir: str = 'config'):
        """
        初始化配置加载器

        Args:
            config_dir: 配置文件目录路径
        """
        self.config_dir = Path(config_dir)
        self.configs = {}

        # 自动加载所有配置
        self._load_all_configs()

    def _load_yaml(self, filename: str) -> Optional[Dict]:
        """加载 YAML 配置文件"""
        filepath = self.config_dir / filename

        if not filepath.exists():
            print(f"⚠️  配置文件不存在: {filepath}")
            return None

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"❌ 加载配置失败 {filepath}: {e}")
            return None

    def _load_all_configs(self):
        """加载所有配置文件"""
        print("📦 加载配置文件...")

        # 1. 数据源配置
        self.configs['data_sources'] = self._load_yaml('data_sources.yaml')
        if self.configs['data_sources']:
            print("  ✅ 数据源配置 (data_sources.yaml)")

        # 2. Influencers 配置
        self.configs['influencers'] = self._load_yaml('influencers.yaml')
        if self.configs['influencers']:
            print("  ✅ Influencers 配置 (influencers.yaml)")

        # 3. 高信噪比关键词
        self.configs['high_signal_keywords'] = self._load_yaml('high_signal_keywords.yaml')
        if self.configs['high_signal_keywords']:
            print("  ✅ 高信噪比关键词 (high_signal_keywords.yaml)")

        # 4. CODEX 分析提示词
        self.configs['codex_prompt'] = self._load_yaml('codex_analysis_prompt.yaml')
        if self.configs['codex_prompt']:
            print("  ✅ CODEX 提示词 (codex_analysis_prompt.yaml)")

        # 5. 基础关键词（向后兼容）
        self.configs['keywords'] = self._load_yaml('keywords.yaml')
        if self.configs['keywords']:
            print("  ✅ 基础关键词 (keywords.yaml)")

        print(f"✅ 配置加载完成 ({len([c for c in self.configs.values() if c])} 个文件)\n")

    # ==================== 数据源相关 ====================

    def get_platform_config(self, platform: str) -> Optional[Dict]:
        """
        获取指定平台的配置

        Args:
            platform: 平台名称 (twitter, reddit, hackernews, github, etc.)

        Returns:
            平台配置字典
        """
        if not self.configs.get('data_sources'):
            return None

        return self.configs['data_sources'].get(platform)

    def get_all_platforms(self) -> List[str]:
        """获取所有启用的平台列表"""
        if not self.configs.get('data_sources'):
            return []

        platforms = []
        for platform, config in self.configs['data_sources'].items():
            if isinstance(config, dict) and config.get('enabled', False):
                platforms.append(platform)

        return platforms

    def get_reddit_subreddits(self, priority: Optional[str] = None) -> List[Dict]:
        """
        获取 Reddit subreddits 列表

        Args:
            priority: 过滤优先级 (high, medium, low)，None 表示全部

        Returns:
            Subreddit 配置列表
        """
        reddit_config = self.get_platform_config('reddit')
        if not reddit_config:
            return []

        all_subreddits = []
        for category, subreddits in reddit_config.get('subreddits', {}).items():
            all_subreddits.extend(subreddits)

        if priority:
            return [sr for sr in all_subreddits if sr.get('priority') == priority]

        return all_subreddits

    def get_vc_channels(self) -> Dict:
        """获取 VC 渠道配置"""
        return self.get_platform_config('vc_channels') or {}

    # ==================== Influencers 相关 ====================

    def get_influencers_by_category(self, category: str) -> List[Dict]:
        """
        获取指定类别的 Influencers

        Args:
            category: 类别名称 (ai_researchers, ai_founders, indie_hackers, etc.)

        Returns:
            Influencer 列表
        """
        if not self.configs.get('influencers'):
            return []

        return self.configs['influencers'].get(category, [])

    def get_influencers_by_priority(self, priority: str) -> List[Dict]:
        """
        获取指定优先级的所有 Influencers

        Args:
            priority: 优先级 (high, medium, low)

        Returns:
            Influencer 列表
        """
        if not self.configs.get('influencers'):
            return []

        all_influencers = []
        for category, influencers in self.configs['influencers'].items():
            if isinstance(influencers, list):
                all_influencers.extend([
                    inf for inf in influencers
                    if inf.get('priority') == priority
                ])

        return all_influencers

    def get_all_twitter_handles(self) -> List[str]:
        """获取所有 Twitter 账号"""
        if not self.configs.get('influencers'):
            return []

        handles = []
        for category, influencers in self.configs['influencers'].items():
            if isinstance(influencers, list):
                for inf in influencers:
                    if 'twitter' in inf:
                        handles.append(inf['twitter'])

        # 添加 VC 渠道的 Twitter 账号
        vc_config = self.get_vc_channels()
        if vc_config:
            handles.extend(vc_config.get('vc_twitter_accounts', []))

        return handles

    # ==================== 关键词相关 ====================

    def get_pain_signal_keywords(self) -> List[str]:
        """获取所有痛点信号关键词"""
        if not self.configs.get('high_signal_keywords'):
            return []

        pain_signals = []
        pain_config = self.configs['high_signal_keywords'].get('strong_pain_signals', {})

        for category, keywords in pain_config.items():
            pain_signals.extend(keywords)

        return pain_signals

    def get_opportunity_signal_keywords(self) -> List[str]:
        """获取所有机会信号关键词"""
        if not self.configs.get('high_signal_keywords'):
            return []

        opp_signals = []
        opp_config = self.configs['high_signal_keywords'].get('opportunity_signals', {})

        for category, keywords in opp_config.items():
            opp_signals.extend(keywords)

        return opp_signals

    def get_noise_filter_keywords(self) -> List[str]:
        """获取噪音过滤关键词"""
        if not self.configs.get('high_signal_keywords'):
            return []

        noise_keywords = []
        noise_config = self.configs['high_signal_keywords'].get('noise_filters', {})

        for category, keywords in noise_config.items():
            noise_keywords.extend(keywords)

        return noise_keywords

    def get_competitor_keywords(self) -> List[str]:
        """获取竞品关键词"""
        if not self.configs.get('high_signal_keywords'):
            return []

        competitor_config = self.configs['high_signal_keywords'].get('competitor_keywords', {})
        return competitor_config.get('ai_products', [])

    # ==================== CODEX 提示词相关 ====================

    def get_codex_prompt_template(self) -> Optional[str]:
        """获取 CODEX 主提示词模板"""
        if not self.configs.get('codex_prompt'):
            return None

        return self.configs['codex_prompt'].get('main_prompt')

    def build_codex_prompt(self, data_stats: Dict, raw_data: Dict) -> str:
        """
        构建完整的 CODEX 分析提示词

        Args:
            data_stats: 数据统计信息
                {
                    'timestamp': '2024-02-02 10:00',
                    'platforms': 'Twitter, Reddit, HN',
                    'total_count': 150,
                    'twitter_count': 80,
                    'reddit_count': 50,
                    'hn_count': 20,
                    'github_count': 0,
                    'other_count': 0
                }
            raw_data: 原始数据
                {
                    'twitter_data': '...',
                    'reddit_data': '...',
                    'hn_data': '...',
                    'github_data': '...',
                    'other_data': '...'
                }

        Returns:
            完整的提示词字符串
        """
        if not self.configs.get('codex_prompt'):
            raise ValueError("CODEX 提示词配置未加载")

        # 构建数据概览
        overview_template = self.configs['codex_prompt'].get('data_overview_template', '')
        data_overview = overview_template.format(**data_stats)

        # 格式化原始数据
        raw_data_template = self.configs['codex_prompt'].get('raw_data_template', '')
        formatted_raw_data = raw_data_template.format(**raw_data)

        # 构建完整提示词
        main_template = self.configs['codex_prompt'].get('main_prompt', '')
        full_prompt = main_template.format(
            data_overview=data_overview,
            raw_data=formatted_raw_data
        )

        return full_prompt

    def get_codex_config(self) -> Dict:
        """获取 CODEX 配置参数"""
        if not self.configs.get('codex_prompt'):
            return {}

        return self.configs['codex_prompt'].get('config', {})

    def get_monetization_paths(self) -> List[Dict]:
        """获取商业化路径配置"""
        if not self.configs.get('codex_prompt'):
            return []

        return self.configs['codex_prompt'].get('monetization_paths', [])

    # ==================== 工具方法 ====================

    def is_noise(self, text: str) -> bool:
        """
        判断文本是否为噪音内容

        Args:
            text: 待检查的文本

        Returns:
            True 表示是噪音，应该过滤
        """
        noise_keywords = self.get_noise_filter_keywords()

        text_lower = text.lower()
        for keyword in noise_keywords:
            if keyword.lower() in text_lower:
                return True

        return False

    def calculate_signal_score(self, text: str) -> float:
        """
        计算文本的信号得分

        Args:
            text: 待评分的文本

        Returns:
            信号得分 (0-10)
        """
        score = 5.0  # 基础分

        # 检查痛点信号（+2 分）
        pain_keywords = self.get_pain_signal_keywords()
        for keyword in pain_keywords:
            if keyword.lower() in text.lower():
                score += 2.0
                break

        # 检查机会信号（+2 分）
        opp_keywords = self.get_opportunity_signal_keywords()
        for keyword in opp_keywords:
            if keyword.lower() in text.lower():
                score += 2.0
                break

        # 检查竞品提及（+1 分）
        competitors = self.get_competitor_keywords()
        for comp in competitors:
            if comp.lower() in text.lower():
                score += 1.0
                break

        # 检查噪音（-5 分）
        if self.is_noise(text):
            score -= 5.0

        return max(0, min(10, score))  # 限制在 0-10 范围

    def get_platform_weight(self, platform: str) -> float:
        """
        获取平台权重

        Args:
            platform: 平台名称

        Returns:
            权重值 (默认 1.0)
        """
        if not self.configs.get('data_sources'):
            return 1.0

        global_config = self.configs['data_sources'].get('global_settings', {})
        source_weights = global_config.get('source_weights', {})

        return source_weights.get(platform, 1.0)

    # ==================== 导出方法 ====================

    def export_config_summary(self, output_file: str = 'config_summary.json'):
        """
        导出配置摘要到 JSON 文件

        Args:
            output_file: 输出文件路径
        """
        summary = {
            'platforms': self.get_all_platforms(),
            'total_influencers': sum(
                len(influencers) for influencers in self.configs.get('influencers', {}).values()
                if isinstance(influencers, list)
            ),
            'high_priority_influencers': len(self.get_influencers_by_priority('high')),
            'twitter_handles_count': len(self.get_all_twitter_handles()),
            'reddit_subreddits_count': len(self.get_reddit_subreddits()),
            'pain_signal_keywords_count': len(self.get_pain_signal_keywords()),
            'opportunity_signal_keywords_count': len(self.get_opportunity_signal_keywords()),
            'noise_filter_keywords_count': len(self.get_noise_filter_keywords()),
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

        print(f"✅ 配置摘要已导出到: {output_file}")
        return summary


# ==================== 使用示例 ====================

if __name__ == "__main__":
    # 初始化配置加载器
    loader = EnhancedConfigLoader()

    print("\n" + "="*60)
    print("配置加载测试")
    print("="*60 + "\n")

    # 1. 获取所有平台
    print("📡 启用的平台:")
    for platform in loader.get_all_platforms():
        weight = loader.get_platform_weight(platform)
        print(f"  - {platform} (权重: {weight})")

    # 2. 获取高优先级 Influencers
    print("\n👤 高优先级 Influencers:")
    high_priority = loader.get_influencers_by_priority('high')
    for inf in high_priority[:5]:  # 只显示前5个
        print(f"  - {inf['name']} ({inf.get('twitter', 'N/A')}) - {inf['category']}")

    # 3. 获取 Reddit subreddits
    print("\n📱 Reddit Subreddits (高优先级):")
    high_priority_subs = loader.get_reddit_subreddits(priority='high')
    for sr in high_priority_subs:
        print(f"  - r/{sr['name']} (min_score: {sr['min_score']})")

    # 4. 测试信号得分
    print("\n🎯 文本信号得分测试:")
    test_texts = [
        "ChatGPT is too expensive for my startup",
        "Just launched my new AI tool on Product Hunt!",
        "Click here to make money fast with crypto!!!",
        "Interesting discussion about RAG pipelines"
    ]
    for text in test_texts:
        score = loader.calculate_signal_score(text)
        is_noise = loader.is_noise(text)
        print(f"  [{score:.1f}/10] {'🚫 NOISE' if is_noise else '✅'} {text[:50]}...")

    # 5. 导出配置摘要
    print("\n📊 配置摘要:")
    summary = loader.export_config_summary()
    for key, value in summary.items():
        print(f"  - {key}: {value}")

    print("\n✅ 测试完成！")
