"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "aynis-wedding-manager-weddings-v2";

const emptyForm = {
  couple: "",
  date: "",
  location: "",
  booking: "",
  paid: "",
  whatsapp: "",
  notes: "",
};

const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const monthNames = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function Page() {
  const today = new Date();
  const [activeTab, setActiveTab] = useState("home");
  const [showForm, setShowForm] = useState(false);
  const [weddings, setWeddings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [storageReady, setStorageReady] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  useEffect(() => {
    try {
      const savedV2 = window.localStorage.getItem(STORAGE_KEY);
      const savedV1 = window.localStorage.getItem("aynis-wedding-manager-weddings-v1");
      const saved = savedV2 || savedV1;

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((item) => ({
            ...item,
            booking: Number(item.booking || 0),
            paid: Number(item.paid || 0),
            remaining: Math.max(
              Number(item.booking || 0) - Number(item.paid || 0),
              0
            ),
          }));
          setWeddings(normalized);
        }
      }
    } catch (error) {
      console.error("Gagal membaca data wedding:", error);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(weddings));
    } catch (error) {
      console.error("Gagal menyimpan data wedding:", error);
    }
  }, [weddings, storageReady]);

  const totals = useMemo(() => {
    const booking = weddings.reduce(
      (sum, wedding) => sum + Number(wedding.booking || 0),
      0
    );
    const paid = weddings.reduce(
      (sum, wedding) => sum + Number(wedding.paid || 0),
      0
    );

    return {
      booking,
      paid,
      remaining: Math.max(booking - paid, 0),
    };
  }, [weddings]);

  const remaining = Math.max(
    Number(form.booking || 0) - Number(form.paid || 0),
    0
  );

  const upcomingWeddings = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);

    return [...weddings]
      .filter((wedding) => {
        if (!wedding.date) return false;
        return new Date(`${wedding.date}T00:00:00`) >= current;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [weddings]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    let start = firstDay.getDay();
    start = start === 0 ? 6 : start - 1;

    const cells = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) cells.push(day);

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth, calendarYear]);

  const eventsByDay = useMemo(() => {
    const map = {};
    weddings.forEach((wedding) => {
      if (!wedding.date) return;
      const [year, month, day] = wedding.date.split("-").map(Number);
      if (year === calendarYear && month - 1 === calendarMonth) {
        if (!map[day]) map[day] = [];
        map[day].push(wedding);
      }
    });
    return map;
  }, [weddings, calendarMonth, calendarYear]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const saveWedding = (event) => {
    event.preventDefault();

    const booking = Number(form.booking || 0);
    const paid = Number(form.paid || 0);

    if (!form.couple.trim()) return alert("Nama Pengantin wajib diisi.");
    if (!form.date) return alert("Tanggal Wedding wajib diisi.");
    if (!form.location.trim()) return alert("Lokasi wajib diisi.");
    if (booking <= 0) return alert("Nilai Booking harus lebih dari Rp 0.");
    if (paid < 0) return alert("DP / Sudah Dibayar tidak boleh negatif.");
    if (paid > booking)
      return alert("DP / Sudah Dibayar tidak boleh melebihi Nilai Booking.");

    const newWedding = {
      id: Date.now(),
      couple: form.couple.trim(),
      date: form.date,
      location: form.location.trim(),
      booking,
      paid,
      remaining: Math.max(booking - paid, 0),
      whatsapp: form.whatsapp.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setWeddings((previous) => [newWedding, ...previous]);

    const selected = new Date(`${form.date}T00:00:00`);
    setCalendarMonth(selected.getMonth());
    setCalendarYear(selected.getFullYear());

    setForm(emptyForm);
    setShowForm(false);
  };

  const deleteWedding = (id) => {
    if (!window.confirm("Hapus data wedding ini?")) return;
    setWeddings((previous) => previous.filter((item) => item.id !== id));
  };

  const openWhatsApp = (phone) => {
    if (!phone) return;
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = `62${clean.slice(1)}`;
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  const goPreviousMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((year) => year - 1);
    } else {
      setCalendarMonth((month) => month - 1);
    }
  };

  const goNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((year) => year + 1);
    } else {
      setCalendarMonth((month) => month + 1);
    }
  };

  const yearOptions = Array.from({ length: 21 }, (_, index) => today.getFullYear() - 5 + index);

  return (
    <main className="page">
      <header>
        <div>
          <div className="brand-small">AYNIS ANIS MAKEUP</div>
          <h1><b>Aynis</b> <span>Wedding Manager</span></h1>
        </div>
        <div className="avatar">AA</div>
      </header>

      {activeTab === "home" && (
        <>
          <section className="hero card">
            <div className="eyebrow">Ringkasan Bisnis</div>
            <h2>Kelola wedding &amp;<br/>keuangan lebih rapi<br/>dalam satu tempat.</h2>
            <p>Booking, pembayaran, agenda, dan data klien tersimpan lebih rapi.</p>
            <button className="primary" onClick={() => setShowForm(true)}>
              ＋ Tambah Wedding
            </button>
          </section>

          <section className="statsGrid">
            <Stat title="Wedding Aktif" value={weddings.length} desc="Total wedding tersimpan" />
            <Stat title="Nilai Booking" value={rupiah(totals.booking)} desc="Total nilai booking" />
            <Stat title="Sudah Dibayar" value={rupiah(totals.paid)} desc="Pembayaran klien" />
            <Stat title="Sisa Tagihan" value={rupiah(totals.remaining)} desc="Perlu ditagih" />
          </section>

          <section className="list card">
            <div className="listHead">
              <div>
                <div className="eyebrow">Agenda Terdekat</div>
                <h3>Wedding Mendatang</h3>
              </div>
              <button className="mini" onClick={() => setActiveTab("calendar")}>
                Kalender
              </button>
            </div>

            {!storageReady ? (
              <div className="empty">Memuat data...</div>
            ) : upcomingWeddings.length === 0 ? (
              <div className="empty">
                <b>Belum ada agenda wedding.</b>
                <span>Tambahkan booking baru agar jadwal tampil otomatis.</span>
              </div>
            ) : (
              <div className="weddingList">
                {upcomingWeddings.slice(0, 3).map((wedding) => (
                  <WeddingCard
                    key={wedding.id}
                    wedding={wedding}
                    onDelete={deleteWedding}
                    onWhatsApp={openWhatsApp}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === "wedding" && (
        <section className="list card pageSection">
          <div className="listHead">
            <div>
              <div className="eyebrow">Semua Data</div>
              <h3>Wedding</h3>
            </div>
            <button className="mini" onClick={() => setShowForm(true)}>＋ Tambah</button>
          </div>

          {!storageReady ? (
            <div className="empty">Memuat data...</div>
          ) : weddings.length === 0 ? (
            <div className="empty">
              <b>Belum ada wedding.</b>
              <span>Tekan “Tambah” untuk memasukkan booking pertama.</span>
            </div>
          ) : (
            <div className="weddingList">
              {[...weddings]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((wedding) => (
                  <WeddingCard
                    key={wedding.id}
                    wedding={wedding}
                    onDelete={deleteWedding}
                    onWhatsApp={openWhatsApp}
                  />
                ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "finance" && (
        <>
          <section className="pageTitle card">
            <div className="eyebrow">Keuangan</div>
            <h3>Ringkasan Pembayaran</h3>
            <p>Ringkasan otomatis dari data booking wedding.</p>
          </section>

          <section className="statsGrid">
            <Stat title="Nilai Booking" value={rupiah(totals.booking)} desc="Total seluruh booking" />
            <Stat title="Sudah Dibayar" value={rupiah(totals.paid)} desc="Uang yang sudah masuk" />
            <Stat title="Sisa Tagihan" value={rupiah(totals.remaining)} desc="Belum dibayar klien" />
            <Stat
              title="Persentase Masuk"
              value={totals.booking ? `${Math.round((totals.paid / totals.booking) * 100)}%` : "0%"}
              desc="Dari total booking"
            />
          </section>

          <section className="list card">
            <div className="eyebrow">Status Pembayaran</div>
            <h3>Tagihan Klien</h3>

            {weddings.length === 0 ? (
              <div className="empty">Belum ada transaksi.</div>
            ) : (
              <div className="weddingList">
                {weddings
                  .filter((wedding) => Number(wedding.remaining || 0) > 0)
                  .sort((a, b) => Number(b.remaining || 0) - Number(a.remaining || 0))
                  .map((wedding) => (
                    <WeddingCard
                      key={wedding.id}
                      wedding={wedding}
                      onDelete={deleteWedding}
                      onWhatsApp={openWhatsApp}
                    />
                  ))}
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === "calendar" && (
        <section className="calendarWrap card pageSection">
          <div className="calendarHead">
            <div>
              <div className="eyebrow">Agenda Wedding</div>
              <h3>Kalender</h3>
            </div>
            <button className="mini" onClick={() => setShowForm(true)}>＋ Wedding</button>
          </div>

          <div className="calendarControls">
            <button className="navMonth" onClick={goPreviousMonth}>‹</button>

            <select
              value={calendarMonth}
              onChange={(event) => setCalendarMonth(Number(event.target.value))}
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index}>{name}</option>
              ))}
            </select>

            <select
              value={calendarYear}
              onChange={(event) => setCalendarYear(Number(event.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <button className="navMonth" onClick={goNextMonth}>›</button>
          </div>

          <div className="dayNames">
            {dayNames.map((day) => <div key={day}>{day}</div>)}
          </div>

          <div className="calendarGrid">
            {calendarDays.map((day, index) => {
              const isToday =
                day &&
                day === today.getDate() &&
                calendarMonth === today.getMonth() &&
                calendarYear === today.getFullYear();

              const events = day ? eventsByDay[day] || [] : [];

              return (
                <div
                  className={`calendarCell ${!day ? "blank" : ""} ${isToday ? "today" : ""}`}
                  key={`${day || "blank"}-${index}`}
                >
                  {day && (
                    <>
                      <div className="dayNumber">{day}</div>
                      <div className="eventDots">
                        {events.slice(0, 2).map((event) => (
                          <button
                            key={event.id}
                            className="calendarEvent"
                            title={`${event.couple} - ${event.location}`}
                            onClick={() => setActiveTab("wedding")}
                          >
                            {event.couple}
                          </button>
                        ))}
                        {events.length > 2 && (
                          <div className="moreEvent">+{events.length - 2} lagi</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="monthAgenda">
            <div className="eyebrow">Jadwal Bulan Ini</div>
            <h4>{monthNames[calendarMonth]} {calendarYear}</h4>

            {Object.values(eventsByDay).flat().length === 0 ? (
              <div className="empty smallEmpty">Tidak ada wedding di bulan ini.</div>
            ) : (
              <div className="weddingList">
                {Object.values(eventsByDay)
                  .flat()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((wedding) => (
                    <WeddingCard
                      key={wedding.id}
                      wedding={wedding}
                      onDelete={deleteWedding}
                      onWhatsApp={openWhatsApp}
                    />
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "vendor" && (
        <section className="placeholder card pageSection">
          <div className="eyebrow">Vendor</div>
          <h3>Data Vendor</h3>
          <p>Menu vendor siap dikembangkan berikutnya untuk MUA, dekorasi, foto/video, gedung, catering, dan kontak PIC.</p>
        </section>
      )}

      <nav className="bottomnav">
        <NavItem active={activeTab === "home"} onClick={() => setActiveTab("home")} icon="⌂" label="Home" />
        <NavItem active={activeTab === "wedding"} onClick={() => setActiveTab("wedding")} icon="♡" label="Wedding" />
        <NavItem active={activeTab === "finance"} onClick={() => setActiveTab("finance")} icon="▣" label="Keuangan" />
        <NavItem active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} icon="▦" label="Kalender" />
        <NavItem active={activeTab === "vendor"} onClick={() => setActiveTab("vendor")} icon="▤" label="Vendor" />
      </nav>

      {showForm && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <form className="modal" onSubmit={saveWedding}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Booking Baru</div>
                <h3>Tambah Wedding</h3>
              </div>
              <button
                type="button"
                className="close"
                onClick={() => setShowForm(false)}
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <Field label="1. Nama Pengantin">
              <input
                name="couple"
                value={form.couple}
                onChange={handleChange}
                placeholder="Contoh: Rina & Andi"
                autoComplete="off"
              />
            </Field>

            <Field label="2. Tanggal Wedding">
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
              <small className="hint">Pilih tanggal, bulan, dan tahun. Jadwal otomatis masuk ke Kalender.</small>
            </Field>

            <Field label="3. Lokasi">
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Gedung / alamat acara"
              />
            </Field>

            <Field label="4. Nilai Booking">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                name="booking"
                value={form.booking}
                onChange={handleChange}
                placeholder="Contoh: 15000000"
              />
            </Field>

            <Field label="5. DP / Sudah Dibayar">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                name="paid"
                value={form.paid}
                onChange={handleChange}
                placeholder="Contoh: 5000000"
              />
            </Field>

            <Field label="6. Sisa Pembayaran Otomatis">
              <div className="readonly">{rupiah(remaining)}</div>
            </Field>

            <Field label="7. Nomor WhatsApp">
              <input
                type="tel"
                inputMode="tel"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="Contoh: 081234567890"
              />
            </Field>

            <Field label="8. Catatan">
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Catatan paket, request klien, jadwal, vendor, dll."
                rows="4"
              />
            </Field>

            <button className="primary save" type="submit">
              9. Simpan Wedding
            </button>
          </form>
        </div>
      )}

      <style jsx global>{`
        *{box-sizing:border-box}
        body{margin:0;background:#f8f5ef;color:#201b17;font-family:Arial,sans-serif}
        button,input,textarea,select{font:inherit}
        button{cursor:pointer}
        .page{max-width:760px;margin:auto;padding:34px 24px 132px}
        header{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px}
        .brand-small,.eyebrow{letter-spacing:3px;font-weight:700;font-size:12px;text-transform:uppercase;color:#9d7659}
        h1{font-family:Georgia,serif;font-size:42px;margin:9px 0 0;line-height:1}
        h1 span{font-weight:400;color:#8a674d}
        .avatar{width:66px;height:66px;border-radius:50%;background:#241a14;color:white;display:grid;place-items:center;font-size:22px}
        .card{background:#fff;border:1px solid #e5d5c8;border-radius:26px;box-shadow:0 4px 18px #6b4d3210}
        .hero{padding:38px 34px;margin-bottom:20px}
        .hero h2{font-family:Georgia,serif;font-size:39px;line-height:1.08;margin:16px 0}
        .hero p,.stat p,.pageTitle p,.placeholder p{color:#776d66;font-size:17px;line-height:1.5}
        .primary{width:100%;border:0;border-radius:18px;background:#a87550;color:#fff;font-size:18px;font-weight:700;padding:17px}
        .statsGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
        .stat{padding:22px}
        .stat label{display:block;text-transform:uppercase;letter-spacing:2px;color:#a87550;font-weight:700;font-size:11px}
        .stat strong{display:block;font-size:23px;margin-top:12px;word-break:break-word}
        .stat p{margin:8px 0 0;font-size:14px}
        .list,.calendarWrap,.pageTitle,.placeholder{padding:26px}
        .pageTitle,.placeholder{margin-bottom:20px}
        .pageSection{min-height:420px}
        .listHead,.calendarHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}
        .listHead h3,.calendarHead h3,.pageTitle h3,.placeholder h3{margin:7px 0 0;font-size:28px}
        .mini{border:0;border-radius:14px;padding:11px 14px;background:#f0e3d8;color:#82583b;font-weight:700}
        .empty{padding:34px 18px;text-align:center;color:#776d66;display:grid;gap:8px}
        .smallEmpty{padding:20px 0}
        .weddingList{display:grid;gap:14px}
        .weddingItem{border:1px solid #eaded4;border-radius:20px;padding:18px;background:#fffdfa}
        .weddingTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
        .weddingTop h4{margin:0;font-size:20px}
        .weddingTop p{margin:6px 0 0;color:#756a62;font-size:14px}
        .status{background:#fff0df;color:#a26025;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:700;white-space:nowrap}
        .status.paid{background:#e7f6ea;color:#2d7b3a}
        .moneyGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}
        .moneyGrid div{background:#f7f2ed;border-radius:14px;padding:11px}
        .moneyGrid small{display:block;color:#796f68;margin-bottom:5px}
        .moneyGrid b{font-size:13px}
        .meta{font-size:14px;color:#5e554e;margin:8px 0;overflow-wrap:anywhere}
        .itemActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
        .wa,.delete{border:0;border-radius:12px;padding:10px 12px;font-weight:700}
        .wa{background:#e8f7ec;color:#25753a}
        .delete{background:#fff0f0;color:#a73535}
        .calendarControls{display:grid;grid-template-columns:48px 1fr 1fr 48px;gap:8px;margin:18px 0}
        .calendarControls select,.navMonth{border:1px solid #e3d4c8;background:#fff8f3;border-radius:14px;padding:12px;color:#4e3b30;font-weight:700}
        .navMonth{font-size:24px;padding:6px}
        .dayNames,.calendarGrid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
        .dayNames{margin-bottom:6px}
        .dayNames div{text-align:center;color:#8f7969;font-size:12px;font-weight:700;padding:5px 0}
        .calendarCell{min-height:84px;border:1px solid #eadfd5;border-radius:14px;padding:7px;background:#fffdfa;overflow:hidden}
        .calendarCell.blank{background:#faf7f3;border-style:dashed}
        .calendarCell.today{border:2px solid #a87550;background:#fff8f2}
        .dayNumber{font-weight:800;font-size:13px;margin-bottom:5px}
        .eventDots{display:grid;gap:4px}
        .calendarEvent{border:0;width:100%;text-align:left;background:#efe0d4;color:#7d5438;border-radius:7px;padding:5px;font-size:9px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .moreEvent{font-size:9px;color:#8b786b;padding-left:3px}
        .monthAgenda{margin-top:24px;border-top:1px solid #eadfd5;padding-top:22px}
        .monthAgenda h4{font-size:24px;margin:7px 0 16px}
        .bottomnav{position:fixed;z-index:20;bottom:18px;left:50%;transform:translateX(-50%);width:min(650px,92%);background:#211913;border-radius:28px;padding:10px;display:flex;justify-content:space-around;color:#bcb3ac}
        .navItem{border:0;background:transparent;color:inherit;min-width:65px;text-align:center;font-size:24px;padding:8px;border-radius:18px}
        .navItem small{display:block;font-size:11px;margin-top:4px}
        .navItem.active{background:#4a3529;color:#fff}
        .overlay{position:fixed;z-index:100;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{width:min(700px,100%);max-height:92vh;overflow:auto;background:white;border-radius:28px;padding:30px}
        .modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
        .modal h3{font-size:30px;margin:7px 0 0}
        .close{border:0;width:48px;height:48px;border-radius:50%;font-size:34px;line-height:1;background:#f6efe9;color:#7f5b42}
        .field{margin:0 0 17px}
        .field label{display:block;font-weight:700;font-size:16px;margin:0 0 8px}
        input,textarea,.readonly{width:100%;border:1.5px solid #e2d3c7;border-radius:15px;padding:15px 16px;font-size:16px;background:#fff;color:#211b17;font-family:inherit}
        textarea{resize:vertical}
        .readonly{background:#f6f1ec;font-weight:700;color:#8b6348}
        .hint{display:block;color:#8b786b;margin-top:7px;font-size:12px;line-height:1.4}
        .save{margin-top:6px}

        @media(max-width:520px){
          .page{padding:24px 16px 120px}
          h1{font-size:32px}
          .brand-small{letter-spacing:2px;font-size:10px}
          .avatar{width:54px;height:54px;font-size:18px}
          .hero{padding:29px 23px}
          .hero h2{font-size:33px}
          .statsGrid{grid-template-columns:1fr 1fr;gap:10px}
          .stat{padding:17px}
          .stat strong{font-size:17px}
          .list,.calendarWrap,.pageTitle,.placeholder{padding:19px}
          .modal{padding:24px 18px;border-radius:24px}
          .overlay{padding:12px}
          .modal h3{font-size:26px}
          .moneyGrid{grid-template-columns:1fr}
          .navItem{min-width:auto;font-size:21px;padding:8px 7px}
          .calendarControls{grid-template-columns:42px 1fr 90px 42px}
          .calendarControls select,.navMonth{padding:9px 6px;font-size:13px}
          .calendarCell{min-height:67px;padding:5px;border-radius:10px}
          .dayNumber{font-size:11px}
          .calendarEvent{font-size:8px;padding:4px}
          .dayNames div{font-size:10px}
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Stat({ title, value, desc }) {
  return (
    <article className="stat card">
      <label>{title}</label>
      <strong>{value}</strong>
      <p>{desc}</p>
    </article>
  );
}

function NavItem({ active, onClick, icon, label }) {
  return (
    <button className={`navItem ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <small>{label}</small>
    </button>
  );
}

function WeddingCard({ wedding, onDelete, onWhatsApp }) {
  return (
    <article className="weddingItem">
      <div className="weddingTop">
        <div>
          <h4>{wedding.couple}</h4>
          <p>{formatDate(wedding.date)} • {wedding.location}</p>
        </div>
        <span className={Number(wedding.remaining || 0) === 0 ? "status paid" : "status"}>
          {Number(wedding.remaining || 0) === 0 ? "Lunas" : "Belum Lunas"}
        </span>
      </div>

      <div className="moneyGrid">
        <div>
          <small>Booking</small>
          <b>{rupiah(wedding.booking)}</b>
        </div>
        <div>
          <small>Dibayar</small>
          <b>{rupiah(wedding.paid)}</b>
        </div>
        <div>
          <small>Sisa</small>
          <b>{rupiah(wedding.remaining)}</b>
        </div>
      </div>

      {wedding.whatsapp && <p className="meta"><b>WhatsApp:</b> {wedding.whatsapp}</p>}
      {wedding.notes && <p className="meta"><b>Catatan:</b> {wedding.notes}</p>}

      <div className="itemActions">
        {wedding.whatsapp && (
          <button className="wa" onClick={() => onWhatsApp(wedding.whatsapp)}>
            WhatsApp
          </button>
        )}
        <button className="delete" onClick={() => onDelete(wedding.id)}>
          Hapus
        </button>
      </div>
    </article>
  );
}
