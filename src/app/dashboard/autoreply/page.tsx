"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/dashboard/session-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
    BotMessageSquare, 
    Loader2, 
    Plus, 
    Trash2, 
    MessageCircleReply, 
    Image as ImageIcon, 
    Pencil,
    Zap,
    Clock,
    CheckCircle2,
    XCircle,
    Play,
    BarChart2,
    MapPin,
    UserCheck,
    Search,
    Layers,
    Sparkles,
    ShieldAlert
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getAutoReplies, createAutoReply, deleteAutoReply, updateAutoReply, toggleAutoReplyRule } from "./actions";
import { SessionGuard } from "@/components/dashboard/session-guard";

interface AutoReplyRule {
    id: string;
    keyword: string;
    matchType: "EXACT" | "CONTAINS" | "REGEX";
    response: string | null;
    isMedia: boolean;
    mediaUrl: string | null;
    mediaType: string | null;
    replyType: "TEXT" | "MEDIA" | "POLL" | "LOCATION" | "CONTACT";
    interactiveData: string | null;
    delaySeconds: number;
    enabled: boolean;
    triggerType: "ALL" | "GROUP" | "PRIVATE";
    createdAt: Date;
}

export default function AutoReplyPage() {
    const { sessionId } = useSession();
    const [rules, setRules] = useState<AutoReplyRule[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const [keyword, setKeyword] = useState("");
    const [matchType, setMatchType] = useState<"EXACT" | "CONTAINS" | "REGEX">("EXACT");
    const [triggerType, setTriggerType] = useState<"ALL" | "GROUP" | "PRIVATE">("ALL");
    const [replyType, setReplyType] = useState<"TEXT" | "MEDIA" | "POLL" | "LOCATION" | "CONTACT">("TEXT");
    const [response, setResponse] = useState("");
    const [delaySeconds, setDelaySeconds] = useState<number>(0);

    // Media state
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaType, setMediaType] = useState("image");

    // Poll state
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState<string[]>(["Option 1", "Option 2"]);

    // Location state
    const [locLat, setLocLat] = useState(31.5204);
    const [locLng, setLocLng] = useState(74.3587);
    const [locName, setLocName] = useState("");
    const [locAddress, setLocAddress] = useState("");

    // Contact state
    const [cName, setCName] = useState("");
    const [cPhone, setCPhone] = useState("");
    const [cOrg, setCOrg] = useState("");

    // Simulator State
    const [testInput, setTestInput] = useState("");
    const [matchedRule, setMatchedRule] = useState<AutoReplyRule | null | undefined>(undefined);

    useEffect(() => {
        if (sessionId) {
            fetchRules();
        }
    }, [sessionId]);

    const fetchRules = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const data = await getAutoReplies(sessionId);
            setRules(data as unknown as AutoReplyRule[]);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error fetching auto-replies");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!sessionId) return;
        if (!keyword.trim()) return toast.error("Keyword is required");

        let interactiveJSON: string | null = null;
        if (replyType === "POLL") {
            const opts = pollOptions.map(o => o.trim()).filter(Boolean);
            if (!pollQuestion.trim() || opts.length < 2) {
                return toast.error("Poll requires a question and at least 2 options");
            }
            interactiveJSON = JSON.stringify({ question: pollQuestion.trim(), options: opts, selectableCount: 1 });
        } else if (replyType === "LOCATION") {
            interactiveJSON = JSON.stringify({ latitude: locLat, longitude: locLng, name: locName.trim() || undefined, address: locAddress.trim() || undefined });
        } else if (replyType === "CONTACT") {
            if (!cName.trim() || !cPhone.trim()) return toast.error("Contact requires Name and Phone number");
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${cName.trim()};;;\nFN:${cName.trim()}\nORG:${cOrg.trim()}\nTEL;type=CELL;type=VOICE;type=pref:${cPhone.replace(/[^0-9+]/g, "")}\nEND:VCARD`;
            interactiveJSON = JSON.stringify({ displayName: cName.trim(), vcard });
        }

        setSubmitting(true);
        try {
            await createAutoReply(sessionId, {
                keyword: keyword.trim(),
                response: response.trim() || undefined,
                matchType,
                triggerType,
                replyType,
                isMedia: replyType === "MEDIA" || !!mediaUrl.trim(),
                mediaUrl: mediaUrl.trim() || undefined,
                mediaType: mediaType || undefined,
                interactiveData: interactiveJSON || undefined,
                delaySeconds,
                enabled: true
            });

            toast.success("Auto-reply rule created");
            setIsCreateOpen(false);
            fetchRules();
            resetForm();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error creating auto-reply");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleRule = async (ruleId: string) => {
        if (!sessionId) return;
        try {
            await toggleAutoReplyRule(sessionId, ruleId);
            toast.success("Rule status updated");
            fetchRules();
        } catch (error: any) {
            toast.error(error.message || "Failed to update rule status");
        }
    };

    const handleDelete = async (ruleId: string) => {
        if (!sessionId) return;
        try {
            await deleteAutoReply(sessionId, ruleId);
            toast.success("Auto-reply rule deleted");
            fetchRules();
        } catch (error: any) {
            toast.error(error.message || "Error deleting auto-reply");
        }
    };

    const resetForm = () => {
        setKeyword("");
        setResponse("");
        setMatchType("EXACT");
        setTriggerType("ALL");
        setReplyType("TEXT");
        setMediaUrl("");
        setMediaType("image");
        setDelaySeconds(0);
        setPollQuestion("");
        setPollOptions(["Option 1", "Option 2"]);
        setLocName(""); setLocAddress("");
        setCName(""); setCPhone(""); setCOrg("");
    };

    // Live Rule Simulator Matcher
    const handleRunSimulator = () => {
        if (!testInput.trim()) {
            setMatchedRule(undefined);
            return;
        }
        const inputLower = testInput.trim().toLowerCase();
        const found = rules.find((rule) => {
            if (rule.enabled === false) return false;
            const kw = rule.keyword.toLowerCase();
            if (rule.matchType === "EXACT") return inputLower === kw;
            if (rule.matchType === "CONTAINS") return inputLower.includes(kw);
            if (rule.matchType === "REGEX") {
                try {
                    return new RegExp(rule.keyword, "i").test(testInput);
                } catch (e) {
                    return false;
                }
            }
            return false;
        });
        setMatchedRule(found || null);
    };

    return (
        <SessionGuard>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                            <BotMessageSquare className="h-6 w-6 text-primary" />
                            Keyword & Rule-Based Auto-Replies
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configure automatic responses for WhatsApp keywords with Text, Media, Polls, Location Pins, VCards, and Delay Timers.
                        </p>
                    </div>

                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm font-semibold">
                        <Plus className="h-4 w-4" />
                        Create Auto-Reply Rule
                    </Button>
                </div>

                {/* Rule Testing Simulator Box */}
                <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <h3 className="text-sm font-bold">Live Rule Simulator</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">Type a sample customer message to test rule matches</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="e.g. Type 'price' or 'location' or 'catalog' to test..."
                                value={testInput}
                                onChange={(e) => { setTestInput(e.target.value); }}
                                onKeyDown={(e) => { if (e.key === "Enter") handleRunSimulator(); }}
                                className="pl-9"
                            />
                        </div>
                        <Button variant="secondary" onClick={handleRunSimulator} className="gap-2 font-medium">
                            <Play className="h-3.5 w-3.5" /> Run Simulation
                        </Button>
                    </div>

                    {/* Simulation Result Output */}
                    {matchedRule !== undefined && (
                        <div className={`p-4 rounded-xl border text-xs ${matchedRule ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300" : "bg-muted/40 border-border text-muted-foreground"}`}>
                            {matchedRule ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 font-bold">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        MATCH FOUND: Rule &quot;{matchedRule.keyword}&quot; ({matchedRule.matchType} Match)
                                    </div>
                                    <p className="font-mono pt-1">
                                        Reply Type: <span className="font-bold">{matchedRule.replyType}</span> {matchedRule.delaySeconds > 0 && `| Delay: ${matchedRule.delaySeconds}s`}
                                    </p>
                                    {matchedRule.response && <p className="italic bg-background/60 p-2 rounded border mt-1">&quot;{matchedRule.response}&quot;</p>}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                    No rule matched for input &quot;{testInput}&quot;. (System will fallback to AI or Default Handler).
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Rules List Grid */}
                <div className="space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2">
                        <Layers className="h-4.5 w-4.5 text-primary" />
                        Active Rules ({rules.length})
                    </h3>

                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="text-center p-12 border border-dashed rounded-2xl bg-card">
                            <MessageCircleReply className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <h4 className="font-semibold text-sm">No Auto-Reply Rules Configured</h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                Click &quot;Create Auto-Reply Rule&quot; to set up keyword-based automatic text, media, poll, or location responses.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rules.map((rule) => (
                                <Card key={rule.id} className={`transition-all ${rule.enabled !== false ? "border-primary/20 shadow-sm" : "opacity-60 bg-muted/20"}`}>
                                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={rule.matchType === "EXACT" ? "default" : rule.matchType === "CONTAINS" ? "secondary" : "outline"} className="text-[10px]">
                                                    {rule.matchType}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {rule.triggerType}
                                                </Badge>
                                                {rule.delaySeconds > 0 && (
                                                    <span className="text-[10px] text-amber-500 font-mono flex items-center gap-0.5">
                                                        <Clock className="h-3 w-3" /> {rule.delaySeconds}s
                                                    </span>
                                                )}
                                            </div>
                                            <CardTitle className="text-base font-bold mt-2 flex items-center gap-1.5">
                                                &quot;{rule.keyword}&quot;
                                            </CardTitle>
                                        </div>

                                        <Switch
                                            checked={rule.enabled !== false}
                                            onCheckedChange={() => handleToggleRule(rule.id)}
                                        />
                                    </CardHeader>
                                    <CardContent className="space-y-3 pt-0 text-xs">
                                        <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                {rule.replyType === "POLL" && <BarChart2 className="h-3 w-3 text-amber-500" />}
                                                {rule.replyType === "LOCATION" && <MapPin className="h-3 w-3 text-rose-500" />}
                                                {rule.replyType === "CONTACT" && <UserCheck className="h-3 w-3 text-teal-500" />}
                                                {rule.replyType === "MEDIA" && <ImageIcon className="h-3 w-3 text-blue-500" />}
                                                {rule.replyType || "TEXT"} Response
                                            </span>
                                            <p className="line-clamp-3 text-foreground/90 font-medium">
                                                {rule.response || rule.interactiveData || rule.mediaUrl || "No text payload"}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(rule.createdAt).toLocaleDateString()}
                                            </span>
                                            
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Auto-Reply Rule?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete the rule for keyword &quot;{rule.keyword}&quot;?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(rule.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Rule Modal */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                Create Auto-Reply Rule
                            </DialogTitle>
                            <DialogDescription>
                                Set up automated keyword triggers with Text, Media, Polls, Location Pins, or VCards.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                    Keyword *
                                </Label>
                                <Input
                                    placeholder="e.g. price, catalog, store location"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                        Match Type
                                    </Label>
                                    <Select value={matchType} onValueChange={(val: any) => setMatchType(val)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EXACT">Exact Match</SelectItem>
                                            <SelectItem value="CONTAINS">Contains Keyword</SelectItem>
                                            <SelectItem value="REGEX">Regex Pattern</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                        Target Context
                                    </Label>
                                    <Select value={triggerType} onValueChange={(val: any) => setTriggerType(val)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Chats</SelectItem>
                                            <SelectItem value="PRIVATE">Private Direct Messages</SelectItem>
                                            <SelectItem value="GROUP">Group Chats Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Reply Type Selection */}
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                                    Response Content Type
                                </Label>
                                <div className="grid grid-cols-5 gap-1.5 p-1 bg-muted rounded-xl border">
                                    <button
                                        type="button"
                                        onClick={() => setReplyType("TEXT")}
                                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${replyType === "TEXT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        Text
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReplyType("MEDIA")}
                                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${replyType === "MEDIA" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        Media
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReplyType("POLL")}
                                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${replyType === "POLL" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        Poll
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReplyType("LOCATION")}
                                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${replyType === "LOCATION" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        Location
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReplyType("CONTACT")}
                                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${replyType === "CONTACT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        Contact
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Content Form according to Reply Type */}
                            {replyType === "TEXT" && (
                                <div>
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                        Text Reply Payload
                                    </Label>
                                    <Textarea
                                        rows={3}
                                        placeholder="Type automated response text..."
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {replyType === "MEDIA" && (
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                            Media URL
                                        </Label>
                                        <Input
                                            placeholder="https://example.com/catalog.pdf"
                                            value={mediaUrl}
                                            onChange={(e) => setMediaUrl(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                            Optional Caption
                                        </Label>
                                        <Input
                                            placeholder="Image / File caption text..."
                                            value={response}
                                            onChange={(e) => setResponse(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}

                            {replyType === "POLL" && (
                                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                            Poll Question
                                        </Label>
                                        <Input
                                            placeholder="e.g. Which product do you prefer?"
                                            value={pollQuestion}
                                            onChange={(e) => setPollQuestion(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                                Options
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={() => setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])}
                                                className="text-xs text-primary font-semibold hover:underline"
                                            >
                                                + Add Option
                                            </button>
                                        </div>
                                        {pollOptions.map((opt, i) => (
                                            <Input
                                                key={i}
                                                value={opt}
                                                onChange={(e) => {
                                                    const next = [...pollOptions];
                                                    next[i] = e.target.value;
                                                    setPollOptions(next);
                                                }}
                                                placeholder={`Option ${i + 1}`}
                                                className="h-8 text-xs"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {replyType === "LOCATION" && (
                                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Latitude</Label>
                                            <Input type="number" step="any" value={locLat} onChange={(e) => setLocLat(parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-xs" />
                                        </div>
                                        <div>
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Longitude</Label>
                                            <Input type="number" step="any" value={locLng} onChange={(e) => setLocLng(parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-xs" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Location Title</Label>
                                        <Input placeholder="Sole-What Flagship Store" value={locName} onChange={(e) => setLocName(e.target.value)} className="mt-1 h-8 text-xs" />
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Address</Label>
                                        <Input placeholder="Gulberg III, Lahore" value={locAddress} onChange={(e) => setLocAddress(e.target.value)} className="mt-1 h-8 text-xs" />
                                    </div>
                                </div>
                            )}

                            {replyType === "CONTACT" && (
                                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Display Name *</Label>
                                        <Input placeholder="Contact Name" value={cName} onChange={(e) => setCName(e.target.value)} className="mt-1 h-8 text-xs" />
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Phone Number *</Label>
                                        <Input placeholder="+92 300 1234567" value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="mt-1 h-8 text-xs font-mono" />
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Organization</Label>
                                        <Input placeholder="Sole-What Support" value={cOrg} onChange={(e) => setCOrg(e.target.value)} className="mt-1 h-8 text-xs" />
                                    </div>
                                </div>
                            )}

                            {/* Delay Timer Setting */}
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
                                    <span>Delay Before Reply (Seconds)</span>
                                    <span className="font-mono text-primary font-bold">{delaySeconds}s</span>
                                </Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={30}
                                    value={delaySeconds}
                                    onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
                                    className="mt-1"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Set 1-5 seconds delay for natural, human-like responses.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Auto-Reply Rule"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </SessionGuard>
    );
}
