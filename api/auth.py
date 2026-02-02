"""GitHub OAuth 认证和 JWT 管理"""

import os
import jwt
import httpx
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

# 配置
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')
GITHUB_ALLOWED_USERS = os.getenv('GITHUB_ALLOWED_USERS', 'electricmpv').split(',')
JWT_SECRET = os.getenv('JWT_SECRET')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_HOURS = int(os.getenv('JWT_EXPIRE_HOURS', '720'))

security = HTTPBearer()


class AuthManager:
    """认证管理器"""

    @staticmethod
    async def exchange_github_code(code: str) -> dict:
        """
        用 GitHub OAuth code 换取 access_token

        Args:
            code: GitHub OAuth 授权码

        Returns:
            GitHub 用户信息 {'login': 'username', 'id': 123, ...}
        """
        # 1. 换取 access_token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                'https://github.com/login/oauth/access_token',
                headers={'Accept': 'application/json'},
                data={
                    'client_id': GITHUB_CLIENT_ID,
                    'client_secret': GITHUB_CLIENT_SECRET,
                    'code': code
                }
            )
            token_data = token_response.json()
            access_token = token_data.get('access_token')

            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail='GitHub OAuth 授权失败'
                )

            # 2. 获取用户信息
            user_response = await client.get(
                'https://api.github.com/user',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Accept': 'application/json'
                }
            )
            user_data = user_response.json()

            return user_data

    @staticmethod
    def verify_user(github_username: str) -> bool:
        """验证 GitHub 用户是否在白名单"""
        return github_username in GITHUB_ALLOWED_USERS

    @staticmethod
    def create_jwt_token(github_username: str) -> str:
        """
        生成 JWT Token

        Args:
            github_username: GitHub 用户名

        Returns:
            JWT Token 字符串
        """
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
        payload = {
            'sub': github_username,
            'exp': expire,
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token

    @staticmethod
    def verify_jwt_token(token: str) -> Optional[str]:
        """
        验证 JWT Token

        Args:
            token: JWT Token 字符串

        Returns:
            GitHub 用户名，验证失败返回 None
        """
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            username = payload.get('sub')
            return username
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Token 已过期，请重新登录'
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='无效的 Token'
            )


async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    认证依赖项 - 保护需要登录的路由

    用法:
        @app.get("/api/protected", dependencies=[Depends(require_auth)])
        def protected_route():
            return {"message": "You are authenticated"}
    """
    token = credentials.credentials
    username = AuthManager.verify_jwt_token(token)

    if not username or not AuthManager.verify_user(username):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='您没有权限访问'
        )

    return username
