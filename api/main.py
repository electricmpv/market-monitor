"""Market Monitor API - FastAPI 后端"""

import os
import json
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from api.auth import AuthManager, require_auth

app = FastAPI(title="Market Monitor API")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ==================== 数据模型 ====================

class LLMConfig(BaseModel):
    provider: str  # 'openai', 'anthropic', 'deepseek'
    api_key: str
    model: Optional[str] = None


class PlatformConfig(BaseModel):
    platforms: List[str]  # ['twitter', 'reddit', 'github', 'hackernews']


class Keyword(BaseModel):
    keyword: str
    category: str  # 'pain' or 'opportunity'
    product: Optional[str] = None  # 'ChatGPT', 'Claude', etc.


class Influencer(BaseModel):
    name: str
    twitter_handle: str
    category: str


# ==================== 认证 API ====================

@app.get("/api/auth/login")
def github_login():
    """
    GitHub OAuth 登录入口
    重定向到 GitHub 授权页面
    """
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={os.getenv('GITHUB_CLIENT_ID')}"
        f"&redirect_uri={os.getenv('FRONTEND_URL', 'http://localhost:3000')}/api/auth/callback"
        f"&scope=read:user"
    )
    return RedirectResponse(url=github_auth_url)


@app.get("/api/auth/callback")
async def github_callback(code: str):
    """
    GitHub OAuth 回调
    验证用户并返回 JWT Token
    """
    # 1. 用 code 换取 GitHub 用户信息
    user_data = await AuthManager.exchange_github_code(code)
    github_username = user_data.get('login')

    # 2. 验证用户是否在白名单
    if not AuthManager.verify_user(github_username):
        raise HTTPException(
            status_code=403,
            detail=f'用户 {github_username} 未被授权访问此系统'
        )

    # 3. 生成 JWT Token
    jwt_token = AuthManager.create_jwt_token(github_username)

    # 4. 重定向到前端，并携带 Token（通过 URL hash）
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    return RedirectResponse(url=f"{frontend_url}/#/auth/success?token={jwt_token}")


@app.get("/api/auth/verify")
def verify_token(username: str = Depends(require_auth)):
    """
    验证 Token 是否有效
    受保护的路由示例
    """
    return {
        'valid': True,
        'username': username
    }


# ==================== 配置管理 API ====================

@app.get("/api/config/llm", dependencies=[Depends(require_auth)])
def get_llm_config():
    """获取 LLM 配置"""
    return {
        'provider': os.getenv('LLM_PROVIDER', 'deepseek'),
        'model': os.getenv('LLM_MODEL', ''),
        'api_key_set': bool(os.getenv('OPENAI_API_KEY') or os.getenv('ANTHROPIC_API_KEY') or os.getenv('DEEPSEEK_API_KEY'))
    }


@app.post("/api/config/llm", dependencies=[Depends(require_auth)])
def save_llm_config(config: LLMConfig):
    """保存 LLM 配置"""
    # 更新 .env 文件
    env_path = '/home/git01/market-monitor/.env'

    # 读取现有配置
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value

    # 更新配置
    env_vars['LLM_PROVIDER'] = config.provider
    if config.model:
        env_vars['LLM_MODEL'] = config.model

    # 保存 API Key
    if config.provider == 'openai':
        env_vars['OPENAI_API_KEY'] = config.api_key
    elif config.provider == 'anthropic':
        env_vars['ANTHROPIC_API_KEY'] = config.api_key
    elif config.provider == 'deepseek':
        env_vars['DEEPSEEK_API_KEY'] = config.api_key

    # 写回文件
    with open(env_path, 'w') as f:
        for key, value in env_vars.items():
            f.write(f"{key}={value}\n")

    return {"message": "配置已保存"}


@app.get("/api/config/platforms", dependencies=[Depends(require_auth)])
def get_platforms():
    """获取已启用的监控平台"""
    config_path = '/home/git01/market-monitor/config/platforms.json'

    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return json.load(f)

    # 默认启用所有平台
    return {'platforms': ['twitter', 'reddit', 'github', 'hackernews', 'producthunt']}


@app.post("/api/config/platforms", dependencies=[Depends(require_auth)])
def save_platforms(config: PlatformConfig):
    """保存监控平台配置"""
    config_path = '/home/git01/market-monitor/config/platforms.json'

    # 确保目录存在
    os.makedirs(os.path.dirname(config_path), exist_ok=True)

    # 保存配置
    with open(config_path, 'w') as f:
        json.dump({'platforms': config.platforms}, f, indent=2)

    return {"message": "平台配置已保存"}


# ==================== 关键词管理 API ====================

@app.get("/api/keywords", dependencies=[Depends(require_auth)])
def get_keywords() -> List[Keyword]:
    """获取所有关键词"""
    keywords_path = '/home/git01/market-monitor/config/keywords.json'

    if os.path.exists(keywords_path):
        with open(keywords_path, 'r') as f:
            data = json.load(f)
            return [Keyword(**kw) for kw in data.get('keywords', [])]

    return []


@app.post("/api/keywords", dependencies=[Depends(require_auth)])
def add_keyword(keyword: Keyword):
    """添加关键词"""
    keywords_path = '/home/git01/market-monitor/config/keywords.json'

    # 读取现有关键词
    keywords = []
    if os.path.exists(keywords_path):
        with open(keywords_path, 'r') as f:
            data = json.load(f)
            keywords = data.get('keywords', [])

    # 添加新关键词
    keywords.append(keyword.dict())

    # 保存
    os.makedirs(os.path.dirname(keywords_path), exist_ok=True)
    with open(keywords_path, 'w', encoding='utf-8') as f:
        json.dump({'keywords': keywords}, f, indent=2, ensure_ascii=False)

    return {"message": "关键词已添加"}


@app.delete("/api/keywords/{keyword_text}", dependencies=[Depends(require_auth)])
def delete_keyword(keyword_text: str):
    """删除关键词"""
    keywords_path = '/home/git01/market-monitor/config/keywords.json'

    if not os.path.exists(keywords_path):
        raise HTTPException(status_code=404, detail="关键词配置不存在")

    # 读取现有关键词
    with open(keywords_path, 'r') as f:
        data = json.load(f)
        keywords = data.get('keywords', [])

    # 删除指定关键词
    keywords = [kw for kw in keywords if kw['keyword'] != keyword_text]

    # 保存
    with open(keywords_path, 'w', encoding='utf-8') as f:
        json.dump({'keywords': keywords}, f, indent=2, ensure_ascii=False)

    return {"message": "关键词已删除"}


# ==================== 博主管理 API ====================

@app.get("/api/influencers", dependencies=[Depends(require_auth)])
def get_influencers() -> List[Influencer]:
    """获取博主列表"""
    influencers_path = '/home/git01/market-monitor/config/influencers.json'

    if os.path.exists(influencers_path):
        with open(influencers_path, 'r') as f:
            data = json.load(f)
            return [Influencer(**inf) for inf in data.get('influencers', [])]

    return []


@app.post("/api/influencers", dependencies=[Depends(require_auth)])
def add_influencer(influencer: Influencer):
    """添加博主"""
    influencers_path = '/home/git01/market-monitor/config/influencers.json'

    # 读取现有博主
    influencers = []
    if os.path.exists(influencers_path):
        with open(influencers_path, 'r') as f:
            data = json.load(f)
            influencers = data.get('influencers', [])

    # 添加新博主
    influencers.append(influencer.dict())

    # 保存
    os.makedirs(os.path.dirname(influencers_path), exist_ok=True)
    with open(influencers_path, 'w', encoding='utf-8') as f:
        json.dump({'influencers': influencers}, f, indent=2, ensure_ascii=False)

    return {"message": "博主已添加"}


@app.delete("/api/influencers/{twitter_handle}", dependencies=[Depends(require_auth)])
def delete_influencer(twitter_handle: str):
    """删除博主"""
    influencers_path = '/home/git01/market-monitor/config/influencers.json'

    if not os.path.exists(influencers_path):
        raise HTTPException(status_code=404, detail="博主配置不存在")

    # 读取现有博主
    with open(influencers_path, 'r') as f:
        data = json.load(f)
        influencers = data.get('influencers', [])

    # 删除指定博主
    influencers = [inf for inf in influencers if inf['twitter_handle'] != twitter_handle]

    # 保存
    with open(influencers_path, 'w', encoding='utf-8') as f:
        json.dump({'influencers': influencers}, f, indent=2, ensure_ascii=False)

    return {"message": "博主已删除"}


# ==================== 报告管理 API ====================

@app.get("/api/reports", dependencies=[Depends(require_auth)])
def get_reports():
    """获取历史报告列表"""
    reports_dir = '/home/git01/market-monitor/reports'

    if not os.path.exists(reports_dir):
        return []

    reports = []
    for filename in os.listdir(reports_dir):
        if filename.endswith('.docx'):
            reports.append({
                'filename': filename,
                'date': filename.replace('Market_Opportunities_', '').replace('.docx', '')
            })

    return sorted(reports, key=lambda x: x['date'], reverse=True)


@app.get("/api/reports/{filename}", dependencies=[Depends(require_auth)])
def get_report_detail(filename: str):
    """获取报告详情"""
    report_path = f'/home/git01/market-monitor/reports/{filename}'

    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="报告不存在")

    return FileResponse(report_path, filename=filename)


# ==================== 监控任务 API ====================

@app.post("/api/monitor/run", dependencies=[Depends(require_auth)])
async def run_monitor_task(task: str):
    """手动触发监控任务"""
    if task == 'pain':
        # 异步运行 pain_radar_v2
        import asyncio
        from pain_radar_v2 import main as pain_main
        asyncio.create_task(pain_main())
        return {"message": "痛点扫描已启动"}

    elif task == 'opportunity':
        # 异步运行 opportunity_hunter
        import asyncio
        from opportunity_hunter import main as opp_main
        asyncio.create_task(opp_main())
        return {"message": "机会猎手已启动"}

    else:
        raise HTTPException(status_code=400, detail="无效的任务类型")


@app.get("/api/monitor/status", dependencies=[Depends(require_auth)])
def get_monitor_status():
    """获取监控状态"""
    return {
        'status': 'running',
        'last_run': '2024-02-02 10:00:00',
        'next_run': '2024-02-03 10:00:00'
    }


# ==================== 前端路由（所有非 API 请求） ====================

# 尝试挂载前端静态文件（如果存在）
if os.path.exists('/home/git01/market-monitor/frontend/dist'):
    app.mount("/assets", StaticFiles(directory="/home/git01/market-monitor/frontend/dist/assets"), name="assets")


@app.get("/")
def root():
    """根路径"""
    frontend_index = '/home/git01/market-monitor/frontend/dist/index.html'
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    return {"message": "Market Monitor API", "docs": "/docs"}


@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    """服务前端 SPA"""
    frontend_index = '/home/git01/market-monitor/frontend/dist/index.html'
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    raise HTTPException(status_code=404, detail="Not found")
