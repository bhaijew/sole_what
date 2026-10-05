"use client";

import { useState, useEffect } from "react";
import {
    Sparkles,
    Bot,
    Key,
    BookOpen,
    Send,
    Save,
    CheckCircle2,
    AlertCircle,
    Sliders,
    Zap,
    MessageSquare,
    Layers,
    Cpu,
    RefreshCw,
    HelpCircle,
    Check,
    Globe,
    Shield,
    Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface Session {
    id: string;
    sessionId: string;
    name: string;
    status: string;
}

interface AiConfigData {
    enabled: boolean;
    provider: string;
    apiKey: string;
    modelName: string;
    systemPrompt: string;
    knowledgeBase: string;
    temperature: number;
    maxTokens: number;
    triggerInGroups: boolean;
    fallbackOnly: boolean;
}

const OPENROUTER_MODELS = [
    {
        id: "meta-llama/llama-3.1-8b-instruct:free",
        name: "Meta Llama 3.1 8B Instruct (FREE)",
        tag: "FREE",
        recommended: true,
        desc: "Super fast, excellent for Urdu/English customer support."
    },
    {
        id: "google/gemma-2-9b-it:free",
        name: "Google Gemma 2 9B (FREE)",
        tag: "FREE",
        desc: "High quality conversational understanding."
    },
    {
        id: "deepseek/deepseek-r1:free",
        name: "DeepSeek R1 (FREE)",
        tag: "FREE",
        desc: "Advanced reasoning model for complex product details."
    },
    {
        id: "qwen/qwen-2.5-7b-instruct:free",
        name: "Qwen 2.5 7B Instruct (FREE)",
        tag: "FREE",
        desc: "Great multilingual capabilities."
    },
    {
        id: "openai/gpt-4o-mini",
        name: "OpenAI GPT-4o Mini",
        tag: "PAID",
        desc: "Fast, smart, and low cost OpenAI model."
    },
    {
        id: "google/gemini-flash-1.5",
        name: "Google Gemini 1.5 Flash",
        tag: "PAID",
        desc: "Ultra fast multimodal response engine."
    }
];

const PRESETS = [
    {
        name: "Restaurant & Cafe (Menu Bot)",
        systemPrompt: `You are a polite, helpful customer service assistant for "Royal Spice Restaurant & Cafe".
Answer customer questions about food, deals, prices, and home delivery politely and warmly in Urdu/English.
When a customer asks for the menu, food list, deals, or prices, politely answer and append: [SEND_IMAGE: https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800]`,
        knowledgeBase: `RESTAURANT NAME: Royal Spice Cafe & Grill
MENU IMAGE: https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800
TIMINGS: 12:00 PM to 1:00 AM Daily
HOME DELIVERY: Free delivery on orders above Rs. 1,000. Delivery time: 30-45 minutes.
PHONE / WHATSAPP: +92-300-1234567

POPULAR MENU ITEMS & PRICES:
- Chicken Special Biryani: Rs. 450
- Chicken Karahi (Full / Half): Rs. 1,800 / Rs. 950
- Chicken Malai Boti (Plate): Rs. 650
- Beef Seekh Kabab (4 pcs): Rs. 600
- Crispy Zinger Burger + Fries: Rs. 550
- Large Pizza (13 inch): Rs. 1,450
- Cold Drinks & Shakes: Rs. 150 - Rs. 350

SPECIAL DEALS:
- Deal 1 (Family Deal): 1 Full Karahi + 4 Naan + 1.5L Drink = Rs. 2,100
- Deal 2 (Zinger Combo): 2 Zingers + 2 Fries + 2 Cold Drinks = Rs. 1,250`
    },
    {
        name: "Jeweller & Gold Shop",
        systemPrompt: `You are an expert sales representative for a premier Jewelry & Gold store.
Be exceptionally polite, professional, and helpful. Use respectful Urdu/English (e.g. "Salam", "Aap", "Shukriya").
Answer questions strictly based on the Knowledge Base provided below.`,
        knowledgeBase: `STORE NAME: Royal Jewellers
LOCATION: Shop 42, Liberty Market, Gulberg III, Lahore, Pakistan.
PHONE: +92-300-1234567
TIMINGS: Monday to Saturday, 12:00 PM to 10:00 PM (Closed on Sundays).

GOLD RATES TODAY (24K): PKR 280,000 per tola.
GOLD RATES TODAY (22K): PKR 256,000 per tola.
MAKING CHARGES: PKR 3,000 to 8,000 per tola depending on design complexity.

DELIVERY POLICY:
- We deliver all over Pakistan via TCS Secure Express Shipping.
- Delivery time: 2 to 3 working days.
- Advance payment required for orders above PKR 50,000.
- Cash on Delivery available for orders under PKR 50,000.

RETURN & EXCHANGE:
- 7-day hassle-free exchange on size mismatch.
- 100% buyback guarantee at current market gold rate (minus 5% making deduction).`
    },
    {
        name: "E-Commerce Clothing & Fashion",
        systemPrompt: `You are a polite customer support AI for an online Fashion & Clothing brand.
Help customers with order queries, size guides, shipping details, and return policies.`,
        knowledgeBase: `BRAND NAME: Elegance Apparel
WEBSITE: https://elegancefashion.com
CUSTOMER CARE: 0321-9988776

SHIPPING & DELIVERY:
- Delivery Charges: PKR 200 flat all over Pakistan. FREE shipping on orders above PKR 4,000.
- Delivery Time: 3-5 working days.

PAYMENT METHODS:
- Cash on Delivery (COD)
- Bank Transfer (Meezan Bank)
- JazzCash & EasyPaisa

RETURN POLICY:
- 14 days exchange policy if product is unworn and tags intact.`
    },
    {
        name: "General Customer Support",
        systemPrompt: `You are a polite, helpful 24/7 customer support AI assistant. Answer customer questions accurately using the provided knowledge base.`,
        knowledgeBase: `BUSINESS NAME: My Business
WORKING HOURS: 9 AM to 6 PM (Monday to Saturday)
SUPPORT EMAIL: support@mybusiness.com
DELIVERY TIME: 2 to 4 working days.`
    }
];

export default function AiBotClient() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

    // AI Config State
    const [config, setConfig] = useState<AiConfigData>({
        enabled: false,
        provider: "gemini",
        apiKey: "",
        modelName: "gemini-1.5-flash",
        systemPrompt: PRESETS[0].systemPrompt,
        knowledgeBase: PRESETS[0].knowledgeBase,
        temperature: 0.7,
        maxTokens: 800,
        triggerInGroups: false,
        fallbackOnly: true
    });

    // Playground Chatbox state
    const [playgroundMessages, setPlaygroundMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
        { role: "assistant", content: "Salam! Main aapki dukaan ka AI Assistant hoon. Koi bhi sawal pooch kar test karein!" }
    ]);
    const [userInput, setUserInput] = useState<string>("");
    const [testingAi, setTestingAi] = useState<boolean>(false);

    useEffect(() => {
        // Fetch sessions
        fetch("/api/sessions")
            .then((res) => res.json())
            .then((res) => {
                if (res.status && Array.isArray(res.data)) {
                    setSessions(res.data);
                    if (res.data[0]) {
                        setSelectedSessionId(res.data[0].sessionId);
                    }
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedSessionId) return;

        setLoadingConfig(true);
        fetch(`/api/sessions/${selectedSessionId}/ai-config`)
            .then((res) => res.json())
            .then((res) => {
                if (res.status && res.data) {
                    const fetchedProvider = ["gemini", "openrouter", "openai"].includes(res.data.provider)
                        ? res.data.provider
                        : "gemini";
                    const defaultModel =
                        fetchedProvider === "gemini" ? "gemini-1.5-flash" :
                        fetchedProvider === "openai" ? "gpt-4o-mini" :
                        "openrouter/free";

                    setConfig({
                        enabled: res.data.enabled ?? false,
                        provider: fetchedProvider,
                        apiKey: res.data.apiKey || "",
                        modelName: res.data.modelName || defaultModel,
                        systemPrompt: res.data.systemPrompt || PRESETS[0].systemPrompt,
                        knowledgeBase: res.data.knowledgeBase || PRESETS[0].knowledgeBase,
                        temperature: res.data.temperature ?? 0.7,
                        maxTokens: res.data.maxTokens ?? 800,
                        triggerInGroups: res.data.triggerInGroups ?? false,
                        fallbackOnly: res.data.fallbackOnly ?? true
                    });
                }
            })
            .catch(() => {})
            .finally(() => setLoadingConfig(false));
    }, [selectedSessionId]);

    const handleSaveConfig = async () => {
        if (!selectedSessionId) {
            toast.error("Please select a session!");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/sessions/${selectedSessionId}/ai-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });

            const data = await res.json();
            if (data.status) {
                toast.success("AI Configuration saved successfully!");
            } else {
                toast.error(data.message || "Failed to save configuration");
            }
        } catch (err: any) {
            toast.error("Error saving configuration: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePlaygroundSend = async () => {
        if (!userInput.trim()) return;

        const userMsg = userInput.trim();
        setUserInput("");
        setPlaygroundMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setTestingAi(true);

        try {
            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: config.provider,
                    apiKey: config.apiKey,
                    modelName: config.modelName,
                    systemPrompt: config.systemPrompt,
                    knowledgeBase: config.knowledgeBase,
                    userPrompt: userMsg
                })
            });

            const data = await res.json();
            if (data.status && data.data?.reply) {
                setPlaygroundMessages((prev) => [...prev, { role: "assistant", content: data.data.reply }]);
            } else {
                setPlaygroundMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "❌ Error: " + (data.message || "Could not generate AI response.") }
                ]);
            }
        } catch (err: any) {
            setPlaygroundMessages((prev) => [
                ...prev,
                { role: "assistant", content: "❌ Error: " + err.message }
            ]);
        } finally {
            setTestingAi(false);
        }
    };

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setConfig((prev) => ({
            ...prev,
            systemPrompt: preset.systemPrompt,
            knowledgeBase: preset.knowledgeBase
        }));
        toast.info(`Applied "${preset.name}" preset!`);
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
                        <Sparkles size={16} />
                        <span>Next-Gen WhatsApp Automation</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Bot className="h-8 w-8 text-primary" />
                        AI Auto-Responder & Knowledge Base
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Train AI on your business FAQs and automatically respond to customer inquiries 24/7 on WhatsApp.
                    </p>
                </div>

                {/* Session Selector */}
                <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/50">
                    <Bot className="h-5 w-5 text-primary" />
                    <div className="text-xs">
                        <div className="font-medium text-foreground">Target Session</div>
                        <select
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                            className="bg-transparent text-xs text-muted-foreground focus:outline-none font-mono cursor-pointer"
                        >
                            {sessions.length === 0 && <option value="">No Sessions Found</option>}
                            {sessions.map((s) => (
                                <option key={s.sessionId} value={s.sessionId}>
                                    {s.name} ({s.status})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Master Toggle Banner */}
            <div className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${
                config.enabled 
                    ? "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20" 
                    : "bg-muted/30 border-border/60"
            }`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${config.enabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                            AI Auto-Responder Status: {config.enabled ? (
                                <span className="text-emerald-500 flex items-center gap-1 font-semibold text-base">
                                    <CheckCircle2 size={18} /> ACTIVE
                                </span>
                            ) : (
                                <span className="text-muted-foreground text-base font-normal">(OFF)</span>
                            )}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {config.enabled 
                                ? "AI is actively answering customer inquiries on WhatsApp using your Knowledge Base."
                                : "Turn ON to enable automatic AI responses for incoming WhatsApp messages."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Switch
                        checked={config.enabled}
                        onCheckedChange={(val) => setConfig((prev) => ({ ...prev, enabled: val }))}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                    <button
                        onClick={handleSaveConfig}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl font-medium text-xs shadow-sm transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <span>Saving...</span>
                        ) : (
                            <>
                                <Save size={16} />
                                <span>Save Settings</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Fallback Mode & Keyword Precedence Toggle Card */}
            <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                        <Zap size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            Fallback Mode (Prioritize Keyword Rules over AI)
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            When <b>ON</b>, if an incoming message matches a Keyword Auto-Reply rule (e.g. &quot;price&quot;), the AI Bot stays silent to prevent duplicate responses.
                        </p>
                    </div>
                </div>

                <Switch
                    checked={config.fallbackOnly !== false}
                    onCheckedChange={(val) => setConfig((prev) => ({ ...prev, fallbackOnly: val }))}
                    className="data-[state=checked]:bg-amber-500"
                />
            </div>

            {/* Main 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Configuration Settings (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Provider & Model Selection */}
                    <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-5 shadow-sm">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
                            <Cpu size={18} className="text-primary" />
                            AI Provider & Model Configuration
                        </h3>

                        {/* Provider Tabs */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-foreground">Select AI Provider:</label>
                                <span className="text-[10px] text-muted-foreground">Pick your preferred AI engine</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {[
                                    { id: "gemini", title: "Google Gemini", subtitle: "Gemini 1.5 & 2.0 Flash (Free & Fast)" },
                                    { id: "openrouter", title: "OpenRouter", subtitle: "Llama 3.1, DeepSeek, Gemma" },
                                    { id: "openai", title: "OpenAI", subtitle: "ChatGPT GPT-4o Mini & 4o" },
                                ].map((p) => {
                                    const isSelected = config.provider === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                                const nextModel =
                                                    p.id === "gemini" ? "gemini-1.5-flash" :
                                                    p.id === "openai" ? "gpt-4o-mini" :
                                                    "openrouter/free";
                                                setConfig((prev) => ({ ...prev, provider: p.id, modelName: nextModel }));
                                            }}
                                            className={`p-3 rounded-xl border text-left transition-all relative flex items-start justify-between ${
                                                isSelected
                                                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary font-semibold"
                                                    : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                                            }`}
                                        >
                                            <div>
                                                <div className="font-bold text-xs text-foreground">{p.title}</div>
                                                <div className="text-[10px] text-muted-foreground mt-0.5">{p.subtitle}</div>
                                            </div>
                                            <div className={`h-4 w-4 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                                                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/60"
                                            }`}>
                                                {isSelected && <Check size={10} strokeWidth={3} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Model Dropdown */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-foreground">Model Selection:</label>
                                {config.provider === "openrouter" && (
                                    <span className="text-[10px] text-emerald-500 font-medium">⚡ Auto-Fallback Enabled</span>
                                )}
                            </div>
                            <select
                                value={config.modelName}
                                onChange={(e) => setConfig((prev) => ({ ...prev, modelName: e.target.value }))}
                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono cursor-pointer"
                            >
                                {config.provider === "gemini" && (
                                    <>
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Fast & Free Tier)</option>
                                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen High Speed)</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced Reasoning)</option>
                                    </>
                                )}
                                {config.provider === "openrouter" && (
                                    <>
                                        <option value="openrouter/free">OpenRouter Auto (All Free Models Dynamic Router - Recommended)</option>
                                        <option value="deepseek/deepseek-r1:free">DeepSeek R1 (FREE Reasoning)</option>
                                        <option value="google/gemma-2-9b-it:free">Google Gemma 2 9B (FREE)</option>
                                        <option value="qwen/qwen-2.5-7b-instruct:free">Qwen 2.5 7B Instruct (FREE)</option>
                                        <option value="meta-llama/llama-3.3-70b-instruct:free">Meta Llama 3.3 70B Instruct (FREE)</option>
                                        <option value="mistralai/mistral-7b-instruct:free">Mistral 7B Instruct (FREE)</option>
                                        <option value="meta-llama/llama-3.1-8b-instruct:free">Meta Llama 3.1 8B Instruct</option>
                                        <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini (via OpenRouter)</option>
                                    </>
                                )}
                                {config.provider === "openai" && (
                                    <>
                                        <option value="gpt-4o-mini">GPT-4o Mini (Fast & Low Cost)</option>
                                        <option value="gpt-4o">GPT-4o (High Accuracy)</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    </>
                                )}
                            </select>
                            {config.provider === "openrouter" && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    💡 Tip: Agar koi model busy ya paid ho jaye, engine automatically aglay free model par switch kar leta hai.
                                </p>
                            )}
                        </div>

                        {/* API Key Field */}
                        <div>
                            <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <Key size={14} className="text-primary" />
                                    <span>API Key ({config.provider.toUpperCase()})</span>
                                </span>
                                <span className="text-[11px]">
                                    {config.provider === "gemini" && (
                                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80">Get Free Gemini Key ↗</a>
                                    )}
                                    {config.provider === "openrouter" && (
                                        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80">Get OpenRouter Key ↗</a>
                                    )}
                                    {config.provider === "openai" && (
                                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80">Get OpenAI Key ↗</a>
                                    )}
                                </span>
                            </label>
                            <input
                                type="password"
                                placeholder={`Enter your ${config.provider.toUpperCase()} API Key (or leave blank if set in Railway ENV)...`}
                                value={config.apiKey}
                                onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                            />
                            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Shield size={12} className="text-emerald-500 shrink-0" />
                                <span>
                                    {config.provider === "gemini" && "100% free API key from Google AI Studio. Or set GEMINI_API_KEY in Railway Variables."}
                                    {config.provider === "openrouter" && "Free models require an OpenRouter key. Or set OPENROUTER_API_KEY in Railway Variables."}
                                    {config.provider === "openai" && "OpenAI key (sk-...). Or set OPENAI_API_KEY in Railway Variables."}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Knowledge Base & FAQs Editor */}
                    <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border/40 pb-3">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <BookOpen size={18} className="text-primary" />
                                Business Knowledge Base & FAQs
                            </h3>

                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-muted-foreground mr-1">Presets:</span>
                                {PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => applyPreset(preset)}
                                        className="text-[10px] bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded-lg border border-border/40 font-medium transition-colors"
                                    >
                                        {preset.name.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Smart Menu Media Detection Banner */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3">
                            <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                                <p className="font-semibold text-primary">Smart Menu & Media Image Detection</p>
                                <p className="text-muted-foreground leading-relaxed text-[11px]">
                                    Agar aapki knowledge base mein menu ya catalog image ka link mojood ho (maslan: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-[10px]">MENU IMAGE: https://...</code>), toh customer jab bhi menu, khana ya rates maangay ga, AI automatically samajh kar customer ko <strong>Menu Image</strong> bhej dega!
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-foreground block mb-1">
                                Store Knowledge Base (Gold rates, Delivery rules, Return policy, Address, Prices):
                            </label>
                            <textarea
                                rows={10}
                                placeholder="Paste your store information, product prices, delivery timings, return policies, and FAQs here..."
                                value={config.knowledgeBase}
                                onChange={(e) => setConfig((prev) => ({ ...prev, knowledgeBase: e.target.value }))}
                                className="w-full bg-background border border-border/60 rounded-xl p-3 text-xs font-mono leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                            />
                            <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1">
                                <span>Tip: Be specific with prices, rates, and policies for accurate AI answers.</span>
                                <span>{config.knowledgeBase.length} characters</span>
                            </div>
                        </div>

                        {/* System Prompt Customization */}
                        <div>
                            <label className="text-xs font-semibold text-foreground block mb-1">
                                AI Tone & System Instructions:
                            </label>
                            <textarea
                                rows={3}
                                value={config.systemPrompt}
                                onChange={(e) => setConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                                className="w-full bg-background border border-border/60 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Live AI Playground Test Box (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col h-[640px]">
                        <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <MessageSquare size={18} className="text-primary" />
                                Live AI Playground (Test Box)
                            </h3>
                            <button
                                onClick={() =>
                                    setPlaygroundMessages([
                                        { role: "assistant", content: "Salam! Main aapki dukaan ka AI Assistant hoon. Koi bhi sawal pooch kar test karein!" }
                                    ])
                                }
                                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                                title="Clear chat history"
                            >
                                <RefreshCw size={12} /> Clear
                            </button>
                        </div>

                        {/* Messages Box */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 styled-scrollbar mb-4">
                            {playgroundMessages.map((msg, idx) => {
                                const imgTagRegex = /\[(?:SEND_IMAGE|IMAGE|SEND_MEDIA|MEDIA):\s*(https?:\/\/[^\s\]]+)\]/i;
                                const mdImgRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i;
                                const match = msg.content.match(imgTagRegex) || msg.content.match(mdImgRegex);
                                const imageUrl = match ? match[1].trim() : null;
                                const cleanContent = match ? msg.content.replace(match[0], "").trim() : msg.content;

                                return (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-sans whitespace-pre-wrap leading-relaxed shadow-sm ${
                                                msg.role === "user"
                                                    ? "bg-primary text-primary-foreground rounded-br-xs"
                                                    : "bg-muted/70 text-foreground border border-border/50 rounded-bl-xs"
                                            }`}
                                        >
                                            <div>{cleanContent || (imageUrl ? "Yeh lijiye hamara menu:" : "")}</div>
                                            {imageUrl && (
                                                <div className="mt-2.5 rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-500/10 p-2 space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                        <ImageIcon size={12} />
                                                        <span>WhatsApp Menu / Image Attachment</span>
                                                    </div>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imageUrl}
                                                        alt="Attached Menu"
                                                        className="w-full max-h-48 object-cover rounded-lg border border-border/40 shadow-sm"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = "none";
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {testingAi && (
                                <div className="flex justify-start">
                                    <div className="bg-muted/70 text-muted-foreground border border-border/50 rounded-2xl px-3.5 py-2.5 text-xs flex items-center gap-2">
                                        <Sparkles size={14} className="animate-spin text-primary" />
                                        <span>AI is generating response...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Form */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handlePlaygroundSend();
                            }}
                            className="flex items-center gap-2 pt-2 border-t border-border/40"
                        >
                            <input
                                type="text"
                                placeholder="Type a test customer question (e.g. Gold rate kya hai?)..."
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="flex-1 bg-background border border-border/60 rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                                type="submit"
                                disabled={testingAi || !userInput.trim()}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 p-2.5 rounded-xl text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                            >
                                <Send size={15} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
