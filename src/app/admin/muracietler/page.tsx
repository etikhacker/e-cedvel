"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type Filter = "hamisi" | Muraciet["status"];

const STATUS_META: Record<Muraciet["status"], { label: string; color: string; bg: string; border: string }> = {
  gozlemede: { label: "Gözləmədə", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.35)" },
  qebul:     { label: "Qəbul",     color: "#22c55e", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.35)" },
  red:       { label: "Rədd",      color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.35)" },
};

export default function MuracietlerPage() {
  const router = useRouter();
  const [list, setList] = useState<Muraciet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("hamisi");
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Muraciet | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("muracietler")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    setList((data as Muraciet[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      await fetchData();
    };

    void initialize();
  }, [fetchData, router]);

  const updateStatus = async (id: string, status: "qebul" | "red") => {
    const { error } = await supabase.from("muracietler").update({ status }).eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    setList(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("muracietler").delete().eq("id", pendingDelete.id);
    setDeleting(false);
    if (error) {
      console.error("Silmə xətası:", error);
      alert("Silmək mümkün olmadı: " + error.message);
      return;
    }
    setList(prev => prev.filter(m => m.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  const counts = {
    gozlemede: list.filter(m => m.status === "gozlemede").length,
    qebul:     list.filter(m => m.status === "qebul").length,
    red:       list.filter(m => m.status === "red").length,
  };

  const filtered = useMemo(() => {
    let rows = filter === "hamisi" ? list : list.filter(m => m.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(m =>
        m.ad_soyad.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.universitet || "").toLowerCase().includes(q) ||
        (m.telefon || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [list, filter, query]);

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#fff",
      fontFamily: "var(--font-geist-sans, system-ui, sans-serif)", padding: "32px 5%" }}>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
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
            style={{ padding: "9px 18px", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
              color: "#fff", cursor: "pointer", fontSize: "0.875rem",
              display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            ← Geri
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {([
            { label: "Gözləmədə", key: "gozlemede", color: "#f59e0b", count: counts.gozlemede },
            { label: "Qəbul",     key: "qebul",     color: "#22c55e", count: counts.qebul },
            { label: "Rədd",      key: "red",       color: "#ef4444", count: counts.red },
          ] as const).map(s => {
            const active = filter === s.key;
            return (
              <button key={s.key}
                onClick={() => setFilter(active ? "hamisi" : s.key)}
                style={{ padding: "18px 20px",
                  background: active ? `${s.color}1a` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? s.color + "55" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                  boxShadow: active ? `0 4px 20px ${s.color}22` : "none" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", marginTop: 6,
                  textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>{s.label}</div>
              </button>
            );
          })}
        </div>

        {/* Toolbar: filter tabs + search + refresh */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          {(["hamisi", "gozlemede", "qebul", "red"] as const).map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              style={{ padding: "7px 16px",
                background: filter === f ? "#3b82f6" : "rgba(255,255,255,0.05)",
                border: `1px solid ${filter === f ? "#3b82f6" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 20, color: "#fff", cursor: "pointer",
                fontSize: "0.8rem", fontWeight: filter === f ? 700 : 500,
                transition: "all 0.2s" }}>
              {f === "hamisi" ? "Hamısı" : f === "gozlemede" ? "Gözləmədə" : f === "qebul" ? "Qəbul" : "Rədd"}
            </button>
          ))}

          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180, marginLeft: 4 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.35)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ad, email, universitet, telefon..."
              style={{ width: "100%", padding: "8px 14px 8px 36px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20, color: "#fff", fontSize: "0.82rem",
                outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button onClick={fetchData}
            style={{ marginLeft: "auto", padding: "7px 14px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "0.8rem",
              display: "inline-flex", alignItems: "center", gap: 6 }}>
            ↺ Yenilə
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Yüklənir...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60,
            background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 14, color: "rgba(255,255,255,0.35)" }}>
            Müraciət yoxdur
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(m => (
              <MuracietCard
                key={m.id}
                m={m}
                onUpdate={updateStatus}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div
          onClick={() => !deleting && setPendingDelete(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 1000, padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: "26px 26px 22px", maxWidth: 420, width: "100%",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10,
                background: "rgba(239,68,68,0.15)", color: "#ef4444",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                🗑
              </div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                Müraciəti sil
              </h2>
            </div>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", lineHeight: 1.55, margin: "0 0 22px" }}>
              <b style={{ color: "#fff" }}>{pendingDelete.ad_soyad}</b> adlı şəxsin
              <b style={{ color: "#fff" }}> {pendingDelete.universitet}</b> müraciətini silmək istədiyinizə əminsiniz?
              Bu əməliyyat geri alınmazdır.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                style={{ padding: "9px 18px", background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  color: "#fff", cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: "0.85rem", fontWeight: 600, opacity: deleting ? 0.5 : 1 }}
              >
                Ləğv et
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{ padding: "9px 18px", background: "#ef4444",
                  border: "1px solid #ef4444", borderRadius: 8,
                  color: "#fff", cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: "0.85rem", fontWeight: 700, opacity: deleting ? 0.6 : 1,
                  display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {deleting ? "Silinir..." : "Bəli, sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────── */
function MuracietCard({ m, onUpdate, onDelete }: {
  m: Muraciet;
  onUpdate: (id: string, status: "qebul" | "red") => void;
  onDelete: (m: Muraciet) => void;
}) {
  const meta = STATUS_META[m.status];
  const date = new Date(m.created_at).toLocaleDateString("az-AZ", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{ background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px",
      transition: "all 0.2s" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
              {m.universitet}
            </span>
            {m.qisa_ad && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)",
                fontWeight: 500, background: "rgba(255,255,255,0.06)",
                padding: "2px 8px", borderRadius: 5 }}>
                {m.qisa_ad}
              </span>
            )}
          </div>
          {m.seher && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              📍 {m.seher}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{date}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20,
            background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
            {meta.label}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, fontSize: 13, color: "rgba(255,255,255,0.55)",
        paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
        <span>👤 {m.ad_soyad}</span>
        <a href={`mailto:${m.email}`} style={{ color: "#60a5fa", textDecoration: "none" }}>
          ✉️ {m.email}
        </a>
        {m.telefon && <span>📞 {m.telefon}</span>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
        {m.status === "gozlemede" && (
          <>
            <button onClick={() => onUpdate(m.id, "qebul")}
              style={{ padding: "8px 18px", background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e",
                borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s" }}>
              ✓ Qəbul et
            </button>
            <button onClick={() => onUpdate(m.id, "red")}
              style={{ padding: "8px 18px", background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444",
                borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s" }}>
              ✕ Rədd et
            </button>
          </>
        )}

        <button onClick={() => onDelete(m)}
          style={{ marginLeft: "auto", padding: "7px 14px", background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)",
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.5)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
          title="Müraciəti sil">
          🗑 Sil
        </button>
      </div>
    </div>
  );
}
