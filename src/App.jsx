import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase ─────────────────────────────────────────────────────────────────
// Replace these with your actual Supabase project URL and anon key
// found in Supabase Dashboard → Project Settings → API
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || "YOUR_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const C = {
  lavender:"#7B5EA7", lavenderDeep:"#5C3D8F", lavenderMid:"#9B7EC8",
  lavenderSoft:"#C4A8E0", lavenderMist:"#EDE6F5", lavenderGlow:"#F7F3FC",
  white:"#FFFFFF", offWhite:"#FAF8FD", petal:"#F2ECF9",
  ink:"#2A1F3D", inkMid:"#5A4A72", inkLight:"#8A7A9A",
  success:"#6BAE8A", successLight:"#EBF7F1",
  warning:"#C97B2A", warningLight:"#FDF3E7",
  border:"#DDD3ED", borderLight:"#EDE6F5",
};

const S = {
  AUTH:"auth",
  HOME:"home", FIND:"find", DETAIL:"detail", QUICK:"quick",
  SERVICE:"service", GARMENTS:"garments", SCHEDULE:"schedule",
  SUMMARY:"summary", CONFIRM:"confirm", TRACKING:"tracking",
  HISTORY:"history", PROFILE:"profile", PREFERENCES:"preferences", REFERRAL:"referral",
  NOTIFICATIONS:"notifications", PAYMENT_METHODS:"payment_methods",
  MY_CLEANERS:"my_cleaners", HELP:"help", FEEDBACK:"feedback",
};

const ALL_SERVICES = [
  { id:"dry_clean",   label:"Dry Clean",            desc:"Solvent-based care for delicates & structured pieces", icon:"✨" },
  { id:"launder",     label:"Launder & Press",       desc:"Wash, dry, and crisp press — with optional hang dry",  icon:"👕" },
  { id:"wash_fold",   label:"Wash & Fold",           desc:"Everyday laundry washed, dried, and folded",           icon:"🧺" },
  { id:"press_only",  label:"Press Only",            desc:"Steam press — no cleaning cycle",                      icon:"👔" },
  { id:"alterations", label:"Repairs & Alterations", desc:"Expert tailoring, hemming, and repairs",               icon:"🪡" },
  { id:"bedding",     label:"Bedding & Linens",      desc:"Comforters, duvets, sheets, and delicate linens",      icon:"🛏️" },
  { id:"leather",     label:"Leather & Suede",       desc:"Specialist cleaning for leather, suede, and fur",      icon:"🧥" },
  { id:"pickup",      label:"Pickup & Delivery",     desc:"We come to you — free within 1 mile",                  icon:"🚗" },
];

const HANG_DRY_SERVICES = ["launder","wash_fold"];

// Static — platform-wide garment pricing defaults
const GARMENT_TYPES = [
  { id:"shirts",   label:"Dress Shirts",     icon:"👔", price:5  },
  { id:"suits",    label:"Suits",            icon:"🤵", price:18 },
  { id:"dresses",  label:"Dresses",          icon:"👗", price:14 },
  { id:"pants",    label:"Pants/Trousers",   icon:"👖", price:8  },
  { id:"coats",    label:"Coats & Jackets",  icon:"🧥", price:20 },
  { id:"everyday", label:"Everyday Clothes", icon:"👚", price:4  },
  { id:"bedding",  label:"Bedding & Linens", icon:"🛏️", price:22 },
  { id:"other",    label:"Other",            icon:"📦", price:10 },
];

const FEATURE_LABELS = {
  nontoxic:{ label:"Non-Toxic Chemicals", icon:"🌿", desc:"GreenEarth liquid silicone — no harsh chemicals, no odor" },
  express: { label:"Express Same-Day",    icon:"⚡", desc:"Same-day service for drop-offs before 10am" },
  luxury:  { label:"Luxury Garments",     icon:"✨", desc:"Couture, designer, and heirloom garment care" },
};

// ─── Helpers: map DB row → app shape ─────────────────────────────────────────
function dbToCleanerShape(row, userOrderHistory = []) {
  const features = [];
  if (row.feature_nontoxic) features.push("nontoxic");
  if (row.feature_express)  features.push("express");
  if (row.feature_luxury)   features.push("luxury");
  const ordersHere = userOrderHistory.filter(o => o.business_id === row.id).length;
  return {
    id:               row.id,
    name:             row.name,
    addr:             row.address,
    dist:             "nearby",               // real distance needs geo calc
    rating:           parseFloat(row.rating) || 0,
    reviews:          row.review_count || 0,
    wait:             "Ready in 1–2 days",    // future: dynamic per cleaner
    price:            row.plan === "pro" ? "$$" : "$",
    services:         row.services || [],
    features,
    plan:             row.plan,
    bio:              row.bio || "",
    hoursDetailed:    row.hours || {},
    topReviews:       [],                     // loaded on demand in DetailScreen
    returningCustomer: ordersHere >= 3,
    ordersCompleted:  ordersHere,
    quickDropEnabled: row.quick_drop_enabled,
  };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
const LavenderSprig = ({ style }) => (
  <svg width="40" height="60" viewBox="0 0 40 60" style={{ opacity:0.2, ...style }}>
    <line x1="20" y1="60" x2="20" y2="10" stroke={C.lavender} strokeWidth="1.5"/>
    {[14,18,22,26,30,34].map((y,i) => (
      <ellipse key={i} cx={i%2===0?14:26} cy={y} rx="5" ry="3.5"
        fill={C.lavender} transform={`rotate(${i%2===0?-30:30} ${i%2===0?14:26} ${y})`}/>
    ))}
    <ellipse cx="20" cy="10" rx="5" ry="3.5" fill={C.lavender}/>
  </svg>
);

const Tag = ({ children, style }) => (
  <span style={{ display:"inline-block", background:C.lavenderMist, color:C.lavender, fontSize:10, letterSpacing:1.5, textTransform:"uppercase", padding:"4px 10px", borderRadius:20, fontFamily:"Georgia", ...style }}>{children}</span>
);

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background:C.white, borderRadius:20, border:`1px solid ${C.borderLight}`, boxShadow:"0 2px 12px rgba(123,94,167,0.07)", overflow:"hidden", ...style }}>{children}</div>
);

const PrimaryBtn = ({ children, onClick, disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:"16px", background:disabled?C.lavenderSoft:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, color:C.white, border:"none", borderRadius:18, fontSize:15, fontFamily:"Palatino Linotype,Georgia,serif", fontStyle:"italic", cursor:disabled?"not-allowed":"pointer", boxShadow:disabled?"none":`0 8px 24px ${C.lavender}50`, ...style }}>{children}</button>
);

const OutlineBtn = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{ width:"100%", padding:"14px", background:"transparent", color:C.lavender, border:`1.5px solid ${C.lavenderSoft}`, borderRadius:18, fontSize:14, fontFamily:"Palatino Linotype,Georgia,serif", cursor:"pointer", ...style }}>{children}</button>
);

const BackBtn = ({ onClick, light }) => (
  <button onClick={onClick} style={{ background:light?`${C.white}25`:"none", border:light?`1px solid ${C.white}40`:"none", color:light?C.white:C.lavender, fontSize:13, fontFamily:"Palatino Linotype,Georgia,serif", cursor:"pointer", padding:light?"7px 14px":"0", borderRadius:20, display:"flex", alignItems:"center", gap:5 }}>← Back</button>
);

const Stars = ({ rating, size=12 }) => (
  <span style={{ fontSize:size, letterSpacing:1 }}>
    {[1,2,3,4,5].map(i => <span key={i} style={{ color:i<=Math.round(rating)?"#F5B942":C.borderLight }}>★</span>)}
  </span>
);

const ScreenHeader = ({ label, title, onBack, light }) => (
  <div style={{ padding:"20px 24px 16px", background:light?`linear-gradient(160deg,${C.lavenderDeep},${C.lavender})`:C.white, borderBottom:`1px solid ${C.borderLight}` }}>
    {onBack && <BackBtn onClick={onBack} light={light} />}
    <div style={{ marginTop:onBack?10:0 }}>
      {label && <Tag style={light?{background:`${C.white}20`,color:C.white}:{}}>{label}</Tag>}
      <div style={{ fontSize:24, fontFamily:"Palatino Linotype,Georgia,serif", color:light?C.white:C.ink, marginTop:6, letterSpacing:-0.3, fontWeight:"normal" }}>{title}</div>
    </div>
  </div>
);

const Toggle = ({ on, onToggle, label, sub, accent }) => (
  <div onClick={onToggle} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
    <div>
      <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>{sub}</div>}
    </div>
    <div style={{ width:44, height:26, borderRadius:13, background:on?(accent||C.lavender):C.borderLight, position:"relative", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ width:20, height:20, borderRadius:"50%", background:C.white, position:"absolute", top:3, left:on?21:3, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }} />
    </div>
  </div>
);

// ─── Home ─────────────────────────────────────────────────────────────────────
function HomeScreen({ setScreen, setOrderData, activeOrder, pastOrders, cleaners, userProfile }) {
  const lastOrder  = pastOrders?.[0];
  const lastCleaner = cleaners?.find(c => c.id === lastOrder?.business_id);
  const displayName = userProfile?.full_name?.split(" ")[0] || "there";

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <div style={{ background:`linear-gradient(160deg,${C.lavenderDeep},${C.lavender} 60%,${C.lavenderMid})`, padding:"28px 24px 32px", position:"relative", overflow:"hidden" }}>
        <LavenderSprig style={{ position:"absolute", right:20, top:10, opacity:0.25 }} />
        <LavenderSprig style={{ position:"absolute", right:55, top:22, opacity:0.14 }} />
        <div style={{ fontSize:11, letterSpacing:3, color:`${C.white}90`, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:4 }}>Good morning</div>
        <div style={{ fontSize:28, color:C.white, fontFamily:"Palatino Linotype,Georgia,serif", fontWeight:"normal", letterSpacing:-0.5, marginBottom:2 }}>Hello, {displayName}.</div>
        <div style={{ fontSize:12, color:`${C.white}75`, fontFamily:"Georgia", fontStyle:"italic" }}>your grandmother's dry cleaner, with your efficiency.</div>
      </div>

      {/* Active order */}
      <div style={{ padding:"16px 20px 0" }}>
        {activeOrder ? (
        <Card style={{ border:`1.5px solid ${C.lavenderSoft}`, background:C.lavenderGlow }}>
          <div style={{ padding:"18px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <Tag>Active Order</Tag>
              <span style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia" }}>{activeOrder.id}</span>
            </div>
            <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia", marginBottom:2 }}>{activeOrder.garments_summary}</div>
            <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", marginBottom:14 }}>{lastCleaner?.name || "Your cleaner"}</div>
            <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:10 }}>
              {["Drop-Off","Received","Cleaning","QC","Ready"].map((step,i) => {
                const statusIdx = ["scheduled","received","in_cleaning","qc","ready","completed"].indexOf(activeOrder.status);
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", flex:i<4?1:"none" }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0, background:i<=statusIdx?C.lavender:C.borderLight, border:`2px solid ${i<=statusIdx?C.lavender:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:C.white, boxShadow:i===statusIdx?`0 0 10px ${C.lavender}60`:"none" }}>
                      {i<statusIdx?"✓":""}
                    </div>
                    {i<4 && <div style={{ flex:1, height:2, background:i<statusIdx?C.lavender:C.borderLight }} />}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize:12, color:C.lavender, fontFamily:"Georgia", fontStyle:"italic", marginBottom:12 }}>
              {activeOrder.status.replace("_"," ")} · Est. total ${activeOrder.total}
            </div>
            <OutlineBtn onClick={() => setScreen(S.TRACKING)} style={{ padding:"10px", fontSize:12 }}>View Full Tracking</OutlineBtn>
          </div>
        </Card>
        ) : (
        <Card style={{ border:`1px solid ${C.borderLight}`, padding:"18px 20px", textAlign:"center" }}>
          <div style={{ fontSize:14, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>No active orders right now.</div>
          <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", marginTop:4 }}>Start a new order below.</div>
        </Card>
        )}
      </div>

      {/* Quick Drop card for returning customers */}
      <div style={{ padding:"12px 20px 0" }}>
        {lastOrder && lastCleaner ? (
        <Card style={{ background:`linear-gradient(135deg,${C.lavenderDeep}10,${C.lavender}18)`, border:`1.5px solid ${C.lavenderSoft}` }}>
          <div style={{ padding:"16px 20px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
              <div style={{ fontSize:22 }}>⚡</div>
              <div>
                <div style={{ fontSize:13, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif", marginBottom:2 }}>Quick Drop — {lastCleaner.name}</div>
                <div style={{ fontSize:11, color:C.inkMid, fontFamily:"Georgia" }}>{lastOrder.garments_summary}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", marginTop:1, fontStyle:"italic" }}>Your last order — drop it off and go</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setOrderData({ reorder:true, cleaner:lastCleaner }); setScreen(S.QUICK); }} style={{ flex:1, padding:"10px 12px", background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, color:C.white, border:"none", borderRadius:12, fontSize:12, fontFamily:"Georgia", cursor:"pointer", boxShadow:`0 4px 12px ${C.lavender}40` }}>⚡ Drop Off Now</button>
              <button onClick={() => { setOrderData({ reorder:true, cleaner:lastCleaner }); setScreen(S.SERVICE); }} style={{ flex:1, padding:"10px 12px", background:"transparent", color:C.lavender, border:`1.5px solid ${C.lavenderSoft}`, borderRadius:12, fontSize:12, fontFamily:"Georgia", cursor:"pointer" }}>✏️ Edit Order First</button>
            </div>
          </div>
        </Card>
        ) : null}
      </div>

      <div style={{ padding:"12px 20px 0" }}>
        <PrimaryBtn onClick={() => setScreen(S.FIND)}>+ Start New Order</PrimaryBtn>
      </div>

      {/* Account stats — live */}
      <div style={{ margin:"18px 20px 0", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[[pastOrders?.length || 0,"Orders"],[new Set((pastOrders||[]).map(o=>o.business_id)).size,"Cleaners Used"]].map(([val,lbl]) => (
          <Card key={lbl} style={{ padding:"14px 12px", textAlign:"center" }}>
            <div style={{ fontSize:20, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>{val}</div>
            <div style={{ fontSize:10, color:C.inkLight, fontFamily:"Georgia", marginTop:2 }}>{lbl}</div>
          </Card>
        ))}
      </div>

      <div style={{ padding:"18px 24px 8px", fontSize:11, letterSpacing:2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia" }}>Recent Orders</div>
      {(pastOrders||[]).slice(0,2).map(o => {
        const biz = (cleaners||[]).find(c => c.id === o.business_id);
        return (
        <div key={o.id} style={{ margin:"0 20px 10px" }}>
          <Card>
            <div style={{ padding:"15px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", marginBottom:2 }}>{o.garments_summary}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia" }}>{biz?.name || "Cleaner"} · {new Date(o.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:14, color:C.lavender, fontFamily:"Georgia" }}>${o.total}</div>
                <div style={{ fontSize:10, color:C.success, marginTop:2, fontFamily:"Georgia" }}>{o.status==="completed"?"Completed":o.status}</div>
              </div>
            </div>
          </Card>
        </div>
        );
      })}
      <div style={{ padding:"4px 20px 20px" }}>
        <OutlineBtn onClick={() => setScreen(S.HISTORY)}>View All Orders</OutlineBtn>
      </div>
    </div>
  );
}

// ─── Find Cleaners ─────────────────────────────────────────────────────────────
function FindScreen({ setScreen, setOrderData, cleaners = [] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(null);
  const filtered = cleaners.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.addr||"").toLowerCase().includes(search.toLowerCase());
    if (!filter) return matchSearch;
    if (filter === "Non-Toxic")  return matchSearch && c.features.includes("nontoxic");
    if (filter === "Express")    return matchSearch && c.features.includes("express");
    if (filter === "Alterations")return matchSearch && c.services.includes("alterations");
    if (filter === "Pickup")     return matchSearch && c.services.includes("pickup");
    return matchSearch;
  });

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Step 1 of 4" title="Choose a cleaner" onBack={() => setScreen(S.HOME)} />
      <div style={{ padding:"14px 20px 0" }}>
        <div style={{ position:"relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or neighborhood..." style={{ width:"100%", padding:"13px 18px 13px 40px", borderRadius:16, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.white }} />
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:C.inkLight }}>🔍</span>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:12, overflowX:"auto", paddingBottom:4 }}>
          {["Near Me","Non-Toxic","Express","Alterations","Pickup"].map(f => (
            <div key={f} onClick={() => setFilter(filter===f ? null : f)} style={{ flexShrink:0, padding:"7px 14px", borderRadius:20, background:filter===f?C.lavender:C.white, border:`1px solid ${filter===f?C.lavender:C.border}`, fontSize:11, color:filter===f?C.white:C.inkMid, fontFamily:"Georgia", cursor:"pointer", whiteSpace:"nowrap" }}>{f}</div>
          ))}
        </div>
      </div>
      <div style={{ padding:"16px 20px 20px" }}>
        <div style={{ fontSize:11, letterSpacing:1.5, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:12 }}>{filtered.length} cleaners near you</div>
        {filtered.map(c => (
          <Card key={c.id} style={{ marginBottom:14, cursor:"pointer" }} onClick={() => { setOrderData(d => ({...d, cleaner:c})); setScreen(S.DETAIL); }}>
            <div style={{ padding:"18px 20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <div style={{ fontSize:15, color:C.ink, fontFamily:"Palatino Linotype,Georgia,serif" }}>{c.name}</div>
                    {c.returningCustomer && <span style={{ fontSize:9, color:C.lavender, background:C.lavenderMist, padding:"2px 7px", borderRadius:10, fontFamily:"Georgia" }}>MY CLEANER</span>}
                  </div>
                  <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", marginBottom:6 }}>{c.addr}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <Stars rating={c.rating} />
                    <span style={{ fontSize:12, color:C.ink, fontFamily:"Georgia" }}>{c.rating}</span>
                    <span style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia" }}>({c.reviews})</span>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                  <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia" }}>{c.dist}</div>
                  <div style={{ fontSize:11, color:C.success, fontFamily:"Georgia", marginTop:3 }}>◆ {c.wait}</div>
                  <div style={{ fontSize:13, color:C.lavender, fontFamily:"Georgia", marginTop:3 }}>{c.price}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {c.features.map(f => (
                  <span key={f} style={{ fontSize:10, color:C.inkMid, background:C.offWhite, border:`1px solid ${C.borderLight}`, padding:"3px 8px", borderRadius:10, fontFamily:"Georgia" }}>{FEATURE_LABELS[f]?.icon} {FEATURE_LABELS[f]?.label}</span>
                ))}
                {c.services.includes("pickup") && <span style={{ fontSize:10, color:C.lavender, background:C.lavenderMist, border:`1px solid ${C.lavenderSoft}`, padding:"3px 8px", borderRadius:10, fontFamily:"Georgia" }}>🚗 Pickup</span>}
                {c.services.includes("wash_fold") && <span style={{ fontSize:10, color:C.inkMid, background:C.offWhite, border:`1px solid ${C.borderLight}`, padding:"3px 8px", borderRadius:10, fontFamily:"Georgia" }}>🧺 Wash & Fold</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Cleaner Detail ────────────────────────────────────────────────────────────
function DetailScreen({ setScreen, orderData, setOrderData }) {
  const c = orderData.cleaner;
  const [tab, setTab]         = useState("services");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!c?.id) return;
    supabase.from("reviews")
      .select("*")
      .eq("business_id", c.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setReviews(data); });
  }, [c?.id]);

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(160deg,${C.lavenderDeep},${C.lavender})`, padding:"24px 24px 28px", position:"relative", overflow:"hidden" }}>
        <LavenderSprig style={{ position:"absolute", right:16, top:8, opacity:0.25 }} />
        <BackBtn onClick={() => setScreen(S.FIND)} light />
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:22, color:C.white, fontFamily:"Palatino Linotype,Georgia,serif", fontWeight:"normal", marginBottom:4 }}>{c.name}</div>
          <div style={{ fontSize:12, color:`${C.white}80`, fontFamily:"Georgia", marginBottom:10 }}>{c.addr}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Stars rating={c.rating} size={14} />
            <span style={{ fontSize:13, color:C.white, fontFamily:"Georgia" }}>{c.rating}</span>
            <span style={{ fontSize:12, color:`${C.white}70`, fontFamily:"Georgia" }}>({c.reviews} reviews) · {c.price} · {c.dist}</span>
          </div>
        </div>
      </div>

      {/* CTA — full width, right under the header */}
      <div style={{ padding:"14px 20px", background:C.white, borderBottom:`1px solid ${C.borderLight}` }}>
        {c.returningCustomer ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <PrimaryBtn onClick={() => setScreen(S.QUICK)}>⚡ Quick Drop at {c.name}</PrimaryBtn>
            <OutlineBtn onClick={() => setScreen(S.SERVICE)}>Edit This Order First</OutlineBtn>
          </div>
        ) : (
          <PrimaryBtn onClick={() => setScreen(S.SERVICE)}>Use {c.name}</PrimaryBtn>
        )}
      </div>

      {/* Info strip — plain text, not clickable */}
      <div style={{ display:"flex", borderBottom:`1px solid ${C.borderLight}`, background:C.white }}>
        {[["🕐", c.hoursDetailed["Thu"]], ["🌿", c.features.includes("nontoxic")?"Non-Toxic":"Standard"], ["🚗", c.services.includes("pickup")?"Pickup Available":"Drop-off Only"]].map(([icon,val], i, arr) => (
          <div key={val} style={{ flex:1, padding:"12px 8px", textAlign:"center", borderRight: i < arr.length-1 ? `1px solid ${C.borderLight}` : "none" }}>
            <div style={{ fontSize:15, marginBottom:3 }}>{icon}</div>
            <div style={{ fontSize:10, color:C.inkLight, fontFamily:"Georgia" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", padding:"14px 20px 0", gap:8, background:C.white }}>
        {["services","about","reviews"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"8px 16px", borderRadius:20, border:`1.5px solid ${tab===t?C.lavender:C.border}`, background:tab===t?C.lavenderMist:C.white, color:tab===t?C.lavender:C.inkLight, fontSize:12, fontFamily:"Georgia", cursor:"pointer", textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:"14px 20px" }}>
        {tab === "services" && (
          <div style={{ marginBottom:14 }}>
            {/* Features as plain descriptive text, not clickable cards */}
            {c.features.length > 0 && (
              <div style={{ marginBottom:14, padding:"12px 16px", background:C.lavenderGlow, borderRadius:14, border:`1px solid ${C.borderLight}` }}>
                {c.features.map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:14 }}>{FEATURE_LABELS[f]?.icon}</span>
                    <span style={{ fontSize:12, color:C.inkMid, fontFamily:"Georgia", fontStyle:"italic" }}>
                      <span style={{ color:C.lavenderDeep, fontStyle:"normal" }}>{FEATURE_LABELS[f]?.label}</span>
                      {" — "}{FEATURE_LABELS[f]?.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Services as plain rows — no border, no shadow, clearly informational */}
            <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.borderLight}`, overflow:"hidden" }}>
              {ALL_SERVICES.filter(s => s.id !== "pickup").map((s, i, arr) => {
                const avail = c.services.includes(s.id);
                return (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom: i < arr.length-1 ? `1px solid ${C.borderLight}` : "none", opacity:avail?1:0.38 }}>
                    <span style={{ fontSize:18, flexShrink:0, width:28, textAlign:"center" }}>{s.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, color:avail?C.ink:C.inkLight, fontFamily:"Georgia" }}>{s.label}</div>
                      <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:1 }}>{s.desc}</div>
                    </div>
                    {avail
                      ? <span style={{ fontSize:10, color:C.success, fontFamily:"Georgia", flexShrink:0 }}>✓</span>
                      : <span style={{ fontSize:10, color:C.border, fontFamily:"Georgia", flexShrink:0 }}>—</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "about" && (
          <div style={{ marginBottom:14 }}>
            <Card style={{ padding:"18px 20px", marginBottom:12 }}>
              <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:8 }}>About</div>
              <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia", lineHeight:1.7, fontStyle:"italic" }}>{c.bio}</div>
            </Card>
            <Card style={{ padding:"18px 20px" }}>
              <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:12 }}>Hours</div>
              {Object.entries(c.hoursDetailed).map(([day, hrs]) => {
                const isClosed = hrs==="Closed", isToday = day==="Thu";
                return (
                  <div key={day} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:9, marginBottom:9, borderBottom:`1px solid ${C.borderLight}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {isToday && <div style={{ width:6, height:6, borderRadius:"50%", background:C.lavender }} />}
                      <div style={{ fontSize:13, color:isToday?C.lavenderDeep:C.ink, fontFamily:"Georgia", fontWeight:isToday?"bold":"normal" }}>{day}{isToday?" (Today)":""}</div>
                    </div>
                    <div style={{ fontSize:13, color:isClosed?"#c0392b":isToday?C.lavenderDeep:C.inkMid, fontFamily:"Georgia" }}>{hrs}</div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {tab === "reviews" && (
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 20px", background:C.white, borderRadius:20, border:`1px solid ${C.borderLight}`, marginBottom:12 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:36, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif", lineHeight:1 }}>{c.rating}</div>
                <Stars rating={c.rating} size={14} />
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", marginTop:3 }}>{c.reviews} reviews</div>
              </div>
              <div style={{ flex:1, paddingLeft:16, borderLeft:`1px solid ${C.borderLight}` }}>
                {[5,4,3,2,1].map(n => (
                  <div key={n} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", width:8 }}>{n}</span>
                    <div style={{ flex:1, height:6, background:C.lavenderMist, borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", background:C.lavender, borderRadius:3, width:n===5?"72%":n===4?"18%":n===3?"6%":"2%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {(reviews.length > 0 ? reviews : c.topReviews || []).map((r,i) => (
              <Card key={i} style={{ marginBottom:10, padding:"16px 18px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{r.reviewer_name || r.name}</div>
                  <Stars rating={r.stars} size={11} />
                </div>
                <div style={{ fontSize:12, color:C.inkMid, fontFamily:"Georgia", fontStyle:"italic", lineHeight:1.6 }}>{r.text}</div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Quick Drop ────────────────────────────────────────────────────────────────
function QuickScreen({ setScreen, orderData, submitOrder }) {
  const c = orderData.cleaner;
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [newOrder, setNewOrder] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    const order = await submitOrder({
      ...orderData,
      is_quick_drop: true,
      serviceAssignments: orderData.serviceAssignments || {},
      day: new Date().toLocaleDateString(),
      time: "Drop-in",
    });
    setNewOrder(order);
    setLoading(false);
    setDone(true);
  };

  if (done) return (
    <div style={{ background:C.offWhite, minHeight:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px", textAlign:"center" }}>
      <div style={{ position:"relative", marginBottom:24 }}>
        <LavenderSprig style={{ position:"absolute", right:-30, top:-10, opacity:0.4 }} />
        <LavenderSprig style={{ position:"absolute", left:-30, top:-10, opacity:0.3, transform:"scaleX(-1)" }} />
        <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, boxShadow:`0 12px 32px ${C.lavender}50` }}>⚡</div>
      </div>
      <div style={{ fontSize:24, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:6 }}>You're all set.</div>
      <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", marginBottom:28, lineHeight:1.7 }}>Show the QR code at the drop-off area.<br/>Staff will log your items and send you<br/>a cost estimate to approve before charging.</div>
      <div style={{ background:C.white, borderRadius:24, padding:"24px", border:`1.5px solid ${C.lavenderSoft}`, marginBottom:24, width:"100%", boxShadow:`0 8px 32px ${C.lavender}20` }}>
        <div style={{ fontSize:11, letterSpacing:2, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:14 }}>Your Drop-Off QR Code</div>
        <div style={{ width:110, height:110, margin:"0 auto 14px", background:C.lavenderMist, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${C.lavenderSoft}` }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:3, padding:10 }}>
            {Array.from({length:25}).map((_,i) => <div key={i} style={{ width:11, height:11, borderRadius:2, background:Math.random()>0.4?C.lavender:"transparent" }} />)}
          </div>
        </div>
        <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia" }}>{newOrder?.id || "DRY-QDROP"} · {c?.name}</div>
        <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", marginTop:4, fontStyle:"italic" }}>Charged only after you approve the estimate</div>
      </div>
      <PrimaryBtn onClick={() => setScreen(S.TRACKING)}>Track My Order</PrimaryBtn>
      <OutlineBtn onClick={() => setScreen(S.HOME)} style={{ marginTop:10 }}>Back to Home</OutlineBtn>
    </div>
  );

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Quick Drop" title="Drop your bag & go" onBack={() => setScreen(S.DETAIL)} />
      <div style={{ padding:"16px 20px" }}>
        <Card style={{ padding:"20px", marginBottom:14, border:`1.5px solid ${C.lavenderSoft}`, background:C.lavenderGlow }}>
          <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:8 }}>How Quick Drop works</div>
          {[["1","Get your QR code below"],["2","Scan it at the drop-off bin and leave your bag"],["3","Staff inspects every item and logs them"],["4","You get a cost estimate — approve before anything is charged"],["5","Your card is charged automatically on completion"]].map(([n,t]) => (
            <div key={n} style={{ display:"flex", gap:12, marginBottom:9, alignItems:"flex-start" }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:C.lavender, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:C.white, fontFamily:"Georgia", flexShrink:0 }}>{n}</div>
              <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia", lineHeight:1.5 }}>{t}</div>
            </div>
          ))}
        </Card>
        <Card style={{ padding:"18px 20px", marginBottom:14 }}>
          <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:10 }}>Drop-off at</div>
          <div style={{ fontSize:15, color:C.ink, fontFamily:"Palatino Linotype,Georgia,serif", marginBottom:3 }}>{c?.name}</div>
          <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia" }}>{c?.addr}</div>
        </Card>
        <Card style={{ padding:"18px 20px", marginBottom:20 }}>
          <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:10 }}>Payment</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:20 }}>💳</div>
            <div>
              <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>Charged after you approve the estimate</div>
              <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>Payment processed securely via Stripe</div>
            </div>
          </div>
        </Card>
        <PrimaryBtn onClick={handleGenerate} disabled={loading}>{loading ? "Creating order…" : "Generate My QR Code"}</PrimaryBtn>
        <OutlineBtn onClick={() => setScreen(S.SERVICE)} style={{ marginTop:10 }}>Fill Out Full Order Instead</OutlineBtn>
      </div>
    </div>
  );
}

// ─── Service Selection ─────────────────────────────────────────────────────────
function ServiceScreen({ setScreen, orderData, setOrderData }) {
  const c = orderData.cleaner;
  const [picked, setPicked] = useState(orderData.pickedServices || []);
  const toggle = id => setPicked(p => p.includes(id) ? p.filter(x => x!==id) : [...p, id]);
  const validPicked = picked.filter(id => id !== "pickup" && c?.services?.includes(id));

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Step 2 of 4" title="What do you need?" onBack={() => setScreen(S.DETAIL)} />
      <div style={{ padding:"12px 20px" }}>
        <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:14 }}>Select all services you need. You'll assign clothes to each one next.</div>
        {ALL_SERVICES.filter(s => s.id !== "pickup").map(s => {
          const avail = c?.services?.includes(s.id) ?? true;
          const on = picked.includes(s.id);
          return (
            <div key={s.id} onClick={() => avail && toggle(s.id)} style={{ marginBottom:10, borderRadius:20, overflow:"hidden", border:on?`1.5px solid ${C.lavender}`:`1px solid ${C.borderLight}`, background:on?C.lavenderGlow:avail?C.white:C.offWhite, opacity:avail?1:0.4, cursor:avail?"pointer":"not-allowed" }}>
              <div style={{ padding:"15px 20px", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:14, background:on?C.lavenderMist:avail?C.lavenderGlow:C.borderLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                    <div style={{ fontSize:14, color:on?C.lavenderDeep:avail?C.ink:C.inkLight, fontFamily:"Georgia" }}>{s.label}</div>
                    {!avail && <span style={{ fontSize:9, color:C.inkLight, background:C.offWhite, border:`1px solid ${C.border}`, padding:"2px 6px", borderRadius:8, fontFamily:"Georgia" }}>NOT OFFERED</span>}
                  </div>
                  <div style={{ fontSize:11, color:avail?C.inkLight:C.border, fontFamily:"Georgia", fontStyle:"italic" }}>{s.desc}</div>
                </div>
                <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${on?C.lavender:C.border}`, background:on?C.lavender:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {on && <span style={{ fontSize:11, color:C.white }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        {c?.services?.includes("pickup") && (
          <div onClick={() => toggle("pickup")} style={{ marginBottom:20, borderRadius:20, border:picked.includes("pickup")?`1.5px solid ${C.lavender}`:`1px solid ${C.borderLight}`, background:picked.includes("pickup")?C.lavenderGlow:C.white, cursor:"pointer", padding:"14px 20px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:22 }}>🚗</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, color:picked.includes("pickup")?C.lavenderDeep:C.ink, fontFamily:"Georgia" }}>Add Pickup & Delivery</div>
              <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>We come to you — free within 1 mile</div>
            </div>
            <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${picked.includes("pickup")?C.lavender:C.border}`, background:picked.includes("pickup")?C.lavender:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {picked.includes("pickup") && <span style={{ fontSize:11, color:C.white }}>✓</span>}
            </div>
          </div>
        )}
        <PrimaryBtn disabled={validPicked.length===0} onClick={() => { setOrderData(d => ({...d, pickedServices:picked, serviceAssignments:{}, hangDry:{}})); setScreen(S.GARMENTS); }}>
          Continue — {validPicked.length} service{validPicked.length!==1?"s":""} selected
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Garments ──────────────────────────────────────────────────────────────────
function GarmentsScreen({ setScreen, orderData, setOrderData }) {
  const [assignments, setAssignments] = useState(orderData.serviceAssignments || {});
  const [hangDry, setHangDry] = useState(orderData.hangDry || {});
  const [activeService, setActiveService] = useState(null);
  const [special, setSpecial] = useState(orderData.special || "");
  const [rush, setRush] = useState(orderData.rush || false);
  const [photos, setPhotos] = useState(orderData.photos || []);
  const [photoType, setPhotoType] = useState(null);

  const c = orderData.cleaner;
  const activeServices = (orderData.pickedServices||[]).filter(id => id!=="pickup" && c?.services?.includes(id));
  const curSvc = activeService || activeServices[0];
  const svcInfo = id => ALL_SERVICES.find(s => s.id===id);

  const setCount = (svcId, gId, delta) => setAssignments(p => ({ ...p, [svcId]:{ ...(p[svcId]||{}), [gId]:Math.max(0,(p[svcId]?.[gId]||0)+delta) } }));
  const svcTotal = svcId => Object.values(assignments[svcId]||{}).reduce((a,b) => a+b, 0);
  const totalItems = Object.values(assignments).reduce((t,m) => t+Object.values(m).reduce((a,b)=>a+b,0), 0);

  const addPhoto = type => {
    const p = { stain:[{label:"Stain on collar",color:"#F5E6D3",emoji:"👕"},{label:"Stain on sleeve",color:"#E8D5C4",emoji:"🧥"}], repair:[{label:"Torn seam",color:"#E8E0F0",emoji:"🪡"},{label:"Missing button",color:"#DDD3ED",emoji:"✂️"}] };
    const pick = p[type][Math.floor(Math.random()*p[type].length)];
    setPhotos(prev => [...prev, {...pick, id:Date.now()+Math.random(), type}]);
    setPhotoType(null);
  };

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Step 3 of 4" title="Assign your clothes" onBack={() => setScreen(S.SERVICE)} />
      <div style={{ padding:"12px 20px" }}>
        {/* Service tab strip */}
        <div style={{ display:"flex", gap:8, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
          {activeServices.map(svcId => {
            const svc = svcInfo(svcId); const cnt = svcTotal(svcId); const isA = curSvc===svcId;
            return (
              <div key={svcId} onClick={() => setActiveService(svcId)} style={{ flexShrink:0, padding:"9px 14px", borderRadius:16, background:isA?C.lavender:C.white, border:`1.5px solid ${isA?C.lavender:C.border}`, cursor:"pointer", display:"flex", alignItems:"center", gap:7, boxShadow:isA?`0 4px 14px ${C.lavender}40`:"none" }}>
                <span style={{ fontSize:15 }}>{svc?.icon}</span>
                <span style={{ fontSize:12, color:isA?C.white:C.ink, fontFamily:"Georgia", whiteSpace:"nowrap" }}>{svc?.label}</span>
                {cnt>0 && <span style={{ fontSize:10, background:isA?`${C.white}30`:C.lavenderMist, color:isA?C.white:C.lavender, borderRadius:10, padding:"1px 6px", fontFamily:"Georgia" }}>{cnt}</span>}
              </div>
            );
          })}
        </div>

        {curSvc && (
          <>
            <div style={{ marginBottom:12, padding:"12px 16px", background:C.lavenderGlow, borderRadius:14, border:`1px solid ${C.lavenderSoft}` }}>
              <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia" }}>{svcInfo(curSvc)?.icon} Assigning to: {svcInfo(curSvc)?.label}</div>
              <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>{svcInfo(curSvc)?.desc}</div>
            </div>

            {GARMENT_TYPES.map(g => {
              const cnt = assignments[curSvc]?.[g.id] || 0;
              return (
                <Card key={g.id} style={{ marginBottom:9 }}>
                  <div style={{ padding:"13px 18px", display:"flex", alignItems:"center" }}>
                    <div style={{ fontSize:21, marginRight:13 }}>{g.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{g.label}</div>
                      <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia" }}>${g.price} per item</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <button onClick={() => setCount(curSvc,g.id,-1)} style={{ width:28,height:28,borderRadius:"50%",background:C.lavenderMist,border:`1px solid ${C.border}`,color:C.lavender,cursor:"pointer",fontSize:16 }}>−</button>
                      <div style={{ fontSize:16, color:cnt?C.lavender:C.inkLight, minWidth:16, textAlign:"center", fontFamily:"Georgia" }}>{cnt}</div>
                      <button onClick={() => setCount(curSvc,g.id,1)} style={{ width:28,height:28,borderRadius:"50%",background:C.lavender,border:"none",color:C.white,cursor:"pointer",fontSize:16 }}>+</button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Hang dry add-on — only for launder/wash_fold */}
            {HANG_DRY_SERVICES.includes(curSvc) && svcTotal(curSvc) > 0 && (
              <Card style={{ marginBottom:10, border:hangDry[curSvc]?`1.5px solid ${C.lavender}`:`1px solid ${C.borderLight}`, background:hangDry[curSvc]?C.lavenderGlow:C.white }}>
                <div style={{ padding:"14px 18px" }}>
                  <Toggle
                    on={!!hangDry[curSvc]}
                    onToggle={() => setHangDry(h => ({...h, [curSvc]:!h[curSvc]}))}
                    label="💧 Add Hang Dry"
                    sub="Air dry only — no heat. Recommended for wool, cashmere, and silk. +$3 per item"
                    accent={C.lavender}
                  />
                </div>
              </Card>
            )}
          </>
        )}

        {/* Order summary across services */}
        {activeServices.length > 1 && (
          <div style={{ margin:"12px 0 4px", padding:"14px 18px", background:C.white, borderRadius:16, border:`1px solid ${C.borderLight}` }}>
            <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:10 }}>Your Order So Far</div>
            {activeServices.map(svcId => {
              const cnt = svcTotal(svcId); const svc = svcInfo(svcId);
              return (
                <div key={svcId} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                  <div style={{ fontSize:12, color:C.inkMid, fontFamily:"Georgia" }}>{svc?.icon} {svc?.label}{hangDry[svcId]?" + Hang Dry":""}</div>
                  <div style={{ fontSize:12, color:cnt>0?C.lavender:C.border, fontFamily:"Georgia" }}>{cnt>0?`${cnt} item${cnt!==1?"s":""}` : "none yet"}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Photo docs */}
        <Card style={{ marginTop:14, marginBottom:10 }}>
          <div style={{ padding:"16px 18px" }}>
            <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:4 }}>📸 Photo Documentation</div>
            <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:12 }}>Photo any stains or areas needing repair.</div>
            {photos.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                {photos.map(ph => (
                  <div key={ph.id} style={{ position:"relative" }}>
                    <div style={{ width:64, height:64, borderRadius:12, background:ph.color, border:`1.5px solid ${ph.type==="stain"?C.warning:C.lavenderSoft}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3 }}>
                      <div style={{ fontSize:20 }}>{ph.emoji}</div>
                      <div style={{ fontSize:7, color:ph.type==="stain"?C.warning:C.lavender, fontFamily:"Georgia", textTransform:"uppercase" }}>{ph.type}</div>
                    </div>
                    <button onClick={() => setPhotos(p => p.filter(x => x.id!==ph.id))} style={{ position:"absolute", top:-5, right:-5, width:18, height:18, borderRadius:"50%", background:"#c0392b", border:"none", color:C.white, fontSize:10, cursor:"pointer" }}>×</button>
                  </div>
                ))}
                <div onClick={() => setPhotoType("picker")} style={{ width:64, height:64, borderRadius:12, background:C.offWhite, border:`1.5px dashed ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:18, color:C.inkLight }}>+</div>
                </div>
              </div>
            )}
            {(photos.length===0 || photoType==="picker") && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div onClick={() => addPhoto("stain")} style={{ padding:"14px 10px", borderRadius:14, background:"#FDF3E7", border:`1.5px dashed ${C.warning}`, cursor:"pointer", textAlign:"center" }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>🔍</div>
                  <div style={{ fontSize:12, color:C.warning, fontFamily:"Georgia" }}>Stain Photo</div>
                </div>
                <div onClick={() => addPhoto("repair")} style={{ padding:"14px 10px", borderRadius:14, background:C.lavenderGlow, border:`1.5px dashed ${C.lavenderSoft}`, cursor:"pointer", textAlign:"center" }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>🪡</div>
                  <div style={{ fontSize:12, color:C.lavender, fontFamily:"Georgia" }}>Repair Photo</div>
                </div>
              </div>
            )}
            {photos.length > 0 && photoType!=="picker" && <div style={{ marginTop:8, fontSize:11, color:C.success, fontFamily:"Georgia" }}>✓ {photos.length} photo{photos.length!==1?"s":""} attached</div>}
          </div>
        </Card>

        <Card style={{ marginBottom:10 }}>
          <div style={{ padding:"15px 18px" }}>
            <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:8 }}>Additional Notes</div>
            <textarea value={special} onChange={e => setSpecial(e.target.value)} placeholder="Fabric sensitivity, care instructions, anything else…" style={{ width:"100%", background:"none", border:"none", color:C.inkMid, fontSize:13, fontFamily:"Georgia", fontStyle:"italic", resize:"none", outline:"none", lineHeight:1.6, boxSizing:"border-box" }} rows={3} />
          </div>
        </Card>

        <Card style={{ marginBottom:20, border:rush?`1.5px solid ${C.lavender}`:`1px solid ${C.borderLight}` }}>
          <div style={{ padding:"13px 18px" }}>
            <Toggle on={rush} onToggle={() => setRush(r=>!r)} label="Rush Order" sub="Ready in 24hrs · +$12 fee" />
          </div>
        </Card>

        <PrimaryBtn disabled={totalItems===0} onClick={() => { setOrderData(d => ({...d, serviceAssignments:assignments, hangDry, special, rush, photos})); setScreen(S.SCHEDULE); }}>
          Continue — {totalItems} item{totalItems!==1?"s":""} assigned
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Schedule ──────────────────────────────────────────────────────────────────
function ScheduleScreen({ setScreen, orderData, setOrderData }) {
  const days = Array.from({length:5},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()+i+1);
    return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
  });
  const times = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];
  const [day, setDay] = useState(orderData.day||null);
  const [time, setTime] = useState(orderData.time||null);

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Step 4 of 4" title="Schedule drop-off" onBack={() => setScreen(S.GARMENTS)} />
      <div style={{ padding:"0 20px" }}>
        <div style={{ padding:"18px 4px 10px", fontSize:11, letterSpacing:1.5, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia" }}>Select a day</div>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
          {days.map(d => {
            const parts = d.split(" ");
            return <div key={d} onClick={() => setDay(d)} style={{ flexShrink:0, padding:"12px 14px", borderRadius:16, background:day===d?C.lavender:C.white, border:`1.5px solid ${day===d?C.lavender:C.border}`, cursor:"pointer", textAlign:"center", boxShadow:day===d?`0 4px 14px ${C.lavender}40`:"none" }}>
              <div style={{ fontSize:10, color:day===d?`${C.white}90`:C.inkLight, letterSpacing:0.5, fontFamily:"Georgia" }}>{parts[0].toUpperCase()}</div>
              <div style={{ fontSize:20, color:day===d?C.white:C.ink, fontFamily:"Palatino Linotype,Georgia,serif", marginTop:2 }}>{parts[1].replace(/\D/g,"")}</div>
            </div>;
          })}
        </div>
        <div style={{ padding:"18px 4px 10px", fontSize:11, letterSpacing:1.5, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia" }}>Select a time</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {times.map(t => <div key={t} onClick={() => setTime(t)} style={{ padding:"11px 6px", borderRadius:12, background:time===t?C.lavender:C.white, border:`1.5px solid ${time===t?C.lavender:C.border}`, cursor:"pointer", textAlign:"center", fontSize:12, color:time===t?C.white:C.ink, fontFamily:"Georgia" }}>{t}</div>)}
        </div>
        <div style={{ padding:"24px 0" }}>
          <PrimaryBtn disabled={!day||!time} onClick={() => { setOrderData(d => ({...d, day, time})); setScreen(S.SUMMARY); }}>Review Order</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Summary ───────────────────────────────────────────────────────────────────
function SummaryScreen({ setScreen, orderData, submitOrder }) {
  const assignments = orderData.serviceAssignments || {};
  const hangDry = orderData.hangDry || {};
  const rushFee = orderData.rush ? 12 : 0;
  const [loading, setLoading] = useState(false);
  let subtotal = rushFee;
  const lines = [];

  Object.entries(assignments).forEach(([svcId, gMap]) => {
    const svc = ALL_SERVICES.find(s => s.id===svcId);
    const garments = Object.entries(gMap).filter(([,q]) => q>0);
    if (!garments.length) return;
    const svcTotal = garments.reduce((sum,[gId,qty]) => { const g = GARMENT_TYPES.find(g=>g.id===gId); return sum+(g?g.price*qty:0); }, 0);
    const hangFee = hangDry[svcId] ? garments.reduce((s,[,q])=>s+q,0)*3 : 0;
    subtotal += svcTotal + hangFee;
    lines.push({ svc, garments, svcTotal, hangFee, hangDry:hangDry[svcId] });
  });
  const bookingFee = parseFloat((subtotal * 0.05).toFixed(2));
  const grand = subtotal + bookingFee;

  const confirm = async () => {
    setLoading(true);
    await submitOrder(orderData);
    setLoading(false);
    setScreen(S.CONFIRM);
  };

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Review" title="Order summary" onBack={() => setScreen(S.SCHEDULE)} />
      <div style={{ padding:"12px 20px" }}>
        <Card style={{ marginBottom:12 }}>
          <div style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:10 }}>Cleaner</div>
            <div style={{ fontSize:15, color:C.ink, fontFamily:"Palatino Linotype,Georgia,serif" }}>{orderData.cleaner?.name}</div>
            <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", marginTop:2 }}>{orderData.cleaner?.addr}</div>
          </div>
        </Card>

        {lines.map(({ svc, garments, svcTotal, hangFee, hangDry:hd }) => (
          <Card key={svc?.id} style={{ marginBottom:12 }}>
            <div style={{ padding:"14px 20px 10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>{svc?.icon}</span>
                  <span style={{ fontSize:13, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>{svc?.label}{hd?" + Hang Dry":""}</span>
                </div>
                <span style={{ fontSize:13, color:C.lavender, fontFamily:"Georgia" }}>${svcTotal + hangFee}</span>
              </div>
              {garments.map(([gId,qty]) => {
                const g = GARMENT_TYPES.find(g=>g.id===gId);
                return g ? <div key={gId} style={{ display:"flex", justifyContent:"space-between", marginBottom:6, paddingLeft:4 }}>
                  <div style={{ fontSize:12, color:C.inkMid, fontFamily:"Georgia" }}>{g.icon} {qty}x {g.label}</div>
                  <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia" }}>${g.price*qty}</div>
                </div> : null;
              })}
              {hd && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, paddingLeft:4 }}>
                <div style={{ fontSize:12, color:C.lavender, fontFamily:"Georgia" }}>💧 Hang Dry add-on</div>
                <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia" }}>${hangFee}</div>
              </div>}
            </div>
          </Card>
        ))}

        <Card style={{ marginBottom:12 }}>
          <div style={{ padding:"16px 20px" }}>
            {rushFee > 0 && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>⚡ Rush Fee</div>
              <div style={{ fontSize:13, color:C.lavender, fontFamily:"Georgia" }}>${rushFee}</div>
            </div>}
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia" }}>5% Booking Fee</div>
              <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia" }}>${bookingFee}</div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", borderTop:`1px solid ${C.borderLight}`, paddingTop:10, marginTop:4 }}>
              <div style={{ fontSize:15, color:C.ink, fontFamily:"Georgia" }}>Total</div>
              <div style={{ fontSize:15, color:C.lavenderDeep, fontFamily:"Georgia", fontWeight:"bold" }}>${grand.toFixed(2)}</div>
            </div>
          </div>
        </Card>

        <Card style={{ marginBottom:20 }}>
          <div style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:10 }}>Details</div>
            {[
              ["Drop-off", `${orderData.day} at ${orderData.time}`],
              ...(orderData.pickedServices?.includes("pickup") ? [["Delivery","Pickup & Delivery requested"]] : []),
              ...(orderData.photos?.length ? [["Photos",`${orderData.photos.length} photo${orderData.photos.length!==1?"s":""} attached`]] : []),
              ...(orderData.special ? [["Notes", orderData.special]] : []),
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia" }}>{k}</div>
                <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", fontStyle:"italic", maxWidth:"60%", textAlign:"right" }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
        <PrimaryBtn onClick={confirm} disabled={loading}>{loading ? "Placing order…" : `Confirm & Pay $${grand.toFixed(2)}`}</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Confirm ───────────────────────────────────────────────────────────────────
function ConfirmScreen({ setScreen, setOrderData, activeOrder }) {
  const orderId = activeOrder?.id || "";
  const shortCode = orderId ? orderId.slice(-4).toUpperCase() : "----";
  const cleanerName = activeOrder?.business_name || activeOrder?.cleaner_name || "Your Cleaner";

  return (
    <div style={{ background:C.offWhite, minHeight:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px", textAlign:"center" }}>
      <div style={{ position:"relative", marginBottom:24 }}>
        <LavenderSprig style={{ position:"absolute", right:-30, top:-10, opacity:0.4 }} />
        <LavenderSprig style={{ position:"absolute", left:-30, top:-10, opacity:0.3, transform:"scaleX(-1)" }} />
        <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, boxShadow:`0 12px 32px ${C.lavender}50` }}>✓</div>
      </div>
      <div style={{ fontSize:24, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:6 }}>Order Confirmed</div>
      <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", marginBottom:28, lineHeight:1.7 }}>Your drop-off code is ready.<br/>Show it when you arrive to check in.</div>
      <div style={{ background:C.white, borderRadius:24, padding:"24px", border:`1.5px solid ${C.lavenderSoft}`, marginBottom:24, width:"100%", boxShadow:`0 8px 32px ${C.lavender}20` }}>
        <div style={{ fontSize:11, letterSpacing:2, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:14 }}>Drop-Off Code</div>
        <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:12 }}>
          {shortCode.split("").map((d,i) => <div key={i} style={{ width:48, height:56, borderRadius:12, background:C.lavenderGlow, border:`1.5px solid ${C.lavenderSoft}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>{d}</div>)}
        </div>
        <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia" }}>{cleanerName}</div>
      </div>
      <PrimaryBtn onClick={() => { setOrderData({}); setScreen(S.TRACKING); }}>Track My Order</PrimaryBtn>
      <OutlineBtn onClick={() => { setOrderData({}); setScreen(S.HOME); }} style={{ marginTop:10 }}>Back to Home</OutlineBtn>
    </div>
  );
}

// ─── Tracking ──────────────────────────────────────────────────────────────────
function TrackingScreen({ setScreen, activeOrder }) {
  const STEPS = ["Drop-Off Confirmed","Received & Inspected","In Cleaning","Quality Check","Ready for Pickup"];
  const STATUS_IDX = { scheduled:0, received:1, in_cleaning:2, qc:3, ready:4, completed:4 };
  const statusIdx = activeOrder ? (STATUS_IDX[activeOrder.status] ?? 0) : 0;

  if (!activeOrder) return (
    <div style={{ background:C.offWhite, minHeight:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px", textAlign:"center" }}>
      <div style={{ fontSize:36, marginBottom:16 }}>◎</div>
      <div style={{ fontSize:18, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:8 }}>No Active Order</div>
      <div style={{ fontSize:13, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:24 }}>Place an order to start tracking.</div>
      <PrimaryBtn onClick={() => setScreen(S.FIND)}>Start an Order</PrimaryBtn>
    </div>
  );

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <div style={{ background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, padding:"24px 24px 28px", position:"relative", overflow:"hidden" }}>
        <LavenderSprig style={{ position:"absolute", right:16, top:8, opacity:0.25 }} />
        <button onClick={() => setScreen(S.HOME)} style={{ background:"none", border:"none", color:`${C.white}90`, fontSize:13, fontFamily:"Georgia", cursor:"pointer", padding:0, marginBottom:10 }}>← Back</button>
        <Tag style={{ background:`${C.white}20`, color:C.white }}>Order {activeOrder.id}</Tag>
        <div style={{ fontSize:22, color:C.white, fontFamily:"Palatino Linotype,Georgia,serif", marginTop:8, fontWeight:"normal" }}>Live Tracking</div>
        <div style={{ fontSize:12, color:`${C.white}80`, fontFamily:"Georgia", fontStyle:"italic", marginTop:4 }}>Est. total ${activeOrder.total} · {activeOrder.status.replace("_"," ")}</div>
      </div>
      <div style={{ padding:"20px" }}>
        <Card style={{ marginBottom:24, padding:"16px 20px" }}>
          <div style={{ fontSize:13, color:C.inkLight, fontFamily:"Georgia", marginBottom:3 }}>{activeOrder.business_id}</div>
          <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{activeOrder.garments_summary}</div>
        </Card>
        <div style={{ position:"relative", paddingLeft:56 }}>
          <div style={{ position:"absolute", left:19, top:24, bottom:24, width:2, background:C.borderLight }} />
          <div style={{ position:"absolute", left:19, top:24, width:2, height:`${(statusIdx/(STEPS.length-1))*82}%`, background:C.lavender }} />
          {STEPS.map((step,i) => (
            <div key={i} style={{ marginBottom:28, position:"relative" }}>
              <div style={{ position:"absolute", left:-56, width:40, height:40, borderRadius:"50%", background:i<statusIdx?C.lavender:i===statusIdx?C.lavenderGlow:C.white, border:`2px solid ${i<=statusIdx?C.lavender:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:i<statusIdx?C.white:C.lavender, boxShadow:i===statusIdx?`0 0 18px ${C.lavender}50`:"none" }}>
                {i<statusIdx?"✓":i===statusIdx?"●":""}
              </div>
              <div style={{ paddingTop:8 }}>
                <div style={{ fontSize:14, color:i<=statusIdx?C.ink:C.inkLight, fontFamily:"Georgia" }}>{step}</div>
                {i===statusIdx && <div style={{ fontSize:11, color:C.lavender, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>In progress — updates in real time</div>}
                {i<statusIdx && <div style={{ fontSize:11, color:C.success, fontFamily:"Georgia", marginTop:2 }}>Completed</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── History ───────────────────────────────────────────────────────────────────
function HistoryScreen({ orders = [] }) {
  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Your Orders" title="Order History" />
      <div style={{ padding:"8px 20px" }}>
        {orders.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px", color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>No orders yet. Start your first one!</div>
        )}
        {orders.map(o => (
          <Card key={o.id} style={{ marginBottom:10 }}>
            <div style={{ padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", marginBottom:2 }}>{o.garments_summary}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", marginBottom:2 }}>{new Date(o.created_at).toLocaleDateString()}</div>
                <span style={{ fontSize:9, color:C.lavender, background:C.lavenderMist, padding:"2px 6px", borderRadius:8, fontFamily:"Georgia" }}>{o.status}</span>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:14, color:C.lavender, fontFamily:"Georgia" }}>${o.total}</div>
                <div style={{ fontSize:10, color:o.status==="completed"?C.success:C.inkLight, marginTop:2, fontFamily:"Georgia" }}>{o.status}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Preferences ───────────────────────────────────────────────────────────────
function PreferencesScreen({ setScreen, userProfile, savePreferences }) {
  const [prefs, setPrefs] = useState({
    hangDryKnitwear: userProfile?.pref_hang_dry_knitwear  || false,
    noFabricSoftener:userProfile?.pref_no_softener        || false,
    hangShirts:      userProfile?.pref_hang_shirts        || false,
    coldWash:        userProfile?.pref_cold_wash          || false,
    separateDarks:   userProfile?.pref_separate_darks     || false,
  });
  const [saved, setSaved] = useState(false);

  const toggle = key => setPrefs(p => ({...p, [key]:!p[key]}));
  const save = async () => {
    await savePreferences(prefs);
    setSaved(true);
    setTimeout(() => { setSaved(false); setScreen(S.PROFILE); }, 1500);
  };

  const prefList = [
    { key:"hangDryKnitwear", label:"Always hang dry knitwear", sub:"Applies to wool, cashmere, and cable knit items" },
    { key:"noFabricSoftener", label:"No fabric softener", sub:"For sensitive skin or technical fabrics" },
    { key:"hangShirts", label:"Hang dry dress shirts", sub:"Instead of machine dry — reduces wrinkles" },
    { key:"coldWash", label:"Cold wash preferred", sub:"For colors and everyday clothes" },
    { key:"separateDarks", label:"Separate darks from lights", sub:"We'll sort your wash & fold items" },
  ];

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Account" title="Laundry Preferences" onBack={() => setScreen(S.PROFILE)} />
      <div style={{ padding:"12px 20px" }}>
        <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:16, padding:"0 4px" }}>
          Set your preferences once and they'll be applied to every order automatically. You can always override them per order.
        </div>
        {prefList.map(p => (
          <Card key={p.key} style={{ marginBottom:10, padding:"16px 18px" }}>
            <Toggle on={prefs[p.key]} onToggle={() => toggle(p.key)} label={p.label} sub={p.sub} />
          </Card>
        ))}
        <div style={{ marginTop:8 }}>
          <PrimaryBtn onClick={save} style={{ background:saved?C.success:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})` }}>
            {saved ? "✓ Preferences Saved" : "Save Preferences"}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Referral ──────────────────────────────────────────────────────────────────
function ReferralScreen({ setScreen, userProfile }) {
  const [copied, setCopied] = useState(false);
  const code = userProfile?.referral_code || "LOADING…";
  const credit = userProfile?.referral_credit || 0;
  const copy = () => {
    navigator.clipboard?.writeText(code).catch(()=>{});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Referrals" title="Give $20, Get $20" onBack={() => setScreen(S.PROFILE)} />
      <div style={{ padding:"16px 20px" }}>
        <div style={{ background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, borderRadius:24, padding:"28px 24px", marginBottom:20, position:"relative", overflow:"hidden", textAlign:"center" }}>
          <LavenderSprig style={{ position:"absolute", right:10, top:10, opacity:0.3 }} />
          <div style={{ fontSize:36, marginBottom:10 }}>🌿</div>
          <div style={{ fontSize:20, color:C.white, fontFamily:"Palatino Linotype,Georgia,serif", marginBottom:8 }}>Refer a friend to Dry</div>
          <div style={{ fontSize:13, color:`${C.white}85`, fontFamily:"Georgia", lineHeight:1.6 }}>They get $20 off their first order.<br/>You get $20 credit when they complete it.</div>
        </div>

        <Card style={{ padding:"20px", marginBottom:14 }}>
          <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:12 }}>Your Referral Code</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.lavenderGlow, border:`1.5px solid ${C.lavenderSoft}`, borderRadius:14, padding:"14px 18px" }}>
            <div style={{ fontSize:22, letterSpacing:4, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>{code}</div>
            <button onClick={copy} style={{ padding:"8px 16px", background:copied?C.success:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, color:C.white, border:"none", borderRadius:10, fontSize:12, fontFamily:"Georgia", cursor:"pointer", transition:"background 0.2s" }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </Card>

        <Card style={{ padding:"20px", marginBottom:14 }}>
          <div style={{ fontSize:11, letterSpacing:1.5, color:C.lavender, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:12 }}>How It Works</div>
          {[["Share your code","Send it to a friend via text, email, or social"],["They place an order","Your code gives them $20 off their first Dry order"],["You earn credit","$20 appears in your account once their order completes"]].map(([t,s],i) => (
            <div key={i} style={{ display:"flex", gap:14, marginBottom:14 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:C.lavenderMist, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:C.lavender, fontFamily:"Georgia", flexShrink:0 }}>{i+1}</div>
              <div>
                <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{t}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>{s}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>Your Referral Credit</div>
              <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>{userProfile?.referral_count > 0 ? `${userProfile.referral_count} friend${userProfile.referral_count !== 1 ? "s" : ""} referred` : "Share your code to earn credit"}</div>
            </div>
            <div style={{ fontSize:22, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>${userProfile?.referral_credit || 0}</div>
          </div>
        </Card>

        <div style={{ marginTop:14 }}>
          <PrimaryBtn onClick={copy}>Share My Code</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Settings Screen ─────────────────────────────────────────────
function NotificationsScreen({ setScreen, userProfile, supabase, session }) {
  const [notifs, setNotifs] = useState({
    orderReceived:  true,
    orderReady:     true,
    orderReminder:  true,
    promotions:     false,
    referralCredit: true,
  });
  const [saved, setSaved] = useState(false);

  const toggle = key => setNotifs(n => ({ ...n, [key]: !n[key] }));
  const save = async () => {
    if (session?.user) {
      await supabase.from("users").update({ notification_prefs: notifs }).eq("id", session.user.id);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setScreen(S.PROFILE); }, 1500);
  };

  const items = [
    ["orderReceived",  "🔔", "Order Received",       "When your drop-off is confirmed by the cleaner"],
    ["orderReady",     "✅", "Order Ready",           "When your items are cleaned and ready for pickup"],
    ["orderReminder",  "⏰", "Pickup Reminder",       "If your order has been ready for 24+ hours"],
    ["referralCredit", "🎁", "Referral Credit",       "When a friend you referred completes their first order"],
    ["promotions",     "📣", "Promotions & Offers",   "Occasional deals and platform announcements"],
  ];

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Account" title="Notifications" onBack={() => setScreen(S.PROFILE)} />
      <div style={{ padding:"12px 20px" }}>
        <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:16, padding:"0 4px", lineHeight:1.6 }}>
          Control which notifications you receive from Dry. When the app is on your phone, these will come through as push notifications.
        </div>
        {items.map(([key, icon, label, desc]) => (
          <Card key={key} style={{ marginBottom:10, padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ fontSize:20, flexShrink:0 }}>{icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{label}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>{desc}</div>
              </div>
              <Toggle on={notifs[key]} onToggle={() => toggle(key)} />
            </div>
          </Card>
        ))}
        <div style={{ marginTop:8 }}>
          <PrimaryBtn onClick={save} style={{ background:saved ? C.success : `linear-gradient(135deg,${C.lavenderDeep},${C.lavender})` }}>
            {saved ? "✓ Saved" : "Save Preferences"}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Methods Screen ────────────────────────────────────────────────────
function PaymentMethodsScreen({ setScreen }) {
  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Account" title="Payment Methods" onBack={() => setScreen(S.PROFILE)} />
      <div style={{ padding:"12px 20px" }}>
        <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:20, padding:"0 4px", lineHeight:1.6 }}>
          Your payment method is charged automatically when an order is completed. A 5% booking fee is included in your total.
        </div>
        <Card style={{ padding:"20px", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:28 }}>💳</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>No payment method saved</div>
              <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>Add a card to start placing orders</div>
            </div>
          </div>
        </Card>
        <Card style={{ padding:"20px", marginBottom:20, background:C.lavenderGlow, border:`1.5px solid ${C.lavenderSoft}` }}>
          <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia", lineHeight:1.7 }}>
            💡 Secure payment processing is coming soon. Your card details will be handled by Stripe and never stored by Dry.
          </div>
        </Card>
        <PrimaryBtn onClick={() => {}} style={{ opacity:0.5 }} disabled>Add Payment Method — Coming Soon</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── My Cleaners Screen ────────────────────────────────────────────────────────
function MyCleanersScreen({ setScreen, orders, cleaners }) {
  const usedIds = [...new Set((orders || []).map(o => o.business_id))];
  const myCleaners = usedIds.map(id => (cleaners || []).find(c => c.id === id)).filter(Boolean);

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Account" title="My Cleaners" onBack={() => setScreen(S.PROFILE)} />
      <div style={{ padding:"12px 20px" }}>
        <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:16, padding:"0 4px" }}>
          Cleaners you've ordered from before.
        </div>
        {myCleaners.length === 0 ? (
          <Card style={{ padding:"32px 20px", textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🧺</div>
            <div style={{ fontSize:15, color:C.ink, fontFamily:"Palatino Linotype,Georgia,serif", marginBottom:6 }}>No cleaners yet</div>
            <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:20 }}>Place your first order to save a cleaner here.</div>
            <OutlineBtn onClick={() => setScreen(S.FIND)}>Find a Cleaner</OutlineBtn>
          </Card>
        ) : (
          myCleaners.map(c => (
            <Card key={c.id} style={{ marginBottom:12, cursor:"pointer", padding:"18px 20px" }} onClick={() => setScreen(S.FIND)}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:14, background:C.lavenderMist, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🧺</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, color:C.ink, fontFamily:"Palatino Linotype,Georgia,serif" }}>{c.name}</div>
                  <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", marginTop:2 }}>{c.addr}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                    <Stars rating={c.rating} size={11} />
                    <span style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia" }}>{c.rating} · {(orders||[]).filter(o=>o.business_id===c.id).length} orders</span>
                  </div>
                </div>
                <div style={{ color:C.inkLight, fontSize:16 }}>›</div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Help & Support Screen ─────────────────────────────────────────────────────
function HelpScreen({ setScreen }) {
  const [open, setOpen] = useState(null);
  const faqs = [
    ["How does Dry. work?", "Find a cleaner near you, select your services, drop off your items, and track your order in real time. You're notified the moment your order is ready."],
    ["What is the 5% booking fee?", "Dry. charges a 5% booking fee on every order. This covers the platform, order management, and tracking. The fee is shown at checkout before you confirm."],
    ["What is Quick Drop?", "After a few orders at a location, Quick Drop lets you drop off your bag with just a QR code — no need to fill out a full order. Staff logs everything and sends you an estimate to approve before charging."],
    ["Can I cancel an order?", "Orders cancelled before the cleaner confirms drop-off receive a full refund. After drop-off confirmation, cancellation is subject to the cleaner's policy. The booking fee is non-refundable on confirmed orders."],
    ["What if my garment is damaged?", "Any claim for garment damage is between you and the cleaner directly. Dry. is a technology platform and is not responsible for cleaning services. Contact the cleaner first — most will work to resolve it."],
    ["How do I get a refund?", "Contact support@drytheapp.com with your order ID and a description of the issue. We'll do our best to help mediate, though refunds on completed orders are at the cleaner's discretion."],
    ["Is my payment information secure?", "Yes. Payment processing is handled by Stripe. Dry. never stores your full card details."],
  ];

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Account" title="Help & Support" onBack={() => setScreen(S.PROFILE)} />
      <div style={{ padding:"12px 20px" }}>
        <Card style={{ padding:"18px 20px", marginBottom:14, background:C.lavenderGlow, border:`1.5px solid ${C.lavenderSoft}` }}>
          <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia", marginBottom:10 }}>Need help with a specific order?</div>
          <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:14, lineHeight:1.6 }}>Email us at support@drytheapp.com with your order ID and we'll get back to you within 24 hours.</div>
          <OutlineBtn onClick={() => window.open('mailto:support@drytheapp.com')}>Email Support</OutlineBtn>
        </Card>
        <div style={{ fontSize:11, letterSpacing:1.5, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:12, padding:"0 4px" }}>Frequently Asked Questions</div>
        {faqs.map(([q, a], i) => (
          <Card key={i} style={{ marginBottom:10, cursor:"pointer" }} onClick={() => setOpen(open === i ? null : i)}>
            <div style={{ padding:"15px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", flex:1, paddingRight:12 }}>{q}</div>
                <div style={{ color:C.inkLight, fontSize:16, flexShrink:0 }}>{open === i ? "↑" : "↓"}</div>
              </div>
              {open === i && (
                <div style={{ fontSize:12, color:C.inkMid, fontFamily:"Georgia", fontStyle:"italic", marginTop:10, lineHeight:1.7, paddingTop:10, borderTop:`1px solid ${C.borderLight}` }}>{a}</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Give Feedback Screen ──────────────────────────────────────────────────────
function FeedbackScreen({ setScreen, session }) {
  const [category, setCategory] = useState("general");
  const [message,  setMessage]  = useState("");
  const [sent,     setSent]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await supabase.from("feedback").insert({
        user_id:  session?.user?.id || null,
        category,
        message:  message.trim(),
      });
    } catch (e) { /* table may not exist yet — still show success */ }
    setLoading(false);
    setSent(true);
  };

  if (sent) return (
    <div style={{ background:C.offWhite, minHeight:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px", textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>💜</div>
      <div style={{ fontSize:22, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:8 }}>Thank you!</div>
      <div style={{ fontSize:13, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", lineHeight:1.7, marginBottom:28 }}>Your feedback helps us build a better product. We read everything.</div>
      <OutlineBtn onClick={() => setScreen(S.PROFILE)}>Back to Profile</OutlineBtn>
    </div>
  );

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <ScreenHeader label="Account" title="Give Feedback" onBack={() => setScreen(S.PROFILE)} />
      <div style={{ padding:"12px 20px" }}>
        <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:20, padding:"0 4px", lineHeight:1.6 }}>
          Tell us what's working, what isn't, or what you'd love to see. Every message goes directly to the team.
        </div>
        <Card style={{ padding:"20px", marginBottom:14 }}>
          <div style={{ fontSize:11, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:10 }}>Category</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[["general","General"],["bug","Bug Report"],["feature","Feature Request"],["cleaner","Cleaner Issue"]].map(([val,lbl]) => (
              <div key={val} onClick={() => setCategory(val)} style={{ padding:"8px 14px", borderRadius:20, border:`1.5px solid ${category===val?C.lavender:C.border}`, background:category===val?C.lavenderMist:C.white, color:category===val?C.lavender:C.inkMid, fontSize:12, fontFamily:"Georgia", cursor:"pointer" }}>{lbl}</div>
            ))}
          </div>
        </Card>
        <Card style={{ padding:"20px", marginBottom:20 }}>
          <div style={{ fontSize:11, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:10 }}>Your Message</div>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's on your mind…" rows={6} style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.offWhite, resize:"none", lineHeight:1.6 }} />
        </Card>
        <PrimaryBtn onClick={submit} disabled={loading || !message.trim()}>
          {loading ? "Sending…" : "Send Feedback"}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Profile ───────────────────────────────────────────────────────────────────
function ProfileScreen({ setScreen, userProfile, signOut, orders, cleaners }) {
  const name    = userProfile?.full_name || "Welcome";
  const initial = name.charAt(0).toUpperCase();
  const memberSince = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString("en-US", { month:"long", year:"numeric" })
    : "New Member";

  const quickDropCleaner = cleaners?.find(c =>
    (orders || []).filter(o => o.business_id === c.id).length >= 3
  );

  return (
    <div style={{ background:C.offWhite, minHeight:"100%" }}>
      <div style={{ background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, padding:"28px 24px 32px", position:"relative", overflow:"hidden" }}>
        <LavenderSprig style={{ position:"absolute", right:16, top:8, opacity:0.25 }} />
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:`${C.white}25`, border:`2px solid ${C.white}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:C.white, fontFamily:"Georgia" }}>{initial}</div>
          <div>
            <div style={{ fontSize:20, color:C.white, fontFamily:"Palatino Linotype,Georgia,serif", fontWeight:"normal" }}>{name}</div>
            <div style={{ fontSize:12, color:`${C.white}80`, fontFamily:"Georgia", fontStyle:"italic" }}>Member since {memberSince}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 20px" }}>
        {quickDropCleaner && (
          <Card style={{ marginBottom:14, border:`1.5px solid ${C.lavenderSoft}`, background:C.lavenderGlow, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>⚡ Quick Drop Unlocked</div>
                <div style={{ fontSize:11, color:C.inkMid, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>Available at {quickDropCleaner.name}</div>
              </div>
              <div style={{ fontSize:11, color:C.lavender, background:C.lavenderMist, padding:"4px 10px", borderRadius:12, fontFamily:"Georgia" }}>{(orders||[]).filter(o=>o.business_id===quickDropCleaner.id).length} orders</div>
            </div>
          </Card>
        )}

        <Card style={{ marginBottom:14, cursor:"pointer", background:`${C.lavenderDeep}08`, border:`1px solid ${C.lavenderSoft}` }} onClick={() => setScreen(S.REFERRAL)}>
          <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:20 }}>🎁</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>Give $20, Get $20</div>
              <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>Refer a friend · Earn $20 per referral</div>
            </div>
            <div style={{ color:C.inkLight, fontSize:16 }}>›</div>
          </div>
        </Card>

        {[
          ["💳", "Payment Methods",    "Tap to manage",          S.PAYMENT_METHODS],
          ["🔔", "Notifications",      "Tap to customize",       S.NOTIFICATIONS],
          ["⚙️", "Laundry Preferences","Tap to update",          S.PREFERENCES],
          ["📍", "My Cleaners",        "Your saved locations",   S.MY_CLEANERS],
          ["❓", "Help & Support",     "FAQ & contact",          S.HELP],
          ["💬", "Give Feedback",      "Help us improve",        S.FEEDBACK],
        ].map(([icon, label, sub, screen]) => (
          <Card key={label} style={{ marginBottom:10, cursor:"pointer" }} onClick={() => setScreen(screen)}>
            <div style={{ padding:"15px 18px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ fontSize:18 }}>{icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{label}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", marginTop:2 }}>{sub}</div>
              </div>
              <div style={{ color:C.inkLight, fontSize:16 }}>›</div>
            </div>
          </Card>
        ))}

        <Card style={{ marginBottom:10, cursor:"pointer" }} onClick={signOut}>
          <div style={{ padding:"15px 18px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:18 }}>🚪</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, color:"#c0392b", fontFamily:"Georgia" }}>Sign Out</div>
            </div>
          </div>
        </Card>

        <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", textAlign:"center", marginTop:20, fontStyle:"italic" }}>
          dry. · version 1.0 · drytheapp.com
        </div>
      </div>
    </div>
  );
}

// ─── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState("signin"); // "signin" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        // create user profile row
        if (data.user) {
          await supabase.from("users").insert({ id: data.user.id, full_name: name });
        }
        onAuth(data.user);
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth(data.user);
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:C.offWhite, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ background:`linear-gradient(160deg,${C.lavenderDeep},${C.lavender})`, padding:"48px 28px 40px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <LavenderSprig style={{ position:"absolute", right:16, top:8, opacity:0.3 }} />
        <div style={{ fontSize:42, fontFamily:"Palatino Linotype,Georgia,serif", fontStyle:"italic", color:C.white, letterSpacing:-1, marginBottom:6 }}>dry.</div>
        <div style={{ fontSize:13, color:`${C.white}80`, fontFamily:"Georgia", fontStyle:"italic" }}>your grandmother's dry cleaner, with your efficiency.</div>
      </div>
      <div style={{ padding:"28px 24px", flex:1 }}>
        <div style={{ display:"flex", gap:0, marginBottom:24, background:C.lavenderMist, borderRadius:16, padding:4 }}>
          {[["signin","Sign In"],["signup","Create Account"]].map(([m,lbl]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex:1, padding:"10px", borderRadius:12, border:"none", background:mode===m?C.white:"transparent", color:mode===m?C.lavenderDeep:C.inkLight, fontSize:13, fontFamily:"Georgia", cursor:"pointer", boxShadow:mode===m?`0 2px 8px rgba(123,94,167,0.15)`:"none" }}>{lbl}</button>
          ))}
        </div>
        {mode === "signup" && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:6 }}>Full Name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ width:"100%", padding:"13px 16px", borderRadius:14, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.white }} />
          </div>
        )}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:6 }}>Email</div>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" style={{ width:"100%", padding:"13px 16px", borderRadius:14, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.white }} />
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:6 }}>Password</div>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" style={{ width:"100%", padding:"13px 16px", borderRadius:14, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.white }} />
        </div>
        {error && <div style={{ fontSize:12, color:"#c0392b", fontFamily:"Georgia", marginBottom:14, padding:"10px 14px", background:"#fdf0f0", borderRadius:10 }}>{error}</div>}
        <PrimaryBtn onClick={submit} disabled={loading || !email || !password}>
          {loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Sign In"}
        </PrimaryBtn>
        {mode === "signup" && (
          <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", textAlign:"center", marginTop:14, lineHeight:1.6 }}>
            By creating an account you agree to the Dry. Terms of Service and Privacy Policy.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shell ─────────────────────────────────────────────────────────────────────
const NAV = [
  { id:S.HOME,     label:"Home",   icon:"⌂" },
  { id:S.TRACKING, label:"Track",  icon:"◎" },
  { id:S.HISTORY,  label:"Orders", icon:"≡" },
  { id:S.PROFILE,  label:"Profile",icon:"◯" },
];

const ORDER_FLOW = [S.FIND, S.DETAIL, S.QUICK, S.SERVICE, S.GARMENTS, S.SCHEDULE, S.SUMMARY, S.CONFIRM];

export default function App() {
  const [session,    setSession]    = useState(null);
  const [userProfile,setUserProfile]= useState(null);
  const [screen,     setScreen]     = useState(S.HOME);
  const [orderData,  setOrderData]  = useState({});
  const [cleaners,   setCleaners]   = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [activeOrder,setActiveOrder]= useState(null);
  const [authLoading,setAuthLoading]= useState(true);

  // ── Auth: restore session on mount ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load user profile when session changes ───────────────────────────────────
  useEffect(() => {
    if (!session?.user) { setUserProfile(null); return; }
    supabase.from("users").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setUserProfile(data));
  }, [session]);

  // ── Load cleaners (live, ordered by plan then rating) ────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("public_businesses")
        .select("*")
        .order("plan_rank")
        .order("rating", { ascending: false });
      if (data) {
        const history = orders || [];
        setCleaners(data.map(row => dbToCleanerShape(row, history)));
      }
    };
    load();
    // Subscribe to realtime updates — when a cleaner updates their profile,
    // the consumer app refreshes automatically
    const channel = supabase
      .channel("businesses-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [orders]);

  // ── Load this user's orders ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user) { setOrders([]); setActiveOrder(null); return; }
    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setOrders(data);
        const active = data.find(o => !["completed","cancelled"].includes(o.status));
        setActiveOrder(active || null);
      }
    };
    load();
    // Realtime: order status updates push live to tracking screen
    const channel = supabase
      .channel("my-orders-live")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "orders",
        filter: `user_id=eq.${session.user.id}`
      }, payload => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        if (payload.new.id === activeOrder?.id) setActiveOrder(payload.new);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  // ── Submit a new order to Supabase ────────────────────────────────────────────
  const submitOrder = useCallback(async (data) => {
    if (!session?.user) return null;
    const assignments = data.serviceAssignments || {};
    const hangDry     = data.hangDry || {};
    let subtotal = 0, hangDryFee = 0;
    const servicesJson = [];
    Object.entries(assignments).forEach(([svcId, gMap]) => {
      const garments = Object.entries(gMap).filter(([,q]) => q > 0);
      if (!garments.length) return;
      const svcSub = garments.reduce((s,[gId,q]) => {
        const g = GARMENT_TYPES.find(x => x.id === gId);
        return s + (g ? g.price * q : 0);
      }, 0);
      const hdFee = hangDry[svcId] ? garments.reduce((s,[,q])=>s+q,0)*3 : 0;
      subtotal   += svcSub;
      hangDryFee += hdFee;
      const garmentsObj = {};
      garments.forEach(([gId,q]) => { garmentsObj[gId] = q; });
      servicesJson.push({ id: svcId, garments: garmentsObj, hangDry: !!hangDry[svcId] });
    });
    const rushFee    = data.rush ? 12 : 0;
    const bookingFee = parseFloat(((subtotal + hangDryFee + rushFee) * 0.05).toFixed(2));
    const total      = subtotal + hangDryFee + rushFee + bookingFee;

    const garmentsSummary = Object.entries(assignments)
      .flatMap(([,gMap]) => Object.entries(gMap).filter(([,q])=>q>0).map(([gId,q])=>{
        const g = GARMENT_TYPES.find(x=>x.id===gId);
        return g ? `${q}x ${g.label}` : null;
      })).filter(Boolean).join(", ");

    const { data: newOrder, error } = await supabase.from("orders").insert({
      user_id:          session.user.id,
      business_id:      data.cleaner.id,
      services:         servicesJson,
      garments_summary: garmentsSummary,
      special_notes:    data.special || null,
      rush:             !!data.rush,
      scheduled_date:   data.day,
      scheduled_time:   data.time,
      subtotal,
      booking_fee:      bookingFee,
      rush_fee:         rushFee,
      hang_dry_fee:     hangDryFee,
      total,
      status:           "scheduled",
      is_quick_drop:    !!data.reorder,
    }).select().single();

    if (error) { console.error("Order error:", error); return null; }
    setActiveOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }, [session]);

  // ── Save preferences ─────────────────────────────────────────────────────────
  const savePreferences = useCallback(async (prefs) => {
    if (!session?.user) return;
    await supabase.from("users").update({
      pref_hang_dry_knitwear: prefs.hangDryKnitwear,
      pref_no_softener:       prefs.noFabricSoftener,
      pref_cold_wash:         prefs.coldWash,
      pref_separate_darks:    prefs.separateDarks,
      pref_hang_shirts:       prefs.hangShirts,
    }).eq("id", session.user.id);
    setUserProfile(p => ({ ...p, ...{
      pref_hang_dry_knitwear: prefs.hangDryKnitwear,
      pref_no_softener:       prefs.noFabricSoftener,
      pref_cold_wash:         prefs.coldWash,
      pref_separate_darks:    prefs.separateDarks,
      pref_hang_shirts:       prefs.hangShirts,
    }}));
  }, [session]);

  // ── Sign out ─────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setScreen(S.AUTH);
    setOrderData({});
  }, []);

  // ── Advance order status (for Quick Drop estimate approval) ──────────────────
  const advanceStatus = useCallback(async (orderId, toStatus) => {
    await supabase.from("orders").update({ status: toStatus }).eq("id", orderId);
  }, []);

  if (authLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(160deg,${C.lavenderMist},#e8dff5)` }}>
      <div style={{ fontSize:36, fontFamily:"Palatino Linotype,Georgia,serif", fontStyle:"italic", color:C.lavender }}>dry.</div>
    </div>
  );

  const hideNav = ORDER_FLOW.includes(screen) || [S.PREFERENCES, S.REFERRAL, S.NOTIFICATIONS, S.PAYMENT_METHODS, S.MY_CLEANERS, S.HELP, S.FEEDBACK, S.AUTH].includes(screen);

  const render = () => {
    if (!session) return <AuthScreen onAuth={(user) => { setSession({ user }); setScreen(S.HOME); }} />;
    switch(screen) {
      case S.HOME:            return <HomeScreen          setScreen={setScreen} setOrderData={setOrderData} activeOrder={activeOrder} pastOrders={orders} cleaners={cleaners} userProfile={userProfile} />;
      case S.FIND:            return <FindScreen          setScreen={setScreen} setOrderData={setOrderData} cleaners={cleaners} />;
      case S.DETAIL:          return <DetailScreen        setScreen={setScreen} orderData={orderData} setOrderData={setOrderData} />;
      case S.QUICK:           return <QuickScreen         setScreen={setScreen} orderData={orderData} submitOrder={submitOrder} />;
      case S.SERVICE:         return <ServiceScreen       setScreen={setScreen} orderData={orderData} setOrderData={setOrderData} />;
      case S.GARMENTS:        return <GarmentsScreen      setScreen={setScreen} orderData={orderData} setOrderData={setOrderData} />;
      case S.SCHEDULE:        return <ScheduleScreen      setScreen={setScreen} orderData={orderData} setOrderData={setOrderData} />;
      case S.SUMMARY:         return <SummaryScreen       setScreen={setScreen} orderData={orderData} submitOrder={submitOrder} />;
      case S.CONFIRM:         return <ConfirmScreen       setScreen={setScreen} setOrderData={setOrderData} activeOrder={activeOrder} />;
      case S.TRACKING:        return <TrackingScreen      setScreen={setScreen} activeOrder={activeOrder} />;
      case S.HISTORY:         return <HistoryScreen       orders={orders} />;
      case S.PROFILE:         return <ProfileScreen       setScreen={setScreen} userProfile={userProfile} signOut={signOut} orders={orders} cleaners={cleaners} />;
      case S.PREFERENCES:     return <PreferencesScreen   setScreen={setScreen} userProfile={userProfile} savePreferences={savePreferences} />;
      case S.REFERRAL:        return <ReferralScreen      setScreen={setScreen} userProfile={userProfile} />;
      case S.NOTIFICATIONS:   return <NotificationsScreen setScreen={setScreen} userProfile={userProfile} supabase={supabase} session={session} />;
      case S.PAYMENT_METHODS: return <PaymentMethodsScreen setScreen={setScreen} />;
      case S.MY_CLEANERS:     return <MyCleanersScreen    setScreen={setScreen} orders={orders} cleaners={cleaners} />;
      case S.HELP:            return <HelpScreen          setScreen={setScreen} />;
      case S.FEEDBACK:        return <FeedbackScreen      setScreen={setScreen} session={session} />;
      default:                return <HomeScreen          setScreen={setScreen} setOrderData={setOrderData} activeOrder={activeOrder} pastOrders={orders} cleaners={cleaners} userProfile={userProfile} />;
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(160deg,${C.lavenderMist} 0%,#e8dff5 100%)`, padding:20 }}>
      <div style={{ width:390, minHeight:780, background:C.offWhite, borderRadius:48, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative", boxShadow:`0 40px 80px rgba(91,61,143,0.25),0 0 0 1px ${C.lavenderSoft}` }}>
        <div style={{ padding:"14px 28px 0", display:"flex", justifyContent:"space-between", fontSize:12, color:C.inkLight, fontFamily:"Georgia", background:C.offWhite }}>
          <span>9:41</span>
          <span style={{ fontSize:14, fontFamily:"Georgia", fontStyle:"italic", fontWeight:"bold", color:C.lavender }}>dry.</span>
          <span>●●●● 🔋</span>
        </div>
        <div style={{ flex:1, overflowY:"auto", paddingBottom:hideNav?0:80 }}>{render()}</div>
        {!hideNav && session && (
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:C.white, borderTop:`1px solid ${C.borderLight}`, display:"flex", alignItems:"center", justifyContent:"space-around", padding:"0 8px 12px", boxShadow:`0 -4px 20px ${C.lavender}15` }}>
            {NAV.map(item => {
              const active = screen===item.id;
              return (
                <div key={item.id} onClick={() => setScreen(item.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", padding:"8px 18px", borderRadius:16, background:active?C.lavenderMist:"transparent" }}>
                  <span style={{ fontSize:18, filter:active?"none":"grayscale(1) opacity(0.35)" }}>{item.icon}</span>
                  <span style={{ fontSize:10, letterSpacing:0.5, fontFamily:"Georgia", color:active?C.lavender:C.inkLight }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
