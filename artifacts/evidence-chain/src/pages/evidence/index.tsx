import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListEvidence, 
  getListEvidenceQueryKey 
} from "@workspace/api-client-react";
import { 
  Search, 
  Plus, 
  Filter, 
  ShieldCheck, 
  ShieldAlert,
  Hash,
  Box,
  Clock,
  MoreVertical,
  Eye,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatHash, formatDate } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-500 hover:bg-green-500/30",
  sealed: "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
  transferred: "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30",
  archived: "bg-muted text-muted-foreground hover:bg-muted/80",
  disputed: "bg-destructive/20 text-destructive hover:bg-destructive/30"
};

export default function EvidenceList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, navigate] = useLocation();
  
  const { data: evidence, isLoading } = useListEvidence(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const filteredEvidence = evidence?.filter(item => 
    search === "" || 
    item.caseId.toLowerCase().includes(search.toLowerCase()) || 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.fileHash.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Vault</h1>
          <p className="text-muted-foreground mt-1">Immutable repository of all registered digital and physical evidence.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/evidence/new">
            <Plus className="mr-2 h-4 w-4" />
            Submit Evidence
          </Link>
        </Button>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Case ID, Title, or Hash..." 
                className="pl-9 bg-black/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-black/20">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sealed">Sealed</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredEvidence && filteredEvidence.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 bg-muted/20">
                    <TableHead className="font-mono text-xs">CASE / TITLE</TableHead>
                    <TableHead className="font-mono text-xs">INTEGRITY</TableHead>
                    <TableHead className="font-mono text-xs">TYPE</TableHead>
                    <TableHead className="font-mono text-xs">STATUS</TableHead>
                    <TableHead className="font-mono text-xs">COLLECTED</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvidence.map((item) => (
                    <TableRow key={item.id} className="border-border/50 hover:bg-muted/10 group cursor-pointer" onClick={() => navigate(`/evidence/${item.id}`)}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-muted-foreground">{item.caseId}</span>
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            {item.isVerified ? (
                              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
                            )}
                            <span className="font-mono text-xs text-muted-foreground flex items-center">
                              <Hash className="h-3 w-3 mr-0.5" />
                              {formatHash(item.fileHash)}
                            </span>
                          </div>
                          {item.blockchainTxHash && (
                            <span className="font-mono text-[10px] text-primary flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Box className="h-2.5 w-2.5 mr-0.5" /> Block #{item.blockNumber || '?'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-secondary/30 text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {item.evidenceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_COLORS[item.status] || ""}>
                          {item.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs">{item.collectedBy}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center font-mono">
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            {formatDate(item.collectedAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/evidence/${item.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" /> View Record
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-4 border border-border">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No Evidence Found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search || statusFilter !== "all" 
                  ? "Try adjusting your search terms or filters." 
                  : "No evidence records have been registered yet."}
              </p>
              {!(search || statusFilter !== "all") && (
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/evidence/new">Register First Evidence</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
