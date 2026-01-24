import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { 
  Target, Microscope, DollarSign, Radar, Brain, Sparkles, 
  ArrowRight, CheckCircle, Zap, Globe, TrendingUp, Users
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center space-y-6">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              已登录
            </Badge>
            <h1 className="text-4xl font-bold">欢迎回来，{user?.name || '用户'}</h1>
            <p className="text-xl text-slate-400">准备好发现新的市场机会了吗？</p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => setLocation('/dashboard')}>
                进入控制台
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation('/settings')}>
                系统设置
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            AI 驱动的市场机会发现系统
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            AI Market Hunter
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            三雷达 + 三层过滤 + 学习回路，24小时自动为你捕获全球 AI 前沿信息、创业机会、技术痛点和融资项目
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                开始使用
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Three Radars Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">三大雷达，全方位覆盖</h2>
          <p className="text-slate-400">从痛点到技术到融资，不漏过任何机会</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-red-500/30 hover:border-red-500/50 transition-colors">
            <CardHeader>
              <div className="p-3 rounded-lg bg-red-500/20 w-fit">
                <Target className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-white">痛点猎手</CardTitle>
              <CardDescription className="text-slate-400">
                Pain Hunter
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>监控 Twitter、Reddit、HN 上的用户吐槽，发现真实的市场痛点和需求</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  用户抱怨 → 产品机会
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  竞品缺陷 → 差异化点
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-blue-500/30 hover:border-blue-500/50 transition-colors">
            <CardHeader>
              <div className="p-3 rounded-lg bg-blue-500/20 w-fit">
                <Microscope className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-white">技术侦察</CardTitle>
              <CardDescription className="text-slate-400">
                Tech Scout
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>追踪 GitHub、Hugging Face 上的前沿技术，发现可落地的技术方案</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  新框架 → 技术红利
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  论文 → 商业转化
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-green-500/30 hover:border-green-500/50 transition-colors">
            <CardHeader>
              <div className="p-3 rounded-lg bg-green-500/20 w-fit">
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
              <CardTitle className="text-white">融资监控</CardTitle>
              <CardDescription className="text-slate-400">
                Funding Watch
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>追踪 Y Combinator、Product Hunt 上的融资动态，发现热门赛道</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  融资 → 赛道验证
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  YC 项目 → 方向参考
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">核心特性</h2>
          <p className="text-slate-400">不只是信息聚合，而是智能筛选</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <Brain className="h-10 w-10 text-purple-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">三层过滤</h3>
            <p className="text-sm text-slate-400">
              硬过滤 → LLM 语义 → 主题聚类，层层筛选高质量信号
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <TrendingUp className="h-10 w-10 text-orange-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">五维评分</h3>
            <p className="text-sm text-slate-400">
              加速度、共识度、可信度、适合度、新颖度，量化每个机会
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <Users className="h-10 w-10 text-blue-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">三人格分析</h3>
            <p className="text-sm text-slate-400">
              毒舌 PM、技术大牛、VC 分析师，三个视角看透机会
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <Zap className="h-10 w-10 text-yellow-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">学习回路</h3>
            <p className="text-sm text-slate-400">
              根据你的操作自动学习偏好，越用越懂你
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">8 大数据源</h2>
          <p className="text-slate-400">覆盖全球主流技术和创业社区</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {['Twitter', 'GitHub', 'Hacker News', 'Reddit', 'Product Hunt', 'Hugging Face', 'Y Combinator', 'Google Trends'].map((source) => (
            <Badge key={source} variant="outline" className="text-slate-300 border-slate-600 px-4 py-2">
              <Globe className="h-4 w-4 mr-2" />
              {source}
            </Badge>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold">准备好发现下一个机会了吗？</h2>
          <p className="text-slate-400">
            让 AI 成为你的 24 小时市场雷达，主动发现机会，而不是被动接收信息
          </p>
          <Button size="lg" asChild>
            <a href={getLoginUrl()}>
              立即开始
              <ArrowRight className="h-5 w-5 ml-2" />
            </a>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>AI Market Hunter v3.0 - 为 Solopreneur 打造的市场机会发现系统</p>
        </div>
      </footer>
    </div>
  );
}
