# 🚀 快速部署指南 - Debian 12 美西服务器

## 📋 前置要求

- Debian 12 服务器
- Root 或 sudo 权限
- 互联网连接

## 🎯 一键部署脚本

### 第一步：登录服务器

```bash
ssh your-user@your-server-ip
```

### 第二步：安装 Docker

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose --version
```

### 第三步：克隆项目

```bash
# 安装 Git（如果没有）
sudo apt install git -y

# 克隆项目
git clone https://github.com/electricmpv/market-monitor.git
cd market-monitor
```

### 第四步：配置环境变量

```bash
# 复制配置文件
cp .env.example .env

# 编辑配置
nano .env
```

**必填项**：

```env
# Gemini API 密钥（必需）
GEMINI_API_KEY=your_gemini_api_key_here

# PushPlus Token（可选 - 用于微信推送）
PUSHPLUS_TOKEN=your_pushplus_token_here

# 时区（美西）
TZ=America/Los_Angeles
```

**获取 API 密钥**：

1. **Gemini API**: https://aistudio.google.com/app/apikey
2. **PushPlus**: http://www.pushplus.plus/

### 第五步：启动容器

```bash
# 构建并启动
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f market-monitor
```

### 第六步：验证运行

```bash
# 进入容器
docker compose exec market-monitor bash

# 运行一次监控
python3 run_monitor.py --all

# 查看生成的报告
ls -la reports/

# 退出容器
exit
```

## 🔄 日常操作

### 查看日志

```bash
# 实时日志
docker compose logs -f market-monitor

# 最后 100 行
docker compose logs --tail=100 market-monitor
```

### 重启系统

```bash
docker compose restart market-monitor
```

### 停止系统

```bash
docker compose stop
```

### 更新代码

```bash
# 拉取最新代码
git pull origin master

# 重新构建和启动
docker compose up -d --build
```

### 修改关键词

```bash
# 编辑关键词配置
nano config/keywords.yaml

# 重启容器以应用更改
docker compose restart market-monitor
```

## 📊 定时运行

容器默认每小时运行一次。如需修改：

```bash
# 编辑 docker-compose.yml
nano docker-compose.yml

# 修改 CMD 中的 --interval 参数（单位：秒）
# 例如：每 30 分钟运行一次
CMD ["python3", "run_monitor.py", "--daemon", "--interval", "1800"]

# 重新启动
docker compose up -d --build
```

## 🔐 安全建议

1. **使用防火墙**

```bash
# 安装 ufw
sudo apt install ufw -y

# 允许 SSH
sudo ufw allow 22/tcp

# 启用防火墙
sudo ufw enable
```

2. **定期更新**

```bash
# 每周更新一次
sudo apt update && sudo apt upgrade -y
```

3. **备份数据**

```bash
# 备份数据目录
tar -czf market-monitor-backup-$(date +%Y%m%d).tar.gz \
  my_market_brain/ logs/ reports/ config/
```

## 📈 监控系统状态

### 查看容器资源使用

```bash
docker stats market-monitor
```

### 查看磁盘使用

```bash
du -sh my_market_brain/ logs/ reports/
```

### 查看系统资源

```bash
# CPU 和内存
free -h
top

# 磁盘空间
df -h
```

## 🐛 故障排除

### 容器无法启动

```bash
# 查看详细日志
docker compose logs market-monitor

# 检查配置文件
cat .env

# 检查 Docker 状态
docker ps -a
```

### API 密钥错误

```bash
# 验证 Gemini API
docker compose exec market-monitor python3 -c "
import google.generativeai as genai
genai.configure(api_key='YOUR_KEY')
print('API Key is valid')
"
```

### 内存不足

```bash
# 增加 swap 空间
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 网络连接问题

```bash
# 测试网络
docker compose exec market-monitor curl -I https://www.google.com

# 检查 DNS
docker compose exec market-monitor nslookup google.com
```

## 📞 获取帮助

如有问题：

1. 查看日志: `docker compose logs market-monitor`
2. 检查 GitHub Issues: https://github.com/electricmpv/market-monitor/issues
3. 查看文档: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

## 🎉 完成！

系统现在应该正在运行。你可以：

1. ✅ 查看日志: `docker compose logs -f market-monitor`
2. ✅ 查看报告: `ls -la reports/`
3. ✅ 修改关键词: `nano config/keywords.yaml`
4. ✅ 等待微信推送（如果配置了 PushPlus）

---

**最后更新**: 2026-01-22  
**作者**: 电动面包  
**GitHub**: https://github.com/electricmpv/market-monitor
