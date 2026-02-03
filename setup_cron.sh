#!/bin/bash
# 设置定时任务脚本

echo "📅 Market Monitor - 定时任务设置"
echo "======================================"
echo ""

# 检查当前 crontab
echo "当前 crontab 配置："
crontab -l 2>/dev/null || echo "（无现有 cron 任务）"
echo ""

# 准备新的 cron 任务
PROJECT_DIR="/home/git01/market-monitor"
LOG_FILE="/tmp/market-monitor.log"

CRON_JOB_1="0 9 * * * cd $PROJECT_DIR && source venv/bin/activate && python3 run_complete_workflow.py >> $LOG_FILE 2>&1"
CRON_JOB_2="0 15 * * * cd $PROJECT_DIR && source venv/bin/activate && python3 run_complete_workflow.py >> $LOG_FILE 2>&1"

echo "建议的定时任务："
echo "1. 每天早上 9:00 执行"
echo "   $CRON_JOB_1"
echo ""
echo "2. 每天下午 3:00 执行"
echo "   $CRON_JOB_2"
echo ""

read -p "是否添加这两个定时任务？(y/N): " confirm

if [[ $confirm == "y" || $confirm == "Y" ]]; then
    # 备份现有 crontab
    crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null

    # 添加新任务
    (crontab -l 2>/dev/null; echo "# Market Monitor - 每天 9:00 和 15:00 执行"; echo "$CRON_JOB_1"; echo "$CRON_JOB_2") | crontab -

    echo ""
    echo "✅ 定时任务已添加！"
    echo ""
    echo "新的 crontab 配置："
    crontab -l
    echo ""
    echo "📝 说明："
    echo "   - 任务将在每天 9:00 和 15:00 自动执行"
    echo "   - 日志保存在: $LOG_FILE"
    echo "   - 查看日志: tail -f $LOG_FILE"
    echo ""
else
    echo ""
    echo "❌ 已取消"
    echo ""
    echo "💡 手动添加方法："
    echo "   1. 运行: crontab -e"
    echo "   2. 添加以下行:"
    echo "      $CRON_JOB_1"
    echo "      $CRON_JOB_2"
    echo ""
fi
