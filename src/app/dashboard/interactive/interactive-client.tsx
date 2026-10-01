"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
    BarChart2, 
    MapPin, 
    UserCheck, 
    Send, 
    Plus, 
    Trash2, 
    Check, 
    QrCode, 
    Sparkles, 
    Info, 
    Phone, 
    Building, 
    Mail, 
    Globe, 
    Navigation,
    Layers,
    MessageSquare,
    CheckCircle2,
    HelpCircle
} from "lucide-react";

interface Session {
    sessionId: string;
    status: string;
    phoneNumber?: string;
    pushName?: string;
}

const PRESET_LOCATIONS = [
    { label: "Lahore, Pakistan", lat: 31.5204, lng: 74.3587, name: "Lahore Central", address: "Main Boulevard, Gulberg III, Lahore" },
    { label: "Karachi, Pakistan", lat: 24.8607, lng: 67.0011, name: "Karachi HQ", address: "Clifton Block 4, Karachi" },
    { label: "Islamabad, Pakistan", lat: 33.6844, lng: 73.0479, name: "Islamabad Branch", address: "Blue Area, F-6, Islamabad" },
    { label: "Dubai, UAE", lat: 25.2048, lng: 55.2708, name: "Dubai Mall Hub", address: "Downtown Dubai, UAE" },
    { label: "Riyadh, Saudi Arabia", lat: 24.7136, lng: 46.6753, name: "Riyadh Center", address: "King Fahd Road, Riyadh" },
];

export default function InteractiveClient() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>("");
    const [recipientJid, setRecipientJid] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"poll" | "location" | "contact">("poll");
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchingSessions, setFetchingSessions] = useState<boolean>(true);

    // Poll State
    const [pollQuestion, setPollQuestion] = useState<string>("Which product category are you most interested in?");
    const [pollOptions, setPollOptions] = useState<string[]>([
        "Sneakers & Footwear",
        "Apparel & Hoodies",
        "Accessories & Caps",
        "Special Edition Drops"
    ]);
    const [pollSelectableCount, setPollSelectableCount] = useState<number>(1);

    // Location State
    const [locationLat, setLocationLat] = useState<number>(31.5204);
    const [locationLng, setLocationLng] = useState<number>(74.3587);
    const [locationName, setLocationName] = useState<string>("Sole-What Flagship Store");
    const [locationAddress, setLocationAddress] = useState<string>("Main Boulevard, Gulberg III, Lahore");

    // Contact State
    const [contactName, setContactName] = useState<string>("Sole-What Customer Care");
    const [contactPhone, setContactPhone] = useState<string>("+92 300 1234567");
    const [contactOrg, setContactOrg] = useState<string>("Sole-What Official");
    const [contactTitle, setContactTitle] = useState<string>("Head of Support");
    const [contactEmail, setContactEmail] = useState<string>("support@sole-what.com");

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setFetchingSessions(true);
        try {
            const res = await fetch("/api/sessions");
            const data = await res.json();
            if (data.status && data.data) {
                setSessions(data.data);
                const connected = data.data.find((s: Session) => s.status === "CONNECTED");
                if (connected) {
                    setSelectedSession(connected.sessionId);
                } else if (data.data.length > 0) {
                    setSelectedSession(data.data[0].sessionId);
                }
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            toast.error("Failed to load WhatsApp sessions");
        } finally {
            setFetchingSessions(false);
        }
    };

    const formatJid = (input: string) => {
        let clean = input.trim().replace(/[^0-9@a-zA-Z.-]/g, "");
        if (!clean) return "";
        if (!clean.includes("@")) {
            clean = `${clean}@s.whatsapp.net`;
        }
        return clean;
    };

    // Poll handlers
    const addPollOption = () => {
        if (pollOptions.length >= 12) {
            toast.error("WhatsApp polls allow a maximum of 12 options.");
            return;
        }
        setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length <= 2) {
            toast.error("A poll must have at least 2 options.");
            return;
        }
        setPollOptions(pollOptions.filter((_, i) => i !== index));
    };

    const updatePollOption = (index: number, val: string) => {
        const next = [...pollOptions];
        next[index] = val;
        setPollOptions(next);
    };

    // Send Poll
    const handleSendPoll = async () => {
        if (!selectedSession) return toast.error("Please select an active WhatsApp session");
        if (!recipientJid.trim()) return toast.error("Please enter recipient phone number or JID");
        if (!pollQuestion.trim()) return toast.error("Please enter poll question");
        const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
        if (validOptions.length < 2) return toast.error("Poll requires at least 2 valid options");

        const targetJid = formatJid(recipientJid);
        setLoading(true);

        try {
            const res = await fetch(`/api/messages/${selectedSession}/${encodeURIComponent(targetJid)}/poll`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: pollQuestion.trim(),
                    options: validOptions,
                    selectableCount: pollSelectableCount
                })
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Poll successfully sent to ${targetJid}!`);
            } else {
                toast.error(data.message || data.error || "Failed to send poll");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to send poll");
        } finally {
            setLoading(false);
        }
    };

    // Send Location
    const handleSendLocation = async () => {
        if (!selectedSession) return toast.error("Please select an active WhatsApp session");
        if (!recipientJid.trim()) return toast.error("Please enter recipient phone number or JID");

        const targetJid = formatJid(recipientJid);
        setLoading(true);

        try {
            const res = await fetch(`/api/messages/${selectedSession}/${encodeURIComponent(targetJid)}/location`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    latitude: locationLat,
                    longitude: locationLng,
                    name: locationName.trim() || undefined,
                    address: locationAddress.trim() || undefined
                })
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Location Pin sent to ${targetJid}!`);
            } else {
                toast.error(data.message || data.error || "Failed to send location");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to send location");
        } finally {
            setLoading(false);
        }
    };

    // Send Contact Card
    const handleSendContact = async () => {
        if (!selectedSession) return toast.error("Please select an active WhatsApp session");
        if (!recipientJid.trim()) return toast.error("Please enter recipient phone number or JID");
        if (!contactName.trim() || !contactPhone.trim()) return toast.error("Name and Phone number are required");

        const cleanPhone = contactPhone.replace(/[^0-9+]/g, "");
        const vcard = `BEGIN:VCARD
VERSION:3.0
N:;${contactName};;;
FN:${contactName}
ORG:${contactOrg}
TITLE:${contactTitle}
TEL;type=CELL;type=VOICE;type=pref:${cleanPhone}
${contactEmail ? `EMAIL;type=INTERNET:${contactEmail}` : ""}
END:VCARD`;

        const targetJid = formatJid(recipientJid);
        setLoading(true);

        try {
            const res = await fetch(`/api/messages/${selectedSession}/${encodeURIComponent(targetJid)}/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contacts: [
                        {
                            displayName: contactName.trim(),
                            vcard
                        }
                    ]
                })
            });
            const data = await res.json();
            if (data.status) {
                toast.success(`Contact Card sent to ${targetJid}!`);
            } else {
                toast.error(data.message || data.error || "Failed to send contact card");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to send contact card");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                        <Layers className="h-6 w-6 text-primary" />
                        Interactive WhatsApp Messages
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Send native interactive Polls, Geo-location map pins, and digital VCards directly to customer chats.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-medium">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        Baileys Native Interactive Engine
                    </span>
                </div>
            </div>

            {/* Target Session & Recipient Selector Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border rounded-2xl p-5 shadow-sm">
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <QrCode className="h-3.5 w-3.5 text-primary" />
                        Connected WhatsApp Session
                    </label>
                    <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        disabled={fetchingSessions || sessions.length === 0}
                        className="w-full h-11 px-3.5 py-2 bg-background border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                    >
                        {fetchingSessions ? (
                            <option>Loading connected sessions...</option>
                        ) : sessions.length === 0 ? (
                            <option value="">No active sessions found (Scan QR first)</option>
                        ) : (
                            sessions.map((s) => (
                                <option key={s.sessionId} value={s.sessionId}>
                                    {s.sessionId} ({s.phoneNumber || s.pushName || s.status}) - {s.status}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        Recipient Phone Number / Group JID
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. 923001234567 or 923001234567@s.whatsapp.net"
                        value={recipientJid}
                        onChange={(e) => setRecipientJid(e.target.value)}
                        className="w-full h-11 px-3.5 py-2 bg-background border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50"
                    />
                </div>
            </div>

            {/* Tab Controls */}
            <div className="flex border-b border-border/60 gap-2">
                <button
                    onClick={() => setActiveTab("poll")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === "poll"
                            ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                >
                    <BarChart2 className="h-4 w-4" />
                    Interactive Polls (Voting)
                </button>
                <button
                    onClick={() => setActiveTab("location")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === "location"
                            ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                >
                    <MapPin className="h-4 w-4" />
                    Live Location Pin
                </button>
                <button
                    onClick={() => setActiveTab("contact")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === "contact"
                            ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                >
                    <UserCheck className="h-4 w-4" />
                    Contact Card (VCard)
                </button>
            </div>

            {/* Main Content Layout (Form + Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Form Editor */}
                <div className="lg:col-span-7 space-y-6 bg-card border rounded-2xl p-6 shadow-sm">

                    {/* POLL TAB */}
                    {activeTab === "poll" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-base font-bold flex items-center gap-2">
                                    <BarChart2 className="h-4 w-4 text-primary" />
                                    Configure WhatsApp Poll
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Create a multi-choice or single-choice poll that customers can vote on inside WhatsApp.
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                    Poll Question / Title
                                </label>
                                <input
                                    type="text"
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="w-full h-11 px-3.5 bg-background border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Poll Options ({pollOptions.length}/12)
                                    </label>
                                    <button
                                        onClick={addPollOption}
                                        disabled={pollOptions.length >= 12}
                                        className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 disabled:opacity-40"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Option
                                    </button>
                                </div>
                                <div className="space-y-2.5">
                                    {pollOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                                                {idx + 1}.
                                            </span>
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => updatePollOption(idx, e.target.value)}
                                                placeholder={`Option ${idx + 1}`}
                                                className="flex-1 h-10 px-3 bg-background border rounded-lg text-sm outline-none focus:border-primary"
                                            />
                                            <button
                                                onClick={() => removePollOption(idx)}
                                                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                                                title="Delete option"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                    Voting Mode
                                </label>
                                <select
                                    value={pollSelectableCount}
                                    onChange={(e) => setPollSelectableCount(Number(e.target.value))}
                                    className="w-full h-10 px-3 bg-background border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value={1}>Single Choice (Select only 1 option)</option>
                                    <option value={pollOptions.length}>Multiple Choices (Select multiple options)</option>
                                </select>
                            </div>

                            <button
                                onClick={handleSendPoll}
                                disabled={loading}
                                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 mt-4"
                            >
                                <Send className="h-4 w-4" />
                                {loading ? "Sending Poll..." : "Send Interactive Poll"}
                            </button>
                        </div>
                    )}

                    {/* LOCATION TAB */}
                    {activeTab === "location" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-base font-bold flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    Configure Geo Location Pin
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Send exact GPS location pins so customers can open live maps directly from WhatsApp.
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                    Quick City Presets
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_LOCATIONS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setLocationLat(preset.lat);
                                                setLocationLng(preset.lng);
                                                setLocationName(preset.name);
                                                setLocationAddress(preset.address);
                                            }}
                                            className="px-3 py-1.5 text-xs bg-muted/60 hover:bg-primary/10 hover:text-primary rounded-lg border font-medium transition-all flex items-center gap-1"
                                        >
                                            <Navigation className="h-3 w-3" />
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={locationLat}
                                        onChange={(e) => setLocationLat(parseFloat(e.target.value) || 0)}
                                        className="w-full h-10 px-3 bg-background border rounded-lg text-sm font-mono outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={locationLng}
                                        onChange={(e) => setLocationLng(parseFloat(e.target.value) || 0)}
                                        className="w-full h-10 px-3 bg-background border rounded-lg text-sm font-mono outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Location Name (Title)
                                </label>
                                <input
                                    type="text"
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    placeholder="e.g. Sole-What Store"
                                    className="w-full h-10 px-3 bg-background border rounded-lg text-sm outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Full Street Address
                                </label>
                                <input
                                    type="text"
                                    value={locationAddress}
                                    onChange={(e) => setLocationAddress(e.target.value)}
                                    placeholder="e.g. Main Boulevard, Gulberg III, Lahore"
                                    className="w-full h-10 px-3 bg-background border rounded-lg text-sm outline-none"
                                />
                            </div>

                            <button
                                onClick={handleSendLocation}
                                disabled={loading}
                                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 mt-4"
                            >
                                <Send className="h-4 w-4" />
                                {loading ? "Sending Location..." : "Send Location Pin"}
                            </button>
                        </div>
                    )}

                    {/* CONTACT TAB */}
                    {activeTab === "contact" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-base font-bold flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-primary" />
                                    Configure Contact Card (VCard)
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Send digital contact details that users can save to their phone contacts with 1 click.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                        Display Name *
                                    </label>
                                    <div className="relative">
                                        <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={contactName}
                                            onChange={(e) => setContactName(e.target.value)}
                                            placeholder="Contact Name"
                                            className="w-full h-10 pl-9 pr-3 bg-background border rounded-lg text-sm outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                        Phone Number *
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                            placeholder="+92 300 1234567"
                                            className="w-full h-10 pl-9 pr-3 bg-background border rounded-lg text-sm outline-none font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                        Organization / Business
                                    </label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={contactOrg}
                                            onChange={(e) => setContactOrg(e.target.value)}
                                            placeholder="Company Name"
                                            className="w-full h-10 pl-9 pr-3 bg-background border rounded-lg text-sm outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                        Job Title / Role
                                    </label>
                                    <input
                                        type="text"
                                        value={contactTitle}
                                        onChange={(e) => setContactTitle(e.target.value)}
                                        placeholder="e.g. Sales Manager"
                                        className="w-full h-10 px-3 bg-background border rounded-lg text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        placeholder="email@company.com"
                                        className="w-full h-10 pl-9 pr-3 bg-background border rounded-lg text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSendContact}
                                disabled={loading}
                                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 mt-4"
                            >
                                <Send className="h-4 w-4" />
                                {loading ? "Sending Contact..." : "Send Contact Card"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right side: WhatsApp Real-time UI Preview */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#efeae2] dark:bg-[#0b141a] border rounded-2xl p-5 shadow-lg relative min-h-[420px] flex flex-col justify-between">
                        {/* WhatsApp Header bar preview */}
                        <div className="flex items-center gap-3 pb-3 border-b border-black/10 dark:border-white/10 mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                                WA
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                                    WhatsApp Preview
                                </h4>
                                <p className="text-[10px] text-muted-foreground">
                                    {recipientJid ? formatJid(recipientJid) : "Select recipient above"}
                                </p>
                            </div>
                        </div>

                        {/* WhatsApp Message Bubble */}
                        <div className="flex-1 flex flex-col justify-end">
                            <div className="bg-white dark:bg-[#202c33] text-foreground p-4 rounded-xl shadow-md border dark:border-none space-y-3 max-w-[92%] self-end">
                                
                                {/* POLL PREVIEW */}
                                {activeTab === "poll" && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                            <BarChart2 className="h-4 w-4" />
                                            <span>POLL</span>
                                        </div>
                                        <p className="text-sm font-semibold leading-snug">
                                            {pollQuestion || "Poll Question Title..."}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {pollSelectableCount === 1 ? "Select 1 option" : "Select one or more options"}
                                        </p>

                                        <div className="space-y-2 pt-1">
                                            {pollOptions.map((opt, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-2.5 bg-muted/30 dark:bg-[#111b21] rounded-lg border border-border/40 text-xs font-medium cursor-pointer hover:bg-muted/60 transition-colors"
                                                >
                                                    <span className="truncate pr-2">{opt || `Option ${i+1}`}</span>
                                                    <div className="w-4 h-4 rounded-full border border-primary/50 flex items-center justify-center">
                                                        {i === 0 && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                                            View Votes / Submit
                                        </button>
                                    </div>
                                )}

                                {/* LOCATION PREVIEW */}
                                {activeTab === "location" && (
                                    <div className="space-y-2">
                                        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-lg relative overflow-hidden flex flex-col items-center justify-center border">
                                            {/* Simulated Map Visual */}
                                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                                            <div className="p-2 bg-red-500 text-white rounded-full shadow-lg z-10 animate-bounce">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold bg-background/80 px-2 py-0.5 rounded mt-1 z-10">
                                                {locationLat}, {locationLng}
                                            </span>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold">{locationName || "Location Title"}</h5>
                                            <p className="text-[11px] text-muted-foreground leading-tight">
                                                {locationAddress || "Street Address"}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* CONTACT PREVIEW */}
                                {activeTab === "contact" && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                                                {contactName ? contactName.charAt(0).toUpperCase() : "C"}
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-bold">{contactName || "Contact Name"}</h5>
                                                {contactOrg && <p className="text-[11px] text-muted-foreground">{contactOrg}</p>}
                                                {contactPhone && <p className="text-[11px] font-mono text-primary mt-0.5">{contactPhone}</p>}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t flex gap-2">
                                            <button className="flex-1 py-1.5 bg-muted/60 text-xs font-semibold rounded-md border hover:bg-muted text-center">
                                                Save Contact
                                            </button>
                                            <button className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 text-center">
                                                Message
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="text-[9px] text-muted-foreground text-right pt-1">
                                    12:00 PM • Sent via Sole-What
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
