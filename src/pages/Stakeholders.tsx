import { useState } from "react";
import { Users, Plus, Search, Trash2, Mail, Phone, Building, Brain, Loader2, Copy, Check, X, MessageSquare } from "lucide-react";
import { useStakeholders, useCreateStakeholder, useDeleteStakeholder } from "@/hooks/useClimateData";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ExportMenu from "@/components/ExportMenu";
import StakeholderSynergyMap from "@/components/StakeholderSynergyMap";
import { aiStakeholderComms } from "@/lib/aiService";

const typeColors: Record<string, string> = {
  Government: "bg-info/15 text-info",
  "International Org": "bg-primary/15 text-primary",
  "Private Sector": "bg-warning/15 text-warning",
  NGO: "bg-success/15 text-success",
  Research: "bg-accent text-accent-foreground",
};

const Stakeholders = () => {
  const { data: stakeholders } = useStakeholders();
  const createStakeholder = useCreateStakeholder();
  const deleteStakeholder = useDeleteStakeholder();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Government", region: "", email: "", phone: "", organization: "" });

  // AI Comms state
  const [commsDialogOpen, setCommsDialogOpen] = useState(false);
  const [commsTarget, setCommsTarget] = useState<any>(null);
  const [commsResult, setCommsResult] = useState<any>(null);
  const [commsLoading, setCommsLoading] = useState(false);
  const [commsError, setCommsError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const display = stakeholders || [];
  const filtered = display.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.region.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    try {
      await createStakeholder.mutateAsync(form);
      toast({ title: "Stakeholder added" });
      setDialogOpen(false);
      setForm({ name: "", type: "Government", region: "", email: "", phone: "", organization: "" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDraftComms = async (stakeholder: any) => {
    setCommsTarget(stakeholder);
    setCommsDialogOpen(true);
    setCommsLoading(true);
    setCommsError(null);
    setCommsResult(null);
    try {
      const result = await aiStakeholderComms({
        name: stakeholder.name,
        role: stakeholder.role,
        organization: stakeholder.organization,
        sector: stakeholder.sector,
      });
      setCommsResult(result);
    } catch (e: any) {
      setCommsError(e.message || "Failed to generate communication");
    } finally {
      setCommsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getFullEmail = () => {
    if (!commsResult) return "";
    return `Subject: ${commsResult.subject}\n\n${commsResult.greeting}\n\n${commsResult.body}\n\nKey Talking Points:\n${commsResult.talking_points?.map((p: string) => `- ${p}`).join("\n") || ""}\n\nNext Steps:\n${commsResult.next_steps?.map((s: string) => `- ${s}`).join("\n") || ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Stakeholders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{display.length} registered stakeholders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-48 bg-muted border-border" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Government">Government</SelectItem>
              <SelectItem value="International Org">International Org</SelectItem>
              <SelectItem value="Private Sector">Private Sector</SelectItem>
              <SelectItem value="NGO">NGO</SelectItem>
              <SelectItem value="Research">Research</SelectItem>
            </SelectContent>
          </Select>
          {display.length > 0 && <ExportMenu data={display} filename="stakeholders" />}
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Add Stakeholder</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2"><Label className="text-xs text-muted-foreground">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted border-border" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Type</Label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Government">Government</SelectItem><SelectItem value="International Org">International Org</SelectItem><SelectItem value="Private Sector">Private Sector</SelectItem><SelectItem value="NGO">NGO</SelectItem><SelectItem value="Research">Research</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="bg-muted border-border" /></div>
                  </div>
                  <div className="space-y-2"><Label className="text-xs text-muted-foreground">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-muted border-border" /></div>
                  <div className="space-y-2"><Label className="text-xs text-muted-foreground">Organization</Label><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="bg-muted border-border" /></div>
                  <Button onClick={handleCreate} className="w-full" disabled={!form.name || !form.region}>Add Stakeholder</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <StakeholderSynergyMap />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[s.type] || "bg-muted text-muted-foreground"}`}>{s.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary" onClick={() => handleDraftComms(s)} title="AI Draft Communication">
                  <MessageSquare className="w-3 h-3" />
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={async () => { try { await deleteStakeholder.mutateAsync(s.id); toast({ title: "Deleted" }); } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); } }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Building className="w-3 h-3" /> {s.organization || s.region}</div>
              {s.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {s.email}</div>}
              {s.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {s.phone}</div>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full glass-card rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No stakeholders found</p>
          </div>
        )}
      </div>

      {/* AI Communication Draft Dialog */}
      <Dialog open={commsDialogOpen} onOpenChange={(open) => { setCommsDialogOpen(open); if (!open) { setCommsResult(null); setCommsError(null); } }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              {commsTarget ? `Draft for ${commsTarget.name}` : "AI Communication Draft"}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary">Gemini</span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {commsLoading && (
              <div className="flex items-center justify-center gap-3 py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Drafting personalized communication...</span>
              </div>
            )}

            {commsError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{commsError}</p>
              </div>
            )}

            {commsResult && (
              <div className="space-y-4">
                {/* Subject */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Subject</p>
                    <span className="text-[10px] text-muted-foreground">Tone: {commsResult.tone}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{commsResult.subject}</p>
                </div>

                {/* Body */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Email Body</p>
                  <p className="text-sm text-foreground italic mb-3">{commsResult.greeting}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{commsResult.body}</p>
                </div>

                {/* Talking Points */}
                {commsResult.talking_points?.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-xs font-medium text-primary mb-2">Key Talking Points</p>
                    <ul className="space-y-1.5">
                      {commsResult.talking_points.map((p: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">&#x2022;</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {commsResult.next_steps?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1.5">Recommended Next Steps</p>
                    <ol className="space-y-1">
                      {commsResult.next_steps.map((s: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-foreground font-medium">{i + 1}.</span> {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Copy Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(getFullEmail(), "full")}
                    className="flex-1 gap-1"
                    variant={copied === "full" ? "secondary" : "default"}
                  >
                    {copied === "full" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied === "full" ? "Copied!" : "Copy Full Email"}
                  </Button>
                  <Button variant="outline" onClick={() => handleDraftComms(commsTarget)} className="gap-1">
                    <Brain className="w-4 h-4" /> Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stakeholders;
