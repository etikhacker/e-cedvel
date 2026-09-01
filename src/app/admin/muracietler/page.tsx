"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Search, RefreshCw, Inbox, Mail, Phone, MapPin,
  User, Check, X, Trash2, AlertTriangle,
} from "lucide-react";

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

const STATUS_META: Record<Muraciet["status"], { label: string; className: string }> = {
  gozlemede: {
    label: "Gözləmədə",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  qebul: {
    label: "Qəbul",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  red: {
    label: "Rədd",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  },
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

    // 1) Sil
    const { error } = await supabase
      .from("muracietler")
      .delete()
      .eq("id", pendingDelete.id);

    if (error) {
      setDeleting(false);
      console.error("Silmə xətası:", error);
      alert("Silmək mümkün olmadı: " + error.message);
      return;
    }

    // 2) Yoxla — həqiqətən silinib? (RLS səssizcə bloklaya bilər,
    //    ona görə select ilə təsdiqləyirik)
    const { data: stillThere } = await supabase
      .from("muracietler")
      .select("id")
      .eq("id", pendingDelete.id)
      .maybeSingle();

    setDeleting(false);

    if (stillThere) {
      alert(
        "Silmə əməliyyatı yerinə yetirilmədi.\n\n" +
        "Səbəb: Supabase RLS policy `DELETE` icazəsi vermir.\n\n" +
        "Həll: Supabase Dashboard → SQL Editor-də `supabase/public_catalog_policies.sql` faylını Run edin."
      );
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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg shadow-sm">
                <Inbox className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Müraciətlər
              </h1>
            </div>
            <p className="text-muted-foreground text-sm pl-12">
              Landing page-dən gələn müraciətlər
            </p>
          </div>

          <Button
            variant="outline"
            className="gap-2 border-primary/20 text-primary hover:bg-primary/10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Button>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard
            label="Gözləmədə"
            value={counts.gozlemede}
            colorClass="text-amber-600"
            bgClass="bg-amber-500/10 border-amber-500/30"
            active={filter === "gozlemede"}
            onClick={() => setFilter(filter === "gozlemede" ? "hamisi" : "gozlemede")}
          />
          <SummaryCard
            label="Qəbul"
            value={counts.qebul}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-500/10 border-emerald-500/30"
            active={filter === "qebul"}
            onClick={() => setFilter(filter === "qebul" ? "hamisi" : "qebul")}
          />
          <SummaryCard
            label="Rədd"
            value={counts.red}
            colorClass="text-rose-600"
            bgClass="bg-rose-500/10 border-rose-500/30"
            active={filter === "red"}
            onClick={() => setFilter(filter === "red" ? "hamisi" : "red")}
          />
        </div>

        {/* Toolbar: filter tabs + search + refresh */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border bg-card/40">
          {(["hamisi", "gozlemede", "qebul", "red"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f === "hamisi" ? "Hamısı" : STATUS_META[f].label}
            </button>
          ))}

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ad, email, universitet, telefon..."
              className="pl-9 h-9 bg-background border-border"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Yenilə
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Yüklənir...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed bg-card/30 text-muted-foreground">
            Müraciət yoxdur
          </div>
        ) : (
          <div className="space-y-3">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border bg-card shadow-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Müraciəti sil</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              <span className="font-semibold text-foreground">{pendingDelete.ad_soyad}</span>{" "}
              adlı şəxsin{" "}
              <span className="font-semibold text-foreground">{pendingDelete.universitet}</span>{" "}
              müraciətini silmək istədiyinizə əminsiniz? Bu əməliyyat geri alınmazdır.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="border-border"
              >
                Ləğv et
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Silinir..." : "Bəli, sil"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Summary card ─────────────────────────────────────────── */
function SummaryCard({
  label, value, colorClass, bgClass, active, onClick,
}: {
  label: string;
  value: number;
  colorClass: string;
  bgClass: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-2xl border text-left transition-all ${
        active
          ? `${bgClass} shadow-md scale-[1.02]`
          : "bg-card/40 border-border hover:bg-card/60"
      }`}
    >
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-1">
        {label}
      </div>
    </button>
  );
}

/* ── Card ─────────────────────────────────────────────────── */
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
    <div className="rounded-2xl border bg-card/60 hover:bg-card/80 transition-colors p-5">
      {/* Top row: university + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base text-foreground">{m.universitet}</h3>
            {m.qisa_ad && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                {m.qisa_ad}
              </span>
            )}
          </div>
          {m.seher && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {m.seher}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{date}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${meta.className}`}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Contact info */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground py-3 border-t border-border">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> {m.ad_soyad}
        </span>
        <a
          href={`mailto:${m.email}`}
          className="flex items-center gap-1.5 text-primary hover:underline"
        >
          <Mail className="h-3.5 w-3.5" /> {m.email}
        </a>
        {m.telefon && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {m.telefon}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {m.status === "gozlemede" && (
          <>
            <Button
              size="sm"
              onClick={() => onUpdate(m.id, "qebul")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <Check className="h-4 w-4" /> Qəbul et
            </Button>
            <Button
              size="sm"
              onClick={() => onUpdate(m.id, "red")}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              <X className="h-4 w-4" /> Rədd et
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(m)}
          className="ml-auto gap-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
          title="Müraciəti sil"
        >
          <Trash2 className="h-4 w-4" /> Sil
        </Button>
      </div>
    </div>
  );
}
