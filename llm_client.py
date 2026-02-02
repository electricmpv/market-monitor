"""统一的 LLM 客户端 - 支持多个提供商"""

import os
import openai
from typing import Optional
import time


class LLMClient:
    """
    统一的 LLM 客户端
    支持: OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), DeepSeek
    """

    def __init__(self, provider='openai', model=None):
        self.provider = provider.lower()
        self.model = model
        self._setup_client()

    def _setup_client(self):
        """初始化对应的客户端"""
        if self.provider == 'openai':
            self.client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            self.model = self.model or 'gpt-4-turbo'

        elif self.provider == 'anthropic':
            import anthropic
            self.client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
            self.model = self.model or 'claude-3-5-sonnet-20241022'

        elif self.provider == 'deepseek':
            self.client = openai.OpenAI(
                api_key=os.getenv('DEEPSEEK_API_KEY'),
                base_url="https://api.deepseek.com"
            )
            self.model = self.model or 'deepseek-chat'

        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def analyze(self, prompt: str, max_retries=3) -> str:
        """
        统一的分析接口

        Args:
            prompt: 分析提示词
            max_retries: 最大重试次数

        Returns:
            分析结果文本
        """
        for attempt in range(max_retries):
            try:
                if self.provider in ['openai', 'deepseek']:
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=[{"role": "user", "content": prompt}]
                    )
                    return response.choices[0].message.content

                elif self.provider == 'anthropic':
                    response = self.client.messages.create(
                        model=self.model,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=4096
                    )
                    return response.content[0].text

            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"LLM调用失败（尝试 {attempt + 1}/{max_retries}），重试中...")
                    time.sleep(2 ** attempt)  # 指数退避
                else:
                    raise Exception(f"LLM调用失败: {e}")


# 使用示例
if __name__ == "__main__":
    # 选择提供商
    llm = LLMClient(provider='deepseek')  # 或 'openai', 'anthropic'

    # 分析
    result = llm.analyze("分析这段文本：ChatGPT 太贵了")
    print(result)
