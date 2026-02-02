#!/bin/bash
# Market Monitor API 服务启动脚本

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 启动 FastAPI 服务器
echo "🚀 启动 Market Monitor API 服务器..."
echo "📡 监听地址: http://0.0.0.0:8000"
echo "📚 API 文档: http://0.0.0.0:8000/docs"
echo ""

uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
