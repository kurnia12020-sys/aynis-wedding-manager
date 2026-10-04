"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Home,
  HeartHandshake,
  WalletCards,
  CalendarDays,
  Store,
  Plus,
  X,
  Pencil,
  Trash2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Banknote,
  Package,
  ReceiptText,
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  TrendingUp,
  Cloud,
  LogOut,
  Users,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

import { supabase, supabaseConfigured } from "../lib/cloud";

const WEDDING_KEY = "aynis-finance-flow-weddings-v3";
const VENDOR_KEY = "aynis-finance-flow-vendors-v3";
const PACKAGE_KEY = "aynis-finance-flow-packages-v1";

const emptyWedding = {
  id: null,
  couple: "",
  whatsapp: "",
  date: "",
  place: "",
  packageName: "",
  dealPrice: "",
  initialPayment: "",
  notes: "",
  packageItems: [],
};

const emptyPackage = { id: null, name: "", price: "", notes: "", active: true };

const emptyVendor = {
  id: null,
  name: "",
  category: "",
  whatsapp: "",
  address: "",
  referencePrice: "",
  notes: "",
};

const emptyPackageItem = {
  id: null,
  vendorId: "",
  name: "",
  category: "",
  actualCost: "",
  paidAmount: "",
  vendorPayments: [],
  notes: "",
};

const rp = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const onlyDigits = (value) => String(value ?? "").replace(/\D/g, "");
const parseMoney = (value) => Number(onlyDigits(value) || 0);
const formatMoneyInput = (value) => {
  const digits = onlyDigits(value);
  return digits ? Number(digits).toLocaleString("id-ID") : "";
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function shiftDate(date, days) {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function defaultPaymentSchedule(wedding, existing = null) {
  const deal = Number(wedding?.dealPrice || 0);
  const dp1 = Math.min(1000000, deal);
  const target30 = Math.round(deal * 0.3);
  const target70 = Math.round(deal * 0.7);
  const dp2 = Math.max(target30 - dp1, 0);
  const dp3 = Math.max(target70 - dp1 - dp2, 0);
  const finalPayment = Math.max(deal - dp1 - dp2 - dp3, 0);
  const defaults = [
    { id: "dp1", key: "dp1", label: "DP 1 / Booking Tanggal", amount: dp1, plannedAmount: dp1, dueDate: "", paid: false, paidDate: "", notes: "Booking tanggal" },
    { id: "dp2", key: "dp2", label: "DP 2 / Target 30%", amount: dp2, plannedAmount: dp2, dueDate: "", paid: false, paidDate: "", notes: "Total pembayaran mencapai 30% dari Harga Deal" },
    { id: "dp3", key: "dp3", label: "DP 3 / Target 70% (H-7)", amount: dp3, plannedAmount: dp3, dueDate: shiftDate(wedding?.date, -7), paid: false, paidDate: "", notes: "Total pembayaran mencapai 70% dari Harga Deal" },
    { id: "final", key: "final", label: "Pelunasan / H+2", amount: finalPayment, plannedAmount: finalPayment, dueDate: shiftDate(wedding?.date, 2), paid: false, paidDate: "", notes: "Sisa tagihan setelah acara" },
  ];
  if (!Array.isArray(existing) || existing.length === 0) return defaults;
  return defaults.map((base) => {
    const saved = existing.find((item) => item.key === base.key || item.id === base.id);
    if (!saved) return base;
    const plannedAmount = saved.plannedAmount != null ? Number(saved.plannedAmount || 0) : Number(saved.amount ?? base.amount);
    return { ...base, ...saved, plannedAmount, dueDate: ["dp3", "final"].includes(base.key) ? base.dueDate : (saved.dueDate || base.dueDate) };
  });
}

function paymentHistoryTotal(wedding) {
  return (wedding.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
}

function applyPaymentHistoryToSchedule(wedding, schedule) {
  let credit = paymentHistoryTotal(wedding);
  return schedule.map((item) => {
    const plannedAmount = Number(item.plannedAmount ?? item.amount ?? 0);
    if (item.paid) {
      // If this stage had already been reduced by a cicilan before being checked paid,
      // consume only that gap so the same cicilan is not used twice on later stages.
      const usedCredit = Math.max(plannedAmount - Number(item.amount || 0), 0);
      credit = Math.max(credit - usedCredit, 0);
      return { ...item, plannedAmount };
    }
    const reduction = Math.min(credit, plannedAmount);
    credit -= reduction;
    return { ...item, plannedAmount, amount: Math.max(plannedAmount - reduction, 0) };
  });
}

function recalculateFollowingPayments(wedding, schedule, changedKey) {
  const deal = Number(wedding?.dealPrice || 0);
  const target30 = Math.round(deal * 0.3);
  const target70 = Math.round(deal * 0.7);
  const next = schedule.map((item) => ({
    ...item,
    plannedAmount: Number(item.plannedAmount ?? item.amount ?? 0),
    amount: Number(item.amount || 0),
  }));
  const byKey = Object.fromEntries(next.map((item) => [item.key, item]));

  const dp1 = Number(byKey.dp1?.plannedAmount || 0);
  if (changedKey === "dp1") {
    byKey.dp2.plannedAmount = Math.max(target30 - dp1, 0);
    if (!byKey.dp2.paid) byKey.dp2.amount = byKey.dp2.plannedAmount;
  }

  const dp2 = Number(byKey.dp2?.plannedAmount || 0);
  if (["dp1", "dp2"].includes(changedKey)) {
    byKey.dp3.plannedAmount = Math.max(target70 - dp1 - dp2, 0);
    if (!byKey.dp3.paid) byKey.dp3.amount = byKey.dp3.plannedAmount;
  }

  const dp3 = Number(byKey.dp3?.plannedAmount || 0);
  if (["dp1", "dp2", "dp3"].includes(changedKey)) {
    byKey.final.plannedAmount = Math.max(deal - dp1 - dp2 - dp3, 0);
    if (!byKey.final.paid) byKey.final.amount = byKey.final.plannedAmount;
  }

  return applyPaymentHistoryToSchedule(wedding, next);
}

function scheduledPaidTotal(wedding) {
  return (wedding.paymentSchedule || []).reduce((sum, item) => sum + (item.paid ? Number(item.amount || 0) : 0), 0);
}

function totalPayments(wedding) {
  return paymentHistoryTotal(wedding) + scheduledPaidTotal(wedding);
}

function totalExpenses(wedding) {
  return (wedding.packageItems || []).reduce((sum, item) => sum + Number(item.actualCost || 0), 0);
}

function vendorPaid(item) {
  if (Array.isArray(item.vendorPayments) && item.vendorPayments.length > 0) {
    return item.vendorPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }
  return Number(item.paidAmount || 0);
}

function vendorPaymentHistory(item, fallbackDate = "") {
  if (Array.isArray(item.vendorPayments) && item.vendorPayments.length > 0) return item.vendorPayments;
  const legacyPaid = Number(item.paidAmount || 0);
  if (legacyPaid <= 0) return [];
  return [{
    id: `legacy-${item.id}`,
    label: "Pembayaran vendor sebelumnya",
    amount: legacyPaid,
    date: fallbackDate,
    notes: "Migrasi dari data V3",
  }];
}

function totalExpensesPaid(wedding) {
  return (wedding.packageItems || []).reduce((sum, item) => sum + vendorPaid(item), 0);
}

function financials(wedding) {
  const deal = Number(wedding.dealPrice || 0);
  const incoming = totalPayments(wedding);
  const expenses = totalExpenses(wedding);
  const expensesPaid = totalExpensesPaid(wedding);
  return {
    deal,
    incoming,
    remaining: Math.max(deal - incoming, 0),
    expenses,
    expensesPaid,
    vendorDebt: Math.max(expenses - expensesPaid, 0),
    profit: deal - expenses,
    cashOnHand: incoming - expensesPaid,
  };
}

function paymentStatus(wedding) {
  if (wedding.completed) return "Selesai";
  const f = financials(wedding);
  if (f.deal > 0 && f.remaining === 0) return "Lunas";
  const count = (wedding.payments || []).length;
  if (count === 0) return "Booking";
  if (count === 1) return "DP";
  return "Belum Lunas";
}

function itemStatus(item) {
  const cost = Number(item.actualCost || 0);
  const paid = vendorPaid(item);
  if (cost > 0 && paid >= cost) return "Lunas";
  if (paid > 0) return "DP";
  return "Belum Bayar";
}

export default function Page() {
  const today = new Date();
  const [tab, setTab] = useState("Home");
  const [weddings, setWeddings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [packages, setPackages] = useState([]);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudState, setCloudState] = useState("connecting");
  const [cloudMessage, setCloudMessage] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [selectedWeddingId, setSelectedWeddingId] = useState(null);
  const [membership, setMembership] = useState(null);
  const applyingRemoteRef = useRef(false);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [members, setMembers] = useState([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviteBusy, setInviteBusy] = useState(false);

  const [weddingOpen, setWeddingOpen] = useState(false);
  const [weddingForm, setWeddingForm] = useState(emptyWedding);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentWeddingId, setPaymentWeddingId] = useState(null);
  const [paymentEditId, setPaymentEditId] = useState(null);
  const [paymentLabel, setPaymentLabel] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentNote, setPaymentNote] = useState("");

  const [vendorPaymentOpen, setVendorPaymentOpen] = useState(false);
  const [vendorPaymentWeddingId, setVendorPaymentWeddingId] = useState(null);
  const [vendorPaymentItemId, setVendorPaymentItemId] = useState(null);
  const [vendorPaymentEditId, setVendorPaymentEditId] = useState(null);
  const [vendorPaymentLabel, setVendorPaymentLabel] = useState("");
  const [vendorPaymentAmount, setVendorPaymentAmount] = useState("");
  const [vendorPaymentDate, setVendorPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [vendorPaymentNote, setVendorPaymentNote] = useState("");

  const [packageOpen, setPackageOpen] = useState(false);
  const [packageWeddingId, setPackageWeddingId] = useState(null);
  const [packageForm, setPackageForm] = useState(emptyPackageItem);

  const [packageMasterOpen, setPackageMasterOpen] = useState(false);
  const [packageMasterForm, setPackageMasterForm] = useState(emptyPackage);

  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendor);

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  function readLocalSnapshot() {
    let localWeddings = [];
    let localVendors = [];
    let localPackages = [];
    try {
      const currentRaw = localStorage.getItem(WEDDING_KEY);
      if (currentRaw) {
        const parsed = JSON.parse(currentRaw);
        if (Array.isArray(parsed)) localWeddings = parsed;
      } else {
        const oldRaw =
          localStorage.getItem("aynis-weddings-v3") ||
          localStorage.getItem("aynis-wedding-manager-weddings-v2") ||
          localStorage.getItem("aynis-wedding-manager-weddings-v1");
        if (oldRaw) {
          const parsed = JSON.parse(oldRaw);
          if (Array.isArray(parsed)) {
            localWeddings = parsed.map((x, index) => {
              const deal = Number(x.dealPrice ?? x.value ?? x.booking ?? 0);
              const oldPaid = Number(x.paid ?? 0);
              return {
                id: x.id || Date.now() + index,
                couple: x.couple ?? x.client ?? "",
                whatsapp: x.whatsapp ?? x.phone ?? "",
                date: x.date ?? "",
                place: x.place ?? x.location ?? "",
                packageName: x.packageName ?? "",
                dealPrice: deal,
                notes: x.notes ?? "",
                completed: Boolean(x.completed),
                payments: oldPaid > 0 ? [{ id: Date.now() + index + 1000, amount: oldPaid, note: "Pembayaran sebelumnya", date: x.date || "" }] : [],
                packageItems: Array.isArray(x.packageItems) ? x.packageItems : [],
                createdAt: x.createdAt || new Date().toISOString(),
              };
            });
          }
        }
      }

      const packageRaw = localStorage.getItem(PACKAGE_KEY);
      if (packageRaw) {
        const parsed = JSON.parse(packageRaw);
        if (Array.isArray(parsed)) localPackages = parsed;
      }

      const vendorRaw = localStorage.getItem(VENDOR_KEY) || localStorage.getItem("aynis-vendors-v1");
      if (vendorRaw) {
        const parsed = JSON.parse(vendorRaw);
        if (Array.isArray(parsed)) {
          localVendors = parsed.map((v) => ({
            id: v.id || Date.now() + Math.random(),
            name: v.name || "",
            category: v.category || "",
            whatsapp: v.whatsapp || "",
            address: v.address || "",
            referencePrice: Number(v.referencePrice || 0),
            notes: v.notes || "",
          }));
        }
      }
    } catch (error) {
      console.error("Gagal membaca data lokal", error);
    }
    return { weddings: localWeddings, vendors: localVendors, packages: localPackages };
  }

  async function loadMembers(wsId, activeMembership) {
    if (!supabase || !wsId || activeMembership?.role !== "owner") {
      setMembers([]);
      return;
    }
    const { data, error } = await supabase
      .from("workspace_members")
      .select("id,user_id,invited_email,role,permissions,status,created_at")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    setMembers(data || []);
  }

  async function bootCloud(activeSession = null) {
    if (!supabaseConfigured || !supabase) {
      setCloudState("needs-config");
      setReady(true);
      return;
    }
    setCloudState("connecting");
    setCloudMessage("");
    setCloudReady(false);
    try {
      let currentSession = activeSession;
      if (!currentSession) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        currentSession = data.session;
      }
      setSession(currentSession);
      if (!currentSession?.user) {
        setMembership(null);
        setWorkspaceId(null);
        setCloudState("signed-out");
        setReady(true);
        return;
      }

      const userId = currentSession.user.id;
      await supabase.rpc("claim_workspace_invitation");
      const { data: member, error: memberError } = await supabase
        .from("workspace_members")
        .select("id,workspace_id,role,permissions,status,invited_email")
        .eq("user_id", userId)
        .maybeSingle();
      if (memberError) throw memberError;
      if (!member || member.status !== "active") {
        setMembership(null);
        setWorkspaceId(null);
        setCloudState("no-access");
        setCloudMessage("Akun ini belum ditambahkan oleh Owner Aynis.");
        setReady(true);
        return;
      }

      setMembership(member);
      setWorkspaceId(member.workspace_id);

      const { data, error } = await supabase
        .from("app_state")
        .select("weddings,vendors,packages,schema_version,updated_at,workspace_id")
        .eq("workspace_id", member.workspace_id)
        .maybeSingle();
      if (error) throw error;

      if (data) {
        setWeddings(Array.isArray(data.weddings) ? data.weddings : []);
        setVendors(Array.isArray(data.vendors) ? data.vendors : []);
        setPackages(Array.isArray(data.packages) ? data.packages : []);
        setCloudMessage("Data workspace Aynis tersambung.");
      } else if (member.role === "owner") {
        const local = readLocalSnapshot();
        const { error: insertError } = await supabase.from("app_state").insert({
          user_id: userId,
          workspace_id: member.workspace_id,
          weddings: local.weddings,
          vendors: local.vendors,
          packages: local.packages,
          schema_version: 41,
          updated_at: new Date().toISOString(),
        });
        if (insertError) throw insertError;
        setWeddings(local.weddings);
        setVendors(local.vendors);
        setPackages(local.packages);
      } else {
        throw new Error("Database workspace belum disiapkan oleh Owner.");
      }

      await loadMembers(member.workspace_id, member);
      setCloudReady(true);
      setCloudState("online");
      setReady(true);
    } catch (error) {
      console.error(error);
      setCloudState("error");
      setCloudMessage(error.message || "Gagal menghubungkan Supabase.");
      setReady(true);
    }
  }

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setCloudState("needs-config");
      setReady(true);
      return;
    }
    bootCloud();
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "SIGNED_IN" && nextSession) bootCloud(nextSession);
      if (event === "SIGNED_OUT") {
        setWeddings([]);
        setVendors([]);
        setPackages([]);
        setSelectedWeddingId(null);
        setMembership(null);
        setWorkspaceId(null);
        setMembers([]);
        setCloudReady(false);
        setCloudState("signed-out");
        setReady(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!cloudReady || !session?.user?.id || !workspaceId || !supabase) return;
    const canEdit = membership?.role === "owner" || membership?.role === "admin";
    if (!canEdit) return;
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("app_state").update({
        weddings,
        vendors,
        packages,
        schema_version: 45,
        updated_at: new Date().toISOString(),
      }).eq("workspace_id", workspaceId);
      if (error) {
        console.error("Gagal sinkron Supabase", error);
        setCloudState("error");
        setCloudMessage("Perubahan belum tersimpan ke cloud. Coba cek koneksi internet.");
      } else {
        setCloudState("online");
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [weddings, vendors, packages, cloudReady, session, workspaceId, membership]);

  useEffect(() => {
    if (!cloudReady || !workspaceId || !supabase) return;
    const channel = supabase
      .channel(`aynis-app-state-${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_state", filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          const next = payload.new || {};
          applyingRemoteRef.current = true;
          if (Array.isArray(next.weddings)) setWeddings(next.weddings);
          if (Array.isArray(next.vendors)) setVendors(next.vendors);
          if (Array.isArray(next.packages)) setPackages(next.packages);
          setCloudState("online");
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cloudReady, workspaceId]);

  useEffect(() => {
    if (!cloudReady) return;
    localStorage.setItem(WEDDING_KEY, JSON.stringify(weddings));
    localStorage.setItem(VENDOR_KEY, JSON.stringify(vendors));
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(packages));
  }, [weddings, vendors, packages, cloudReady]);

  async function handleAuth(event) {
    event.preventDefault();
    if (!supabase) return;
    if (!authEmail.trim() || !authPassword) {
      setCloudMessage("Email dan password wajib diisi.");
      return;
    }
    if (authPassword.length < 6) {
      setCloudMessage("Password minimal 6 karakter.");
      return;
    }
    setAuthBusy(true);
    setCloudMessage("");
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setCloudMessage("Akun dibuat. Cek email untuk konfirmasi, lalu masuk.");
          setAuthMode("signin");
        } else {
          await bootCloud(data.session);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        await bootCloud(data.session);
      }
    } catch (error) {
      setCloudMessage(error.message || "Gagal masuk ke akun.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOutCloud() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const selectedWedding = weddings.find((w) => String(w.id) === String(selectedWeddingId));

  const totals = useMemo(() => {
    return weddings.reduce(
      (acc, wedding) => {
        const f = financials(wedding);
        acc.deal += f.deal;
        acc.incoming += f.incoming;
        acc.remaining += f.remaining;
        acc.expenses += f.expenses;
        acc.expensesPaid += f.expensesPaid;
        acc.profit += f.profit;
        acc.cashOnHand += f.cashOnHand;
        return acc;
      },
      { deal: 0, incoming: 0, remaining: 0, expenses: 0, expensesPaid: 0, profit: 0, cashOnHand: 0 }
    );
  }, [weddings]);

  const upcoming = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return [...weddings]
      .filter((w) => w.date && new Date(`${w.date}T00:00:00`) >= current)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [weddings]);

  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const days = new Date(year, month + 1, 0).getDate();
    let offset = first.getDay();
    offset = offset === 0 ? 6 : offset - 1;
    const cells = Array(offset).fill(null);
    for (let d = 1; d <= days; d += 1) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month, year]);

  const eventsByDay = useMemo(() => {
    const map = {};
    weddings.forEach((w) => {
      if (!w.date) return;
      const [y, m, d] = w.date.split("-").map(Number);
      if (y === year && m - 1 === month) {
        if (!map[d]) map[d] = [];
        map[d].push(w);
      }
    });
    return map;
  }, [weddings, month, year]);

  const yearOptions = Array.from({ length: 21 }, (_, i) => today.getFullYear() - 5 + i);

  function openNewWedding() {
    setWeddingForm(emptyWedding);
    setWeddingOpen(true);
  }

  function openEditWedding(wedding) {
    setWeddingForm({
      id: wedding.id,
      couple: wedding.couple || "",
      whatsapp: wedding.whatsapp || "",
      date: wedding.date || "",
      place: wedding.place || "",
      packageName: wedding.packageName || "",
      dealPrice: String(wedding.dealPrice ?? ""),
      initialPayment: "",
      notes: wedding.notes || "",
      packageItems: (wedding.packageItems || []).map((item) => ({
        ...item,
        vendorId: item.vendorId ? String(item.vendorId) : "",
        actualCost: String(item.actualCost ?? ""),
        paidAmount: String(vendorPaid(item) ?? ""),
        vendorPayments: Array.isArray(item.vendorPayments) ? item.vendorPayments : [],
      })),
    });
    setWeddingOpen(true);
  }

  async function saveWedding(event) {
    event.preventDefault();
    try {
    const dealPrice = Number(weddingForm.dealPrice || 0);
    const initialPayment = Number(weddingForm.initialPayment || 0);

    if (!weddingForm.couple.trim()) return alert("Nama pengantin wajib diisi.");
    if (!weddingForm.date) return alert("Tanggal wedding wajib dipilih.");
    if (!weddingForm.place.trim()) return alert("Lokasi wajib diisi.");
    if (!weddingForm.packageName.trim()) return alert("Nama paket wajib diisi.");
    if (dealPrice <= 0) return alert("Harga Deal harus lebih dari Rp0.");
    if (initialPayment < 0 || initialPayment > dealPrice) return alert("Pembayaran awal tidak valid.");

    const old = weddings.find((w) => w.id === weddingForm.id);
    const normalizedItems = (weddingForm.packageItems || []).map((item, index) => {
      const actualCost = Number(item.actualCost || 0);
      const paidAmount = Number(item.paidAmount || 0);
      if (!item.name?.trim()) throw new Error(`Nama isi paket ke-${index + 1} belum diisi.`);
      if (!item.category?.trim()) throw new Error(`Kategori isi paket ke-${index + 1} belum diisi.`);
      if (actualCost < 0) throw new Error(`Biaya isi paket ke-${index + 1} tidak valid.`);
      let vendorPayments = Array.isArray(item.vendorPayments) ? item.vendorPayments : [];
      if (vendorPayments.length === 0 && paidAmount > 0) {
        vendorPayments = [{
          id: Date.now() + index + 500,
          label: typeof item.id === "number" ? "Pembayaran vendor sebelumnya" : "Pembayaran Awal Vendor",
          amount: paidAmount,
          date: weddingForm.date || new Date().toISOString().slice(0, 10),
          notes: "",
        }];
      }
      const paidFromHistory = vendorPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      if (paidFromHistory < 0 || paidFromHistory > actualCost) throw new Error(`Pembayaran vendor pada isi paket ke-${index + 1} tidak valid.`);
      return {
        id: typeof item.id === "number" ? item.id : Date.now() + index + 10,
        vendorId: item.vendorId || "",
        name: item.name.trim(),
        category: item.category.trim(),
        actualCost,
        paidAmount: paidFromHistory,
        vendorPayments,
        notes: item.notes?.trim() || "",
      };
    });

    const record = {
      id: weddingForm.id || Date.now(),
      couple: weddingForm.couple.trim(),
      whatsapp: weddingForm.whatsapp.trim(),
      date: weddingForm.date,
      place: weddingForm.place.trim(),
      packageName: weddingForm.packageName.trim(),
      dealPrice,
      notes: weddingForm.notes.trim(),
      completed: old?.completed || false,
      payments: old?.payments || [],
      paymentSchedule: defaultPaymentSchedule({ dealPrice, date: weddingForm.date }, old?.paymentSchedule),
      packageItems: normalizedItems,
      createdAt: old?.createdAt || new Date().toISOString(),
    };

    if (!weddingForm.id && initialPayment > 0) {
      record.paymentSchedule = record.paymentSchedule.map((item) => item.key === "dp1" ? {
        ...item,
        amount: initialPayment,
        plannedAmount: initialPayment,
        paid: true,
        paidDate: new Date().toISOString().slice(0, 10),
      } : item);
      record.paymentSchedule = recalculateFollowingPayments(record, record.paymentSchedule, "dp1");
    }

    let nextWeddings = null;
    if (cloudReady && workspaceId && supabase && (membership?.role === "owner" || membership?.role === "admin")) {
      setCloudState("saving");
      setCloudMessage("Menyimpan wedding ke cloud…");
      const { data: latest, error: latestError } = await supabase
        .from("app_state")
        .select("weddings")
        .eq("workspace_id", workspaceId)
        .single();
      if (latestError) throw latestError;
      const cloudWeddings = Array.isArray(latest?.weddings) ? latest.weddings : [];
      const exists = cloudWeddings.some((w) => w.id === record.id);
      nextWeddings = exists
        ? cloudWeddings.map((w) => (w.id === record.id ? record : w))
        : [record, ...cloudWeddings.filter((w) => w.id !== record.id)];
      const { error: saveError } = await supabase
        .from("app_state")
        .update({ weddings: nextWeddings, schema_version: 45, updated_at: new Date().toISOString() })
        .eq("workspace_id", workspaceId);
      if (saveError) throw saveError;
      setCloudState("online");
      setCloudMessage("Wedding tersimpan ke cloud.");
    } else {
      nextWeddings = (() => {
        const exists = weddings.some((w) => w.id === record.id);
        return exists ? weddings.map((w) => (w.id === record.id ? record : w)) : [record, ...weddings];
      })();
    }

    setWeddings(nextWeddings);

    const selected = new Date(`${record.date}T00:00:00`);
    setMonth(selected.getMonth());
    setYear(selected.getFullYear());
    setWeddingOpen(false);
    setWeddingForm(emptyWedding);
    setSelectedWeddingId(record.id);
    setTab("Wedding");
    } catch (error) {
      alert(error.message || "Data wedding belum lengkap.");
    }
  }

  function addWeddingDraftItem() {
    const draftId = `draft-${Date.now()}-${Math.random()}`;
    setWeddingForm((current) => ({
      ...current,
      packageItems: [
        {
          id: draftId,
          vendorId: "",
          name: "",
          category: "",
          actualCost: "",
          paidAmount: "",
          vendorPayments: [],
          notes: "",
        },
        ...(current.packageItems || []),
      ],
    }));
    setTimeout(() => {
      const el = document.getElementById(`draft-name-${draftId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
    }, 40);
  }

  function updateWeddingDraftItem(index, patch) {
    setWeddingForm((current) => ({
      ...current,
      packageItems: (current.packageItems || []).map((item, i) => i === index ? { ...item, ...patch } : item),
    }));
  }

  function chooseWeddingDraftVendor(index, vendorId) {
    const vendor = vendors.find((v) => String(v.id) === String(vendorId));
    if (!vendor) {
      updateWeddingDraftItem(index, { vendorId: "" });
      return;
    }
    const item = (weddingForm.packageItems || [])[index] || {};
    updateWeddingDraftItem(index, {
      vendorId: String(vendor.id),
      name: vendor.name,
      category: vendor.category,
      actualCost: item.actualCost || String(vendor.referencePrice || ""),
    });
  }

  function removeWeddingDraftItem(index) {
    setWeddingForm((current) => ({
      ...current,
      packageItems: (current.packageItems || []).filter((_, i) => i !== index),
    }));
  }

  function deleteWedding(id) {
    if (!confirm("Hapus wedding ini beserta pembayaran dan isi paketnya?")) return;
    setWeddings((current) => current.filter((w) => w.id !== id));
    if (String(selectedWeddingId) === String(id)) setSelectedWeddingId(null);
  }

  function openPayment(wedding, payment = null) {
    setPaymentWeddingId(wedding.id);
    setPaymentEditId(payment?.id || null);
    setPaymentLabel(payment?.label || payment?.note || (wedding.payments?.length ? "Cicilan" : "DP"));
    setPaymentAmount(payment ? String(payment.amount ?? "") : "");
    setPaymentDate(payment?.date || new Date().toISOString().slice(0, 10));
    setPaymentNote(payment?.notes || "");
    setPaymentOpen(true);
  }

  function savePayment(event) {
    event.preventDefault();
    const wedding = weddings.find((w) => String(w.id) === String(paymentWeddingId));
    if (!wedding) return;
    const amount = parseMoney(paymentAmount);
    const editing = (wedding.payments || []).find((p) => String(p.id) === String(paymentEditId));
    const f = financials(wedding);
    const maxAllowed = f.remaining + Number(editing?.amount || 0);
    if (!paymentLabel.trim()) return alert("Tahap / nama pembayaran wajib diisi.");
    if (!paymentDate) return alert("Tanggal pembayaran wajib dipilih.");
    if (amount <= 0) return alert("Nominal pembayaran harus lebih dari Rp0.");
    if (amount > maxAllowed) return alert("Pembayaran melebihi sisa tagihan.");

    const record = {
      id: paymentEditId || Date.now(),
      label: paymentLabel.trim(),
      amount,
      date: paymentDate,
      notes: paymentNote.trim(),
    };

    setWeddings((current) => current.map((w) => {
      if (String(w.id) !== String(paymentWeddingId)) return w;
      const list = w.payments || [];
      const exists = list.some((p) => String(p.id) === String(record.id));
      const payments = exists ? list.map((p) => String(p.id) === String(record.id) ? record : p) : [...list, record];
      const nextWedding = { ...w, payments };
      const schedule = defaultPaymentSchedule(nextWedding, w.paymentSchedule);
      return { ...nextWedding, paymentSchedule: applyPaymentHistoryToSchedule(nextWedding, schedule) };
    }));
    setPaymentOpen(false);
  }

  function deletePayment(weddingId, paymentId) {
    if (!confirm("Hapus catatan pembayaran ini?")) return;
    setWeddings((current) => current.map((w) => {
      if (w.id !== weddingId) return w;
      const nextWedding = { ...w, payments: (w.payments || []).filter((p) => p.id !== paymentId) };
      const schedule = defaultPaymentSchedule(nextWedding, w.paymentSchedule);
      return { ...nextWedding, paymentSchedule: applyPaymentHistoryToSchedule(nextWedding, schedule) };
    }));
  }

  function updatePaymentScheduleItem(weddingId, stageKey, patch) {
    setWeddings((current) => current.map((w) => {
      if (String(w.id) !== String(weddingId)) return w;
      const schedule = defaultPaymentSchedule(w, w.paymentSchedule);
      let updated = schedule.map((item) => item.key === stageKey ? {
        ...item,
        ...patch,
        ...(Object.prototype.hasOwnProperty.call(patch, "amount") ? { plannedAmount: Number(patch.amount || 0), amount: Number(patch.amount || 0) } : {}),
      } : item);
      if (Object.prototype.hasOwnProperty.call(patch, "amount")) {
        updated = recalculateFollowingPayments(w, updated, stageKey);
      } else {
        updated = applyPaymentHistoryToSchedule(w, updated);
      }
      return { ...w, paymentSchedule: updated };
    }));
  }

  function togglePaymentScheduleItem(wedding, stage) {
    const nextPaid = !stage.paid;
    updatePaymentScheduleItem(wedding.id, stage.key, {
      paid: nextPaid,
      paidDate: nextPaid ? new Date().toISOString().slice(0, 10) : "",
    });
  }

  function resetPaymentSchedule(wedding) {
    if (!confirm("Hitung ulang nominal DP berdasarkan Harga Deal saat ini? Status pembayaran yang sudah dicentang akan dipertahankan.")) return;
    const current = defaultPaymentSchedule(wedding, wedding.paymentSchedule);
    const freshBase = defaultPaymentSchedule(wedding, null).map((base) => {
      const oldStage = current.find((item) => item.key === base.key);
      return { ...base, paid: Boolean(oldStage?.paid), paidDate: oldStage?.paidDate || "", amount: oldStage?.paid ? Number(oldStage.amount || 0) : base.amount };
    });
    const fresh = applyPaymentHistoryToSchedule(wedding, freshBase);
    setWeddings((list) => list.map((w) => String(w.id) === String(wedding.id) ? { ...w, paymentSchedule: fresh } : w));
  }

  function toggleWeddingComplete(wedding) {
    const f = financials(wedding);
    if (!wedding.completed && f.remaining > 0) {
      return alert("Wedding baru bisa ditandai Selesai setelah pembayaran klien Lunas.");
    }
    setWeddings((current) => current.map((w) =>
      String(w.id) === String(wedding.id) ? { ...w, completed: !w.completed } : w
    ));
  }

  function openNewPackageItem(wedding) {
    setPackageWeddingId(wedding.id);
    setPackageForm(emptyPackageItem);
    setPackageOpen(true);
  }

  function openEditPackageItem(wedding, item) {
    setPackageWeddingId(wedding.id);
    setPackageForm({
      id: item.id,
      vendorId: item.vendorId ? String(item.vendorId) : "",
      name: item.name || "",
      category: item.category || "",
      actualCost: String(item.actualCost ?? ""),
      paidAmount: String(vendorPaid(item) ?? ""),
      vendorPayments: Array.isArray(item.vendorPayments) ? item.vendorPayments : [],
      notes: item.notes || "",
    });
    setPackageOpen(true);
  }

  function chooseVendor(vendorId) {
    const vendor = vendors.find((v) => String(v.id) === String(vendorId));
    if (!vendor) {
      setPackageForm((f) => ({ ...f, vendorId: "" }));
      return;
    }
    setPackageForm((f) => ({
      ...f,
      vendorId: String(vendor.id),
      name: vendor.name,
      category: vendor.category,
      actualCost: f.actualCost || String(vendor.referencePrice || ""),
    }));
  }

  function savePackageItem(event) {
    event.preventDefault();
    const cost = Number(packageForm.actualCost || 0);
    const paid = Number(packageForm.paidAmount || 0);
    if (!packageForm.name.trim()) return alert("Nama item / vendor wajib diisi.");
    if (!packageForm.category.trim()) return alert("Kategori wajib diisi.");
    if (cost < 0) return alert("Biaya aktual tidak valid.");
    if (paid < 0 || paid > cost) return alert("Jumlah yang sudah dibayar vendor tidak valid.");

    let vendorPayments = Array.isArray(packageForm.vendorPayments) ? packageForm.vendorPayments : [];
    if (!packageForm.id && vendorPayments.length === 0 && paid > 0) {
      vendorPayments = [{ id: Date.now() + 1, label: "Pembayaran Awal Vendor", amount: paid, date: new Date().toISOString().slice(0, 10), notes: "" }];
    }
    const paidFromHistory = vendorPayments.length > 0 ? vendorPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0) : paid;

    const item = {
      id: packageForm.id || Date.now(),
      vendorId: packageForm.vendorId || "",
      name: packageForm.name.trim(),
      category: packageForm.category.trim(),
      actualCost: cost,
      paidAmount: paidFromHistory,
      vendorPayments,
      notes: packageForm.notes.trim(),
    };

    setWeddings((current) => current.map((w) => {
      if (String(w.id) !== String(packageWeddingId)) return w;
      const list = w.packageItems || [];
      const exists = list.some((x) => x.id === item.id);
      return { ...w, packageItems: exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item] };
    }));
    setPackageOpen(false);
  }

  function normalizedVendorPayments(wedding, item) {
    return vendorPaymentHistory(item, wedding.date || new Date().toISOString().slice(0, 10));
  }

  function openVendorPayment(wedding, item, payment = null) {
    setVendorPaymentWeddingId(wedding.id);
    setVendorPaymentItemId(item.id);
    setVendorPaymentEditId(payment?.id || null);
    setVendorPaymentLabel(payment?.label || (vendorPaid(item) > 0 ? "Cicilan Vendor" : "DP Vendor"));
    setVendorPaymentAmount(payment ? String(payment.amount ?? "") : "");
    setVendorPaymentDate(payment?.date || new Date().toISOString().slice(0, 10));
    setVendorPaymentNote(payment?.notes || "");
    setVendorPaymentOpen(true);
  }

  function saveVendorPayment(event) {
    event.preventDefault();
    const wedding = weddings.find((w) => String(w.id) === String(vendorPaymentWeddingId));
    const item = wedding?.packageItems?.find((x) => String(x.id) === String(vendorPaymentItemId));
    if (!wedding || !item) return;
    const amount = Number(vendorPaymentAmount || 0);
    const history = normalizedVendorPayments(wedding, item);
    const editing = history.find((p) => String(p.id) === String(vendorPaymentEditId));
    const currentPaid = history.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const maxAllowed = Number(item.actualCost || 0) - currentPaid + Number(editing?.amount || 0);
    if (!vendorPaymentLabel.trim()) return alert("Tahap pembayaran vendor wajib diisi.");
    if (!vendorPaymentDate) return alert("Tanggal pembayaran vendor wajib dipilih.");
    if (amount <= 0) return alert("Nominal pembayaran vendor harus lebih dari Rp0.");
    if (amount > maxAllowed) return alert("Pembayaran melebihi sisa tagihan vendor.");

    const record = {
      id: vendorPaymentEditId || Date.now(),
      label: vendorPaymentLabel.trim(),
      amount,
      date: vendorPaymentDate,
      notes: vendorPaymentNote.trim(),
    };
    const exists = history.some((p) => String(p.id) === String(record.id));
    const nextHistory = exists ? history.map((p) => String(p.id) === String(record.id) ? record : p) : [...history, record];
    const nextPaid = nextHistory.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    setWeddings((current) => current.map((w) => {
      if (String(w.id) !== String(wedding.id)) return w;
      return {
        ...w,
        packageItems: (w.packageItems || []).map((x) =>
          String(x.id) === String(item.id) ? { ...x, vendorPayments: nextHistory, paidAmount: nextPaid } : x
        ),
      };
    }));
    setVendorPaymentOpen(false);
  }

  function deleteVendorPayment(weddingId, itemId, paymentId) {
    if (!confirm("Hapus catatan pembayaran vendor ini?")) return;
    setWeddings((current) => current.map((w) => {
      if (String(w.id) !== String(weddingId)) return w;
      return {
        ...w,
        packageItems: (w.packageItems || []).map((item) => {
          if (String(item.id) !== String(itemId)) return item;
          const history = normalizedVendorPayments(w, item).filter((p) => String(p.id) !== String(paymentId));
          return { ...item, vendorPayments: history, paidAmount: history.reduce((sum, p) => sum + Number(p.amount || 0), 0) };
        }),
      };
    }));
  }

  function deletePackageItem(weddingId, itemId) {
    if (!confirm("Hapus pengeluaran / isi paket ini?")) return;
    setWeddings((current) => current.map((w) =>
      w.id === weddingId ? { ...w, packageItems: (w.packageItems || []).filter((x) => x.id !== itemId) } : w
    ));
  }

  function openNewPackageMaster() {
    setPackageMasterForm(emptyPackage);
    setPackageMasterOpen(true);
  }

  function openEditPackageMaster(pkg) {
    setPackageMasterForm({ ...pkg, price: String(pkg.price ?? "") });
    setPackageMasterOpen(true);
  }

  function savePackageMaster(event) {
    event.preventDefault();
    if (!packageMasterForm.name.trim()) return alert("Nama paket wajib diisi.");
    const price = Number(packageMasterForm.price || 0);
    if (price < 0) return alert("Harga paket tidak valid.");
    const record = {
      id: packageMasterForm.id || Date.now(),
      name: packageMasterForm.name.trim(),
      price,
      notes: packageMasterForm.notes.trim(),
      active: packageMasterForm.active !== false,
    };
    setPackages((current) => {
      const exists = current.some((x) => x.id === record.id);
      return exists ? current.map((x) => x.id === record.id ? record : x) : [record, ...current];
    });
    setPackageMasterOpen(false);
  }

  function deletePackageMaster(id) {
    if (!confirm("Hapus paket dari Master Harga? Wedding yang sudah memakai paket ini tidak berubah.")) return;
    setPackages((current) => current.filter((x) => x.id !== id));
  }

  function chooseMasterPackage(value) {
    if (!value) return;
    if (value === "__manual__") {
      setWeddingForm((f) => ({ ...f, packageName: "" }));
      setTimeout(() => document.getElementById("manual-package-name")?.focus(), 30);
      return;
    }
    const pkg = packages.find((x) => String(x.id) === String(value));
    if (!pkg) return;
    setWeddingForm((f) => ({ ...f, packageName: pkg.name, dealPrice: String(pkg.price ?? "") }));
  }

  function openNewVendor() {
    setVendorForm(emptyVendor);
    setVendorOpen(true);
  }

  function openEditVendor(vendor) {
    setVendorForm({ ...vendor, referencePrice: String(vendor.referencePrice ?? "") });
    setVendorOpen(true);
  }

  function saveVendor(event) {
    event.preventDefault();
    if (!vendorForm.name.trim()) return alert("Nama vendor wajib diisi.");
    if (!vendorForm.category.trim()) return alert("Kategori vendor wajib diisi.");
    const record = {
      id: vendorForm.id || Date.now(),
      name: vendorForm.name.trim(),
      category: vendorForm.category.trim(),
      whatsapp: vendorForm.whatsapp.trim(),
      address: vendorForm.address.trim(),
      referencePrice: Number(vendorForm.referencePrice || 0),
      notes: vendorForm.notes.trim(),
    };
    setVendors((current) => {
      const exists = current.some((v) => v.id === record.id);
      return exists ? current.map((v) => (v.id === record.id ? record : v)) : [record, ...current];
    });
    setVendorOpen(false);
  }

  function deleteVendor(id) {
    if (!confirm("Hapus vendor dari database? Data vendor yang sudah dipakai di wedding tidak akan ikut terhapus.")) return;
    setVendors((current) => current.filter((v) => v.id !== id));
  }

  function openWhatsApp(phone) {
    if (!phone) return;
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = `62${clean.slice(1)}`;
    window.open(`https://wa.me/${clean}`, "_blank");
  }

  function openDetail(wedding) {
    setSelectedWeddingId(wedding.id);
    setTab("Wedding");
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  if (!supabaseConfigured) {
    return <main className="cloudGate"><div className="cloudCard"><Cloud size={34}/><small>AYNIS · CLOUD DATA</small><h1>Supabase belum terhubung</h1><p>Environment variable Supabase belum tersedia pada deployment ini.</p></div></main>;
  }

  if (!ready || cloudState === "connecting") {
    return <main className="cloudGate"><div className="cloudCard"><Cloud size={34}/><small>AYNIS · CLOUD DATA</small><h1>Menghubungkan data…</h1><p>Menyiapkan database Aynis Wedding Manager.</p></div></main>;
  }

  if (!session) {
    return <main className="cloudGate"><form className="cloudCard authCard" onSubmit={handleAuth}><Cloud size={34}/><small>AYNIS ANIS MAKEUP · V4.4 TEAM</small><h1>{authMode === "signup" ? "Buat / Aktivasi Akun" : "Masuk ke Aynis"}</h1><p>Owner, Admin, dan Staff masuk dari link yang sama. Hak akses mengikuti akun masing-masing.</p><label>Email<input type="email" value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} placeholder="email@contoh.com" autoComplete="email"/></label><label>Password<input type="password" value={authPassword} onChange={(e)=>setAuthPassword(e.target.value)} placeholder="Minimal 6 karakter" autoComplete={authMode === "signup" ? "new-password" : "current-password"}/></label>{cloudMessage&&<div className="cloudNotice">{cloudMessage}</div>}<button className="primary full" type="submit" disabled={authBusy}>{authBusy ? "Memproses…" : authMode === "signup" ? "Buat Akun" : "Masuk"}</button><button className="authSwitch" type="button" onClick={()=>{setAuthMode(authMode === "signup" ? "signin" : "signup");setCloudMessage("");}}>{authMode === "signup" ? "Sudah punya akun? Masuk" : "Belum punya akun? Buat akun"}</button></form></main>;
  }

  if (cloudState === "no-access") {
    return <main className="cloudGate"><div className="cloudCard"><ShieldCheck size={34}/><small>AYNIS · AKSES TIM</small><h1>Akun belum diberi akses</h1><p>{cloudMessage || "Minta Owner menambahkan email ini sebagai Admin atau Staff."}</p><div className="cloudNotice">Login: {session?.user?.email || "-"}</div><button className="primary full" onClick={signOutCloud}>Keluar</button></div></main>;
  }

  const isOwner = membership?.role === "owner";
  const canEditData = membership?.role === "owner" || membership?.role === "admin";
  const canViewFinance = membership?.role === "owner" || membership?.permissions?.view_finance === true;

  async function inviteMember(event) {
    event.preventDefault();
    if (!isOwner || !workspaceId || !inviteEmail.trim()) return;
    setInviteBusy(true);
    setCloudMessage("");
    try {
      const email = inviteEmail.trim().toLowerCase();
      const permissions = inviteRole === "admin"
        ? { edit_data: true, view_finance: false, manage_users: false }
        : { edit_data: false, view_finance: false, manage_users: false };
      const { error } = await supabase.from("workspace_members").insert({
        workspace_id: workspaceId,
        invited_email: email,
        role: inviteRole,
        permissions,
        status: "pending",
      });
      if (error) throw error;
      setInviteEmail("");
      await loadMembers(workspaceId, membership);
      setCloudMessage(`Undangan ${inviteRole} untuk ${email} sudah dibuat.`);
    } catch (error) {
      setCloudMessage(error.message || "Gagal menambahkan pengguna.");
    } finally {
      setInviteBusy(false);
    }
  }

  async function removeMember(memberId) {
    if (!isOwner) return;
    if (!confirm("Hapus akses pengguna ini dari Aynis?")) return;
    const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
    if (error) return alert(error.message);
    await loadMembers(workspaceId, membership);
  }

  return (
    <main>
      <header>
        <div>
          <div className="eyebrow">AYNIS ANIS MAKEUP · V4.4 TEAM ACCESS</div>
          <h1>Aynis <span>Wedding Manager</span></h1>
        </div>
        <div className="headerCloud"><span className={`cloudBadge ${cloudState}`}><Cloud size={14}/> {cloudState === "online" ? "Cloud" : "Sync"}</span><button className="logoutButton" onClick={signOutCloud} title="Keluar"><LogOut size={16}/></button><button className="avatar" aria-label="Akun & Pengguna" onClick={()=>setAccountOpen(true)}>AA</button></div>
      </header>

      {tab === "Home" && (
        <>
          <section className="hero">
            <div>
              <span>FINANCE FLOW</span>
              <h2>Wedding rapi.<br/>Keuangan langsung terbaca.</h2>
              <p>Harga Deal, pembayaran klien, pengeluaran vendor, dan estimasi untung dalam satu aplikasi.</p>
            </div>
            {canEditData&&<button className="primary" onClick={openNewWedding}><Plus size={18}/> Tambah Wedding</button>}
          </section>

          {canViewFinance ? <section className="stats statsSix">
            <Card t="Wedding" v={weddings.length} s="Total data tersimpan" />
            <Card t="Harga Deal" v={rp(totals.deal)} s="Total nilai wedding" />
            <Card t="Uang Masuk" v={rp(totals.incoming)} s="Pembayaran klien" />
            <Card t="Sisa Tagihan" v={rp(totals.remaining)} s="Belum dibayar klien" />
            <Card t="Pengeluaran" v={rp(totals.expenses)} s="Total modal / vendor" />
            <Card t="Estimasi Untung" v={rp(totals.profit)} s={`Pegangan ${rp(totals.cashOnHand)}`} highlight />
          </section> : <section className="stats adminStats">
            <Card t="Wedding" v={weddings.length} s="Total data tersimpan" />
            <Card t="Akses" v="Admin" s="Data keuangan bisnis disembunyikan" />
          </section>}

          <div className="sectionHead">
            <div><small>AGENDA TERDEKAT</small><h3>Wedding Mendatang</h3></div>
            <button className="linkButton" onClick={() => setTab("Kalender")}>Lihat Kalender</button>
          </div>
          <section className="list">
            {!ready ? <Empty text="Memuat data..."/> : upcoming.length === 0 ? <Empty text="Belum ada wedding. Tekan Tambah Wedding untuk membuat data pertama."/> : upcoming.slice(0, 4).map((w) => <WeddingRow key={w.id} wedding={w} onDetail={openDetail} onWhatsApp={openWhatsApp}/>) }
          </section>
        </>
      )}

      {tab === "Wedding" && !selectedWedding && (
        <section className="panel">
          <div className="panelHeader">
            <div><small>DATA WEDDING</small><h2>Wedding</h2><p>Pilih wedding untuk melihat paket, pembayaran, pengeluaran, dan keuntungan.</p></div>
            {canEditData&&<button className="primary compact" onClick={openNewWedding}><Plus size={17}/> Tambah</button>}
          </div>
          <section className="list">
            {weddings.length === 0 ? <Empty text="Belum ada data wedding."/> : [...weddings].sort((a,b)=>(a.date||"").localeCompare(b.date||"")).map((w)=><WeddingRow key={w.id} wedding={w} onDetail={openDetail} onWhatsApp={openWhatsApp}/>) }
          </section>
        </section>
      )}

      {tab === "Wedding" && selectedWedding && (
        <WeddingDetail
          wedding={selectedWedding}
          vendors={vendors}
          readOnly={!canEditData}
          onBack={() => setSelectedWeddingId(null)}
          onEdit={() => openEditWedding(selectedWedding)}
          onDelete={() => deleteWedding(selectedWedding.id)}
          onPay={() => openPayment(selectedWedding)}
          onEditPayment={(payment) => openPayment(selectedWedding, payment)}
          onToggleComplete={() => toggleWeddingComplete(selectedWedding)}
          onAddItem={() => openNewPackageItem(selectedWedding)}
          onEditItem={(item) => openEditPackageItem(selectedWedding, item)}
          onDeleteItem={(itemId) => deletePackageItem(selectedWedding.id, itemId)}
          onAddVendorPayment={(item) => openVendorPayment(selectedWedding, item)}
          onEditVendorPayment={(item, payment) => openVendorPayment(selectedWedding, item, payment)}
          onDeleteVendorPayment={(itemId, paymentId) => deleteVendorPayment(selectedWedding.id, itemId, paymentId)}
          onDeletePayment={(paymentId) => deletePayment(selectedWedding.id, paymentId)}
          onUpdatePaymentStage={(stageKey, patch) => updatePaymentScheduleItem(selectedWedding.id, stageKey, patch)}
          onTogglePaymentStage={(stage) => togglePaymentScheduleItem(selectedWedding, stage)}
          onResetPaymentSchedule={() => resetPaymentSchedule(selectedWedding)}
          onWhatsApp={() => openWhatsApp(selectedWedding.whatsapp)}
          canViewFinance={canViewFinance}
        />
      )}

      {tab === "Keuangan" && canViewFinance && (
        <>
          <section className="panel financeIntro"><small>KEUANGAN</small><h2>Ringkasan Bisnis</h2><p>Semua angka dihitung otomatis dari wedding, pembayaran klien, dan isi paket/vendor.</p></section>
          <section className="stats statsSix">
            <Card t="Harga Deal" v={rp(totals.deal)} s="Total kontrak"/>
            <Card t="Uang Masuk" v={rp(totals.incoming)} s="Sudah diterima"/>
            <Card t="Sisa Tagihan" v={rp(totals.remaining)} s="Piutang klien"/>
            <Card t="Total Pengeluaran" v={rp(totals.expenses)} s={`Sudah dibayar ${rp(totals.expensesPaid)}`}/>
            <Card t="Estimasi Untung" v={rp(totals.profit)} s="Harga Deal - Pengeluaran" highlight/>
            <Card t="Uang Pegangan" v={rp(totals.cashOnHand)} s="Uang Masuk - biaya dibayar"/>
          </section>
          <div className="sectionHead"><div><small>PER WEDDING</small><h3>Posisi Keuangan</h3></div></div>
          <section className="financeList">
            {weddings.length === 0 ? <Empty text="Belum ada data keuangan."/> : weddings.map((w)=><FinanceRow key={w.id} wedding={w} onDetail={openDetail}/>) }
          </section>
        </>
      )}

      {tab === "Kalender" && (
        <section className="panel calendarPanel">
          <div className="panelHeader"><div><small>AGENDA WEDDING</small><h2>Kalender</h2><p>Jadwal otomatis mengikuti tanggal wedding.</p></div>{canEditData&&<button className="primary compact" onClick={openNewWedding}><Plus size={17}/> Wedding</button>}</div>
          <div className="calendarAgenda">
            <div className="calendarAgendaHead"><div><small>AGENDA TERDEKAT</small><h3>Wedding Berikutnya</h3></div><span>{upcoming.length} mendatang</span></div>
            {upcoming.length===0 ? <div className="miniEmpty">Belum ada agenda wedding terdekat.</div> : <div className="agendaCards">{upcoming.slice(0,4).map((w)=><button key={w.id} className="agendaCard" onClick={()=>openDetail(w)}><div className="agendaDate"><b>{new Date(`${w.date}T00:00:00`).getDate()}</b><span>{monthNames[new Date(`${w.date}T00:00:00`).getMonth()].slice(0,3)}</span></div><div><b>{w.couple}</b><span>{w.packageName || "Belum ada paket"} · {w.place}</span></div><strong>{rp(w.dealPrice)}</strong></button>)}</div>}
          </div>
          <div className="calendarControls">
            <button className="monthButton" onClick={prevMonth}><ChevronLeft size={20}/></button>
            <select value={month} onChange={(e)=>setMonth(Number(e.target.value))}>{monthNames.map((name,i)=><option value={i} key={name}>{name}</option>)}</select>
            <select value={year} onChange={(e)=>setYear(Number(e.target.value))}>{yearOptions.map((y)=><option value={y} key={y}>{y}</option>)}</select>
            <button className="monthButton" onClick={nextMonth}><ChevronRight size={20}/></button>
          </div>
          <div className="dayNames">{dayNames.map((name)=><div key={name}>{name}</div>)}</div>
          <div className="calendarGrid">
            {calendarDays.map((day,index)=>{
              const events = day ? eventsByDay[day] || [] : [];
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return <div key={`${day||"blank"}-${index}`} className={`calendarCell ${!day?"blank":""} ${isToday?"today":""}`}>
                {day && <><b className="dayNumber">{day}</b><div className="calendarEvents">{events.slice(0,2).map((event)=><button key={event.id} className="calendarEvent" onClick={()=>openDetail(event)}>{event.couple}</button>)}{events.length>2&&<span className="moreEvent">+{events.length-2} lagi</span>}</div></>}
              </div>;
            })}
          </div>
          <div className="sectionHead inside"><div><small>JADWAL BULAN INI</small><h3>{monthNames[month]} {year}</h3></div></div>
          <section className="list">{Object.values(eventsByDay).flat().length===0?<Empty text="Tidak ada wedding di bulan ini."/>:Object.values(eventsByDay).flat().sort((a,b)=>a.date.localeCompare(b.date)).map((w)=><WeddingRow key={w.id} wedding={w} onDetail={openDetail} onWhatsApp={openWhatsApp}/>)}</section>
        </section>
      )}

      {tab === "Vendor" && (
        <div className="vendorPage">
          <section className="panel">
            <div className="panelHeader"><div><small>MASTER HARGA</small><h2>Paket</h2><p>Pilih paket saat membuat wedding. Harga otomatis terisi, tetapi tetap bisa diedit khusus untuk setiap klien.</p></div>{canEditData&&<button className="primary compact" onClick={openNewPackageMaster}><Plus size={17}/> Paket</button>}</div>
            <div className="packageMasterGrid">{packages.length===0?<Empty text="Belum ada Master Harga. Tambahkan paket dan harga default."/>:packages.map((pkg)=><div className="packageMasterCard" key={pkg.id}><div><small>PAKET</small><h3>{pkg.name}</h3>{pkg.notes&&<p>{pkg.notes}</p>}</div><strong>{rp(pkg.price)}</strong>{canEditData&&<div className="vendorActions"><button onClick={()=>openEditPackageMaster(pkg)}><Pencil size={16}/></button><button className="danger" onClick={()=>deletePackageMaster(pkg.id)}><Trash2 size={16}/></button></div>}</div>)}</div>
          </section>
          <section className="panel">
            <div className="panelHeader"><div><small>DATABASE VENDOR</small><h2>Vendor</h2><p>Harga di sini hanya referensi. Saat dipakai di wedding, biaya aktual tetap bisa diubah.</p></div>{canEditData&&<button className="primary compact" onClick={openNewVendor}><Plus size={17}/> Vendor</button>}</div>
            <div className="vendorGrid">{vendors.length===0?<Empty text="Belum ada vendor. Tambahkan vendor langganan Aynis."/>:vendors.map((v)=><VendorCard key={v.id} vendor={v} readOnly={!canEditData} onWhatsApp={openWhatsApp} onEdit={openEditVendor} onDelete={deleteVendor}/>)}</div>
          </section>
        </div>
      )}

      <nav>
{[["Home",Home],["Wedding",HeartHandshake],...(canViewFinance?[["Keuangan",WalletCards]]:[]),["Kalender",CalendarDays],["Vendor",Store]].map(([name,Icon])=><button key={name} className={tab===name?"active":""} onClick={()=>{setTab(name);if(name!=="Wedding")setSelectedWeddingId(null);}}><Icon size={20}/><span>{name}</span></button>)}
      </nav>

      {accountOpen && (
        <Modal onClose={()=>setAccountOpen(false)}>
          <div className="teamPanel">
            <ModalClose onClick={()=>setAccountOpen(false)}/>
            <small>AKUN & AKSES</small><h3>Tim Aynis</h3>
            <div className="currentRole"><ShieldCheck size={18}/><div><b>{membership?.role === "owner" ? "Owner" : membership?.role === "admin" ? "Admin" : "Staff"}</b><span>{session?.user?.email}</span></div></div>
            {isOwner ? <>
              <form className="inviteForm" onSubmit={inviteMember}>
                <Field label="Email pengguna"><input type="email" value={inviteEmail} onChange={(e)=>setInviteEmail(e.target.value)} placeholder="admin@contoh.com" required/></Field>
                <Field label="Role"><select value={inviteRole} onChange={(e)=>setInviteRole(e.target.value)}><option value="admin">Admin · kelola operasional</option><option value="staff">Staff · hanya lihat</option></select></Field>
                <button className="primary full" type="submit" disabled={inviteBusy}><UserPlus size={17}/> {inviteBusy?"Menyimpan…":"Tambah Pengguna"}</button>
              </form>
              {cloudMessage&&<div className="cloudNotice">{cloudMessage}</div>}
              <div className="memberList">{members.map((m)=><div className="memberRow" key={m.id}><div className="memberIcon"><Users size={17}/></div><div><b>{m.invited_email || (m.user_id===session?.user?.id?session?.user?.email:"Pengguna aktif")}</b><span>{m.role.toUpperCase()} · {m.status === "active" ? "Aktif" : "Menunggu aktivasi"}</span></div>{m.role!=="owner"&&<button className="iconDanger" onClick={()=>removeMember(m.id)}><Trash2 size={14}/></button>}</div>)}</div>
              <div className="roleHelp"><b>Batas akses</b><span>Owner: semua fitur + kelola pengguna</span><span>Admin: kelola operasional, tanpa ringkasan keuangan/profit & tanpa manajemen pengguna</span><span>Staff: hanya melihat data</span></div>
            </> : <div className="roleHelp"><b>Batas akses Anda</b><span>{membership?.role === "admin" ? "Admin dapat mengelola data operasional. Ringkasan keuangan bisnis/profit dan manajemen pengguna disembunyikan." : "Staff hanya dapat melihat data dan agenda tanpa mengubahnya."}</span></div>}
          </div>
        </Modal>
      )}

      {weddingOpen && (
        <Modal onClose={()=>setWeddingOpen(false)}>
          <form className="weddingMasterForm" onSubmit={saveWedding}>
            <ModalClose onClick={()=>setWeddingOpen(false)}/>
            <div className="formIntro">
              <small>{weddingForm.id?"EDIT WEDDING":"WEDDING BARU"}</small>
              <h3>{weddingForm.id?"Edit Data Wedding":"Tambah Wedding"}</h3>
              <p>Isi berurutan: data pengantin, paket, lalu isi paket/vendor.</p>
            </div>

            <section className="formSection">
              <div className="formSectionTitle"><span>1</span><div><small>DATA PENGANTIN</small><b>Info Lengkap Pengantin</b></div></div>
              <Field label="Nama Pengantin"><input value={weddingForm.couple} onChange={(e)=>setWeddingForm({...weddingForm,couple:e.target.value})} placeholder="Contoh: Rina & Andi"/></Field>
              <div className="formTwoCols">
                <Field label="Nomor WhatsApp"><input inputMode="tel" value={weddingForm.whatsapp} onChange={(e)=>setWeddingForm({...weddingForm,whatsapp:e.target.value})} placeholder="081234567890"/></Field>
                <Field label="Tanggal Wedding"><input type="date" value={weddingForm.date} onChange={(e)=>setWeddingForm({...weddingForm,date:e.target.value})}/><em>Otomatis masuk Kalender.</em></Field>
              </div>
              <Field label="Lokasi"><input value={weddingForm.place} onChange={(e)=>setWeddingForm({...weddingForm,place:e.target.value})} placeholder="Gedung / alamat acara"/></Field>
              <Field label="Catatan Pengantin / Acara"><textarea rows={3} value={weddingForm.notes} onChange={(e)=>setWeddingForm({...weddingForm,notes:e.target.value})} placeholder="Jam akad, request klien, catatan khusus, dll."/></Field>
            </section>

            <section className="formSection">
              <div className="formSectionTitle"><span>2</span><div><small>PAKET</small><b>Paket & Harga Deal</b></div></div>
              <Field label="Pilih Paket dari Master Harga"><select value={packages.find((p)=>p.name===weddingForm.packageName)?String(packages.find((p)=>p.name===weddingForm.packageName).id):"__manual__"} onChange={(e)=>chooseMasterPackage(e.target.value)}><option value="__manual__">— Paket manual / khusus —</option>{packages.filter((p)=>p.active!==false).map((pkg)=><option key={pkg.id} value={pkg.id}>{pkg.name} · {rp(pkg.price)}</option>)}</select><em>Pilih paket untuk mengisi nama dan harga otomatis.</em></Field>
              <Field label="Nama Paket"><input id="manual-package-name" value={weddingForm.packageName} onChange={(e)=>setWeddingForm({...weddingForm,packageName:e.target.value})} placeholder="Contoh: Platinum"/><em>Nama tetap bisa diubah untuk paket khusus.</em></Field>
              <div className="formTwoCols">
                <Field label="Harga Deal Klien"><input type="text" inputMode="numeric" value={formatMoneyInput(weddingForm.dealPrice)} onChange={(e)=>setWeddingForm({...weddingForm,dealPrice:onlyDigits(e.target.value)})} placeholder="15.000.000"/>{weddingForm.dealPrice&&<em>{rp(weddingForm.dealPrice)}</em>}</Field>
                {!weddingForm.id ? <Field label="DP / Pembayaran Awal"><input type="text" inputMode="numeric" value={formatMoneyInput(weddingForm.initialPayment)} onChange={(e)=>setWeddingForm({...weddingForm,initialPayment:onlyDigits(e.target.value)})} placeholder="1.000.000"/>{weddingForm.initialPayment&&<em>{rp(weddingForm.initialPayment)}</em>}</Field> : <div className="editPaymentHint"><small>PEMBAYARAN</small><b>{rp(totalPayments(weddings.find((w)=>w.id===weddingForm.id)||{}))}</b><span>Riwayat pembayaran tetap dikelola dari Detail Wedding.</span></div>}
              </div>
            </section>

            <section className="formSection">
              <div className="formSectionTitle withAction"><span>3</span><div><small>ISI PAKET</small><b>Vendor & Pengeluaran</b></div><button type="button" className="addInline" onClick={addWeddingDraftItem}><Plus size={15}/> Tambah</button></div>
              <p className="sectionHelp">Pilih vendor dari database atau isi manual. Harga referensi vendor boleh diubah khusus untuk wedding ini.</p>
              {(weddingForm.packageItems||[]).length===0 ? <div className="miniEmpty">Belum ada isi paket. Tekan <b>Tambah</b> untuk memasukkan vendor atau biaya.</div> : <div className="draftItems">
                {(weddingForm.packageItems||[]).map((item,index)=><div className="draftItem" key={item.id || index}>
                  <div className="draftItemHead"><b>Item {index+1}</b><button type="button" className="removeDraft" onClick={()=>removeWeddingDraftItem(index)}><Trash2 size={14}/> Hapus</button></div>
                  <Field label="Vendor (opsional)"><select value={item.vendorId||""} onChange={(e)=>chooseWeddingDraftVendor(index,e.target.value)}><option value="">— Input manual —</option>{vendors.map((v)=><option key={v.id} value={v.id}>{v.name} · {v.category}</option>)}</select></Field>
                  <div className="formTwoCols">
                    <Field label="Nama Item / Vendor"><input id={`draft-name-${item.id}`} value={item.name||""} onChange={(e)=>updateWeddingDraftItem(index,{name:e.target.value})} placeholder="Dekorasi / Foto Video"/></Field>
                    <Field label="Kategori"><input value={item.category||""} onChange={(e)=>updateWeddingDraftItem(index,{category:e.target.value})} placeholder="Dekorasi / Foto / Crew"/></Field>
                  </div>
                  <div className="formTwoCols">
                    <Field label="Biaya Aktual"><input type="text" inputMode="numeric" value={formatMoneyInput(item.actualCost)} onChange={(e)=>updateWeddingDraftItem(index,{actualCost:onlyDigits(e.target.value)})} placeholder="5.000.000"/>{item.actualCost&&<em>{rp(item.actualCost)}</em>}</Field>
                    {Array.isArray(item.vendorPayments)&&item.vendorPayments.length>0 ? <div className="editPaymentHint"><small>SUDAH DIBAYAR VENDOR</small><b>{rp(vendorPaid(item))}</b><span>Kelola riwayat pembayaran dari Detail Wedding.</span></div> : <Field label="Pembayaran Awal Vendor"><input type="text" inputMode="numeric" value={formatMoneyInput(item.paidAmount)} onChange={(e)=>updateWeddingDraftItem(index,{paidAmount:onlyDigits(e.target.value)})} placeholder="0"/>{item.paidAmount&&<em>{rp(item.paidAmount)}</em>}</Field>}
                  </div>
                  <Field label="Catatan Item"><input value={item.notes||""} onChange={(e)=>updateWeddingDraftItem(index,{notes:e.target.value})} placeholder="DP 50%, pelunasan H-3, dll."/></Field>
                </div>)}
              </div>}
            </section>

            <div className="stickySave">
              <div><small>RINGKASAN</small><b>{rp(weddingForm.dealPrice)} deal · {rp((weddingForm.packageItems||[]).reduce((s,i)=>s+Number(i.actualCost||0),0))} pengeluaran</b></div>
              <button className="primary" type="submit"><CheckCircle2 size={18}/> Simpan Wedding</button>
            </div>
          </form>
        </Modal>
      )}

      {paymentOpen && (
        <Modal onClose={()=>setPaymentOpen(false)}>
          <form className="smallForm" onSubmit={savePayment}>
            <ModalClose onClick={()=>setPaymentOpen(false)}/><small>PEMBAYARAN KLIEN</small><h3>{paymentEditId?"Edit Pembayaran":"Catat Pembayaran"}</h3>
            <Field label="Tahap / Nama Pembayaran"><input value={paymentLabel} onChange={(e)=>setPaymentLabel(e.target.value)} placeholder="DP / Cicilan 2 / Pelunasan"/></Field>
            <div className="formTwoCols">
              <Field label="Nominal Masuk"><input type="text" inputMode="numeric" value={formatMoneyInput(paymentAmount)} onChange={(e)=>setPaymentAmount(onlyDigits(e.target.value))} placeholder="2.000.000"/>{paymentAmount&&<em>{rp(paymentAmount)}</em>}</Field>
              <Field label="Tanggal"><input type="date" value={paymentDate} onChange={(e)=>setPaymentDate(e.target.value)}/></Field>
            </div>
            <Field label="Catatan"><textarea rows={2} value={paymentNote} onChange={(e)=>setPaymentNote(e.target.value)} placeholder="Transfer BCA / cash / keterangan lain"/></Field>
            <button className="primary full" type="submit"><Banknote size={18}/> {paymentEditId?"Simpan Perubahan":"Simpan Pembayaran"}</button>
          </form>
        </Modal>
      )}

      {vendorPaymentOpen && (
        <Modal onClose={()=>setVendorPaymentOpen(false)}>
          <form className="smallForm" onSubmit={saveVendorPayment}>
            <ModalClose onClick={()=>setVendorPaymentOpen(false)}/><small>PEMBAYARAN VENDOR</small><h3>{vendorPaymentEditId?"Edit Pembayaran Vendor":"Catat Pembayaran Vendor"}</h3>
            <Field label="Tahap / Nama Pembayaran"><input value={vendorPaymentLabel} onChange={(e)=>setVendorPaymentLabel(e.target.value)} placeholder="DP Vendor / Cicilan / Pelunasan"/></Field>
            <div className="formTwoCols">
              <Field label="Nominal Dibayar"><input type="text" inputMode="numeric" value={formatMoneyInput(vendorPaymentAmount)} onChange={(e)=>setVendorPaymentAmount(onlyDigits(e.target.value))} placeholder="2.000.000"/>{vendorPaymentAmount&&<em>{rp(vendorPaymentAmount)}</em>}</Field>
              <Field label="Tanggal"><input type="date" value={vendorPaymentDate} onChange={(e)=>setVendorPaymentDate(e.target.value)}/></Field>
            </div>
            <Field label="Catatan"><textarea rows={2} value={vendorPaymentNote} onChange={(e)=>setVendorPaymentNote(e.target.value)} placeholder="Transfer / cash / keterangan lain"/></Field>
            <button className="primary full" type="submit"><Banknote size={18}/> {vendorPaymentEditId?"Simpan Perubahan":"Simpan Pembayaran Vendor"}</button>
          </form>
        </Modal>
      )}

      {packageOpen && (
        <Modal onClose={()=>setPackageOpen(false)}>
          <form onSubmit={savePackageItem}>
            <ModalClose onClick={()=>setPackageOpen(false)}/><small>ISI PAKET / PENGELUARAN</small><h3>{packageForm.id?"Edit Item":"Tambah Item / Vendor"}</h3>
            <Field label="Pilih Vendor (opsional)"><select value={packageForm.vendorId} onChange={(e)=>chooseVendor(e.target.value)}><option value="">— Input manual / biaya lain —</option>{vendors.map((v)=><option key={v.id} value={v.id}>{v.name} · {v.category}</option>)}</select><em>Harga referensi hanya membantu mengisi awal dan tetap bisa diubah.</em></Field>
            <Field label="Nama Item / Vendor"><input value={packageForm.name} onChange={(e)=>setPackageForm({...packageForm,name:e.target.value})} placeholder="Dekorasi / Foto Video / Transport"/></Field>
            <Field label="Kategori"><input value={packageForm.category} onChange={(e)=>setPackageForm({...packageForm,category:e.target.value})} placeholder="Dekorasi / Foto / Crew / Lainnya"/></Field>
            <Field label="Biaya Aktual Wedding Ini"><input type="text" inputMode="numeric" value={formatMoneyInput(packageForm.actualCost)} onChange={(e)=>setPackageForm({...packageForm,actualCost:onlyDigits(e.target.value)})} placeholder="5.000.000"/></Field>
            {packageForm.id ? <div className="editPaymentHint"><small>SUDAH DIBAYAR VENDOR</small><b>{rp(vendorPaid(packageForm))}</b><span>Riwayat pembayaran dikelola dari Detail Wedding.</span></div> : <Field label="Pembayaran Awal Vendor"><input type="text" inputMode="numeric" value={formatMoneyInput(packageForm.paidAmount)} onChange={(e)=>setPackageForm({...packageForm,paidAmount:onlyDigits(e.target.value)})} placeholder="0"/><em>Setelah disimpan, pembayaran berikutnya dicatat sebagai riwayat.</em></Field>}
            <Field label="Catatan"><textarea rows={3} value={packageForm.notes} onChange={(e)=>setPackageForm({...packageForm,notes:e.target.value})} placeholder="DP 50%, pelunasan H-3, kebutuhan khusus, dll."/></Field>
            <button className="primary full" type="submit"><CheckCircle2 size={18}/> Simpan Item</button>
          </form>
        </Modal>
      )}

      {packageMasterOpen && (
        <Modal onClose={()=>setPackageMasterOpen(false)}>
          <form className="smallForm" onSubmit={savePackageMaster}>
            <ModalClose onClick={()=>setPackageMasterOpen(false)}/><small>MASTER HARGA</small><h3>{packageMasterForm.id?"Edit Paket":"Tambah Paket"}</h3>
            <Field label="Nama Paket"><input value={packageMasterForm.name} onChange={(e)=>setPackageMasterForm({...packageMasterForm,name:e.target.value})} placeholder="Paket Akad / Wedding / Premium"/></Field>
            <Field label="Harga Default"><input type="text" inputMode="numeric" value={formatMoneyInput(packageMasterForm.price)} onChange={(e)=>setPackageMasterForm({...packageMasterForm,price:onlyDigits(e.target.value)})} placeholder="8.000.000"/>{packageMasterForm.price&&<em>{rp(packageMasterForm.price)}</em>}</Field>
            <Field label="Keterangan"><textarea rows={3} value={packageMasterForm.notes} onChange={(e)=>setPackageMasterForm({...packageMasterForm,notes:e.target.value})} placeholder="Isi singkat paket / catatan harga"/></Field>
            <button className="primary full" type="submit"><CheckCircle2 size={18}/> Simpan Master Harga</button>
          </form>
        </Modal>
      )}

      {vendorOpen && (
        <Modal onClose={()=>setVendorOpen(false)}>
          <form onSubmit={saveVendor}>
            <ModalClose onClick={()=>setVendorOpen(false)}/><small>DATABASE VENDOR</small><h3>{vendorForm.id?"Edit Vendor":"Tambah Vendor"}</h3>
            <Field label="Nama Vendor"><input value={vendorForm.name} onChange={(e)=>setVendorForm({...vendorForm,name:e.target.value})} placeholder="Mawar Decoration"/></Field>
            <Field label="Kategori"><input value={vendorForm.category} onChange={(e)=>setVendorForm({...vendorForm,category:e.target.value})} placeholder="Dekorasi / Foto / Catering"/></Field>
            <Field label="Nomor WhatsApp"><input inputMode="tel" value={vendorForm.whatsapp} onChange={(e)=>setVendorForm({...vendorForm,whatsapp:e.target.value})} placeholder="081234567890"/></Field>
            <Field label="Alamat"><input value={vendorForm.address} onChange={(e)=>setVendorForm({...vendorForm,address:e.target.value})} placeholder="Jepara / alamat vendor"/></Field>
            <Field label="Harga Referensi"><input type="text" inputMode="numeric" value={formatMoneyInput(vendorForm.referencePrice)} onChange={(e)=>setVendorForm({...vendorForm,referencePrice:onlyDigits(e.target.value)})} placeholder="5.000.000"/><em>Harga ini bukan harga tetap. Bisa diubah saat vendor dipakai di wedding.</em></Field>
            <Field label="Catatan"><textarea rows={3} value={vendorForm.notes} onChange={(e)=>setVendorForm({...vendorForm,notes:e.target.value})} placeholder="PIC, ketentuan DP, layanan, dll."/></Field>
            <button className="primary full" type="submit"><CheckCircle2 size={18}/> Simpan Vendor</button>
          </form>
        </Modal>
      )}
    </main>
  );
}

function Card({ t, v, s, highlight=false }) {
  return <div className={`card ${highlight?"highlight":""}`}><small>{t}</small><strong>{v}</strong><span>{s}</span></div>;
}

function Empty({ text }) { return <div className="emptyState">{text}</div>; }
function Field({ label, children }) { return <label>{label}{children}</label>; }
function Modal({ children, onClose }) { return <div className="modal" onMouseDown={(e)=>e.target===e.currentTarget&&onClose()}>{children}</div>; }
function ModalClose({ onClick }) { return <button type="button" className="close" onClick={onClick}><X/></button>; }

function WeddingRow({ wedding, onDetail, onWhatsApp }) {
  const f = financials(wedding);
  const pct = f.deal ? Math.min(100, (f.incoming / f.deal) * 100) : 0;
  return <article>
    <div className="datebox"><HeartHandshake size={22}/></div>
    <div className="grow">
      <div className="titleLine"><h4>{wedding.couple}</h4><span className={`statusBadge ${f.remaining===0?"paid":""}`}>{paymentStatus(wedding)}</span></div>
      <p>{formatDate(wedding.date)} · {wedding.place} · {wedding.packageName || "Belum ada paket"}</p>
      <div className="bar"><i style={{width:`${pct}%`}}/></div>
      <div className="rowActions">
        <button onClick={()=>onDetail(wedding)}><ReceiptText size={14}/> Detail</button>
        {wedding.whatsapp&&<button onClick={()=>onWhatsApp(wedding.whatsapp)}><MessageCircle size={14}/> WhatsApp</button>}
      </div>
    </div>
    <div className="money"><b>{rp(f.deal)}</b><span>{f.remaining===0?"Lunas":`Sisa ${rp(f.remaining)}`}</span></div>
  </article>;
}

function FinanceRow({ wedding, onDetail }) {
  const f = financials(wedding);
  return <button className="financeRow" onClick={()=>onDetail(wedding)}>
    <div><b>{wedding.couple}</b><span>{wedding.packageName || "-"}</span></div>
    <div><small>Deal</small><b>{rp(f.deal)}</b></div>
    <div><small>Pengeluaran</small><b>{rp(f.expenses)}</b></div>
    <div><small>Untung</small><b className={f.profit<0?"negative":"positive"}>{rp(f.profit)}</b></div>
  </button>;
}

function VendorCard({ vendor, readOnly=false, onWhatsApp, onEdit, onDelete }) {
  return <article className="vendorCard">
    <div className="vendorIcon"><Store size={22}/></div>
    <div className="vendorGrow"><small>{vendor.category}</small><h3>{vendor.name}</h3><p>{vendor.whatsapp || "Tanpa WhatsApp"}</p>{vendor.address&&<span>{vendor.address}</span>}<b className="referencePrice">Referensi {rp(vendor.referencePrice)}</b>{vendor.notes&&<em>{vendor.notes}</em>}</div>
    <div className="vendorActions">{vendor.whatsapp&&<button onClick={()=>onWhatsApp(vendor.whatsapp)}><MessageCircle size={16}/></button>}{!readOnly&&<><button onClick={()=>onEdit(vendor)}><Pencil size={16}/></button><button className="danger" onClick={()=>onDelete(vendor.id)}><Trash2 size={16}/></button></>}</div>
  </article>;
}

function WeddingDetail({ wedding, readOnly=false, canViewFinance=false, onBack, onEdit, onDelete, onPay, onEditPayment, onToggleComplete, onAddItem, onEditItem, onDeleteItem, onAddVendorPayment, onEditVendorPayment, onDeleteVendorPayment, onDeletePayment, onUpdatePaymentStage, onTogglePaymentStage, onResetPaymentSchedule, onWhatsApp }) {
  const f = financials(wedding);
  const schedule = defaultPaymentSchedule(wedding, wedding.paymentSchedule);
  const scheduledPaid = schedule.reduce((sum, stage) => sum + (stage.paid ? Number(stage.amount || 0) : 0), 0);
  return <section className="detailPage">
    <div className="detailTopActions"><button className="backButton" onClick={onBack}><ArrowLeft size={17}/> Semua Wedding</button>{!readOnly&&<div><button onClick={onEdit}><Pencil size={15}/> Edit</button>{(f.remaining===0||wedding.completed)&&<button className={wedding.completed?"":"completeButton"} onClick={onToggleComplete}><CheckCircle2 size={15}/> {wedding.completed?"Buka Lagi":"Tandai Selesai"}</button>}<button className="danger" onClick={onDelete}><Trash2 size={15}/> Hapus</button></div>}</div>

    <section className="detailHero panel">
      <div><small>1 · DATA PENGANTIN</small><h2>{wedding.couple}</h2><div className="infoLines"><span><Calendar size={15}/>{formatDate(wedding.date)}</span><span><MapPin size={15}/>{wedding.place}</span>{wedding.whatsapp&&<button onClick={onWhatsApp}><Phone size={15}/>{wedding.whatsapp}</button>}</div>{wedding.notes&&<p>{wedding.notes}</p>}</div>
      <span className={`bigStatus ${paymentStatus(wedding)==="Lunas"||paymentStatus(wedding)==="Selesai"?"paid":""}`}>{paymentStatus(wedding)}</span>
    </section>

    <section className="packagePanel panel">
      <div className="sectionTitle"><div><small>2 · PAKET</small><h3>{wedding.packageName}</h3></div><Package size={24}/></div>
      {canViewFinance ? <div className="summaryFour"><MiniStat label="Harga Deal" value={rp(f.deal)}/><MiniStat label="Uang Masuk" value={rp(f.incoming)}/><MiniStat label="Sisa Tagihan" value={rp(f.remaining)}/><MiniStat label="Status" value={paymentStatus(wedding)}/></div> : <div className="summaryFour"><MiniStat label="Status" value={paymentStatus(wedding)}/></div>}
    </section>

    <section className="panel">
      <div className="panelHeader compactHeader"><div><small>3 · ISI PAKET / VENDOR</small><h2>{canViewFinance ? "Vendor & Biaya" : "Vendor"}</h2><p>{canViewFinance ? "Biaya aktual khusus wedding ini. Pembayaran vendor tersimpan sebagai riwayat." : "Daftar vendor untuk kebutuhan operasional wedding. Nominal pengeluaran hanya dapat dilihat Owner."}</p></div>{!readOnly&&canViewFinance&&<button className="primary compact" onClick={onAddItem}><Plus size={16}/> Tambah Item</button>}</div>
      {(wedding.packageItems||[]).length===0?<Empty text="Belum ada isi paket atau vendor."/>:<div className="expenseList">{(wedding.packageItems||[]).map((item)=>{
        const history = vendorPaymentHistory(item, wedding.date || "");
        const remainingVendor = Math.max(Number(item.actualCost||0)-vendorPaid(item),0);
        return <div className="expenseCard" key={item.id}>
          <div className="expenseRow"><div className="expenseMain"><small>{item.category}</small><b>{item.name}</b>{item.notes&&<span>{item.notes}</span>}</div>{canViewFinance&&<div className="expenseMoney"><b>{rp(item.actualCost)}</b><span>Dibayar {rp(vendorPaid(item))}</span><i className={`vendorStatus ${itemStatus(item)==="Lunas"?"paid":""}`}>{itemStatus(item)}</i></div>}{!readOnly&&canViewFinance&&<div className="iconActions"><button onClick={()=>onEditItem(item)}><Pencil size={15}/></button><button className="danger" onClick={()=>onDeleteItem(item.id)}><Trash2 size={15}/></button></div>}</div>
          {canViewFinance&&<div className="vendorPaymentBar"><div><small>SISA VENDOR</small><b>{rp(remainingVendor)}</b></div>{!readOnly&&remainingVendor>0&&<button onClick={()=>onAddVendorPayment(item)}><Plus size={14}/> Bayar Vendor</button>}</div>}
          {canViewFinance&&history.length>0&&<div className="vendorPaymentHistory">{history.map((payment)=><div className="vendorPaymentRow" key={payment.id}><div><b>{payment.label||"Pembayaran Vendor"}</b><span>{payment.date?formatDate(payment.date):""}{payment.notes?` · ${payment.notes}`:""}</span></div><strong>{rp(payment.amount)}</strong>{!readOnly&&<div className="miniActions"><button onClick={()=>onEditVendorPayment(item,payment)}><Pencil size={13}/></button><button className="iconDanger" onClick={()=>onDeleteVendorPayment(item.id,payment.id)}><Trash2 size={13}/></button></div>}</div>)}</div>}
        </div>;
      })}</div>}
      {canViewFinance&&<div className="expenseTotals"><MiniStat label="Total Pengeluaran" value={rp(f.expenses)}/><MiniStat label="Sudah Dibayar Vendor" value={rp(f.expensesPaid)}/><MiniStat label="Sisa Utang Vendor" value={rp(f.vendorDebt)}/></div>}
    </section>

    <section className="panel">
      <div className="panelHeader compactHeader"><div><small>4 · PEMBAYARAN KLIEN</small><h2>Jadwal & Riwayat Pembayaran</h2><p>Nominal mengikuti Harga Deal. DP manual dan setiap cicilan/catatan pembayaran masuk otomatis mengurangi sisa DP berikutnya sampai pelunasan.</p></div>{!readOnly&&<button className="softButton compact" onClick={onResetPaymentSchedule}>Hitung Ulang</button>}</div>
      <div className="paymentScheduleList">
        {schedule.map((stage)=><div className={`paymentStage ${stage.paid?"stagePaid":""}`} key={stage.key}>
          <button className={`payCheck ${stage.paid?"checked":""}`} disabled={readOnly} onClick={()=>!readOnly&&onTogglePaymentStage(stage)} aria-label={stage.paid?"Sudah dibayar":"Belum dibayar"}>{stage.paid?<CheckCircle2 size={22}/>:<span/>}</button>
          <div className="paymentStageMain"><b>{stage.label}</b><span>{stage.dueDate?`Jatuh tempo ${formatDate(stage.dueDate)}`:(stage.key==="dp1"?"Saat booking tanggal":"Tanggal dapat disesuaikan")}</span><em>{stage.paid?`Sudah dibayar${stage.paidDate?` · ${formatDate(stage.paidDate)}`:""}`:"Belum dibayar"}</em></div>
          <div className="paymentStageAmount"><small>Nominal</small>{readOnly?<strong>{rp(stage.amount)}</strong>:<input type="text" inputMode="numeric" value={formatMoneyInput(stage.amount)} onChange={(e)=>onUpdatePaymentStage(stage.key,{amount:parseMoney(e.target.value)})} placeholder="0"/>}</div>
        </div>)}
      </div>
      <div className="paymentScheduleSummary"><div><small>Terbayar dari Jadwal</small><b>{rp(scheduledPaid)}</b></div><div><small>Total Uang Masuk</small><b>{rp(f.incoming)}</b></div><div><small>Sisa Tagihan</small><b>{rp(f.remaining)}</b></div></div>
      {(wedding.payments||[]).length>0&&<div className="legacyPayments"><div className="legacyTitle"><b>Catatan Pembayaran Lain / Sebelumnya</b>{!readOnly&&f.remaining>0&&<button className="softButton compact" onClick={onPay}><Plus size={15}/> Tambah Catatan</button>}</div><div className="paymentList">{(wedding.payments||[]).map((p)=><div className="paymentRow" key={p.id}><div><b>{p.label||p.note||"Pembayaran Klien"}</b><span>{p.date?formatDate(p.date):""}{p.notes?` · ${p.notes}`:""}</span></div><strong>{rp(p.amount)}</strong>{!readOnly&&<div className="miniActions"><button onClick={()=>onEditPayment(p)}><Pencil size={14}/></button><button className="iconDanger" onClick={()=>onDeletePayment(p.id)}><Trash2 size={14}/></button></div>}</div>)}</div></div>}
    </section>

    {canViewFinance && <section className="panel profitPanel">
      <div className="sectionTitle"><div><small>5–6 · PENGELUARAN & RINGKASAN KEUNTUNGAN</small><h3>Posisi Keuangan Wedding</h3></div><TrendingUp size={24}/></div>
      <div className="financialSummaryGrid">
        <MiniStat label="Harga Deal" value={rp(f.deal)}/><MiniStat label="Uang Masuk" value={rp(f.incoming)}/><MiniStat label="Sisa Tagihan" value={rp(f.remaining)}/><MiniStat label="Total Pengeluaran" value={rp(f.expenses)}/><MiniStat label="Sudah Dibayar Vendor" value={rp(f.expensesPaid)}/><MiniStat label="Sisa Utang Vendor" value={rp(f.vendorDebt)}/><MiniStat label="Estimasi Untung" value={rp(f.profit)} strong/><MiniStat label="Uang Pegangan Sekarang" value={rp(f.cashOnHand)} strong/>
      </div>
      <p className="formula">Estimasi Untung = Harga Deal − Total Pengeluaran · Uang Pegangan = Uang Masuk − Pengeluaran yang sudah dibayar.</p>
    </section>}
  </section>;
}

function MiniStat({ label, value, strong=false }) { return <div className={`miniStat ${strong?"strong":""}`}><small>{label}</small><b>{value}</b></div>; }
