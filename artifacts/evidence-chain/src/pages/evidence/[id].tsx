import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  useGetEvidence, 
  useGetEvidenceCustody, 
  useAddCustodyTransaction, 
  useVerifyEvidence,
  useGetEvidenceCertificate,
  useUpdateEvidence,
  getGetEvidenceQueryKey,
  getGetEvidenceCustodyQueryKey,
  getGetEvidenceCertificateQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, ShieldCheck, ShieldAlert, Shield, CheckCircle2, 
  Hash, Box, Clock, User, MapPin, Database, FileText, Download,
  Activity, AlertTriangle, Link as LinkIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatHash, formatDate, formatBytes } from "@/lib/format";

const custodyFormSchema = z.object({
  action: z.string().min(1, "Action is required"),
  performedBy: z.string().min(1, "Officer/Agent name is required"),
  notes: z.string().optional(),
  ipAddress: z.string().optional(),
});

type CustodyFormValues = z.infer<typeof custodyFormSchema>;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-500 border-green-500/30",
  sealed: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  transferred: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  archived: "bg-muted text-muted-foreground border-border",
  disputed: "bg-destructive/20 text-destructive border-destructive/30"
};

const ACTION_COLORS: Record<string, string> = {
  accessed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  transferred: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  analyzed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  sealed: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  logged: "bg-green-500/20 text-green-400 border-green-500/30",
  updated: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  submitted: "bg-green-500/20 text-green-400 border-green-500/30",
  verified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  flagged: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function EvidenceDetail() {
  const [, params] = useRoute("/evidence/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("overview");

  const { data: evidence, isLoading: evidenceLoading } = useGetEvidence(id);
  const { data: custody, isLoading: custodyLoading } = useGetEvidenceCustody(id);
  
  // Conditionally fetch verification and certificate only when respective tabs are open or buttons clicked
  const verifyMutation = useVerifyEvidence();
  const { data: certificate, isLoading: certLoading, refetch: fetchCert } = useGetEvidenceCertificate(id, {
    query: { enabled: false, queryKey: getGetEvidenceCertificateQueryKey(id) }
  });
  
  const updateMutation = useUpdateEvidence();
  const addCustodyMutation = useAddCustodyTransaction();

  const form = useForm<CustodyFormValues>({
    resolver: zodResolver(custodyFormSchema),
    defaultValues: {
      action: "",
      performedBy: "",
      notes: "",
      ipAddress: "192.168.1.45 (Local Node)",
    },
  });

  const onCustodySubmit = (data: CustodyFormValues) => {
    addCustodyMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEvidenceCustodyQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetEvidenceQueryKey(id) });
          toast({
            title: "Custody Transaction Logged",
            description: "Event has been secured on the blockchain ledger.",
          });
          form.reset({ ...form.getValues(), notes: "", action: "" });
        },
        onError: (error) => {
          toast({
            title: "Transaction Failed",
            description: error?.data?.error || error?.message || "Could not log transaction",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleVerify = () => {
    verifyMutation.mutate({ id }, {
      onSuccess: (result) => {
        toast({
          title: result.isValid ? "Integrity Verified" : "Verification Failed",
          description: result.message,
          variant: result.isValid ? "default" : "destructive",
        });
      }
    });
  };

  const handleUpdateStatus = (newStatus: string) => {
    updateMutation.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetEvidenceQueryKey(id), updated);
          toast({
            title: "Status Updated",
            description: `Evidence status changed to ${newStatus}.`,
          });
        }
      }
    );
  };

  const loadCertificate = () => {
    fetchCert();
    setActiveTab("certificate");
  };

  if (evidenceLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="p-6 text-center mt-20">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Record Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested evidence record does not exist or you lack clearance.</p>
        <Button asChild className="mt-6">
          <Link href="/evidence">Return to Vault</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild className="h-8 w-8 rounded-full">
              <Link href="/evidence"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Badge variant="outline" className="font-mono bg-black/40 text-xs">
              ID: {evidence.id}
            </Badge>
            <Badge variant="outline" className={`font-mono uppercase text-xs border ${STATUS_COLORS[evidence.status]}`}>
              {evidence.status}
            </Badge>
            {evidence.isVerified ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1 font-mono text-xs">
                <CheckCircle2 className="h-3 w-3" /> VERIFIED
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 flex items-center gap-1 font-mono text-xs">
                <AlertTriangle className="h-3 w-3" /> UNVERIFIED
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{evidence.title}</h1>
          <p className="text-muted-foreground font-mono flex items-center gap-2 text-sm">
            Case: <span className="font-bold text-foreground bg-black/20 px-2 py-0.5 rounded">{evidence.caseId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={evidence.status} onValueChange={handleUpdateStatus} disabled={updateMutation.isPending}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="sealed">Sealed</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="h-9 font-mono" onClick={handleVerify} disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Verify Integrity
          </Button>
          
          <Button className="h-9 font-mono" onClick={loadCertificate}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Certificate
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-border/50 h-12 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono text-xs tracking-wider">RECORD OVERVIEW</TabsTrigger>
          <TabsTrigger value="custody" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono text-xs tracking-wider">CHAIN OF CUSTODY</TabsTrigger>
          <TabsTrigger value="certificate" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono text-xs tracking-wider">LEGAL CERTIFICATE</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Cryptographic Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono text-muted-foreground uppercase">SHA-256 Evidence Hash</Label>
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded border border-border/50">
                      <span className="font-mono text-sm text-primary break-all">{evidence.fileHash}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-muted-foreground uppercase">Blockchain TX Hash</Label>
                      <div className="bg-black/40 p-3 rounded border border-border/50 h-10 flex items-center">
                        <span className="font-mono text-xs text-muted-foreground truncate" title={evidence.blockchainTxHash || "Pending Confirmation"}>
                          {evidence.blockchainTxHash || "Awaiting Network Confirmation..."}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-muted-foreground uppercase">Block Height</Label>
                      <div className="bg-black/40 p-3 rounded border border-border/50 h-10 flex items-center">
                        <span className="font-mono text-sm font-bold">
                          {evidence.blockNumber ? `#${evidence.blockNumber}` : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Metadata Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="space-y-1 border-b border-border/30 pb-3">
                      <dt className="text-xs font-mono text-muted-foreground uppercase">Evidence Type</dt>
                      <dd className="font-medium">{evidence.evidenceType}</dd>
                    </div>
                    <div className="space-y-1 border-b border-border/30 pb-3">
                      <dt className="text-xs font-mono text-muted-foreground uppercase">Collection Date</dt>
                      <dd className="font-medium">{formatDate(evidence.collectedAt)}</dd>
                    </div>
                    <div className="space-y-1 border-b border-border/30 pb-3">
                      <dt className="text-xs font-mono text-muted-foreground uppercase">Collected By</dt>
                      <dd className="font-medium">{evidence.collectedBy}</dd>
                    </div>
                    <div className="space-y-1 border-b border-border/30 pb-3">
                      <dt className="text-xs font-mono text-muted-foreground uppercase">Location / GPS</dt>
                      <dd className="font-medium">{evidence.locationData || "Not specified"}</dd>
                    </div>
                    <div className="space-y-1 sm:col-span-2 border-b border-border/30 pb-3">
                      <dt className="text-xs font-mono text-muted-foreground uppercase">Description & Notes</dt>
                      <dd className="font-medium mt-1 leading-relaxed text-muted-foreground">
                        {evidence.description || "No additional description provided."}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-mono text-muted-foreground uppercase">File Size</dt>
                      <dd className="font-medium font-mono">{formatBytes(evidence.fileSize)}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-mono text-muted-foreground uppercase">MIME Type</dt>
                      <dd className="font-medium font-mono">{evidence.mimeType || "Unknown"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center border-2 ${evidence.isVerified ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-orange-500/10 border-orange-500/30 text-orange-500'}`}>
                    {evidence.isVerified ? <ShieldCheck className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${evidence.isVerified ? 'text-green-500' : 'text-orange-500'}`}>
                      {evidence.isVerified ? 'Integrity Intact' : 'Pending Verification'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {evidence.isVerified 
                        ? 'Cryptographic match verified against blockchain ledger.' 
                        : 'Run verification check to ensure data integrity.'}
                    </p>
                  </div>
                  {verifyMutation.data && (
                    <div className="w-full text-left bg-black/40 p-3 rounded text-xs font-mono text-muted-foreground space-y-1">
                      <p>Last checked: {formatDate(verifyMutation.data.timestamp)}</p>
                      <p className="truncate">Block: #{verifyMutation.data.blockNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                  <CardTitle className="text-sm">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="h-4 w-4" /> Custody Events</span>
                      <span className="font-bold font-mono">{custody?.length || 0}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2"><Box className="h-4 w-4" /> Registration</span>
                      <span className="font-bold font-mono">{formatDate(evidence.createdAt).split(' ')[0]}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Last Update</span>
                      <span className="font-bold font-mono">{formatDate(evidence.updatedAt).split(' ')[0]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="custody" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    Immutable Chain Log
                  </CardTitle>
                  <CardDescription>Chronological sequence of all interactions with this evidence.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {custodyLoading ? (
                    <div className="p-6 space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : custody && custody.length > 0 ? (
                    <div className="relative p-6">
                      {/* Timeline line */}
                      <div className="absolute left-10 top-8 bottom-8 w-px bg-border/50 hidden md:block"></div>
                      
                      <div className="space-y-8 relative">
                        {custody.map((log, index) => (
                          <div key={log.id} className="flex gap-4 md:gap-6 relative">
                            {/* Timeline dot */}
                            <div className="hidden md:flex flex-col items-center mt-1 z-10">
                              <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-background"></div>
                            </div>
                            
                            <div className="flex-1 bg-black/20 rounded-lg border border-border/50 p-4 space-y-3">
                              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/30 pb-3">
                                <div>
                                  <Badge variant="outline" className={`font-mono uppercase text-[10px] mb-2 ${ACTION_COLORS[log.action] || ""}`}>
                                    {log.action.replace(/_/g, ' ')}
                                  </Badge>
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium text-foreground">{log.performedBy}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono text-muted-foreground flex items-center justify-end gap-1 mb-1">
                                    <Clock className="h-3 w-3" /> {formatDate(log.performedAt)}
                                  </div>
                                  {log.blockNumber && (
                                    <div className="text-[10px] font-mono text-primary flex items-center justify-end gap-1">
                                      <Box className="h-3 w-3" /> Block #{log.blockNumber}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {log.notes && (
                                <p className="text-sm text-muted-foreground bg-black/30 p-2 rounded">
                                  {log.notes}
                                </p>
                              )}
                              
                              <div className="pt-2">
                                <span className="text-[9px] uppercase font-mono text-muted-foreground tracking-widest block mb-1">Transaction Signature</span>
                                <span className="text-[10px] font-mono text-muted-foreground break-all bg-black/40 p-1.5 rounded block border border-border/30">
                                  {log.txHash}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-muted-foreground">
                      No custody transactions logged yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Add Transaction Form */}
            <div>
              <Card className="bg-card/50 backdrop-blur border-border/50 sticky top-20">
                <CardHeader className="border-b border-border/50 bg-muted/10">
                  <CardTitle className="text-lg">Log Event</CardTitle>
                  <CardDescription>Record a new custody interaction.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCustodySubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="action"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Action Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-black/20">
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="accessed">Accessed</SelectItem>
                                <SelectItem value="transferred">Transferred</SelectItem>
                                <SelectItem value="analyzed">Analyzed</SelectItem>
                                <SelectItem value="sealed">Sealed</SelectItem>
                                <SelectItem value="submitted_to_court">Submitted to Court</SelectItem>
                                <SelectItem value="returned">Returned</SelectItem>
                                <SelectItem value="duplicated">Duplicated</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="performedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Performed By</FormLabel>
                            <FormControl>
                              <Input placeholder="Officer/Agent Name & ID" className="bg-black/20" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Details / Reason</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Purpose of access or transfer..." className="resize-none bg-black/20 h-20" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full mt-2" disabled={addCustodyMutation.isPending}>
                        {addCustodyMutation.isPending ? "Signing Transaction..." : "Sign & Append to Ledger"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="certificate" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              className="gap-2 bg-card/50"
              disabled={certLoading || !certificate}
              onClick={() => window.print()}
            >
              <Download className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>

          <Card className="max-w-4xl mx-auto bg-white text-black rounded-none shadow-2xl print:shadow-none print:w-full overflow-hidden relative">
            {/* Background seal watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Shield className="w-[500px] h-[500px]" />
            </div>

            {certLoading ? (
              <div className="p-12 space-y-6">
                <Skeleton className="h-16 w-3/4 mx-auto bg-gray-200" />
                <Skeleton className="h-8 w-1/2 mx-auto bg-gray-200" />
                <div className="h-px w-full bg-gray-300 my-8"></div>
                <Skeleton className="h-64 w-full bg-gray-200" />
              </div>
            ) : certificate ? (
              <div className="p-12 md:p-16 space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center space-y-4 border-b-2 border-black pb-8">
                  <div className="flex justify-center mb-6">
                    <Shield className="h-16 w-16 text-black" />
                  </div>
                  <h1 className="text-3xl font-serif font-bold uppercase tracking-widest text-black">
                    Certificate of Authenticity
                  </h1>
                  <h2 className="text-xl font-serif text-black/80">
                    Blockchain Chain of Custody Record
                  </h2>
                  <div className="mt-4 font-mono text-sm text-black/60 uppercase">
                    Certificate ID: {certificate.certificateId}
                  </div>
                </div>

                {/* Status Callout */}
                <div className={`border-2 p-4 text-center ${certificate.isVerified ? 'border-green-800 bg-green-50' : 'border-red-800 bg-red-50'}`}>
                  <p className={`font-bold uppercase tracking-widest ${certificate.isVerified ? 'text-green-800' : 'text-red-800'}`}>
                    {certificate.isVerified ? '★ RECORD CRYPTOGRAPHICALLY VERIFIED ★' : '⚠ INTEGRITY VERIFICATION FAILED ⚠'}
                  </p>
                  <p className="text-sm mt-2 text-black/70 font-serif">
                    Generated on {formatDate(certificate.generatedAt)} via Evidence_Chain verification protocol.
                  </p>
                </div>

                {/* Primary Info */}
                <div className="space-y-6">
                  <h3 className="font-serif font-bold text-lg border-b border-black/20 pb-2 uppercase tracking-wider">
                    I. Exhibit Information
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 font-serif text-sm">
                    <div className="text-black/60 uppercase tracking-wider text-xs font-bold">Case Reference</div>
                    <div className="font-bold">{certificate.caseId}</div>
                    
                    <div className="text-black/60 uppercase tracking-wider text-xs font-bold">Exhibit Title</div>
                    <div className="font-bold">{certificate.title}</div>
                    
                    <div className="text-black/60 uppercase tracking-wider text-xs font-bold">Initial Collection</div>
                    <div>{formatDate(certificate.collectedAt)}</div>
                    
                    <div className="text-black/60 uppercase tracking-wider text-xs font-bold">Collecting Officer</div>
                    <div>{certificate.collectedBy}</div>
                  </div>
                </div>

                {/* Cryptographic Proof */}
                <div className="space-y-6">
                  <h3 className="font-serif font-bold text-lg border-b border-black/20 pb-2 uppercase tracking-wider">
                    II. Cryptographic Proof
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-black/60 uppercase tracking-wider text-xs font-bold mb-1">Original SHA-256 Hash</div>
                      <div className="font-mono text-sm bg-gray-100 p-3 border border-gray-300 break-all">
                        {certificate.fileHash}
                      </div>
                    </div>
                    <div>
                      <div className="text-black/60 uppercase tracking-wider text-xs font-bold mb-1">Ledger Transaction Hash</div>
                      <div className="font-mono text-sm bg-gray-100 p-3 border border-gray-300 break-all">
                        {certificate.blockchainTxHash || "Pending"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custody Log */}
                <div className="space-y-6">
                  <h3 className="font-serif font-bold text-lg border-b border-black/20 pb-2 uppercase tracking-wider">
                    III. Custody Ledger ({certificate.totalCustodyEvents} Events)
                  </h3>
                  
                  <table className="w-full text-sm font-serif border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="text-left py-2 px-2 uppercase text-xs font-bold text-black/60">Date/Time</th>
                        <th className="text-left py-2 px-2 uppercase text-xs font-bold text-black/60">Action</th>
                        <th className="text-left py-2 px-2 uppercase text-xs font-bold text-black/60">Officer/Agent</th>
                        <th className="text-left py-2 px-2 uppercase text-xs font-bold text-black/60">Tx Signature (Trunc)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {certificate.custodyChain?.map((log) => (
                        <tr key={log.id}>
                          <td className="py-3 px-2 font-mono text-xs">{formatDate(log.performedAt)}</td>
                          <td className="py-3 px-2 uppercase text-xs font-bold">{log.action.replace(/_/g, ' ')}</td>
                          <td className="py-3 px-2">{log.performedBy}</td>
                          <td className="py-3 px-2 font-mono text-xs text-gray-500">{formatHash(log.txHash)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer / Signatures */}
                <div className="pt-16 mt-16 border-t-2 border-black grid grid-cols-2 gap-12 font-serif">
                  <div className="text-center space-y-8">
                    <div className="border-b border-black w-full h-8"></div>
                    <div className="text-sm uppercase tracking-widest font-bold">System Validator</div>
                  </div>
                  <div className="text-center space-y-8">
                    <div className="border-b border-black w-full h-8"></div>
                    <div className="text-sm uppercase tracking-widest font-bold">Notary / Court Officer</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-black/50">
                Unable to generate certificate. Please ensure the record exists and is verified.
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
