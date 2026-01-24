import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Target, Microscope, DollarSign, TrendingUp, Users, Globe, 
  Star, Sparkles, ThumbsUp, Hammer, X, Archive, RefreshCw,
  ChevronRight, ExternalLink, Loader2
} from "lucide-react";
import { TopicDetailDialog } from "@/components/TopicDetailDialog";

type RadarType = 'pain_hunter' | 'tech_scout' | 'funding_watch';
type ActionType = 'interesting' | 'build' | 'pass' | 'archive';

interface Topic {
  id: number;
  title: string;
  summary: string | null;
  category: string | null;
  radar: RadarType;
  velocityScore: number | null;
  consensusScore: number | null;
  credibilityScore: number | null;
  fitScore: number | null;
  noveltyScore: number | null;
  trendScore: number | null;
  crossPlatformCount: number | null;
  status: string | null;
  pmAnalysis: string | null;
  techAnalysis: string | null;
  vcAnalysis: string | null;
}

const RADAR_CONFIG = {
  pain_hunter: {
    label: '痛点猎手',
    icon: Target,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  tech_scout: {
    label: '技术侦察',
    icon: Microscope,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  funding_watch: {
    label: '融资监控',
    icon: DollarSign,
    color: 'text-lime-500',
    bgColor: 'bg-lime-500/10',
    borderColor: 'border-lime-500/20',
  },
};

function ScoreBadge({ label, score, icon: Icon }: { label: string; score: number | null; icon: React.ElementType }) {
  const value = score?.toFixed(1) || '0.0';
  const numScore = score || 0;
  
  // Green for >4.0, Yellow for >3.0, Gray for others
  const color = numScore >= 4 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : numScore >= 3 
    ? 'text-yellow-600 dark:text-yellow-400' 
    : 'text-gray-500 dark:text-gray-400';
  
  return (
    <div className="flex items-center gap-1 text-xs">
      <Icon className={`h-3 w-3 ${color}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function TopicCard({ topic, onAction, onViewDetail }: { 
  topic: Topic; 
  onAction: (id: number, action: ActionType) => void;
  onViewDetail: (topic: Topic) => void;
}) {
  const config = RADAR_CONFIG[topic.radar];
  const Icon = config.icon;
  const fitScore = topic.fitScore || 0;
  
  // Fit score badge color
  const fitBadgeColor = fitScore >= 4 
    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
    : fitScore >= 3 
    ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30'
    : 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
  
  return (
    <Card className={`${config.borderColor} border hover:shadow-lg transition-all cursor-pointer rounded-xl bg-card/50 backdrop-blur-sm`}>
      <CardHeader className="pb-2" onClick={() => onViewDetail(topic)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <Badge variant="outline" className="text-xs">
              {topic.category || '未分类'}
            </Badge>
          </div>
          {/* Highlight Solopreneur Fit Score */}
          <Badge className={`text-sm font-bold tabular-nums ${fitBadgeColor}`}>
            {fitScore.toFixed(1)}
          </Badge>
        </div>
        <CardTitle className="text-base font-semibold line-clamp-2 mt-2">
          {topic.title}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {topic.summary || '暂无摘要'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Only show on desktop, hide on mobile */}
        <div className="hidden md:grid grid-cols-2 gap-2 mb-3">
          <ScoreBadge label="加速度" score={topic.velocityScore} icon={TrendingUp} />
          <ScoreBadge label="共识度" score={topic.consensusScore} icon={Users} />
          <ScoreBadge label="可信度" score={topic.credibilityScore} icon={Star} />
          <ScoreBadge label="新颖度" score={topic.noveltyScore} icon={Sparkles} />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>{topic.crossPlatformCount || 1} 个来源</span>
          </div>
          
          <div className="flex gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              onClick={(e) => { e.stopPropagation(); onAction(topic.id, 'interesting'); }}
              title="有趣"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              onClick={(e) => { e.stopPropagation(); onAction(topic.id, 'build'); }}
              title="要做"
            >
              <Hammer className="h-3.5 w-3.5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 text-gray-500 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={(e) => { e.stopPropagation(); onAction(topic.id, 'pass'); }}
              title="跳过"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RadarColumn({ radar, topics, isLoading, onAction, onViewDetail }: {
  radar: RadarType;
  topics: Topic[];
  isLoading: boolean;
  onAction: (id: number, action: ActionType) => void;
  onViewDetail: (topic: Topic) => void;
}) {
  const config = RADAR_CONFIG[radar];
  const Icon = config.icon;
  const newTopics = topics.filter(t => t.status === 'new' || !t.status);
  
  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-2 p-3 rounded-t-lg ${config.bgColor} backdrop-blur-sm`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
        <h2 className="font-semibold">{config.label}</h2>
        <Badge variant="secondary" className="ml-auto">
          {newTopics.length} 新
        </Badge>
      </div>
      
      <ScrollArea className="flex-1 p-2 border border-t-0 rounded-b-lg bg-card/30 backdrop-blur-sm">
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-xl">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-3 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))
          ) : newTopics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无新机会</p>
              <p className="text-xs">点击同步获取最新数据</p>
            </div>
          ) : (
            newTopics.map(topic => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                onAction={onAction}
                onViewDetail={onViewDetail}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function Dashboard() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RadarType>('pain_hunter');
  
  const utils = trpc.useUtils();
  
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: topics, isLoading: topicsLoading } = trpc.topics.list.useQuery({ status: 'new' });
  
  const syncMutation = trpc.sources.sync.useMutation({
    onSuccess: (data) => {
      const totalNew = data.results?.reduce((sum, r) => sum + (r.itemsNew || 0), 0) || 0;
      toast.success(`同步完成，获取 ${totalNew} 条新数据`);
      utils.topics.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`同步失败: ${error.message}`);
    },
  });
  
  const processMutation = trpc.sources.process.useMutation({
    onSuccess: (data) => {
      toast.success(`处理完成: ${data.processed} 条数据，${data.passed} 条通过，${data.topics} 个新主题`);
      utils.topics.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`处理失败: ${error.message}`);
    },
  });
  
  const actionMutation = trpc.topics.action.useMutation({
    onSuccess: () => {
      utils.topics.list.invalidate();
      toast.success('操作成功');
    },
    onError: (error) => {
      toast.error(`操作失败: ${error.message}`);
    },
  });
  
  const handleAction = (id: number, action: ActionType) => {
    actionMutation.mutate({ topicId: id, action });
  };
  
  const handleViewDetail = (topic: Topic) => {
    setSelectedTopic(topic);
    setIsDetailOpen(true);
  };
  
  const allTopics = Array.isArray(topics) ? topics : [];
  const topicsByRadar = {
    pain_hunter: allTopics.filter((t: Topic) => t.radar === 'pain_hunter'),
    tech_scout: allTopics.filter((t: Topic) => t.radar === 'tech_scout'),
    funding_watch: allTopics.filter((t: Topic) => t.radar === 'funding_watch'),
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent">
              AI Market Hunter
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              24小时自动发现市场机会
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              同步数据
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => processMutation.mutate()}
              disabled={processMutation.isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {processMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI 分析
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">新机会</CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums">
                {statsLoading ? '-' : stats?.newTopics || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">总主题</CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums">
                {statsLoading ? '-' : stats?.totalTopics || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">关键词</CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums text-emerald-600">
                {statsLoading ? '-' : stats?.totalKeywords || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">KOLs</CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums text-yellow-600">
                {statsLoading ? '-' : stats?.totalKols || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 h-[calc(100vh-20rem)]">
          <RadarColumn 
            radar="pain_hunter" 
            topics={topicsByRadar.pain_hunter}
            isLoading={topicsLoading}
            onAction={handleAction}
            onViewDetail={handleViewDetail}
          />
          <RadarColumn 
            radar="tech_scout" 
            topics={topicsByRadar.tech_scout}
            isLoading={topicsLoading}
            onAction={handleAction}
            onViewDetail={handleViewDetail}
          />
          <RadarColumn 
            radar="funding_watch" 
            topics={topicsByRadar.funding_watch}
            isLoading={topicsLoading}
            onAction={handleAction}
            onViewDetail={handleViewDetail}
          />
        </div>
        
        {/* Mobile: Tabs */}
        <div className="md:hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RadarType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="pain_hunter" className="text-xs">
                <Target className="h-4 w-4 mr-1" />
                痛点
              </TabsTrigger>
              <TabsTrigger value="tech_scout" className="text-xs">
                <Microscope className="h-4 w-4 mr-1" />
                技术
              </TabsTrigger>
              <TabsTrigger value="funding_watch" className="text-xs">
                <DollarSign className="h-4 w-4 mr-1" />
                融资
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pain_hunter" className="h-[calc(100vh-24rem)] mt-4">
              <RadarColumn 
                radar="pain_hunter" 
                topics={topicsByRadar.pain_hunter}
                isLoading={topicsLoading}
                onAction={handleAction}
                onViewDetail={handleViewDetail}
              />
            </TabsContent>
            
            <TabsContent value="tech_scout" className="h-[calc(100vh-24rem)] mt-4">
              <RadarColumn 
                radar="tech_scout" 
                topics={topicsByRadar.tech_scout}
                isLoading={topicsLoading}
                onAction={handleAction}
                onViewDetail={handleViewDetail}
              />
            </TabsContent>
            
            <TabsContent value="funding_watch" className="h-[calc(100vh-24rem)] mt-4">
              <RadarColumn 
                radar="funding_watch" 
                topics={topicsByRadar.funding_watch}
                isLoading={topicsLoading}
                onAction={handleAction}
                onViewDetail={handleViewDetail}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {selectedTopic && (
        <TopicDetailDialog 
          topic={selectedTopic}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onAction={handleAction}
        />
      )}
    </DashboardLayout>
  );
}
