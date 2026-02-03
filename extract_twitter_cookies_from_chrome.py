#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 Chrome 浏览器提取 Twitter Cookies
"""

import json
import os
import shutil
import sqlite3
from pathlib import Path


def find_chrome_cookies_db():
    """查找 Chrome Cookies 数据库"""
    possible_paths = [
        Path.home() / '.config/google-chrome/Default/Cookies',
        Path.home() / '.config/chromium/Default/Cookies',
        Path.home() / '.config/google-chrome/Profile 1/Cookies',
    ]

    for path in possible_paths:
        if path.exists():
            return path

    return None


def extract_twitter_cookies(cookies_db_path, output_file='twitter_cookies.json'):
    """
    从 Chrome Cookies 数据库提取 Twitter cookies

    Args:
        cookies_db_path: Chrome Cookies 数据库路径
        output_file: 输出文件路径
    """
    print("🔍 正在提取 Twitter cookies...")
    print(f"   数据库: {cookies_db_path}")

    # 创建临时副本（因为 Chrome 可能正在使用数据库）
    temp_db = '/tmp/chrome_cookies_temp.db'
    try:
        shutil.copy2(cookies_db_path, temp_db)
    except Exception as e:
        print(f"❌ 无法复制数据库: {e}")
        print("💡 请确保 Chrome 已关闭，或使用以下命令强制复制：")
        print(f"   sudo cp {cookies_db_path} {temp_db}")
        print(f"   sudo chmod 644 {temp_db}")
        return False

    try:
        # 连接到 SQLite 数据库
        conn = sqlite3.connect(temp_db)
        cursor = conn.cursor()

        # 查询 Twitter 相关的 cookies
        # Twitter 的域名包括 twitter.com 和 x.com
        cursor.execute("""
            SELECT name, value, host_key, path, expires_utc, is_secure, is_httponly
            FROM cookies
            WHERE host_key LIKE '%twitter.com%' OR host_key LIKE '%x.com%'
        """)

        rows = cursor.fetchall()
        conn.close()

        if not rows:
            print("⚠️  未找到 Twitter cookies")
            print("💡 请确保：")
            print("   1. Chrome 浏览器已登录 Twitter")
            print("   2. 访问过 https://twitter.com 或 https://x.com")
            return False

        # 转换为 twikit 需要的格式
        cookies_dict = {}

        for row in rows:
            name, value, host_key, path, expires_utc, is_secure, is_httponly = row

            # twikit 需要的关键 cookies
            if name in ['auth_token', 'ct0', 'twid', 'kdt']:
                cookies_dict[name] = value

        if not cookies_dict:
            print("⚠️  未找到必要的 Twitter 认证 cookies")
            print(f"   找到的 cookies: {len(rows)} 个")
            print("💡 请尝试：")
            print("   1. 退出 Twitter 并重新登录")
            print("   2. 访问 https://twitter.com/home")
            return False

        # 保存为 JSON
        with open(output_file, 'w') as f:
            json.dump(cookies_dict, f, indent=2)

        print(f"✅ Twitter cookies 已提取!")
        print(f"   输出文件: {output_file}")
        print(f"   包含 cookies: {', '.join(cookies_dict.keys())}")

        # 清理临时文件
        os.remove(temp_db)

        return True

    except Exception as e:
        print(f"❌ 提取失败: {e}")
        if os.path.exists(temp_db):
            os.remove(temp_db)
        return False


def main():
    """主函数"""
    print("\n" + "="*60)
    print("🐦 从 Chrome 提取 Twitter Cookies")
    print("="*60 + "\n")

    # 查找 Chrome Cookies 数据库
    cookies_db = find_chrome_cookies_db()

    if not cookies_db:
        print("❌ 未找到 Chrome Cookies 数据库")
        print("\n💡 可能的原因：")
        print("   1. Chrome 未安装")
        print("   2. 使用的是其他浏览器")
        print("   3. Chrome 配置文件在非标准位置")
        print("\n🔧 手动指定路径：")
        print("   找到 Cookies 文件位置，然后运行：")
        print("   python3 extract_twitter_cookies_from_chrome.py /path/to/Cookies")
        return

    print(f"✅ 找到 Chrome Cookies: {cookies_db}")

    # 提取 cookies
    success = extract_twitter_cookies(cookies_db)

    if success:
        print("\n" + "="*60)
        print("✅ 完成！")
        print("="*60)
        print("\n📝 下一步：")
        print("   运行 Twitter 采集器测试：")
        print("   python3 data_collectors/twitter_collector.py")
    else:
        print("\n" + "="*60)
        print("❌ 提取失败")
        print("="*60)
        print("\n💡 备选方案：")
        print("   1. 使用手动登录脚本：")
        print("      python3 setup_twitter_cookies.py")
        print("\n   2. 手动复制 cookies（推荐）：")
        print("      a. 在 Chrome 中打开 https://twitter.com")
        print("      b. F12 打开开发者工具 → Application → Cookies → twitter.com")
        print("      c. 复制以下 cookies 的值：")
        print("         - auth_token")
        print("         - ct0")
        print("         - twid (可选)")
        print("      d. 创建 twitter_cookies.json 文件，格式：")
        print('         {"auth_token": "xxx", "ct0": "yyy"}')


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        # 手动指定路径
        cookies_db = Path(sys.argv[1])
        if cookies_db.exists():
            extract_twitter_cookies(cookies_db)
        else:
            print(f"❌ 文件不存在: {cookies_db}")
    else:
        main()
