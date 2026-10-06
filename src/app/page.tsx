import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Zap,
  Shield,
  Globe,
  MessageSquare,
  Clock,
  Code,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Layers,
  Smartphone,
  CheckCircle2,
  Image as ImageIcon,
  Send,
  Truck,
  QrCode,
  Users,
  Check,
  Building2,
  UtensilsCrossed,
  Gem,
  Scissors
} from "lucide-react";
import { Button } from "@/components/ui/button";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "SoleWhat | AI-Powered WhatsApp Business Gateway & E-Commerce Automation",
  description: "Next-gen multi-device WhatsApp automation. Features AI Auto-Responder with 2-image visual menu sender, automated Shopify & WooCommerce order notifications, drip sequences, and multi-agent live chat CRM.",
  openGraph: {
    title: "SoleWhat | AI-Powered WhatsApp Business Gateway",
    description: "Multi-device WhatsApp Gateway with 2-Image Menu Sender, E-Commerce Order Alerts, and AI Auto-Responder.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoleWhat | AI-Powered WhatsApp Business Gateway",
    description: "Multi-device WhatsApp Gateway with 2-Image Menu Sender, E-Commerce Order Alerts, and AI Auto-Responder.",
  },
};

export default function Home() {
  const packagePath = path.join(process.cwd(), "package.json");
  let version = "v2.0.0";
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    version = `v${packageJson.version}`;
  } catch {
    // fallback
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      {/* Floating Glass Navbar */}
      <header className="fixed top-4 inset-x-4 md:inset-x-auto md:top-6 md:left-1/2 md:-translate-x-1/2 z-50 md:w-full md:max-w-6xl transition-all duration-300">
        <div className="glass rounded-full px-4 md:px-8 h-14 md:h-16 flex items-center justify-between mx-auto shadow-xl shadow-black/5 dark:shadow-black/20 border border-white/40 dark:border-white/10 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
            <div className="relative flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-primary text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
              <Bot className="h-5 w-5 md:h-6 md:w-6" />
              <div className="absolute inset-0 rounded-2xl bg-primary blur-md -z-10 opacity-50" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground font-black tracking-tight leading-none text-lg">SoleWhat</span>
              <span className="text-[10px] text-primary font-semibold tracking-wider uppercase">WA Engine</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <Link href="#features" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#ai-bot" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">AI Responder</Link>
            <Link href="#ecommerce" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">E-Commerce Alerts</Link>
            <Link href="#use-cases" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Use Cases</Link>
            <Link href="/docs" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">API Docs</Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/auth/login">
              <Button size="sm" variant="ghost" className="rounded-full px-4 text-xs font-semibold text-foreground hover:bg-muted">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="rounded-full px-5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-36 overflow-hidden flex flex-col items-center justify-center min-h-[92vh]">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/3 translate-y-1/3 w-[35rem] h-[35rem] bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">

              {/* Version Pill */}
              <div className="inline-flex items-center rounded-full glass-panel px-4 py-1.5 text-xs font-semibold text-foreground/90 border border-primary/20 shadow-xs">
                <span className="relative flex h-2 w-2 mr-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>SoleWhat {version} • AI Responder &amp; E-Commerce Webhooks Live</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1 text-primary opacity-70" />
              </div>

              {/* Hero Title */}
              <div className="space-y-4 max-w-4xl">
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08]">
                  <span className="block text-foreground">Intelligent WhatsApp</span>
                  <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent block">
                    Automation Engine.
                  </span>
                </h1>
                <p className="mx-auto max-w-2xl text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed pt-2">
                  Power your business with <strong>Natural Roman Urdu AI chat</strong>, automated <strong>2-page visual menu auto-senders</strong>, instant <strong>Shopify &amp; WooCommerce order alerts</strong>, and multi-device WhatsApp routing.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 pt-2 w-full sm:w-auto px-4">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-13 px-8 rounded-full text-sm sm:text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 group">
                    Open Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full h-13 px-8 rounded-full text-sm sm:text-base font-semibold border-border/80 hover:bg-muted/60 transition-all">
                    Sign In to Portal
                  </Button>
                </Link>
                <Link href="/docs" className="w-full sm:w-auto">
                  <Button size="lg" variant="ghost" className="w-full h-13 px-6 rounded-full text-sm sm:text-base font-semibold text-muted-foreground hover:text-foreground">
                    API Docs
                  </Button>
                </Link>
              </div>

              {/* Live Showcase Preview Mockup */}
              <div className="w-full max-w-4xl pt-8">
                <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-border/70 shadow-2xl shadow-black/10 dark:shadow-black/40">
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4 text-left">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                      <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                      <span className="text-xs font-mono font-medium text-muted-foreground ml-2">solewhat-engine.live</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Multi-Device WhatsApp Connected
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    {/* Mockup Card 1: AI Menu Auto-Sender */}
                    <div className="bg-background/80 rounded-2xl p-4 border border-border/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                          <Bot size={14} className="text-primary" />
                          AI Auto-Responder (2-Image Menu)
                        </span>
                        <span className="text-[10px] text-muted-foreground">Just now</span>
                      </div>
                      <div className="space-y-2 text-xs font-sans">
                        <div className="bg-muted/60 p-2.5 rounded-xl rounded-tl-xs max-w-[85%] text-foreground">
                          aoa menu dikhao rates kya hain?
                        </div>
                        <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl rounded-tr-xs ml-auto max-w-[90%] text-foreground space-y-2">
                          <p className="leading-relaxed">
                            Walaikum Assalam! G bilkul, yeh lijiye hamara complete menu card aur special deals:
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <div className="bg-background p-1 rounded-lg border border-border/40 text-center">
                              <span className="text-[9px] font-bold text-primary block">📄 Menu Page 1</span>
                              <div className="h-12 bg-muted/60 rounded flex items-center justify-center text-[10px] text-muted-foreground font-mono">Front Card</div>
                            </div>
                            <div className="bg-background p-1 rounded-lg border border-border/40 text-center">
                              <span className="text-[9px] font-bold text-primary block">📄 Menu Page 2</span>
                              <div className="h-12 bg-muted/60 rounded flex items-center justify-center text-[10px] text-muted-foreground font-mono">Back &amp; Deals</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mockup Card 2: E-Commerce Automated Order Alert */}
                    <div className="bg-background/80 rounded-2xl p-4 border border-border/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                          <ShoppingBag size={14} className="text-blue-500" />
                          E-Commerce Order Alert (Shopify/Woo)
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold">1.2s Fast</span>
                      </div>
                      <div className="space-y-2 text-xs font-sans">
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl rounded-tr-xs text-foreground space-y-1.5">
                          <p className="font-bold text-blue-600 dark:text-blue-400">Order #1084 Confirmed 🎉</p>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            Salam Ahmed Khan! Your parcel is being prepared.
                            <br />Total Amount: <strong>PKR 4,500 (COD)</strong>
                            <br />Tracking: <strong>TCS-892104</strong>
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] bg-background border px-2 py-0.5 rounded-full font-semibold text-emerald-600 dark:text-emerald-400">✓ Webhook Verified</span>
                            <span className="text-[9px] text-muted-foreground">Auto-Sent via SoleWhat</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl pt-4">
                <div className="p-4 rounded-2xl glass-panel border border-border/60 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-foreground">99.9%</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">WhatsApp Uptime</div>
                </div>
                <div className="p-4 rounded-2xl glass-panel border border-border/60 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-primary">&lt; 1.5s</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">AI Reply Latency</div>
                </div>
                <div className="p-4 rounded-2xl glass-panel border border-border/60 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-foreground">2-Image</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">Visual Auto-Sender</div>
                </div>
                <div className="p-4 rounded-2xl glass-panel border border-border/60 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-500">100%</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">Self-Hosted Privacy</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-28 relative">
          <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/30 border-y border-border" />
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-bold text-primary tracking-widest uppercase">Everything You Need</span>
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
                Engineered for Modern Businesses
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                From restaurant menu delivery to online checkout notifications, SoleWhat gives you enterprise-grade WhatsApp automation out of the box.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <FeatureCard
                icon={<Bot className="h-6 w-6 text-emerald-500" />}
                title="AI Auto-Responder (Urdu & Roman Urdu)"
                description="Powered by Gemini & OpenRouter. Greets naturally ('AOA', 'kya haal hai'), answers store FAQs, and chats like a real Pakistani team member."
              />
              <FeatureCard
                icon={<ImageIcon className="h-6 w-6 text-cyan-500" />}
                title="2-Image Menu & Catalog Auto-Sender"
                description="Upload Page 1 & Page 2. Customer asks for 'menu' or 'rates', and SoleWhat automatically dispatches both visual photos in chronological sequence."
              />
              <FeatureCard
                icon={<ShoppingBag className="h-6 w-6 text-blue-500" />}
                title="E-Commerce Order Alerts (Shopify & Woo)"
                description="Plug into WooCommerce or Shopify webhooks. Automatically send order confirmations, COD verification prompts, and live tracking links."
              />
              <FeatureCard
                icon={<Smartphone className="h-6 w-6 text-purple-500" />}
                title="Multi-Device & Multi-Number Gateway"
                description="Scan and link multiple WhatsApp numbers simultaneously. Monitor connection health and route traffic across different sales agents."
              />
              <FeatureCard
                icon={<Layers className="h-6 w-6 text-amber-500" />}
                title="Interactive Messages (Buttons & Lists)"
                description="Send rich interactive messages featuring clickable quick-reply buttons and catalog selection lists directly in chat."
              />
              <FeatureCard
                icon={<Clock className="h-6 w-6 text-rose-500" />}
                title="Drip Sequences & Timed Follow-ups"
                description="Automate multi-step follow-up sequences across days or hours to convert abandoned carts and warm up leads."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6 text-indigo-500" />}
                title="Multi-Agent Live Chat CRM Inbox"
                description="Collaborative live chat dashboard with session filtering, conversation history, and isolated team role access (Superadmin, Owner, Staff)."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6 text-amber-400" />}
                title="Keyword Auto-Reply Rules"
                description="Trigger specific replies and multimedia cards based on exact, contains, or regex keyword matches with instant override capabilities."
              />
              <FeatureCard
                icon={<Code className="h-6 w-6 text-teal-500" />}
                title="Developer REST API & Webhooks"
                description="Interactive Swagger docs, API keys, and outbound webhooks to seamlessly connect with custom Next.js, Laravel, or PHP systems."
              />
            </div>
          </div>
        </section>

        {/* Deep Dive 1: AI Menu Bot Showcase */}
        <section id="ai-bot" className="py-24 relative overflow-hidden">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                  <Sparkles size={14} /> Smart Visual Delivery
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                  Customer writes &quot;menu&quot;.<br />
                  <span className="text-primary">SoleWhat sends both pages instantly.</span>
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Restaurants, cafes, and bakeries receive hundreds of &quot;Menu bhejo&quot; inquiries daily. SoleWhat understands short queries, single-word requests, and greetings, responding warmly and appending both menu images without requiring human staff.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                    <span>Upload Front &amp; Back menu cards directly from dashboard</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                    <span>Answers questions about delivery timings, deals, and prices</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                    <span>Free AI tier integration (Google Gemini Flash &amp; OpenRouter)</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link href="/dashboard/ai-bot">
                    <Button className="rounded-full px-6 font-bold shadow-lg shadow-primary/20">
                      Configure AI Bot
                      <ArrowRight size={15} className="ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-6 border border-border/70 shadow-xl space-y-4 text-left">
                <div className="flex items-center justify-between border-b pb-3 text-xs font-bold text-foreground">
                  <span>AI Playground Simulation</span>
                  <span className="text-emerald-500 font-mono">Gemini 1.5 Flash</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-br-xs max-w-[80%]">
                      aoa menu aur deals bhejein
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted p-3.5 rounded-2xl rounded-bl-xs max-w-[90%] space-y-2.5">
                      <p className="text-foreground leading-relaxed">
                        Walaikum Assalam! Royal Spice Cafe mein khushamdeed. Yeh lijiye hamara complete menu aur family deals:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border bg-background p-2 text-center space-y-1">
                          <span className="text-[10px] font-bold text-primary">📄 Page 1 (Main Menu)</span>
                          <div className="h-20 bg-muted/70 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                            Biryani &amp; Karahi Rates
                          </div>
                        </div>
                        <div className="rounded-xl border bg-background p-2 text-center space-y-1">
                          <span className="text-[10px] font-bold text-primary">📄 Page 2 (Special Deals)</span>
                          <div className="h-20 bg-muted/70 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                            Family Combo Deals
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive 2: E-Commerce Webhook Integration */}
        <section id="ecommerce" className="py-24 relative bg-muted/20 border-t border-border/50">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 glass-panel rounded-3xl p-6 border border-border/70 shadow-xl space-y-4 text-left">
                <div className="flex items-center justify-between border-b pb-3 text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Code size={14} className="text-blue-500" />
                    WooCommerce PHP Hook Snippet
                  </span>
                  <span className="text-[11px] text-muted-foreground">woocommerce_thankyou</span>
                </div>
                <pre className="bg-background/90 text-foreground/90 p-4 rounded-xl text-[11px] font-mono overflow-x-auto border leading-relaxed">
{`add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);
    $phone = $order->get_billing_phone();
    
    // Auto WhatsApp confirmation via SoleWhat
    wp_remote_post('https://your-domain/api/sessions/default/chats/send', [
        'headers' => ['x-api-key' => 'YOUR_SOLEWHAT_KEY'],
        'body'    => json_encode([
            'to'   => $phone,
            'text' => "Salam! Order #{$order_id} confirmed."
        ])
    ]);
});`}
                </pre>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>Ready-made code snippets for Shopify, WooCommerce &amp; PHP available in dashboard.</span>
                </div>
              </div>

              <div className="order-1 lg:order-2 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-500">
                  <Truck size={14} /> E-Commerce Supercharger
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                  Cut Fake COD Returns by 70%.<br />
                  <span className="text-blue-500">Confirm Orders on WhatsApp.</span>
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  In Pakistan and South Asia, unconfirmed Cash on Delivery orders lead to massive courier return losses. SoleWhat automatically messages every buyer the instant they place an order, confirming details and sending tracking updates.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  <div className="p-3 rounded-xl border bg-background/60">
                    <div className="text-foreground font-bold">✓ Shopify Webhooks</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">Orders &amp; Fulfillment alerts</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-background/60">
                    <div className="text-foreground font-bold">✓ WooCommerce</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">1-click PHP snippet hook</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-background/60">
                    <div className="text-foreground font-bold">✓ Courier Tracking</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">TCS, Leopards &amp; Trax links</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-background/60">
                    <div className="text-foreground font-bold">✓ Zero Extra Plugins</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">Clean direct REST calls</div>
                  </div>
                </div>
                <div className="pt-2">
                  <Link href="/dashboard/connect-website">
                    <Button variant="outline" className="rounded-full px-6 font-bold">
                      Explore Website Integrations
                      <ArrowRight size={15} className="ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="py-24 relative">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-bold text-primary tracking-widest uppercase">Target Industries</span>
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
                Who Uses SoleWhat Daily?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                Discover how businesses in food, retail, healthcare, and luxury scale customer interactions with SoleWhat.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl glass-panel border border-border/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <UtensilsCrossed size={20} />
                </div>
                <h4 className="text-base font-bold text-foreground">Restaurants &amp; Cafes</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sends 2-page food menus, takes takeaway inquiries, and shares delivery timings 24/7 without extra order staff.
                </p>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-border/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <h4 className="text-base font-bold text-foreground">E-Commerce Brands</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Instant order confirmation, COD address verification, and automated courier tracking alerts via WhatsApp.
                </p>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-border/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Gem size={20} />
                </div>
                <h4 className="text-base font-bold text-foreground">Gold &amp; Jewellers</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automatically delivers today&apos;s 24K/22K gold rates and shares latest bridal set collection images.
                </p>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-border/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Scissors size={20} />
                </div>
                <h4 className="text-base font-bold text-foreground">Salons &amp; Clinics</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Shares visual service rate cards, treatment guidelines, and doctor consultation hours automatically.
                </p>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-border/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <h4 className="text-base font-bold text-foreground">Real Estate Agencies</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sends installment payment schedules and project master plan layout images when prospective buyers inquire.
                </p>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-border/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <h4 className="text-base font-bold text-foreground">Agencies &amp; SaaS Resellers</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Set up WhatsApp automation for local businesses and charge recurring monthly retainer fees of PKR 5,000–10,000.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-20 relative">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-2xl text-center space-y-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/20 pointer-events-none" />
              <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
                <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
                  Ready to Automate Your WhatsApp Sales?
                </h3>
                <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                  Connect your first WhatsApp device in less than 30 seconds via QR scan. No coding required.
                </p>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/auth/login">
                  <Button size="lg" className="h-12 px-8 rounded-full font-bold bg-white text-emerald-950 hover:bg-white/90 shadow-lg">
                    Sign In to Portal
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="h-12 px-8 rounded-full font-bold bg-transparent text-white border-white/40 hover:bg-white/10">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer without GitHub */}
      <footer className="border-t border-border/60 bg-card/60 backdrop-blur-xl py-12 relative z-10">
        <div className="container px-4 md:px-6 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base font-black text-foreground">SoleWhat</span>
                <span className="text-[10px] text-muted-foreground">AI WhatsApp Business Gateway</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">API Documentation</Link>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SoleWhat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group relative p-7 glass-panel rounded-3xl hover-lift border border-border/60 text-left transition-all hover:border-primary/40">
      <div className="relative z-10 space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-background border border-border/60 shadow-xs group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
