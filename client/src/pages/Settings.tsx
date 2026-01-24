import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Settings as SettingsIcon, Key, Database, Bell, Brain, Trash2,
  Plus, RefreshCw, Loader2, Check, X, Target, Microscope, DollarSign,
  TrendingUp, Users, Star, Sparkles, Globe, Cpu, Lock
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ============================================================================
// Keywords Tab
// ============================================================================
function KeywordsTab() {
  const [newKeyword, setNewKeyword] = useState("");
  const [newRadar, setNewRadar] = useState<string>("pain_hunter");
  
  const utils = trpc.useUtils();
  const { data: keywords, isLoading } = trpc.keywords.list.useQuery();
  
  const addMutation = trpc.keywords.add.useMutation({
    onSuccess: () => {
      toast.success("关键词添加成功");
      setNewKeyword("");
      utils.keywords.list.invalidate();
    },
    onError: (error) => toast.error(`添加失败: ${error.message}`),
  });
  
  const deleteMutation = trpc.keywords.delete.useMutation({
    onSuccess: () => {
      toast.success("关键词已删除");
      utils.keywords.list.invalidate();
    },
    onError: (error) => toast.error(`删除失败: ${error.message}`),
  });
  
  const handleAdd = () => {
    if (!newKeyword.trim()) return;
    addMutation.mutate({
      keyword: newKeyword.trim(),
      radar: newRadar as any,
    });
  };
  
  const radarLabels: Record<string, { label: string; color: string }> = {
    pain_hunter: { label: "痛点猎手", color: "bg-red-100 text-red-700" },
    tech_scout: { label: "技术侦察", color: "bg-blue-100 text-blue-700" },
    funding_watch: { label: "融资监控", color: "bg-green-100 text-green-700" },
  };
  
  return (
    <div className="space-y-6">
      {/* Add New Keyword */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">添加关键词</CardTitle>
          <CardDescription>添加新的监控关键词</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="输入关键词..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1"
            />
            <Select value={newRadar} onValueChange={setNewRadar}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pain_hunter">痛点猎手</SelectItem>
                <SelectItem value="tech_scout">技术侦察</SelectItem>
                <SelectItem value="funding_watch">融资监控</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Keywords List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">关键词列表</CardTitle>
          <CardDescription>共 {keywords?.length || 0} 个关键词</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {keywords?.map((kw) => (
                  <div key={kw.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Badge className={radarLabels[kw.radar]?.color || ""}>
                        {radarLabels[kw.radar]?.label || kw.radar}
                      </Badge>
                      <span className="font-medium">{kw.keyword}</span>
                      {kw.category && (
                        <Badge variant="outline" className="text-xs">
                          {kw.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        权重: {kw.weight?.toFixed(1) || "1.0"}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除?</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除关键词 "{kw.keyword}" 吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate({ id: kw.id })}>
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// KOLs Tab
// ============================================================================
function KolsTab() {
  const [newHandle, setNewHandle] = useState("");
  const [newPlatform, setNewPlatform] = useState<string>("twitter");
  const [newName, setNewName] = useState("");
  
  const utils = trpc.useUtils();
  const { data: kols, isLoading } = trpc.kols.list.useQuery();
  
  const addMutation = trpc.kols.add.useMutation({
    onSuccess: () => {
      toast.success("KOL 添加成功");
      setNewHandle("");
      setNewName("");
      utils.kols.list.invalidate();
    },
    onError: (error) => toast.error(`添加失败: ${error.message}`),
  });
  
  const deleteMutation = trpc.kols.delete.useMutation({
    onSuccess: () => {
      toast.success("KOL 已删除");
      utils.kols.list.invalidate();
    },
    onError: (error) => toast.error(`删除失败: ${error.message}`),
  });
  
  const handleAdd = () => {
    if (!newHandle.trim()) return;
    addMutation.mutate({
      handle: newHandle.trim(),
      platform: newPlatform as any,
      name: newName.trim() || undefined,
    });
  };
  
  const platformLabels: Record<string, { label: string; color: string }> = {
    twitter: { label: "Twitter", color: "bg-sky-100 text-sky-700" },
    github: { label: "GitHub", color: "bg-gray-100 text-gray-700" },
    reddit: { label: "Reddit", color: "bg-orange-100 text-orange-700" },
    hackernews: { label: "HN", color: "bg-amber-100 text-amber-700" },
  };
  
  return (
    <div className="space-y-6">
      {/* Add New KOL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">添加 KOL</CardTitle>
          <CardDescription>添加新的关注账号</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="用户名/Handle..."
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="显示名称 (可选)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Select value={newPlatform} onValueChange={setNewPlatform}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
                <SelectItem value="hackernews">HN</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* KOLs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">KOL 列表</CardTitle>
          <CardDescription>共 {kols?.length || 0} 个关注账号</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {kols?.map((kol) => (
                  <div key={kol.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Badge className={platformLabels[kol.platform]?.color || ""}>
                        {platformLabels[kol.platform]?.label || kol.platform}
                      </Badge>
                      <span className="font-medium">@{kol.handle}</span>
                      {kol.name && (
                        <span className="text-sm text-muted-foreground">
                          ({kol.name})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        权重: {kol.weight?.toFixed(1) || "1.0"}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除?</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除 KOL "@{kol.handle}" 吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate({ id: kol.id })}>
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Data Sources Tab
// ============================================================================
function SourcesTab() {
  const utils = trpc.useUtils();
  const { data: sources, isLoading } = trpc.sources.list.useQuery();
  
  const toggleMutation = trpc.sources.toggle.useMutation({
    onSuccess: () => {
      toast.success("数据源状态已更新");
      utils.sources.list.invalidate();
    },
    onError: (error) => toast.error(`更新失败: ${error.message}`),
  });
  
  const sourceLabels: Record<string, { label: string; description: string }> = {
    hackernews: { label: "Hacker News", description: "科技新闻和讨论" },
    github: { label: "GitHub", description: "开源项目和趋势" },
    reddit: { label: "Reddit", description: "社区讨论" },
    producthunt: { label: "Product Hunt", description: "新产品发布" },
    huggingface: { label: "Hugging Face", description: "AI 论文和模型" },
    ycombinator: { label: "Y Combinator", description: "创业公司动态" },
    twitter: { label: "Twitter", description: "社交媒体 (需要 API)" },
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">数据源配置</CardTitle>
        <CardDescription>启用或禁用数据源</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(sourceLabels).map(([key, { label, description }]) => {
              const source = sources?.find((s) => s.source === key);
              return (
                <div key={key} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                    {source?.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        上次同步: {new Date(source.lastSyncAt).toLocaleString("zh-CN")}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={source?.enabled ?? false}
                    onCheckedChange={(enabled) =>
                      toggleMutation.mutate({ source: key as any, enabled })
                    }
                    disabled={toggleMutation.isPending}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Learning Tab
// ============================================================================
function LearningTab() {
  const utils = trpc.useUtils();
  const { data: weights, isLoading } = trpc.learning.weights.useQuery();
  
  const updateMutation = trpc.learning.updateWeights.useMutation({
    onSuccess: () => {
      toast.success("学习设置已更新");
      utils.learning.weights.invalidate();
    },
    onError: (error) => toast.error(`更新失败: ${error.message}`),
  });
  
  const [localWeights, setLocalWeights] = useState({
    velocityWeight: 0.25,
    consensusWeight: 0.20,
    credibilityWeight: 0.15,
    fitWeight: 0.25,
    noveltyWeight: 0.15,
  });
  
  const handleWeightChange = (key: string, value: number) => {
    setLocalWeights((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleSave = () => {
    updateMutation.mutate(localWeights);
  };
  
  const weightLabels = [
    { key: "velocityWeight", label: "加速度权重", icon: TrendingUp, color: "text-orange-500" },
    { key: "consensusWeight", label: "共识度权重", icon: Globe, color: "text-blue-500" },
    { key: "credibilityWeight", label: "可信度权重", icon: Star, color: "text-yellow-500" },
    { key: "fitWeight", label: "适合度权重", icon: Target, color: "text-green-500" },
    { key: "noveltyWeight", label: "新颖度权重", icon: Sparkles, color: "text-purple-500" },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">五维权重配置</CardTitle>
          <CardDescription>调整各维度在总分中的权重</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {weightLabels.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <Label>{label}</Label>
                </div>
                <span className="text-sm font-medium">
                  {((localWeights as any)[key] * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[(localWeights as any)[key] * 100]}
                onValueChange={([v]) => handleWeightChange(key, v / 100)}
                min={5}
                max={50}
                step={5}
              />
            </div>
          ))}
          
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            保存权重设置
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">学习速度</CardTitle>
          <CardDescription>控制系统学习你偏好的速度</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={weights?.learningSpeed || "normal"}
            onValueChange={(value) =>
              updateMutation.mutate({ learningSpeed: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">慢速 - 保守学习</SelectItem>
              <SelectItem value="normal">正常 - 平衡学习</SelectItem>
              <SelectItem value="fast">快速 - 激进学习</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">自动学习</CardTitle>
          <CardDescription>根据你的操作自动调整权重</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">启用自动学习</p>
              <p className="text-sm text-muted-foreground">
                系统会根据你的"要做"和"跳过"操作自动调整权重
              </p>
            </div>
            <Switch
              checked={weights?.autoLearn ?? true}
              onCheckedChange={(autoLearn) =>
                updateMutation.mutate({ autoLearn })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Push Tab
// ============================================================================
function PushTab() {
  const [token, setToken] = useState("");
  const [pushTime, setPushTime] = useState("08:30");
  
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.push.config.useQuery();
  
  const updateMutation = trpc.push.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("推送设置已更新");
      setToken("");
      utils.push.config.invalidate();
    },
    onError: (error) => toast.error(`更新失败: ${error.message}`),
  });
  
  const testMutation = trpc.push.sendDigest.useMutation({
    onSuccess: () => toast.success("测试推送已发送"),
    onError: (error) => toast.error(`推送失败: ${error.message}`),
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">PushPlus 配置</CardTitle>
          <CardDescription>
            配置微信推送。获取 Token: 
            <a href="https://www.pushplus.plus" target="_blank" rel="noopener noreferrer" className="text-primary ml-1">
              pushplus.plus
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>PushPlus Token</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder={config?.token ? "已配置 (****" + config.token.slice(-4) + ")" : "输入 Token..."}
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Button
                onClick={() => updateMutation.mutate({ token })}
                disabled={!token || updateMutation.isPending}
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>推送时间</Label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={pushTime}
                onChange={(e) => setPushTime(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => updateMutation.mutate({ pushTime })}
                disabled={updateMutation.isPending}
              >
                设置
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              当前设置: {config?.pushTime || "08:30"}
            </p>
          </div>
          
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={!config?.enabled || testMutation.isPending}
              className="w-full"
            >
              {testMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              发送测试推送
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">推送状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>推送状态</span>
              <Badge variant={config?.enabled ? "default" : "secondary"}>
                {config?.enabled ? "已启用" : "未配置"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>上次推送</span>
              <span className="text-sm text-muted-foreground">
                {config?.lastPushTime
                  ? new Date(config.lastPushTime).toLocaleString("zh-CN")
                  : "从未推送"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Models Tab (LLM Configuration)
// ============================================================================
function ModelsTab() {
  const [searchConfig, setSearchConfig] = useState({
    provider: "gemini",
    baseUrl: "https://forge.manus.im",
    apiKey: "",
    model: "gemini-2.5-flash",
  });
  
  const [reportConfig, setReportConfig] = useState({
    provider: "gemini",
    baseUrl: "https://forge.manus.im",
    apiKey: "",
    model: "gemini-2.0-pro",
  });
  
  const utils = trpc.useUtils();
  
  const saveSearchMutation = trpc.settings.saveLLMConfig.useMutation({
    onSuccess: () => toast.success("搜索引擎配置已保存"),
    onError: (error) => toast.error(`保存失败: ${error.message}`),
  });
  
  const saveReportMutation = trpc.settings.saveLLMConfig.useMutation({
    onSuccess: () => toast.success("报告引擎配置已保存"),
    onError: (error) => toast.error(`保存失败: ${error.message}`),
  });
  
  const testSearchMutation = trpc.settings.testLLMConfig.useMutation({
    onSuccess: () => toast.success("搜索引擎连接测试成功"),
    onError: (error) => toast.error(`测试失败: ${error.message}`),
  });
  
  const testReportMutation = trpc.settings.testLLMConfig.useMutation({
    onSuccess: () => toast.success("报告引擎连接测试成功"),
    onError: (error) => toast.error(`测试失败: ${error.message}`),
  });
  
  return (
    <div className="space-y-6">
      {/* Search Engine (Fast) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            搜索引擎 (快速)
          </CardTitle>
          <CardDescription>
            用于快速过滤和语义分析，推荐使用 Gemini Flash 或 DeepSeek
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>提供商</Label>
            <Select
              value={searchConfig.provider}
              onValueChange={(v) => setSearchConfig({ ...searchConfig, provider: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini (Google)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              placeholder="https://api.openai.com"
              value={searchConfig.baseUrl}
              onChange={(e) => setSearchConfig({ ...searchConfig, baseUrl: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={searchConfig.apiKey}
              onChange={(e) => setSearchConfig({ ...searchConfig, apiKey: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>模型名称</Label>
            <Input
              placeholder="gemini-2.5-flash"
              value={searchConfig.model}
              onChange={(e) => setSearchConfig({ ...searchConfig, model: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => testSearchMutation.mutate({ usageType: "search", config: searchConfig })}
              disabled={testSearchMutation.isPending}
              className="flex-1"
            >
              {testSearchMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              测试连接
            </Button>
            <Button
              onClick={() => saveSearchMutation.mutate({ usageType: "search", config: searchConfig })}
              disabled={saveSearchMutation.isPending}
              className="flex-1"
            >
              {saveSearchMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              保存配置
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Report Engine (Smart) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            报告引擎 (深度)
          </CardTitle>
          <CardDescription>
            用于深度分析和报告生成，推荐使用 Gemini Pro 或 Claude
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>提供商</Label>
            <Select
              value={reportConfig.provider}
              onValueChange={(v) => setReportConfig({ ...reportConfig, provider: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini (Google)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              placeholder="https://api.openai.com"
              value={reportConfig.baseUrl}
              onChange={(e) => setReportConfig({ ...reportConfig, baseUrl: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={reportConfig.apiKey}
              onChange={(e) => setReportConfig({ ...reportConfig, apiKey: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>模型名称</Label>
            <Input
              placeholder="gemini-2.0-pro"
              value={reportConfig.model}
              onChange={(e) => setReportConfig({ ...reportConfig, model: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => testReportMutation.mutate({ usageType: "report", config: reportConfig })}
              disabled={testReportMutation.isPending}
              className="flex-1"
            >
              {testReportMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              测试连接
            </Button>
            <Button
              onClick={() => saveReportMutation.mutate({ usageType: "report", config: reportConfig })}
              disabled={saveReportMutation.isPending}
              className="flex-1"
            >
              {saveReportMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              保存配置
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Twitter Cookies Tab
// ============================================================================
function TwitterTab() {
  const [cookies, setCookies] = useState("");
  
  const saveMutation = trpc.settings.saveTwitterCookies.useMutation({
    onSuccess: () => toast.success("Twitter Cookies 已保存"),
    onError: (error) => toast.error(`保存失败: ${error.message}`),
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Twitter Cookies (BYOC)
        </CardTitle>
        <CardDescription>
          使用你自己的 Twitter Cookies 抓取 KOL 推文
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Cookies (JSON 格式)</Label>
          <Textarea
            placeholder={`{
  "auth_token": "your_auth_token",
  "ct0": "your_csrf_token",
  "guest_id": "your_guest_id"
}`}
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            💡 使用 <a href="https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg" target="_blank" rel="noopener noreferrer" className="underline">EditThisCookie</a> 插件导出 Cookies，然后粘贴到这里
          </p>
        </div>
        
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ 注意：请勿分享你的 Cookies，它们相当于你的账号密码
          </p>
        </div>
        
        <Button
          onClick={() => saveMutation.mutate({ cookies })}
          disabled={saveMutation.isPending || !cookies.trim()}
          className="w-full"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          保存 Cookies
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Seed Tab
// ============================================================================
function SeedTab() {
  const utils = trpc.useUtils();
  const { data: summary } = trpc.settings.seedSummary.useQuery();
  
  const seedMutation = trpc.settings.seed.useMutation({
    onSuccess: (data) => {
      toast.success(`初始化完成: 添加 ${data.keywordsAdded} 个关键词, ${data.kolsAdded} 个 KOL`);
      utils.keywords.list.invalidate();
      utils.kols.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => toast.error(`初始化失败: ${error.message}`),
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">初始化种子数据</CardTitle>
        <CardDescription>
          导入预设的高信噪比关键词和 KOL 列表
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-2xl font-bold">{summary.totalKeywords}</p>
              <p className="text-sm text-muted-foreground">预设关键词</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.totalKols}</p>
              <p className="text-sm text-muted-foreground">预设 KOL</p>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-sm font-medium">包含的 Track:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Track 1: Web3 KOL 触达 CRM</li>
            <li>• Track 2: Web3 退场风险预警</li>
            <li>• Track 3: 装修视觉质检</li>
            <li>• Bonus: AI 前沿信号</li>
          </ul>
        </div>
        
        <Button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          className="w-full"
        >
          {seedMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          导入种子数据
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Settings Page
// ============================================================================
export default function Settings() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            系统设置
          </h1>
          <p className="text-muted-foreground">配置监控关键词、KOL、数据源和推送</p>
        </div>
        
        <Tabs defaultValue="keywords" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="keywords">关键词</TabsTrigger>
            <TabsTrigger value="kols">KOL</TabsTrigger>
            <TabsTrigger value="sources">数据源</TabsTrigger>
            <TabsTrigger value="models">模型</TabsTrigger>
            <TabsTrigger value="twitter">Twitter</TabsTrigger>
            <TabsTrigger value="learning">学习</TabsTrigger>
            <TabsTrigger value="push">推送</TabsTrigger>
            <TabsTrigger value="seed">初始化</TabsTrigger>
          </TabsList>
          
          <TabsContent value="keywords">
            <KeywordsTab />
          </TabsContent>
          
          <TabsContent value="kols">
            <KolsTab />
          </TabsContent>
          
          <TabsContent value="sources">
            <SourcesTab />
          </TabsContent>
          
          <TabsContent value="models">
            <ModelsTab />
          </TabsContent>
          
          <TabsContent value="twitter">
            <TwitterTab />
          </TabsContent>
          
          <TabsContent value="learning">
            <LearningTab />
          </TabsContent>
          
          <TabsContent value="push">
            <PushTab />
          </TabsContent>
          
          <TabsContent value="seed">
            <SeedTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
