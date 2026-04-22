import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Files, 
  Activity, 
  Clock, 
  Box, 
  AlertTriangle,
  ArrowRight,
  Database
} from "lucide-react";
import { 
  useGetDashboardStats, 
  useGetRecentActivity,
  useHealthCheck 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatDate, formatHash } from "@/lib/format";

const COLORS = [
  "hsl(190 90% 50%)", 
  "hsl(260 70% 60%)", 
  "hsl(140 70% 50%)", 
  "hsl(40 90% 60%)", 
  "hsl(330 70% 60%)",
  "hsl(210 20% 60%)"
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: health } = useHealthCheck();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (statsLoading || activityLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time overview of the evidence ledger and custody chains.</p>
        </div>
        <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-lg border border-border">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Network Status</span>
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {health?.status === "ok" ? "HEALTHY" : "DEGRADED"}
            </span>
          </div>
          <div className="w-px h-8 bg-border mx-2"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Total Blocks</span>
            <span className="text-xs font-mono font-bold text-foreground">
              {stats?.totalTransactions?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Evidence</CardTitle>
              <Files className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-foreground">{stats?.totalEvidence?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">Across {stats?.totalCases?.toLocaleString()} cases</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chain Integrity</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-green-500">{(stats?.integrityRate || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">Cryptographically verified</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-orange-500">{stats?.pendingEvidence?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">Requires verification</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Custody Events</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-blue-500">{stats?.totalTransactions?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">Immutable records</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50 flex flex-col">
          <CardHeader>
            <CardTitle>Evidence Distribution</CardTitle>
            <CardDescription>Breakdown by evidence type and status</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[300px]">
            <div className="h-full flex flex-col">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 text-center">By Type</h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.evidenceByType || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="label"
                    >
                      {stats?.evidenceByType?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="h-full flex flex-col">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 text-center">By Status</h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.evidenceByStatus || []}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest custody transactions</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="h-8">
              <Link href="/custody">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-auto px-6 pb-6">
              {activity && activity.length > 0 ? (
                activity.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="py-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] bg-secondary/30">
                          {tx.action}
                        </Badge>
                        <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                          {tx.evidenceTitle}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(tx.performedAt).split(' ')[1]}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        By: <span className="font-medium text-foreground">{tx.performedBy}</span>
                      </span>
                      <Link href={`/evidence/${tx.evidenceId}`} className="text-primary hover:underline flex items-center gap-1 group">
                        View <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    
                    <div className="bg-black/30 rounded p-2 text-[10px] font-mono text-muted-foreground flex items-center justify-between border border-border/30">
                      <span className="truncate mr-2">TX: {formatHash(tx.txHash)}</span>
                      {tx.blockNumber && <span className="text-primary whitespace-nowrap flex items-center gap-1"><Box className="h-3 w-3" /> #{tx.blockNumber}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No recent activity recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
