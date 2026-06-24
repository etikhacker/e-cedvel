"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Muraciet = {
  id: string;
  universitet: string;
  qisa_ad: string | null;
  seher: string | null;
  ad_soyad: string;
  email: string;
  telefon: string | null;
  status: "gozlemede" | "qebul" | "red";
  created_at: string;
};

export default function MuracietlerPage() {
  const router = useRouter();
  const [list, setList]       = useState<Muraciet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"hamisi" | "gozlemede" | "qebul" | "red">("hamisi");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      fetchData();
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("muracietler")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setList((data as Muraciet[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "qebul" | "red") => {
    await supabase.from("muracietler").update({ status }).eq("id", id);
    setList(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  const filtered = filter === "hamisi" ? list : list.filter(m => m.status === filter);
  const counts = {
    gozlemede: list.filter(m => m.status === "gozlemede").length,
    qebul:     list.filter(m => m.status === "qebul").length,
    red:       list.filter(m => m.status === "red").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#fff",
      fontFamily: "var(--font-geist-sans, system-ui, sans-serif)", padding: "32px 5%" }}>

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#3b82f6", margin: 0 }}>
              📬 Müraciətlər
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: 4 }}>
              Landing page-dən gələn müraciətlər
            </p>
          </div>
          <button
            onClick={() => router.back()}
            style={{ padding: "8px 18px", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
              color: "#fff", cursor: "pointer", fontSize: "0.875rem" }}
          >
            ← Geri
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Gözləmədə", key: "gozlemede", color: "#f59e0b", count: counts.gozlemede },
            { label: "Qəbul",     key: "qebul",     color: "#22c55e", count: counts.qebul },
            { label: "Rədd",      key: "red",        color: "#ef4444", count: counts.red },
          ].map(s => (
            <button key={s.key}
              onClick={() => setFilter(filter === s.key as any ? "hamisi" : s.key as any)}
              style={{ padding: "16px", background: filter === s.key ? `${s.color}18` : "rgba(255,255,255,0.03)",
                border: `1px solid ${filter === s.key ? s.color + "44" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["hamisi", "gozlemede", "qebul", "red"] as const).map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              style={{ padding: "6px 16px",
                background: filter === f ? "#3b82f6" : "rgba(255,255,255,0.05)",
                border: `1px solid ${filter === f ? "#3b82f6" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 20, color: "#fff", cursor: "pointer",
                fontSize: "0.78rem", fontWeight: filter === f ? 700 : 400 }}>
              {f === "hamisi" ? "Hamısı" : f === "gozlemede" ? "Gözləmədə" : f === "qebul" ? "Qəbul" : "Rədd"}
            </button>
          ))}
          <button onClick={fetchData}
            style={{ marginLeft: "auto", padding: "6px 14px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.78rem" }}>
            ↺ Yenilə
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Yüklənir...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
            Müraciət yoxdur
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(m => (
              <MuracietCard key={m.id} m={m} onUpdate={updateStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────── */
function MuracietCard({ m, onUpdate }: {
  m: Muraciet;
  onUpdate: (id: string, status: "qebul" | "red") => void;
}) {
  const statusInfo = {
    gozlemede: { label: "Gözləmədə", color: "#f59e0b" },
    qebul:     { label: "Qəbul",     color: "#22c55e" },
    red:       { label: "Rədd",      color: "#ef4444" },
  }[m.status];

  const date = new Date(m.created_at).toLocaleDateString("az-AZ", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{ background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 20px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>
            {m.universitet}
            {m.qisa_ad && (
              <span style={{ marginLeft: 8, fontSize: 12, color: "rgba(255,255,255,0.35)",
                fontWeight: 400, background: "rgba(255,255,255,0.06)",
                padding: "2px 8px", borderRadius: 5 }}>
                {m.qisa_ad}
              </span>
            )}
          </div>
          {m.seher && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>📍 {m.seher}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{date}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: `${statusInfo.color}18`, color: statusInfo.color,
            border: `1px solid ${statusInfo.color}33` }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, fontSize: 13, color: "rgba(255,255,255,0.5)",
        paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span>👤 {m.ad_soyad}</span>
        <a href={`mailto:${m.email}`} style={{ color: "#3b82f6", textDecoration: "none" }}>
          ✉️ {m.email}
        </a>
        {m.telefon && <span>📞 {m.telefon}</span>}
      </div>

      {m.status === "gozlemede" && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={() => onUpdate(m.id, "qebul")}
            style={{ padding: "7px 18px", background: "#22c55e18",
              border: "1px solid #22c55e44", color: "#22c55e",
              borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ✓ Qəbul et
          </button>
          <button onClick={() => onUpdate(m.id, "red")}
            style={{ padding: "7px 18px", background: "#ef444418",
              border: "1px solid #ef444444", color: "#ef4444",
              borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ✕ Rədd et
          </button>
        </div>
      )}
    </div>
  );
}