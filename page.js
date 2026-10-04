"use client";

import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  client: "",
  phone: "",
  date: "",
  location: "",
  packageName: "",
  booking: "",
  paid: "",
  status: "DP",
};

const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function Home() {
  const [weddings, setWeddings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("aynis-weddings");
      if (saved) setWeddings(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("aynis-weddings", JSON.stringify(weddings));
    } catch {}
  }, [weddings]);

  const summary = useMemo(() => {
    const booking = weddings.reduce((n, w) => n + Number(w.booking || 0), 0);
    const paid = weddings.reduce((n, w) => n + Number(w.paid || 0), 0);
    return { booking, paid, remaining: Math.max(booking - paid, 0) };
  }, [weddings]);

  const saveWedding = (e) => {
    e.preventDefault();
    const booking = Number(form.booking || 0);
    const paid = Number(form.paid || 0);
    if (!form.client.trim() || !form.date || booking <= 0) {
      alert("Isi Nama Klien, Tanggal Acara, dan Nilai Booking.");
      return;
    }
    setWeddings((old) => [
      {
        ...form,
        id: Date.now(),
        booking,
        paid,
        remaining: Math.max(booking - paid, 0),
      },
      ...old,
    ]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const removeWedding = (id) => {
    if (confirm("Hapus data wedding ini?")) {
      setWeddings((old) => old.filter((w) => w.id !== id));
    }
  };

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <h1>Aynis Wedding Manager</h1>
          <p>Kelola wedding, keuangan, dan jadwal dalam satu tempat.</p>
        </div>
        <button className="primary" onClick={() => setShowForm(true)}>
          + Tambah Wedding
        </button>
      </header>

      <section className="stats">
        <article><span>Wedding Aktif</span><strong>{weddings.length}</strong></article>
        <article><span>Total Nilai Booking</span><strong>{rupiah(summary.booking)}</strong></article>
        <article><span>Sudah Dibayar</span><strong>{rupiah(summary.paid)}</strong></article>
        <article><span>Sisa Tagihan</span><strong>{rupiah(summary.remaining)}</strong></article>
      </section>

      <section className="panel">
        <div className="panelHead">
          <div><h2>Wedding Terdaftar</h2><p>Daftar acara dan status pembayaran.</p></div>
          <button className="primary small" onClick={() => setShowForm(true)}>+ Tambah Wedding</button>
        </div>

        {weddings.length === 0 ? (
          <div className="empty">
            <div className="icon">▣</div>
            <h3>Belum ada wedding</h3>
            <p>Tambahkan wedding pertama untuk mulai mengelola bisnis.</p>
            <button className="primary" onClick={() => setShowForm(true)}>+ Tambah Wedding</button>
          </div>
        ) : (
          <div className="cards">
            {weddings.map((w) => (
              <article className="wedding" key={w.id}>
                <div className="weddingTop">
                  <div><h3>{w.client}</h3><p>{w.packageName || "Paket Wedding"}</p></div>
                  <span className="badge">{w.status}</span>
                </div>
                <div className="details">
                  <p><b>Tanggal</b><span>{new Date(w.date + "T00:00:00").toLocaleDateString("id-ID", {day:"numeric",month:"long",year:"numeric"})}</span></p>
                  <p><b>Lokasi</b><span>{w.location || "-"}</span></p>
                  <p><b>WhatsApp</b><span>{w.phone || "-"}</span></p>
                  <p><b>Booking</b><span>{rupiah(w.booking)}</span></p>
                  <p><b>Dibayar</b><span>{rupiah(w.paid)}</span></p>
                  <p><b>Sisa</b><span>{rupiah(Math.max(Number(w.booking)-Number(w.paid),0))}</span></p>
                </div>
                <button className="danger" onClick={() => removeWedding(w.id)}>Hapus</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <nav className="bottom">
        <button className="active">⌂<span>Dashboard</span></button>
        <button>♡<span>Wedding</span></button>
        <button>▣<span>Keuangan</span></button>
        <button>□<span>Kalender</span></button>
        <button>◇<span>Vendor</span></button>
      </nav>

      {showForm && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <form className="modal" onSubmit={saveWedding}>
            <div className="modalHead">
              <div><h2>Tambah Wedding</h2><p>Masukkan data booking baru.</p></div>
              <button type="button" className="close" onClick={() => setShowForm(false)}>×</button>
            </div>

            <label>Nama Klien<input required value={form.client} onChange={(e)=>setForm({...form,client:e.target.value})} placeholder="Contoh: Rina & Adi" /></label>
            <div className="grid2">
              <label>No. WhatsApp<input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="08xxxxxxxxxx" /></label>
              <label>Tanggal Acara<input required type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} /></label>
            </div>
            <label>Lokasi<input value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} placeholder="Gedung / alamat acara" /></label>
            <label>Paket<input value={form.packageName} onChange={(e)=>setForm({...form,packageName:e.target.value})} placeholder="Contoh: Paket Gold" /></label>
            <div className="grid2">
              <label>Nilai Booking<input required type="number" min="0" value={form.booking} onChange={(e)=>setForm({...form,booking:e.target.value})} placeholder="15000000" /></label>
              <label>Sudah Dibayar / DP<input type="number" min="0" value={form.paid} onChange={(e)=>setForm({...form,paid:e.target.value})} placeholder="5000000" /></label>
            </div>
            <label>Status
              <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                <option>DP</option><option>Belum Bayar</option><option>Lunas</option>
              </select>
            </label>
            <div className="formActions">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button className="primary" type="submit">Simpan Wedding</button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        :global(*){box-sizing:border-box} :global(body){margin:0;background:#f6f8fb;color:#13233a;font-family:Arial,Helvetica,sans-serif}
        .shell{min-height:100vh;padding:38px 6% 110px}.hero{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:28px}
        h1{font-size:38px;margin:0 0 7px}h2,h3,p{margin-top:0}.hero p,.panelHead p,.modalHead p{color:#6d7b8e}
        button{font:inherit;cursor:pointer}.primary{border:0;background:#112e54;color:white;padding:14px 20px;border-radius:9px;font-weight:700}.small{padding:11px 16px}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:26px}.stats article,.panel,.wedding{background:white;border:1px solid #e3e8ef;border-radius:11px}
        .stats article{padding:22px}.stats span{display:block;color:#66768a;font-size:14px;margin-bottom:14px}.stats strong{font-size:23px}
        .panel{padding:25px;min-height:430px}.panelHead{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #edf0f4;padding-bottom:18px}
        .empty{text-align:center;padding:70px 20px}.empty .icon{font-size:45px;color:#8090a5}.empty p{color:#748296}
        .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;padding-top:20px}.wedding{padding:20px}.weddingTop{display:flex;justify-content:space-between}.weddingTop p{color:#77869a}
        .badge{height:max-content;background:#edf4ff;color:#174f8d;border-radius:20px;padding:6px 10px;font-size:12px;font-weight:700}
        .details{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}.details p{display:flex;justify-content:space-between;border-bottom:1px solid #eef1f5;padding-bottom:8px;font-size:13px}.details span{color:#627287;text-align:right}
        .danger{border:0;background:#fff0f0;color:#b42318;border-radius:7px;padding:8px 12px}.bottom{position:fixed;left:0;right:0;bottom:0;background:white;border-top:1px solid #dfe5ec;display:flex;justify-content:space-around;padding:10px 5%;z-index:5}
        .bottom button{background:none;border:0;color:#64748b;display:flex;flex-direction:column;align-items:center;gap:4px}.bottom button.active{color:#0e315a;font-weight:700}.bottom span{font-size:12px}
        .overlay{position:fixed;inset:0;background:rgba(9,25,44,.48);display:flex;align-items:center;justify-content:center;padding:18px;z-index:20}.modal{background:white;width:min(650px,100%);max-height:92vh;overflow:auto;border-radius:14px;padding:24px;box-shadow:0 25px 70px rgba(0,0,0,.2)}
        .modalHead{display:flex;justify-content:space-between;gap:15px}.close{border:0;background:#eef2f6;border-radius:50%;width:36px;height:36px;font-size:25px}.modal label{display:block;font-size:13px;font-weight:700;margin:13px 0}
        input,select{width:100%;margin-top:7px;border:1px solid #cfd8e3;border-radius:8px;padding:12px;background:white;font-size:16px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.formActions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.secondary{border:1px solid #cbd5e1;background:white;padding:12px 18px;border-radius:9px}
        @media(max-width:760px){.shell{padding:24px 16px 105px}.hero{align-items:flex-start}.hero h1{font-size:27px}.hero>button{display:none}.stats{grid-template-columns:1fr 1fr;gap:10px}.stats article{padding:16px}.stats strong{font-size:17px}.panel{padding:17px}.panelHead p{display:none}.cards{grid-template-columns:1fr}.details{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}.bottom{padding-left:0;padding-right:0}}
      `}</style>
    </main>
  );
}
