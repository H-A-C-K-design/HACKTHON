// PathGuard — SVG Graph Renderer
window.PG = window.PG || {};
PG.Graph = {
  NC:{
    employee:       {c:"#3b82f6",i:"👤",l:"User",           b:"#1e3a5f"},
    contractor:     {c:"#8b5cf6",i:"🔗",l:"Contractor",     b:"#2e1f5e"},
    service_account:{c:"#f97316",i:"⚙", l:"Service Account",b:"#4a2010"},
    cloud_role:     {c:"#06b6d4",i:"☁", l:"Cloud Role",     b:"#0c3344"},
    cloud_identity: {c:"#06b6d4",i:"☁", l:"Cloud Identity", b:"#0c3344"},
    group:          {c:"#22c55e",i:"👥",l:"Group",           b:"#0f2d1a"},
    application:    {c:"#a78bfa",i:"◈", l:"Application",    b:"#2a1f4a"},
    asset:          {c:"#ef4444",i:"◈", l:"Critical Asset", b:"#3d0f0f"},
    default:        {c:"#94a3b8",i:"○", l:"Node",           b:"#1e2940"},
  },
  RC:{MEMBER_OF:"#22c55e",INHERITS:"#3b82f6",CAN_ACCESS:"#f97316",CAN_DELEGATE:"#ef4444",MANAGES:"#a78bfa",ASSIGNED_TO:"#06b6d4",default:"#64748b"},

  rType(id){
    const i=PG.identities.find(x=>x.id===id); if(i) return i.type;
    if(PG.assets.find(x=>x.id===id)) return "asset";
    if(PG.groups.find(x=>x.id===id)) return "group";
    if(PG.cloudRoles.find(x=>x.id===id)) return "cloud_role";
    if(id.includes("app")||id.includes("portal")) return "application";
    return "default";
  },
  rLabel(id){
    const i=PG.identities.find(x=>x.id===id); if(i) return i.name;
    const a=PG.assets.find(x=>x.id===id);     if(a) return a.name;
    const g=PG.groups.find(x=>x.id===id);     if(g) return g.name;
    const r=PG.cloudRoles.find(x=>x.id===id); if(r) return r.name;
    return id.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  },

  renderPathGraph(cid, steps, sel=-1) {
    const el=document.getElementById(cid); if(!el) return;
    const W=el.clientWidth||680,nW=150,nH=58,gY=72;
    const H=steps.length*(nH+gY)+30, cx=W/2;
    let s=`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
    s+=`<defs><marker id="pg-a" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#475569"/></marker></defs>`;
    steps.forEach((step,i)=>{
      const x=cx-nW/2,y=10+i*(nH+gY);
      const type=step.type||this.rType(step.node);
      const cfg=this.NC[type]||this.NC.default;
      const stroke=sel===i?"#fff":cfg.c, sw=sel===i?2.5:1.5;
      if(i>0){
        const py=10+(i-1)*(nH+gY)+nH;
        const rk=step.relType==="delegation"?"CAN_DELEGATE":step.relType==="membership"?"MEMBER_OF":step.relType==="access"?"CAN_ACCESS":step.relType==="inheritance"?"INHERITS":"default";
        const rc=this.RC[rk]||"#475569";
        s+=`<line x1="${cx}" y1="${py}" x2="${cx}" y2="${y-2}" stroke="${rc}" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#pg-a)"/>`;
        if(step.relationship){const ly=py+(y-py)/2;s+=`<rect x="${cx-46}" y="${ly-9}" width="92" height="18" rx="9" fill="#1a2540" stroke="${rc}" stroke-width="1"/><text x="${cx}" y="${ly+4}" text-anchor="middle" font-size="9" font-family="Inter,sans-serif" font-weight="600" fill="${rc}" letter-spacing="0.5">${step.relationship}</text>`;}
      }
      s+=`<rect x="${x}" y="${y}" width="${nW}" height="${nH}" rx="8" fill="${cfg.b}" stroke="${stroke}" stroke-width="${sw}" style="cursor:pointer" onclick="PG.Graph._sc(${i})"/>`;
      s+=`<text x="${x+12}" y="${y+24}" font-size="14" font-family="sans-serif">${cfg.i}</text>`;
      const lbl=(step.label||this.rLabel(step.node)).slice(0,17).replace(/(.{16}).+/,"$1…");
      s+=`<text x="${x+32}" y="${y+22}" font-size="11" font-family="Inter,sans-serif" font-weight="600" fill="#e2e8f0">${lbl}</text>`;
      s+=`<text x="${x+32}" y="${y+37}" font-size="9" font-family="Inter,sans-serif" fill="${cfg.c}" font-weight="500">${cfg.l.toUpperCase()}</text>`;
      if(step.risk){const rc2=step.risk>=90?"#ef4444":step.risk>=70?"#f97316":step.risk>=40?"#eab308":"#22c55e";s+=`<rect x="${x+nW-36}" y="${y+nH-18}" width="32" height="14" rx="7" fill="${rc2}22" stroke="${rc2}" stroke-width="1"/><text x="${x+nW-20}" y="${y+nH-7}" text-anchor="middle" font-size="8" font-family="Inter,sans-serif" font-weight="700" fill="${rc2}">${step.risk}</text>`;}
    });
    s+="</svg>"; el.innerHTML=s;
  },
  _sc(i){document.dispatchEvent(new CustomEvent("pg:stepclick",{detail:{index:i}}));},

  renderNetworkGraph(cid, nodes, edges){
    const el=document.getElementById(cid); if(!el) return;
    const W=el.clientWidth||500,H=el.clientHeight||240;
    const layers=this._layers(nodes,edges),pos=this._layout(layers,W,H);
    let s=`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
    s+=`<defs><marker id="na" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0 0,6 2.5,0 5" fill="#334155"/></marker></defs>`;
    edges.forEach(e=>{const a=pos[e.source],b=pos[e.target];if(!a||!b)return;const rc=this.RC[e.type]||"#334155";s+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${rc}" stroke-width="1" opacity="0.5" marker-end="url(#na)"/>`;});
    nodes.forEach(n=>{const p=pos[n.id];if(!p)return;const type=n.type||this.rType(n.id);const cfg=this.NC[type]||this.NC.default;const r=type==="asset"?20:14;s+=`<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${cfg.b}" stroke="${cfg.c}" stroke-width="1.5"/>`;s+=`<text x="${p.x}" y="${p.y+4}" text-anchor="middle" font-size="${r>16?12:9}" font-family="sans-serif">${cfg.i}</text>`;const lbl=(n.name||this.rLabel(n.id)).slice(0,10);s+=`<text x="${p.x}" y="${p.y+r+12}" text-anchor="middle" font-size="9" font-family="Inter,sans-serif" fill="#94a3b8">${lbl}</text>`;});
    s+="</svg>"; el.innerHTML=s;
  },

  _layers(nodes,edges){
    const deg={}; nodes.forEach(n=>deg[n.id]=0); edges.forEach(e=>{if(deg[e.target]!==undefined)deg[e.target]++;});
    const layers=[]; let rem=[...nodes];
    while(rem.length){const layer=rem.filter(n=>(deg[n.id]||0)===0);if(!layer.length){layers.push(rem);break;}layers.push(layer);const ids=new Set(layer.map(n=>n.id));rem=rem.filter(n=>!ids.has(n.id));edges.forEach(e=>{if(ids.has(e.source)&&deg[e.target]!==undefined)deg[e.target]--;});}
    return layers;
  },
  _layout(layers,W,H){
    const pos={},px=50,py=40,uh=H-py*2,lh=layers.length>1?uh/(layers.length-1):uh/2;
    layers.forEach((layer,li)=>{const y=py+li*lh,uw=W-px*2;layer.forEach((n,ni)=>{const x=layer.length===1?W/2:px+(uw/(layer.length-1||1))*ni;pos[n.id]={x:Math.round(x),y:Math.round(y)};});});
    return pos;
  },
};
