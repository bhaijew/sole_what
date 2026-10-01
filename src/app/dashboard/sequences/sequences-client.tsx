"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/dashboard/session-provider";
import { SessionGuard } from "@/components/dashboard/session-guard";
import { toast } from "sonner";
import {
    Repeat,
    Plus,
    Clock,
    UserCheck,
    Send,
    Trash2,
    CheckCircle2,
    Calendar,
    MessageSquare,
    Sparkles,
    BarChart2,
    MapPin,
    Layers,
    Users,
    Play,
    Loader2,
    AlertCircle,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    getDripCampaigns,
    createDripCampaign,
    deleteDripCampaign,
    toggleDripCampaign,
    addDripStep,
    deleteDripStep,
    enrollDripSubscriber
} from "./actions";

interface DripStepItem {
    id: string;
    stepOrder: number;
    delayDays: number;
    delayHours: number;
    messageType: string;
    content: string | null;
    mediaUrl: string | null;
    interactiveData: string | null;
}

interface DripCampaignItem {
    id: string;
    name: string;
    description: string | null;
    enabled: boolean;
    autoStopOnReply: boolean;
    createdAt: Date;
    steps: DripStepItem[];
    _count?: { subscribers: number };
}

export default function SequencesClient() {
    const { sessionId } = useSession();
    const [campaigns, setCampaigns] = useState<DripCampaignItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<DripCampaignItem | null>(null);

    // Create Campaign state
    const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
    const [campaignName, setCampaignName] = useState("");
    const [campaignDesc, setCampaignDesc] = useState("");
    const [autoStopOnReply, setAutoStopOnReply] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Add Step state
    const [isAddStepOpen, setIsAddStepOpen] = useState(false);
    const [stepDelayDays, setStepDelayDays] = useState<number>(1);
    const [stepDelayHours, setStepDelayHours] = useState<number>(0);
    const [stepMessageType, setStepMessageType] = useState<string>("TEXT");
    const [stepContent, setStepContent] = useState("");
    const [stepMediaUrl, setStepMediaUrl] = useState("");

    // Poll step state
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState<string[]>(["Option 1", "Option 2"]);

    // Location step state
    const [locLat, setLocLat] = useState(31.5204);
    const [locLng, setLocLng] = useState(74.3587);
    const [locName, setLocName] = useState("");
    const [locAddress, setLocAddress] = useState("");

    // Contact step state
    const [cName, setCName] = useState("");
    const [cPhone, setCPhone] = useState("");
    const [cOrg, setCOrg] = useState("");

    // Enroll Subscribers state
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);
    const [phoneNumbersInput, setPhoneNumbersInput] = useState("");

    useEffect(() => {
        if (sessionId) fetchCampaigns();
    }, [sessionId]);

    const fetchCampaigns = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const data = await getDripCampaigns(sessionId);
            setCampaigns(data as unknown as DripCampaignItem[]);
            if (data.length > 0 && !selectedCampaign) {
                setSelectedCampaign(data[0] as unknown as DripCampaignItem);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load drip campaigns");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = async () => {
        if (!sessionId) return;
        if (!campaignName.trim()) return toast.error("Campaign name required");

        setSubmitting(true);
        try {
            const created = await createDripCampaign(sessionId, {
                name: campaignName.trim(),
                description: campaignDesc.trim() || undefined,
                autoStopOnReply
            });
            toast.success("Drip Campaign created!");
            setIsCreateCampaignOpen(false);
            setCampaignName(""); setCampaignDesc("");
            fetchCampaigns();
            setSelectedCampaign(created as unknown as DripCampaignItem);
        } catch (error: any) {
            toast.error(error.message || "Failed to create campaign");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleCampaign = async (campaignId: string) => {
        if (!sessionId) return;
        try {
            await toggleDripCampaign(sessionId, campaignId);
            toast.success("Campaign status updated");
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.message || "Failed to toggle campaign");
        }
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        if (!sessionId) return;
        try {
            await deleteDripCampaign(sessionId, campaignId);
            toast.success("Campaign deleted");
            setSelectedCampaign(null);
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete campaign");
        }
    };

    const handleAddStep = async () => {
        if (!sessionId || !selectedCampaign) return;

        let interactiveJSON: string | undefined = undefined;
        if (stepMessageType === "POLL") {
            const opts = pollOptions.map(o => o.trim()).filter(Boolean);
            if (!pollQuestion.trim() || opts.length < 2) return toast.error("Poll question and 2 options required");
            interactiveJSON = JSON.stringify({ question: pollQuestion.trim(), options: opts, selectableCount: 1 });
        } else if (stepMessageType === "LOCATION") {
            interactiveJSON = JSON.stringify({ latitude: locLat, longitude: locLng, name: locName.trim() || undefined, address: locAddress.trim() || undefined });
        } else if (stepMessageType === "CONTACT") {
            if (!cName.trim() || !cPhone.trim()) return toast.error("Name and Phone required");
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${cName.trim()};;;\nFN:${cName.trim()}\nORG:${cOrg.trim()}\nTEL;type=CELL;type=VOICE;type=pref:${cPhone.replace(/[^0-9+]/g, "")}\nEND:VCARD`;
            interactiveJSON = JSON.stringify({ displayName: cName.trim(), vcard });
        }

        setSubmitting(true);
        try {
            await addDripStep(sessionId, selectedCampaign.id, {
                delayDays: stepDelayDays,
                delayHours: stepDelayHours,
                messageType: stepMessageType,
                content: stepContent.trim() || undefined,
                mediaUrl: stepMediaUrl.trim() || undefined,
                interactiveData: interactiveJSON
            });
            toast.success("Drip step added!");
            setIsAddStepOpen(false);
            resetStepForm();
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.message || "Failed to add step");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteStep = async (stepId: string) => {
        if (!sessionId) return;
        try {
            await deleteDripStep(sessionId, stepId);
            toast.success("Step removed");
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete step");
        }
    };

    const handleEnrollSubscribers = async () => {
        if (!sessionId || !selectedCampaign) return;
        if (!phoneNumbersInput.trim()) return toast.error("Please enter at least one phone number");

        setSubmitting(true);
        try {
            const res = await enrollDripSubscriber(sessionId, selectedCampaign.id, phoneNumbersInput);
            toast.success(`Successfully enrolled ${res.count} contact(s) into sequence!`);
            setIsEnrollOpen(false);
            setPhoneNumbersInput("");
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.message || "Failed to enroll contacts");
        } finally {
            setSubmitting(false);
        }
    };

    const resetStepForm = () => {
        setStepDelayDays(1); setStepDelayHours(0);
        setStepMessageType("TEXT"); setStepContent(""); setStepMediaUrl("");
        setPollQuestion(""); setPollOptions(["Option 1", "Option 2"]);
        setLocName(""); setLocAddress("");
        setCName(""); setCPhone(""); setCOrg("");
    };

    // Keep active selectedCampaign synced with updated list
    const currentActiveCampaign = campaigns.find(c => c.id === selectedCampaign?.id) || selectedCampaign;

    return (
        <SessionGuard>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                            <Repeat className="h-6 w-6 text-primary" />
                            Automated Drip Sequences & Follow-ups
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Schedule multi-step automated message series over days/hours to nurture leads with smart auto-stop on customer reply.
                        </p>
                    </div>

                    <Button onClick={() => setIsCreateCampaignOpen(true)} className="gap-2 shadow-sm font-semibold">
                        <Plus className="h-4 w-4" />
                        Create New Sequence
                    </Button>
                </div>

                {/* Main 2-Column Layout (Campaign Selector + Visual Timeline Builder) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left: Campaign List */}
                    <div className="lg:col-span-4 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            Drip Sequences ({campaigns.length})
                        </h3>

                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="p-6 text-center border border-dashed rounded-2xl bg-card">
                                <Repeat className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                <h4 className="font-semibold text-sm">No Drip Sequences</h4>
                                <p className="text-xs text-muted-foreground mt-1">Create your first automated follow-up campaign above.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {campaigns.map((camp) => (
                                    <div
                                        key={camp.id}
                                        onClick={() => setSelectedCampaign(camp)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                            currentActiveCampaign?.id === camp.id
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "bg-card hover:bg-muted/40 border-border"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm">{camp.name}</h4>
                                            <Switch
                                                checked={camp.enabled}
                                                onCheckedChange={() => handleToggleCampaign(camp.id)}
                                            />
                                        </div>

                                        {camp.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{camp.description}</p>
                                        )}

                                        <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-border/40 text-muted-foreground">
                                            <span className="flex items-center gap-1 font-medium text-foreground">
                                                <Layers className="h-3.5 w-3.5 text-primary" /> {camp.steps.length} Steps
                                            </span>
                                            <span className="flex items-center gap-1 font-medium">
                                                <Users className="h-3.5 w-3.5 text-emerald-500" /> {camp._count?.subscribers || 0} Enrolled
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Visual Timeline Builder & Steps */}
                    <div className="lg:col-span-8 space-y-6">
                        {currentActiveCampaign ? (
                            <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                                
                                {/* Active Campaign Top Info Bar */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-bold">{currentActiveCampaign.name}</h2>
                                            <Badge variant={currentActiveCampaign.enabled ? "default" : "secondary"}>
                                                {currentActiveCampaign.enabled ? "Active" : "Paused"}
                                            </Badge>
                                            {currentActiveCampaign.autoStopOnReply && (
                                                <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-[10px]">
                                                    Auto-Stop on Reply Enabled
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {currentActiveCampaign.description || "Automated WhatsApp follow-up sequence"}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEnrollOpen(true)}
                                            className="gap-1.5 text-xs font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                        >
                                            <UserCheck className="h-3.5 w-3.5" />
                                            Enroll Contacts
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteCampaign(currentActiveCampaign.id)}
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Timeline Visualizer */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            Sequence Timeline ({currentActiveCampaign.steps.length} Steps)
                                        </h3>

                                        <Button size="sm" onClick={() => setIsAddStepOpen(true)} className="gap-1.5 text-xs font-semibold">
                                            <Plus className="h-3.5 w-3.5" /> Add Step
                                        </Button>
                                    </div>

                                    {currentActiveCampaign.steps.length === 0 ? (
                                        <div className="p-8 text-center border border-dashed rounded-xl bg-muted/20">
                                            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                            <h4 className="font-semibold text-sm">No Steps in Sequence</h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Click &quot;Add Step&quot; to configure Step 1 (e.g., Welcome message, follow-up, or special offer).
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-primary/20">
                                            {currentActiveCampaign.steps.map((step, idx) => (
                                                <div key={step.id} className="flex items-start gap-4 relative">
                                                    
                                                    {/* Step Circle Badge */}
                                                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0 z-10 shadow-sm border-2 border-background">
                                                        #{step.stepOrder}
                                                    </div>

                                                    {/* Step Content Card */}
                                                    <div className="flex-1 bg-background border rounded-xl p-4 shadow-sm space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="text-[10px] font-mono">
                                                                    {idx === 0
                                                                        ? step.delayDays === 0 && step.delayHours === 0
                                                                            ? "Immediate (Step 1)"
                                                                            : `Wait ${step.delayDays}d ${step.delayHours}h`
                                                                        : `Wait ${step.delayDays}d ${step.delayHours}h after Step ${step.stepOrder - 1}`}
                                                                </Badge>

                                                                <Badge variant="outline" className="text-[10px]">
                                                                    {step.messageType}
                                                                </Badge>
                                                            </div>

                                                            <button
                                                                onClick={() => handleDeleteStep(step.id)}
                                                                className="text-muted-foreground hover:text-red-500 p-1"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>

                                                        <p className="text-xs font-medium leading-relaxed text-foreground/90">
                                                            {step.content || step.interactiveData || step.mediaUrl || "No content"}
                                                        </p>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        ) : (
                            <div className="p-12 text-center border border-dashed rounded-2xl bg-card">
                                <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <h3 className="font-bold text-base">Select or Create a Drip Sequence</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                                    Choose a sequence campaign on the left panel or click &quot;Create New Sequence&quot; to get started.
                                </p>
                            </div>
                        )}
                    </div>

                </div>

                {/* Create Campaign Modal */}
                <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                Create Drip Sequence Campaign
                            </DialogTitle>
                            <DialogDescription>
                                Set up an automated multi-step WhatsApp follow-up sequence.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div>
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Campaign Name *</Label>
                                <Input
                                    placeholder="e.g. New Lead Nurturing Sequence"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Description</Label>
                                <Input
                                    placeholder="e.g. 7-day automated sales follow-up for e-commerce leads"
                                    value={campaignDesc}
                                    onChange={(e) => setCampaignDesc(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border">
                                <div>
                                    <h5 className="text-xs font-bold">Auto-Stop on Customer Reply</h5>
                                    <p className="text-[11px] text-muted-foreground">Automatically pause sequence if customer sends a message.</p>
                                </div>
                                <Switch checked={autoStopOnReply} onCheckedChange={setAutoStopOnReply} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateCampaignOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateCampaign} disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Campaign"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Step Modal */}
                <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Add Sequence Step #{selectedCampaign ? selectedCampaign.steps.length + 1 : 1}
                            </DialogTitle>
                            <DialogDescription>
                                Configure delay timing and message payload for this step.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border">
                                <div>
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Delay (Days)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={stepDelayDays}
                                        onChange={(e) => setStepDelayDays(parseInt(e.target.value) || 0)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Delay (Hours)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        value={stepDelayHours}
                                        onChange={(e) => setStepDelayHours(parseInt(e.target.value) || 0)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Message Content Type</Label>
                                <div className="grid grid-cols-5 gap-1.5 p-1 bg-muted rounded-xl border">
                                    {["TEXT", "MEDIA", "POLL", "LOCATION", "CONTACT"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setStepMessageType(type)}
                                            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${stepMessageType === type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {stepMessageType === "TEXT" && (
                                <div>
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Text Message Payload</Label>
                                    <Textarea
                                        rows={3}
                                        placeholder="Type follow-up message text..."
                                        value={stepContent}
                                        onChange={(e) => setStepContent(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {stepMessageType === "MEDIA" && (
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Media File URL</Label>
                                        <Input
                                            placeholder="https://example.com/image.jpg"
                                            value={stepMediaUrl}
                                            onChange={(e) => setStepMediaUrl(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Optional Caption</Label>
                                        <Input
                                            placeholder="Caption..."
                                            value={stepContent}
                                            onChange={(e) => setStepContent(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}

                            {stepMessageType === "POLL" && (
                                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                                    <div>
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Poll Question</Label>
                                        <Input
                                            placeholder="Question..."
                                            value={pollQuestion}
                                            onChange={(e) => setPollQuestion(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Options</Label>
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

                            {stepMessageType === "LOCATION" && (
                                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Latitude</Label>
                                            <Input type="number" step="any" value={locLat} onChange={(e) => setLocLat(parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-xs" />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Longitude</Label>
                                            <Input type="number" step="any" value={locLng} onChange={(e) => setLocLng(parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-xs" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Location Title</Label>
                                        <Input placeholder="Location Name" value={locName} onChange={(e) => setLocName(e.target.value)} className="mt-1 h-8 text-xs" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Address</Label>
                                        <Input placeholder="Address" value={locAddress} onChange={(e) => setLocAddress(e.target.value)} className="mt-1 h-8 text-xs" />
                                    </div>
                                </div>
                            )}

                            {stepMessageType === "CONTACT" && (
                                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                                    <div>
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Display Name *</Label>
                                        <Input placeholder="Contact Name" value={cName} onChange={(e) => setCName(e.target.value)} className="mt-1 h-8 text-xs" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Phone Number *</Label>
                                        <Input placeholder="+92 300 1234567" value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="mt-1 h-8 text-xs font-mono" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Organization</Label>
                                        <Input placeholder="Company Name" value={cOrg} onChange={(e) => setCOrg(e.target.value)} className="mt-1 h-8 text-xs" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddStep} disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Step"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Enroll Contacts Modal */}
                <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-emerald-600" />
                                Enroll Contacts into Drip Sequence
                            </DialogTitle>
                            <DialogDescription>
                                Enter phone numbers to start automated follow-up sequence &quot;{selectedCampaign?.name}&quot;.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div>
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                                    Phone Numbers (One per line or comma-separated)
                                </Label>
                                <Textarea
                                    rows={5}
                                    placeholder="923001234567&#10;923119876543&#10;923225554433"
                                    value={phoneNumbersInput}
                                    onChange={(e) => setPhoneNumbersInput(e.target.value)}
                                    className="mt-1 font-mono text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>Cancel</Button>
                            <Button onClick={handleEnrollSubscribers} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll Contacts"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </SessionGuard>
    );
}
