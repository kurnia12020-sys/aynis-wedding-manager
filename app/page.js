"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

const WEDDING_KEY = "aynis-weddings-v3";
const VENDOR_KEY = "aynis-vendors-v1";

const emptyWedding = {
  id: null,
  couple: "",
  date: "",
  place: "",
  value: "",
  paid: "",
  whatsapp: "",
  notes: "",
};

const emptyVendor = {
  id: null,
  name: "",
  category: "",
  whatsapp: "",
  notes: "",
};

const rp = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function Page() {
  const today = new Date();
  const [tab, setTab] = useState("Home");
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [ready, setReady] = useState(false);

  const [weddingOpen, setWeddingOpen] = useState(false);
  const [weddingForm, setWeddingForm] = useState(emptyWedding);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendor);

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  useEffect(() => {
    try {
      const newest = localStorage.getItem(WEDDING_KEY);
      const older2 = localStorage.getItem("aynis-wedding-manager-weddings-v2");
      const older1 = localStorage.getItem("aynis-wedding-manager-weddings-v1");
      const raw = newest || older2 || older1;

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(
            parsed.map((x) => {
              const value = Number(x.value ?? x.booking ?? 0);
              const paid = Number(x.paid ?? 0);
              return {
                id: x.id || Date.now() + Math.random(),
                couple: x.couple ?? x.client ?? "",
                date: x.date ?? "",
                place: x.place ?? x.location ?? "",
                value,
                paid,
                whatsapp: x.whatsapp ?? x.phone ?? "",
                notes: x.notes ?? "",
              };
            })
          );
        }
      }

      const vendorRaw = localStorage.getItem(VENDOR_KEY);
      if (vendorRaw) {
        const parsedVendors = JSON.parse(vendorRaw);
        if (Array.isArray(parsedVendors)) setVendors(parsedVendors);
      }
    } catch (error) {
      console.error("Gagal membaca data lokal", error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(WEDDING_KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(VENDOR_KEY, JSON.stringify(vendors));
  }, [vendors, ready]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [items]
  );

  const paid = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.paid || 0), 0),
    [items]
  );

  const remainingTotal = Math.max(total - paid, 0);

  const upcoming = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return [...items]
      .filter((item) => item.date && new Date(`${item.date}T00:00:00`) >= current)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items]);

  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    let offset = first.getDay();
    offset = offset === 0 ? 6 : offset - 1;

    const cells = Array(offset).fill(null);
    for (let d = 1; d <= totalDays; d += 1) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month, year]);

  const eventsByDay = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      if (!item.date) return;
      const [y, m, d] = item.date.split("-").map(Number);
      if (y === year && m - 1 === month) {
        if (!map[d]) map[d] = [];
        map[d].push(item);
      }
    });
    return map;
  }, [items, month, year]);

  const currentPaymentWedding = items.find(
    (item) => String(item.id) === String(paymentId)
  );

  const weddingRemaining = Math.max(
    Number(weddingForm.value || 0) - Number(weddingForm.paid || 0),
    0
  );

  function openNewWedding() {
    setWeddingForm(emptyWedding);
    setWeddingOpen(true);
  }

  function openEditWedding(item) {
    setWeddingForm({
      id: item.id,
      couple: item.couple,
      date: item.date,
      place: item.place,
      value: String(item.value ?? ""),
      paid: String(item.paid ?? ""),
      whatsapp: item.whatsapp ?? "",
      notes: item.notes ?? "",
    });
    setWeddingOpen(true);
  }

  function saveWedding(event) {
    event.preventDefault();
    const value = Number(weddingForm.value || 0);
    const paidValue = Number(weddingForm.paid || 0);

    if (!weddingForm.couple.trim()) return alert("Nama pengantin wajib diisi.");
    if (!weddingForm.date) return alert("Tanggal wedding wajib dipilih.");
    if (!weddingForm.place.trim()) return alert("Lokasi wajib diisi.");
    if (value <= 0) return alert("Nilai booking harus lebih dari Rp0.");
    if (paidValue < 0) return alert("Pembayaran tidak boleh negatif.");
    if (paidValue > value)
      return alert("Sudah dibayar tidak boleh melebihi nilai booking.");

    const record = {
      id: weddingForm.id || Date.now(),
      couple: weddingForm.couple.trim(),
      date: weddingForm.date,
      place: weddingForm.place.trim(),
      value,
      paid: paidValue,
      whatsapp: weddingForm.whatsapp.trim(),
      notes: weddingForm.notes.trim(),
    };

    setItems((current) => {
      const exists = current.some((item) => item.id === record.id);
      return exists
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current];
    });

    const selected = new Date(`${record.date}T00:00:00`);
    setMonth(selected.getMonth());
    setYear(selected.getFullYear());
    setWeddingOpen(false);
    setWeddingForm(emptyWedding);
  }

  function deleteWedding(id) {
    if (!confirm("Hapus data wedding ini?")) return;
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function openPayment(item) {
    setPaymentId(String(item.id));
    setPaymentAmount("");
    setPaymentOpen(true);
  }

  function savePayment(event) {
    event.preventDefault();
    const add = Number(paymentAmount || 0);
    if (!currentPaymentWedding) return;
    if (add <= 0) return alert("Nominal pembayaran harus lebih dari Rp0.");

    const remaining = Math.max(
      Number(currentPaymentWedding.value || 0) -
        Number(currentPaymentWedding.paid || 0),
      0
    );

    if (add > remaining) return alert("Pembayaran melebihi sisa tagihan.");

    setItems((current) =>
      current.map((item) =>
        item.id === currentPaymentWedding.id
          ? { ...item, paid: Number(item.paid || 0) + add }
          : item
      )
    );

    setPaymentOpen(false);
    setPaymentId("");
    setPaymentAmount("");
  }

  function openNewVendor() {
    setVendorForm(emptyVendor);
    setVendorOpen(true);
  }

  function openEditVendor(vendor) {
    setVendorForm({ ...vendor });
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
      notes: vendorForm.notes.trim(),
    };

    setVendors((current) => {
      const exists = current.some((item) => item.id === record.id);
      return exists
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current];
    });

    setVendorOpen(false);
    setVendorForm(emptyVendor);
  }

  function deleteVendor(id) {
    if (!confirm("Hapus vendor ini?")) return;
    setVendors((current) => current.filter((item) => item.id !== id));
  }

  function openWhatsApp(phone) {
    if (!phone) return;
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = `62${clean.slice(1)}`;
    window.open(`https://wa.me/${clean}`, "_blank");
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((value) => value - 1);
    } else {
      setMonth((value) => value - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((value) => value + 1);
    } else {
      setMonth((value) => value + 1);
    }
  }

  const yearOptions = Array.from(
    { length: 21 },
    (_, index) => today.getFullYear() - 5 + index
  );

  return (
    <main>
      <header>
        <div>
          <div className="eyebrow">AYNIS ANIS MAKEUP</div>
          <h1>
            Aynis <span>Wedding Manager</span>
          </h1>
        </div>
        <button className="avatar" aria-label="Aynis Anis Makeup">
          AA
        </button>
      </header>

      {tab === "Home" && (
        <>
          <section className="hero">
            <div>
              <span>Ringkasan Bisnis</span>
              <h2>
                Kelola wedding &amp; keuangan
                <br />
                lebih rapi dalam satu tempat.
              </h2>
              <p>
                Dashboard sederhana untuk booking, pembayaran, agenda, dan vendor.
              </p>
            </div>
            <button className="primary" onClick={openNewWedding}>
              <Plus size={18} /> Tambah Wedding
            </button>
          </section>

          <section className="stats">
            <Card t="Nilai Booking" v={rp(total)} s={`${items.length} wedding aktif`} />
            <Card t="Sudah Dibayar" v={rp(paid)} s="Pembayaran klien" />
            <Card t="Sisa Tagihan" v={rp(remainingTotal)} s="Perlu ditagih" />
          </section>

          <div className="sectionHead">
            <div>
              <small>AGENDA TERDEKAT</small>
              <h3>Wedding Mendatang</h3>
            </div>
            <button className="linkButton" onClick={() => setTab("Kalender")}>
              Lihat Kalender
            </button>
          </div>

          <section className="list">
            {!ready ? (
              <Empty text="Memuat data..." />
            ) : upcoming.length === 0 ? (
              <Empty text="Belum ada wedding. Tekan Tambah Wedding untuk membuat booking pertama." />
            ) : (
              upcoming.slice(0, 3).map((item) => (
                <WeddingRow
                  key={item.id}
                  item={item}
                  onEdit={openEditWedding}
                  onDelete={deleteWedding}
                  onPay={openPayment}
                  onWhatsApp={openWhatsApp}
                />
              ))
            )}
          </section>

          <section className="quick">
            <h3>Keuangan Cepat</h3>
            <div>
              <button onClick={() => setTab("Keuangan")}>
                <WalletCards /> Catat Pembayaran
              </button>
              <button onClick={() => setTab("Vendor")}>
                <Store /> Data Vendor
              </button>
              <button onClick={() => setTab("Kalender")}>
                <CalendarDays /> Lihat Kalender
              </button>
            </div>
          </section>
        </>
      )}

      {tab === "Wedding" && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <small>DATA KLIEN</small>
              <h2>Wedding</h2>
              <p>Semua booking dan status pembayaran.</p>
            </div>
            <button className="primary compact" onClick={openNewWedding}>
              <Plus size={17} /> Tambah
            </button>
          </div>

          <section className="list">
            {items.length === 0 ? (
              <Empty text="Belum ada data wedding." />
            ) : (
              [...items]
                .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
                .map((item) => (
                  <WeddingRow
                    key={item.id}
                    item={item}
                    onEdit={openEditWedding}
                    onDelete={deleteWedding}
                    onPay={openPayment}
                    onWhatsApp={openWhatsApp}
                  />
                ))
            )}
          </section>
        </section>
      )}

      {tab === "Keuangan" && (
        <>
          <section className="panel financeIntro">
            <small>KEUANGAN</small>
            <h2>Ringkasan Pembayaran</h2>
            <p>Nilai otomatis mengikuti data wedding yang tersimpan.</p>
          </section>

          <section className="stats financeStats">
            <Card t="Nilai Booking" v={rp(total)} s="Total seluruh booking" />
            <Card t="Sudah Dibayar" v={rp(paid)} s="Uang yang sudah masuk" />
            <Card t="Sisa Tagihan" v={rp(remainingTotal)} s="Belum dibayar klien" />
          </section>

          <div className="sectionHead">
            <div>
              <small>TAGIHAN</small>
              <h3>Belum Lunas</h3>
            </div>
            <b>{items.filter((x) => x.paid < x.value).length} klien</b>
          </div>

          <section className="list">
            {items.filter((x) => x.paid < x.value).length === 0 ? (
              <Empty text="Tidak ada tagihan aktif." />
            ) : (
              items
                .filter((x) => x.paid < x.value)
                .sort((a, b) => b.value - b.paid - (a.value - a.paid))
                .map((item) => (
                  <WeddingRow
                    key={item.id}
                    item={item}
                    onEdit={openEditWedding}
                    onDelete={deleteWedding}
                    onPay={openPayment}
                    onWhatsApp={openWhatsApp}
                  />
                ))
            )}
          </section>
        </>
      )}

      {tab === "Kalender" && (
        <section className="panel calendarPanel">
          <div className="panelHeader">
            <div>
              <small>AGENDA WEDDING</small>
              <h2>Kalender</h2>
              <p>Jadwal otomatis masuk dari tanggal wedding yang disimpan.</p>
            </div>
            <button className="primary compact" onClick={openNewWedding}>
              <Plus size={17} /> Wedding
            </button>
          </div>

          <div className="calendarControls">
            <button className="monthButton" onClick={prevMonth}>
              <ChevronLeft size={20} />
            </button>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {monthNames.map((name, index) => (
                <option value={index} key={name}>
                  {name}
                </option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
            <button className="monthButton" onClick={nextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="dayNames">
            {dayNames.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          <div className="calendarGrid">
            {calendarDays.map((day, index) => {
              const events = day ? eventsByDay[day] || [] : [];
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              return (
                <div
                  key={`${day || "blank"}-${index}`}
                  className={`calendarCell ${!day ? "blank" : ""} ${isToday ? "today" : ""}`}
                >
                  {day && (
                    <>
                      <b className="dayNumber">{day}</b>
                      <div className="calendarEvents">
                        {events.slice(0, 2).map((event) => (
                          <button
                            key={event.id}
                            className="calendarEvent"
                            onClick={() => {
                              setTab("Wedding");
                              openEditWedding(event);
                            }}
                          >
                            {event.couple}
                          </button>
                        ))}
                        {events.length > 2 && (
                          <span className="moreEvent">+{events.length - 2} lagi</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sectionHead inside">
            <div>
              <small>JADWAL BULAN INI</small>
              <h3>
                {monthNames[month]} {year}
              </h3>
            </div>
          </div>

          <section className="list">
            {Object.values(eventsByDay).flat().length === 0 ? (
              <Empty text="Tidak ada wedding di bulan ini." />
            ) : (
              Object.values(eventsByDay)
                .flat()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((item) => (
                  <WeddingRow
                    key={item.id}
                    item={item}
                    onEdit={openEditWedding}
                    onDelete={deleteWedding}
                    onPay={openPayment}
                    onWhatsApp={openWhatsApp}
                  />
                ))
            )}
          </section>
        </section>
      )}

      {tab === "Vendor" && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <small>PARTNER</small>
              <h2>Vendor</h2>
              <p>Simpan kontak vendor agar mudah dicari saat persiapan acara.</p>
            </div>
            <button className="primary compact" onClick={openNewVendor}>
              <Plus size={17} /> Vendor
            </button>
          </div>

          <div className="vendorGrid">
            {vendors.length === 0 ? (
              <Empty text="Belum ada vendor. Tambahkan vendor pertama Anda." />
            ) : (
              vendors.map((vendor) => (
                <article className="vendorCard" key={vendor.id}>
                  <div className="vendorIcon">
                    <Store size={22} />
                  </div>
                  <div className="vendorGrow">
                    <small>{vendor.category}</small>
                    <h3>{vendor.name}</h3>
                    {vendor.whatsapp && <p>{vendor.whatsapp}</p>}
                    {vendor.notes && <span>{vendor.notes}</span>}
                  </div>
                  <div className="vendorActions">
                    {vendor.whatsapp && (
                      <button onClick={() => openWhatsApp(vendor.whatsapp)}>
                        <MessageCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => openEditVendor(vendor)}>
                      <Pencil size={16} />
                    </button>
                    <button className="danger" onClick={() => deleteVendor(vendor.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      <nav>
        {[
          ["Home", Home],
          ["Wedding", HeartHandshake],
          ["Keuangan", WalletCards],
          ["Kalender", CalendarDays],
          ["Vendor", Store],
        ].map(([name, Icon]) => (
          <button
            key={name}
            className={tab === name ? "active" : ""}
            onClick={() => setTab(name)}
          >
            <Icon size={20} />
            <span>{name}</span>
          </button>
        ))}
      </nav>

      {weddingOpen && (
        <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && setWeddingOpen(false)}>
          <form onSubmit={saveWedding}>
            <button type="button" className="close" onClick={() => setWeddingOpen(false)}>
              <X />
            </button>
            <small>{weddingForm.id ? "EDIT BOOKING" : "BOOKING BARU"}</small>
            <h3>{weddingForm.id ? "Edit Wedding" : "Tambah Wedding"}</h3>

            <label>
              1. Nama Pengantin
              <input
                value={weddingForm.couple}
                onChange={(e) => setWeddingForm({ ...weddingForm, couple: e.target.value })}
                placeholder="Contoh: Rina & Andi"
              />
            </label>

            <label>
              2. Tanggal Wedding
              <input
                type="date"
                value={weddingForm.date}
                onChange={(e) => setWeddingForm({ ...weddingForm, date: e.target.value })}
              />
              <em>Anda bisa memilih tanggal, bulan, dan tahun. Jadwal otomatis masuk Kalender.</em>
            </label>

            <label>
              3. Lokasi
              <input
                value={weddingForm.place}
                onChange={(e) => setWeddingForm({ ...weddingForm, place: e.target.value })}
                placeholder="Gedung / alamat acara"
              />
            </label>

            <label>
              4. Nilai Booking
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={weddingForm.value}
                onChange={(e) => setWeddingForm({ ...weddingForm, value: e.target.value })}
                placeholder="Contoh: 15000000"
              />
            </label>

            <label>
              5. DP / Sudah Dibayar
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={weddingForm.paid}
                onChange={(e) => setWeddingForm({ ...weddingForm, paid: e.target.value })}
                placeholder="Contoh: 5000000"
              />
            </label>

            <label>
              6. Sisa Pembayaran Otomatis
              <div className="readonlyInput">{rp(weddingRemaining)}</div>
            </label>

            <label>
              7. Nomor WhatsApp
              <input
                value={weddingForm.whatsapp}
                onChange={(e) => setWeddingForm({ ...weddingForm, whatsapp: e.target.value })}
                placeholder="Contoh: 081234567890"
                inputMode="tel"
              />
            </label>

            <label>
              8. Catatan
              <textarea
                value={weddingForm.notes}
                onChange={(e) => setWeddingForm({ ...weddingForm, notes: e.target.value })}
                placeholder="Paket, request klien, jam akad, vendor, dll."
                rows={4}
              />
            </label>

            <button className="primary full" type="submit">
              <CheckCircle2 size={18} /> 9. Simpan Wedding
            </button>
          </form>
        </div>
      )}

      {paymentOpen && currentPaymentWedding && (
        <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && setPaymentOpen(false)}>
          <form onSubmit={savePayment} className="smallForm">
            <button type="button" className="close" onClick={() => setPaymentOpen(false)}>
              <X />
            </button>
            <small>PEMBAYARAN</small>
            <h3>Catat Pembayaran</h3>
            <p className="muted">
              {currentPaymentWedding.couple} · Sisa {rp(currentPaymentWedding.value - currentPaymentWedding.paid)}
            </p>
            <label>
              Nominal Masuk
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Contoh: 2000000"
              />
            </label>
            <button className="primary full" type="submit">
              <Banknote size={18} /> Simpan Pembayaran
            </button>
          </form>
        </div>
      )}

      {vendorOpen && (
        <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && setVendorOpen(false)}>
          <form onSubmit={saveVendor} className="smallForm">
            <button type="button" className="close" onClick={() => setVendorOpen(false)}>
              <X />
            </button>
            <small>{vendorForm.id ? "EDIT VENDOR" : "VENDOR BARU"}</small>
            <h3>{vendorForm.id ? "Edit Vendor" : "Tambah Vendor"}</h3>
            <label>
              Nama Vendor
              <input
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                placeholder="Contoh: Dekor Cantik Jepara"
              />
            </label>
            <label>
              Kategori
              <input
                value={vendorForm.category}
                onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                placeholder="Dekorasi / Catering / Foto / Gedung"
              />
            </label>
            <label>
              Nomor WhatsApp
              <input
                value={vendorForm.whatsapp}
                onChange={(e) => setVendorForm({ ...vendorForm, whatsapp: e.target.value })}
                placeholder="081234567890"
                inputMode="tel"
              />
            </label>
            <label>
              Catatan
              <textarea
                value={vendorForm.notes}
                onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                rows={3}
                placeholder="Harga, PIC, paket, catatan kerja sama, dll."
              />
            </label>
            <button className="primary full" type="submit">
              <CheckCircle2 size={18} /> Simpan Vendor
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

function Card({ t, v, s }) {
  return (
    <div className="card">
      <small>{t}</small>
      <strong>{v}</strong>
      <span>{s}</span>
    </div>
  );
}

function Empty({ text }) {
  return <div className="emptyState">{text}</div>;
}

function WeddingRow({ item, onEdit, onDelete, onPay, onWhatsApp }) {
  const remaining = Math.max(Number(item.value || 0) - Number(item.paid || 0), 0);
  const percent = item.value ? Math.min(100, (item.paid / item.value) * 100) : 0;

  return (
    <article>
      <div className="datebox">
        <HeartHandshake size={22} />
      </div>
      <div className="grow">
        <div className="titleLine">
          <h4>{item.couple}</h4>
          {remaining === 0 && <span className="paidBadge">Lunas</span>}
        </div>
        <p>
          {formatDate(item.date)} · {item.place}
        </p>
        <div className="bar">
          <i style={{ width: `${percent}%` }} />
        </div>
        {item.notes && <em className="noteLine">{item.notes}</em>}
        <div className="rowActions">
          {remaining > 0 && (
            <button onClick={() => onPay(item)}>
              <Banknote size={14} /> Bayar
            </button>
          )}
          {item.whatsapp && (
            <button onClick={() => onWhatsApp(item.whatsapp)}>
              <MessageCircle size={14} /> WhatsApp
            </button>
          )}
          <button onClick={() => onEdit(item)}>
            <Pencil size={14} /> Edit
          </button>
          <button className="danger" onClick={() => onDelete(item.id)}>
            <Trash2 size={14} /> Hapus
          </button>
        </div>
      </div>
      <div className="money">
        <b>{rp(item.value)}</b>
        <span>{remaining === 0 ? "Lunas" : `Sisa ${rp(remaining)}`}</span>
      </div>
    </article>
  );
}
