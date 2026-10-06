"use client";

import { useState, useEffect, useRef } from "react";
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
    Image as ImageIcon,
    Upload,
    Trash2
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
        systemPrompt: `You are a polite, natural, and helpful Pakistani customer support assistant for "Royal Spice Restaurant & Cafe".
Communicate warmly in polite Pakistani Roman Urdu (or English if customer speaks English).

1. GREETINGS & CASUAL CHAT (Natural Roman Urdu):
- Agar customer "aoa", "salam", ya "assalam o alaikum" likhay:
  "Walaikum Assalam! Royal Spice Cafe mein khushamdeed. Main aapki kya madad kar sakta hoon?"
- Agar customer "kay hal ha", "kia hal ha", "kaise ho" likhay:
  "Alhamdulillah main bilkul theek hoon! Aap sunayein aap kaise hain? Aaj khane mein kya pasand karein ge?"
- Agar customer dono poochay (e.g. "aoa kay hal ha"):
  "Walaikum Assalam! Alhamdulillah main theek hoon, aap sunayein kaise hain? Main aapki kya khidmat kar sakta hoon?"

2. MENU & FOOD REQUESTS (Even for single word "menu"):
- Agar customer sirf "menu", "Menu", "deals", "khana", "rate list" bhi likhay ya maangay:
  Foran polite jawab dein: "G zaroor! Yeh lijiye hamara complete menu aur special deals:" aur message ke end mein dono images attach karein: [SEND_IMAGE: https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800] [SEND_IMAGE: https://images.unsplash.com/photo-1544025162-d76694265947?w=800]
- Agar customer "aoa menu" likhay to pehle salam ka jawab dein phr menu aur images dein.

3. KNOWLEDGE BASE & ACCURACY:
- Customer ke sawalat ka jawab neeche di gayi details ke mutabiq concise aur asaan alfaaz mein dein.`,
        knowledgeBase: `RESTAURANT NAME: Royal Spice Cafe & Grill
MENU IMAGE 1: https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800
MENU IMAGE 2: https://images.unsplash.com/photo-1544025162-d76694265947?w=800
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
        enabled: true,
        provider: "openrouter",
        apiKey: "",
        modelName: "meta-llama/llama-3.1-8b-instruct:free",
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
    const [uploadingSlot, setUploadingSlot] = useState<1 | 2 | null>(null);
    const menuFile1Ref = useRef<HTMLInputElement>(null);
    const menuFile2Ref = useRef<HTMLInputElement>(null);

    // Extract active menu images (Slot 1 and Slot 2) from knowledgeBase
    const extractMenuImages = (kb: string) => {
        let image1: string | null = null;
        let image2: string | null = null;

        // 1. Look for explicit MENU IMAGE 1 / MENU IMAGE 2
        const img1Match = kb.match(/(?:MENU|CATALOG|PRICE LIST)?\s*IMAGE\s*1\s*:\s*((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\)\"\']+)/i);
        if (img1Match && img1Match[1]) image1 = img1Match[1].trim();

        const img2Match = kb.match(/(?:MENU|CATALOG|PRICE LIST)?\s*IMAGE\s*2\s*:\s*((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\)\"\']+)/i);
        if (img2Match && img2Match[1]) image2 = img2Match[1].trim();

        // 2. Generic labeled fallback
        if (!image1) {
            const singleMatch = kb.match(/(?:MENU|CATALOG|PRICE LIST|CARD)\s*(?:IMAGE|PIC|URL)?\s*:\s*((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\)\"\']+)/i);
            if (singleMatch && singleMatch[1]) {
                image1 = singleMatch[1].trim();
            }
        }

        // 3. Fallback to any detected image URLs
        if (!image1 || !image2) {
            const allUrls = kb.match(/(?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\)\"\'\,]+(?:jpg|jpeg|png|webp|gif)?/gi) || [];
            const cleanUrls = allUrls.filter(u => u.includes("/uploads/") || /\.(jpg|jpeg|png|webp|gif)/i.test(u));
            if (!image1 && cleanUrls[0]) image1 = cleanUrls[0];
            if (!image2 && cleanUrls[1] && cleanUrls[1] !== image1) image2 = cleanUrls[1];
        }

        return { image1, image2 };
    };

    const { image1: currentMenuImage1, image2: currentMenuImage2 } = extractMenuImages(config.knowledgeBase);

    const applyImagesToConfig = (
        prevKb: string,
        prevPrompt: string,
        newImg1: string | null,
        newImg2: string | null
    ) => {
        let updatedKb = prevKb
            .replace(/(?:MENU|CATALOG|PRICE LIST)?\s*IMAGE\s*1\s*:\s*[^\r\n]+(\r?\n)?/gi, "")
            .replace(/(?:MENU|CATALOG|PRICE LIST)?\s*IMAGE\s*2\s*:\s*[^\r\n]+(\r?\n)?/gi, "")
            .replace(/(?:MENU|CATALOG|PRICE LIST|CARD)\s*(?:IMAGE|PIC|URL)?\s*:\s*[^\r\n]+(\r?\n)?/gi, "")
            .trim();

        const headers: string[] = [];
        if (newImg1) headers.push(`MENU IMAGE 1: ${newImg1}`);
        if (newImg2) headers.push(`MENU IMAGE 2: ${newImg2}`);

        if (headers.length > 0) {
            updatedKb = `${headers.join("\n")}\n\n${updatedKb}`;
        }

        let updatedPrompt = prevPrompt
            .replace(/(\r?\n)?When the customer asks for the menu[^\n\r]+\[SEND_IMAGE:[^\]]+\](?:\s*\[SEND_IMAGE:[^\]]+\])?/gi, "")
            .trim();

        if (newImg1 && newImg2) {
            updatedPrompt = `${updatedPrompt}\nWhen the customer asks for the menu, food items, deals, or prices, politely answer and append: [SEND_IMAGE: ${newImg1}] [SEND_IMAGE: ${newImg2}]`;
        } else if (newImg1 || newImg2) {
            const single = newImg1 || newImg2;
            updatedPrompt = `${updatedPrompt}\nWhen the customer asks for the menu, food items, deals, or prices, politely answer and append: [SEND_IMAGE: ${single}]`;
        }

        return { updatedKb, updatedPrompt };
    };

    const persistConfigToDb = async (updatedConfig: AiConfigData, toastId?: string | number) => {
        if (!selectedSessionId) {
            if (toastId) toast.error("Please select a session first", { id: toastId });
            return false;
        }
        try {
            const res = await fetch(`/api/sessions/${selectedSessionId}/ai-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedConfig)
            });
            const data = await res.json();
            if (data.status) {
                if (toastId) toast.success("Image saved & active in AI Bot!", { id: toastId });
                return true;
            } else {
                if (toastId) toast.error(data.message || "Failed to save configuration", { id: toastId });
                return false;
            }
        } catch (err: any) {
            if (toastId) toast.error(err.message || "Network error while saving", { id: toastId });
            return false;
        }
    };

    const handleMenuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingSlot(slot);
        const toastId = toast.loading(`Uploading & Saving Image ${slot}...`);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (data.status && data.data?.url) {
                const uploadedUrl = data.data.url;

                const { image1, image2 } = extractMenuImages(config.knowledgeBase);
                const newImg1 = slot === 1 ? uploadedUrl : image1;
                const newImg2 = slot === 2 ? uploadedUrl : image2;

                const { updatedKb, updatedPrompt } = applyImagesToConfig(
                    config.knowledgeBase,
                    config.systemPrompt,
                    newImg1,
                    newImg2
                );

                const newConfig: AiConfigData = {
                    ...config,
                    knowledgeBase: updatedKb,
                    systemPrompt: updatedPrompt
                };

                setConfig(newConfig);
                await persistConfigToDb(newConfig, toastId);
            } else {
                toast.error(data.message || "Failed to upload image", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "Upload error", { id: toastId });
        } finally {
            setUploadingSlot(null);
            if (slot === 1 && menuFile1Ref.current) menuFile1Ref.current.value = "";
            if (slot === 2 && menuFile2Ref.current) menuFile2Ref.current.value = "";
        }
    };

    const handleRemoveMenuImage = async (slot: 1 | 2) => {
        const toastId = toast.loading(`Removing Image ${slot}...`);
        const { image1, image2 } = extractMenuImages(config.knowledgeBase);
        const newImg1 = slot === 1 ? null : image1;
        const newImg2 = slot === 2 ? null : image2;

        const { updatedKb, updatedPrompt } = applyImagesToConfig(
            config.knowledgeBase,
            config.systemPrompt,
            newImg1,
            newImg2
        );

        const newConfig: AiConfigData = {
            ...config,
            knowledgeBase: updatedKb,
            systemPrompt: updatedPrompt
        };

        setConfig(newConfig);
        await persistConfigToDb(newConfig, toastId);
    };

    const handleSetImageUrl = async (slot: 1 | 2, url: string) => {
        const trimmed = url.trim();
        if (!trimmed) return;
        const toastId = toast.loading(`Saving Image ${slot} URL...`);
        const { image1, image2 } = extractMenuImages(config.knowledgeBase);
        const newImg1 = slot === 1 ? trimmed : image1;
        const newImg2 = slot === 2 ? trimmed : image2;

        const { updatedKb, updatedPrompt } = applyImagesToConfig(
            config.knowledgeBase,
            config.systemPrompt,
            newImg1,
            newImg2
        );

        const newConfig: AiConfigData = {
            ...config,
            knowledgeBase: updatedKb,
            systemPrompt: updatedPrompt
        };

        setConfig(newConfig);
        await persistConfigToDb(newConfig, toastId);
    };

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
                        systemPrompt: res.data.systemPrompt !== null && res.data.systemPrompt !== undefined ? res.data.systemPrompt : PRESETS[0].systemPrompt,
                        knowledgeBase: res.data.knowledgeBase !== null && res.data.knowledgeBase !== undefined ? res.data.knowledgeBase : PRESETS[0].knowledgeBase,
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
                    {/* Automated Multi-Engine AI Gateway */}
                    <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <Cpu size={18} className="text-primary" />
                                Automated Multi-Engine AI Gateway
                            </h3>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Multi-Provider Auto Failover
                            </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Backend automatic failover active hai. Jab kisi aik AI engine ke tokens ya rate-limits khatam hotay hain, system <b>foran aur automatically</b> aglay provider par switch kar leta hai.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-1">
                                <div className="text-[11px] font-bold text-foreground">Groq LPU</div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">⚡ Ultra Fast (0.3s)</div>
                            </div>
                            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 text-center space-y-1">
                                <div className="text-[11px] font-bold text-foreground">OpenRouter</div>
                                <div className="text-[10px] text-primary font-semibold">Llama 3.1 & DeepSeek</div>
                            </div>
                            <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-center space-y-1">
                                <div className="text-[11px] font-bold text-foreground">Google Gemini</div>
                                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">Gemini 3.8 & Flash</div>
                            </div>
                            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center space-y-1">
                                <div className="text-[11px] font-bold text-foreground">Smart Fallback</div>
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Roman Urdu Always-On</div>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground flex items-center gap-2">
                            <Shield size={16} className="text-primary shrink-0" />
                            <span>Zero Manual Setup: Sab API keys backend par configured hain. Token khatam honay par auto-switch ho jata hai.</span>
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
                                <p className="font-semibold text-primary">Smart 2-Image Auto-Sender (Menu Page 1 & Page 2)</p>
                                <p className="text-muted-foreground leading-relaxed text-[11px]">
                                    Aap yahan <strong>2 Menu Images (Page 1 aur Page 2 / Deals)</strong> upload kar sakte hain. Customer jab bhi WhatsApp par menu ya prices maangay ga, AI automatically <strong>dono images</strong> sequence mein send karega!
                                </p>
                            </div>
                        </div>

                        {/* Dual Menu Image Uploader (Slot 1 & Slot 2) */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <ImageIcon size={15} className="text-primary" />
                                    <span>Menu & Media Images (2 Upload Slots)</span>
                                </label>
                                <span className="text-[10px] text-muted-foreground">
                                    {currentMenuImage1 && currentMenuImage2 ? "2 Images Active" : currentMenuImage1 || currentMenuImage2 ? "1 Image Active" : "No Images Uploaded"}
                                </span>
                            </div>

                            {/* Hidden file inputs for both slots */}
                            <input
                                type="file"
                                ref={menuFile1Ref}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleMenuImageUpload(e, 1)}
                            />
                            <input
                                type="file"
                                ref={menuFile2Ref}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleMenuImageUpload(e, 2)}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* SLOT 1: Menu Image 1 (Front / Page 1) */}
                                <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">1</span>
                                            <div>
                                                <h4 className="text-xs font-semibold text-foreground">Menu Image 1 (Front / Page 1)</h4>
                                                <p className="text-[10px] text-muted-foreground">Main menu card</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => menuFile1Ref.current?.click()}
                                            disabled={uploadingSlot === 1}
                                            className="text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                                        >
                                            <Upload size={12} />
                                            {uploadingSlot === 1 ? "Uploading..." : currentMenuImage1 ? "Change" : "Upload"}
                                        </button>
                                    </div>

                                    {currentMenuImage1 ? (
                                        <div className="flex items-center gap-2.5 bg-background border border-border/60 rounded-lg p-2">
                                            <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden border border-border/50 bg-muted">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={currentMenuImage1}
                                                    alt="Menu 1"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                                                    <CheckCircle2 size={10} /> Ready to send
                                                </span>
                                                <p className="text-[10px] font-mono text-muted-foreground truncate">{currentMenuImage1}</p>
                                                <div className="flex items-center gap-2 text-[10px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => menuFile1Ref.current?.click()}
                                                        className="text-primary hover:underline font-medium"
                                                    >
                                                        Replace
                                                    </button>
                                                    <span className="text-muted-foreground/40">•</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMenuImage(1)}
                                                        className="text-destructive hover:underline font-medium flex items-center gap-0.5"
                                                    >
                                                        <Trash2 size={10} /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => menuFile1Ref.current?.click()}
                                            className="border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-lg p-3 text-center cursor-pointer space-y-1 group"
                                        >
                                            <div className="mx-auto w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                <Upload size={13} />
                                            </div>
                                            <p className="text-xs font-semibold text-foreground">Upload Image 1</p>
                                            <p className="text-[10px] text-muted-foreground">Menu Front / Page 1 (JPG, PNG)</p>
                                        </div>
                                    )}
                                </div>

                                {/* SLOT 2: Menu Image 2 (Back / Page 2 / Deals) */}
                                <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">2</span>
                                            <div>
                                                <h4 className="text-xs font-semibold text-foreground">Menu Image 2 (Back / Page 2)</h4>
                                                <p className="text-[10px] text-muted-foreground">Deals, drinks or back side</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => menuFile2Ref.current?.click()}
                                            disabled={uploadingSlot === 2}
                                            className="text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                                        >
                                            <Upload size={12} />
                                            {uploadingSlot === 2 ? "Uploading..." : currentMenuImage2 ? "Change" : "Upload"}
                                        </button>
                                    </div>

                                    {currentMenuImage2 ? (
                                        <div className="flex items-center gap-2.5 bg-background border border-border/60 rounded-lg p-2">
                                            <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden border border-border/50 bg-muted">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={currentMenuImage2}
                                                    alt="Menu 2"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                                                    <CheckCircle2 size={10} /> Ready to send
                                                </span>
                                                <p className="text-[10px] font-mono text-muted-foreground truncate">{currentMenuImage2}</p>
                                                <div className="flex items-center gap-2 text-[10px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => menuFile2Ref.current?.click()}
                                                        className="text-primary hover:underline font-medium"
                                                    >
                                                        Replace
                                                    </button>
                                                    <span className="text-muted-foreground/40">•</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMenuImage(2)}
                                                        className="text-destructive hover:underline font-medium flex items-center gap-0.5"
                                                    >
                                                        <Trash2 size={10} /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => menuFile2Ref.current?.click()}
                                            className="border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-lg p-3 text-center cursor-pointer space-y-1 group"
                                        >
                                            <div className="mx-auto w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                <Upload size={13} />
                                            </div>
                                            <p className="text-xs font-semibold text-foreground">Upload Image 2</p>
                                            <p className="text-[10px] text-muted-foreground">Menu Back / Page 2 (Optional)</p>
                                        </div>
                                    )}
                                </div>
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
                                const imgTagRegex = /\[(?:SEND_IMAGE|IMAGE|SEND_MEDIA|MEDIA):\s*((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\]]+)\]/gi;
                                const mdImgRegex = /!\[.*?\]\(((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\)]+)\)/gi;

                                const msgImages: string[] = [];
                                let tagM;
                                while ((tagM = imgTagRegex.exec(msg.content)) !== null) {
                                    if (tagM[1] && !msgImages.includes(tagM[1].trim())) {
                                        msgImages.push(tagM[1].trim());
                                    }
                                }
                                let mdM;
                                while ((mdM = mdImgRegex.exec(msg.content)) !== null) {
                                    if (mdM[1] && !msgImages.includes(mdM[1].trim())) {
                                        msgImages.push(mdM[1].trim());
                                    }
                                }

                                const cleanContent = msg.content
                                    .replace(/\[(?:SEND_IMAGE|IMAGE|SEND_MEDIA|MEDIA):\s*(?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\]]+\]/gi, "")
                                    .replace(/!\[.*?\]\((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\)]+\)/gi, "")
                                    .trim();

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
                                            <div>{cleanContent || (msgImages.length > 0 ? "Yeh lijiye hamara menu:" : "")}</div>
                                            {msgImages.length > 0 && (
                                                <div className="mt-2.5 space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                        <ImageIcon size={12} />
                                                        <span>WhatsApp Auto-Send ({msgImages.length} Image{msgImages.length > 1 ? "s" : ""})</span>
                                                    </div>
                                                    <div className={`grid gap-2 ${msgImages.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                                                        {msgImages.map((imgUrl, imgIdx) => (
                                                            <div key={imgIdx} className="rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-500/10 p-1.5 space-y-1">
                                                                <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 block px-0.5">
                                                                    {imgIdx === 0 ? "📄 Page 1 (Front)" : imgIdx === 1 ? "📄 Page 2 (Back / Deals)" : `Image ${imgIdx + 1}`}
                                                                </span>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={imgUrl}
                                                                    alt={`Attached Menu ${imgIdx + 1}`}
                                                                    className="w-full h-32 object-cover rounded-lg border border-border/40 shadow-sm"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLElement).style.display = "none";
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
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
