// PathGuard — App Bootstrap + Router + Firebase Auth Guard
// This script is a classic (non-module) script.
// Firebase is loaded separately as an ES module in index.html.
window.PG = window.PG || {};

// ── Global App State ─────────────────────────────────────────
PG.state = {
  currentPage:    "dashboard",
  currentUser:    null,   // Firebase User or demo session object
  userProfile:    null,   // Firestore user doc
  currentPath:    null,
  currentIdentity:null,
  simIdentity:    null,
  simResult:      null,
};

// ── Router ───────────────────────────────────────────────────
PG.Router = {
  routes: {
    "dashboard":       {page:"page-dashboard",       nav:"nav-dashboard",    render:()=>PG.Pages.renderDashboard()},
    "attack-paths":    {page:"page-attack-paths",    nav:"nav-attack-paths", render:()=>PG.Pages.renderAttackPaths()},
    "path-detail":     {page:"page-path-detail",     nav:"nav-attack-paths", render:()=>{}},
    "identities":      {page:"page-identities",      nav:"nav-identities",   render:()=>PG.Pages.renderIdentities()},
    "identity-detail": {page:"page-identity-detail", nav:"nav-identities",   render:()=>{}},
    "employees":       {page:"page-employees",       nav:"nav-employees",    render:()=>PG.Pages.renderEmployees()},
    "groups":          {page:"page-groups",          nav:"nav-groups",       render:()=>PG.Pages.renderGroups()},
    "cloud-roles":     {page:"page-cloud-roles",     nav:"nav-cloud-roles",  render:()=>PG.Pages.renderCloudRoles()},
    "assets":          {page:"page-assets",          nav:"nav-assets",       render:()=>PG.Pages.renderAssets()},
    "simulator":       {page:"page-simulator",       nav:"nav-simulator",    render:()=>PG.Pages.renderSimulator()},
    "risk":            {page:"page-risk",            nav:"nav-risk",         render:()=>PG.Pages.renderRiskAnalysis()},
    "remediation":     {page:"page-remediation",     nav:"nav-remediation",  render:()=>PG.Pages.renderRemediation()},
    "reports":         {page:"page-reports",         nav:"nav-reports",      render:()=>PG.Pages.renderReports()},
  },
  go(name) {
    const r=this.routes[name]; if(!r) return;
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    document.getElementById(r.page)?.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
    document.getElementById(r.nav)?.classList.add("active");
    r.render();
    PG.state.currentPage=name;
    window.scrollTo(0,0);
  },
};

// ── Notifications ─────────────────────────────────────────────
PG.Notifications = {
  items:[
    {title:"Critical attack path discovered",sub:"John Doe → Finance DB  ·  Risk: 96", time:"2m ago",  type:"critical"},
    {title:"New identity added",             sub:"svc-analytics@company.com",           time:"14m ago", type:"info"},
    {title:"Risk reduced",                   sub:"REM-002 simulation: Finance DB -56%", time:"1h ago",  type:"success"},
    {title:"High-risk path escalated",       sub:"Carlos Rivera → Payroll · Risk: 91",  time:"2h ago",  type:"high"},
  ],
  toggle(){document.getElementById("notif-dropdown")?.classList.toggle("open");},
  render(){
    const d=document.getElementById("notif-dropdown"); if(!d) return;
    d.innerHTML='<div class="notif-header">Notifications <span style="float:right;color:var(--text-muted);font-size:10px">'+this.items.length+' new</span></div>'
      +this.items.map(n=>{const col=n.type==="critical"?"var(--critical)":n.type==="high"?"var(--high)":n.type==="success"?"var(--low)":"var(--text-primary)";return `<div class="notif-item"><div class="notif-item-title" style="color:${col}">${n.title}</div><div class="notif-item-sub">${n.sub}</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">${n.time}</div></div>`;}).join("");
  },
};

// ── Search ────────────────────────────────────────────────────
PG.Search = {
  search(q){
    const el=document.getElementById("search-results"); if(!el) return;
    if(!q||q.length<2){el.style.display="none";return;}
    const qL=q.toLowerCase();
    const results=[
      ...PG.identities.filter(i=>i.name.toLowerCase().includes(qL)||i.email.toLowerCase().includes(qL)).map(i=>({type:"identity",id:i.id,label:i.name,sub:i.email,icon:"👤"})),
      ...PG.assets.filter(a=>a.name.toLowerCase().includes(qL)).map(a=>({type:"asset",id:a.id,label:a.name,sub:a.criticality+" asset",icon:"◈"})),
      ...PG.attackPaths.filter(p=>p.id.toLowerCase().includes(qL)||p.sourceName.toLowerCase().includes(qL)||p.targetName.toLowerCase().includes(qL)).map(p=>({type:"path",id:p.id,label:`${p.id}: ${p.sourceName} → ${p.targetName}`,sub:`Risk: ${p.risk}`,icon:"→"})),
    ].slice(0,7);
    if(!results.length){el.style.display="none";return;}
    el.style.display="block";
    el.innerHTML=results.map(r=>`<div class="search-result-item" onmousedown="PG.Search.select('${r.type}','${r.id}')"><span style="font-size:13px">${r.icon}</span><div><div style="font-size:12px;font-weight:600;color:var(--text-primary)">${r.label}</div><div style="font-size:10px;color:var(--text-muted)">${r.sub}</div></div></div>`).join("");
  },
  select(type,id){
    document.getElementById("search-input").value="";
    document.getElementById("search-results").style.display="none";
    if(type==="identity") PG.Pages.openIdentityDetail(id);
    else if(type==="asset"){PG.Router.go("assets");setTimeout(()=>PG.Pages._showAsset(id),100);}
    else if(type==="path") PG.Pages.openPathDetail(id);
  },
};

// ── UI Helpers ────────────────────────────────────────────────
PG.UI = {
  setUser(profile){
    const av=profile.avatar||(profile.name||"U").slice(0,2).toUpperCase();
    ["topbar-avatar","sidebar-avatar"].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=av;});
    const tn=document.getElementById("topbar-user-name");  if(tn) tn.textContent=profile.name||profile.email;
    const tr=document.getElementById("topbar-user-role");  if(tr) tr.textContent=profile.role||"Security Analyst";
    const sn=document.getElementById("sidebar-user-name"); if(sn) sn.textContent=profile.name||profile.email;
    const sr=document.getElementById("sidebar-user-role"); if(sr) sr.textContent=profile.role||"Security Analyst";
  },
  setFbChip(on){
    const chip=document.getElementById("fb-chip"),label=document.getElementById("fb-chip-label");
    if(chip)  chip.className="fb-chip "+(on?"on":"off");
    if(label) label.textContent=on?"Firebase":"Demo";
    const um=document.getElementById("um-fb-status");
    if(um) um.textContent="⚙ Firebase: "+(on?"Connected ✓":"Demo mode — update .env");
  },
  showLoading(msg="Loading…"){
    const el=document.getElementById("app-loading"); if(!el) return;
    const m=el.querySelector(".loading-msg"); if(m) m.textContent=msg;
    el.style.display="flex";
  },
  hideLoading(){
    const el=document.getElementById("app-loading"); if(el) el.style.display="none";
    const app=document.getElementById("app"); if(app) app.style.display="";
  },
  showToast(msg,type="info"){
    const t=Object.assign(document.createElement("div"),{className:`pg-toast pg-toast-${type}`,textContent:msg});
    document.body.appendChild(t);
    requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add("show")));
    setTimeout(()=>{t.classList.remove("show");setTimeout(()=>t.remove(),300);},3200);
  },
};

// ── Logout (called by Firebase module after init) ────────────
PG.logout = ()=>{ sessionStorage.clear(); window.location.href="home.html"; };

// ── App Boot (called by Firebase module in index.html) ───────
PG.boot = function(user, profile, firebaseReady) {
  PG.state.currentUser = user;
  PG.state.userProfile = profile;
  PG.UI.setUser(profile);
  PG.UI.setFbChip(firebaseReady);
  PG.UI.hideLoading();
  PG.Notifications.render();

  // Search
  const si=document.getElementById("search-input");
  if(si){
    si.addEventListener("input",e=>PG.Search.search(e.target.value));
    si.addEventListener("blur",()=>setTimeout(()=>{const r=document.getElementById("search-results");if(r)r.style.display="none";},200));
  }

  // Close dropdowns on outside click
  document.addEventListener("click",e=>{
    if(!e.target.closest("#notif-btn"))    document.getElementById("notif-dropdown")?.classList.remove("open");
    if(!e.target.closest(".user-menu-wrap"))document.getElementById("user-menu")?.classList.remove("open");
  });

  // Mobile sidebar toggle
  if(window.innerWidth<=768) document.getElementById("sidebar-toggle")?.style?.setProperty("display","flex");

  PG.Router.go("dashboard");

  // Update employee badge count every 5 seconds
  const _updateEmpBadge = () => {
    const badge = document.getElementById('emp-count-badge');
    if (badge) badge.textContent = PG.identities.length;
  };
  _updateEmpBadge();
  setInterval(_updateEmpBadge, 5000);
};
