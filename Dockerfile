# 使用官方 Python 3.11 镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    TZ=America/Los_Angeles

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制 requirements.txt
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# 复制项目文件
COPY . .

# 创建必要的目录
RUN mkdir -p /app/my_market_brain \
    && mkdir -p /app/logs \
    && mkdir -p /app/reports \
    && mkdir -p /app/config

# 设置权限
RUN chmod +x /app/run_monitor.sh

# 默认命令：运行监控系统
CMD ["python3", "run_monitor.py", "--daemon", "--interval", "3600"]
