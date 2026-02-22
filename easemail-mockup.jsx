import { useState, useEffect } from "react";

const I = ({ d, s = 16, c = "currentColor", f, sw = 1.5 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={f || "none"} stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const Icons = {
  Mail: (p) => <I {...p} d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>}/>,
  Inbox: (p) => <I {...p} d={<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>}/>,
  Send: (p) => <I {...p} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}/>,
  File: (p) => <I {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}/>,
  Trash: (p) => <I {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}/>,
  Star: (p) => <I {...p} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>,
  Archive: (p) => <I {...p} d={<><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>}/>,
  Search: (p) => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>,
  Settings: (p) => <I {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>,
  Calendar: (p) => <I {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>,
  Users: (p) => <I {...p} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
  Chat: (p) => <I {...p} d={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}/>,
  Bar: (p) => <I {...p} d={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}/>,
  Plus: (p) => <I {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>,
  X: (p) => <I {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>,
  Minus: (p) => <I {...p} d={<line x1="5" y1="12" x2="19" y2="12"/>}/>,
  Max: (p) => <I {...p} d={<><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>}/>,
  Reply: (p) => <I {...p} d={<polyline points="9 17 4 12 9 7"/>}/>,
  Forward: (p) => <I {...p} d={<polyline points="15 17 20 12 15 7"/>}/>,
  Clip: (p) => <I {...p} d={<><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></>}/>,
  Flag: (p) => <I {...p} d={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>}/>,
  Zap: (p) => <I {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}/>,
  Moon: (p) => <I {...p} d={<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}/>,
  Sun: (p) => <I {...p} d={<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>}/>,
  Bell: (p) => <I {...p} d={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}/>,
  Menu: (p) => <I {...p} d={<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}/>,
  More: (p) => <I {...p} d={<><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>}/>,
  Edit: (p) => <I {...p} d={<><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></>}/>,
  Filter: (p) => <I {...p} d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>}/>,
  Video: (p) => <I {...p} d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>}/>,
  Phone: (p) => <I {...p} d={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>}/>,
  Help: (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>,
  Alert: (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}/>,
  Check: (p) => <I {...p} d={<polyline points="20 6 9 17 4 12"/>}/>,
  ChevD: (p) => <I {...p} d={<polyline points="6 9 12 15 18 9"/>}/>,
  ChevR: (p) => <I {...p} d={<polyline points="9 18 15 12 9 6"/>}/>,
  Palette: (p) => <I {...p} d={<><circle cx="13.5" cy="6.5" r="0.5" fill={p.c}/><circle cx="17.5" cy="10.5" r="0.5" fill={p.c}/><circle cx="8.5" cy="7.5" r="0.5" fill={p.c}/><circle cx="6.5" cy="12" r="0.5" fill={p.c}/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>}/>,
  Shield: (p) => <I {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>,
  Credit: (p) => <I {...p} d={<><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>}/>,
  Pin: (p) => <I {...p} d={<><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></>}/>,
  Bold: (p) => <I {...p} d={<><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></>}/>,
  Italic: (p) => <I {...p} d={<><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></>}/>,
  Link: (p) => <I {...p} d={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>}/>,
  Clock: (p) => <I {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>,
};

const br = { border: "none", background: "none", cursor: "pointer", padding: 0, outline: "none" };
const ACCENT = "#FF7F50";

const MSGS = [
  { id:1, from:"Sarah Mitchell", email:"sarah@mitchelllaw.com", subj:"RE: Q4 Budget Review — Updated Projections", prev:"I've reviewed the updated projections. The numbers look solid for Q4, but I have concerns about staffing...", date:"2:34 PM", unread:true, flag:true, attach:true, acct:0, lbl:["Client"] },
  { id:2, from:"Marcus Chen", email:"marcus@apexaffinity.com", subj:"Claims Dashboard — Ready for Review", prev:"The claims dashboard is ready for your review. I've implemented all the changes we discussed...", date:"1:15 PM", unread:true, flag:false, attach:false, acct:0, lbl:[] },
  { id:3, from:"Priya Patel", email:"priya@anderson.com", subj:"White-label Setup Questions", prev:"I have a few questions about setting up the white-label branding for our firm. Specifically around...", date:"12:42 PM", unread:true, flag:false, attach:false, acct:0, lbl:["Client"] },
  { id:4, from:"James Rodriguez", email:"james@healthfirst.com", subj:"HIPAA Compliance — Email Handling", prev:"Before we proceed with the email migration, I need to confirm the HIPAA compliance measures...", date:"11:30 AM", unread:false, flag:true, attach:true, acct:1, lbl:[] },
  { id:5, from:"Alex Kim", email:"alex@botmakers.ai", subj:"Voice Agent Update — Spencer McGaw CPA", prev:"Good news — the voice agent is passing all test cases now. Call routing is working correctly...", date:"10:05 AM", unread:false, flag:false, attach:false, acct:0, lbl:["Internal"] },
  { id:6, from:"Emily Watson", email:"emily@watson.com", subj:"Shared Inbox Request — Claims Team", prev:"We'd like to set up a shared inbox for our claims team. 8 people need access, auto-assignment...", date:"9:22 AM", unread:false, flag:false, attach:false, acct:0, lbl:["Client"] },
  { id:7, from:"David Park", email:"david@parklaw.com", subj:"Email Template Customization", prev:"Can we customize the email templates to include our firm's letterhead? We need header image...", date:"Yesterday", unread:false, flag:false, attach:true, acct:1, lbl:[] },
  { id:8, from:"Lisa Thompson", email:"lisa@botmakers.ai", subj:"ForgeBoard v2 — Sprint Planning", prev:"Team, here's the sprint plan for ForgeBoard v2. I've broken it into the 8 agents we discussed...", date:"Yesterday", unread:false, flag:false, attach:true, acct:0, lbl:["Internal"] },
];

const ACCTS = [
  { email:"daniel@botmakers.ai", color:"#FF7F50", status:"active", unread:12 },
  { email:"daniel@acmelaw.com", color:"#20B2AA", status:"active", unread:5 },
  { email:"d.personal@outlook.com", color:"#8B95A5", status:"warn", unread:0 },
];

const EVENTS = [
  { title:"Sprint Planning", time:"9:00 AM", dur:"1h", col:"#FF7F50", teams:true },
  { title:"Client Call — Apex", time:"11:00 AM", dur:"30m", col:"#20B2AA", teams:true },
  { title:"Lunch", time:"12:30 PM", dur:"1h", col:"#8B95A5", teams:false },
  { title:"EaseMail Demo", time:"2:00 PM", dur:"45m", col:"#FF7F50", teams:true },
];

const CHATS = [
  { name:"Alex Kim", prev:"Voice agent is live 🎉", time:"10:05 AM", unread:2, pres:"avail" },
  { name:"BotMakers Team", prev:"Lisa: Sprint starts Monday", time:"9:30 AM", unread:0, pres:null },
  { name:"Sarah Mitchell", prev:"Thanks, will review today", time:"Yesterday", unread:0, pres:"busy" },
];

const CONTACTS = [
  { name:"Sarah Mitchell", email:"sarah@mitchelllaw.com", co:"Mitchell & Associates", role:"Partner", pres:"avail" },
  { name:"Marcus Chen", email:"marcus@apexaffinity.com", co:"Apex Affinity Group", role:"CTO", pres:"busy" },
  { name:"Priya Patel", email:"priya@anderson.com", co:"Anderson Accounting", role:"CEO", pres:"avail" },
  { name:"James Rodriguez", email:"james@healthfirst.com", co:"HealthFirst Clinic", role:"Admin Director", pres:"away" },
  { name:"Alex Kim", email:"alex@botmakers.ai", co:"BotMakers Inc.", role:"Engineer", pres:"avail" },
  { name:"Emily Watson", email:"emily@watson.com", co:"Watson Insurance", role:"VP Claims", pres:"offline" },
];

export default function EaseMailMockup() {
  const [view, setView] = useState("mail");
  const [folder, setFolder] = useState("inbox");
  const [sel, setSel] = useState(0);
  const [composer, setComposer] = useState(false);
  const [compMin, setCompMin] = useState(false);
  const [cmdK, setCmdK] = useState(false);
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [acctDrop, setAcctDrop] = useState(false);
  const [selChat, setSelChat] = useState(-1);
  const [selContact, setSelContact] = useState(0);
  const [stPage, setStPage] = useState("general");
  const [calView, setCalView] = useState("week");

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCmdK(true); }
      if (e.key === "Escape") setCmdK(false);
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) { setComposer(true); setCompMin(false); }
      if (e.key === "/") { e.preventDefault(); setCmdK(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const t = dark ? {
    bg1:"#0F1419",bg2:"#1A1F2E",bg3:"#242B3D",bgE:"#1E2535",bgS:"#2A1F1A",
    t1:"#E8EAED",t2:"#8B95A5",t3:"#5C6370",
    bd:"#2A3040",bs:"#1E2535",as:"#2A1F1A",at:"#FF9B7A"
  } : {
    bg1:"#FFFFFF",bg2:"#F8F9FA",bg3:"#F1F3F5",bgE:"#FFFFFF",bgS:"#FFF5F0",
    t1:"#1A1A1A",t2:"#6B7280",t3:"#9CA3AF",
    bd:"#E5E7EB",bs:"#F1F3F5",as:"#FFF5F0",at:"#E5623D"
  };

  const navItems = [
    { id:"mail", icon:"Mail", label:"Mail", badge:17 },
    { id:"calendar", icon:"Calendar", label:"Calendar" },
    { id:"teams", icon:"Chat", label:"Teams", badge:2 },
    { id:"contacts", icon:"Users", label:"Contacts" },
    { id:"crm", icon:"Bar", label:"CRM" },
  ];

  const folders = [
    { id:"inbox", icon:"Inbox", name:"Inbox", n:12 },
    { id:"drafts", icon:"File", name:"Drafts", n:3 },
    { id:"sent", icon:"Send", name:"Sent Items", n:0 },
    { id:"archive", icon:"Archive", name:"Archive", n:0 },
    { id:"trash", icon:"Trash", name:"Deleted", n:0 },
  ];

  const Ic = (name, props={}) => { const C = Icons[name]; return C ? <C {...props}/> : null; };
  const presCol = (p) => p === "avail" ? "#10B981" : p === "busy" ? "#EF4444" : p === "away" ? "#F59E0B" : "#9CA3AF";

  return (
    <div style={{ height:"100vh",width:"100vw",display:"flex",flexDirection:"column",fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",fontSize:13,color:t.t1,background:t.bg1,overflow:"hidden" }}>

      {/* ═══ TOP BAR ═══ */}
      <div style={{ height:48,display:"flex",alignItems:"center",padding:"0 16px",borderBottom:`1px solid ${t.bd}`,background:t.bg2,flexShrink:0,gap:12 }}>
        <button onClick={()=>setCollapsed(!collapsed)} style={{...br,padding:6,borderRadius:6}}>{Ic("Menu",{s:18,c:t.t2})}</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:24,height:24,borderRadius:6,background:`linear-gradient(135deg,${ACCENT},#FF6B3D)`,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ic("Mail",{s:13,c:"#fff"})}</div>
          <span style={{fontWeight:600,fontSize:14,color:t.t1}}>EaseMail</span>
        </div>
        <div onClick={()=>setCmdK(true)} style={{flex:1,maxWidth:480,marginLeft:24,height:32,display:"flex",alignItems:"center",gap:8,padding:"0 12px",borderRadius:6,background:t.bg3,cursor:"pointer",border:`1px solid ${t.bd}`}}>
          {Ic("Search",{s:14,c:t.t3})}
          <span style={{color:t.t3,fontSize:12}}>Search emails, contacts, commands...</span>
          <span style={{marginLeft:"auto",fontSize:10,padding:"1px 5px",borderRadius:4,background:t.bg2,border:`1px solid ${t.bd}`,color:t.t3}}>⌘K</span>
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}>
          <button onClick={()=>setDark(!dark)} style={{...br,padding:6,borderRadius:6}}>{dark ? Ic("Sun",{s:16,c:t.t2}) : Ic("Moon",{s:16,c:t.t2})}</button>
          <button style={{...br,padding:6,borderRadius:6,position:"relative"}}>{Ic("Bell",{s:16,c:t.t2})}<div style={{position:"absolute",top:4,right:4,width:7,height:7,borderRadius:"50%",background:ACCENT,border:`1.5px solid ${t.bg2}`}}/></button>
          <div style={{width:28,height:28,borderRadius:"50%",background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",marginLeft:4}}><span style={{color:"#fff",fontSize:11,fontWeight:600}}>D</span></div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ═══ SIDEBAR ═══ */}
        <div style={{width:collapsed?48:240,flexShrink:0,background:t.bg2,borderRight:`1px solid ${t.bd}`,display:"flex",flexDirection:"column",transition:"width .2s cubic-bezier(.16,1,.3,1)",overflow:"hidden"}}>
          {!collapsed ? <>
            {/* Account Switcher */}
            <div style={{padding:"12px 12px 8px"}}>
              <button onClick={()=>setAcctDrop(!acctDrop)} style={{...br,width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,background:acctDrop?t.bg3:"transparent"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:ACCENT}}/>
                <span style={{fontSize:12,fontWeight:500,color:t.t1,flex:1,textAlign:"left"}}>All Accounts</span>
                {Ic("ChevD",{s:12,c:t.t3})}
              </button>
              {acctDrop && <div style={{marginTop:4,background:t.bgE,borderRadius:6,border:`1px solid ${t.bd}`,overflow:"hidden"}}>
                {ACCTS.map((a,i)=><button key={i} onClick={()=>setAcctDrop(false)} style={{...br,width:"100%",padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:a.status==="active"?"#10B981":"#F59E0B"}}/>
                  <span style={{fontSize:12,color:t.t1,flex:1,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.email}</span>
                  {a.unread>0&&<span style={{fontSize:11,fontWeight:600,color:t.t1}}>{a.unread}</span>}
                </button>)}
                <button style={{...br,width:"100%",padding:"8px 12px",display:"flex",alignItems:"center",gap:8,borderTop:`1px solid ${t.bd}`}}>{Ic("Plus",{s:12,c:ACCENT})}<span style={{fontSize:12,color:ACCENT}}>Add account</span></button>
              </div>}
            </div>
            {ACCTS.some(a=>a.status==="warn")&&<div style={{margin:"0 12px 8px",padding:"6px 10px",borderRadius:6,background:dark?"#2A2000":"#FFF8E1",border:`1px solid ${dark?"#4A3800":"#FFE082"}`,display:"flex",alignItems:"center",gap:6,fontSize:11}}>
              {Ic("Alert",{s:12,c:"#F59E0B"})}<span style={{color:dark?"#FFE082":"#A06800",flex:1}}>Personal needs reconnection</span><button style={{...br,fontSize:11,color:ACCENT,fontWeight:500}}>Fix</button>
            </div>}

            <nav style={{flex:1,padding:"0 8px",overflowY:"auto"}}>
              {navItems.map(ni=><button key={ni.id} onClick={()=>setView(ni.id)} style={{...br,width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,marginBottom:1,background:view===ni.id?t.bg3:"transparent",borderLeft:view===ni.id?`2px solid ${ACCENT}`:"2px solid transparent",paddingLeft:view===ni.id?6:8}}>
                {Ic(ni.icon,{s:16,c:view===ni.id?ACCENT:t.t2})}
                <span style={{fontSize:13,fontWeight:view===ni.id?500:400,color:view===ni.id?t.t1:t.t2}}>{ni.label}</span>
                {ni.badge>0&&<span style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:t.t1}}>{ni.badge}</span>}
              </button>)}

              {view==="mail"&&<>
                <div style={{borderTop:`1px solid ${t.bs}`,margin:"8px 0"}}/>
                {folders.map(f=><button key={f.id} onClick={()=>setFolder(f.id)} style={{...br,width:"100%",display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,marginBottom:1,background:folder===f.id?t.bg3:"transparent"}}>
                  {Ic(f.icon,{s:15,c:folder===f.id?t.t1:t.t3})}
                  <span style={{fontSize:12,color:folder===f.id?t.t1:t.t2}}>{f.name}</span>
                  {f.n>0&&<span style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:t.t1}}>{f.n}</span>}
                </button>)}
                <div style={{padding:"8px 8px 4px"}}><span style={{fontSize:10,fontWeight:500,color:t.t3,letterSpacing:"0.05em",textTransform:"uppercase"}}>FAVORITES</span></div>
                {[{n:"Clients",u:4},{n:"Important",u:2}].map(fv=><button key={fv.n} style={{...br,width:"100%",display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,marginBottom:1}}>
                  {Ic("Star",{s:15,c:t.t3})}<span style={{fontSize:12,color:t.t2}}>{fv.n}</span>{fv.u>0&&<span style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:t.t1}}>{fv.u}</span>}
                </button>)}
              </>}

              {view==="teams"&&<>
                <div style={{borderTop:`1px solid ${t.bs}`,margin:"8px 0"}}/>
                <div style={{padding:"4px 8px"}}><span style={{fontSize:10,fontWeight:500,color:t.t3,letterSpacing:"0.05em",textTransform:"uppercase"}}>RECENT CHATS</span></div>
                {CHATS.map((ch,i)=><button key={i} onClick={()=>setSelChat(i)} style={{...br,width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,marginBottom:1,background:selChat===i?t.bg3:"transparent"}}>
                  <div style={{position:"relative"}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:ch.pres?ACCENT:t.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,color:ch.pres?"#fff":t.t2}}>{ch.name[0]}</div>
                    {ch.pres&&<div style={{position:"absolute",bottom:-1,right:-1,width:8,height:8,borderRadius:"50%",background:presCol(ch.pres),border:`1.5px solid ${t.bg2}`}}/>}
                  </div>
                  <div style={{flex:1,minWidth:0,textAlign:"left"}}>
                    <span style={{fontSize:12,fontWeight:ch.unread>0?600:400,color:t.t1,display:"block"}}>{ch.name}</span>
                    <span style={{fontSize:11,color:t.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{ch.prev}</span>
                  </div>
                  {ch.unread>0&&<div style={{width:16,height:16,borderRadius:"50%",background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{ch.unread}</div>}
                </button>)}
              </>}
            </nav>

            <div style={{padding:"8px 8px 12px",borderTop:`1px solid ${t.bs}`}}>
              <button onClick={()=>setView("settings")} style={{...br,width:"100%",display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6}}>{Ic("Settings",{s:15,c:t.t3})}<span style={{fontSize:12,color:t.t2}}>Settings</span></button>
              <button style={{...br,width:"100%",display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6}}>{Ic("Help",{s:15,c:t.t3})}<span style={{fontSize:12,color:t.t2}}>Help</span></button>
            </div>
          </> : <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:4}}>
            {navItems.map(ni=><button key={ni.id} onClick={()=>setView(ni.id)} style={{...br,width:36,height:36,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:view===ni.id?t.bg3:"transparent"}}>{Ic(ni.icon,{s:18,c:view===ni.id?ACCENT:t.t2})}</button>)}
          </div>}
        </div>

        {/* ═══ MAIN AREA ═══ */}
        {view==="mail"&&<>
          {/* Message List */}
          <div style={{width:400,flexShrink:0,borderRight:`1px solid ${t.bd}`,display:"flex",flexDirection:"column",background:t.bg1}}>
            <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${t.bs}`}}>
              <span style={{fontSize:14,fontWeight:600,color:t.t1,flex:1}}>Inbox</span>
              <button style={{...br,padding:4,borderRadius:4}}>{Ic("Filter",{s:14,c:t.t3})}</button>
              <button onClick={()=>{setComposer(true);setCompMin(false);}} style={{...br,width:28,height:28,borderRadius:6,background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ic("Edit",{s:14,c:"#fff"})}</button>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {MSGS.map((m,i)=><div key={m.id} onClick={()=>setSel(i)} style={{padding:"10px 16px",borderBottom:`1px solid ${t.bs}`,cursor:"pointer",background:sel===i?t.bgS:"transparent",borderLeft:sel===i?`2px solid ${ACCENT}`:"2px solid transparent",display:"flex",gap:10}}>
                <div style={{position:"relative",flexShrink:0}}>
                  {m.unread&&<div style={{position:"absolute",left:-12,top:8,width:6,height:6,borderRadius:"50%",background:ACCENT}}/>}
                  <div style={{width:28,height:28,borderRadius:"50%",background:ACCTS[m.acct]?.color||t.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{m.from.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                    <span style={{fontSize:13,fontWeight:m.unread?600:400,color:t.t1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.from}</span>
                    <span style={{fontSize:11,color:t.t3,flexShrink:0}}>{m.date}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:m.unread?600:400,color:t.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{m.subj}</div>
                  <div style={{fontSize:12,color:t.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.prev}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                    {m.attach&&Ic("Clip",{s:11,c:t.t3})}
                    {m.lbl.map(l=><span key={l} style={{fontSize:10,color:t.t2,padding:"1px 6px",borderRadius:4,background:t.bg3}}>{l}</span>)}
                    {m.flag&&<span style={{marginLeft:"auto"}}>{Ic("Flag",{s:11,c:ACCENT,f:ACCENT})}</span>}
                  </div>
                </div>
              </div>)}
            </div>
          </div>

          {/* Reading Pane */}
          <div style={{flex:1,display:"flex",flexDirection:"column",background:t.bg1,overflow:"hidden"}}>
            <div style={{padding:"8px 16px",display:"flex",alignItems:"center",gap:2,borderBottom:`1px solid ${t.bd}`,flexShrink:0}}>
              {["Reply","Reply All","Forward"].map(a=><button key={a} onClick={()=>{setComposer(true);setCompMin(false);}} style={{...br,display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:4,fontSize:12,color:t.t2}}>{Ic(a==="Reply"?"Reply":a==="Forward"?"Forward":"Reply",{s:14,c:t.t2})}<span>{a}</span></button>)}
              <div style={{width:1,height:16,background:t.bd,margin:"0 4px"}}/>
              {["Archive","Trash","Flag","Pin","Clock","More"].map(a=><button key={a} style={{...br,padding:6,borderRadius:4}}>{Ic(a,{s:14,c:t.t2})}</button>)}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:24}}>
              <h2 style={{fontSize:18,fontWeight:600,color:t.t1,margin:"0 0 16px",lineHeight:1.3}}>{MSGS[sel].subj}</h2>
              <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:20}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:ACCTS[MSGS[sel].acct]?.color||ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"#fff",flexShrink:0}}>{MSGS[sel].from.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14,fontWeight:500,color:t.t1}}>{MSGS[sel].from}</span><span style={{fontSize:12,color:t.t3}}>&lt;{MSGS[sel].email}&gt;</span><span style={{fontSize:11,color:t.t3,marginLeft:"auto"}}>{MSGS[sel].date}</span></div>
                  <div style={{fontSize:12,color:t.t3,marginTop:2}}>To: daniel@botmakers.ai</div>
                </div>
              </div>
              {MSGS[sel].attach&&<div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
                {["Q4-Projections.xlsx","Analysis.pdf"].map(f=><div key={f} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:6,border:`1px solid ${t.bd}`,background:t.bg2,cursor:"pointer"}}>{Ic("File",{s:14,c:ACCENT})}<span style={{fontSize:12,color:t.t1}}>{f}</span><span style={{fontSize:10,color:t.t3}}>24 KB</span></div>)}
              </div>}
              <div style={{padding:"10px 14px",borderRadius:6,background:t.as,border:`1px solid ${dark?"#3A2A1A":"#FFE8D6"}`,marginBottom:20,display:"flex",alignItems:"center",gap:8}}>
                {Ic("Zap",{s:14,c:ACCENT})}<span style={{fontSize:12,color:t.at}}>Sarah approved Q4 projections but raised concerns about staffing costs. Wants revised timeline by Friday.</span>
              </div>
              <div style={{fontSize:14,lineHeight:1.7,color:t.t1}}>
                <p style={{margin:"0 0 12px"}}>Hi Daniel,</p>
                <p style={{margin:"0 0 12px"}}>{MSGS[sel].prev} Specifically, the projected headcount increase seems aggressive given our current pipeline. We should consider phasing the hiring over two quarters instead of one.</p>
                <p style={{margin:"0 0 12px"}}>Can we schedule a call this week? I'm available Thursday afternoon or Friday morning.</p>
                <p style={{margin:"16px 0 0"}}>Best regards,<br/>{MSGS[sel].from}<br/><span style={{color:t.t3}}>{MSGS[sel].email}</span></p>
              </div>
              {/* Quick Reply */}
              <div style={{marginTop:24,padding:16,borderRadius:8,border:`1px solid ${t.bd}`,background:t.bg2}}>
                <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                  {["Sounds good, let's meet Thursday","I'll revise the projections","Let me check my calendar"].map(r=><button key={r} style={{...br,padding:"6px 12px",borderRadius:16,border:`1px solid ${t.bd}`,background:t.bgE,fontSize:12,color:t.t2}}>{r}</button>)}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input placeholder="Write a quick reply..." style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:13,color:t.t1,padding:0}}/>
                  <button style={{...br,padding:"4px 12px",borderRadius:6,background:ACCENT,color:"#fff",fontSize:12,fontWeight:500}}>Send</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{width:240,flexShrink:0,borderLeft:`1px solid ${t.bd}`,padding:16,background:t.bg2,overflowY:"auto"}}>
            <div style={{fontSize:11,fontWeight:500,color:t.t3,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>TODAY'S AGENDA</div>
            {EVENTS.map((ev,i)=><div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${t.bs}`}}>
              <div style={{width:3,borderRadius:2,background:ev.col,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,color:t.t1}}>{ev.title}</div><div style={{fontSize:11,color:t.t3}}>{ev.time} · {ev.dur}</div></div>
              {ev.teams&&<span>{Ic("Video",{s:12,c:ACCENT})}</span>}
            </div>)}
            <div style={{fontSize:11,fontWeight:500,color:t.t3,textTransform:"uppercase",letterSpacing:"0.05em",marginTop:16,marginBottom:8}}>CRM CONTEXT</div>
            <div style={{padding:10,borderRadius:6,background:t.bgE,border:`1px solid ${t.bd}`}}>
              <div style={{fontSize:12,fontWeight:500,color:t.t1}}>{MSGS[sel].from}</div>
              <div style={{fontSize:11,color:t.t3,marginTop:2}}>Mitchell & Associates</div>
              <div style={{fontSize:11,color:t.t3}}>Last contacted: 2 days ago</div>
              <div style={{display:"flex",gap:6,marginTop:8}}>{["Legal","VIP"].map(tag=><span key={tag} style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:t.bg3,color:t.t2}}>{tag}</span>)}</div>
              <div style={{fontSize:11,color:ACCENT,marginTop:8,cursor:"pointer"}}>View in CRM →</div>
            </div>
          </div>
        </>}

        {/* ═══ CALENDAR VIEW ═══ */}
        {view==="calendar"&&<div style={{flex:1,display:"flex",flexDirection:"column",background:t.bg1}}>
          <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${t.bd}`}}>
            <button style={{...br,padding:"4px 12px",borderRadius:6,background:ACCENT,color:"#fff",fontSize:12,fontWeight:500}}>Today</button>
            <span style={{fontSize:16,fontWeight:600,color:t.t1}}>February 2026</span>
            <div style={{display:"flex",gap:2,marginLeft:"auto"}}>
              {["Day","Week","Month"].map(v=><button key={v} onClick={()=>setCalView(v.toLowerCase())} style={{...br,padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:500,color:calView===v.toLowerCase()?ACCENT:t.t2,background:calView===v.toLowerCase()?t.as:"transparent"}}>{v}</button>)}
            </div>
          </div>
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            {/* Time column */}
            <div style={{width:60,flexShrink:0,borderRight:`1px solid ${t.bs}`,paddingTop:8}}>
              {Array.from({length:13},(_, i)=>i+7).map(h=><div key={h} style={{height:60,padding:"0 8px",fontSize:10,color:t.t3,textAlign:"right"}}>{h>12?h-12:h} {h>=12?"PM":"AM"}</div>)}
            </div>
            {/* Week grid */}
            <div style={{flex:1,display:"flex"}}>
              {["Mon 16","Tue 17","Wed 18","Thu 19","Fri 20","Sat 21","Sun 22"].map((day,di)=><div key={day} style={{flex:1,borderRight:`1px solid ${t.bs}`,position:"relative"}}>
                <div style={{padding:"8px 8px 4px",fontSize:11,fontWeight:di===5?600:400,color:di===5?ACCENT:t.t2,textAlign:"center",borderBottom:`1px solid ${t.bs}`}}>{day}</div>
                <div style={{position:"relative"}}>
                  {Array.from({length:13}).map((_,i)=><div key={i} style={{height:60,borderBottom:`1px solid ${t.bs}`}}/>)}
                  {/* Sample events on different days */}
                  {di===0&&<div style={{position:"absolute",top:120,left:2,right:2,height:56,borderRadius:4,background:t.as,borderLeft:`3px solid #FF7F50`,padding:"4px 6px",overflow:"hidden",cursor:"pointer"}}><div style={{fontSize:11,fontWeight:500,color:t.t1}}>Sprint Planning</div><div style={{fontSize:10,color:t.t3}}>9:00 - 10:00 AM</div></div>}
                  {di===1&&<div style={{position:"absolute",top:240,left:2,right:2,height:30,borderRadius:4,background:dark?"#1A2A2A":"#E6FAF5",borderLeft:`3px solid #20B2AA`,padding:"4px 6px",overflow:"hidden",cursor:"pointer"}}><div style={{fontSize:11,fontWeight:500,color:t.t1}}>Client Call — Apex</div></div>}
                  {di===3&&<div style={{position:"absolute",top:300,left:2,right:2,height:44,borderRadius:4,background:t.as,borderLeft:`3px solid #FF7F50`,padding:"4px 6px",overflow:"hidden",cursor:"pointer"}}><div style={{fontSize:11,fontWeight:500,color:t.t1}}>EaseMail Demo</div><div style={{fontSize:10,color:t.t3}}>2:00 - 2:45 PM</div></div>}
                  {/* Current time line */}
                  {di===5&&<div style={{position:"absolute",top:200,left:0,right:0,height:2,background:ACCENT,zIndex:2}}><div style={{width:8,height:8,borderRadius:"50%",background:ACCENT,position:"absolute",left:-4,top:-3}}/></div>}
                </div>
              </div>)}
            </div>
          </div>
        </div>}

        {/* ═══ TEAMS VIEW ═══ */}
        {view==="teams"&&<div style={{flex:1,display:"flex",background:t.bg1}}>
          {selChat>=0?<div style={{flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${t.bd}`}}>
              <button onClick={()=>setSelChat(-1)} style={{...br,padding:4}}>{Ic("Reply",{s:16,c:t.t2})}</button>
              <div style={{position:"relative"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"#fff"}}>{CHATS[selChat].name[0]}</div>
                {CHATS[selChat].pres&&<div style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:presCol(CHATS[selChat].pres),border:`2px solid ${t.bg1}`}}/>}
              </div>
              <div><div style={{fontSize:14,fontWeight:500,color:t.t1}}>{CHATS[selChat].name}</div><div style={{fontSize:11,color:t.t3}}>{CHATS[selChat].pres==="avail"?"Available":"Busy"}</div></div>
              <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                <button style={{...br,padding:6,borderRadius:6}}>{Ic("Phone",{s:16,c:t.t2})}</button>
                <button style={{...br,padding:6,borderRadius:6}}>{Ic("Video",{s:16,c:t.t2})}</button>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:16}}>
              <div style={{textAlign:"center",fontSize:11,color:t.t3,padding:"8px 0"}}>Today</div>
              {[{from:"Alex Kim",msg:"Voice agent is passing all test cases now! 🎉",time:"10:02 AM",me:false},{from:"You",msg:"That's awesome! Did you test the edge cases with the hold music?",time:"10:03 AM",me:true},{from:"Alex Kim",msg:"Yes, all passing. Call routing, appointment booking, hold transfers — everything works.",time:"10:05 AM",me:false},{from:"Alex Kim",msg:"Voice agent is live 🎉",time:"10:05 AM",me:false}].map((m,i)=><div key={i} style={{display:"flex",gap:8,alignItems:m.me?"flex-end":"flex-start",flexDirection:m.me?"row-reverse":"row"}}>
                {!m.me&&<div style={{width:28,height:28,borderRadius:"50%",background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,color:"#fff",flexShrink:0}}>{m.from[0]}</div>}
                <div style={{maxWidth:"70%"}}>
                  {!m.me&&<div style={{fontSize:11,fontWeight:500,color:t.t1,marginBottom:2}}>{m.from} <span style={{fontWeight:400,color:t.t3,marginLeft:4}}>{m.time}</span></div>}
                  <div style={{padding:"8px 12px",borderRadius:m.me?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.me?ACCENT:t.bg3,color:m.me?"#fff":t.t1,fontSize:13,lineHeight:1.4}}>{m.msg}</div>
                  {m.me&&<div style={{fontSize:10,color:t.t3,textAlign:"right",marginTop:2}}>{m.time}</div>}
                </div>
              </div>)}
            </div>
            <div style={{padding:"12px 16px",borderTop:`1px solid ${t.bd}`,display:"flex",alignItems:"center",gap:8}}>
              <button style={{...br,padding:4}}>{Ic("Clip",{s:16,c:t.t3})}</button>
              <input placeholder="Type a message..." style={{flex:1,border:"none",background:t.bg3,borderRadius:6,padding:"8px 12px",outline:"none",fontSize:13,color:t.t1}}/>
              <button style={{...br,padding:"6px 14px",borderRadius:6,background:ACCENT,color:"#fff",fontSize:12,fontWeight:500}}>Send</button>
            </div>
          </div>:<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}>{Ic("Chat",{s:48,c:t.bd,sw:1})}<p style={{marginTop:12,fontSize:14,color:t.t3}}>Select a chat from the sidebar</p></div></div>}
        </div>}

        {/* ═══ CONTACTS VIEW ═══ */}
        {view==="contacts"&&<>
          <div style={{width:360,flexShrink:0,borderRight:`1px solid ${t.bd}`,display:"flex",flexDirection:"column",background:t.bg1}}>
            <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${t.bs}`}}>
              <span style={{fontSize:14,fontWeight:600,color:t.t1,flex:1}}>Contacts</span>
              <button style={{...br,width:28,height:28,borderRadius:6,background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ic("Plus",{s:14,c:"#fff"})}</button>
            </div>
            <div style={{padding:"8px 16px"}}><input placeholder="Search contacts..." style={{width:"100%",border:`1px solid ${t.bd}`,background:t.bg3,borderRadius:6,padding:"6px 10px",outline:"none",fontSize:12,color:t.t1}}/></div>
            <div style={{flex:1,overflowY:"auto"}}>
              {CONTACTS.map((co,i)=><div key={i} onClick={()=>setSelContact(i)} style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:selContact===i?t.bgS:"transparent",borderBottom:`1px solid ${t.bs}`}}>
                <div style={{position:"relative"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:["#FF7F50","#20B2AA","#8B5CF6","#EC4899","#F59E0B","#6366F1"][i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"#fff"}}>{co.name.split(" ").map(n=>n[0]).join("")}</div>
                  <div style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:presCol(co.pres),border:`1.5px solid ${t.bg1}`}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:t.t1}}>{co.name}</div>
                  <div style={{fontSize:11,color:t.t3}}>{co.co}</div>
                </div>
              </div>)}
            </div>
          </div>
          <div style={{flex:1,padding:24,overflowY:"auto",background:t.bg1}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:["#FF7F50","#20B2AA","#8B5CF6","#EC4899","#F59E0B","#6366F1"][selContact],display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:600,color:"#fff"}}>{CONTACTS[selContact].name.split(" ").map(n=>n[0]).join("")}</div>
              <div>
                <div style={{fontSize:18,fontWeight:600,color:t.t1}}>{CONTACTS[selContact].name}</div>
                <div style={{fontSize:13,color:t.t2}}>{CONTACTS[selContact].role} at {CONTACTS[selContact].co}</div>
                <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}><div style={{width:8,height:8,borderRadius:"50%",background:presCol(CONTACTS[selContact].pres)}}/><span style={{fontSize:12,color:t.t3}}>{CONTACTS[selContact].pres==="avail"?"Available":CONTACTS[selContact].pres==="busy"?"Busy":CONTACTS[selContact].pres==="away"?"Away":"Offline"}</span></div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:24}}>
              {[{icon:"Mail",label:"Email"},{icon:"Chat",label:"Chat"},{icon:"Calendar",label:"Meeting"},{icon:"Phone",label:"Call"}].map(a=><button key={a.label} style={{...br,display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:6,border:`1px solid ${t.bd}`,background:t.bgE,fontSize:12,color:t.t2}}>{Ic(a.icon,{s:14,c:t.t2})}{a.label}</button>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
              <div style={{padding:16,borderRadius:8,border:`1px solid ${t.bd}`}}><div style={{fontSize:11,color:t.t3,marginBottom:4}}>Email</div><div style={{fontSize:13,color:ACCENT}}>{CONTACTS[selContact].email}</div></div>
              <div style={{padding:16,borderRadius:8,border:`1px solid ${t.bd}`}}><div style={{fontSize:11,color:t.t3,marginBottom:4}}>Company</div><div style={{fontSize:13,color:t.t1}}>{CONTACTS[selContact].co}</div></div>
              <div style={{padding:16,borderRadius:8,border:`1px solid ${t.bd}`}}><div style={{fontSize:11,color:t.t3,marginBottom:4}}>Last Contacted</div><div style={{fontSize:13,color:t.t1}}>2 days ago</div></div>
              <div style={{padding:16,borderRadius:8,border:`1px solid ${t.bd}`}}><div style={{fontSize:11,color:t.t3,marginBottom:4}}>Total Emails</div><div style={{fontSize:13,color:t.t1}}>47 sent · 62 received</div></div>
            </div>
            <div style={{fontSize:11,fontWeight:500,color:t.t3,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>RECENT ACTIVITY</div>
            {[{type:"email",desc:"You sent: RE: Q4 Budget Review",time:"2 days ago"},{type:"meeting",desc:"Client Call — Q3 Review",time:"1 week ago"},{type:"email",desc:"Received: Invoice #4521",time:"2 weeks ago"}].map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${t.bs}`}}>
              {Ic(a.type==="email"?"Mail":"Calendar",{s:14,c:t.t3})}
              <div style={{flex:1}}><div style={{fontSize:12,color:t.t1}}>{a.desc}</div></div>
              <span style={{fontSize:11,color:t.t3}}>{a.time}</span>
            </div>)}
          </div>
        </>}

        {/* ═══ CRM VIEW ═══ */}
        {view==="crm"&&<div style={{flex:1,padding:24,overflowY:"auto",background:t.bg1}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:24}}><span style={{fontSize:18,fontWeight:600,color:t.t1}}>CRM Dashboard</span></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
            {[{label:"Total Contacts",val:"127",ch:"+12 this month"},{label:"Active Deals",val:"8",ch:"$284K pipeline"},{label:"Won This Quarter",val:"$142K",ch:"5 deals closed"},{label:"Avg Response Time",val:"4.2h",ch:"↓ 18% vs last month"}].map(s=><div key={s.label} style={{padding:16,borderRadius:8,border:`1px solid ${t.bd}`,background:t.bgE}}>
              <div style={{fontSize:11,color:t.t3,marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:24,fontWeight:600,color:t.t1}}>{s.val}</div>
              <div style={{fontSize:11,color:ACCENT,marginTop:4}}>{s.ch}</div>
            </div>)}
          </div>
          <div style={{fontSize:14,fontWeight:600,color:t.t1,marginBottom:12}}>Deal Pipeline</div>
          <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8}}>
            {[{stage:"Lead",deals:[{n:"Watson Insurance — Shared Inbox",v:"$2,400/mo"},{n:"Park Law — Email Setup",v:"$1,200/mo"}]},{stage:"Qualified",deals:[{n:"HealthFirst — HIPAA Migration",v:"$4,800/mo"}]},{stage:"Proposal",deals:[{n:"Apex — Full Platform",v:"$8,500/mo"},{n:"Anderson — White-label",v:"$3,200/mo"}]},{stage:"Negotiation",deals:[{n:"Mitchell — Enterprise",v:"$12,000/mo"}]},{stage:"Won",deals:[{n:"Spencer CPA — Voice + Email",v:"$2,100/mo"}]}].map(col=><div key={col.stage} style={{minWidth:220,flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:t.t1,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{col.stage}<span style={{fontSize:10,color:t.t3,fontWeight:400}}>{col.deals.length}</span></div>
              {col.deals.map(d=><div key={d.n} style={{padding:12,borderRadius:6,border:`1px solid ${t.bd}`,background:t.bgE,marginBottom:8,cursor:"pointer"}}>
                <div style={{fontSize:12,fontWeight:500,color:t.t1,marginBottom:4}}>{d.n}</div>
                <div style={{fontSize:12,color:ACCENT,fontWeight:500}}>{d.v}</div>
              </div>)}
            </div>)}
          </div>
        </div>}

        {/* ═══ SETTINGS VIEW ═══ */}
        {view==="settings"&&<>
          <div style={{width:220,flexShrink:0,borderRight:`1px solid ${t.bd}`,background:t.bg2,padding:"16px 8px"}}>
            <div style={{fontSize:14,fontWeight:600,color:t.t1,padding:"0 8px",marginBottom:12}}>Settings</div>
            {[{id:"general",icon:"Settings",label:"General"},{id:"accounts",icon:"Mail",label:"Accounts"},{id:"appearance",icon:"Palette",label:"Appearance"},{id:"notifications",icon:"Bell",label:"Notifications"},{id:"security",icon:"Shield",label:"Security"},{id:"billing",icon:"Credit",label:"Billing"}].map(s=><button key={s.id} onClick={()=>setStPage(s.id)} style={{...br,width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,marginBottom:1,background:stPage===s.id?t.bg3:"transparent"}}>
              {Ic(s.icon,{s:15,c:stPage===s.id?ACCENT:t.t3})}<span style={{fontSize:12,color:stPage===s.id?t.t1:t.t2}}>{s.label}</span>
            </button>)}
          </div>
          <div style={{flex:1,padding:24,overflowY:"auto",background:t.bg1}}>
            <div style={{fontSize:18,fontWeight:600,color:t.t1,marginBottom:4}}>{stPage.charAt(0).toUpperCase()+stPage.slice(1)}</div>
            <div style={{fontSize:13,color:t.t3,marginBottom:24}}>Manage your {stPage} preferences</div>
            {stPage==="general"&&<div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:560}}>
              {[{label:"Language",type:"select",val:"English"},{label:"Timezone",type:"select",val:"America/Chicago (CST)"},{label:"Date format",type:"select",val:"MM/DD/YYYY"},{label:"Time format",type:"select",val:"12-hour"},{label:"Undo send delay",type:"select",val:"10 seconds"},{label:"Auto-advance after action",type:"select",val:"Next message"},{label:"Conversation view",type:"toggle",val:true}].map(s=><div key={s.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${t.bs}`}}>
                <div><div style={{fontSize:13,fontWeight:500,color:t.t1}}>{s.label}</div></div>
                {s.type==="select"&&<div style={{padding:"4px 12px",borderRadius:6,border:`1px solid ${t.bd}`,background:t.bg3,fontSize:12,color:t.t1,display:"flex",alignItems:"center",gap:4}}>{s.val}{Ic("ChevD",{s:10,c:t.t3})}</div>}
                {s.type==="toggle"&&<div style={{width:36,height:20,borderRadius:10,background:s.val?ACCENT:t.bg3,position:"relative",cursor:"pointer"}}><div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:s.val?18:2,transition:"left .15s",boxShadow:"0 1px 2px rgba(0,0,0,.1)"}}/></div>}
              </div>)}
            </div>}
            {stPage==="accounts"&&<div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:560}}>
              {ACCTS.map((a,i)=><div key={i} style={{padding:16,borderRadius:8,border:`1px solid ${t.bd}`,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:a.status==="active"?"#10B981":"#F59E0B"}}/>
                <div style={{width:32,height:32,borderRadius:"50%",background:a.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"#fff"}}>{a.email[0].toUpperCase()}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:t.t1}}>{a.email}</div><div style={{fontSize:11,color:t.t3}}>{a.status==="active"?"Connected · Last synced 2 min ago":"Needs reconnection"}</div></div>
                {a.status==="warn"&&<button style={{...br,padding:"4px 12px",borderRadius:6,background:ACCENT,color:"#fff",fontSize:12,fontWeight:500}}>Reconnect</button>}
                <button style={{...br,padding:4}}>{Ic("More",{s:16,c:t.t3})}</button>
              </div>)}
              <button style={{...br,padding:16,borderRadius:8,border:`1px dashed ${t.bd}`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:ACCENT,fontSize:13}}>
                {Ic("Plus",{s:16,c:ACCENT})} Add Microsoft Account
              </button>
            </div>}
            {stPage==="appearance"&&<div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:560}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${t.bs}`}}>
                <div><div style={{fontSize:13,fontWeight:500,color:t.t1}}>Theme</div></div>
                <div style={{display:"flex",gap:4}}>{["Light","Dark","System"].map(th=><button key={th} onClick={()=>setDark(th==="Dark")} style={{...br,padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:500,color:(th==="Dark"&&dark)||(th==="Light"&&!dark)?ACCENT:t.t2,background:(th==="Dark"&&dark)||(th==="Light"&&!dark)?t.as:"transparent"}}>{th}</button>)}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${t.bs}`}}>
                <div><div style={{fontSize:13,fontWeight:500,color:t.t1}}>Accent Color</div></div>
                <div style={{display:"flex",gap:6}}>{["#FF7F50","#20B2AA","#8B5CF6","#EC4899","#6366F1","#10B981"].map(c=><div key={c} style={{width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",border:c===ACCENT?`2px solid ${t.t1}`:"2px solid transparent"}}/>)}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${t.bs}`}}>
                <div><div style={{fontSize:13,fontWeight:500,color:t.t1}}>Density</div></div>
                <div style={{display:"flex",gap:4}}>{["Compact","Comfortable","Spacious"].map(d=><button key={d} style={{...br,padding:"4px 12px",borderRadius:6,fontSize:12,color:d==="Comfortable"?ACCENT:t.t2,background:d==="Comfortable"?t.as:"transparent"}}>{d}</button>)}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${t.bs}`}}>
                <div><div style={{fontSize:13,fontWeight:500,color:t.t1}}>Reading Pane</div></div>
                <div style={{display:"flex",gap:4}}>{["Right","Bottom","Off"].map(d=><button key={d} style={{...br,padding:"4px 12px",borderRadius:6,fontSize:12,color:d==="Right"?ACCENT:t.t2,background:d==="Right"?t.as:"transparent"}}>{d}</button>)}</div>
              </div>
            </div>}
            {stPage==="billing"&&<div style={{maxWidth:560}}>
              <div style={{padding:16,borderRadius:8,border:`1px solid ${t.bd}`,background:t.as,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:600,color:t.t1}}>Professional Plan</div>
                <div style={{fontSize:24,fontWeight:600,color:ACCENT,marginTop:4}}>$29<span style={{fontSize:13,fontWeight:400,color:t.t2}}>/seat/month</span></div>
                <div style={{fontSize:12,color:t.t3,marginTop:4}}>4 seats · Billed monthly · Next billing: March 1, 2026</div>
              </div>
              <button style={{...br,padding:"8px 16px",borderRadius:6,border:`1px solid ${ACCENT}`,color:ACCENT,fontSize:13,fontWeight:500,marginBottom:16}}>Upgrade to Team Plan</button>
              <div style={{fontSize:11,fontWeight:500,color:t.t3,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>BILLING HISTORY</div>
              {["Feb 1, 2026 — $116.00","Jan 1, 2026 — $116.00","Dec 1, 2025 — $87.00"].map(inv=><div key={inv} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${t.bs}`}}>
                <span style={{fontSize:12,color:t.t1,flex:1}}>{inv}</span>
                <button style={{...br,fontSize:11,color:ACCENT}}>Download PDF</button>
              </div>)}
            </div>}
          </div>
        </>}
      </div>

      {/* ═══ COMPOSER ═══ */}
      {composer&&!compMin&&<div style={{position:"fixed",bottom:0,right:24,width:560,height:480,background:t.bgE,borderRadius:"8px 8px 0 0",boxShadow:"0 -4px 16px rgba(0,0,0,.12)",border:`1px solid ${t.bd}`,display:"flex",flexDirection:"column",zIndex:100}}>
        <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${t.bd}`,background:t.bg2,borderRadius:"8px 8px 0 0"}}>
          <span style={{fontSize:13,fontWeight:500,color:t.t1,flex:1}}>New Message</span>
          <button onClick={()=>setCompMin(true)} style={{...br,padding:4}}>{Ic("Minus",{s:14,c:t.t3})}</button>
          <button style={{...br,padding:4}}>{Ic("Max",{s:14,c:t.t3})}</button>
          <button onClick={()=>setComposer(false)} style={{...br,padding:4}}>{Ic("X",{s:14,c:t.t3})}</button>
        </div>
        <div style={{padding:"8px 12px",borderBottom:`1px solid ${t.bs}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:12,color:t.t3,width:40}}>From:</span><span style={{fontSize:12,color:t.t1}}>daniel@botmakers.ai</span>{Ic("ChevD",{s:10,c:t.t3})}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:12,color:t.t3,width:40}}>To:</span><input placeholder="Recipients..." style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:12,color:t.t1,padding:0}}/><span style={{fontSize:11,color:t.t3,cursor:"pointer"}}>CC</span><span style={{fontSize:11,color:t.t3,cursor:"pointer",marginLeft:8}}>BCC</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:t.t3,width:40}}>Subj:</span><input placeholder="Subject..." style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:12,color:t.t1,padding:0}}/></div>
        </div>
        <div style={{padding:"4px 8px",display:"flex",gap:2,borderBottom:`1px solid ${t.bs}`}}>
          {["Bold","Italic","Link"].map(a=><button key={a} style={{...br,width:28,height:28,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ic(a,{s:14,c:t.t3})}</button>)}
        </div>
        <div style={{flex:1,padding:12}}>
          <div contentEditable suppressContentEditableWarning style={{width:"100%",height:"100%",outline:"none",fontSize:13,color:t.t1,lineHeight:1.6}}/>
        </div>
        <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8,borderTop:`1px solid ${t.bd}`}}>
          <button style={{...br,padding:4}}>{Ic("Clip",{s:16,c:t.t3})}</button>
          <button style={{...br,padding:4}}>{Ic("Zap",{s:16,c:t.t3})}</button>
          <button style={{...br,padding:4}}>{Ic("Clock",{s:16,c:t.t3})}</button>
          <span style={{flex:1}}/>
          <span style={{fontSize:10,color:t.t3}}>Saved</span>
          <button style={{...br,padding:"6px 16px",borderRadius:6,background:ACCENT,color:"#fff",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:6}}>Send {Ic("Send",{s:13,c:"#fff"})}</button>
        </div>
      </div>}
      {composer&&compMin&&<div onClick={()=>setCompMin(false)} style={{position:"fixed",bottom:0,right:24,width:280,padding:"8px 12px",background:t.bg2,borderRadius:"8px 8px 0 0",boxShadow:"0 -2px 8px rgba(0,0,0,.08)",border:`1px solid ${t.bd}`,display:"flex",alignItems:"center",cursor:"pointer",zIndex:100}}>
        <span style={{fontSize:12,fontWeight:500,color:t.t1,flex:1}}>New Message</span>
        <button onClick={e=>{e.stopPropagation();setComposer(false);}} style={{...br,padding:4}}>{Ic("X",{s:14,c:t.t3})}</button>
      </div>}

      {/* ═══ COMMAND PALETTE ═══ */}
      {cmdK&&<>
        <div onClick={()=>setCmdK(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:200}}/>
        <div style={{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",width:560,background:t.bgE,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.2)",border:`1px solid ${t.bd}`,zIndex:201,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",borderBottom:`1px solid ${t.bd}`}}>
            {Ic("Search",{s:16,c:t.t3})}
            <input autoFocus placeholder="Search emails, contacts, commands..." style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:14,color:t.t1}} onKeyDown={e=>e.key==="Escape"&&setCmdK(false)}/>
            <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:t.bg3,color:t.t3}}>ESC</span>
          </div>
          <div style={{padding:8,maxHeight:400,overflowY:"auto"}}>
            <div style={{padding:"4px 8px",fontSize:10,fontWeight:500,color:t.t3,textTransform:"uppercase"}}>COMMANDS</div>
            {[{icon:"Edit",label:"Compose new email",key:"C"},{icon:"Search",label:"Search all mail",key:"/"},{icon:"Calendar",label:"Open calendar",key:""},{icon:"Settings",label:"Open settings",key:"⌘,"}].map(cmd=><button key={cmd.label} onClick={()=>{setCmdK(false);if(cmd.label.includes("Compose")){setComposer(true);setCompMin(false);}if(cmd.label.includes("calendar"))setView("calendar");if(cmd.label.includes("settings"))setView("settings");}} style={{...br,width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 8px",borderRadius:6,marginBottom:1}}>
              {Ic(cmd.icon,{s:16,c:t.t2})}<span style={{fontSize:13,color:t.t1,flex:1,textAlign:"left"}}>{cmd.label}</span>{cmd.key&&<span style={{fontSize:11,color:t.t3,padding:"1px 6px",borderRadius:4,background:t.bg3}}>{cmd.key}</span>}
            </button>)}
            <div style={{padding:"8px 8px 4px",fontSize:10,fontWeight:500,color:t.t3,textTransform:"uppercase"}}>RECENT</div>
            {MSGS.slice(0,3).map(m=><button key={m.id} onClick={()=>{setCmdK(false);setView("mail");setSel(m.id-1);}} style={{...br,width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 8px",borderRadius:6,marginBottom:1}}>
              {Ic("Mail",{s:16,c:t.t3})}<div style={{flex:1,textAlign:"left"}}><div style={{fontSize:12,color:t.t1}}>{m.subj}</div><div style={{fontSize:11,color:t.t3}}>from {m.from}</div></div>
            </button>)}
          </div>
        </div>
      </>}
    </div>
  );
}
