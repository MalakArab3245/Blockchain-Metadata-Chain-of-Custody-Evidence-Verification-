import { useState } from "react";
import { useVerifyHash } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck, Search, Database, Box, Clock, Hash, Lock, CheckCircle2, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export default function VerifyPortal() {
  const [hash, setHash] = useState("");
  const verifyMutation = useVerifyHash();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hash.trim()) return;
    
    verifyMutation.mutate({
      data: { hash: hash.trim() }
    });
  };

  const result = verifyMutation.data;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
        
        {/* Tech grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <header className="py-6 px-8 border-b border-border/50 bg-background/50 backdrop-blur-md relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Public Verification Portal</h1>
            <p className="text-xs text-muted-foreground font-mono">EVIDENCE_CHAIN VALIDATION NODE</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-mono">
          <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
          NODE_ONLINE
        </Badge>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-4xl mx-auto w-full">
        <div className="text-center mb-10 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Verify Evidence Integrity
          </h2>
          <p className="text-lg text-muted-foreground">
            Enter a SHA-256 evidence hash to mathematically prove its registration, immutability, and chain of custody via the blockchain ledger.
          </p>
        </div>

        <Card className="w-full bg-card/60 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          <CardContent className="p-8">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hash" className="text-sm font-mono text-muted-foreground uppercase tracking-wider">SHA-256 Hash Signature</Label>
                <div className="relative flex items-center">
                  <Hash className="absolute left-4 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="hash"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                    className="pl-12 h-14 font-mono text-lg bg-black/40 border-border/50 focus-visible:ring-primary focus-visible:border-primary"
                    required
                  />
                  <Button 
                    type="submit" 
                    disabled={verifyMutation.isPending || !hash.trim()}
                    className="absolute right-2 h-10 px-6 font-bold tracking-wide"
                  >
                    {verifyMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Verify
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full mt-8"
            >
              <Card className={`border-2 overflow-hidden ${result.isValid ? 'border-green-500/50 bg-green-500/5' : 'border-destructive/50 bg-destructive/5'}`}>
                <div className={`p-6 border-b ${result.isValid ? 'border-green-500/20' : 'border-destructive/20'} flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    {result.isValid ? (
                      <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 border border-green-500/30">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center text-destructive border border-destructive/30">
                        <ShieldAlert className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${result.isValid ? 'text-green-500' : 'text-destructive'}`}>
                        {result.isValid ? 'Cryptographic Match Found' : 'Verification Failed'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  {result.evidenceId && result.isValid && (
                    <Button variant="outline" className="hidden md:flex" asChild>
                      <a href={`/evidence/${result.evidenceId}`} target="_blank" rel="noopener noreferrer">
                        View Full Record <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-muted-foreground uppercase">Queried Hash</p>
                      <p className="font-mono text-sm break-all bg-black/40 p-3 rounded border border-border/50">{result.hash}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Lock className={`h-4 w-4 ${result.chainIntegrity ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium text-foreground">Chain Integrity Status:</span>
                        <Badge variant={result.chainIntegrity ? "default" : "secondary"} className={result.chainIntegrity ? "bg-green-500/20 text-green-500 hover:bg-green-500/20" : ""}>
                          {result.chainIntegrity ? 'INTACT' : 'UNVERIFIED'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className={`h-4 w-4 ${result.blockchainConfirmed ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium text-foreground">Ledger Confirmation:</span>
                        <Badge variant={result.blockchainConfirmed ? "default" : "secondary"} className={result.blockchainConfirmed ? "bg-primary/20 text-primary hover:bg-primary/20" : ""}>
                          {result.blockchainConfirmed ? 'CONFIRMED' : 'UNCONFIRMED'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-black/20 p-4 rounded-lg border border-border/30">
                    <h4 className="text-sm font-semibold border-b border-border/50 pb-2 mb-4">Metadata Attributes</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Box className="h-3 w-3" /> Block Height</p>
                        <p className="font-mono text-sm font-bold text-foreground">
                          {result.blockNumber ? `#${result.blockNumber}` : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Timestamp</p>
                        <p className="font-mono text-sm font-bold text-foreground">
                          {formatDate(result.timestamp)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Activity className="h-3 w-3" /> Custody Events</p>
                        <p className="font-mono text-sm font-bold text-foreground">
                          {result.totalTransactions || 0} recorded
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Validation</p>
                        <p className="font-mono text-sm font-bold text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> PASSED
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {result.evidenceId && result.isValid && (
                  <div className="p-4 border-t border-border/30 bg-black/40 flex justify-center md:hidden">
                    <Button variant="default" className="w-full" asChild>
                      <a href={`/evidence/${result.evidenceId}`} target="_blank" rel="noopener noreferrer">
                        View Full Record <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-6 px-8 border-t border-border/50 bg-background/50 backdrop-blur-md relative z-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground font-mono">
          Mathematical proof of existence and non-repudiation.
        </p>
        <div className="flex gap-4 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> SECURE SHA-256</span>
          <span className="flex items-center gap-1"><Database className="h-3 w-3" /> IMMUTABLE LEDGER</span>
        </div>
      </footer>
    </div>
  );
}
