// PathGuard — All Page Renderers
window.PG = window.PG || {};
PG.Pages = {};

/* ── Helpers ────────────────────────────────────────────────── */
const bdg=s=>`<span class="badge badge-${s}"><span class="badge-dot"></span>${s.toUpperCase()}</span>`;
const rBar=n=>{const c=PG.RiskEngine.getRiskColor(n);return `<div class="risk-bar-wrap"><div class="risk-bar-track"><div class="risk-bar-fill" style="width:${n}%;background:${c}"></div></div><span class="risk-bar-label" style="color:${c}">${n}</span></div>`;};
const spk=(d,c="#3b82f6")=>{const mx=Math.max(...d),mn=Math.min(...d),rng=mx-mn||1,w=80,h=28;const pts=d.map((v,i)=>`${(i/(d.length-1))*w},${h-((v-mn)/rng)*(h-4)-2}`).join(" ");return `<svg class="sparkline" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;};
const tI=t=>({employee:"👤",contractor:"🔗",service_account:"⚙",cloud_identity:"☁",cloud_role:"☁",group:"👥",application:"◈",asset:"◈"})[t]||"○";
const tC=t=>({employee:"#3b82f6",contractor:"#8b5cf6",service_account:"#f97316",cloud_identity:"#06b6d4",cloud_role:"#06b6d4",group:"#22c55e"})[t]||"#94a3b8";
const pChain=steps=>steps.map((s,i)=>`<span class="path-chain-node${s.type==="asset"?" critical-asset":""}">${tI(s.type)} ${s.label}</span>${i<steps.length-1?'<span class="path-arrow">→</span>':""}`).join("");
const sep=()=>'<div class="separator"></div>';
const statBox=(l,v,c)=>`<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:9px;text-align:center"><div style="font-size:18px;font-weight:700;color:${c}">${v}</div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;margin-top:2px">${l}</div></div>`;

/* ── DASHBOARD ───────────────────────────────────────────────── */
PG.Pages.renderDashboard=function(){
  const k=PG.kpis,t=PG.trends;
  document.getElementById("page-dashboard").innerHTML=`
  <div class="page-header"><div class="page-header-row">
    <div><h1>Identity Security Command Center</h1><p>Continuous analysis of identity relationships, privilege escalation paths, and critical asset exposure.</p></div>
    <div class="flex-row"><span class="tag">Live Firestore Connected ✓</span>
    <button class="btn btn-primary" onclick="PG.Router.go('simulator')">⚡ Simulate Compromise</button></div>
  </div></div>

  <!-- Quick Operations Toolbar -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:12px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div style="display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--text-secondary)">
      <span style="color:var(--accent-blue)">⚡ Quick Actions:</span>
      <button class="btn btn-secondary btn-sm" onclick="PG.Router.go('simulator')">⚡ Run Simulation</button>
      <button class="btn btn-secondary btn-sm" onclick="PG.Router.go('identities')">👤 View Identities</button>
      <button class="btn btn-secondary btn-sm" onclick="PG.Router.go('paths')">🎯 Attack Paths</button>
      <button class="btn btn-secondary btn-sm" onclick="PG.Router.go('remediation')">🛡️ Remediation</button>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <input type="text" placeholder="Search identity or asset..." style="background:var(--bg-surface);border:1px solid var(--border);border-radius:6px;padding:5px 12px;font-size:12px;color:var(--text-primary);width:200px" onkeyup="if(event.key==='Enter'){PG.Router.go('identities');setTimeout(()=>{const el=document.getElementById('ident-search');if(el){el.value=this.value;el.dispatchEvent(new Event('input'))}},100)}">
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">Total Identities</div><div class="kpi-value">${k.totalIdentities.toLocaleString()}</div><div class="kpi-sub">Users, Service Accounts &amp; Cloud</div><div class="kpi-trend up">↑ 37 this week ${spk(t.totalIdentities,"#3b82f6")}</div></div>
    <div class="kpi-card warning"><div class="kpi-label">Attack Paths</div><div class="kpi-value">${k.attackPaths}</div><div class="kpi-sub">Active Attack Paths</div><div class="kpi-trend up">↑ 2 since last scan ${spk(t.attackPaths,"#eab308")}</div></div>
    <div class="kpi-card critical"><div class="kpi-label">Critical Paths</div><div class="kpi-value">${k.criticalPaths}</div><div class="kpi-sub">Require Immediate Action</div><div class="kpi-trend up">↑ 1 this week ${spk(t.criticalPaths,"#ef4444")}</div></div>
    <div class="kpi-card high"><div class="kpi-label">High-Risk Identities</div><div class="kpi-value">${k.highRiskIdentities}</div><div class="kpi-sub">Risk Score ≥ 70</div><div class="kpi-trend up">↑ 4 this week ${spk(t.highRiskIdentities,"#f97316")}</div></div>
  </div>
  <div class="grid-2" style="margin-bottom:20px">
    <div class="card"><div class="card-header"><h2>Identity Attack Exposure</h2><span class="text-xs text-muted">Click any step to explore</span></div>
      <div class="card-body" style="padding:12px"><div id="dash-graph" style="height:340px;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;overflow:hidden"></div></div></div>
    <div class="card"><div class="card-header"><h2>Critical Attack Paths</h2><span>${k.criticalPaths} critical</span></div>
      <div class="card-body" style="padding:12px"><div id="dash-crit"></div></div></div>
  </div>
  <div class="grid-3">
    <div class="card"><div class="card-header"><h2>Risk Distribution</h2></div><div class="card-body"><div class="bar-chart" id="dash-rdist"></div></div></div>
    <div class="card"><div class="card-header"><h2>Top High-Risk Identities</h2></div><div class="card-body" style="padding:10px 14px"><div id="dash-topids"></div></div></div>
    <div class="card"><div class="card-header"><h2>Environment Summary</h2></div><div class="card-body"><div id="dash-env"></div></div></div>
  </div>`;
  setTimeout(()=>{
    PG.Graph.renderPathGraph("dash-graph",PG.attackPaths[0].steps,-1);
    const ce=document.getElementById("dash-crit");
    if(ce) ce.innerHTML=PG.attackPaths.slice(0,4).map(p=>`<div class="attack-path-card ${p.severity} mt-8" onclick="PG.Pages.openPathDetail('${p.id}')">${bdg(p.severity)}<div class="path-chain mt-8">${pChain(p.steps)}</div><div class="flex-between mt-8"><span style="font-size:18px;font-weight:800;color:${PG.RiskEngine.getRiskColor(p.risk)}">${p.risk}<span style="font-size:10px;color:var(--text-muted)"> /100</span></span><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();PG.Pages.openPathDetail('${p.id}')">Explore</button></div></div>`).join("");
    const rd=document.getElementById("dash-rdist");
    if(rd){const d=PG.riskDistribution,tot=d.critical+d.high+d.medium+d.low;rd.innerHTML=[{l:"Critical",c:d.critical,col:"#ef4444"},{l:"High",c:d.high,col:"#f97316"},{l:"Medium",c:d.medium,col:"#eab308"},{l:"Low",c:d.low,col:"#22c55e"}].map(r=>`<div class="bar-row"><span class="bar-row-label" style="color:${r.col}">${r.l}</span><div class="bar-track"><div class="bar-fill" style="width:0%;background:${r.col}" data-w="${((r.c/tot)*100).toFixed(1)}"></div></div><span class="bar-count" style="color:${r.col}">${r.c}</span></div>`).join("");setTimeout(()=>rd.querySelectorAll(".bar-fill").forEach(b=>b.style.width=b.dataset.w+"%"),100);}
    const ti=document.getElementById("dash-topids");
    if(ti) ti.innerHTML=[...PG.identities].sort((a,b)=>b.risk-a.risk).slice(0,5).map(id=>`<div class="flex-between" style="padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="PG.Pages.openIdentityDetail('${id.id}')"><div class="flex-row" style="gap:7px"><div style="width:26px;height:26px;border-radius:50%;background:${tC(id.type)}22;border:1px solid ${tC(id.type)}44;display:flex;align-items:center;justify-content:center;font-size:12px">${tI(id.type)}</div><div><div class="text-sm font-700">${id.name}</div><div class="text-xs text-muted">${id.type.replace(/_/g," ")}</div></div></div>${rBar(id.risk)}</div>`).join("");
    const ev=document.getElementById("dash-env");
    if(ev){const k2=PG.kpis;ev.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[["👥","Groups",k2.totalGroups],["⚙","Service Accts",k2.serviceAccounts],["☁","Cloud Roles",k2.cloudRoles],["◈","Applications",k2.applications],["🔴","Critical Assets",k2.criticalAssets],["🔗","Relationships",k2.relationships.toLocaleString()]].map(it=>`<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:10px"><div style="font-size:18px;margin-bottom:3px">${it[0]}</div><div style="font-size:18px;font-weight:700;color:var(--text-primary)">${it[2]}</div><div style="font-size:10px;color:var(--text-muted)">${it[1]}</div></div>`).join("")}</div>`;}
  },50);
};

/* ── ATTACK PATHS ──────────────────────────────────────────── */
PG.Pages.renderAttackPaths=function(){
  document.getElementById("page-attack-paths").innerHTML=`
  <div class="page-header"><div class="page-header-row"><div><h1>Attack Path Intelligence</h1><p>Discover and prioritize identity-based paths to critical resources.</p></div>
  <button class="btn btn-primary" onclick="PG.Router.go('simulator')">⚡ Simulate</button></div></div>
  <div class="filters-bar">
    <span class="filter-label">Severity</span>
    <select class="filter-select" id="ap-sev" onchange="PG.Pages._apF()"><option value="">All</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
    <div class="filter-divider"></div>
    <span class="filter-label">Source</span>
    <select class="filter-select" id="ap-src" onchange="PG.Pages._apF()"><option value="">All</option>${PG.identities.map(i=>`<option value="${i.id}">${i.name}</option>`).join("")}</select>
    <div class="filter-divider"></div>
    <span class="filter-label">Status</span>
    <select class="filter-select" id="ap-st" onchange="PG.Pages._apF()"><option value="">All</option><option value="open">Open</option><option value="review">Review</option></select>
    <button class="btn btn-secondary btn-sm" onclick="['ap-sev','ap-src','ap-st'].forEach(x=>{document.getElementById(x).value='';});PG.Pages._apF()">Reset</button>
  </div>
  <div class="card"><div class="table-wrap"><table class="data-table">
    <thead><tr><th>Severity</th><th>ID</th><th>Source</th><th>Path</th><th>Target</th><th>Hops</th><th>Risk</th><th>Status</th><th></th></tr></thead>
    <tbody id="ap-tb"></tbody>
  </table></div></div>`;
  PG.Pages._apF();
};
PG.Pages._apF=function(){
  const sev=document.getElementById("ap-sev")?.value,src=document.getElementById("ap-src")?.value,sts=document.getElementById("ap-st")?.value;
  const paths=PG.attackPaths.filter(p=>(!sev||p.severity===sev)&&(!src||p.sourceId===src)&&(!sts||p.status===sts));
  const tb=document.getElementById("ap-tb"); if(!tb) return;
  if(!paths.length){tb.innerHTML=`<tr><td colspan="9"><div class="empty-state"><div style="font-size:28px;margin-bottom:8px">🔍</div><h3>No paths match filters.</h3><button class="btn btn-secondary btn-sm mt-8" onclick="['ap-sev','ap-src','ap-st'].forEach(x=>document.getElementById(x).value='');PG.Pages._apF()">Reset</button></div></td></tr>`;return;}
  tb.innerHTML=paths.map(p=>`<tr onclick="PG.Pages.openPathDetail('${p.id}')">
    <td>${bdg(p.severity)}</td><td><span class="text-accent font-700">${p.id}</span></td>
    <td class="name-cell">${p.sourceName}</td>
    <td><div class="path-chain" style="max-width:220px;overflow:hidden;flex-wrap:nowrap">${pChain(p.steps)}</div></td>
    <td class="name-cell">${p.targetName}</td><td>${p.hops}</td><td>${rBar(p.risk)}</td>
    <td><span class="tag" style="${p.status==="open"?"color:var(--critical)":""}">${p.status.toUpperCase()}</span></td>
    <td><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();PG.Pages.openPathDetail('${p.id}')">Explore</button></td>
  </tr>`).join("");
};
PG.Pages.openPathDetail=function(id){
  const p=PG.attackPaths.find(x=>x.id===id); if(!p) return;
  PG.state.currentPath=p; PG.Pages._renderPD(p); PG.Router.go("path-detail");
};
PG.Pages._renderPD=function(p){
  const page=document.getElementById("page-path-detail"); if(!page) return;
  page.innerHTML=`
  <div class="page-header"><div class="page-header-row">
    <div class="flex-row"><button class="btn btn-secondary btn-sm" onclick="PG.Router.go('attack-paths')">← Back</button><h1>${p.id}</h1>${bdg(p.severity)}</div>
    <div class="flex-row"><button class="btn btn-secondary" onclick="PG.Router.go('remediation')">Remediation</button><button class="btn btn-danger" onclick="PG.Router.go('remediation')">Remediate</button></div>
  </div></div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px">
    ${[["Source",p.sourceName,"var(--text-primary)"],["Privilege",p.initialPrivilege,p.initialPrivilege==="Low"?"var(--low)":"var(--high)"],["Target",p.targetName,"var(--critical)"],["Hops",p.hops,"var(--text-primary)"],["Risk",`${p.risk} / 100`,PG.RiskEngine.getRiskColor(p.risk)]].map(x=>`<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px">${x[0]}</div><div style="font-size:16px;font-weight:700;color:${x[2]}">${x[1]}</div></div>`).join("")}
  </div>
  <div class="grid-2">
    <div class="card"><div class="card-header"><h2>Attack Path Visualization</h2><span class="text-xs text-muted">Click a step</span></div>
      <div class="card-body" style="padding:10px"><div id="pd-graph" style="height:${p.steps.length*130+20}px;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;overflow-y:auto"></div></div></div>
    <div>
      <div class="card" id="step-card"><div class="card-header"><h2>Step-by-Step Explanation</h2></div>
        <div class="card-body"><div id="step-panel"><div class="empty-state" style="padding:20px"><div style="font-size:24px;margin-bottom:6px">👆</div><h3>Select a Step</h3><p>Click any node in the graph.</p></div></div></div></div>
      <div class="card mt-12"><div class="card-header"><h2>Summary</h2></div>
        <div class="card-body"><p class="text-sm text-secondary" style="line-height:1.7">${p.description}</p></div></div>
    </div>
  </div>`;
  setTimeout(()=>{
    PG.Graph.renderPathGraph("pd-graph",p.steps,-1);
    const h=e=>{if(!document.getElementById("page-path-detail").classList.contains("active"))return;const step=p.steps[e.detail.index];if(step)PG.Pages._showStep(step,e.detail.index);};
    document.removeEventListener("pg:stepclick",PG.Pages._pdH);
    PG.Pages._pdH=h; document.addEventListener("pg:stepclick",h);
  },50);
};
PG.Pages._showStep=function(step,i){
  const el=document.getElementById("step-panel"); if(!el) return;
  el.innerHTML=`<div class="flex-between mb-16"><h3 style="font-size:14px;font-weight:700">Step ${i+1} — ${step.relationship||"Source"}</h3>${rBar(step.risk)}</div>
  <div class="flex-row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px"><span class="tag">${step.label}</span><span class="tag" style="color:${tC(step.type)}">${tI(step.type)} ${(step.type||"").replace(/_/g," ")}</span></div>
  ${step.relationship?`<div class="mb-8"><span class="tag" style="color:var(--accent)">${step.relationship}</span></div>`:""}
  ${sep()}<div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:.8px">Why this matters:</div>
  <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.7;background:var(--bg-elevated);padding:12px;border-radius:8px;border:1px solid var(--border)">${step.explanation}</div>
  ${sep()}<div class="flex-between"><div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Risk Level</div><div style="font-size:14px;font-weight:700;color:${PG.RiskEngine.getRiskColor(step.risk)}">${PG.RiskEngine.getRiskLabel(step.risk).toUpperCase()}</div></div><button class="btn btn-secondary btn-sm" onclick="PG.Router.go('remediation')">View Remediation</button></div>`;
};

/* ── IDENTITIES ───────────────────────────────────────────── */
PG.Pages.renderIdentities=function(){
  document.getElementById("page-identities").innerHTML=`
  <div class="page-header"><div class="page-header-row"><div><h1>Identity Inventory</h1><p>All identities with privilege level, risk score, and reachable assets.</p></div>
  <div class="flex-row">
    <select class="filter-select" id="id-type" onchange="PG.Pages._idF()"><option value="">All Types</option><option value="employee">Employees</option><option value="contractor">Contractors</option><option value="service_account">Service Accounts</option><option value="cloud_identity">Cloud Identities</option></select>
    <select class="filter-select" id="id-risk" onchange="PG.Pages._idF()"><option value="">All Risk</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
  </div></div></div>
  <div class="card"><div class="table-wrap"><table class="data-table">
    <thead><tr><th>Identity</th><th>Type</th><th>Privilege</th><th>Risk</th><th>Groups</th><th>Reachable</th><th>Crit Paths</th><th></th></tr></thead>
    <tbody id="id-tb"></tbody>
  </table></div></div>`;
  PG.Pages._idF();
};
PG.Pages._idF=function(){
  const tf=document.getElementById("id-type"),rf=document.getElementById("id-risk"); if(!tf) return;
  const t=tf.value,r=rf.value;
  const ids=PG.identities.filter(i=>(!t||i.type===t)&&(!r||PG.RiskEngine.getRiskLabel(i.risk)===r));
  const tb=document.getElementById("id-tb"); if(!tb) return;
  tb.innerHTML=ids.map(id=>`<tr onclick="PG.Pages.openIdentityDetail('${id.id}')">
    <td><div class="flex-row" style="gap:7px"><div style="width:28px;height:28px;border-radius:50%;background:${tC(id.type)}22;border:1px solid ${tC(id.type)}44;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">${tI(id.type)}</div><div><div class="name-cell">${id.name}</div><div class="text-xs text-muted">${id.email}</div></div></div></td>
    <td><span class="tag">${id.type.replace(/_/g," ")}</span></td>
    <td>${bdg(PG.RiskEngine.getRiskLabel(id.privilege==="low"?20:id.privilege==="medium"?50:id.privilege==="high"?80:100))}</td>
    <td>${rBar(id.risk)}</td><td>${id.groups}</td><td>${id.reachableAssets}</td>
    <td>${id.criticalPaths>0?`<span style="color:var(--critical);font-weight:700">${id.criticalPaths}</span>`:id.criticalPaths}</td>
    <td><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();PG.Pages.openIdentityDetail('${id.id}')">View</button></td>
  </tr>`).join("");
};
PG.Pages.openIdentityDetail=function(id){
  const i=PG.identities.find(x=>x.id===id); if(!i) return;
  PG.state.currentIdentity=i; PG.Pages._renderID(i); PG.Router.go("identity-detail");
};
PG.Pages._renderID=function(id){
  const page=document.getElementById("page-identity-detail"); if(!page) return;
  const myP=PG.attackPaths.filter(p=>p.sourceId===id.id),rc=PG.RiskEngine.getRiskColor(id.risk),rl=PG.RiskEngine.getRiskLabel(id.risk);
  page.innerHTML=`
  <div class="page-header"><div class="flex-row"><button class="btn btn-secondary btn-sm" onclick="PG.Router.go('identities')">← Back</button><h1>${id.name}</h1>${bdg(rl)}</div></div>
  <div class="grid-2" style="margin-bottom:18px">
    <div class="card"><div class="card-body">
      <div class="flex-row" style="gap:14px;margin-bottom:14px">
        <div style="width:52px;height:52px;border-radius:50%;background:${tC(id.type)}22;border:2px solid ${tC(id.type)};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${tI(id.type)}</div>
        <div><div style="font-size:18px;font-weight:800">${id.name}</div><div style="font-size:12px;color:var(--text-muted)">${id.email}</div><div class="mt-4"><span class="tag">${id.type.replace(/_/g," ")}</span></div></div>
        <div style="margin-left:auto;text-align:center"><div style="font-size:38px;font-weight:900;color:${rc};line-height:1">${id.risk}</div><div style="font-size:10px;color:var(--text-muted)">/100 RISK</div><div class="mt-4">${bdg(rl)}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px">
        ${[["Direct Perms",id.directPerms,"var(--text-primary)"],["Inherited",id.inheritedPerms,"var(--accent)"],["Groups",id.groups,"var(--low)"],["Cloud Roles",id.cloudRoles,"#06b6d4"],["Reachable",id.reachableAssets,"var(--high)"],["Crit Paths",id.criticalPaths,"var(--critical)"]].map(x=>statBox(x[0],x[1],x[2])).join("")}
      </div>
      ${sep()}<div class="flex-row" style="gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="PG.state.simIdentity='${id.id}';PG.Router.go('simulator')">⚡ Simulate Compromise</button>
        <button class="btn btn-secondary" onclick="PG.Router.go('attack-paths')">Attack Paths</button>
      </div>
    </div></div>
    <div class="card"><div class="card-header"><h2>Relationships</h2></div>
      <div class="card-body" style="padding:10px">
        <div id="id-rel-g" style="height:230px;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;overflow:hidden"></div>
        <div class="mt-8" id="id-rel-list"></div>
      </div></div>
  </div>
  <div class="card"><div class="card-header"><h2>Attack Paths from ${id.name}</h2><span>${myP.length} paths</span></div>
    <div class="card-body">
      ${myP.length===0?'<div class="empty-state"><h3>No Attack Paths Found</h3></div>':myP.map(p=>`<div class="attack-path-card ${p.severity} mt-8" onclick="PG.Pages.openPathDetail('${p.id}')">${bdg(p.severity)}<div class="path-chain mt-8">${pChain(p.steps)}</div><p class="text-xs text-secondary mt-8">${p.description}</p></div>`).join("")}
    </div></div>`;
  setTimeout(()=>{
    const myR=PG.relationships.filter(r=>r.source===id.id);
    const nodes=[{id:id.id,name:id.name,type:id.type},...myR.map(r=>({id:r.target,name:PG.Graph.rLabel(r.target),type:PG.Graph.rType(r.target)}))];
    PG.Graph.renderNetworkGraph("id-rel-g",nodes,myR.map(r=>({source:r.source,target:r.target,type:r.type})));
    const ll=document.getElementById("id-rel-list");
    if(ll) ll.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:5px">${myR.map(r=>`<span class="tag"><span style="color:var(--accent)">${r.type}</span> → ${PG.Graph.rLabel(r.target)}</span>`).join("")}</div>`;
  },50);
};

/* ── GROUPS ───────────────────────────────────────────────── */
PG.Pages.renderGroups=function(){
  document.getElementById("page-groups").innerHTML=`
  <div class="page-header"><h1>Groups &amp; Permissions</h1><p>Group membership hierarchy, nested groups, and privilege inheritance risks.</p></div>
  <div class="grid-2" style="margin-bottom:20px">
    <div class="card"><div class="card-header"><h2>Group Inventory</h2><span>${PG.groups.length} groups</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Group</th><th>Members</th><th>Nested</th><th>Perms</th><th>Risk</th></tr></thead>
      <tbody>${PG.groups.map(g=>`<tr onclick="PG.Pages._showGrp('${g.id}')"><td><div class="flex-row" style="gap:6px"><span style="font-size:14px">👥</span><span class="name-cell">${g.name}</span></div></td><td>${g.members}</td><td>${g.nestedGroups}</td><td>${g.permissions}</td><td>${rBar(g.risk)}</td></tr>`).join("")}</tbody>
      </table></div></div>
    <div>
      <div class="card mb-16"><div class="card-header"><h2>Nested Hierarchy</h2></div><div class="card-body" id="grp-hier"></div></div>
      <div class="card" id="grp-detail"><div class="card-header"><h2>Group Details</h2></div><div class="card-body"><div class="empty-state" style="padding:20px"><div style="font-size:24px;margin-bottom:6px">👥</div><h3>Select a Group</h3></div></div></div>
    </div>
  </div>
  <div class="card"><div class="card-header"><h2>⚠ Privilege Escalation via Nested Groups</h2></div><div class="card-body">
    ${PG.groupHierarchy.map(h=>`<div style="background:var(--bg-elevated);border:1px solid rgba(249,115,22,.2);border-radius:8px;padding:12px;margin-bottom:10px"><div class="flex-row" style="gap:8px;flex-wrap:wrap">${bdg("high")}<span class="name-cell">${(PG.groups.find(x=>x.id===h.parent)||{name:h.parent}).name}</span><span class="text-muted">← contains</span><span class="name-cell">${(PG.groups.find(x=>x.id===h.child)||{name:h.child}).name}</span></div><p class="text-xs text-secondary mt-8">${h.note}</p></div>`).join("")}
  </div></div>`;
  const el=document.getElementById("grp-hier");
  if(el) el.innerHTML=["application-support","cloud-ops","hr-staff"].map(gid=>{const g=PG.groups.find(x=>x.id===gid);if(!g)return"";return `<div style="margin-bottom:14px"><div class="flex-row" style="gap:6px;margin-bottom:6px"><span style="font-size:14px">👥</span><span style="font-weight:600">${g.name}</span>${rBar(g.risk)}</div>${PG.groupHierarchy.filter(h=>h.parent===gid).map(c=>{const ch=PG.groups.find(x=>x.id===c.child)||{name:c.child};return `<div style="margin-left:20px;padding:5px 10px;background:var(--bg-elevated);border:1px solid var(--border);border-left:2px solid var(--accent);border-radius:0 6px 6px 0;margin-bottom:4px"><span class="text-xs text-secondary">└ 👥 ${ch.name}</span></div>`;}).join("")}</div>`;}).join("");
};
PG.Pages._showGrp=function(gid){
  const g=PG.groups.find(x=>x.id===gid); if(!g) return;
  const el=document.getElementById("grp-detail"); if(!el) return;
  el.innerHTML=`<div class="card-header"><h2>${g.name}</h2>${rBar(g.risk)}</div><div class="card-body"><p class="text-sm text-secondary" style="line-height:1.6;margin-bottom:12px">${g.description}</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[["Members",g.members,"var(--text-primary)"],["Nested",g.nestedGroups,"var(--accent)"],["Permissions",g.permissions,"var(--high)"],["Risk",g.risk,PG.RiskEngine.getRiskColor(g.risk)]].map(x=>statBox(x[0],x[1],x[2])).join("")}</div></div>`;
};

/* ── CLOUD ROLES ──────────────────────────────────────────── */
PG.Pages.renderCloudRoles=function(){
  document.getElementById("page-cloud-roles").innerHTML=`
  <div class="page-header"><h1>Cloud Roles</h1><p>Cloud identity relationships, delegated permissions, and critical asset exposure.</p></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">
    ${PG.cloudRoles.map(r=>`<div class="rem-card" style="cursor:pointer" onclick="PG.Pages._showCR('${r.id}')"><div class="flex-between mb-8"><div class="flex-row" style="gap:8px"><span style="font-size:20px">☁</span><div><div style="font-weight:600">${r.name}</div><div style="font-size:10px;color:var(--text-muted)">${r.provider}</div></div></div>${bdg(PG.RiskEngine.getRiskLabel(r.risk))}</div>${rBar(r.risk)}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">${[["Assigned",r.assignedIdentities,"var(--accent)"],["Delegated",r.delegatedPerms,"var(--high)"],["Assets",r.criticalAssets,"var(--critical)"]].map(x=>statBox(x[0],x[1],x[2])).join("")}</div></div>`).join("")}
  </div>
  <div class="card" id="cr-detail"><div class="card-header"><h2>Role Details</h2></div><div class="card-body"><div class="empty-state" style="padding:20px"><div style="font-size:24px;margin-bottom:6px">☁</div><h3>Select a Cloud Role</h3></div></div></div>`;
};
PG.Pages._showCR=function(roleId){
  const r=PG.cloudRoles.find(x=>x.id===roleId); if(!r) return;
  const el=document.getElementById("cr-detail"); if(!el) return;
  const reach=PG.relationships.filter(rel=>rel.source===roleId&&PG.assets.find(a=>a.id===rel.target));
  el.innerHTML=`<div class="card-header"><h2>${r.name}</h2>${bdg(PG.RiskEngine.getRiskLabel(r.risk))}${rBar(r.risk)}</div><div class="card-body"><p class="text-sm text-secondary" style="line-height:1.6;margin-bottom:14px">${r.description}</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">${[["Provider",r.provider,"var(--accent)"],["Assigned",r.assignedIdentities,"var(--text-primary)"],["Delegated Perms",r.delegatedPerms,"var(--high)"]].map(x=>statBox(x[0],x[1],x[2])).join("")}</div><div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Reachable Assets</div>${reach.length?reach.map(rel=>{const a=PG.assets.find(x=>x.id===rel.target);return a?`<div class="flex-row" style="padding:7px;background:var(--bg-elevated);border-radius:6px;margin-bottom:4px;gap:8px"><span style="color:var(--critical)">◈</span><span class="name-cell">${a.name}</span>${bdg(a.criticality)}</div>`:"";}).join(""):`<p class="text-xs text-muted">No direct asset access.</p>`}</div>`;
};

/* ── ASSETS ───────────────────────────────────────────────── */
PG.Pages.renderAssets=function(){
  const g={critical:PG.assets.filter(a=>a.criticality==="critical"),high:PG.assets.filter(a=>a.criticality==="high"),medium:PG.assets.filter(a=>a.criticality==="medium")};
  document.getElementById("page-assets").innerHTML=`
  <div class="page-header"><h1>Critical Assets</h1><p>Enterprise assets grouped by criticality with reachable identities and attack path counts.</p></div>
  ${["critical","high","medium"].map(crit=>g[crit].length===0?"":`<div style="margin-bottom:20px"><div class="flex-row" style="margin-bottom:10px">${bdg(crit)}<span class="text-xs text-muted">${g[crit].length} assets</span></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px">${g[crit].map(a=>`<div class="rem-card" style="cursor:pointer" onclick="PG.Pages._showAsset('${a.id}')"><div class="flex-between mb-8"><div class="flex-row" style="gap:8px"><span style="font-size:18px;color:var(--critical)">◈</span><span style="font-weight:600">${a.name}</span></div>${bdg(a.criticality)}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">${[["Identities",a.reachableIdentities,"var(--accent)"],["Paths",a.attackPaths,"var(--high)"],["Max Risk",a.maxRisk,PG.RiskEngine.getRiskColor(a.maxRisk)]].map(x=>statBox(x[0],x[1],x[2])).join("")}</div><p class="text-xs text-secondary" style="margin-bottom:8px">${a.action}</p><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();PG.Pages._showAsset('${a.id}')">View Details</button></div>`).join("")}</div></div>`).join("")}`;
};
PG.Pages._showAsset=function(assetId){
  const a=PG.assets.find(x=>x.id===assetId); if(!a) return;
  const paths=PG.attackPaths.filter(p=>p.targetId===assetId);
  document.getElementById("modal-title").textContent=a.name;
  document.getElementById("modal-body").innerHTML=`<div class="flex-row" style="margin-bottom:14px;flex-wrap:wrap;gap:8px">${bdg(a.criticality)}<span class="tag">Risk: ${a.maxRisk}/100</span><span class="tag">${a.reachableIdentities} identities</span><span class="tag">${a.attackPaths} paths</span></div><div style="background:var(--bg-elevated);border-radius:8px;padding:12px;margin-bottom:14px;font-size:12.5px;color:var(--text-secondary);line-height:1.7"><strong style="color:var(--high)">Recommended Action:</strong> ${a.action}</div>${paths.length?paths.map(p=>`<div class="attack-path-card ${p.severity} mt-8" onclick="PG.Pages.openPathDetail('${p.id}');PG.Pages._closeModal()"><div class="flex-between">${bdg(p.severity)}<span class="text-xs text-muted">${p.hops} hops · Risk: ${p.risk}</span></div><div class="path-chain mt-8">${pChain(p.steps)}</div></div>`).join(""):`<p class="text-xs text-muted">No pre-computed paths.</p>`}`;
  document.getElementById("modal-overlay").classList.add("open");
};
PG.Pages._closeModal=function(){document.getElementById("modal-overlay").classList.remove("open");};

/* ── SIMULATOR ────────────────────────────────────────────── */
PG.Pages.renderSimulator=function(){
  const pre=PG.state.simIdentity||"john-doe"; PG.state.simIdentity=null;
  document.getElementById("page-simulator").innerHTML=`
  <div class="page-header"><h1>Compromise Simulator</h1><p>Safely model the potential impact of a compromised identity without touching production systems.</p></div>
  <div style="background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px"><span style="font-size:16px">🛡</span><span class="text-sm" style="color:var(--accent)">Analysis Mode — No production systems are accessed or modified.</span></div>
  <div class="card"><div class="card-header"><h2>Configure Simulation</h2></div><div class="card-body">
    <div class="sim-form">
      <div class="sim-field"><label>Select Identity</label><select class="sim-select" id="sim-id">${PG.identities.map(i=>`<option value="${i.id}"${i.id===pre?" selected":""}>${i.name} — ${i.email}</option>`).join("")}</select></div>
      <div class="sim-field"><label>Target Scope</label><select class="sim-select" id="sim-scope"><option value="all">All Critical Assets</option><option value="finance">Finance</option><option value="hr">HR</option><option value="cloud">Cloud</option></select></div>
      <div class="sim-field"><label>Initial Access Method</label><div id="sim-access">${[["phishing","Phishing","Email-based credential capture"],["credential_theft","Credential Theft","Leaked or brute-forced credentials"],["token_compromise","Token Compromise","OAuth token or API key theft"],["insider","Insider Scenario","Malicious insider with valid credentials"]].map((a,i)=>`<label class="radio-option${i===0?" selected":""}" onclick="this.parentElement.querySelectorAll('.radio-option').forEach(x=>x.classList.remove('selected'));this.classList.add('selected');this.querySelector('input').checked=true"><input type="radio" name="access" value="${a[0]}"${i===0?" checked":""}><div><div style="font-weight:600;font-size:12px">${a[1]}</div><div style="font-size:10px;color:var(--text-muted)">${a[2]}</div></div></label>`).join("")}</div></div>
      <div class="sim-field"><label>Identity Preview</label><div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:14px" id="sim-preview"></div></div>
    </div>
    ${sep()}<div class="flex-row" style="justify-content:center"><button class="btn btn-primary btn-lg" onclick="PG.Pages._runSim()">⚡ SIMULATE COMPROMISE</button></div>
  </div></div>
  <div id="sim-results"></div>`;
  const si=document.getElementById("sim-id");
  if(si){si.addEventListener("change",()=>PG.Pages._simPrev());PG.Pages._simPrev();}
};
PG.Pages._simPrev=function(){
  const el=document.getElementById("sim-preview"); if(!el) return;
  const id=PG.identities.find(i=>i.id===document.getElementById("sim-id")?.value); if(!id) return;
  el.innerHTML=`<div class="flex-row" style="gap:10px;margin-bottom:8px"><div style="width:32px;height:32px;border-radius:50%;background:${tC(id.type)}22;border:1px solid ${tC(id.type)};display:flex;align-items:center;justify-content:center;font-size:14px">${tI(id.type)}</div><div><div style="font-weight:600">${id.name}</div><div class="text-xs text-muted">${id.email}</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><div class="text-xs">Privilege: <strong style="color:${PG.RiskEngine.getRiskColor(id.risk)}">${id.privilege.toUpperCase()}</strong></div><div class="text-xs">Risk: <strong style="color:${PG.RiskEngine.getRiskColor(id.risk)}">${id.risk}/100</strong></div><div class="text-xs">Groups: <strong>${id.groups}</strong></div><div class="text-xs">Known Paths: <strong>${PG.attackPaths.filter(p=>p.sourceId===id.id).length}</strong></div></div>`;
};
PG.Pages._runSim=function(){
  const identityId=document.getElementById("sim-id").value,scope=document.getElementById("sim-scope").value||"all",access=(document.querySelector("#sim-access input:checked")||{value:"phishing"}).value;
  const re=document.getElementById("sim-results"); re.style.display="block";
  re.innerHTML=`<div class="card mt-16"><div class="card-header"><h2>Running Simulation…</h2></div><div class="card-body" id="sim-steps">${PG.SimulationEngine.steps.map((s,i)=>`<div class="sim-step" id="ss-${i}"><svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#334155" stroke-width="1.5"/></svg><span>${s}</span></div>`).join("")}</div></div>`;
  let idx=0;
  const iv=setInterval(()=>{
    if(idx<PG.SimulationEngine.steps.length){const el=document.getElementById(`ss-${idx}`);if(el){el.classList.add("done");el.querySelector("svg").innerHTML='<circle cx="8" cy="8" r="6" fill="#22c55e22" stroke="#22c55e" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';}}idx++;
    if(idx>=PG.SimulationEngine.steps.length){clearInterval(iv);setTimeout(()=>PG.Pages._showSimResult(identityId,access,scope),300);}
  },350);
};
PG.Pages._showSimResult=function(identityId,access,scope){
  const result=PG.SimulationEngine.simulate(identityId,access,scope); if(!result) return;
  PG.state.simResult=result;
  // Save to Firestore if connected
  if(window.PG_saveSimulation) window.PG_saveSimulation(result);
  document.getElementById("sim-results").innerHTML=`
  <div class="card mt-16"><div class="card-header"><svg viewBox="0 0 16 16" width="15" fill="none" stroke="#22c55e" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M5 8l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg><h2>Simulation Complete — ${result.identity.name}</h2>${bdg(PG.RiskEngine.getRiskLabel(result.maxRisk))}</div>
  <div class="card-body">
    <div class="sim-result-grid">
      <div class="sim-result-card"><div class="sim-result-value" style="color:var(--critical)">${result.criticalPaths}</div><div class="sim-result-label">Critical Paths</div></div>
      <div class="sim-result-card"><div class="sim-result-value" style="color:var(--high)">${result.escalationOpportunities}</div><div class="sim-result-label">Privilege Escalations</div></div>
      <div class="sim-result-card"><div class="sim-result-value" style="color:var(--medium)">${result.reachableAssets}</div><div class="sim-result-label">Reachable Assets</div></div>
      <div class="sim-result-card"><div class="sim-result-value" style="color:${PG.RiskEngine.getRiskColor(result.maxRisk)}">${result.maxRisk}</div><div class="sim-result-label">Maximum Risk</div></div>
    </div>
    ${sep()}<div class="flex-row" style="gap:10px;flex-wrap:wrap;justify-content:center">
      <button class="btn btn-primary" onclick="PG.Pages._simPaths(false)">View All Paths</button>
      <button class="btn btn-secondary" onclick="PG.Pages._simPaths(true)">Critical Paths Only</button>
      <button class="btn btn-danger" onclick="PG.Router.go('remediation')">View Remediation</button>
    </div>
  </div></div>
  <div id="sim-path-list"></div>`;
};
PG.Pages._simPaths=function(critOnly){
  const result=PG.state.simResult; if(!result) return;
  const paths=critOnly?result.paths.filter(p=>p.severity==="critical"):result.paths;
  const el=document.getElementById("sim-path-list"); if(!el) return;
  if(!paths.length){el.innerHTML=`<div class="empty-state mt-16"><h3>No${critOnly?" Critical":""} Paths Found</h3></div>`;return;}
  el.innerHTML=`<div class="card mt-16"><div class="card-header"><h2>${critOnly?"Critical":"Discovered"} Attack Paths</h2><span>${paths.length} paths</span></div><div class="card-body">${paths.map(p=>`<div class="attack-path-card ${p.severity} mt-8" onclick="PG.Pages.openPathDetail('${p.id}')">${bdg(p.severity)}<div class="path-chain mt-8">${pChain(p.steps)}</div><p class="text-xs text-secondary mt-8">${p.description}</p></div>`).join("")}</div></div>`;
};
