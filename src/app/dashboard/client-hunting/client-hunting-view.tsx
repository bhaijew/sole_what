"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Search,
  Sliders,
  Clock,
  Send,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Filter,
  Download,
  Sparkles,
  Phone,
  Building2,
  Globe,
  Bot,
  Play,
  Copy,
  Check,
  Star,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface Lead {
  id: string;
  businessName: string;
  phone: string;
  cleanPhone: string;
  address?: string | null;
  city?: string | null;
  category?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  website?: string | null;
  googleMapsUrl?: string | null;
  status: string;
  pitchSentAt?: string | null;
  pitchContent?: string | null;
  createdAt: string;
}

interface HuntingConfig {
  sessionId?: string | null;
  isEnabled: boolean;
  scheduleTime: string;
  targetNiche: string;
  targetCity: string;
  dailyLeadLimit: number;
  pitchTemplate: string;
  autoSendPitch: boolean;
  googleApiKey?: string | null;
}

interface Session {
  id: string;
  sessionId: string;
  name: string;
  status: string;
}

export default function ClientHuntingView() {
  const [activeTab, setActiveTab] = useState<"leads" | "setup">("leads");
  const [loading, setLoading] = useState(true);
  const [huntingRunning, setHuntingRunning] = useState(false);
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({ total: 0, found: 0, pitchSent: 0, replied: 0, converted: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Setup config state
  const [config, setConfig] = useState<HuntingConfig>({
    sessionId: null,
    isEnabled: true,
    scheduleTime: "09:00",
    targetNiche: "Restaurants, Salons, Clinics, Gyms",
    targetCity: "Lahore",
    dailyLeadLimit: 15,
    pitchTemplate:
      "Assalam-o-Alaikum {business_name}! I noticed your business on Google in {city} but saw that you don't have an official website yet. A website can easily help you get 2x-3x more customers. Would you be open to a quick 2-minute demo preview?",
    autoSendPitch: false,
    googleApiKey: "",
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // WhatsApp active sessions
  const [sessions, setSessions] = useState<Session[]>([]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (statusFilter !== "ALL") q.set("status", statusFilter);
      if (searchQuery.trim()) q.set("search", searchQuery.trim());

      const res = await fetch(`/api/client-hunting/leads?${q.toString()}`);
      const data = await res.json();
      if (data.status) {
        setLeads(data.data || []);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      toast.error("Failed to load leads");
    }
  }, [statusFilter, searchQuery]);

  // Fetch setup config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/client-hunting/config");
      const data = await res.json();
      if (data.status && data.data) {
        setConfig((prev) => ({
          ...prev,
          ...data.data,
          googleApiKey: data.data.googleApiKey || "",
        }));
      }
    } catch {
      toast.error("Failed to load automation settings");
    }
  }, []);

  // Fetch available WhatsApp sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (data.status && Array.isArray(data.data)) {
        setSessions(data.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLeads(), fetchConfig(), fetchSessions()]);
      setLoading(false);
    };
    init();
  }, [fetchLeads, fetchConfig, fetchSessions]);

  // Save Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch("/api/client-hunting/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.status) {
        toast.success("✅ Automation & Schedule Setup Saved!");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch {
      toast.error("Network error saving settings");
    } finally {
      setSavingConfig(false);
    }
  };

  // Run hunting manually right now
  const handleRunHuntNow = async () => {
    setHuntingRunning(true);
    try {
      const res = await fetch("/api/client-hunting/run", { method: "POST" });
      const data = await res.json();
      if (data.status) {
        toast.success(data.message || "Hunt completed!");
        fetchLeads();
      } else {
        toast.error(data.error || "Hunting failed");
      }
    } catch {
      toast.error("Error running client hunt");
    } finally {
      setHuntingRunning(false);
    }
  };

  // Send Pitch to a single lead
  const handleSendPitch = async (leadId: string) => {
    setSendingLeadId(leadId);
    try {
      const res = await fetch("/api/client-hunting/send-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, sessionId: config.sessionId }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success("WhatsApp pitch sent successfully!");
        fetchLeads();
      } else {
        toast.error(data.error || "Failed to send WhatsApp pitch");
      }
    } catch {
      toast.error("Network error sending pitch");
    } finally {
      setSendingLeadId(null);
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`/api/client-hunting/leads?id=${leadId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status) {
        toast.success("Lead removed");
        fetchLeads();
      }
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  // Copy phone number
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    toast.success("Phone copied to clipboard");
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error("No leads to export");
      return;
    }
    const headers = ["Business Name", "Phone", "Category", "City", "Rating", "Website", "Status", "Date"];
    const rows = leads.map((l) => [
      `"${l.businessName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.category || ""}"`,
      `"${l.city || ""}"`,
      l.rating || "",
      "None",
      l.status,
      new Date(l.createdAt).toLocaleDateString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `google_maps_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Leads exported to CSV!");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Client Hunting &amp; WhatsApp AI Outreach
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Google Maps Scanner
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated 9:00 AM discovery for businesses without a website and personalized WhatsApp pitch sequences
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Quick Run */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab("leads")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "leads"
                  ? "bg-white dark:bg-slate-900 text-orange-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              📋 Captured Leads ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab("setup")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "setup"
                  ? "bg-white dark:bg-slate-900 text-orange-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              ⚙️ Automation Setup
            </button>
          </div>

          <button
            onClick={handleRunHuntNow}
            disabled={huntingRunning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Scan Google Maps immediately for new businesses without website"
          >
            <Play className={`w-3.5 h-3.5 ${huntingRunning ? "animate-spin" : ""}`} />
            <span>{huntingRunning ? "Hunting..." : "Run Hunt Now"}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Target Businesses Found</span>
            <Building2 className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Verified without official website
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pitches Delivered</span>
            <Send className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.pitchSent}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Via connected WhatsApp session
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Daily Schedule</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {config.scheduleTime || "09:00"}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {config.isEnabled ? "🟢 Auto-Running Daily" : "⚪ Automation Paused"}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Target City / Niche</span>
            <MapPin className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-2 truncate">
            {config.targetCity}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {config.targetNiche}
          </div>
        </div>
      </div>

      {/* ── TAB 1: CAPTURED LEADS LIST ── */}
      {activeTab === "leads" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Filters & Actions Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search business, phone, city..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-600 dark:text-slate-300 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="FOUND">New Found</option>
                <option value="PITCH_SENT">Pitch Sent</option>
                <option value="REPLIED">Customer Replied</option>
                <option value="CONVERTED">Deal Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={fetchLeads}
                disabled={loading}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                title="Refresh leads"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Leads Table */}
          {leads.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Leads Discovered Yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click &quot;Run Hunt Now&quot; to scan Google Maps for local businesses without a website, or wait for the 9:00 AM automated schedule.
              </p>
              <button
                onClick={handleRunHuntNow}
                disabled={huntingRunning}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white shadow-md hover:bg-orange-700 cursor-pointer"
              >
                Start First Hunt Now 🚀
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Business Details</th>
                    <th className="px-5 py-3">Phone &amp; WhatsApp</th>
                    <th className="px-5 py-3">Category &amp; City</th>
                    <th className="px-5 py-3">Rating</th>
                    <th className="px-5 py-3">Website Status</th>
                    <th className="px-5 py-3">Outreach Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leads.map((lead) => {
                    const isPitchSent = lead.status === "PITCH_SENT";
                    const isSending = sendingLeadId === lead.id;

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{lead.businessName}</span>
                            {lead.googleMapsUrl && (
                              <a
                                href={lead.googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-orange-500"
                                title="Open on Google Maps"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {lead.address && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]" title={lead.address}>
                              {lead.address}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-3.5 font-mono">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                            <span>{lead.phone}</span>
                            <button
                              onClick={() => handleCopyPhone(lead.cleanPhone)}
                              className="text-slate-400 hover:text-slate-600"
                              title="Copy"
                            >
                              {copiedPhone === lead.cleanPhone ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400">{lead.cleanPhone}@s.whatsapp.net</span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.category || "General"}</span>
                          <div className="text-[11px] text-slate-400">{lead.city || "Pakistan"}</div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 font-bold text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{lead.rating ? lead.rating.toFixed(1) : "4.8"}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({lead.reviewCount || 12})
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50">
                            No Website ❌
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          {isPitchSent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> Pitch Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                              New Lead
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSendPitch(lead.id)}
                              disabled={isSending}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isPitchSent
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                              }`}
                              title="Send personalized pitch on WhatsApp"
                            >
                              <Send className={`w-3 h-3 ${isSending ? "animate-spin" : ""}`} />
                              <span>{isSending ? "Sending..." : isPitchSent ? "Resend" : "Send Pitch"}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: AUTOMATION & SCHEDULE SETUP ── */}
      {activeTab === "setup" && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Schedule & Auto-Hunting Trigger */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  1. Daily Automation &amp; Timing
                </h3>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Daily Auto-Hunting Engine
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Background cron will hunt new businesses every morning
                  </p>
                </div>
                <Switch
                  checked={config.isEnabled}
                  onCheckedChange={(v) => setConfig((p) => ({ ...p, isEnabled: v }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Daily Execution Time (Default 09:00 AM)
                </label>
                <input
                  type="time"
                  value={config.scheduleTime}
                  onChange={(e) => setConfig((p) => ({ ...p, scheduleTime: e.target.value }))}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Subah 9:00 AM standard local business opening time hota hai.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Daily Lead Limit (Max per Day)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={config.dailyLeadLimit}
                  onChange={(e) => setConfig((p) => ({ ...p, dailyLeadLimit: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  WhatsApp number safe rakhne ke liye rozana 15 se 25 leads recommended hain.
                </p>
              </div>
            </div>

            {/* 2. Targeting Criteria (Niches & Cities) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <MapPin className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  2. Target Category &amp; Location
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target City / Region *
                </label>
                <input
                  type="text"
                  value={config.targetCity}
                  onChange={(e) => setConfig((p) => ({ ...p, targetCity: e.target.value }))}
                  placeholder="e.g. Lahore, Karachi, Islamabad, Dubai"
                  className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Niches / Categories (Comma separated) *
                </label>
                <input
                  type="text"
                  value={config.targetNiche}
                  onChange={(e) => setConfig((p) => ({ ...p, targetNiche: e.target.value }))}
                  placeholder="e.g. Salons, Restaurants, Dentists, Clinics, Gyms"
                  className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  In businesses ko Google Maps par scan kiya jayega jinki website nahi hai.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Optional: Google Places API Key
                </label>
                <input
                  type="password"
                  value={config.googleApiKey || ""}
                  onChange={(e) => setConfig((p) => ({ ...p, googleApiKey: e.target.value }))}
                  placeholder="Leave empty for free built-in OpenMaps engine"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Agar aapke paas API key nahi hai toh khali chhor dein; free engine automatically use hoga.
                </p>
              </div>
            </div>
          </div>

          {/* 3. WhatsApp Sender & Outreach Pitch Template */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Phone className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                3. WhatsApp Outreach Pitch &amp; Sender Session
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sender WhatsApp Session
                </label>
                <select
                  value={config.sessionId || ""}
                  onChange={(e) => setConfig((p) => ({ ...p, sessionId: e.target.value || null }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
                >
                  <option value="">-- Select Connected WhatsApp Session --</option>
                  {sessions.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>
                      {s.name || s.sessionId} ({s.status})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Is number se leads ko pitch message jayega. (Sessions page se QR scan kar ke add karein).
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Auto-Send Pitch Immediately
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Lead miltay hi foran auto WhatsApp message bhej dega
                  </p>
                </div>
                <Switch
                  checked={config.autoSendPitch}
                  onCheckedChange={(v) => setConfig((p) => ({ ...p, autoSendPitch: v }))}
                />
              </div>
            </div>

            {/* Pitch Template */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Personalized WhatsApp Pitch Template
                </label>
                <div className="text-[10px] text-slate-400 space-x-1">
                  <span>Variables:</span>
                  <code className="text-orange-600 font-bold">{`{business_name}`}</code>
                  <code className="text-orange-600 font-bold">{`{city}`}</code>
                  <code className="text-orange-600 font-bold">{`{category}`}</code>
                </div>
              </div>

              <textarea
                rows={4}
                value={config.pitchTemplate}
                onChange={(e) => setConfig((p) => ({ ...p, pitchTemplate: e.target.value }))}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 font-sans leading-relaxed"
                required
              />

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>WhatsApp Message Preview (Example):</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  &quot;
                  {config.pitchTemplate
                    .replace(/\{business_name\}/gi, "Gulberg Glamour Salon")
                    .replace(/\{city\}/gi, config.targetCity || "Lahore")
                    .replace(/\{category\}/gi, "Salon")}
                  &quot;
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 active:scale-95 transition-all cursor-pointer"
            >
              {savingConfig ? "Saving Settings..." : "Save Automation Setup 💾"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
