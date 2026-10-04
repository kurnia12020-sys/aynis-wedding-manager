"use client";
import {useMemo,useState} from 'react';
import {Home,HeartHandshake,WalletCards,CalendarDays,Store,Plus,X} from 'lucide-react';
const rp=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const initial=[{id:1,couple:'Rina & Andi',date:'18 Oktober 2026',place:'Gedung Graha Sari',value:25000000,paid:10000000},{id:2,couple:'Siti & Budi',date:'25 Oktober 2026',place:'Hotel Santika',value:18000000,paid:8000000},{id:3,couple:'Mela & Fajar',date:'5 November 2026',place:'Rumah Mempelai',value:15000000,paid:15000000}];
export default function Page(){
 const [tab,setTab]=useState('Home'); const [items,setItems]=useState(initial); const [open,setOpen]=useState(false);
 const total=useMemo(()=>items.reduce((a,x)=>a+x.value,0),[items]); const paid=useMemo(()=>items.reduce((a,x)=>a+x.paid,0),[items]);
 const add=e=>{e.preventDefault();const f=new FormData(e.currentTarget);setItems(v=>[...v,{id:Date.now(),couple:f.get('couple'),date:f.get('date'),place:f.get('place'),value:Number(f.get('value')),paid:Number(f.get('paid'))}]);setOpen(false)};
 return <main><header><div><div className="eyebrow">AYNIS ANIS MAKEUP</div><h1>Aynis <span>Wedding Manager</span></h1></div><button className="avatar">AA</button></header>
 <section className="hero"><div><span>Ringkasan Bisnis</span><h2>Kelola wedding & keuangan<br/>lebih rapi dalam satu tempat.</h2><p>Dashboard sederhana untuk booking, pembayaran, agenda, dan vendor.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={18}/> Tambah Wedding</button></section>
 <section className="stats"><Card t="Nilai Booking" v={rp(total)} s={`${items.length} wedding aktif`}/><Card t="Sudah Dibayar" v={rp(paid)} s="Pembayaran klien"/><Card t="Sisa Tagihan" v={rp(total-paid)} s="Perlu ditagih"/></section>
 <div className="sectionHead"><div><small>AGENDA</small><h3>Wedding Terdaftar</h3></div><b>{items.length} acara</b></div>
 <section className="list">{items.map(x=><article key={x.id}><div className="datebox"><HeartHandshake size={22}/></div><div className="grow"><h4>{x.couple}</h4><p>{x.date} · {x.place}</p><div className="bar"><i style={{width:`${Math.min(100,x.paid/x.value*100)}%`}}/></div></div><div className="money"><b>{rp(x.value)}</b><span>{x.paid>=x.value?'Lunas':`Sisa ${rp(x.value-x.paid)}`}</span></div></article>)}</section>
 <section className="quick"><h3>Keuangan Cepat</h3><div><button><WalletCards/>Catat Pembayaran</button><button><Store/>Data Vendor</button><button><CalendarDays/>Lihat Kalender</button></div></section>
 <nav>{[['Home',Home],['Wedding',HeartHandshake],['Keuangan',WalletCards],['Kalender',CalendarDays],['Vendor',Store]].map(([n,I])=><button key={n} className={tab===n?'active':''} onClick={()=>setTab(n)}><I size={20}/><span>{n}</span></button>)}</nav>
 {open&&<div className="modal"><form onSubmit={add}><button type="button" className="close" onClick={()=>setOpen(false)}><X/></button><h3>Tambah Wedding</h3><label>Nama Pengantin<input name="couple" required placeholder="Contoh: Rina & Andi"/></label><label>Tanggal<input name="date" required placeholder="18 Oktober 2026"/></label><label>Lokasi<input name="place" required placeholder="Gedung / alamat"/></label><label>Nilai Booking<input name="value" required type="number" min="0"/></label><label>Sudah Dibayar<input name="paid" required type="number" min="0" defaultValue="0"/></label><button className="primary full">Simpan Wedding</button></form></div>}
 </main>}
function Card({t,v,s}){return <div className="card"><small>{t}</small><strong>{v}</strong><span>{s}</span></div>}
