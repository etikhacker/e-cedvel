"use client";

// src/components/InviteSection.tsx
// Superadmin panelə import et:
// import { InviteSection } from '@/components/InviteSection'
// <InviteSection />

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type University = { id: string; name: string };
type SentInvite = { email: string; university_name: string; link: string };

export function InviteSection() {
  const [open, setOpen]           = useState(true);
  const [unis, setUnis]           = useState<University[]>([]);
  const [form, setForm]           = useState({ email: "", university_id: "" });
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState<SentInvite | null>(null);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    supabase.from("universities").select("id, name").eq('is_active',true).then(({ data,error }) => {
      if(error){setError('Universitetlər yüklənmədi. Səhifəni yeniləyin.');return;}
      setUnis(data ?? []);
      if (data?.[0]) setForm(p => ({ ...p, university_id: data[0].id }));
    });
  }, []);

  const handleSend = async () => {
    if (!form.email || !form.university_id) {
      setError("Email və universitet seçin.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Düzgün email daxil edin.");
      return;
    }

    if(sending)return;
    setSending(true);
    setError("");
    setSent(null);

    const uniName = unis.find(u => u.id === form.university_id)?.name ?? "";

    try {
    const res = await fetch("/api/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        university_id: form.university_id,
      }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok || data.error) {
      setError(data.error ?? "Xəta baş verdi.");
      return;
    }

    setSent({ email: form.email, university_name: uniName, link: data.invite_link });
    setForm(p => ({ ...p, email: "" }));
    } catch {setError('Dəvət xidməti əlçatan deyil. Yenidən cəhd edin.');}
    finally {setSending(false);}
  };

  const copyLink = async () => {
    if (!sent?.link) return;
    try {await navigator.clipboard.writeText(sent.link);}catch{setError('Link kopyalanmadı.');return;}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 16,
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "16px 20px",
          background: "transparent", border: "none",
          color: "var(--foreground)", cursor: "pointer",
          fontSize: 15, fontWeight: 700, fontFamily: "inherit",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          ✉️ Dəvət Göndər
        </span>
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          {open ? "∧" : "∨"}
        </span>
      </button>

      {open && (
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "20px",
        }}>

          {/* Form */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            {/* University select */}
            <div style={{ flex: "0 0 220px" }}>
              <label htmlFor="invite-university" style={{ display: "block", fontSize: "0.72rem", fontWeight: 600,
                color: "var(--muted-foreground)", marginBottom: 5 }}>
                Universitet
              </label>
              <select
                id="invite-university" className="focus-visible:ring-2 focus-visible:ring-primary"
                value={form.university_id}
                onChange={e => setForm(p => ({ ...p, university_id: e.target.value }))}
                style={{
                  width: "100%", padding: "9px 12px",
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--foreground)",
                  fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
                }}
              >
                {unis.length === 0
                  ? <option value="">Universitet yoxdur</option>
                  : unis.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))
                }
              </select>
            </div>

            {/* Email */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <label htmlFor="invite-email" style={{ display: "block", fontSize: "0.72rem", fontWeight: 600,
                color: "var(--muted-foreground)", marginBottom: 5 }}>
                Admin Email
              </label>
              <input
                id="invite-email" className="focus-visible:ring-2 focus-visible:ring-primary"
                type="email"
                placeholder="admin@university.edu.az"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                style={{
                  width: "100%", padding: "9px 12px",
                  background: "var(--muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--foreground)",
                  fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
                }}
              />
            </div>

            {/* Button */}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={handleSend}
                disabled={sending || !unis.length}
                style={{
                  padding: "9px 20px",
                  background: sending ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.2)",
                  border: "1px solid rgba(59,130,246,0.4)",
                  borderRadius: 8, color: "#3b82f6",
                  fontSize: "0.875rem", fontWeight: 700,
                  cursor: sending ? "not-allowed" : "pointer",
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                {sending ? "Göndərilir..." : "📤 Dəvət Göndər"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px", marginBottom: 12,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8, fontSize: "0.82rem", color: "#ef4444",
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Success */}
          {sent && (
            <div style={{
              padding: "16px", marginBottom: 4,
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8,
                marginBottom: 10, fontWeight: 700, fontSize: "0.875rem", color: "#22c55e" }}>
                ✓ Dəvət emaili göndərildi!
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginBottom: 10 }}>
                <span style={{ color: "var(--foreground)" }}>{sent.email}</span> ünvanına —{" "}
                <span style={{ color: "#3b82f6" }}>{sent.university_name}</span>
              </div>

              {/* Link copy */}
              <div style={{
                background: "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: 8, padding: "10px 14px",
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 10,
              }}>
                <span style={{
                  fontSize: "0.72rem", color: "var(--muted-foreground)",
                  wordBreak: "break-all", flex: 1,
                }}>
                  {sent.link}
                </span>
                <button
                  onClick={copyLink}
                  style={{
                    padding: "5px 12px", flexShrink: 0,
                    background: copied ? "rgba(34,197,94,0.15)" : "var(--muted)",
                    border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                    borderRadius: 6, color: copied ? "#22c55e" : "var(--muted-foreground)",
                    fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.2s",
                  }}
                >
                  {copied ? "✓ Kopyalandı" : "Kopyala"}
                </button>
              </div>
            </div>
          )}

          <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
            Link 7 gün etibarlıdır. Admin həmin linkdən hesabını yaradacaq.
          </p>
        </div>
      )}
    </div>
  );
}
