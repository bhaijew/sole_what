"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Globe,
    Copy,
    Check,
    Send,
    Key,
    RefreshCw,
    Eye,
    EyeOff,
    ExternalLink,
    ShoppingBag,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Terminal,
    Code,
    Smartphone,
    Layers,
    Info,
    PlugZap,
    QrCode,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface SessionItem {
    id: string;
    sessionId: string;
    name: string;
    status: string;
}

interface ConnectWebsiteClientProps {
    sessions: SessionItem[];
    userApiKey: string | null;
}

export function ConnectWebsiteClient({ sessions, userApiKey }: ConnectWebsiteClientProps) {
    const searchParams = useSearchParams();
    const querySession = searchParams.get("session");

    // Session selection
    const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
        if (querySession && sessions.some((s) => s.sessionId === querySession)) {
            return querySession;
        }
        return sessions[0]?.sessionId || "default";
    });

    // API Key state
    const [apiKey, setApiKey] = useState<string | null>(userApiKey);
    const [showApiKey, setShowApiKey] = useState(false);
    const [generatingKey, setGeneratingKey] = useState(false);

    // Host Origin for API calls
    const [baseUrl, setBaseUrl] = useState<string>("https://solewhat-production.up.railway.app");

    // Copy states
    const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedSessionId, setCopiedSessionId] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);

    // Test alert simulator state
    const [testPhone, setTestPhone] = useState("");
    const [testName, setTestName] = useState("Ahmed Khan");
    const [testOrderId, setTestOrderId] = useState("1084");
    const [testAmount, setTestAmount] = useState("PKR 4,500");
    const [testMessage, setTestMessage] = useState(
        "Salam Ahmed Khan! 🎉 Your order #1084 has been confirmed. Total: PKR 4,500. We will notify you once your parcel is dispatched. Thank you for shopping with us!"
    );
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

    // Auto detect host URL on client mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
        }
    }, []);

    // Update test message template when name/order/amount changes
    useEffect(() => {
        setTestMessage(
            `Salam ${testName || "Customer"}! 🎉 Your order #${testOrderId || "1001"} has been confirmed. Total: ${
                testAmount || "PKR 0"
            }. We will notify you once your parcel is dispatched. Thank you for shopping with us!`
        );
    }, [testName, testOrderId, testAmount]);

    const activeSession = sessions.find((s) => s.sessionId === selectedSessionId) || sessions[0];
    const isConnected = activeSession?.status === "CONNECTED";

    const copyToClipboard = (text: string, label: string, setCopied?: (val: boolean) => void) => {
        navigator.clipboard.writeText(text);
        if (setCopied) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        toast.success(`${label} copied to clipboard!`);
    };

    const handleCopySnippet = (snippetId: string, code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedSnippet(snippetId);
        toast.success("Code snippet copied!");
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    const handleGenerateApiKey = async () => {
        setGeneratingKey(true);
        try {
            const res = await fetch("/api/user/api-key", { method: "POST" });
            const data = await res.json();
            if (data.status && data.data?.apiKey) {
                setApiKey(data.data.apiKey);
                toast.success("New API key generated successfully!");
            } else {
                toast.error(data.message || "Failed to generate API key");
            }
        } catch (error) {
            toast.error("Failed to generate API key");
        } finally {
            setGeneratingKey(false);
        }
    };

    const handleSendTestMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhone.trim()) {
            toast.error("Please enter a valid WhatsApp number with country code (e.g. 923001234567)");
            return;
        }
        if (!apiKey) {
            toast.error("Please generate an API key first");
            return;
        }

        setSendingTest(true);
        setTestResult(null);

        try {
            const res = await fetch(`/api/messages/${encodeURIComponent(selectedSessionId)}/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    to: testPhone.trim(),
                    text: testMessage,
                }),
            });

            const data = await res.json();

            if (res.ok && data.status) {
                setTestResult({
                    success: true,
                    message: "WhatsApp test order alert sent successfully! Check your phone.",
                    data,
                });
                toast.success("Test message sent successfully!");
            } else {
                setTestResult({
                    success: false,
                    message: data.message || "Failed to send message. Please ensure session is CONNECTED.",
                    data,
                });
                toast.error(data.message || "Failed to send message");
            }
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.message || "Network error while connecting to WhatsApp gateway.",
            });
            toast.error("Error sending test message");
        } finally {
            setSendingTest(false);
        }
    };

    const endpointUrl = `${baseUrl}/api/messages/${selectedSessionId}/send`;
    const safeApiKey = apiKey || "YOUR_API_KEY_HERE";

    // Code Snippets with Live Dynamic Variables
    const wooCommerceCode = `<?php
/**
 * Add this code to your WordPress active theme's functions.php
 * or use the free "Code Snippets" WordPress plugin.
 * 
 * Triggers an automated WhatsApp confirmation message to customer upon order placement.
 */
add_action('woocommerce_thankyou', 'solewhat_send_order_whatsapp_alert', 10, 1);

function solewhat_send_order_whatsapp_alert($order_id) {
    if (!$order_id) return;

    // Prevent duplicate sending if page reloaded
    if (get_post_meta($order_id, '_solewhat_whatsapp_sent', true)) {
        return;
    }

    $order = wc_get_order($order_id);
    if (!$order) return;

    // Customer details
    $phone = $order->get_billing_phone();
    $name  = $order->get_billing_first_name();
    $total = $order->get_formatted_order_total();

    if (empty($phone)) return;

    // Prepare WhatsApp Message
    $message = "Salam {$name}! 🎉\\n\\n";
    $message .= "Your order #{$order_id} has been received successfully!\\n";
    $message .= "Total Amount: {$total}\\n\\n";
    $message .= "We are preparing your items and will notify you once dispatched.\\n";
    $message .= "Thank you for shopping with us!";

    // SoleWhat WhatsApp Gateway API
    $endpoint = '${endpointUrl}';
    $api_key  = '${safeApiKey}';

    $response = wp_remote_post($endpoint, array(
        'method'    => 'POST',
        'timeout'   => 15,
        'headers'   => array(
            'Content-Type' => 'application/json',
            'x-api-key'     => $api_key,
        ),
        'body'      => wp_json_encode(array(
            'to'   => $phone,
            'text' => $message,
        )),
    ));

    // Mark as sent so it doesn't trigger again on page refresh
    if (!is_wp_error($response)) {
        update_post_meta($order_id, '_solewhat_whatsapp_sent', 'yes');
    }
}`;

    const phpRawCode = `<?php
/**
 * Send WhatsApp Order Confirmation via PHP cURL
 * Place this inside your order processing / checkout completion script.
 */

function sendWhatsAppOrderAlert($customerPhone, $customerName, $orderId, $orderTotal) {
    $endpoint = '${endpointUrl}';
    $apiKey   = '${safeApiKey}';

    $message = "Salam {$customerName}! 🎉\\n"
             . "Thank you for your order #{$orderId}.\\n"
             . "Total Amount: {$orderTotal}\\n\\n"
             . "We are processing your parcel and will notify you soon!";

    $data = array(
        "to"   => $customerPhone, // Auto-normalized (e.g. 923001234567 or +923001234567)
        "text" => $message
    );

    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey
    ));
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($httpCode === 200);
}

// Example Usage:
// sendWhatsAppOrderAlert("923001234567", "Ali Raza", "1042", "PKR 3,500");
?>`;

    const laravelCode = `<?php

namespace App\\Services;

use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Log;

class WhatsAppService
{
    /**
     * Send WhatsApp Order Confirmation to Customer
     */
    public static function sendOrderNotification($phone, $name, $orderId, $total)
    {
        $endpoint = '${endpointUrl}';
        $apiKey   = env('SOLEWHAT_API_KEY', '${safeApiKey}');

        $message = "Salam {$name}! 🎉\\n"
                 . "Your order #{$orderId} is confirmed.\\n"
                 . "Total: {$total}\\n"
                 . "Thank you for choosing us!";

        try {
            $response = Http::withHeaders([
                'x-api-key'     => $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(15)->post($endpoint, [
                'to'   => $phone,
                'text' => $message,
            ]);

            return $response->successful();
        } catch (\\Exception $e) {
            Log::error('SoleWhat WhatsApp send error: ' . $e->getMessage());
            return false;
        }
    }
}`;

    const nodeJsCode = `// Node.js / Express / Next.js API Example
import axios from "axios";

async function sendWhatsAppOrderAlert({ phone, customerName, orderId, total }) {
  const endpoint = "${endpointUrl}";
  const apiKey = "${safeApiKey}";

  const message = \`Salam \${customerName}! 🎉
Your order #\${orderId} has been confirmed.
Total: \${total}

Thank you for shopping with us! We will update you with delivery details soon.\`;

  try {
    const response = await axios.post(
      endpoint,
      {
        to: phone, // e.g. "923001234567"
        text: message,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        timeout: 15000,
      }
    );

    console.log("WhatsApp message sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to send WhatsApp alert:", error?.response?.data || error.message);
    throw error;
  }
}

// Example usage:
// sendWhatsAppOrderAlert({
//   phone: "923001234567",
//   customerName: "Ahmed",
//   orderId: "1098",
//   total: "PKR 5,200"
// });`;

    const pythonCode = `import requests

def send_whatsapp_order_alert(phone: str, customer_name: str, order_id: str, total: str):
    endpoint = "${endpointUrl}"
    api_key = "${safeApiKey}"

    message = (
        f"Salam {customer_name}! 🎉\\n"
        f"Your order #{order_id} has been received successfully.\\n"
        f"Total: {total}\\n\\n"
        f"We will notify you once your parcel is on the way. Thank you!"
    )

    payload = {
        "to": phone,  # e.g. '923001234567'
        "text": message
    }

    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }

    response = requests.post(endpoint, json=payload, headers=headers, timeout=15)
    return response.json()

# Example test call:
# result = send_whatsapp_order_alert("923001234567", "Ali", "1045", "PKR 4,000")
# print(result)`;

    const curlCode = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${safeApiKey}" \\
  -d '{
    "to": "923001234567",
    "text": "Salam Ali! 🎉 Your order #1084 is confirmed. Total: PKR 4,500."
  }'`;

    const shopifyWorkerCode = `// Shopify Webhook Receiver (Cloudflare Worker / Express / Next.js API Route)
// 1. In Shopify Admin -> Settings -> Notifications -> Webhooks
// 2. Event: "Order creation" (Format: JSON)
// 3. Webhook URL: Point to your server route running this logic:

export default async function handleShopifyOrderWebhook(req, res) {
  const order = req.body;
  
  // Extract order information
  const orderId = order.order_number || order.id;
  const customerName = order.billing_address?.first_name || order.customer?.first_name || "Valued Customer";
  const rawPhone = order.billing_address?.phone || order.customer?.phone || order.phone;
  const total = \`\${order.currency} \${order.total_price}\`;

  if (!rawPhone) {
    return res.status(200).json({ skipped: true, reason: "No phone number attached to order" });
  }

  // Format message
  const message = \`Salam \${customerName}! 🎉
Your order #\${orderId} has been confirmed.
Total: \${total}

Thank you for purchasing from our store!\`;

  // Forward to SoleWhat WhatsApp Gateway
  const response = await fetch("${endpointUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "${safeApiKey}"
    },
    body: JSON.stringify({
      to: rawPhone,
      text: message
    })
  });

  const result = await response.json();
  return res.status(200).json({ success: true, result });
}`;

    return (
        <div className="space-y-8 pb-12">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border border-primary/20 p-6 sm:p-8 shadow-sm">
                <div className="max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                        <Sparkles className="h-3.5 w-3.5" />
                        E-Commerce WhatsApp Automation
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        How to Connect Your Website With SoleWhat
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        Send automatic WhatsApp messages directly to your customers whenever an order is placed on
                        <strong> WooCommerce</strong>, <strong>Shopify</strong>, <strong>Laravel</strong>, or any custom website.
                    </p>
                </div>
            </div>

            {/* Step 1: Credentials & Configuration */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Session Selector Card */}
                <Card className="glass-panel border-border/70 shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <PlugZap className="h-4 w-4" /> Step 1: Select Session
                            </span>
                            <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                    isConnected
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300"
                                }`}
                            >
                                {isConnected ? "● Connected (Ready)" : "○ Disconnected"}
                            </span>
                        </div>
                        <CardTitle className="text-lg font-bold">Sender WhatsApp Session</CardTitle>
                        <CardDescription className="text-xs">
                            Select which WhatsApp number/device will send the automated order notifications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sessions.length === 0 ? (
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">No active sessions found.</p>
                                    <Link href="/dashboard/sessions" className="underline font-bold mt-1 inline-block">
                                        Click here to scan QR and add a session
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Choose WhatsApp Session</Label>
                                <select
                                    value={selectedSessionId}
                                    onChange={(e) => setSelectedSessionId(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer"
                                >
                                    {sessions.map((s) => (
                                        <option key={s.id} value={s.sessionId}>
                                            {s.name} ({s.sessionId}) - [{s.status}]
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Selected Session ID Box */}
                        <div className="bg-muted/60 dark:bg-card/70 border border-border/70 rounded-xl p-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-muted-foreground">Session ID (API Identifier):</span>
                                <span className="text-[11px] text-primary font-medium">Use in API URL</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 bg-background border border-border/70 rounded-lg px-3 py-1.5">
                                <code className="text-xs font-mono font-bold text-primary truncate select-all">
                                    {selectedSessionId}
                                </code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                                    onClick={() => copyToClipboard(selectedSessionId, "Session ID", setCopiedSessionId)}
                                    title="Copy Session ID"
                                >
                                    {copiedSessionId ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* API Key Card */}
                <Card className="glass-panel border-border/70 shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <Key className="h-4 w-4" /> Step 2: Your API Key
                            </span>
                        </div>
                        <CardTitle className="text-lg font-bold">API Authentication Header</CardTitle>
                        <CardDescription className="text-xs">
                            Pass this secret key in your website&apos;s request header <code>x-api-key</code>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">User API Key</Label>
                            {apiKey ? (
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            type={showApiKey ? "text" : "password"}
                                            value={apiKey}
                                            readOnly
                                            className="font-mono text-xs pr-10 bg-background select-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-10 px-3 gap-1.5"
                                        onClick={() => copyToClipboard(apiKey, "API Key", setCopiedKey)}
                                    >
                                        {copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                        {copiedKey ? "Copied" : "Copy"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-3 bg-muted/60 rounded-xl text-center space-y-2 border border-border/70">
                                    <p className="text-xs text-muted-foreground">You have not generated an API key yet.</p>
                                    <Button
                                        size="sm"
                                        onClick={handleGenerateApiKey}
                                        disabled={generatingKey}
                                        className="gap-2"
                                    >
                                        <Key className="h-3.5 w-3.5" />
                                        {generatingKey ? "Generating..." : "Generate API Key Now"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Target Endpoint Display */}
                        <div className="bg-muted/60 dark:bg-card/70 border border-border/70 rounded-xl p-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-muted-foreground">Live HTTP Endpoint:</span>
                                <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">POST</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 bg-background border border-border/70 rounded-lg px-3 py-1.5">
                                <code className="text-[11px] font-mono font-medium text-foreground truncate select-all">
                                    {endpointUrl}
                                </code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                                    onClick={() => copyToClipboard(endpointUrl, "Endpoint URL", setCopiedUrl)}
                                    title="Copy Endpoint URL"
                                >
                                    {copiedUrl ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Step 3: Interactive Ready-Made Code Snippets */}
            <Card className="glass-panel border-border/70 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/60 bg-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <Code className="h-4 w-4" /> Step 3: Copy Code For Your Website
                            </span>
                            <CardTitle className="text-xl font-bold mt-1">Integration Code Snippets</CardTitle>
                            <CardDescription className="text-xs">
                                Select your website platform. All snippets are automatically pre-filled with your live URL,
                                selected Session ID (<code className="font-mono text-primary font-bold">{selectedSessionId}</code>),
                                and API credentials.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <Tabs defaultValue="woocommerce" className="w-full">
                        <TabsList className="grid grid-cols-3 sm:grid-cols-7 mb-4 h-auto p-1 bg-muted/60 gap-1 rounded-xl">
                            <TabsTrigger value="woocommerce" className="text-xs py-2 font-medium">
                                WooCommerce
                            </TabsTrigger>
                            <TabsTrigger value="shopify" className="text-xs py-2 font-medium">
                                Shopify
                            </TabsTrigger>
                            <TabsTrigger value="php" className="text-xs py-2 font-medium">
                                Core PHP
                            </TabsTrigger>
                            <TabsTrigger value="laravel" className="text-xs py-2 font-medium">
                                Laravel
                            </TabsTrigger>
                            <TabsTrigger value="nodejs" className="text-xs py-2 font-medium">
                                Node.js / Next
                            </TabsTrigger>
                            <TabsTrigger value="python" className="text-xs py-2 font-medium">
                                Python
                            </TabsTrigger>
                            <TabsTrigger value="curl" className="text-xs py-2 font-medium">
                                cURL / API
                            </TabsTrigger>
                        </TabsList>

                        {/* WooCommerce */}
                        <TabsContent value="woocommerce" className="space-y-4 mt-2">
                            <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <ShoppingBag className="h-4 w-4" /> WooCommerce / WordPress Setup:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground dark:text-slate-300 mt-1">
                                    <li>Open your WordPress Admin &rarr; Appearance &rarr; Theme File Editor.</li>
                                    <li>Open your theme&apos;s <code className="bg-background px-1.5 py-0.5 rounded font-mono font-bold">functions.php</code> (or use the free <strong>Code Snippets</strong> plugin).</li>
                                    <li>Paste the snippet below at the bottom and click Save. That&apos;s it!</li>
                                </ol>
                            </div>

                            <div className="relative rounded-xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                                    <span className="font-mono">functions.php</span>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => handleCopySnippet("wc", wooCommerceCode)}
                                    >
                                        {copiedSnippet === "wc" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copiedSnippet === "wc" ? "Copied" : "Copy Code"}
                                    </Button>
                                </div>
                                <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-emerald-300 styled-scrollbar">
                                    {wooCommerceCode}
                                </pre>
                            </div>
                        </TabsContent>

                        {/* Shopify */}
                        <TabsContent value="shopify" className="space-y-4 mt-2">
                            <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <ShoppingBag className="h-4 w-4" /> Shopify Webhook Guide:
                                </p>
                                <p className="text-muted-foreground dark:text-slate-300">
                                    Shopify delivers order notifications via webhooks. Point your server or Cloudflare Worker / Next.js API route to receive the Shopify webhook and forward the customer WhatsApp alert to SoleWhat!
                                </p>
                            </div>

                            <div className="relative rounded-xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                                    <span className="font-mono">shopify-webhook-handler.js</span>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => handleCopySnippet("shopify", shopifyWorkerCode)}
                                    >
                                        {copiedSnippet === "shopify" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copiedSnippet === "shopify" ? "Copied" : "Copy Code"}
                                    </Button>
                                </div>
                                <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-sky-300 styled-scrollbar">
                                    {shopifyWorkerCode}
                                </pre>
                            </div>
                        </TabsContent>

                        {/* Core PHP */}
                        <TabsContent value="php" className="space-y-4 mt-2">
                            <div className="relative rounded-xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                                    <span className="font-mono">order_alert.php</span>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => handleCopySnippet("php", phpRawCode)}
                                    >
                                        {copiedSnippet === "php" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copiedSnippet === "php" ? "Copied" : "Copy Code"}
                                    </Button>
                                </div>
                                <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-purple-300 styled-scrollbar">
                                    {phpRawCode}
                                </pre>
                            </div>
                        </TabsContent>

                        {/* Laravel */}
                        <TabsContent value="laravel" className="space-y-4 mt-2">
                            <div className="relative rounded-xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                                    <span className="font-mono">app/Services/WhatsAppService.php</span>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => handleCopySnippet("laravel", laravelCode)}
                                    >
                                        {copiedSnippet === "laravel" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copiedSnippet === "laravel" ? "Copied" : "Copy Code"}
                                    </Button>
                                </div>
                                <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-amber-300 styled-scrollbar">
                                    {laravelCode}
                                </pre>
                            </div>
                        </TabsContent>

                        {/* Node.js / Next.js */}
                        <TabsContent value="nodejs" className="space-y-4 mt-2">
                            <div className="relative rounded-xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                                    <span className="font-mono">whatsapp-order-service.ts</span>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => handleCopySnippet("node", nodeJsCode)}
                                    >
                                        {copiedSnippet === "node" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copiedSnippet === "node" ? "Copied" : "Copy Code"}
                                    </Button>
                                </div>
                                <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-teal-300 styled-scrollbar">
                                    {nodeJsCode}
                                </pre>
                            </div>
                        </TabsContent>

                        {/* Python */}
                        <TabsContent value="python" className="space-y-4 mt-2">
                            <div className="relative rounded-xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                                    <span className="font-mono">whatsapp_order.py</span>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => handleCopySnippet("python", pythonCode)}
                                    >
                                        {copiedSnippet === "python" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copiedSnippet === "python" ? "Copied" : "Copy Code"}
                                    </Button>
                                </div>
                                <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-yellow-300 styled-scrollbar">
                                    {pythonCode}
                                </pre>
                            </div>
                        </TabsContent>

                        {/* cURL */}
                        <TabsContent value="curl" className="space-y-4 mt-2">
                            <div className="relative rounded-xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                                    <span className="font-mono">Terminal / cURL command</span>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={() => handleCopySnippet("curl", curlCode)}
                                    >
                                        {copiedSnippet === "curl" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copiedSnippet === "curl" ? "Copied" : "Copy Code"}
                                    </Button>
                                </div>
                                <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-emerald-400 styled-scrollbar">
                                    {curlCode}
                                </pre>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Step 4: Live Order Alert Tester Simulator */}
            <Card className="glass-panel border-border/70 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                            <Send className="h-4 w-4" /> Step 4: Test Live Order Message
                        </span>
                    </div>
                    <CardTitle className="text-xl font-bold">Live Order Simulator (Test On Your Phone)</CardTitle>
                    <CardDescription className="text-xs">
                        Enter your own WhatsApp number below to verify that your session and API credentials are working
                        perfectly before adding the code to your store.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSendTestMessage} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="testPhone" className="text-xs font-semibold">
                                    WhatsApp Phone Number <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="testPhone"
                                    type="text"
                                    placeholder="e.g. 923001234567"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    className="font-mono text-sm"
                                    required
                                />
                                <span className="text-[11px] text-muted-foreground">Country code without + or spaces</span>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="testName" className="text-xs font-semibold">
                                    Customer Name
                                </Label>
                                <Input
                                    id="testName"
                                    type="text"
                                    placeholder="Ahmed Khan"
                                    value={testName}
                                    onChange={(e) => setTestName(e.target.value)}
                                    className="text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="testOrderId" className="text-xs font-semibold">
                                    Order ID & Amount
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        id="testOrderId"
                                        type="text"
                                        placeholder="#1084"
                                        value={testOrderId}
                                        onChange={(e) => setTestOrderId(e.target.value)}
                                        className="text-sm"
                                    />
                                    <Input
                                        type="text"
                                        placeholder="PKR 4,500"
                                        value={testAmount}
                                        onChange={(e) => setTestAmount(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="testMessage" className="text-xs font-semibold">
                                Message Preview
                            </Label>
                            <Textarea
                                id="testMessage"
                                rows={3}
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                className="font-sans text-xs resize-y"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Info className="h-4 w-4 text-primary" />
                                Sending from session: <strong className="font-mono text-primary">{selectedSessionId}</strong>
                            </div>

                            <Button
                                type="submit"
                                disabled={sendingTest || !testPhone.trim()}
                                className="gap-2 w-full sm:w-auto shadow-sm"
                            >
                                {sendingTest ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Sending Alert...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Send Test Order Alert Now
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Test Result Feedback */}
                        {testResult && (
                            <div
                                className={`p-4 rounded-xl text-xs border flex items-start gap-3 mt-4 ${
                                    testResult.success
                                        ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                        : "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                                }`}
                            >
                                {testResult.success ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="space-y-1">
                                    <p className="font-semibold">{testResult.message}</p>
                                    {testResult.data && (
                                        <pre className="text-[11px] font-mono bg-background/50 p-2 rounded border border-border/50 overflow-x-auto max-h-36">
                                            {JSON.stringify(testResult.data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
