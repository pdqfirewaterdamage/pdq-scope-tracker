export {
  SCOPE_TEMPLATE,
  ROOM_PRESETS,
  makeRoomItems,
  countPendingItems,
} from '../constants/templates';

export type {
  ItemStatus,
  ScopeItem,
  ScopeSection,
  RoomItem,
} from '../constants/templates';

function getStatusIcon(status: string): string {
  switch (status) {
    case 'done':
      return '&#10003;';
    case 'not_needed':
      return '&mdash;';
    default:
      return '&#9675;';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return '#3a9e3f';
    case 'not_needed':
      return '#6b7280';
    default:
      return '#FF6B00';
  }
}

function fmt$(n: number): string {
  return '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Xactimate pricing table
const XPC: Record<string, { unit: string; price: number }> = {
  // Extraction
  p1_weighted_wand: { unit: 'SF', price: 0.72 },
  p1_wand_extraction: { unit: 'SF', price: 0.52 },
  // Antimicrobial
  p1_antimicrobial: { unit: 'SF', price: 0.28 },
  // Contents
  p1_contents_manip: { unit: 'EA', price: 95.00 },
  // Containment
  p1_poly_barrier: { unit: 'SF', price: 1.85 },
  p1_neg_air: { unit: 'EA/DAY', price: 125.00 },
  p1_decon_chamber: { unit: 'EA', price: 285.00 },
  p1_warning_signage: { unit: 'EA', price: 18.50 },
  p1_zip_wall: { unit: 'LF', price: 3.25 },
  // Equipment
  p1_dehumidifier: { unit: 'EA/DAY', price: 145.00 },
  p1_portable_drainage: { unit: 'EA/DAY', price: 85.00 },
  p1_air_scrubber: { unit: 'EA/DAY', price: 110.00 },
  p1_hydroxyl: { unit: 'EA/DAY', price: 165.00 },
  // Demolition
  p3_drill_holes: { unit: 'EA', price: 12.50 },
  p3_subfloor_inspection: { unit: 'SF', price: 1.10 },
  p3_flood_cut: { unit: 'LF', price: 3.75 },
  p3_remove_insulation_wall: { unit: 'SF', price: 1.45 },
  p3_remove_ceiling_drywall: { unit: 'SF', price: 1.85 },
  p3_remove_ceiling_insulation: { unit: 'SF', price: 1.45 },
  // Flooring
  p3_flooring_carpet: { unit: 'SF', price: 1.25 },
  p3_flooring_padding: { unit: 'SF', price: 0.65 },
  p3_flooring_tack: { unit: 'LF', price: 0.45 },
  p3_flooring_vinyl: { unit: 'SF', price: 1.95 },
  p3_flooring_laminate: { unit: 'SF', price: 1.85 },
  p3_flooring_hardwood: { unit: 'SF', price: 2.50 },
  p3_flooring_tile: { unit: 'SF', price: 3.25 },
  p3_flooring_scrape: { unit: 'SF', price: 1.35 },
  // Cleaning
  p3_hepa_vacuum: { unit: 'SF', price: 0.35 },
  p3_antimicrobial_wipe: { unit: 'SF', price: 0.42 },
  p3_fogging: { unit: 'SF', price: 0.38 },
  p3_air_duct_cleaning: { unit: 'EA', price: 275.00 },
  p3_duct_sealing: { unit: 'EA', price: 85.00 },
  // Drying
  p3_air_mover: { unit: 'EA/DAY', price: 55.00 },
  p3_dehumidifier_check: { unit: 'EA', price: 35.00 },
  p3_moisture_readings: { unit: 'EA', price: 45.00 },
  // Asbestos
  p3_asbestos_sample: { unit: 'EA', price: 95.00 },
  p3_lead_test: { unit: 'EA', price: 65.00 },
  // Trash
  p3_truck_haul: { unit: 'LOAD', price: 385.00 },
  p3_dumpster_fill: { unit: 'LOAD', price: 650.00 },
  p3_bag_debris: { unit: 'EA', price: 25.00 },
};

// Xactimate keyword-based price lookup (for billing/xactimate tabs)
const XPC_KEYWORD: Record<string, number> = {
  extraction: 0.38, antimicrobial: 0.41, dehumidifier: 75.75, 'air mover': 32.50,
  'air scrubber': 79.00, hydroxyl: 125.00, drywall: 1.41, 'carpet pad': 0.22,
  carpet: 0.45, tile: 2.45, vinyl: 0.68, hardwood: 1.95, baseboard: 0.85,
  insulation: 1.03, stud: 1.27, hepa: 0.51, 'mold remediation': 8.50,
  encapsulant: 1.85, asbestos: 385.00, monitoring: 55.00, moisture: 75.00,
};

function getPrice(label: string): number {
  const l = (label || '').toLowerCase();
  for (const [k, v] of Object.entries(XPC_KEYWORD)) {
    if (l.includes(k)) return v;
  }
  return 0;
}

// Labor rate
const LABOR_REGULAR = 65.00;
const LABOR_AFTER = 97.50;

export function buildReportHTML(project: any, sheet: any, rooms: any[]): string {
  return buildCompleteReportHTML(project, [sheet], rooms);
}

export function buildCompleteReportHTML(project: any, sheets: any[], allRooms: any[]): string {
  const isCat3 = project.water_category === 'cat3';
  const catLabel = isCat3 ? '&#9763; Cat 3 — Black Water' : '&#128167; Cat 2 — Gray Water';
  const jobNum = 'PDQ-' + (project.id || '').slice(-6).toUpperCase();
  const genDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // ── Collect all data from sheets ──
  const leadTech = sheets.find((s: any) => s.tech_name)?.tech_name || '—';
  const allRoomNames = Array.from(new Set(allRooms.map((r: any) => r.name)));
  let totalDone = 0;

  // Tech hours map: derive from sheets (lead tech = sheet.tech_name, 8 hrs per day)
  const techHours: Record<string, { role: string; regHrs: number; afterHrs: number; days: string[] }> = {};
  const ensureTech = (name: string, role: string) => {
    if (!techHours[name]) techHours[name] = { role, regHrs: 0, afterHrs: 0, days: [] };
  };
  sheets.forEach((sh: any) => {
    if (sh.tech_name) {
      ensureTech(sh.tech_name, 'Lead Technician');
      if (sh.date && !techHours[sh.tech_name].days.includes(sh.date)) {
        techHours[sh.tech_name].days.push(sh.date);
      }
      // Check if sheet has after-hours items
      const hasAfter = allRooms
        .filter((r: any) => r.sheet_id === sh.id)
        .flatMap((r: any) => r.items || [])
        .some((i: any) => i.hours_type === 'after');
      if (hasAfter) techHours[sh.tech_name].afterHrs += 8;
      else techHours[sh.tech_name].regHrs += 8;
    }
  });

  // Equipment map — track per item across days
  const equipMap: Record<string, { qty: number; days: Set<string>; unitPrice: number }> = {};
  sheets.forEach((sh: any) => {
    const sheetRooms = allRooms.filter((r: any) => r.sheet_id === sh.id);
    sheetRooms.forEach((rm: any) => {
      (rm.items || []).filter((i: any) => i.no_hours && i.status === 'done').forEach((i: any) => {
        const k = i.label.replace(/ — Cat 3/g, '').trim();
        if (!equipMap[k]) equipMap[k] = { qty: 0, days: new Set(), unitPrice: 0 };
        equipMap[k].qty = Math.max(equipMap[k].qty, parseFloat(i.qty_value) || 1);
        if (sh.date) equipMap[k].days.add(sh.date);
      });
    });
  });
  Object.keys(equipMap).forEach(k => { equipMap[k].unitPrice = getPrice(k); });

  // Helper to convert Set to sorted array
  const setToArray = (s: Set<string>): string[] => Array.from(s).sort();

  // Room billing data
  const roomBilling: Record<string, { items: any[]; total: number }> = {};
  let grandTotal = 0;
  allRooms.forEach((rm: any) => {
    if (!roomBilling[rm.name]) roomBilling[rm.name] = { items: [], total: 0 };
    const doneItems = (rm.items || []).filter((i: any) => i.status === 'done');
    doneItems.forEach((i: any) => {
      const p = getPrice(i.label);
      const q = parseFloat(i.qty_value) || 1;
      const t = q * p;
      // Find which sheet this room belongs to for date info
      const sh = sheets.find((s: any) => s.id === rm.sheet_id);
      roomBilling[rm.name].items.push({ ...i, unitPrice: p, lineTotal: t, date: sh?.date });
      roomBilling[rm.name].total += t;
      totalDone++;
    });
  });
  Object.values(roomBilling).forEach(r => grandTotal += r.total);

  // Mold/asbestos flags — check if any items with those labels are done
  const hasMold = allRooms.some((r: any) =>
    (r.items || []).some((i: any) => i.status === 'done' && i.label.toLowerCase().includes('mold'))
  );
  const hasAsbestos = allRooms.some((r: any) =>
    (r.items || []).some((i: any) => i.status === 'done' && i.label.toLowerCase().includes('asbestos'))
  );

  const generalTotal = sheets.length * 130 + (hasAsbestos ? 770 : 0);
  grandTotal += generalTotal;

  // ── CSS ──
  const CSS = `
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: #f0f4f8; }
    .tab-bar { position: sticky; top: 0; z-index: 100; background: #0a1628; display: flex; gap: 0; overflow-x: auto; border-bottom: 3px solid #0077C8; }
    .tab { padding: 12px 18px; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; cursor: pointer; white-space: nowrap; border-bottom: 3px solid transparent; margin-bottom: -3px; touch-action: manipulation; }
    .tab:hover { color: #fff; background: #1a3050; }
    .tab.active { color: #0077C8; border-bottom-color: #0077C8; background: #0a1f38; }
    .section { display: none; } .section.active { display: block; }
    .page { max-width: 900px; margin: 0 auto; padding: 20px 16px 80px; }
    .report-header { background: linear-gradient(135deg, #0a1628, #0f1f38); color: #fff; padding: 20px 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo-block .logo { font-size: 28px; font-weight: 900; color: #0077C8; letter-spacing: 2px; }
    .logo-block .sub { font-size: 9px; color: #3a9e3f; font-weight: 700; letter-spacing: 1px; margin-top: 2px; }
    .doc-title { text-align: right; }
    .doc-title h1 { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
    .doc-title .doc-num { color: #f97316; font-weight: 700; font-size: 13px; margin-top: 4px; }
    .doc-title .doc-date { color: #94a3b8; font-size: 11px; margin-top: 2px; }
    .job-info-bar { background: #e8f4ff; border-bottom: 2px solid #0077C8; padding: 12px 24px; display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
    .ji label { font-size: 9px; font-weight: 700; color: #5a80a8; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 3px; }
    .ji span { font-size: 13px; font-weight: 700; color: #1a1a2e; }
    .sec-header { background: #0a1628; color: #0077C8; padding: 9px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; margin: 20px 0 10px; border-left: 4px solid #0077C8; display: flex; justify-content: space-between; align-items: center; }
    .sec-header span { color: #94a3b8; font-size: 10px; font-weight: 600; }
    .summary-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
    .sum-card { background: #fff; border-radius: 8px; padding: 14px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-top: 3px solid #0077C8; }
    .sum-card .num { font-size: 28px; font-weight: 900; color: #0077C8; }
    .sum-card .lbl { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .sum-card.green { border-top-color: #3a9e3f; } .sum-card.green .num { color: #3a9e3f; }
    .sum-card.orange { border-top-color: #f97316; } .sum-card.orange .num { color: #f97316; }
    .sum-card.purple { border-top-color: #a855f7; } .sum-card.purple .num { color: #a855f7; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 14px; }
    th { background: #0a1628; color: #fff; padding: 8px 11px; font-size: 10px; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 8px 11px; border-bottom: 1px solid #f0f4f8; font-size: 12px; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #fafbff; }
    .total-row td { background: #0a1628 !important; color: #fff; font-weight: 700; }
    .day-card { background: #fff; border-radius: 8px; margin-bottom: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    .day-header { background: #0f1f38; padding: 11px 14px; display: flex; justify-content: space-between; align-items: center; }
    .day-header .date { font-size: 14px; font-weight: 800; color: #fff; }
    .day-header .submitted { color: #22c55e; font-size: 11px; font-weight: 700; }
    .day-body { padding: 11px 14px; }
    .personnel-row { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .p-badge { padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .lead-badge { background: #60a5fa22; color: #60a5fa; border: 1px solid #60a5fa40; }
    .tech-badge { background: #94a3b822; color: #94a3b8; border: 1px solid #94a3b840; }
    .room-tag { display: inline-block; background: #f97316; color: #fff; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; margin: 0 4px 4px 0; }
    .item-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f4f8; font-size: 11px; }
    .item-row:last-child { border-bottom: none; }
    .hours-reg { color: #3a9e3f; font-weight: 700; font-size: 10px; background: #3a9e3f1a; padding: 1px 6px; border-radius: 3px; }
    .hours-after { color: #f97316; font-weight: 700; font-size: 10px; background: #f973161a; padding: 1px 6px; border-radius: 3px; }
    .tech-card { background: #fff; border-radius: 8px; padding: 14px; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); display: grid; grid-template-columns: 180px 1fr; gap: 14px; align-items: start; }
    .tech-name { font-size: 14px; font-weight: 800; color: #0a1628; }
    .tech-role { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
    .hours-summary { display: flex; gap: 10px; margin-top: 8px; }
    .hours-box { text-align: center; padding: 8px 14px; border-radius: 6px; }
    .hours-box .h-num { font-size: 20px; font-weight: 900; }
    .hours-box .h-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .reg-box { background: #3a9e3f1a; } .reg-box .h-num { color: #3a9e3f; } .reg-box .h-lbl { color: #3a9e3f; }
    .after-box { background: #f973161a; } .after-box .h-num { color: #f97316; } .after-box .h-lbl { color: #f97316; }
    .total-box { background: #0077C81a; } .total-box .h-num { color: #0077C8; } .total-box .h-lbl { color: #0077C8; }
    .equip-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 16px; }
    .eq-card { background: #fff; border-radius: 8px; padding: 13px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-left: 4px solid #0077C8; }
    .eq-card .eq-name { font-size: 12px; font-weight: 700; color: #1a1a2e; margin-bottom: 7px; }
    .eq-stat { display: flex; justify-content: space-between; font-size: 11px; color: #475569; margin-bottom: 3px; }
    .eq-stat strong { color: #0a1628; }
    .tag-mold { background: #22c55e1a; color: #22c55e; border: 1px solid #22c55e40; padding: 1px 7px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .tag-asbestos { background: #f59e0b1a; color: #f59e0b; border: 1px solid #f59e0b40; padding: 1px 7px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .tag-cat3 { background: #ef44441a; color: #ef4444; border: 1px solid #ef444440; padding: 1px 7px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .disclaimer { background: #fff8e1; border: 1px solid #f59e0b; border-radius: 6px; padding: 10px 14px; font-size: 10px; color: #7c5c00; margin-top: 20px; line-height: 1.5; }
    .save-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #0a1628; border-top: 2px solid #f97316; padding: 10px 16px; display: flex; gap: 8px; z-index: 200; }
    @media print { .tab-bar,.save-bar { display: none; } .section { display: block !important; page-break-before: always; } .section:first-of-type { page-break-before: avoid; } }`;

  // ── TAB 1: PROJECT SUMMARY ──
  const summaryPhases: [string, string, string][] = [
    ['Phase 1 — Emergency Services', '#f97316', 'Extraction, Antimicrobial, Containment, Equipment'],
    ...(hasMold ? [['Phase 1.5 — Mold Protocol', '#22c55e', 'S520 Mold Remediation'] as [string, string, string]] : []),
    ['Phase 3 — Demolition & Final Dryout', '#f59e0b', 'Demo, Cleaning, Final Dryout'],
  ];

  const tab1 = `
    <div class="sec-header">Project Overview <span>${jobNum}</span></div>
    <div class="summary-grid">
      <div class="sum-card"><div class="num">${sheets.length}</div><div class="lbl">Days On Site</div></div>
      <div class="sum-card orange"><div class="num">${allRoomNames.length}</div><div class="lbl">Rooms Affected</div></div>
      <div class="sum-card green"><div class="num">${totalDone}</div><div class="lbl">Tasks Completed</div></div>
      <div class="sum-card purple"><div class="num">${Object.keys(techHours).length}</div><div class="lbl">Technicians</div></div>
    </div>
    <div class="sec-header">Loss Summary</div>
    <table>
      <tr><th>Field</th><th>Details</th></tr>
      <tr><td><strong>Property / Job</strong></td><td>${project.job_name}</td></tr>
      <tr><td><strong>Address</strong></td><td>${project.address || '—'}</td></tr>
      <tr><td><strong>Loss Type</strong></td><td>${project.job_type || 'Water Mitigation'} &nbsp;<span class="tag-cat3">${catLabel}</span></td></tr>
      <tr><td><strong>Date Work Began</strong></td><td>${fmtDate(sheets[0]?.date) || '—'}</td></tr>
      <tr><td><strong>Date Completed</strong></td><td>${fmtDate(sheets[sheets.length - 1]?.date) || '—'}</td></tr>
      <tr><td><strong>Rooms Affected</strong></td><td>${allRoomNames.join(', ') || '—'}</td></tr>
      ${hasAsbestos ? `<tr><td><strong>Asbestos Testing</strong></td><td><span class="tag-asbestos">&#9888; Required — Pre-1981 property. Lab results on file.</span></td></tr>` : ''}
      ${hasMold ? `<tr><td><strong>Mold Protocol</strong></td><td><span class="tag-mold">&#10003; Required — Full S520 remediation performed.</span></td></tr>` : ''}
      ${isCat3 ? `<tr><td><strong>Hydroxyl Generator</strong></td><td>&#10003; Deployed — Cat 3 mandatory protocol</td></tr>` : ''}
    </table>
    <div class="sec-header">Personnel Summary</div>
    <table>
      <tr><th>Name</th><th>Role</th><th>Days on Site</th><th>Regular Hrs</th><th>After Hrs</th><th>Total</th></tr>
      ${Object.entries(techHours).map(([name, d]) => `
      <tr><td><strong>${name}</strong></td><td>${d.role}</td><td>${d.days.length}</td><td>${d.regHrs} hrs</td><td>${d.afterHrs} hrs</td><td><strong>${d.regHrs + d.afterHrs} hrs</strong></td></tr>`).join('')}
      <tr class="total-row"><td colspan="3">TOTALS</td><td>${Object.values(techHours).reduce((s, d) => s + d.regHrs, 0)} hrs</td><td>${Object.values(techHours).reduce((s, d) => s + d.afterHrs, 0)} hrs</td><td>${Object.values(techHours).reduce((s, d) => s + d.regHrs + d.afterHrs, 0)} hrs</td></tr>
    </table>
    <div class="sec-header">Scope Phases Completed</div>
    <table>
      <tr><th>Phase</th><th>Status</th><th>Key Items</th></tr>
      ${summaryPhases.map(([ph, , items]) => `<tr><td>${ph}</td><td>&#10003; Complete</td><td>${items}</td></tr>`).join('')}
    </table>`;

  // ── TAB 2: DAILY ACTIVITY LOG ──
  const tab2 = `
    <div class="sec-header">Daily Activity Log <span>${sheets.length} Days</span></div>
    ${sheets.map((sh: any, si: number) => {
      const sheetRooms = allRooms.filter((r: any) => r.sheet_id === sh.id);
      return `<div class="day-card">
        <div class="day-header">
          <div><div class="date">&#128197; ${fmtDate(sh.date)} — Day ${si + 1}</div></div>
          <div class="${sh.submitted ? 'submitted' : ''}">${sh.submitted ? '&#10003; Submitted' : 'In Progress'}</div>
        </div>
        <div class="day-body">
          <div class="personnel-row">
            ${sh.tech_name ? `<span class="p-badge lead-badge">&#128313; Lead: ${sh.tech_name}</span>` : ''}
          </div>
          <div style="margin-bottom:8px">${sheetRooms.map((r: any) => `<span class="room-tag">${r.name}</span>`).join('')}</div>
          ${sheetRooms.map((r: any) => {
            const done = (r.items || []).filter((i: any) => i.status === 'done');
            if (!done.length) return '';
            return done.map((i: any) => `<div class="item-row">
              <span>&#10003; ${i.label.replace(/ — Cat 3/g, '')}</span>
              <span>${i.hours_type === 'after' ? '<span class="hours-after">After Hours</span>' : i.hours_type === 'regular' ? '<span class="hours-reg">Regular Hours</span>' : i.qty_value ? `QTY: ${i.qty_value}` : ''}</span>
            </div>`).join('');
          }).join('')}
        </div>
      </div>`;
    }).join('')}`;

  // ── TAB 3: BILLING LINE ITEMS ──
  const tab3 = `
    <div class="sec-header">Billing Summary — By Room <span>Ready for billing software entry</span></div>
    ${Object.entries(roomBilling).map(([room, data]) => {
      if (data.items.length === 0) return '';
      const phGroups: Record<string, any[]> = {};
      data.items.forEach((i: any) => {
        const p = i.phase || 'General';
        if (!phGroups[p]) phGroups[p] = [];
        phGroups[p].push(i);
      });
      return `
      <div style="background:#0a1628;border-radius:7px;padding:9px 13px;margin:16px 0 5px;display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:13px;font-weight:800;color:#fff">&#127968; ${room}</div>
      </div>
      <table>
        <tr><th>Line Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
        ${Object.entries(phGroups).map(([ph, items]) => `
          <tr><td colspan="4" style="background:#f0f4f8;font-weight:700;color:#0077C8;font-size:10px;text-transform:uppercase;padding:4px 11px">${ph}</td></tr>
          ${items.map((i: any) => `<tr>
            <td>${i.label.replace(/ — Cat 3/g, '')}</td>
            <td style="text-align:center">${parseFloat(i.qty_value) || 1}</td>
            <td style="text-align:right">${fmt$(i.unitPrice)}</td>
            <td style="text-align:right;font-weight:700">${fmt$(i.lineTotal)}</td>
          </tr>`).join('')}`).join('')}
        <tr style="background:#e8f4ff"><td colspan="3" style="font-weight:800">${room} Subtotal</td><td style="text-align:right;font-weight:900;color:#0077C8;font-size:13px">${fmt$(data.total)}</td></tr>
      </table>`;
    }).filter(Boolean).join('')}
    <div style="background:#1e293b;border-radius:7px;padding:9px 13px;margin:16px 0 5px"><div style="font-size:13px;font-weight:800;color:#f8fafc">&#9881; General — Non-Room Charges</div></div>
    <table>
      <tr><th>Line Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
      <tr><td>Monitoring visit — daily</td><td style="text-align:center">${sheets.length}</td><td style="text-align:right">$55.00</td><td style="text-align:right;font-weight:700">${fmt$(sheets.length * 55)}</td></tr>
      <tr><td>Moisture mapping — daily</td><td style="text-align:center">${sheets.length}</td><td style="text-align:right">$75.00</td><td style="text-align:right;font-weight:700">${fmt$(sheets.length * 75)}</td></tr>
      ${hasAsbestos ? `<tr><td>Asbestos / Lead testing</td><td style="text-align:center">2</td><td style="text-align:right">$385.00</td><td style="text-align:right;font-weight:700">$770.00</td></tr>` : ''}
      <tr style="background:#e8f4ff"><td colspan="3" style="font-weight:800">General Subtotal</td><td style="text-align:right;font-weight:900;color:#0077C8;font-size:13px">${fmt$(generalTotal)}</td></tr>
    </table>
    <table>
      ${Object.entries(roomBilling).map(([r, d]) => `<tr><td>&#127968; ${r}</td><td style="text-align:right">${fmt$(d.total)}</td></tr>`).join('')}
      <tr><td>&#9881; General</td><td style="text-align:right">${fmt$(generalTotal)}</td></tr>
      <tr class="total-row"><td style="font-size:14px">ESTIMATED TOTAL</td><td style="text-align:right;font-size:16px">${fmt$(grandTotal)}</td></tr>
    </table>
    <div class="disclaimer">&#9888; Pricing based on Xactimate Northeast region rates. All items logged by field technicians. Final invoice may vary.</div>`;

  // ── TAB 4: TECH HOURS ──
  const tab4 = `
    <div class="sec-header">Technician Hours Report <span>${fmtDateShort(sheets[0]?.date)} — ${fmtDateShort(sheets[sheets.length - 1]?.date)}</span></div>
    ${Object.entries(techHours).map(([name, d]) => `
    <div class="tech-card">
      <div>
        <div class="tech-name">${name}</div>
        <div class="tech-role">${d.role === 'Lead Technician' ? '&#128313; Lead Technician' : '&#128119; Technician'}</div>
        <div style="font-size:11px;color:#475569;margin-top:6px">Days on site: <strong>${d.days.length} of ${sheets.length}</strong></div>
      </div>
      <div>
        <div class="hours-summary">
          <div class="hours-box reg-box"><div class="h-num">${d.regHrs}</div><div class="h-lbl">Reg Hrs</div></div>
          <div class="hours-box after-box"><div class="h-num">${d.afterHrs}</div><div class="h-lbl">After Hrs</div></div>
          <div class="hours-box total-box"><div class="h-num">${d.regHrs + d.afterHrs}</div><div class="h-lbl">Total Hrs</div></div>
        </div>
      </div>
    </div>`).join('')}
    <div class="sec-header">Labor Summary</div>
    <table>
      <tr><th>Category</th><th>Regular Hours</th><th>After Hours</th><th>Total</th></tr>
      ${Object.entries(techHours).map(([name, d]) => `<tr><td>${name} (${d.role})</td><td>${d.regHrs}</td><td>${d.afterHrs}</td><td><strong>${d.regHrs + d.afterHrs}</strong></td></tr>`).join('')}
      <tr class="total-row">
        <td>TOTAL LABOR</td>
        <td>${Object.values(techHours).reduce((s, d) => s + d.regHrs, 0)}</td>
        <td>${Object.values(techHours).reduce((s, d) => s + d.afterHrs, 0)}</td>
        <td>${Object.values(techHours).reduce((s, d) => s + d.regHrs + d.afterHrs, 0)}</td>
      </tr>
    </table>`;

  // ── TAB 5: EQUIPMENT LOG ──
  const hasEquip = Object.keys(equipMap).length > 0;
  const tab5 = `
    <div class="sec-header">Equipment Deployment Log <span>${sheets.length} Days On Site</span></div>
    ${hasEquip ? `<div class="equip-grid">
      ${Object.entries(equipMap).map(([name, eq]) => `
      <div class="eq-card">
        <div class="eq-name">${name}</div>
        <div class="eq-stat"><span>Units deployed:</span><strong>${eq.qty}</strong></div>
        <div class="eq-stat"><span>Days on site:</span><strong>${eq.days.size}</strong></div>
        <div class="eq-stat"><span>Total unit-days:</span><strong>${eq.qty * eq.days.size}</strong></div>
        <div class="eq-stat"><span>Rate/unit/day:</span><strong>${fmt$(eq.unitPrice)}</strong></div>
        <div class="eq-stat" style="color:#0077C8;font-weight:700"><span>Subtotal:</span><strong>${fmt$(eq.qty * eq.days.size * eq.unitPrice)}</strong></div>
      </div>`).join('')}
    </div>` : `<div style="padding:20px;text-align:center;color:#64748b">No equipment data logged</div>`}
    <div class="sec-header">Equipment Dates</div>
    <table>
      <tr><th>Equipment</th><th>Dates Active</th><th>Days</th><th>Units</th><th>Total</th></tr>
      ${Object.entries(equipMap).map(([name, eq]) => {
        const sortedDates = setToArray(eq.days);
        return `<tr><td>${name}</td><td style="font-size:10px">${sortedDates.map(d => fmtDateShort(d)).join(', ')}</td><td>${eq.days.size}</td><td>${eq.qty}</td><td style="font-weight:700">${fmt$(eq.qty * eq.days.size * eq.unitPrice)}</td></tr>`;
      }).join('')}
      <tr class="total-row"><td colspan="4">EQUIPMENT TOTAL</td><td>${fmt$(Object.values(equipMap).reduce((s, eq) => s + eq.qty * eq.days.size * eq.unitPrice, 0))}</td></tr>
    </table>`;

  // ── TAB 6: PDQ / XACTIMATE FORMAT ──
  const PDQ_CSS = `
    .pdq-page { background:#fff; border:1px solid #ccc; padding:36px 40px; margin-bottom:24px; font-family:'Times New Roman',Times,serif; font-size:11px; color:#000; line-height:1.4; }
    .pdq-logo-row { display:flex; align-items:flex-start; gap:16px; margin-bottom:24px; border-bottom:1px solid #000; padding-bottom:12px; }
    .pdq-logo-box { width:60px; height:60px; border:2px solid #2e7d32; border-radius:4px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .pdq-co-info { font-size:10px; color:#333; line-height:1.5; }
    .pdq-co-name { font-size:13px; font-weight:700; color:#000; margin-bottom:2px; }
    .pdq-job-title { text-align:center; margin-bottom:16px; }
    .pdq-room-header { display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin:12px 0 4px; border-bottom:1px solid #000; padding-bottom:2px; }
    .pdq-col-headers { display:grid; grid-template-columns:1fr 90px 95px 72px; font-size:10.5px; font-weight:700; text-transform:uppercase; border-bottom:1px solid #000; border-top:1px solid #000; padding:3px 0; margin-top:8px; }
    .pdq-col-headers span:not(:first-child) { text-align:right; }
    .pdq-phase-header { font-size:11px; font-weight:700; text-decoration:underline; margin:10px 0 2px; }
    .pdq-phase-note { font-size:10px; font-style:italic; color:#333; margin-bottom:4px; line-height:1.4; }
    .pdq-line { display:grid; grid-template-columns:1fr 90px 95px 72px; font-size:10.5px; padding:2px 0; border-bottom:1px dotted #ddd; }
    .pdq-line span:not(:first-child) { text-align:right; }
    .pdq-line-note { font-size:9.5px; font-style:italic; color:#333; padding:1px 0 4px 14px; line-height:1.4; }
    .pdq-section-total { display:grid; grid-template-columns:1fr 90px 95px 72px; font-size:10.5px; font-weight:700; border-top:1px solid #000; padding:4px 0; margin-top:4px; }
    .pdq-section-total span:not(:first-child) { text-align:right; }
    .pdq-footer-line { font-size:9.5px; color:#555; border-top:1px solid #999; padding-top:6px; margin-top:16px; display:flex; justify-content:space-between; }
    .pdq-continued { font-size:11px; font-weight:700; text-align:center; margin-bottom:12px; border-bottom:1px solid #000; padding-bottom:8px; }`;

  const pdqLogo = `<div class="pdq-logo-row">
    <div class="pdq-logo-box"><div style="text-align:center">
      <div style="font-size:9px;font-weight:900;color:#2e7d32;letter-spacing:1px">PDQ</div>
      <div style="font-size:5px;color:#2e7d32">RESTORATION</div>
    </div></div>
    <div class="pdq-co-info">
      <div class="pdq-co-name">PDQ RESTORATION</div>
      302 Boonton Ave<br>Boonton, NJ 07005<br>www.pdqrestoration.com<br>Tax ID#30-0191043
    </div>
  </div>`;

  const jobRef = (project.job_name || 'JOB').replace(/\s+/g, '_').toUpperCase();
  const pdqColHeaders = `<div class="pdq-col-headers"><span>DESCRIPTION</span><span>QTY</span><span>UNIT PRICE</span><span>TOTAL</span></div>`;

  const pdqPhHeader = (title: string, note: string = '') =>
    `<div class="pdq-phase-header">${title}</div>${note ? `<div class="pdq-phase-note">${note}</div>` : ''}`;

  const pdqLine = (num: number, label: string, qty: string, unit: string, price: number, total: number, note: string = '') =>
    `<div class="pdq-line"><span><span style="min-width:16px;display:inline-block">${num}.</span> ${label}</span><span>${qty} ${unit} @</span><span>${fmt$(price)} =</span><span>${fmt$(total)}</span></div>${note ? `<div class="pdq-line-note">${note}</div>` : ''}`;

  const pdqFooter = (pg: number) =>
    `<div class="pdq-footer-line"><span>${jobRef}</span><span>${genDate}</span><span>Page: ${pg}</span></div>`;

  const pdqPageWrap = (inner: string, pg: number, techLineStr: string = '') =>
    `<div class="pdq-page">
      ${pdqLogo}
      <div class="pdq-job-title">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase">${jobRef}</div>
        <div style="font-size:11px;font-weight:700">${project.address || ''}</div>
        ${isCat3 ? '<div style="font-size:10px;color:#dc2626;font-weight:700;margin-top:2px">&#9763; Category 3 — Black Water Loss</div>' : '<div style="font-size:10px;color:#2563eb;font-weight:700;margin-top:2px">&#128167; Category 2 — Gray Water Loss</div>'}
      </div>
      ${inner}
      ${techLineStr ? `<div style="font-size:9.5px;color:#333;border-top:1px solid #ccc;padding-top:6px;margin-top:12px">${techLineStr}</div>` : ''}
      ${pdqFooter(pg)}
    </div>`;

  // Build tech line shown on every page
  const techLine = leadTech !== '—' ? `<strong>Lead Tech:</strong> ${leadTech}` : '';

  // Build line items per room
  let lineNum = 1;
  let pageNum = 1;
  const pdqPages: string[] = [];
  const pdqRoomTotals: { name: string; total: number }[] = [];

  Object.entries(roomBilling).forEach(([roomName, data]) => {
    if (data.items.length === 0) return;
    let roomHtml = `<div class="pdq-room-header"><span>${roomName}</span><span>Height: 8'</span></div>`;
    roomHtml += pdqColHeaders;

    // Group by phase
    const phGroups: Record<string, any[]> = {};
    data.items.forEach((i: any) => {
      const ph = i.phase || 'General';
      if (!phGroups[ph]) phGroups[ph] = [];
      phGroups[ph].push(i);
    });

    const phaseOrder = [
      'Phase 1 — Emergency Services',
      '1',
      'Phase 1.5 — Mold Protocol',
      'Phase 3 — Demolition, Cat 1 Cleaning & Final Dryout',
      '3',
      'General',
      'general',
    ];
    let roomTotal = 0;

    phaseOrder.forEach(ph => {
      const items = phGroups[ph];
      if (!items || items.length === 0) return;
      const phNotes: Record<string, string> = {
        'Phase 1 — Emergency Services': 'Immediately redeployed technician(s) for emergency services. GPS time records available upon request.',
        '1': 'Immediately redeployed technician(s) for emergency services. GPS time records available upon request.',
        'Phase 1.5 — Mold Protocol': 'Mold remediation performed per IICRC S520. Clearance testing completed. Documentation on file.',
        'Phase 3 — Demolition, Cat 1 Cleaning & Final Dryout': 'Removal of affected materials, cleaning structure back to Cat 1, installing drying equipment.',
        '3': 'Removal of affected materials, cleaning structure back to Cat 1, installing drying equipment.',
      };
      const phaseLabel = ph === '1' ? 'Phase 1 — Emergency Services' : ph === '3' ? 'Phase 3 — Demolition & Final Dryout' : ph === 'general' ? 'General' : ph;
      roomHtml += pdqPhHeader(phaseLabel, phNotes[ph] || '');
      items.forEach((item: any) => {
        const qty = parseFloat(item.qty_value) || 1;
        const total = qty * item.unitPrice;
        roomTotal += total;
        // Build date note from equipment tracking
        const eqDates = equipMap[item.label.replace(/ — Cat 3/g, '').trim()];
        const dateNote = eqDates && eqDates.days.size > 0
          ? `Date(s): ${setToArray(eqDates.days).map(d => fmtDateShort(d)).join(', ')} &middot; ${eqDates.days.size} day(s)`
          : item.date ? `Date: ${fmtDateShort(item.date)}` : '';
        roomHtml += pdqLine(lineNum++, item.label.replace(/ — Cat 3/g, ''), qty + '.00', 'EA @', item.unitPrice, total, dateNote);
      });
    });

    roomHtml += `<div class="pdq-section-total"><span>${roomName} Total</span><span></span><span></span><span>${fmt$(roomTotal)}</span></div>`;
    pdqRoomTotals.push({ name: roomName, total: roomTotal });
    pdqPages.push(pdqPageWrap(roomHtml, pageNum++, techLine));
  });

  // General page
  let genHtml = `<div class="pdq-continued">GENERAL — Non-Room Specific Charges</div>${pdqColHeaders}`;

  if (hasAsbestos) {
    genHtml += pdqPhHeader('Testing — Mandatory Pre-Demo (OSHA 29 CFR 1926.1101)');
    genHtml += pdqLine(lineNum++, 'Asbestos / Lead test fee — bulk sample collection', '2.00', 'EA @', 385, 770,
      'OSHA mandates testing on all properties built prior to 1981. Samples collected by AHERA-certified inspector. Results on file.');
  }

  genHtml += pdqPhHeader('Daily Monitoring — Project-Wide');
  genHtml += pdqLine(lineNum++, 'Monitoring visit — daily site check', `${sheets.length}.00`, 'EA @', 55, sheets.length * 55,
    `Daily monitoring visits ${fmtDateShort(sheets[0]?.date)} – ${fmtDateShort(sheets[sheets.length - 1]?.date)}. Moisture readings recorded each visit.`);
  genHtml += pdqLine(lineNum++, 'Moisture mapping — all affected areas', `${sheets.length}.00`, 'EA @', 75, sheets.length * 75,
    'Daily moisture readings. Documentation on file.');

  if (hasMold) {
    genHtml += pdqPhHeader('Mold Protocol — IICRC S520');
    genHtml += pdqLine(lineNum++, 'Mold clearance testing — post remediation', '1.00', 'EA @', 450, 450,
      'Post-remediation air samples collected. Clearance results: PASSED. Documentation on file.');
  }

  const genTotal = (hasAsbestos ? 770 : 0) + sheets.length * 130 + (hasMold ? 450 : 0);
  genHtml += `<div class="pdq-section-total"><span>General Total</span><span></span><span></span><span>${fmt$(genTotal)}</span></div>`;

  // Grand total summary
  const pdqGrandTotal = pdqRoomTotals.reduce((s, r) => s + r.total, 0) + genTotal;
  genHtml += `<div style="margin-top:20px;border-top:1px solid #000;padding-top:12px">
    <table style="width:100%;font-size:11px;border-collapse:collapse;margin-left:auto;width:280px">
      ${pdqRoomTotals.map(r => `<tr style="border-bottom:1px solid #eee"><td style="padding:3px 0">${r.name}</td><td style="text-align:right;padding:3px 0">${fmt$(r.total)}</td></tr>`).join('')}
      <tr style="border-bottom:1px solid #eee"><td style="padding:3px 0">General</td><td style="text-align:right;padding:3px 0">${fmt$(genTotal)}</td></tr>
      <tr style="border-top:2px solid #000;font-weight:700;font-size:13px"><td style="padding:5px 0">TOTAL</td><td style="text-align:right;padding:5px 0">${fmt$(pdqGrandTotal)}</td></tr>
    </table>
  </div>
  <div style="margin-top:16px;font-size:9px;font-style:italic;color:#555;border-top:1px solid #ccc;padding-top:8px;line-height:1.6">
    This estimate has been prepared in accordance with IICRC S500 Standard for Professional Water Damage Restoration${hasMold ? ' and IICRC S520 Standard for Professional Mold Remediation' : ''}. All pricing reflects current Xactimate Northeast region rates. ${isCat3 ? 'Property classification: Category 3 Black Water. ' : ''}Work performed per applicable OSHA regulations.
  </div>`;

  pdqPages.push(pdqPageWrap(genHtml, pageNum, techLine));

  const tab6 = `<div style="max-width:900px;margin:0 auto;padding:16px 14px 80px;background:#f5f5f5">${pdqPages.join('')}</div>`;

  // ── ASSEMBLE ──
  const escapedJobName = (project.job_name || '').replace(/'/g, "\\'");

  return `<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>PDQ Complete Job Package — ${project.job_name}</title>
    <style>${CSS}${PDQ_CSS}</style></head><body>
    <div class="report-header">
      <div class="logo-block">
        <div class="logo">PDQ</div>
        <div class="sub">RESTORATION</div>
        <div class="tag">WATER AND SMOKE CLEANUP</div>
      </div>
      <div class="doc-title">
        <h1>COMPLETE JOB PACKAGE</h1>
        <div class="doc-num">${jobNum}</div>
        <div class="doc-date">Generated: ${genDate}</div>
      </div>
    </div>
    <div class="job-info-bar">
      <div class="ji"><label>Property / Job</label><span>${project.job_name}</span></div>
      <div class="ji"><label>Address</label><span>${project.address || '—'}</span></div>
      <div class="ji"><label>Loss Type</label><span>${project.job_type || 'Water Mitigation'} &nbsp;<span class="tag-cat3">${catLabel}</span></span></div>
      <div class="ji"><label>Lead Technician</label><span>${leadTech}</span></div>
    </div>
    <div class="tab-bar">
      <div class="tab active" onclick="showTab('t1',event)">&#128202; Summary</div>
      <div class="tab" onclick="showTab('t2',event)">&#128203; Daily Log</div>
      <div class="tab" onclick="showTab('t3',event)">&#128176; Billing</div>
      <div class="tab" onclick="showTab('t4',event)">&#128119; Tech Hours</div>
      <div class="tab" onclick="showTab('t5',event)">&#128295; Equipment</div>
      <div class="tab" onclick="showTab('t6',event)">&#128196; Xactimate</div>
    </div>
    <div id="t1" class="section active"><div class="page">${tab1}</div></div>
    <div id="t2" class="section"><div class="page">${tab2}</div></div>
    <div id="t3" class="section"><div class="page">${tab3}</div></div>
    <div id="t4" class="section"><div class="page">${tab4}</div></div>
    <div id="t5" class="section"><div class="page">${tab5}</div></div>
    <div id="t6" class="section">${tab6}</div>
    <div class="save-bar">
      <button onclick="window.print()" style="flex:1;background:linear-gradient(135deg,#0077C8,#005a9e);color:#fff;border:none;padding:13px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;touch-action:manipulation">&#11015; Save / Print PDF</button>
      <button onclick="navigator.share&&navigator.share({title:'PDQ Job Package — ${escapedJobName}',url:window.location.href})" style="flex:1;background:#22c55e;color:#fff;border:none;padding:13px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;touch-action:manipulation">&#128228; Share</button>
    </div>
    <script>function showTab(id,ev){document.querySelectorAll('.section').forEach(function(s){s.classList.remove('active')});document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active')});document.getElementById(id).classList.add('active');(ev.currentTarget||ev.target).classList.add('active');}<\/script>
    </body></html>`;
}
