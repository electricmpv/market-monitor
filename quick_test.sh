#!/bin/bash
# Quick Test Script - 快速测试所有核心功能

echo "======================================"
echo "  Market Monitor v4.0 - 快速测试"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env 文件不存在！请先创建配置文件${NC}"
    exit 1
fi

# 测试 1: LLM 客户端
echo -e "${YELLOW}[1/3] 测试 LLM 客户端...${NC}"
python3 << 'EOF'
try:
    from llm_client import LLMClient
    import os

    provider = os.getenv('LLM_PROVIDER', 'deepseek')
    llm = LLMClient(provider=provider)
    result = llm.analyze('简单分析这句话：ChatGPT 太贵了')

    if result and not result.startswith('❌'):
        print(f"✅ LLM 客户端测试成功")
        print(f"   提供商: {provider}")
        print(f"   响应长度: {len(result)} 字符")
    else:
        print(f"❌ LLM 分析失败")
        exit(1)
except Exception as e:
    print(f"❌ LLM 客户端测试失败: {e}")
    exit(1)
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ LLM 客户端测试失败${NC}"
    exit 1
fi

echo ""

# 测试 2: Telegram 通知
echo -e "${YELLOW}[2/3] 测试 Telegram 通知...${NC}"
if [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo -e "${RED}❌ TELEGRAM_CHAT_ID 未设置${NC}"
    echo "   请先获取 Chat ID（参考 README_v4.md）"
    exit 1
fi

python3 << 'EOF'
import asyncio
try:
    from telegram_notifier import TelegramNotifier

    notifier = TelegramNotifier()
    asyncio.run(notifier.send_alert(
        '🧪 测试通知',
        'Market Monitor v4.0 系统测试\n所有模块运行正常！',
        priority='normal'
    ))
    print("✅ Telegram 通知发送成功")
    print("   请检查你的 Telegram 是否收到消息")
except Exception as e:
    print(f"❌ Telegram 通知失败: {e}")
    exit(1)
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Telegram 通知测试失败${NC}"
    exit 1
fi

echo ""

# 测试 3: 语雀报告生成器
echo -e "${YELLOW}[3/3] 测试语雀报告生成器...${NC}"
python3 << 'EOF'
try:
    from yuque_report_generator import YuqueReportGenerator

    gen = YuqueReportGenerator()

    # 测试数据
    test_data = {
        'platforms_count': 2,
        'raw_data_count': 5,
        'quality_opportunities': 3,
        'pain_points_count': 5,
        'tech_trends_count': 2,
        'pain_points': [
            {'product': 'ChatGPT', 'content': '测试痛点 1'},
            {'product': 'Claude', 'content': '测试痛点 2'}
        ],
        'sources': [
            {'platform': 'Twitter', 'url': 'https://twitter.com'},
            {'platform': 'GitHub', 'url': 'https://github.com'}
        ]
    }

    url = gen.create_report(test_data)
    print(f"✅ 语雀报告生成成功")
    print(f"   报告链接: {url}")
except Exception as e:
    print(f"❌ 语雀报告生成失败: {e}")
    exit(1)
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 语雀报告测试失败${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ 所有测试通过！${NC}"
echo "======================================"
echo ""
echo "下一步："
echo "  1. 运行完整监控: python pain_radar_v2.py"
echo "  2. 启动 API 服务: ./start_server.sh"
echo "  3. 查看文档: cat README_v4.md"
echo ""
