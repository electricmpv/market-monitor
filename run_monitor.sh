#!/bin/bash
# 🎯 市场监控系统启动脚本 (Linux/Mac)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 打印欢迎信息
print_banner() {
    echo -e "${BLUE}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎯 AI市场机会监控系统 v2.0                              ║
║   Market Opportunity Hunter for AI Solopreneur            ║
║                                                            ║
║   作者: 电动面包                                           ║
║   目标: 24小时自动发现市场机会                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}🔍 检查依赖...${NC}"
    
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 未安装${NC}"
        exit 1
    fi
    
    python3 -c "import google" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  缺少依赖，正在安装...${NC}"
        pip3 install -r requirements.txt
    }
    
    echo -e "${GREEN}✅ 依赖检查完成${NC}"
}

# 检查配置
check_config() {
    echo -e "${YELLOW}🔍 检查配置...${NC}"
    
    if [ ! -f "config.env" ]; then
        echo -e "${RED}❌ 缺少 config.env 文件${NC}"
        echo -e "${YELLOW}请复制 config.env.example 并填入你的API密钥${NC}"
        exit 1
    fi
    
    # 加载配置
    source config.env
    
    if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "填入自己的API-key" ]; then
        echo -e "${RED}❌ 未配置 GEMINI_API_KEY${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 配置检查完成${NC}"
}

# 运行所有模块
run_all() {
    print_banner
    echo -e "${BLUE}🚀 运行所有模块${NC}"
    python3 run_monitor.py --all
}

# 仅运行痛点雷达
run_pain_radar() {
    print_banner
    echo -e "${BLUE}📡 运行痛点雷达${NC}"
    python3 run_monitor.py --pain
}

# 仅运行机会猎手
run_opportunity_hunter() {
    print_banner
    echo -e "${BLUE}🔍 运行机会猎手${NC}"
    python3 run_monitor.py --opportunity
}

# 后台守护进程
run_daemon() {
    print_banner
    echo -e "${BLUE}🌙 启动守护进程${NC}"
    
    INTERVAL=${1:-3600}
    echo -e "${YELLOW}⏰ 循环间隔: ${INTERVAL} 秒${NC}"
    
    # 检查是否已运行
    if pgrep -f "python3 run_monitor.py --daemon" > /dev/null; then
        echo -e "${RED}❌ 守护进程已在运行${NC}"
        exit 1
    fi
    
    # 后台运行
    nohup python3 run_monitor.py --daemon --interval "$INTERVAL" > monitor.log 2>&1 &
    PID=$!
    echo -e "${GREEN}✅ 守护进程已启动 (PID: $PID)${NC}"
    echo -e "${YELLOW}📝 日志文件: monitor.log${NC}"
}

# 停止守护进程
stop_daemon() {
    echo -e "${BLUE}🛑 停止守护进程${NC}"
    
    if pgrep -f "python3 run_monitor.py --daemon" > /dev/null; then
        pkill -f "python3 run_monitor.py --daemon"
        echo -e "${GREEN}✅ 守护进程已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  守护进程未运行${NC}"
    fi
}

# 查看日志
view_logs() {
    if [ ! -f "monitor.log" ]; then
        echo -e "${RED}❌ 日志文件不存在${NC}"
        exit 1
    fi
    
    tail -f monitor.log
}

# 显示菜单
show_menu() {
    print_banner
    echo -e "${BLUE}请选择操作:${NC}"
    echo ""
    echo "  [1] 🚀 运行所有模块 (一次)"
    echo "  [2] 📡 运行痛点雷达"
    echo "  [3] 🔍 运行机会猎手"
    echo "  [4] 🌙 启动守护进程 (后台运行)"
    echo "  [5] 🛑 停止守护进程"
    echo "  [6] 📝 查看日志"
    echo "  [0] ❌ 退出"
    echo ""
}

# 主程序
main() {
    # 检查依赖和配置
    check_dependencies
    check_config
    
    # 如果有命令行参数
    if [ $# -gt 0 ]; then
        case "$1" in
            --all)
                run_all
                ;;
            --pain)
                run_pain_radar
                ;;
            --opportunity)
                run_opportunity_hunter
                ;;
            --daemon)
                INTERVAL=${2:-3600}
                run_daemon "$INTERVAL"
                ;;
            --stop)
                stop_daemon
                ;;
            --logs)
                view_logs
                ;;
            *)
                echo -e "${RED}❌ 未知参数: $1${NC}"
                echo "用法: $0 [--all|--pain|--opportunity|--daemon|--stop|--logs]"
                exit 1
                ;;
        esac
    else
        # 交互式菜单
        while true; do
            show_menu
            read -p "请输入选项 [0-6]: " choice
            
            case "$choice" in
                1)
                    run_all
                    ;;
                2)
                    run_pain_radar
                    ;;
                3)
                    run_opportunity_hunter
                    ;;
                4)
                    read -p "输入循环间隔(秒，默认3600): " interval
                    interval=${interval:-3600}
                    run_daemon "$interval"
                    ;;
                5)
                    stop_daemon
                    ;;
                6)
                    view_logs
                    ;;
                0)
                    echo -e "${BLUE}👋 再见!${NC}"
                    exit 0
                    ;;
                *)
                    echo -e "${RED}❌ 无效选项${NC}"
                    ;;
            esac
            
            echo ""
            read -p "按Enter继续..."
        done
    fi
}

# 运行主程序
main "$@"
