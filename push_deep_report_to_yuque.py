#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""直接推送深度分析报告到语雀"""

import requests
import os
import sys
from datetime import datetime


def push_report_to_yuque(markdown_file_path):
    """推送 Markdown 报告到语雀"""

    # 语雀配置
    token = os.getenv('YUQUE_TOKEN')
    if not token:
        raise ValueError("请设置环境变量 YUQUE_TOKEN！")
    base_url = 'https://www.yuque.com/api/v2'
    namespace = 'diandongmianbao'
    repo_slug = 'cg40cd'

    # 读取 Markdown 内容
    try:
        with open(markdown_file_path, 'r', encoding='utf-8') as f:
            markdown_content = f.read()
    except Exception as e:
        print(f"❌ 读取文件失败: {e}")
        return False

    # 创建文档
    doc_url = f"{base_url}/repos/{namespace}/{repo_slug}/docs"
    headers = {
        'X-Auth-Token': token,
        'Content-Type': 'application/json'
    }

    title = f"AI市场深度分析报告 - {datetime.now().strftime('%Y年%m月%d日')}"
    slug = f"deep-analysis-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    payload = {
        'title': title,
        'slug': slug,
        'body': markdown_content,
        'public': 0,
        'format': 'markdown'
    }

    print(f"📤 正在推送报告到语雀...")
    print(f"   知识库: {namespace}/{repo_slug}")
    print(f"   标题: {title}")

    try:
        response = requests.post(doc_url, headers=headers, json=payload, timeout=30)

        if response.status_code in [200, 201]:
            doc_data = response.json()

            if 'data' in doc_data:
                doc_slug = doc_data['data'].get('slug', slug)
                yuque_url = f"https://www.yuque.com/{namespace}/{repo_slug}/{doc_slug}"

                print(f"\n✅ 报告推送成功！")
                print(f"   URL: {yuque_url}")
                return yuque_url
            else:
                print(f"\n✅ 报告已推送（响应格式异常）")
                print(f"   预估 URL: https://www.yuque.com/{namespace}/{repo_slug}/{slug}")
                return f"https://www.yuque.com/{namespace}/{repo_slug}/{slug}"
        else:
            print(f"\n❌ 推送失败: {response.status_code}")
            print(f"   响应: {response.text}")
            return False

    except Exception as e:
        print(f"\n❌ 推送出错: {e}")
        return False


if __name__ == "__main__":
    if len(sys.argv) > 1:
        markdown_file = sys.argv[1]
    else:
        markdown_file = '/tmp/deep_market_analysis_final.md'

    print("\n" + "="*60)
    print("📊 推送深度分析报告到语雀")
    print("="*60 + "\n")

    result = push_report_to_yuque(markdown_file)

    if result:
        print("\n" + "="*60)
        print("✅ 完成！")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("❌ 推送失败")
        print("="*60)
        sys.exit(1)
