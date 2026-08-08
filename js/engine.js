// PathGuard — Risk, Attack Path & Simulation Engines
window.PG = window.PG || {};

PG.RiskEngine = {
  getRiskLabel: s => s>=90?"critical":s>=70?"high":s>=40?"medium":"low",
  getRiskColor: s => s>=90?"#ef4444":s>=70?"#f97316":s>=40?"#eab308":"#22c55e",
};

PG.AttackPathEngine = {
  findPaths(sourceId, maxHops=8) {
    const visited = new Set(), queue = [{id:sourceId,path:[sourceId],edges:[]}], results = [];
    while (queue.length) {
      const {id,path,edges} = queue.shift();
      if (path.length > maxHops) continue;
      PG.relationships.filter(r=>r.source===id).forEach(rel=>{
        const key = rel.target+"|"+path.join("|");
        if (visited.has(key)) return;
        visited.add(key);
        const np=[...path,rel.target], ne=[...edges,rel];
        const asset = PG.assets.find(a=>a.id===rel.target);
        if (asset) results.push({path:np,edges:ne,target:asset});
        queue.push({id:rel.target,path:np,edges:ne});
      });
    }
    return results;
  },
  getReachableAssets(sourceId) {
    const seen={}, out=[];
    this.findPaths(sourceId).forEach(p=>{ if(!seen[p.target.id]){seen[p.target.id]=true;out.push(p.target);} });
    return out;
  },
};

PG.SimulationEngine = {
  steps: ["Identity loaded","Group memberships analyzed","Inherited permissions analyzed","Service accounts analyzed","Cloud roles analyzed","Attack paths calculated","Critical assets evaluated"],
  simulate(identityId, accessType="phishing", targetScope="all") {
    const identity = PG.identities.find(i=>i.id===identityId);
    if (!identity) return null;
    let paths = PG.attackPaths.filter(p=>p.sourceId===identityId);
    if (targetScope && targetScope!=="all") {
      const sm = {finance:["finance-db","payroll-system","finance-app"],hr:["hr-portal"],cloud:["secrets-vault"]};
      const si = sm[targetScope]||[];
      if (si.length) paths = paths.filter(p=>si.includes(p.targetId));
    }
    const reachable = PG.AttackPathEngine.getReachableAssets(identityId);
    const crit = paths.filter(p=>p.severity==="critical").length;
    const maxRisk = paths.length ? Math.max(...paths.map(p=>p.risk)) : identity.risk;
    return {
      identity, paths, accessType, targetScope,
      reachableAssets: reachable.length || identity.reachableAssets,
      criticalPaths: crit, maxRisk,
      escalationOpportunities: Math.min(Math.max(paths.length*4, identity.reachableAssets+crit*5, 5), 99),
    };
  },
};
