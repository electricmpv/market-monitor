#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 市场监控系统启动器
支持: Linux/Mac/Windows
"""

import os
import sys
import asyncio
import argparse
import subprocess
from pathlib import Path
from datetime import datetime

# 导入监控模块
try:
    import pain_radar_v2
    import opportunity_hunter
except ImportError:
    print("❌ 无法导入监控模块，请确保所有文件在同一目录")
    sys.exit(1)

class MarketMonitor:
    def __init__(self):
        self.start_time = datetime.now()
        self.results = {}
    
    def print_banner(self):
        """打印欢迎横幅"""
        banner = """
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎯 AI市场机会监控系统 v2.0                              ║
║   Market Opportunity Hunter for AI Solopreneur            ║
║                                                            ║
║   作者: 电动面包                                           ║
║   目标: 24小时自动发现市场机会                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
"""
        print(banner)
    
    async def run_pain_radar(self):
        """运行痛点雷达"""
        print("\n" + "="*60)
        print("📡 启动痛点雷达 (Pain Radar)")
        print("="*60)
        try:
            await pain_radar_v2.main()
            self.results['pain_radar'] = 'success'
        except Exception as e:
            print(f"❌ 痛点雷达失败: {e}")
            self.results['pain_radar'] = 'failed'
    
    def run_opportunity_hunter(self):
        """运行机会猎手"""
        print("\n" + "="*60)
        print("🔍 启动机会猎手 (Opportunity Hunter)")
        print("="*60)
        try:
            opportunity_hunter.main()
            self.results['opportunity_hunter'] = 'success'
        except Exception as e:
            print(f"❌ 机会猎手失败: {e}")
            self.results['opportunity_hunter'] = 'failed'
    
    def print_summary(self):
        """打印总结"""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        
        print("\n" + "="*60)
        print("📊 监控循环完成")
        print("="*60)
        print(f"⏱️  耗时: {elapsed:.1f} 秒")
        print(f"📈 结果: {self.results}")
        print("="*60)
    
    async def run_all(self):
        """运行所有模块"""
        self.print_banner()
        
        print(f"⏰ 启动时间: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("🚀 开始监控循环...\n")
        
        # 并行运行
        await asyncio.gather(
            self.run_pain_radar(),
            asyncio.to_thread(self.run_opportunity_hunter)
        )
        
        self.print_summary()

def main():
    parser = argparse.ArgumentParser(
        description='🎯 AI市场机会监控系统',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python run_monitor.py --all          # 运行所有模块
  python run_monitor.py --pain         # 仅运行痛点雷达
  python run_monitor.py --opportunity  # 仅运行机会猎手
  python run_monitor.py --daemon       # 后台运行
        """
    )
    
    parser.add_argument('--all', action='store_true', help='运行所有模块')
    parser.add_argument('--pain', action='store_true', help='仅运行痛点雷达')
    parser.add_argument('--opportunity', action='store_true', help='仅运行机会猎手')
    parser.add_argument('--daemon', action='store_true', help='后台守护进程')
    parser.add_argument('--interval', type=int, default=3600, help='循环间隔(秒)')
    
    args = parser.parse_args()
    
    monitor = MarketMonitor()
    
    # 如果没有指定参数，默认运行所有
    if not any([args.all, args.pain, args.opportunity, args.daemon]):
        args.all = True
    
    try:
        if args.all:
            asyncio.run(monitor.run_all())
        elif args.pain:
            asyncio.run(monitor.run_pain_radar())
        elif args.opportunity:
            monitor.run_opportunity_hunter()
        elif args.daemon:
            print("🌙 进入守护进程模式...")
            print(f"⏰ 循环间隔: {args.interval} 秒")
            import time
            while True:
                try:
                    asyncio.run(monitor.run_all())
                    print(f"\n⏰ 下次运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                    time.sleep(args.interval)
                except KeyboardInterrupt:
                    print("\n\n👋 守护进程已停止")
                    break
                except Exception as e:
                    print(f"\n❌ 循环错误: {e}")
                    print(f"⏰ 30秒后重试...")
                    time.sleep(30)
    
    except KeyboardInterrupt:
        print("\n\n👋 已中断")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 致命错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
