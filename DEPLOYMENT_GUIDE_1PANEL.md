# AI Market Hunter v3.0 - 1Panel + Debian 12 部署指南

## 📋 部署前检查清单

### 1. 服务器环境
- ✅ 操作系统: Debian 12
- ✅ 面板: 1Panel（已安装）
- ✅ Docker: 已安装（1Panel自带）
- ✅ Docker Compose: 已安装（1Panel自带）
- ✅ 域名: 已准备好（需要HTTPS）
- ✅ SSL证书: Let's Encrypt（通过1Panel自动配置）

### 2. 必需的API Key
- ✅ **DATABASE_URL**: MySQL/TiDB数据库连接字符串（必需）
- ✅ **LLM API Key**: OpenAI/Gemini/DeepSeek等（必需，在前端配置）
- ✅ **PUSHPLUS_TOKEN**: 微信推送Token（可选）
- ✅ **JWT_SECRET**: 随机生成的密钥（必需）
- ✅ **Twitter Cookies**: Twitter账号Cookies（可选，用于KOL抓取）

### 3. 域名和HTTPS配置
- ✅ 域名已解析到服务器IP
- ✅ 1Panel中配置反向代理
- ✅ 启用Let's Encrypt自动SSL证书
- ⚠️ **重要**: 必须使用HTTPS，否则登录Cookie会失败

---

## 🚀 部署流程（1Panel）

### 第一步：准备数据库

#### 选项A：使用1Panel内置MySQL
```bash
# 在1Panel中创建MySQL数据库
# 数据库名: market_monitor
# 用户名: market_monitor_user
# 密码: 自动生成（记录下来）
```

#### 选项B：使用TiDB Cloud（推荐）
```bash
# 1. 访问 https://tidbcloud.com
# 2. 创建免费集群（5GB存储）
# 3. 获取连接字符串：
#    mysql://user:password@gateway.tidbcloud.com:4000/database_name?ssl={"rejectUnauthorized":true}
```

**DATABASE_URL格式：**
```env
# MySQL
DATABASE_URL="mysql://username:password@localhost:3306/market_monitor"

# TiDB Cloud
DATABASE_URL="mysql://user:password@gateway.tidbcloud.com:4000/market_monitor?ssl={"rejectUnauthorized":true}"
```

---

### 第二步：克隆代码

```bash
# SSH登录到服务器
ssh root@your-server-ip

# 创建项目目录
mkdir -p /opt/market-monitor
cd /opt/market-monitor

# 克隆代码
git clone https://github.com/electricmpv/market-monitor.git .

# 创建config目录（如果不存在）
mkdir -p config
```

---

### 第三步：配置环境变量

```bash
# 创建.env文件
nano .env
```

**完整的.env配置：**
```env
# ========== 必需配置 ==========

# 数据库连接（必需）
DATABASE_URL="mysql://username:password@host:port/database_name"

# JWT密钥（必需，随机生成）
JWT_SECRET="your-random-secret-key-here-min-32-chars"

# Node环境
NODE_ENV=production
TZ=America/Los_Angeles

# ========== 可选配置 ==========

# 微信推送（可选）
PUSHPLUS_TOKEN="your-pushplus-token"

# 注意：LLM API Key 不需要在这里配置
# 在前端Settings页面配置即可
```

**生成JWT_SECRET：**
```bash
# 方法1：使用openssl
openssl rand -base64 32

# 方法2：使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### 第四步：在1Panel中创建应用

#### 1. 打开1Panel控制面板
- 访问: `https://your-server-ip:port`
- 登录1Panel

#### 2. 创建Docker Compose应用
1. 左侧菜单 → **容器** → **编排**
2. 点击 **创建编排**
3. 填写信息：
   - **名称**: `market-monitor`
   - **路径**: `/opt/market-monitor`
   - **描述**: `AI Market Hunter v3.0`

#### 3. 使用项目中的docker-compose.yml
- 1Panel会自动读取`/opt/market-monitor/docker-compose.yml`
- 点击 **创建**

#### 4. 启动容器
- 在编排列表中找到`market-monitor`
- 点击 **启动**
- 等待容器启动（约30-60秒）

---

### 第五步：配置反向代理和HTTPS

#### 1. 在1Panel中配置网站
1. 左侧菜单 → **网站**
2. 点击 **创建网站**
3. 填写信息：
   - **域名**: `market.yourdomain.com`
   - **类型**: 反向代理
   - **代理地址**: `http://127.0.0.1:3000`

#### 2. 启用HTTPS
1. 在网站列表中找到刚创建的网站
2. 点击 **SSL**
3. 选择 **Let's Encrypt**
4. 点击 **申请证书**
5. 等待证书申请成功

#### 3. 强制HTTPS重定向
1. 在网站设置中
2. 启用 **强制HTTPS**
3. 保存配置

---

### 第六步：初始化数据库和配置

#### 1. 访问网站
```
https://market.yourdomain.com
```

#### 2. 首次访问会自动创建数据库表
- 系统会自动运行数据库迁移
- 如果失败，检查DATABASE_URL是否正确

#### 3. 配置LLM API Key
1. 点击右上角 **系统设置**
2. 进入 **模型** 标签页
3. 配置搜索引擎和报告引擎：
   - **搜索引擎**: DeepSeek（便宜）
   - **报告引擎**: Claude/GPT-4（质量高）
4. 保存配置

#### 4. 初始化种子数据
1. 进入 **系统设置** → **控制台**
2. 点击 **初始化种子数据**
3. 等待完成（约10秒）

---

### 第七步：配置Twitter抓取（可选）

#### 1. 获取Twitter Cookies
```bash
# 使用Chrome登录Twitter
# 按F12打开开发者工具
# Network → 找到任意Twitter请求
# 复制Request Headers中的Cookie值
```

#### 2. 在前端配置
1. **系统设置** → **Twitter** 标签页
2. 粘贴Cookie值
3. 保存配置

---

### 第八步：配置定时任务（自动同步）

#### 在1Panel中配置Cron
1. 左侧菜单 → **计划任务**
2. 点击 **创建任务**
3. 填写信息：
   - **名称**: `市场监控数据同步`
   - **类型**: Shell脚本
   - **执行时间**: `30 8 * * *` （每天08:30）
   - **脚本内容**:
```bash
#!/bin/bash
cd /opt/market-monitor
docker compose exec -T market-monitor node -e "
const axios = require('axios');
axios.post('http://localhost:3000/api/trpc/sources.syncAll', {
  headers: { 'Content-Type': 'application/json' }
}).then(() => console.log('Sync completed')).catch(console.error);
"
```

---

## 🔍 验证部署

### 1. 检查容器状态
```bash
cd /opt/market-monitor
docker compose ps
```

**期望输出：**
```
NAME                  STATUS    PORTS
market-monitor-v3     Up        0.0.0.0:3000->3000/tcp
```

### 2. 检查健康检查
```bash
curl -f http://localhost:3000/api/health
```

**期望输出：**
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T...",
  "version": "3.0.0",
  "database": "connected",
  "uptime": 123.45
}
```

### 3. 检查日志
```bash
# 在1Panel中
# 容器 → market-monitor → 日志

# 或命令行
docker compose logs -f market-monitor
```

### 4. 访问前端
```
https://market.yourdomain.com
```

---

## 🛠️ 常见问题排查

### 问题1：容器无法启动
```bash
# 检查日志
docker compose logs market-monitor

# 常见原因：
# 1. DATABASE_URL格式错误
# 2. 端口3000被占用
# 3. 内存不足
```

### 问题2：数据库连接失败
```bash
# 测试数据库连接
docker compose exec market-monitor node -e "
const mysql = require('mysql2/promise');
mysql.createConnection(process.env.DATABASE_URL)
  .then(() => console.log('DB OK'))
  .catch(console.error);
"
```

### 问题3：HTTPS证书申请失败
```bash
# 检查：
# 1. 域名是否正确解析到服务器IP
# 2. 80端口是否开放（Let's Encrypt需要）
# 3. 防火墙是否允许443端口
```

### 问题4：登录后Cookie丢失
```bash
# 原因：没有使用HTTPS
# 解决：必须配置HTTPS反向代理
```

### 问题5：Twitter抓取失败
```bash
# 检查：
# 1. Cookie是否过期（需要重新获取）
# 2. Twitter账号是否被限制
# 3. 检查日志中的错误信息
```

---

## 📊 监控和维护

### 1. 日志管理
```bash
# 查看实时日志
docker compose logs -f

# 查看最近100行
docker compose logs --tail=100

# 清理旧日志
docker compose down && docker compose up -d
```

### 2. 数据备份
```bash
# 备份Docker卷
docker run --rm \
  -v market-monitor-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/data-backup-$(date +%Y%m%d).tar.gz /data

# 备份数据库（如果使用本地MySQL）
docker compose exec mysql mysqldump -u root -p market_monitor > backup.sql
```

### 3. 更新系统
```bash
# 拉取最新代码
cd /opt/market-monitor
git pull origin main

# 重新构建并启动
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 🎯 性能优化建议

### 1. 服务器配置
- **最低配置**: 1核2GB（适合测试）
- **推荐配置**: 2核4GB（适合生产）
- **高负载配置**: 4核8GB（大量KOL抓取）

### 2. 数据库优化
```sql
-- 添加索引
CREATE INDEX idx_created_at ON items(created_at);
CREATE INDEX idx_radar_type ON items(radar_type);
CREATE INDEX idx_score ON items(score);
```

### 3. Docker资源限制
```yaml
# 在docker-compose.yml中添加
services:
  market-monitor:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          memory: 2G
```

---

## 📞 技术支持

如果遇到问题：
1. 检查日志: `docker compose logs -f`
2. 查看健康检查: `curl http://localhost:3000/api/health`
3. 检查GitHub Issues: https://github.com/electricmpv/market-monitor/issues

---

**部署完成！🎉**

现在你可以：
1. 访问 `https://market.yourdomain.com`
2. 配置LLM API Key
3. 初始化种子数据
4. 开始监控市场机会！
