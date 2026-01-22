# 🐳 Docker Compose 部署指南

## 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- Debian 12 或其他 Linux 发行版

### 安装 Docker 和 Docker Compose

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将当前用户添加到 docker 组（可选，避免每次都用 sudo）
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose --version
```

## 部署步骤

### 第一步：克隆或下载项目

```bash
# 如果使用 Git
git clone https://github.com/your-username/market-monitor.git
cd market-monitor

# 或者手动下载并解压
cd /path/to/market-monitor
```

### 第二步：配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

填入以下必需的 API 密钥：

```env
# Gemini API 密钥 (必需)
GEMINI_API_KEY=your_gemini_api_key_here

# PushPlus Token (可选 - 用于微信推送)
PUSHPLUS_TOKEN=your_pushplus_token_here

# GitHub Token (可选)
GITHUB_TOKEN=your_github_token_here

# 时区
TZ=America/Los_Angeles
```

### 第三步：构建和启动容器

```bash
# 构建镜像
docker compose build

# 启动容器（后台运行）
docker compose up -d

# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f market-monitor
```

### 第四步：验证系统运行

```bash
# 进入容器
docker compose exec market-monitor bash

# 运行一次监控
python3 run_monitor.py --all

# 查看生成的报告
ls -la reports/
```

## 常用命令

### 查看日志

```bash
# 查看实时日志
docker compose logs -f market-monitor

# 查看最后 100 行日志
docker compose logs --tail=100 market-monitor

# 查看特定时间范围的日志
docker compose logs --since 2024-01-22 market-monitor
```

### 停止和启动

```bash
# 停止容器
docker compose stop

# 启动容器
docker compose start

# 重启容器
docker compose restart

# 完全删除容器（保留数据）
docker compose down

# 删除容器和所有数据
docker compose down -v
```

### 更新配置

```bash
# 编辑配置文件
nano .env

# 重新启动容器以应用新配置
docker compose restart market-monitor
```

### 进入容器

```bash
# 进入容器的 bash shell
docker compose exec market-monitor bash

# 运行 Python 命令
docker compose exec market-monitor python3 -c "import sys; print(sys.version)"
```

### 查看容器资源使用

```bash
# 实时监控
docker stats market-monitor

# 查看详细信息
docker inspect market-monitor
```

## 数据持久化

所有数据都存储在以下本地目录中：

```
./my_market_brain/          # 向量数据库
./logs/                     # 日志文件
./reports/                  # 生成的报告
./config/                   # 配置文件
```

这些目录通过 Docker volumes 挂载，即使容器被删除，数据也不会丢失。

## 备份和恢复

### 备份数据

```bash
# 备份所有数据
tar -czf market-monitor-backup-$(date +%Y%m%d).tar.gz \
  my_market_brain/ logs/ reports/ config/

# 上传到云存储
scp market-monitor-backup-*.tar.gz user@backup-server:/backups/
```

### 恢复数据

```bash
# 停止容器
docker compose stop

# 恢复备份
tar -xzf market-monitor-backup-20240122.tar.gz

# 启动容器
docker compose start
```

## 定时任务

Docker 容器默认每小时运行一次监控。如果需要修改运行间隔：

```bash
# 编辑 docker-compose.yml
nano docker-compose.yml

# 修改 CMD 中的 --interval 参数（单位：秒）
# 例如：每 30 分钟运行一次
CMD ["python3", "run_monitor.py", "--daemon", "--interval", "1800"]

# 重新构建和启动
docker compose up -d --build
```

## 性能优化

### 资源限制

编辑 `docker-compose.yml` 中的资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '2'           # 最多使用 2 个 CPU 核心
      memory: 2G          # 最多使用 2GB 内存
    reservations:
      cpus: '1'           # 预留 1 个 CPU 核心
      memory: 1G          # 预留 1GB 内存
```

### 日志轮转

日志文件会自动轮转，防止占用过多磁盘空间：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "100m"      # 单个日志文件最大 100MB
    max-file: "10"        # 最多保留 10 个日志文件
```

## 故障排除

### 容器无法启动

```bash
# 查看详细错误日志
docker compose logs market-monitor

# 检查 .env 文件是否正确
cat .env

# 检查 API 密钥是否有效
```

### 内存不足

```bash
# 增加容器内存限制
# 编辑 docker-compose.yml，增加 memory 限制

# 清理 Docker 缓存
docker system prune -a
```

### 网络连接问题

```bash
# 检查容器网络
docker network ls
docker network inspect market-monitor-net

# 检查 DNS 解析
docker compose exec market-monitor nslookup google.com

# 测试网络连接
docker compose exec market-monitor curl -I https://www.google.com
```

### 数据库连接问题

```bash
# 检查 Chroma 服务状态
docker compose ps chroma

# 查看 Chroma 日志
docker compose logs chroma

# 重启 Chroma
docker compose restart chroma
```

## 高级配置

### 使用代理

如果需要通过代理访问网络：

```env
PROXY_HOST=proxy.example.com
PROXY_PORT=8080
```

### 自定义日志级别

```env
LOG_LEVEL=DEBUG    # 详细日志
LOG_LEVEL=INFO     # 信息日志（默认）
LOG_LEVEL=WARNING  # 警告日志
LOG_LEVEL=ERROR    # 错误日志
```

### 使用远程 Chroma 数据库

```env
USE_REMOTE_CHROMA=true
CHROMA_DB_URL=http://chroma-server:8000
```

## 监控和告警

### 健康检查

容器已配置健康检查，每 5 分钟检查一次：

```bash
# 查看健康状态
docker compose ps

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' market-monitor | python3 -m json.tool
```

### 自动重启

如果容器崩溃，Docker 会自动重启（根据 `restart_policy` 配置）：

```yaml
restart: always    # 总是重启
```

## 生产环境建议

1. **使用专用服务器**: 不要在开发机器上运行生产容器
2. **配置备份**: 定期备份 `my_market_brain` 目录
3. **监控资源**: 使用 `docker stats` 监控容器资源使用
4. **日志管理**: 配置日志轮转，防止磁盘满
5. **安全性**: 使用强密码，定期更新 API 密钥
6. **网络隔离**: 在防火墙后运行容器，限制访问
7. **定期更新**: 定期更新 Docker 镜像和依赖

## 获取帮助

如有问题，请：

1. 查看日志: `docker compose logs market-monitor`
2. 检查配置: `cat .env`
3. 测试 API 连接: `docker compose exec market-monitor python3 -c "import google.generativeai; print('OK')"`
4. 提交 Issue: https://github.com/your-username/market-monitor/issues

---

**最后更新**: 2026-01-22  
**作者**: 电动面包  
**版本**: 2.0
