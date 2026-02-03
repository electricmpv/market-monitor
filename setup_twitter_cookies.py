#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Twitter Cookies 设置脚本
用于生成 Twitter 采集所需的 cookies 文件
"""

import asyncio
import getpass


async def setup_twitter_cookies():
    """设置 Twitter cookies"""
    print("\n" + "="*60)
    print("🐦 Twitter Cookies 设置向导")
    print("="*60 + "\n")

    print("⚠️  注意：此脚本需要你的 Twitter 账号密码")
    print("💡 建议使用测试账号，不要使用主账号")
    print("🔒 账号密码仅用于本地登录，不会上传\n")

    proceed = input("是否继续？(y/N): ")
    if proceed.lower() != 'y':
        print("已取消")
        return False

    try:
        from twikit import Client

        # 输入账号信息
        print("\n请输入 Twitter 账号信息：")
        username = input("用户名（@后面的部分）: ")
        email = input("邮箱: ")
        password = getpass.getpass("密码: ")

        print("\n🔐 正在登录 Twitter...")

        # 创建客户端
        client = Client(language='en-US')

        # 登录
        await client.login(
            auth_info_1=username,
            auth_info_2=email,
            password=password
        )

        # 保存 cookies
        cookies_file = 'twitter_cookies.json'
        client.save_cookies(cookies_file)

        print(f"\n✅ 登录成功！Cookies 已保存到 {cookies_file}")
        print("💡 现在可以使用 Twitter 采集功能了")

        return True

    except ImportError:
        print("\n❌ twikit 未安装")
        print("💡 请运行: source venv/bin/activate && pip install twikit")
        return False

    except Exception as e:
        print(f"\n❌ 登录失败: {e}")
        print("\n💡 可能原因:")
        print("   1. 用户名、邮箱或密码错误")
        print("   2. 账号需要验证码（Twitter 可能要求验证）")
        print("   3. 网络连接问题")
        return False


async def test_cookies():
    """测试 cookies 是否有效"""
    print("\n" + "="*60)
    print("🧪 测试 Twitter Cookies")
    print("="*60 + "\n")

    try:
        from twikit import Client

        client = Client(language='en-US')
        client.load_cookies('twitter_cookies.json')

        print("✅ Cookies 加载成功")
        print("🔍 测试搜索功能...")

        # 测试搜索
        tweets = await client.search_tweet('AI', product='Latest', count=3)

        print(f"✅ 搜索成功！找到 {len(tweets)} 条推文")

        return True

    except FileNotFoundError:
        print("❌ Cookies 文件不存在")
        print("💡 请先运行设置向导")
        return False

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        print("💡 Cookies 可能已过期，请重新登录")
        return False


async def main():
    """主函数"""
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        # 测试模式
        await test_cookies()
    else:
        # 设置模式
        success = await setup_twitter_cookies()

        if success:
            print("\n🧪 测试 cookies...")
            await test_cookies()


if __name__ == "__main__":
    asyncio.run(main())
