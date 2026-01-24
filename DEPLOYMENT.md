# AI Market Hunter v3.0 - 部署指南

## 系统要求

- **操作系统**: Debian 12 (推荐) / Ubuntu 22.04+
- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **内存**: 2GB+ RAM
- **存储**: 10GB+ 可用空间

## 快速部署 (5 分钟)

### 第一步：安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

### 第二步：克隆项目

```bash
# 从 GitHub 克隆
git clone https://github.com/electricmpv/market-monitor.git
cd market-monitor
```

### 第三步：配置环境变量

```bash
# 创建 .env 文件
cat > .env << 'EOF'
# Database (使用外部 MySQL/TiDB)
DATABASE_URL=mysql://user:password@host:3306/database?ssl=true

# AI API Keys (双 API Key 配置)
# 搜索用 Flash 模型 (快速、便宜)
GEMINI_API_KEY_SEARCH=your_gemini_api_key_for_search
# 报告用 Pro 模型 (详细、深度)
GEMINI_API_KEY_REPORT=your_gemini_api_key_for_report

# 微信推送 (PushPlus)
PUSHPLUS_TOKEN=your_pushplus_token

# JWT Secret (随机字符串)
JWT_SECRET=your_random_jwt_secret

# 时区
TZ=America/Los_Angeles
EOF
```

### 第四步：启动服务

```bash
# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f market-monitor

# 检查状态
docker compose ps
```

### 第五步：访问系统

打开浏览器访问: `http://your-server-ip:3000`

## 配置说明

### 双 API Key 配置

系统支持两个 Gemini API Key，分别用于不同场景：

| Key | 用途 | 推荐模型 | 成本 |
|-----|------|---------|------|
| `GEMINI_API_KEY_SEARCH` | 数据过滤、语义分析 | gemini-1.5-flash | ~$0.01/1000 次 |
| `GEMINI_API_KEY_REPORT` | 深度分析、三人格报告 | gemini-1.5-pro | ~$0.05/1000 次 |

**获取 API Key**: https://makersuite.google.com/app/apikey

### 关键词配置

关键词配置文件位于 `config/keywords.yaml`，可以随时修改：

```yaml
# 添加新关键词
track1_pain_hunter:
  - keyword: "your new keyword"
    category: your_category
```

修改后重启容器生效：

```bash
docker compose restart market-monitor
```

### 推送配置

1. 访问 https://www.pushplus.plus 注册账号
2. 获取 Token
3. 在 `.env` 中配置 `PUSHPLUS_TOKEN`
4. 在系统设置页面配置推送时间（默认 08:30）

## 运维命令

```bash
# 查看日志
docker compose logs -f market-monitor

# 重启服务
docker compose restart market-monitor

# 停止服务
docker compose down

# 更新代码并重新部署
git pull
docker compose up -d --build

# 查看容器状态
docker compose ps

# 进入容器调试
docker compose exec market-monitor sh
```

## 数据备份

```bash
# 备份数据目录
tar -czvf backup-$(date +%Y%m%d).tar.gz ./data ./logs

# 恢复数据
tar -xzvf backup-20260123.tar.gz
```

## 常见问题

### Q: 容器启动失败？

```bash
# 检查日志
docker compose logs market-monitor

# 检查端口占用
sudo netstat -tlnp | grep 3000
```

### Q: 数据库连接失败？

确保 `DATABASE_URL` 格式正确，并且数据库允许远程连接。

### Q: 推送不工作？

1. 检查 `PUSHPLUS_TOKEN` 是否正确
2. 在系统设置页面点击"发送测试推送"
3. 查看日志中的错误信息

## 成本估算

| 项目 | 月成本 |
|------|--------|
| Gemini API (Flash) | ~$1.5 |
| Gemini API (Pro) | ~$2.0 |
| 服务器 (可选) | $0-5 |
| **总计** | **$3.5-8.5/月** |

## 技术支持

- GitHub Issues: https://github.com/electricmpv/market-monitor/issues
- 文档: 本文件

---

**AI Market Hunter v3.0** - 为 Solopreneur 打造的市场机会发现系统
