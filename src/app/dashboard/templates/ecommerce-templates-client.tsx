"use client";

import { useState, useEffect } from "react";
import { 
    ShoppingBag, 
    Truck, 
    ShoppingCart, 
    CreditCard, 
    ShieldCheck, 
    Copy, 
    Check, 
    Code2, 
    Send, 
    Sparkles, 
    Search,
    ExternalLink,
    Terminal,
    Layers,
    Bot,
    Zap,
    MessageSquare,
    Phone,
    X,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Template {
    id: string;
    title: string;
    category: "order_placed" | "shipping" | "abandoned_cart" | "payment" | "cod_verification";
    categoryLabel: string;
    icon: any;
    description: string;
    platforms: ("Shopify" | "WooCommerce" | "Custom API")[];
    variables: string[];
    sampleText: string;
    defaultData: Record<string, string>;
    codeSnippetData: {
        payloadKey: string;
        exampleJson: Record<string, any>;
    };
}

const TEMPLATES: Template[] = [
    {
        id: "order_placed_1",
        title: "Order Placed Confirmation",
        category: "order_placed",
        categoryLabel: "Order Placed",
        icon: ShoppingBag,
        description: "Sent immediately after a customer places an order on your website/store.",
        platforms: ["Shopify", "WooCommerce", "Custom API"],
        variables: ["{{name}}", "{{order_id}}", "{{total}}", "{{items}}", "{{address}}"],
        sampleText: "Salam {{name}}! 👋\n\nAapka Order #{{order_id}} confirm ho gaya hai.\n\n📦 *Order Items:* {{items}}\n💰 *Total Amount:* PKR {{total}}\n📍 *Delivery Address:* {{address}}\n\nAapka order 2-3 working days mein deliver ho jayega. Shukriya!",
        defaultData: {
            name: "Ahmed Ali",
            order_id: "1085",
            total: "15,500",
            items: "24k Gold Plated Ring (Qty: 1)",
            address: "House 12, Block 4, Gulberg, Lahore"
        },
        codeSnippetData: {
            payloadKey: "order_placed",
            exampleJson: {
                name: "Ahmed Ali",
                order_id: "1085",
                total: "15500",
                items: "24k Gold Plated Ring"
            }
        }
    },
    {
        id: "shipping_update_1",
        title: "Shipping & Courier Tracking",
        category: "shipping",
        categoryLabel: "Shipping Update",
        icon: Truck,
        description: "Sent when the order is dispatched with a courier tracking ID and link.",
        platforms: ["Shopify", "WooCommerce", "Custom API"],
        variables: ["{{name}}", "{{order_id}}", "{{courier}}", "{{tracking_id}}", "{{tracking_url}}"],
        sampleText: "Salam {{name}}! 🚚\n\nAapka order #{{order_id}} dispatch kar diya gaya hai.\n\n📦 *Courier:* {{courier}}\n🔖 *Tracking ID:* {{tracking_id}}\n🔗 *Track Order:* {{tracking_url}}\n\nParcel receive hone par humein zaroor feedback dein!",
        defaultData: {
            name: "Fatima Khan",
            order_id: "1085",
            courier: "TCS Courier",
            tracking_id: "TCS-9981240",
            tracking_url: "https://tcs.com/track/TCS-9981240"
        },
        codeSnippetData: {
            payloadKey: "shipping_update",
            exampleJson: {
                name: "Fatima Khan",
                order_id: "1085",
                courier: "TCS Express",
                tracking_id: "TCS-9981240"
            }
        }
    },
    {
        id: "abandoned_cart_1",
        title: "Abandoned Cart Recovery",
        category: "abandoned_cart",
        categoryLabel: "Abandoned Cart",
        icon: ShoppingCart,
        description: "Sent 30-60 mins after a customer leaves items in their cart without checking out.",
        platforms: ["Shopify", "WooCommerce", "Custom API"],
        variables: ["{{name}}", "{{items}}", "{{discount_code}}", "{{cart_url}}"],
        sampleText: "Salam {{name}}! 🛒\n\nAapne apni cart mein items chhor diye thay:\n*{{items}}*\n\n🎁 Special Offer: Use code *{{discount_code}}* for *10% OFF*!\n\n👇 Abhi order complete karein:\n{{cart_url}}",
        defaultData: {
            name: "Zainab Raza",
            items: "Bridal Jewellery Set",
            discount_code: "SAVE10NOW",
            cart_url: "https://yourstore.com/cart?token=abc123xyz"
        },
        codeSnippetData: {
            payloadKey: "abandoned_cart",
            exampleJson: {
                name: "Zainab Raza",
                items: "Bridal Set",
                cart_url: "https://yourstore.com/checkout"
            }
        }
    },
    {
        id: "payment_received_1",
        title: "Payment Receipt Confirmation",
        category: "payment",
        categoryLabel: "Payment Received",
        icon: CreditCard,
        description: "Sent when advance payment (Bank Transfer / JazzCash / EasyPaisa) is verified.",
        platforms: ["Shopify", "WooCommerce", "Custom API"],
        variables: ["{{name}}", "{{amount}}", "{{payment_id}}", "{{method}}"],
        sampleText: "Salam {{name}}! 💳\n\nAapki PKR {{amount}} ki payment successfully receive ho gayi hai.\n\n📑 *Payment ID:* {{payment_id}}\n🏦 *Method:* {{method}}\n\nAapka order processing mein chala gaya hai.",
        defaultData: {
            name: "Hamza Sheikh",
            amount: "45,000",
            payment_id: "TXN-8841029",
            method: "Bank Transfer (Meezan)"
        },
        codeSnippetData: {
            payloadKey: "payment_received",
            exampleJson: {
                name: "Hamza Sheikh",
                amount: "45000",
                payment_id: "TXN-8841029"
            }
        }
    },
    {
        id: "cod_verification_1",
        title: "COD Order Phone Verification",
        category: "cod_verification",
        categoryLabel: "COD Verification",
        icon: ShieldCheck,
        description: "Ask customer to confirm Cash on Delivery order to reduce fake returns.",
        platforms: ["Shopify", "WooCommerce", "Custom API"],
        variables: ["{{name}}", "{{order_id}}", "{{total}}"],
        sampleText: "Salam {{name}}! 📦\n\nAapne PKR {{total}} ka Order #{{order_id}} Cash on Delivery par place kiya hai.\n\nOrder confirm karne ke liye is message par *1* reply karein.\nCancel karne ke liye *2* reply karein.\n\nShukriya!",
        defaultData: {
            name: "Usman Malik",
            order_id: "1092",
            total: "8,900"
        },
        codeSnippetData: {
            payloadKey: "cod_verification",
            exampleJson: {
                name: "Usman Malik",
                order_id: "1092"
            }
        }
    }
];

export default function EcommerceTemplatesClient() {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Sessions & API key state
    const [sessions, setSessions] = useState<{ sessionId: string; name: string; status: string }[]>([]);
    const [apiKey, setApiKey] = useState<string>("YOUR_SOLE_WHAT_API_KEY");
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");

    // Modal state
    const [codeModalTemplate, setCodeModalTemplate] = useState<Template | null>(null);
    const [testModalTemplate, setTestModalTemplate] = useState<Template | null>(null);
    const [activeTabLanguage, setActiveTabLanguage] = useState<"node" | "curl" | "php" | "woocommerce">("node");

    // Test send form state
    const [testPhoneNumber, setTestPhoneNumber] = useState<string>("");
    const [testVariablesData, setTestVariablesData] = useState<Record<string, string>>({});
    const [sendingTest, setSendingTest] = useState<boolean>(false);

    useEffect(() => {
        // Fetch sessions
        fetch("/api/sessions")
            .then((res) => res.json())
            .then((res) => {
                if (res.status && Array.isArray(res.data)) {
                    setSessions(res.data);
                    const connected = res.data.find((s: any) => s.status === "CONNECTED");
                    if (connected) {
                        setSelectedSessionId(connected.sessionId);
                    } else if (res.data[0]) {
                        setSelectedSessionId(res.data[0].sessionId);
                    }
                }
            })
            .catch(() => {});

        // Fetch User API Key
        fetch("/api/settings/system")
            .then((res) => res.json())
            .then((res) => {
                if (res.data?.apiKey) {
                    setApiKey(res.data.apiKey);
                }
            })
            .catch(() => {});
    }, []);

    const filteredTemplates = TEMPLATES.filter((t) => {
        const matchesCat = selectedCategory === "all" || t.category === selectedCategory;
        const matchesPlatform = selectedPlatform === "all" || t.platforms.includes(selectedPlatform as any);
        const matchesSearch =
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.sampleText.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesPlatform && matchesSearch;
    });

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Template copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const openTestModal = (template: Template) => {
        setTestModalTemplate(template);
        setTestVariablesData(template.defaultData);
    };

    const getRenderedSampleText = (template: Template, customData?: Record<string, string>) => {
        const data = customData || template.defaultData;
        let text = template.sampleText;
        Object.entries(data).forEach(([key, value]) => {
            text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
        });
        return text;
    };

    const handleSendTestMessage = async () => {
        if (!testPhoneNumber) {
            toast.error("Please enter a target phone number!");
            return;
        }
        if (!selectedSessionId) {
            toast.error("Please select an active WhatsApp session!");
            return;
        }

        setSendingTest(true);
        const renderedMessage = getRenderedSampleText(testModalTemplate!, testVariablesData);

        // Format phone JID
        let cleanedPhone = testPhoneNumber.replace(/[^0-9]/g, "");
        if (!cleanedPhone.endsWith("@s.whatsapp.net")) {
            cleanedPhone = `${cleanedPhone}@s.whatsapp.net`;
        }

        try {
            const res = await fetch(`/api/messages/${selectedSessionId}/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    to: cleanedPhone,
                    text: renderedMessage,
                }),
            });

            const text = await res.text();
            let data: any = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error("Server returned HTML response. Check if session is connected.");
            }

            if (res.ok && data.status) {
                toast.success("Test WhatsApp message sent successfully!");
                setTestModalTemplate(null);
            } else {
                toast.error(data.message || data.error || `Failed to send message (HTTP ${res.status})`);
            }
        } catch (err: any) {
            toast.error("Error sending message: " + err.message);
        } finally {
            setSendingTest(false);
        }
    };

    const getCodeSnippet = (template: Template, lang: "node" | "curl" | "php" | "woocommerce") => {
        const domain = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
        const session = selectedSessionId || "YOUR_SESSION_ID";
        const renderedText = getRenderedSampleText(template);

        if (lang === "node") {
            return `// Node.js (Fetch) Example
const fetch = require('node-fetch');

async function sendWhatsAppNotification(toPhoneNumber) {
  const url = '${domain}/api/messages/${session}/send';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${apiKey}'
    },
    body: JSON.stringify({
      to: toPhoneNumber + '@s.whatsapp.net',
      text: \`${renderedText.replace(/`/g, "\\`")}\`
    })
  });

  const result = await response.json();
  console.log('WhatsApp Result:', result);
}

// Usage:
sendWhatsAppNotification('923001234567');`;
        }

        if (lang === "curl") {
            return `# cURL Request
curl -X POST "${domain}/api/messages/${session}/send" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "to": "923001234567@s.whatsapp.net",
    "text": ${JSON.stringify(renderedText)}
  }'`;
        }

        if (lang === "php") {
            return `<?php
// PHP cURL Example for ${template.title}

$phoneNumber = '923001234567'; // Customer phone number
$apiUrl = '${domain}/api/messages/${session}/send';

$messageText = <<<EOT
${renderedText}
EOT;

$payload = json_encode([
    'to' => $phoneNumber . '@s.whatsapp.net',
    'text' => $messageText
]);

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ${apiKey}'
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`;
        }

        if (lang === "woocommerce") {
            return `<?php
/**
 * Add this to your WooCommerce theme's functions.php or custom plugin
 * Automatically sends WhatsApp message on New Order!
 */
add_action('woocommerce_thankyou', 'send_sole_what_whatsapp_order_notification', 10, 1);

function send_sole_what_whatsapp_order_notification($order_id) {
    if (!$order_id) return;
    $order = wc_get_order($order_id);
    
    // Get customer phone & format (remove leading 0 or +)
    $phone = preg_replace('/[^0-9]/', '', $order->get_billing_phone());
    if (strlen($phone) == 11 && substr($phone, 0, 1) == '0') {
        $phone = '92' . substr($phone, 1); // Replace 0300 with 92300 for PK
    }
    
    $customer_name = $order->get_billing_first_name() . ' ' . $order->get_billing_last_name();
    $total_amount = $order->get_total();
    
    $api_url = '${domain}/api/messages/${session}/send';
    
    $message = "Salam " . $customer_name . "! 👋\\n\\n";
    $message .= "Aapka Order #" . $order_id . " confirm ho gaya hai!\\n";
    $message .= "💰 Total: PKR " . $total_amount . "\\n\\n";
    $message .= "Shukriya!";

    $body = json_encode([
        'to' => $phone . '@s.whatsapp.net',
        'text' => $message
    ]);

    wp_remote_post($api_url, [
        'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ${apiKey}'
        ],
        'body' => $body,
        'timeout' => 15
    ]);
}`;
        }

        return "";
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
                        <Sparkles size={16} />
                        <span>Automation & E-Commerce Integration</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                        E-Commerce Presets & Webhook Guides
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Ready-to-use WhatsApp message templates for Jewellers, Shopify, WooCommerce & Custom Websites.
                    </p>
                </div>

                {/* Session Selector */}
                <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/50">
                    <Bot className="h-5 w-5 text-primary" />
                    <div className="text-xs">
                        <div className="font-medium text-foreground">Active Session</div>
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

            {/* Quick Stats / Info Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary mt-0.5">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Instant Integration</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Copy 1-click cURL/PHP code directly into your website backend.
                        </p>
                    </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 mt-0.5">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">COD Fraud Reduction</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Send interactive confirmation alerts to stop fake COD orders.
                        </p>
                    </div>
                </div>

                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500 mt-0.5">
                        <ShoppingCart size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Recover Abandoned Carts</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Send discount reminders on WhatsApp to boost sales up to 30%.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card/60 border border-border/50 p-4 rounded-2xl backdrop-blur-sm">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                    {[
                        { id: "all", label: "All Templates" },
                        { id: "order_placed", label: "Order Placed" },
                        { id: "shipping", label: "Shipping" },
                        { id: "abandoned_cart", label: "Abandoned Cart" },
                        { id: "payment", label: "Payment" },
                        { id: "cod_verification", label: "COD Verify" },
                    ].map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                selectedCategory === cat.id
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Search & Platform Filter */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-border/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="bg-background border border-border/60 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                        <option value="all">All Platforms</option>
                        <option value="Shopify">Shopify</option>
                        <option value="WooCommerce">WooCommerce</option>
                        <option value="Custom API">Custom API</option>
                    </select>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                        <div
                            key={template.id}
                            className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                        >
                            {/* Accent indicator */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-purple-500/80 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div>
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground text-base leading-tight">
                                                {template.title}
                                            </h3>
                                            <span className="inline-block mt-0.5 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                {template.categoryLabel}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Platform Badges */}
                                    <div className="flex gap-1 flex-wrap justify-end">
                                        {template.platforms.map((p) => (
                                            <span
                                                key={p}
                                                className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border/40"
                                            >
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground mb-4">{template.description}</p>

                                {/* Variables Tags */}
                                <div className="mb-3">
                                    <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">
                                        Dynamic Variables:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {template.variables.map((v) => (
                                            <code
                                                key={v}
                                                className="text-[10px] bg-primary/5 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-mono"
                                            >
                                                {v}
                                            </code>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview Box */}
                                <div className="bg-muted/40 border border-border/50 rounded-xl p-3.5 mb-4 relative font-sans text-xs whitespace-pre-wrap leading-relaxed text-foreground/90 font-normal">
                                    {template.sampleText}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                                <button
                                    onClick={() => handleCopy(template.id, template.sampleText)}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-muted/60 hover:bg-muted text-foreground px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                                >
                                    {copiedId === template.id ? (
                                        <>
                                            <Check size={14} className="text-emerald-500" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            <span>Copy Template</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => setCodeModalTemplate(template)}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                                >
                                    <Code2 size={14} />
                                    <span>Get Code Snippet</span>
                                </button>

                                <button
                                    onClick={() => openTestModal(template)}
                                    className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-xl text-xs font-medium transition-colors shadow-sm"
                                    title="Send test message to your phone"
                                >
                                    <Send size={14} />
                                    <span>Test</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Code Snippet Modal */}
            <Dialog open={!!codeModalTemplate} onOpenChange={() => setCodeModalTemplate(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <Code2 className="h-5 w-5 text-primary" />
                            API & Webhook Integration Code: {codeModalTemplate?.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Copy this code snippet directly into your website backend to trigger WhatsApp messages automatically.
                        </DialogDescription>
                    </DialogHeader>

                    {codeModalTemplate && (
                        <div className="space-y-4 pt-2">
                            {/* Language / Platform Tabs */}
                            <div className="flex border-b border-border/50 gap-2">
                                {[
                                    { id: "node", label: "Node.js (Fetch)" },
                                    { id: "curl", label: "cURL" },
                                    { id: "php", label: "PHP (cURL)" },
                                    { id: "woocommerce", label: "WooCommerce (functions.php)" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTabLanguage(tab.id as any)}
                                        className={`px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                                            activeTabLanguage === tab.id
                                                ? "border-primary text-primary font-semibold"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Code Box */}
                            <div className="relative bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                                <button
                                    onClick={() => {
                                        const code = getCodeSnippet(codeModalTemplate, activeTabLanguage);
                                        navigator.clipboard.writeText(code);
                                        toast.success("Code snippet copied to clipboard!");
                                    }}
                                    className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors border border-slate-700"
                                >
                                    <Copy size={13} />
                                    <span>Copy Code</span>
                                </button>
                                <pre>{getCodeSnippet(codeModalTemplate, activeTabLanguage)}</pre>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold">Note:</span> Make sure your WhatsApp session (
                                    <code className="font-mono">{selectedSessionId || "Session ID"}</code>) is connected via QR code in <a href="/dashboard/sessions" className="underline font-semibold">Sessions Page</a> before calling this API.
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Test Send Modal */}
            <Dialog open={!!testModalTemplate} onOpenChange={() => setTestModalTemplate(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <Send className="h-5 w-5 text-primary" />
                            Test Send: {testModalTemplate?.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Send a live test message to your WhatsApp number with sample data.
                        </DialogDescription>
                    </DialogHeader>

                    {testModalTemplate && (
                        <div className="space-y-4 pt-2">
                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-1">
                                    Target WhatsApp Phone Number *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 923001234567"
                                    value={testPhoneNumber}
                                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                                />
                                <span className="text-[10px] text-muted-foreground mt-1 block">
                                    Include country code without + or spaces (e.g. 923001234567 for PK).
                                </span>
                            </div>

                            {/* Variable Inputs */}
                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-2">
                                    Custom Sample Variables Data:
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {Object.keys(testModalTemplate.defaultData).map((key) => (
                                        <div key={key} className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-primary bg-primary/5 border border-primary/20 px-2 py-1 rounded w-32 truncate">
                                                {"{{" + key + "}}"}
                                            </span>
                                            <input
                                                type="text"
                                                value={testVariablesData[key] || ""}
                                                onChange={(e) =>
                                                    setTestVariablesData({
                                                        ...testVariablesData,
                                                        [key]: e.target.value,
                                                    })
                                                }
                                                className="flex-1 bg-background border border-border/60 rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live Message Preview */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                    Rendered Message Preview:
                                </label>
                                <div className="bg-muted/50 border border-border/60 rounded-xl p-3 text-xs whitespace-pre-wrap leading-relaxed text-foreground font-sans">
                                    {getRenderedSampleText(testModalTemplate, testVariablesData)}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                                <button
                                    onClick={() => setTestModalTemplate(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendTestMessage}
                                    disabled={sendingTest}
                                    className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {sendingTest ? (
                                        <span>Sending...</span>
                                    ) : (
                                        <>
                                            <Send size={14} />
                                            <span>Send Test Message</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
