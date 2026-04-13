import { useState } from "react";

const C = {
  lavender:"#7B5EA7", lavenderDeep:"#5C3D8F", lavenderMid:"#9B7EC8",
  lavenderSoft:"#C4A8E0", lavenderMist:"#EDE6F5", lavenderGlow:"#F7F3FC",
  white:"#FFFFFF", offWhite:"#FAF8FD", petal:"#F2ECF9",
  ink:"#2A1F3D", inkMid:"#5A4A72", inkLight:"#8A7A9A",
  success:"#5BA87A", successLight:"#EBF7F1",
  warning:"#C97B2A", warningLight:"#FDF3E7",
  border:"#DDD3ED", borderLight:"#EDE6F5",
};

const VIEWS = { DASHBOARD:"dashboard", ORDERS:"orders", CUSTOMERS:"customers", ANALYTICS:"analytics", SETTINGS:"settings" };

const INITIAL_ORDERS = [
  { id:"DRY-20501", customer:"Margaret Hollis",  items:"2x Dress Shirts, 1x Pants",  service:"Dry Clean",        status:"in_cleaning", time:"8:00 AM",  total:18, rush:false, hangDry:false },
  { id:"DRY-20502", customer:"James Whitfield",  items:"1x Suit",                    service:"Dry Clean",        status:"received",    time:"9:30 AM",  total:18, rush:true,  hangDry:false },
  { id:"DRY-20503", customer:"Diana Chen",       items:"1x Dress, 1x Coat",          service:"Dry Clean",        status:"ready",       time:"10:00 AM", total:34, rush:false, hangDry:false },
  { id:"DRY-20504", customer:"Robert Nkemelu",   items:"3x Shirts",                  service:"Launder & Press",  status:"in_cleaning", time:"11:00 AM", total:15, rush:false, hangDry:true  },
  { id:"DRY-20505", customer:"Susan Park",       items:"1x Bedding set",             service:"Wash & Fold",      status:"scheduled",   time:"1:00 PM",  total:22, rush:false, hangDry:false },
  { id:"DRY-20506", customer:"Thomas Greer",     items:"1x Suit, 2x Shirts",         service:"Dry Clean",        status:"qc",          time:"2:00 PM",  total:28, rush:true,  hangDry:false },
  { id:"DRY-20507", customer:"Patricia Lowe",    items:"5x Everyday Clothes",        service:"Wash & Fold",      status:"scheduled",   time:"3:30 PM",  total:20, rush:false, hangDry:true  },
  { id:"DRY-20508", customer:"David Morales",    items:"2x Pants, 1x Jacket",        service:"Dry Clean",        status:"received",    time:"4:00 PM",  total:36, rush:false, hangDry:false },
];

const TOP_CUSTOMERS = [
  { name:"Margaret Hollis", visits:24, spent:412, lastVisit:"Today",   zip:"10036", tag:"VIP",       topService:"Dry Clean"        },
  { name:"James Whitfield", visits:18, spent:338, lastVisit:"2 days",  zip:"10001", tag:"VIP",       topService:"Dry Clean"        },
  { name:"Diana Chen",      visits:15, spent:290, lastVisit:"Today",   zip:"10022", tag:"Regular",   topService:"Launder & Press"  },
  { name:"Robert Nkemelu",  visits:12, spent:204, lastVisit:"1 week",  zip:"10019", tag:"Regular",   topService:"Wash & Fold"      },
  { name:"Susan Park",      visits:9,  spent:176, lastVisit:"Today",   zip:"10028", tag:"Regular",   topService:"Bedding & Linens" },
  { name:"Thomas Greer",    visits:8,  spent:164, lastVisit:"Today",   zip:"10036", tag:"Regular",   topService:"Dry Clean"        },
  { name:"Patricia Lowe",   visits:6,  spent:98,  lastVisit:"2 weeks", zip:"10003", tag:"Occasional",topService:"Wash & Fold"      },
  { name:"David Morales",   visits:5,  spent:88,  lastVisit:"Today",   zip:"10016", tag:"Occasional",topService:"Dry Clean"        },
];

const WEEKLY = [
  { day:"Mon", revenue:312 }, { day:"Tue", revenue:428 }, { day:"Wed", revenue:276 },
  { day:"Thu", revenue:510 }, { day:"Fri", revenue:624 }, { day:"Sat", revenue:748 }, { day:"Sun", revenue:198 },
];

const SERVICES_BREAKDOWN = [
  { label:"Dry Clean",        pct:44, count:36, revenue:648  },
  { label:"Launder & Press",  pct:22, count:18, revenue:270  },
  { label:"Wash & Fold",      pct:20, count:16, revenue:240  },
  { label:"Press Only",       pct:8,  count:6,  revenue:72   },
  { label:"Repairs/Alter",    pct:6,  count:5,  revenue:75   },
];

const MONTHLY = [
  { month:"Oct", revenue:8200 }, { month:"Nov", revenue:9400 }, { month:"Dec", revenue:11200 },
  { month:"Jan", revenue:7800 }, { month:"Feb", revenue:8900 }, { month:"Mar", revenue:10400 }, { month:"Apr", revenue:4100 },
];

const STATUS_CFG = {
  scheduled:   { label:"Scheduled",     bg:C.lavenderMist, color:C.lavender,  dot:"#9B7EC8" },
  received:    { label:"Received",      bg:"#FDF3E7",       color:C.warning,   dot:C.warning },
  in_cleaning: { label:"In Cleaning",   bg:"#EBF1FD",       color:"#3A6EC8",   dot:"#3A6EC8" },
  qc:          { label:"Quality Check", bg:"#FFF8E1",       color:"#B8860B",   dot:"#B8860B" },
  ready:       { label:"Ready",         bg:C.successLight,  color:C.success,   dot:C.success },
  completed:   { label:"Completed",     bg:C.lavenderMist,  color:C.inkLight,  dot:C.inkLight},
};

const NEXT_STATUS = { scheduled:"received", received:"in_cleaning", in_cleaning:"qc", qc:"ready" };
const NEXT_LABEL  = { scheduled:"Mark Received", received:"Start Cleaning", in_cleaning:"Send to QC", qc:"Mark Ready" };

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.scheduled;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:c.bg, color:c.color, fontSize:11, fontFamily:"Georgia", whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot, display:"inline-block", flexShrink:0 }} />
      {c.label}
    </span>
  );
}

function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ background:C.white, borderRadius:20, border:`1px solid ${C.borderLight}`, boxShadow:"0 2px 16px rgba(123,94,167,0.07)", ...style }}>{children}</div>;
}

function MetricCard({ icon, label, value, sub, subColor, accent }) {
  return (
    <Card style={{ padding:"22px 24px", flex:1, minWidth:140 }}>
      <div style={{ fontSize:22, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:26, color:accent||C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif", marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", marginBottom:3 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:subColor||C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>{sub}</div>}
    </Card>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:20, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, fontWeight:"normal" }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width:44, height:26, borderRadius:13, background:on?C.lavender:C.borderLight, position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ width:20, height:20, borderRadius:"50%", background:C.white, position:"absolute", top:3, left:on?21:3, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

function PrimaryBtn({ children, onClick, style }) {
  return <button onClick={onClick} style={{ padding:"10px 18px", background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, color:C.white, border:"none", borderRadius:12, fontSize:13, fontFamily:"Georgia", cursor:"pointer", boxShadow:`0 4px 12px ${C.lavender}40`, whiteSpace:"nowrap", ...style }}>{children}</button>;
}

function OutlineBtn({ children, onClick, style }) {
  return <button onClick={onClick} style={{ padding:"8px 16px", background:"transparent", color:C.lavender, border:`1px solid ${C.lavenderSoft}`, borderRadius:10, fontSize:12, fontFamily:"Georgia", cursor:"pointer", ...style }}>{children}</button>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id:VIEWS.DASHBOARD, icon:"⌂",  label:"Dashboard"  },
  { id:VIEWS.ORDERS,    icon:"📋", label:"Orders"     },
  { id:VIEWS.CUSTOMERS, icon:"👥", label:"Customers"  },
  { id:VIEWS.ANALYTICS, icon:"📊", label:"Analytics"  },
  { id:VIEWS.SETTINGS,  icon:"⚙️", label:"Settings"   },
];

function Sidebar({ view, setView }) {
  return (
    <div style={{ width:220, background:`linear-gradient(180deg,${C.lavenderDeep} 0%,${C.lavender} 100%)`, display:"flex", flexDirection:"column", padding:"0 0 24px", flexShrink:0, height:"100vh" }}>
      <div style={{ padding:"32px 28px 24px" }}>
        <div style={{ fontSize:28, color:C.white, fontFamily:"Palatino Linotype,Georgia,serif", fontStyle:"italic", letterSpacing:-0.5 }}>dry.</div>
        <div style={{ fontSize:10, color:`${C.white}70`, letterSpacing:2, textTransform:"uppercase", fontFamily:"Georgia", marginTop:2 }}>Business Portal</div>
      </div>
      <div style={{ margin:"0 16px 24px", background:`${C.white}15`, borderRadius:14, padding:"12px 16px" }}>
        <div style={{ fontSize:11, color:`${C.white}70`, fontFamily:"Georgia", marginBottom:3 }}>Your Location</div>
        <div style={{ fontSize:14, color:C.white, fontFamily:"Georgia" }}>Prestige Cleaners</div>
        <div style={{ fontSize:11, color:`${C.white}60`, fontFamily:"Georgia" }}>142 W 36th St, NYC</div>
      </div>
      <div style={{ flex:1, padding:"0 12px" }}>
        {NAV.map(item => {
          const active = view===item.id;
          return (
            <div key={item.id} onClick={() => setView(item.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderRadius:14, marginBottom:4, cursor:"pointer", background:active?`${C.white}20`:"transparent" }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span style={{ fontSize:14, color:active?C.white:`${C.white}75`, fontFamily:"Georgia" }}>{item.label}</span>
              {active && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:C.white }} />}
            </div>
          );
        })}
      </div>
      <div style={{ margin:"0 16px" }}>
        <div style={{ background:`${C.white}15`, borderRadius:14, padding:"14px 16px" }}>
          <div style={{ fontSize:13, color:C.white, fontFamily:"Georgia", marginBottom:2 }}>Need Help?</div>
          <div style={{ fontSize:11, color:`${C.white}60`, fontFamily:"Georgia" }}>Call 1-800-DRY-HELP</div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ title, sub }) {
  return (
    <div style={{ padding:"22px 32px 18px", background:C.white, borderBottom:`1px solid ${C.borderLight}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
      <div>
        <div style={{ fontSize:22, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, fontWeight:"normal" }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>{sub}</div>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:12, color:C.ink, fontFamily:"Georgia" }}>Thursday, April 9, 2026</div>
          <div style={{ fontSize:11, color:C.lavender, fontFamily:"Georgia", fontStyle:"italic" }}>Business Hours: Open</div>
        </div>
        <div style={{ width:40, height:40, borderRadius:"50%", background:C.lavenderMist, border:`2px solid ${C.lavenderSoft}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:C.lavender, fontFamily:"Georgia", fontWeight:"bold", cursor:"pointer" }}>P</div>
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({ setView, orders }) {
  const ready    = orders.filter(o => o.status==="ready").length;
  const active   = orders.filter(o => ["in_cleaning","qc"].includes(o.status)).length;
  const incoming = orders.filter(o => ["scheduled","received"].includes(o.status)).length;
  const todayRev = orders.filter(o => o.status!=="scheduled").reduce((s,o) => s+o.total, 0);
  const hangDryOrders = orders.filter(o => o.hangDry).length;
  const maxRev   = Math.max(...WEEKLY.map(d => d.revenue));

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto" }}>
      <SectionHeader title="Good morning, Patricia!" sub="Here is everything happening at your location today." />

      {ready > 0 && (
        <div style={{ background:C.successLight, border:`1.5px solid ${C.success}`, borderRadius:16, padding:"14px 20px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, color:C.success, fontFamily:"Georgia" }}>{ready} order{ready>1?"s are":" is"} ready for customer pickup</div>
            <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>Customers have been notified automatically via Dry</div>
          </div>
          <OutlineBtn onClick={() => setView(VIEWS.ORDERS)} style={{ borderColor:C.success, color:C.success }}>View Orders</OutlineBtn>
        </div>
      )}

      {hangDryOrders > 0 && (
        <div style={{ background:"#EDF4FF", border:"1.5px solid #A0BEF0", borderRadius:16, padding:"12px 20px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:18 }}>💧</span>
          <div style={{ fontSize:13, color:"#3A6EC8", fontFamily:"Georgia" }}>
            {hangDryOrders} order{hangDryOrders>1?"s have":" has"} hang dry requested — air dry only, no heat
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
        <MetricCard icon="📦" label="Orders Today"     value={orders.length}  sub={`${active} in process`}       accent={C.lavenderDeep} />
        <MetricCard icon="✅" label="Ready for Pickup" value={ready}           sub="Customers notified"            accent={C.success}      subColor={C.success} />
        <MetricCard icon="⏳" label="Incoming Today"   value={incoming}        sub="Drop-offs scheduled"           accent={C.warning}      subColor={C.warning} />
        <MetricCard icon="💰" label="Revenue Today"    value={`$${todayRev}`}  sub="From completed orders"         accent={C.lavenderDeep} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20, marginBottom:24 }}>
        <Card>
          <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.borderLight}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>Today's Orders</div>
            <OutlineBtn onClick={() => setView(VIEWS.ORDERS)}>See All</OutlineBtn>
          </div>
          {orders.slice(0,5).map((o,i) => (
            <div key={o.id} style={{ padding:"13px 24px", borderBottom:i<4?`1px solid ${C.borderLight}`:"none", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", marginBottom:2 }}>{o.customer}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.items}</span>
                  {o.hangDry && <span style={{ fontSize:9, color:"#3A6EC8", background:"#EDF4FF", padding:"1px 5px", borderRadius:6, flexShrink:0 }}>💧 Hang Dry</span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                {o.rush && <span style={{ fontSize:10, color:C.warning, background:C.warningLight, padding:"2px 7px", borderRadius:8, fontFamily:"Georgia" }}>RUSH</span>}
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.borderLight}` }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>This Week's Revenue</div>
            <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>Apr 3 to Apr 9</div>
          </div>
          <div style={{ padding:"20px 24px" }}>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", height:130, gap:6 }}>
              {WEEKLY.map((d,i) => {
                const isToday = i===6;
                const h = Math.round((d.revenue/maxRev)*110);
                return (
                  <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                    <div style={{ fontSize:10, color:isToday?C.lavender:C.inkLight, fontFamily:"Georgia" }}>{d.revenue>=1000?`$${(d.revenue/1000).toFixed(1)}k`:`$${d.revenue}`}</div>
                    <div style={{ width:"100%", height:h, borderRadius:"6px 6px 0 0", background:isToday?`linear-gradient(180deg,${C.lavender},${C.lavenderDeep})`:C.lavenderMist, boxShadow:isToday?`0 4px 12px ${C.lavender}40`:"none" }} />
                    <div style={{ fontSize:11, color:isToday?C.lavender:C.inkLight, fontFamily:"Georgia" }}>{d.day}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop:`1px solid ${C.borderLight}`, marginTop:14, paddingTop:12, display:"flex", justifyContent:"space-between" }}>
              <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia" }}>Week Total</div>
              <div style={{ fontSize:14, color:C.lavenderDeep, fontFamily:"Georgia" }}>${WEEKLY.reduce((s,d)=>s+d.revenue,0).toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card>
          <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.borderLight}` }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>Services This Week</div>
          </div>
          <div style={{ padding:"16px 24px" }}>
            {SERVICES_BREAKDOWN.map(s => (
              <div key={s.label} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{s.label}</div>
                  <div style={{ fontSize:13, color:C.lavender, fontFamily:"Georgia" }}>{s.pct}%</div>
                </div>
                <div style={{ height:8, background:C.lavenderMist, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${s.pct}%`, background:`linear-gradient(90deg,${C.lavenderDeep},${C.lavender})`, borderRadius:4 }} />
                </div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", marginTop:4 }}>{s.count} orders · ${s.revenue}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.borderLight}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>Top Customers</div>
            <OutlineBtn onClick={() => setView(VIEWS.CUSTOMERS)}>See All</OutlineBtn>
          </div>
          {TOP_CUSTOMERS.slice(0,4).map((c,i) => (
            <div key={c.name} style={{ padding:"13px 24px", borderBottom:i<3?`1px solid ${C.borderLight}`:"none", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:C.lavenderMist, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:C.lavender, fontFamily:"Georgia", flexShrink:0 }}>{c.name.charAt(0)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{c.name}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia" }}>{c.visits} visits · {c.topService}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, color:C.lavender, fontFamily:"Georgia" }}>${c.spent}</div>
                {c.tag==="VIP" && <div style={{ fontSize:9, color:C.lavender, background:C.lavenderMist, padding:"2px 6px", borderRadius:8, fontFamily:"Georgia", marginTop:2 }}>VIP</div>}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Orders View ──────────────────────────────────────────────────────────────

function OrdersView({ orders, setOrders }) {
  const [filter, setFilter]     = useState("all");
  const [selected, setSelected] = useState(null);
  const [toast, setToast]       = useState(null);

  const filters = ["all","scheduled","received","in_cleaning","qc","ready"];
  const filtered = filter==="all" ? orders : orders.filter(o => o.status===filter);

  const advance = (e, id) => {
    e.stopPropagation();
    const o = orders.find(x => x.id===id);
    if (!o || !NEXT_STATUS[o.status]) return;
    setOrders(prev => prev.map(x => x.id===id ? {...x, status:NEXT_STATUS[x.status]} : x));
    setToast(`${o.customer} has been notified automatically`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", position:"relative" }}>
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, background:C.success, color:C.white, padding:"12px 20px", borderRadius:14, fontSize:13, fontFamily:"Georgia", boxShadow:"0 4px 20px rgba(0,0,0,0.15)", zIndex:999 }}>
          ✅ {toast}
        </div>
      )}
      <SectionHeader title="Today's Orders" sub="Tap any order to expand its details, then advance its status" />

      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:"8px 16px", borderRadius:20, border:`1.5px solid ${filter===f?C.lavender:C.border}`, background:filter===f?C.lavenderMist:C.white, color:filter===f?C.lavender:C.inkLight, fontSize:12, fontFamily:"Georgia", cursor:"pointer" }}>
            {f==="all" ? `All (${orders.length})` : `${STATUS_CFG[f]?.label} (${orders.filter(o=>o.status===f).length})`}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.map(o => (
          <Card key={o.id} onClick={() => setSelected(selected===o.id?null:o.id)} style={{ padding:"20px 24px", cursor:"pointer", border:selected===o.id?`1.5px solid ${C.lavender}`:`1px solid ${C.borderLight}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <div style={{ fontSize:16, color:C.ink, fontFamily:"Palatino Linotype,Georgia,serif" }}>{o.customer}</div>
                  {o.rush && <span style={{ fontSize:10, color:C.warning, background:C.warningLight, padding:"3px 8px", borderRadius:10, fontFamily:"Georgia" }}>⚡ RUSH</span>}
                  {o.hangDry && <span style={{ fontSize:10, color:"#3A6EC8", background:"#EDF4FF", padding:"3px 8px", borderRadius:10, fontFamily:"Georgia" }}>💧 HANG DRY</span>}
                </div>
                <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia", marginBottom:5 }}>{o.items}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:16, fontSize:12, color:C.inkLight, fontFamily:"Georgia" }}>
                  <span>{o.service}</span>
                  <span>Drop-off: {o.time}</span>
                  <span>${o.total}</span>
                  <span style={{ color:C.lavenderMid }}>{o.id}</span>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10, flexShrink:0 }}>
                <StatusBadge status={o.status} />
                {NEXT_STATUS[o.status] && (
                  <PrimaryBtn onClick={(e) => advance(e,o.id)} style={{ fontSize:12, padding:"8px 14px" }}>
                    {NEXT_LABEL[o.status]} →
                  </PrimaryBtn>
                )}
              </div>
            </div>
            {selected===o.id && (
              <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.borderLight}` }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {[
                    ["Order ID",    o.id],
                    ["Service",     o.service],
                    ["Drop-off",    o.time],
                    ["Total",       `$${o.total}`],
                    ["Rush",        o.rush?"Yes — 24hr":"No"],
                    ["Hang Dry",    o.hangDry?"Yes — air dry only":"No"],
                  ].map(([k,v]) => (
                    <div key={k} style={{ background:C.offWhite, borderRadius:12, padding:"12px 14px" }}>
                      <div style={{ fontSize:10, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:4 }}>{k}</div>
                      <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Customers View ───────────────────────────────────────────────────────────

function CustomersView() {
  const [search, setSearch] = useState("");
  const filtered = TOP_CUSTOMERS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ padding:"28px 32px", overflowY:"auto" }}>
      <SectionHeader title="Your Customers" sub="Everyone who has ordered through your Dry location" />
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..." style={{ width:"100%", padding:"13px 18px", borderRadius:14, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.white, marginBottom:20 }} />
      <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
        {[["👥","Total Customers","8","All time"],["⭐","VIP Customers","2","Spent $300+"],["🔁","Return Rate","87%","Past 90 days"],["💰","Avg. Spend","$221","Per customer"]].map(([icon,label,val,sub]) => (
          <Card key={label} style={{ flex:1, minWidth:130, padding:"18px 20px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:22, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>{val}</div>
            <div style={{ fontSize:12, color:C.ink, fontFamily:"Georgia" }}>{label}</div>
            <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>{sub}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ padding:"16px 24px 14px", borderBottom:`1px solid ${C.borderLight}` }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>All Customers</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding:"11px 24px", borderBottom:`1px solid ${C.borderLight}`, gap:8 }}>
          {["Customer","Visits","Spent","Last Visit","Zip","Top Service","Status"].map(h => (
            <div key={h} style={{ fontSize:10, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia" }}>{h}</div>
          ))}
        </div>
        {filtered.map((c,i) => (
          <div key={c.name} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding:"15px 24px", borderBottom:i<filtered.length-1?`1px solid ${C.borderLight}`:"none", gap:8, alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:C.lavenderMist, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:C.lavender, fontFamily:"Georgia", flexShrink:0 }}>{c.name.charAt(0)}</div>
              <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{c.name}</div>
            </div>
            <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{c.visits}</div>
            <div style={{ fontSize:13, color:C.lavenderDeep, fontFamily:"Georgia", fontWeight:"bold" }}>${c.spent}</div>
            <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia" }}>{c.lastVisit}</div>
            <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia" }}>{c.zip}</div>
            <div style={{ fontSize:11, color:C.inkMid, fontFamily:"Georgia" }}>{c.topService}</div>
            <span style={{ fontSize:11, padding:"4px 10px", borderRadius:20, fontFamily:"Georgia", display:"inline-block", color:c.tag==="VIP"?C.lavender:c.tag==="Regular"?C.success:C.inkLight, background:c.tag==="VIP"?C.lavenderMist:c.tag==="Regular"?C.successLight:C.offWhite }}>{c.tag}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────

function AnalyticsView() {
  const maxM = Math.max(...MONTHLY.map(d => d.revenue));
  const total = MONTHLY.reduce((s,d) => s+d.revenue, 0);
  return (
    <div style={{ padding:"28px 32px", overflowY:"auto" }}>
      <SectionHeader title="Analytics & Insights" sub="A clear picture of your business performance over time" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        {[["💰","Revenue (7 months)",`$${(total/1000).toFixed(1)}k`,"Total"],["📦","Total Orders","539","All services"],["⭐","Avg. Order Value","$22.80","Per transaction"],["📈","Month-over-Month","+18%","Mar vs Feb"]].map(([icon,label,val,sub]) => (
          <Card key={label} style={{ padding:"20px 22px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:24, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>{val}</div>
            <div style={{ fontSize:12, color:C.ink, fontFamily:"Georgia", marginTop:2 }}>{label}</div>
            <div style={{ fontSize:11, color:C.success, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>{sub}</div>
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom:24 }}>
        <div style={{ padding:"18px 28px 14px", borderBottom:`1px solid ${C.borderLight}` }}>
          <div style={{ fontSize:17, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>Monthly Revenue</div>
          <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>October 2025 to April 2026</div>
        </div>
        <div style={{ padding:"24px 28px 20px" }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", height:150, gap:12 }}>
            {MONTHLY.map((d,i) => {
              const last = i===MONTHLY.length-1;
              const h = Math.round((d.revenue/maxM)*130);
              return (
                <div key={d.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{ fontSize:11, color:last?C.lavender:C.inkLight, fontFamily:"Georgia" }}>${(d.revenue/1000).toFixed(1)}k</div>
                  <div style={{ width:"100%", height:h, borderRadius:"8px 8px 0 0", background:last?`linear-gradient(180deg,${C.lavenderMid},${C.lavender})`:`linear-gradient(180deg,${C.lavenderSoft},${C.lavenderMist})` }} />
                  <div style={{ fontSize:12, color:last?C.lavender:C.inkLight, fontFamily:"Georgia" }}>{d.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
        <Card>
          <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.borderLight}` }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>Busiest Days</div>
            <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>Based on last 90 days</div>
          </div>
          <div style={{ padding:"16px 24px" }}>
            {[["Saturday","Most orders and highest revenue"],["Friday","Second busiest — plan staffing"],["Thursday","Consistent mid-week volume"],["Monday","Slowest — consider a promotion"]].map(([day,note],i) => (
              <div key={day} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:i===0?C.lavender:C.lavenderMist, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:i===0?C.white:C.lavender, fontFamily:"Georgia", flexShrink:0 }}>{i+1}</div>
                <div>
                  <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{day}</div>
                  <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>{note}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.borderLight}` }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>Customer Insights</div>
          </div>
          <div style={{ padding:"16px 24px" }}>
            {[["Top Zip Code","10036 — 38% of your customers"],["Avg. Visit Frequency","Every 12 days"],["New Customers This Month","3 new customers"],["Customers at Risk","2 haven't visited in 30+ days"],["Hang Dry Requests","18% of laundry orders"]].map(([k,v],i) => (
              <div key={k} style={{ marginBottom:14, paddingBottom:14, borderBottom:i<4?`1px solid ${C.borderLight}`:"none" }}>
                <div style={{ fontSize:10, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:4 }}>{k}</div>
                <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div style={{ background:`linear-gradient(135deg,${C.lavenderGlow},${C.petal})`, border:`1.5px solid ${C.lavenderSoft}`, borderRadius:20, padding:"22px 28px" }}>
        <div style={{ fontSize:11, color:C.lavender, letterSpacing:1.5, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:8 }}>Weekly Insight</div>
        <div style={{ fontSize:17, color:C.ink, fontFamily:"Palatino Linotype,Georgia,serif", marginBottom:8 }}>Your Saturdays are 140% busier than your Mondays.</div>
        <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia", fontStyle:"italic", lineHeight:1.7 }}>Consider running a Monday promotion through the Dry app to smooth your weekly volume. Even a 10% Monday uptick would add roughly $180 per week to your revenue.</div>
      </div>
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────

function SettingsView() {
  const [notify, setNotify] = useState({ ready:true, dropoff:true, pickup:true, hangDry:true });
  const [saved, setSaved]   = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto" }}>
      <SectionHeader title="Settings" sub="Manage your location details, hours, and notification preferences" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card style={{ padding:"24px" }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:20 }}>Business Information</div>
          {[["Business Name","Prestige Cleaners"],["Address","142 W 36th St, New York, NY"],["Phone","(212) 555-0192"],["Email","prestige@dryclean.com"]].map(([k,v]) => (
            <div key={k} style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:6 }}>{k}</div>
              <input defaultValue={v} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.offWhite }} />
            </div>
          ))}
        </Card>

        <Card style={{ padding:"24px" }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:20 }}>Business Hours</div>
          {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => (
            <div key={day} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", width:90 }}>{day}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input defaultValue={day==="Sunday"?"9:00 AM":"7:00 AM"} style={{ width:78, padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, fontFamily:"Georgia", color:C.ink, outline:"none", background:C.offWhite }} />
                <span style={{ fontSize:12, color:C.inkLight }}>to</span>
                <input defaultValue={day==="Saturday"?"5:00 PM":day==="Sunday"?"Closed":"7:00 PM"} style={{ width:78, padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, fontFamily:"Georgia", color:C.ink, outline:"none", background:C.offWhite }} />
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding:"24px" }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:4 }}>Customer Notifications</div>
          <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:20 }}>These go out automatically — no action needed</div>
          {[
            ["Order Received",         "Sent when you mark an order as received",            "ready"  ],
            ["Order Ready for Pickup", "Sent when you mark an order as ready",                "dropoff"],
            ["Pickup Reminder",        "Sent if an order sits uncollected for 24 hours",      "pickup" ],
            ["Hang Dry Alert",         "Sent to staff when a hang dry order comes in",        "hangDry"],
          ].map(([label,desc,key]) => (
            <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${C.borderLight}` }}>
              <div>
                <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{label}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:3 }}>{desc}</div>
              </div>
              <Toggle on={notify[key]} onToggle={() => setNotify(n => ({...n, [key]:!n[key]}))} />
            </div>
          ))}
        </Card>

        <Card style={{ padding:"24px" }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:16 }}>Your Dry Plan</div>
          <div style={{ background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, borderRadius:16, padding:"20px", marginBottom:20 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:`${C.white}80`, textTransform:"uppercase", fontFamily:"Georgia" }}>Current Plan</div>
            <div style={{ fontSize:22, color:C.white, fontFamily:"Palatino Linotype,Georgia,serif", marginTop:4 }}>Pro — $249 / month</div>
            <div style={{ fontSize:12, color:`${C.white}70`, fontFamily:"Georgia", fontStyle:"italic", marginTop:4 }}>Renews May 9, 2026</div>
          </div>
          {["Full order management","Automatic customer notifications","Analytics dashboard","Customer insights & demographics","Zip code reports","Hang dry & service tracking"].map(f => (
            <div key={f} style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:C.success }}>✓</span> {f}
            </div>
          ))}
          <button style={{ width:"100%", marginTop:12, padding:"13px", background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, color:C.white, border:"none", borderRadius:12, fontSize:14, fontFamily:"Georgia", cursor:"pointer" }}>Upgrade to Enterprise</button>
        </Card>
      </div>

      <div style={{ marginTop:20, display:"flex", justifyContent:"flex-end" }}>
        <button onClick={save} style={{ padding:"14px 40px", background:saved?C.success:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, color:C.white, border:"none", borderRadius:14, fontSize:15, fontFamily:"Palatino Linotype,Georgia,serif", fontStyle:"italic", cursor:"pointer", transition:"background 0.3s", boxShadow:`0 6px 20px ${C.lavender}40` }}>
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

const META = {
  [VIEWS.DASHBOARD]: { title:"Dashboard",  sub:"Your business at a glance"                },
  [VIEWS.ORDERS]:    { title:"Orders",      sub:"Today's drop-offs and active orders"       },
  [VIEWS.CUSTOMERS]: { title:"Customers",   sub:"Who is coming through your door"           },
  [VIEWS.ANALYTICS]: { title:"Analytics",   sub:"Revenue, trends, and performance insights" },
  [VIEWS.SETTINGS]:  { title:"Settings",    sub:"Location, hours, and preferences"          },
};

export default function App() {
  const [view, setView]     = useState(VIEWS.DASHBOARD);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const meta = META[view];

  return (
    <div style={{ display:"flex", height:"100vh", background:C.offWhite, overflow:"hidden" }}>
      <Sidebar view={view} setView={setView} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <TopBar title={meta.title} sub={meta.sub} />
        <div style={{ flex:1, overflowY:"auto", background:C.offWhite }}>
          {view===VIEWS.DASHBOARD  && <DashboardView setView={setView} orders={orders} />}
          {view===VIEWS.ORDERS     && <OrdersView orders={orders} setOrders={setOrders} />}
          {view===VIEWS.CUSTOMERS  && <CustomersView />}
          {view===VIEWS.ANALYTICS  && <AnalyticsView />}
          {view===VIEWS.SETTINGS   && <SettingsView />}
        </div>
      </div>
    </div>
  );
}
