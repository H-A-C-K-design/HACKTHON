// PathGuard — Employee / Identity Manager
// Handles CRUD for employees, real-time risk recalculation, and Firestore sync
window.PG = window.PG || {};

PG.EmployeeManager = {

  /* ── Default blank template for new employees ── */
  _blank() {
    return {
      id: 'emp-' + Date.now(),
      name: '',
      email: '',
      type: 'employee',
      privilege: 'low',
      risk: 30,
      groups: 1,
      reachableAssets: 2,
      cloudRoles: 0,
      directPerms: 2,
      inheritedPerms: 5,
      criticalPaths: 0,
      department: '',
      notes: '',
    };
  },

  /* ── Compute risk score from privilege + groups + cloudRoles ── */
  _calcRisk(emp) {
    const base = { low: 20, medium: 45, high: 72, critical: 95 }[emp.privilege] || 20;
    const bonus = Math.min(emp.groups * 4 + emp.cloudRoles * 6 + emp.directPerms * 2, 60);
    return Math.min(base + bonus, 99);
  },

  /* ── Sync identity record + rebuild attack paths ── */
  _syncIdentity(emp) {
    emp.risk = this._calcRisk(emp);
    const idx = PG.identities.findIndex(i => i.id === emp.id);
    if (idx >= 0) PG.identities[idx] = emp;
    else PG.identities.push(emp);
    // Recalculate KPIs
    PG.kpis.totalIdentities = PG.identities.length +
      (PG.kpis.totalIdentities > PG.identities.length ? PG.kpis.totalIdentities - PG.identities.length : 0);
    PG.kpis.highRiskIdentities = PG.identities.filter(i => i.risk >= 70).length;
    this._persistToFirestore(emp, 'set');
  },

  /* ── Persist to Firestore if connected ── */
  async _persistToFirestore(emp, op = 'set') {
    if (!window.__PG_FIRESTORE__) return;
    try {
      const { doc, setDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      const db = window.__PG_FIRESTORE__;
      if (op === 'delete') await deleteDoc(doc(db, 'identities', emp.id));
      else await setDoc(doc(db, 'identities', emp.id), { ...emp });
      PG.UI?.showToast(op === 'delete' ? 'Employee deleted ✓' : 'Employee saved to Firestore ✓', 'success');
    } catch (e) { console.warn('[EmployeeManager] Firestore:', e.message); }
  },

  /* ── Add new employee ── */
  add(empData) {
    const emp = { ...this._blank(), ...empData };
    emp.risk = this._calcRisk(emp);
    PG.identities.push(emp);
    PG.kpis.totalIdentities++;
    if (emp.risk >= 70) PG.kpis.highRiskIdentities++;
    this._persistToFirestore(emp, 'set');
    PG.UI?.showToast(`Employee "${emp.name}" added ✓`, 'success');
    return emp;
  },

  /* ── Update existing ── */
  update(id, changes) {
    const emp = PG.identities.find(i => i.id === id);
    if (!emp) return null;
    const wasHigh = emp.risk >= 70;
    Object.assign(emp, changes);
    emp.risk = this._calcRisk(emp);
    const isHigh = emp.risk >= 70;
    if (!wasHigh && isHigh) PG.kpis.highRiskIdentities++;
    if (wasHigh && !isHigh) PG.kpis.highRiskIdentities--;
    this._persistToFirestore(emp, 'set');
    PG.UI?.showToast(`Employee "${emp.name}" updated ✓`, 'success');
    return emp;
  },

  /* ── Delete ── */
  delete(id) {
    const idx = PG.identities.findIndex(i => i.id === id);
    if (idx < 0) return;
    const emp = PG.identities[idx];
    if (emp.risk >= 70) PG.kpis.highRiskIdentities--;
    PG.kpis.totalIdentities--;
    PG.identities.splice(idx, 1);
    // Remove attack paths sourced from this identity
    PG.attackPaths = PG.attackPaths.filter(p => p.sourceId !== id);
    // Remove relationships
    PG.relationships = PG.relationships.filter(r => r.source !== id && r.target !== id);
    this._persistToFirestore(emp, 'delete');
    PG.UI?.showToast(`Employee "${emp.name}" removed`, 'info');
  },

  /* ══════════════════════════════════════
     RENDER — Full-page Employee Manager
  ════════════════════════════════════════ */
  render(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1>Employee &amp; Identity Manager</h1>
          <p>Add, edit, or remove identities. Changes propagate to attack paths and simulations in real-time.</p>
        </div>
        <div class="flex-row">
          <button class="btn btn-primary" id="emp-add-btn" onclick="PG.EmployeeManager.openModal()">
            + Add Employee
          </button>
        </div>
      </div>
    </div>

    <!-- Live Attack Threat Indicator -->
    <div id="emp-threat-banner" style="display:none;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:10px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;animation:pulseDot 1.2s infinite;flex-shrink:0"></span>
      <span id="emp-threat-text" style="font-size:12px;color:#ef4444;font-weight:600"></span>
    </div>

    <!-- Quick stats bar -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px" id="emp-stats">
    </div>

    <!-- Filters -->
    <div class="filters-bar" style="margin-bottom:14px">
      <span class="filter-label">Filter by Type</span>
      <select class="filter-select" id="emp-f-type" onchange="PG.EmployeeManager._filter()">
        <option value="">All Types</option>
        <option value="employee">Employees</option>
        <option value="contractor">Contractors</option>
        <option value="service_account">Service Accounts</option>
        <option value="cloud_identity">Cloud Identities</option>
      </select>
      <span class="filter-label">Risk</span>
      <select class="filter-select" id="emp-f-risk" onchange="PG.EmployeeManager._filter()">
        <option value="">All Risk</option>
        <option value="critical">Critical ≥ 90</option>
        <option value="high">High ≥ 70</option>
        <option value="medium">Medium ≥ 40</option>
        <option value="low">Low &lt; 40</option>
      </select>
      <input type="text" class="filter-select" id="emp-f-search" placeholder="Search name / email…"
        oninput="PG.EmployeeManager._filter()" style="width:200px">
      <button class="btn btn-secondary btn-sm" onclick="PG.EmployeeManager._clearFilters()">Reset</button>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Privilege</th>
              <th>Department</th>
              <th>Risk</th>
              <th>Groups</th>
              <th>Reachable Assets</th>
              <th>Can Attack?</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="emp-tb"></tbody>
        </table>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div id="emp-modal-overlay" onclick="if(event.target===this)PG.EmployeeManager.closeModal()"
      style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:1000;align-items:center;justify-content:center">
      <div id="emp-modal" style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:28px;width:600px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
          <h2 id="emp-modal-title" style="font-size:18px;font-weight:800;color:var(--text-primary)">Add Employee</h2>
          <button onclick="PG.EmployeeManager.closeModal()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted)">✕</button>
        </div>
        <div id="emp-modal-body"></div>
      </div>
    </div>`;

    this._renderStats();
    this._filter();
    this._startThreatPulse();
  },

  /* ── Stats bar ── */
  _renderStats() {
    const el = document.getElementById('emp-stats'); if (!el) return;
    const ids = PG.identities;
    const emp  = ids.filter(i => i.type === 'employee').length;
    const svc  = ids.filter(i => i.type === 'service_account').length;
    const hiR  = ids.filter(i => i.risk >= 70).length;
    const crit = ids.filter(i => i.risk >= 90).length;
    el.innerHTML = [
      ['👤', 'Employees', emp, 'var(--accent-blue)'],
      ['⚙', 'Service Accounts', svc, 'var(--high)'],
      ['🔴', 'High-Risk Identities', hiR, 'var(--critical)'],
      ['⚡', 'Critical Threat Actors', crit, '#ef4444'],
    ].map(([icon, label, val, col]) => `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:22px;margin-bottom:4px">${icon}</div>
        <div style="font-size:22px;font-weight:800;color:${col}">${val}</div>
        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">${label}</div>
      </div>`).join('');
  },

  /* ── Live threat pulse ── */
  _startThreatPulse() {
    const checkThreat = () => {
      const high = PG.identities.filter(i => i.risk >= 90);
      const banner = document.getElementById('emp-threat-banner');
      const text = document.getElementById('emp-threat-text');
      if (!banner || !text) return;
      if (high.length > 0) {
        banner.style.display = 'flex';
        text.textContent = `⚠ LIVE THREAT: ${high.length} critical identity${high.length > 1 ? 'ies' : 'y'} detected — ${high.map(i => i.name).join(', ')} — can reach critical assets!`;
      } else {
        banner.style.display = 'none';
      }
    };
    checkThreat();
    clearInterval(this._threatInterval);
    this._threatInterval = setInterval(checkThreat, 3000);
  },

  /* ── Filter table ── */
  _filter() {
    const type   = document.getElementById('emp-f-type')?.value || '';
    const risk   = document.getElementById('emp-f-risk')?.value || '';
    const search = (document.getElementById('emp-f-search')?.value || '').toLowerCase();
    let ids = PG.identities.filter(i => {
      if (type && i.type !== type) return false;
      if (risk) {
        const r = i.risk;
        if (risk === 'critical' && r < 90) return false;
        if (risk === 'high'     && (r < 70 || r >= 90)) return false;
        if (risk === 'medium'   && (r < 40 || r >= 70)) return false;
        if (risk === 'low'      && r >= 40) return false;
      }
      if (search && !i.name.toLowerCase().includes(search) && !i.email.toLowerCase().includes(search)) return false;
      return true;
    });
    this._renderTable(ids);
  },

  _clearFilters() {
    ['emp-f-type','emp-f-risk'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const s = document.getElementById('emp-f-search'); if (s) s.value = '';
    this._filter();
  },

  /* ── Render table rows ── */
  _renderTable(ids) {
    const tb = document.getElementById('emp-tb'); if (!tb) return;
    const tI = t => ({employee:'👤',contractor:'🔗',service_account:'⚙',cloud_identity:'☁️'})[t]||'○';
    const tC = t => ({employee:'#3b82f6',contractor:'#8b5cf6',service_account:'#f97316',cloud_identity:'#06b6d4'})[t]||'#94a3b8';
    const rc = r => r>=90?'#ef4444':r>=70?'#f97316':r>=40?'#eab308':'#22c55e';
    const canAttack = emp => {
      const hasPath = PG.attackPaths.some(p => p.sourceId === emp.id);
      const highRisk = emp.risk >= 70;
      return hasPath || highRisk;
    };
    if (!ids.length) {
      tb.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div style="font-size:28px;margin-bottom:8px">👤</div><h3>No employees match filters.</h3></div></td></tr>`;
      return;
    }
    tb.innerHTML = ids.map(id => {
      const attack = canAttack(id);
      const paths = PG.attackPaths.filter(p => p.sourceId === id.id);
      return `<tr style="cursor:pointer" onclick="PG.Pages.openIdentityDetail('${id.id}')">
        <td>
          <div class="flex-row" style="gap:8px">
            <div style="width:30px;height:30px;border-radius:50%;background:${tC(id.type)}22;border:1px solid ${tC(id.type)};display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">${tI(id.type)}</div>
            <div>
              <div class="name-cell">${id.name}</div>
              <div class="text-xs text-muted">${id.email}</div>
            </div>
          </div>
        </td>
        <td><span class="tag">${id.type.replace(/_/g,' ')}</span></td>
        <td><span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:5px;background:${rc(id.risk)}22;color:${rc(id.risk)}">${id.privilege.toUpperCase()}</span></td>
        <td style="font-size:12px;color:var(--text-secondary)">${id.department||'—'}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:60px;height:5px;background:var(--border);border-radius:3px;overflow:hidden">
              <div style="width:${id.risk}%;height:100%;background:${rc(id.risk)};border-radius:3px;transition:width .5s ease"></div>
            </div>
            <span style="font-size:12px;font-weight:700;color:${rc(id.risk)}">${id.risk}</span>
          </div>
        </td>
        <td style="font-size:12px">${id.groups}</td>
        <td style="font-size:12px">${id.reachableAssets}</td>
        <td>
          ${attack
            ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:6px;background:rgba(239,68,68,.12);color:#ef4444;font-size:11px;font-weight:700">
                <span style="width:7px;height:7px;border-radius:50%;background:#ef4444;animation:pulseDot 1.2s infinite"></span>
                ${paths.length} Path${paths.length!==1?'s':''}
              </span>`
            : `<span style="padding:4px 9px;border-radius:6px;background:rgba(34,197,94,.1);color:#22c55e;font-size:11px;font-weight:600">✓ Clean</span>`
          }
        </td>
        <td>
          <div class="flex-row" style="gap:6px">
            <button class="btn btn-secondary btn-sm"
              onclick="event.stopPropagation();PG.EmployeeManager.openModal('${id.id}')">Edit</button>
            <button class="btn btn-sm" style="background:rgba(239,68,68,.1);color:#ef4444;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer"
              onclick="event.stopPropagation();PG.EmployeeManager._confirmDelete('${id.id}')">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  /* ── Confirm delete ── */
  _confirmDelete(id) {
    const emp = PG.identities.find(i => i.id === id);
    if (!emp) return;
    if (confirm(`Delete "${emp.name}"?\n\nThis will remove them from all attack paths and relationships.`)) {
      this.delete(id);
      this._filter();
      this._renderStats();
    }
  },

  /* ── Open modal for add or edit ── */
  openModal(id = null) {
    const emp = id ? PG.identities.find(i => i.id === id) : this._blank();
    if (!emp) return;
    const isEdit = !!id;

    const overlay = document.getElementById('emp-modal-overlay');
    const title   = document.getElementById('emp-modal-title');
    const body    = document.getElementById('emp-modal-body');
    if (!overlay || !title || !body) return;

    title.textContent = isEdit ? `Edit — ${emp.name}` : 'Add New Employee / Identity';
    overlay.style.display = 'flex';

    const rc = emp.risk;
    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block">Full Name *</label>
          <input id="ef-name" class="sim-select" value="${emp.name}" placeholder="e.g. Jane Smith" style="width:100%">
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block">Email *</label>
          <input id="ef-email" class="sim-select" value="${emp.email}" placeholder="jane@company.com" style="width:100%">
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block">Identity Type</label>
          <select id="ef-type" class="sim-select" style="width:100%">
            ${['employee','contractor','service_account','cloud_identity'].map(t =>
              `<option value="${t}"${emp.type===t?' selected':''}>${t.replace(/_/g,' ')}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block">Privilege Level</label>
          <select id="ef-priv" class="sim-select" style="width:100%" onchange="PG.EmployeeManager._previewRisk()">
            ${['low','medium','high','critical'].map(p =>
              `<option value="${p}"${emp.privilege===p?' selected':''}>${p.toUpperCase()}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block">Department</label>
          <input id="ef-dept" class="sim-select" value="${emp.department||''}" placeholder="e.g. Engineering" style="width:100%">
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block">Group Memberships</label>
          <input id="ef-groups" class="sim-select" type="number" min="0" max="50" value="${emp.groups}" style="width:100%" oninput="PG.EmployeeManager._previewRisk()">
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block">Cloud Roles</label>
          <input id="ef-cloud" class="sim-select" type="number" min="0" max="20" value="${emp.cloudRoles}" style="width:100%" oninput="PG.EmployeeManager._previewRisk()">
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block">Direct Permissions</label>
          <input id="ef-dperms" class="sim-select" type="number" min="0" max="50" value="${emp.directPerms}" style="width:100%" oninput="PG.EmployeeManager._previewRisk()">
        </div>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block">Notes</label>
        <textarea id="ef-notes" class="sim-select" style="width:100%;height:60px;resize:vertical;font-family:var(--font)">${emp.notes||''}</textarea>
      </div>

      <!-- Live Risk Preview -->
      <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Live Risk Preview</div>
        <div style="display:flex;align-items:center;gap:12px">
          <div id="ef-risk-val" style="font-size:32px;font-weight:900;color:#ef4444;min-width:50px">${rc}</div>
          <div style="flex:1">
            <div style="background:var(--border);border-radius:4px;height:8px;overflow:hidden">
              <div id="ef-risk-bar" style="height:100%;background:#ef4444;border-radius:4px;width:${rc}%;transition:width .4s ease,background .4s ease"></div>
            </div>
            <div id="ef-risk-label" style="font-size:11px;color:var(--text-muted);margin-top:4px">RISK SCORE — based on privilege, groups &amp; cloud roles</div>
          </div>
          <div id="ef-threat-badge" style="padding:5px 10px;border-radius:6px;font-size:11px;font-weight:700"></div>
        </div>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="PG.EmployeeManager.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="PG.EmployeeManager._saveModal('${emp.id}','${isEdit}')">
          ${isEdit ? '💾 Save Changes' : '+ Add Employee'}
        </button>
      </div>`;

    this._previewRisk();
  },

  /* ── Live risk preview inside modal ── */
  _previewRisk() {
    const priv   = document.getElementById('ef-priv')?.value || 'low';
    const groups = parseInt(document.getElementById('ef-groups')?.value || '1');
    const cloud  = parseInt(document.getElementById('ef-cloud')?.value  || '0');
    const dperms = parseInt(document.getElementById('ef-dperms')?.value || '2');
    const tmp = { privilege: priv, groups, cloudRoles: cloud, directPerms: dperms };
    const risk = this._calcRisk(tmp);
    const col  = risk >= 90 ? '#ef4444' : risk >= 70 ? '#f97316' : risk >= 40 ? '#eab308' : '#22c55e';
    const label = risk >= 90 ? '🔴 CRITICAL THREAT' : risk >= 70 ? '🟠 HIGH RISK' : risk >= 40 ? '🟡 MEDIUM' : '🟢 LOW';

    const rv  = document.getElementById('ef-risk-val');
    const rb  = document.getElementById('ef-risk-bar');
    const rlb = document.getElementById('ef-risk-label');
    const rtb = document.getElementById('ef-threat-badge');
    if (rv)  { rv.textContent  = risk; rv.style.color = col; }
    if (rb)  { rb.style.width  = risk + '%'; rb.style.background = col; }
    if (rlb) { rlb.textContent = `Computed risk: ${risk}/100`; }
    if (rtb) {
      rtb.textContent    = label;
      rtb.style.background = col + '22';
      rtb.style.color      = col;
    }
  },

  /* ── Save from modal ── */
  _saveModal(id, isEditStr) {
    const isEdit = isEditStr === 'true';
    const name   = document.getElementById('ef-name')?.value.trim();
    const email  = document.getElementById('ef-email')?.value.trim();
    if (!name || !email) { alert('Name and Email are required.'); return; }

    const changes = {
      name,
      email,
      type:        document.getElementById('ef-type')?.value  || 'employee',
      privilege:   document.getElementById('ef-priv')?.value  || 'low',
      department:  document.getElementById('ef-dept')?.value  || '',
      groups:      parseInt(document.getElementById('ef-groups')?.value || '1'),
      cloudRoles:  parseInt(document.getElementById('ef-cloud')?.value  || '0'),
      directPerms: parseInt(document.getElementById('ef-dperms')?.value || '2'),
      inheritedPerms: 5,
      notes:       document.getElementById('ef-notes')?.value || '',
      reachableAssets: parseInt(document.getElementById('ef-groups')?.value || '1') * 2,
      criticalPaths: 0,
    };

    if (isEdit) {
      this.update(id, changes);
    } else {
      changes.id = id; // reuse the blank id
      this.add(changes);
    }

    this.closeModal();
    this._filter();
    this._renderStats();
    this._startThreatPulse();
    // Re-render notifications
    PG.Notifications._refreshFromIdentities?.();
  },

  /* ── Close modal ── */
  closeModal() {
    const overlay = document.getElementById('emp-modal-overlay');
    if (overlay) overlay.style.display = 'none';
  },
};
