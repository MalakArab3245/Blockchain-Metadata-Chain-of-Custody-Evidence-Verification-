import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useCreateEvidence, getListEvidenceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Save, 
  Upload,
  File,
  X,
  Hash,
  Database,
  FileCheck,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  caseId: z.string().min(1, "Case ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  evidenceType: z.string().min(1, "Evidence type is required"),
  collectedBy: z.string().min(1, "Collector name is required"),
  collectedAt: z.string().min(1, "Collection date/time is required"),
  fileHash: z.string().min(64, "Valid SHA-256 hash required (64 chars)").max(64, "Valid SHA-256 hash required (64 chars)"),
  fileSize: z.coerce.number().optional(),
  mimeType: z.string().optional(),
  locationData: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function SubmitEvidence() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createEvidence = useCreateEvidence();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [hashProgress, setHashProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caseId: "",
      title: "",
      description: "",
      evidenceType: "Digital File",
      collectedBy: "",
      collectedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      fileHash: "",
      fileSize: undefined,
      mimeType: "",
      locationData: "",
    },
  });

  const processFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsHashing(true);
    setHashProgress(10);

    if (!form.getValues("title")) {
      form.setValue("title", file.name.replace(/\.[^/.]+$/, ""));
    }
    if (!form.getValues("mimeType")) {
      form.setValue("mimeType", file.type || "application/octet-stream");
    }
    form.setValue("fileSize", file.size);

    const evidenceTypeMap: Record<string, string> = {
      "image/": "Physical Photo",
      "video/": "Video Recording",
      "audio/": "Audio Recording",
      "application/pdf": "Document",
      "text/": "Document",
      "application/json": "Database Record",
      "application/vnd.tcpdump": "Network Log",
    };
    if (!form.getValues("evidenceType") || form.getValues("evidenceType") === "Digital File") {
      for (const [prefix, type] of Object.entries(evidenceTypeMap)) {
        if (file.type.startsWith(prefix)) {
          form.setValue("evidenceType", type);
          break;
        }
      }
    }

    setHashProgress(30);

    try {
      const hash = await computeSHA256(file);
      setHashProgress(100);
      form.setValue("fileHash", hash);
      form.clearErrors("fileHash");
      toast({
        title: "SHA-256 Hash Computed",
        description: "File fingerprint has been generated and filled in automatically.",
      });
    } catch (err) {
      toast({
        title: "Hashing Failed",
        description: "Could not compute the file hash. Please enter it manually.",
        variant: "destructive",
      });
    } finally {
      setIsHashing(false);
      setHashProgress(0);
    }
  }, [form, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    form.setValue("fileHash", "");
    form.setValue("fileSize", undefined);
    form.setValue("mimeType", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateFakeHash = () => {
    const chars = "0123456789abcdef";
    let hash = "";
    for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];
    form.setValue("fileHash", hash);
  };

  const onSubmit = (data: FormValues) => {
    createEvidence.mutate(
      { data },
      {
        onSuccess: (newRecord) => {
          queryClient.invalidateQueries({ queryKey: getListEvidenceQueryKey() });
          toast({
            title: "Evidence Registered Successfully",
            description: "Record has been hashed and submitted to the blockchain ledger.",
          });
          setLocation(`/evidence/${newRecord.id}`);
        },
        onError: (error) => {
          toast({
            title: "Registration Failed",
            description: error?.data?.error || error?.message || "An unexpected error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/evidence"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Submit Evidence
          </h1>
          <p className="text-muted-foreground mt-1">Register new evidence into the immutable ledger.</p>
        </div>
      </div>

      <Alert className="bg-primary/5 border-primary/20 text-primary">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Immutable Registration</AlertTitle>
        <AlertDescription>
          Submitting this form will generate a cryptographic hash of the metadata and log it to the blockchain. This action cannot be fully undone once confirmed on-chain.
        </AlertDescription>
      </Alert>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Metadata Record
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">

              {/* File Upload Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                  Evidence File (Optional — Auto-Hashes)
                </h3>

                {selectedFile ? (
                  <div className="flex items-center gap-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <File className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatBytes(selectedFile.size)} · {selectedFile.type || "Unknown type"}
                      </p>
                      {isHashing && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-primary">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Computing SHA-256 fingerprint...
                          </div>
                          <Progress value={hashProgress} className="h-1" />
                        </div>
                      )}
                      {!isHashing && form.getValues("fileHash") && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <ShieldCheck className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-500 font-mono">Hash verified</span>
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={clearFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-primary/5"}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">Drop your evidence file here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse — SHA-256 hash will be calculated automatically</p>
                    <Badge variant="outline" className="mt-3 text-xs font-mono bg-secondary/30">
                      Any file type accepted
                    </Badge>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="*/*"
                />
              </div>

              {/* Primary Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Primary Identification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="caseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case ID <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. CASE-2023-0491" className="font-mono bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="evidenceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evidence Type <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Digital File">Digital File</SelectItem>
                            <SelectItem value="Physical Photo">Physical Photo</SelectItem>
                            <SelectItem value="Video Recording">Video Recording</SelectItem>
                            <SelectItem value="Audio Recording">Audio Recording</SelectItem>
                            <SelectItem value="Document">Document</SelectItem>
                            <SelectItem value="Database Record">Database Record</SelectItem>
                            <SelectItem value="Network Log">Network Log</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title / Description <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Brief descriptive title" className="bg-black/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Condition, source, relevant details..."
                          className="min-h-[100px] bg-black/20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cryptographic */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Cryptographic Signature</h3>

                <FormField
                  control={form.control}
                  name="fileHash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SHA-256 Hash <span className="text-destructive">*</span></FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <div className="relative flex-1">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Upload a file above, or paste 64-character hex hash here"
                              className="pl-9 font-mono text-sm bg-black/20 border-primary/30 focus-visible:ring-primary"
                              readOnly={!!selectedFile && !isHashing}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <Button type="button" variant="outline" onClick={generateFakeHash} title="Generate random hash for testing">
                          <Database className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        {selectedFile
                          ? "Hash was automatically computed from your uploaded file."
                          : "Upload a file above for automatic hash generation, or paste a pre-computed SHA-256 hash."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fileSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Size (Bytes)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 1048576" className="font-mono bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mimeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MIME Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. application/pdf" className="font-mono bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Origin */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Origin & Collection</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="collectedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collected By (Officer/Agent) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Det. Sarah Connor, ID: 8491" className="bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="collectedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection Date/Time <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="datetime-local" className="bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="locationData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location / Coordinates</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 34.0522° N, -118.2437° W" className="bg-black/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </CardContent>
            <CardFooter className="border-t border-border/50 bg-muted/10 p-6 flex justify-between">
              <Button type="button" variant="ghost" asChild>
                <Link href="/evidence">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createEvidence.isPending || isHashing} className="font-bold tracking-wide">
                {createEvidence.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering on Ledger...
                  </span>
                ) : isHashing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Hashing File...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Commit to Ledger
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
