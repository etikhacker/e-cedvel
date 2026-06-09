"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Muraciet = {
  id: string;
  universitet: string;
  qisa_ad: string;
  seher: string;
  ad_soyad: string;
  email: string;
  telefon: string;
  status: "gozlemede" | "qebul" | "red";
  created_at: string;
};

export function MuracietlerSection() {
  const [list, setList] = useState<Muraciet[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("muracietler")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data as Muraciet[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "qebul" | "red") => {
    await supabase.from("muracietler").update({ status }).eq("id", id);
    setList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
  };

  const pending = list.filter((m) => m.status === "gozlemede");
  const others  = list.filter((m) => m.status !== "gozlemede");

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "16px 20px",
          background: "transparent", border: "none", color: "#fff",
          cursor: "pointer", fontSize: 15, fontWeight: 700,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          📬 Müraciətlər
          {pending.length > 0 && (
            <span style={{
              background: "#3b82f6", color: "#fff",
              borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700,
            }}>
              {pending.length} yeni
            </span>
          )}
        </span>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>{open ? "∧" : "∨"}</span>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px" }}>
          {loading ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Yüklənir...</p>
          ) : list.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Hələ müraciət yoxdur.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Pending first */}
              {pending.map((m) => (
                <MuracietCard key={m.id} m={m} onUpdate={updateStatus} />
              ))}
              {/* Processed */}
              {others.length > 0 && (
                <>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "8px 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Baxılmış
                  </p>
                  {others.map((m) => (
                    <MuracietCard key={m.id} m={m} onUpdate={updateStatus} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MuracietCard({
  m,
  onUpdate,
}: {
  m: Muraciet;
  onUpdate: (id: string, status: "qebul" | "red") => void;
}) {
  const statusColor = {
    gozlemede: "#f59e0b",
    qebul:     "#22c55e",
    red:       "#ef4444",
  }[m.status];

  const statusLabel = {
    gozlemede: "Gözləmədə",
    qebul:     "Qəbul",
    red:       "Rədd",
  }[m.status];

  const date = new Date(m.created_at).toLocaleDateString("az-AZ", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10,
      padding: "14px 16px",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
            {m.universitet}
            {m.qisa_ad && (
              <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                ({m.qisa_ad})
              </span>
            )}
          </div>
          {m.seher && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              📍 {m.seher}
            </div>
          )}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px",
          borderRadius: 20, background: `${statusColor}22`, color: statusColor,
          border: `1px solid ${statusColor}44`, whiteSpace: "nowrap",
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Contact info */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
        <span>👤 {m.ad_soyad}</span>
        <span>✉️ {m.email}</span>
        {m.telefon && <span>📞 {m.telefon}</span>}
        <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)" }}>{date}</span>
      </div>

      {/* Actions */}
      {m.status === "gozlemede" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={() => onUpdate(m.id, "qebul")}
            style={{
              padding: "6px 16px", background: "#22c55e22",
              border: "1px solid #22c55e44", color: "#22c55e",
              borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            ✓ Qəbul et
          </button>
          <button
            onClick={() => onUpdate(m.id, "red")}
            style={{
              padding: "6px 16px", background: "#ef444422",
              border: "1px solid #ef444444", color: "#ef4444",
              borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            ✕ Rədd et
          </button>
        </div>
      )}
    </div>
  );
}