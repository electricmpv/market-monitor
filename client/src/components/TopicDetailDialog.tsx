import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Target, Microscope, DollarSign, TrendingUp, Users, Globe,
  Star, Sparkles, ThumbsUp, Hammer, X, Archive, ExternalLink,
  User, Code, Briefcase, Loader2, Brain
} from "lucide-react";

type ActionType = 'interesting' | 'build' | 'pass' | 'archive';

interface Topic {
  id: number;
  title: string;
  summary: string | null;
  category: string | null;
  radar: string;
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

interface TopicDetailDialogProps {
  topic: Topic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (id: number, action: ActionType) => void;
}

function ScoreBar({ label, score, icon: Icon, color }: { 
  label: string; 
  score: number | null; 
  icon: React.ElementType;
  color: string;
}) {
  const value = score || 0;
  const percentage = (value / 5) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span>{label}</span>
        </div>
        <span className="font-medium">{value.toFixed(1)}/5</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-yellow-500' : 'bg-gray-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function PersonaCard({ 
  title, 
  icon: Icon, 
  color, 
  analysis, 
  isLoading 
}: { 
  title: string; 
  icon: React.ElementType; 
  color: string;
  analysis: string | null;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : analysis ? (
          <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
            <Streamdown>{analysis}</Streamdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            点击"AI 分析"按钮生成分析报告
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function TopicDetailDialog({ topic, open, onOpenChange, onAction }: TopicDetailDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const analyzeMutation = trpc.topics.analyze.useMutation({
    onSuccess: () => {
      toast.success('分析完成');
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast.error(`分析失败: ${error.message}`);
      setIsAnalyzing(false);
    },
  });
  
  const handleAnalyze = () => {
    if (!topic) return;
    setIsAnalyzing(true);
    analyzeMutation.mutate({ id: topic.id });
  };
  
  if (!topic) return null;
  
  const radarLabels: Record<string, string> = {
    pain_hunter: '痛点猎手',
    tech_scout: '技术侦察',
    funding_watch: '融资监控',
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{radarLabels[topic.radar] || topic.radar}</Badge>
            <Badge variant="secondary">{topic.category || '未分类'}</Badge>
            <Badge className="ml-auto">{topic.trendScore?.toFixed(1) || '0.0'} 分</Badge>
          </div>
          <DialogTitle className="text-xl">{topic.title}</DialogTitle>
          <DialogDescription className="text-base">
            {topic.summary || '暂无摘要'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="scores" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scores">五维评分</TabsTrigger>
            <TabsTrigger value="analysis">三人格分析</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scores" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <ScoreBar 
                label="加速度 (Velocity)" 
                score={topic.velocityScore} 
                icon={TrendingUp}
                color="text-orange-500"
              />
              <ScoreBar 
                label="跨平台共识 (Consensus)" 
                score={topic.consensusScore} 
                icon={Globe}
                color="text-blue-500"
              />
              <ScoreBar 
                label="来源可信度 (Credibility)" 
                score={topic.credibilityScore} 
                icon={Star}
                color="text-yellow-500"
              />
              <ScoreBar 
                label="单人可做性 (Fit)" 
                score={topic.fitScore} 
                icon={Target}
                color="text-green-500"
              />
              <ScoreBar 
                label="新颖度 (Novelty)" 
                score={topic.noveltyScore} 
                icon={Sparkles}
                color="text-purple-500"
              />
            </div>
            
            <div className="flex items-center gap-2 pt-4 border-t">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                跨平台来源: {topic.crossPlatformCount || 1} 个
              </span>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4 mt-4">
            <div className="flex justify-end mb-2">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                size="sm"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                AI 分析
              </Button>
            </div>
            
            <div className="grid gap-4">
              <PersonaCard
                title="毒舌产品经理"
                icon={User}
                color="text-red-500"
                analysis={topic.pmAnalysis}
                isLoading={isAnalyzing}
              />
              <PersonaCard
                title="技术大牛"
                icon={Code}
                color="text-blue-500"
                analysis={topic.techAnalysis}
                isLoading={isAnalyzing}
              />
              <PersonaCard
                title="VC 分析师"
                icon={Briefcase}
                color="text-green-500"
                analysis={topic.vcAnalysis}
                isLoading={isAnalyzing}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
              onClick={() => { onAction(topic.id, 'interesting'); onOpenChange(false); }}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              有趣
            </Button>
            <Button 
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => { onAction(topic.id, 'build'); onOpenChange(false); }}
            >
              <Hammer className="h-4 w-4 mr-2" />
              要做
            </Button>
            <Button 
              variant="outline"
              className="text-gray-600 border-gray-200 hover:bg-gray-50"
              onClick={() => { onAction(topic.id, 'pass'); onOpenChange(false); }}
            >
              <X className="h-4 w-4 mr-2" />
              跳过
            </Button>
            <Button 
              variant="outline"
              className="text-gray-500 border-gray-200 hover:bg-gray-50"
              onClick={() => { onAction(topic.id, 'archive'); onOpenChange(false); }}
            >
              <Archive className="h-4 w-4 mr-2" />
              归档
            </Button>
          </div>
          
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
