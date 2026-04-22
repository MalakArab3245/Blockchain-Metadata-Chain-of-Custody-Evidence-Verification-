import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListCustodyTransactions, 
  getListCustodyTransactionsQueryKey 
} from "@workspace/api-client-react";
import { 
  Activity, 
  Filter, 
  Box, 
  Clock, 
  ArrowRight, 
  Hash,
  User,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHash, formatDate } from "@/lib/format";

const ACTION_COLORS: Record<string, string> = {
  collected: "bg-primary/20 text-primary border-primary/30",
  accessed: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  transferred: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  sealed: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  analyzed: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
  submitted_to_court: "bg-green-500/20 text-green-500 border-green-500/30",
  returned: "bg-orange-500/20 text-orange-500 border-orange-500/30",
  duplicated: "bg-pink-500/20 text-pink-500 border-pink-500/30",
};

export default function CustodyLog() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  
  const { data: logs, isLoading } = useListCustodyTransactions();

  const filteredLogs = logs?.filter(log => 
    actionFilter === "all" || log.action === actionFilter
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custody Ledger</h1>
          <p className="text-muted-foreground mt-1">Immutable master log of all chain-of-custody events across all cases.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px] bg-black/20">
              <SelectValue placeholder="Filter by Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="collected">Collected</SelectItem>
              <SelectItem value="accessed">Accessed</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
              <SelectItem value="analyzed">Analyzed</SelectItem>
              <SelectItem value="sealed">Sealed</SelectItem>
              <SelectItem value="submitted_to_court">Submitted to Court</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Transaction Master Log
          </CardTitle>
          <CardDescription>
            All records are cryptographically secured and immutable.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="divide-y divide-border/50">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 md:p-6 hover:bg-muted/5 transition-colors flex flex-col md:flex-row gap-4 md:gap-6 group">
                  {/* Left: Time & Block */}
                  <div className="flex flex-col gap-1 md:w-48 shrink-0">
                    <span className="font-mono text-sm font-bold text-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(log.performedAt).split(' ')[0]}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground ml-5.5">
                      {formatDate(log.performedAt).split(' ')[1]}
                    </span>
                    {log.blockNumber && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary w-fit">
                        <Box className="h-3 w-3" />
                        <span className="font-mono text-[10px] font-bold">#{log.blockNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Core Data */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`font-mono uppercase text-xs ${ACTION_COLORS[log.action] || ""}`}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm font-medium">
                        Evidence: <Link href={`/evidence/${log.evidenceId}`} className="text-primary hover:underline">{log.evidenceTitle || `ID #${log.evidenceId}`}</Link>
                      </span>
                      {log.caseId && (
                        <span className="text-xs text-muted-foreground font-mono bg-black/20 px-2 py-0.5 rounded">
                          Case: {log.caseId}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 p-3 rounded border border-border/30">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase">Performed By</span>
                          <span className="text-sm font-medium">{log.performedBy}</span>
                        </div>
                      </div>
                      
                      {log.ipAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase">Location / IP</span>
                            <span className="text-sm font-mono">{log.ipAddress}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {log.notes && (
                      <p className="text-sm text-muted-foreground border-l-2 border-border pl-3 ml-1 italic">
                        "{log.notes}"
                      </p>
                    )}
                  </div>

                  {/* Right: Hash */}
                  <div className="md:w-64 shrink-0 flex flex-col justify-center gap-2 bg-black/40 p-3 rounded border border-border/20 self-start md:self-stretch">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono flex items-center gap-1 mb-1">
                        <Hash className="h-3 w-3" /> Tx Hash Signature
                      </span>
                      <span className="text-xs font-mono text-foreground break-all" title={log.txHash}>
                        {formatHash(log.txHash)}
                      </span>
                    </div>
                    
                    {log.previousHash && (
                      <div className="flex flex-col border-t border-border/30 pt-2 mt-1">
                        <span className="text-[9px] text-muted-foreground uppercase font-mono mb-1">
                          Previous Link
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground break-all" title={log.previousHash}>
                          {formatHash(log.previousHash)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-4 border border-border">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No Transactions Found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {actionFilter !== "all" 
                  ? "No events match the selected filter." 
                  : "The custody ledger is currently empty."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
