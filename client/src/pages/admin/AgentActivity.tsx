import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Bot, CheckCircle, XCircle, Clock, RefreshCw, Send, Activity,
  Crown, Building2, ClipboardList, Calendar, DollarSign, 
  Megaphone, Headphones, CreditCard
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TaskEntry {
  taskId: string;
  role: string;
  action: string;
  status: "success" | "failed";
  timestamp: string;
  error?: string;
  isCritical?: boolean;
}

interface AgentStats {
  success: boolean;
  stats: {
    total: number;
    success: number;
    failed: number;
    critical: number;
    byRole?: Record<string, number>;
  };
  recentTasks: TaskEntry[];
  agentStatus: Record<string, string>;
}

const agentDisplayNames: Record<string, string> = {
  leader: "Leader Agent",
  vendorOnboarding: "Vendor Onboarding",
  bookingManager: "Booking Manager",
  calendarSync: "Calendar Sync",
  pricing: "Pricing Engine",
  marketing: "Marketing AI",
  support: "Customer Support",
  finance: "Finance Manager",
  LEADER: "Leader Agent",
  VENDOR_ONBOARDING: "Vendor Onboarding",
  BOOKING_MANAGER: "Booking Manager",
  CALENDAR_SYNC: "Calendar Sync",
  PRICING: "Pricing Engine",
  MARKETING: "Marketing AI",
  SUPPORT: "Customer Support",
  FINANCE: "Finance Manager",
};

const AgentIcon = ({ agentKey }: { agentKey: string }) => {
  const key = agentKey.toLowerCase();
  const iconClass = "h-5 w-5";
  
  switch (key) {
    case "leader":
      return <Crown className={iconClass} />;
    case "vendoronboarding":
    case "vendor_onboarding":
      return <Building2 className={iconClass} />;
    case "bookingmanager":
    case "booking_manager":
      return <ClipboardList className={iconClass} />;
    case "calendarsync":
    case "calendar_sync":
      return <Calendar className={iconClass} />;
    case "pricing":
      return <DollarSign className={iconClass} />;
    case "marketing":
      return <Megaphone className={iconClass} />;
    case "support":
      return <Headphones className={iconClass} />;
    case "finance":
      return <CreditCard className={iconClass} />;
    default:
      return <Bot className={iconClass} />;
  }
};

export default function AgentActivity() {
  const { toast } = useToast();

  const { data, isLoading, refetch, isRefetching } = useQuery<AgentStats>({
    queryKey: ["/api/admin/agent-stats"],
    refetchInterval: 15000,
  });

  const sendSummaryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/agent-summary");
      return res.json();
    },
    onSuccess: (responseData) => {
      if (responseData.sentToTelegram) {
        toast({
          title: "Summary Sent",
          description: "Daily summary has been sent to the admin Telegram.",
        });
      } else {
        toast({
          title: "Summary Generated",
          description: "Summary generated but Telegram not configured.",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agent-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testAgentsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/agent-test");
      return res.json();
    },
    onSuccess: (responseData) => {
      toast({
        title: "Test Messages Sent",
        description: `All ${responseData.agentsTested?.length || 8} agents have reported. Check your Telegram for the critical alert.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agent-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-agent-activity">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats || { total: 0, success: 0, failed: 0, critical: 0 };
  const recentTasks = data?.recentTasks || [];
  const agentStatus = data?.agentStatus || {};

  return (
    <div className="space-y-6 p-6" data-testid="agent-activity-dashboard">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">AI Agent Activity</h1>
          <p className="text-muted-foreground">Monitor the multi-agent system coordinating platform operations</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh-stats"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => testAgentsMutation.mutate()}
            disabled={testAgentsMutation.isPending}
            data-testid="button-test-agents"
          >
            <Bot className="h-4 w-4 mr-2" />
            Test All Agents
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => sendSummaryMutation.mutate()}
            disabled={sendSummaryMutation.isPending}
            data-testid="button-send-summary"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Daily Summary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-total">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold" data-testid="text-total-tasks">{stats.total}</p>
              </div>
              <Activity className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-completed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600" data-testid="text-success-tasks">{stats.success}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-failed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-3xl font-bold text-red-600" data-testid="text-failed-tasks">{stats.failed}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-alerts">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-3xl font-bold text-orange-600" data-testid="text-critical-alerts">{stats.critical}</p>
              </div>
              <Bot className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-agent-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(agentStatus).map(([agentKey, status]) => (
                <div
                  key={agentKey}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  data-testid={`agent-status-${agentKey}`}
                >
                  <div className="flex items-center gap-2">
                    <AgentIcon agentKey={agentKey} />
                    <span className="text-sm font-medium">{agentDisplayNames[agentKey] || agentKey}</span>
                  </div>
                  <Badge variant={status === "active" ? "default" : "secondary"}>
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-tasks">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-tasks">
                  No tasks recorded yet. Agents will report activity here.
                </p>
              ) : (
                recentTasks.map((task, index) => (
                  <div
                    key={task.taskId || index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    data-testid={`task-entry-${index}`}
                  >
                    <div className="mt-0.5">
                      {task.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {agentDisplayNames[task.role] || task.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{task.action}</span>
                        {task.isCritical && (
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        )}
                      </div>
                      {task.error && (
                        <p className="text-sm mt-1 text-red-500 truncate">{task.error}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(task.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-agent-hierarchy">
        <CardHeader>
          <CardTitle>Agent Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="inline-flex flex-col items-center">
              <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 mb-4">
                <p className="text-lg font-bold">Admin</p>
                <p className="text-sm text-muted-foreground">Receives critical alerts via Telegram</p>
              </div>
              <div className="w-0.5 h-6 bg-border" />
              <div className="bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5" />
                  <p className="text-lg font-bold">Leader Agent</p>
                </div>
                <p className="text-sm text-muted-foreground">Coordinates all executor agents</p>
              </div>
              <div className="w-0.5 h-6 bg-border" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["vendorOnboarding", "bookingManager", "pricing", "marketing"].map((agent) => (
                  <div key={agent} className="bg-muted rounded-lg p-3 text-center">
                    <div className="flex justify-center mb-1">
                      <AgentIcon agentKey={agent} />
                    </div>
                    <p className="text-xs font-medium">{agentDisplayNames[agent]}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {["calendarSync", "support", "finance"].map((agent) => (
                  <div key={agent} className="bg-muted rounded-lg p-3 text-center">
                    <div className="flex justify-center mb-1">
                      <AgentIcon agentKey={agent} />
                    </div>
                    <p className="text-xs font-medium">{agentDisplayNames[agent]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
