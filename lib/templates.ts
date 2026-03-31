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
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtDateShort(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

// Labor rate
const LABOR_REGULAR = 65.00;
const LABOR_AFTER = 97.50;

export function buildReportHTML(project: any, sheet: any, rooms: any[]): string {
  return buildCompleteReportHTML(project, [sheet], rooms);
}

export function buildCompleteReportHTML(project: any, sheets: any[], allRooms: any[]): string {
  const cat3 = project.water_category === 'cat3';
  const primarySheet = sheets[0];

  // ─── TAB 1: SUMMARY ──────────────────────────────────────────────────────
  const totalItems = allRooms.reduce((sum: number, r: any) => sum + (r.items?.length || 0), 0);
  const doneItems = allRooms.reduce((sum: number, r: any) =>
    sum + (r.items?.filter((i: any) => i.status === 'done').length || 0), 0);
  const totalHours = allRooms.reduce((sum: number, r: any) =>
    sum + (r.items?.reduce((s: number, i: any) => s + (i.status === 'done' && i.hours ? i.hours : 0), 0) || 0), 0);
  const regularHours = allRooms.reduce((sum: number, r: any) =>
    sum + (r.items?.reduce((s: number, i: any) => s + (i.status === 'done' && i.hours && i.hours_type === 'regular' ? i.hours : 0), 0) || 0), 0);
  const afterHours = totalHours - regularHours;

  const summaryTab = `
    <div class="tab-content" id="tab-summary">
      <h2 style="color:#0077C8;margin-bottom:16px;">Project Summary</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
        <div style="background:#f0f9ff;border-radius:8px;padding:16px;text-align:center;border:1px solid #bae6fd;">
          <div style="font-size:28px;font-weight:800;color:#0077C8;">${allRooms.length}</div>
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Rooms</div>
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;border:1px solid #bbf7d0;">
          <div style="font-size:28px;font-weight:800;color:#16a34a;">${doneItems}/${totalItems}</div>
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Items Done</div>
        </div>
        <div style="background:#fefce8;border-radius:8px;padding:16px;text-align:center;border:1px solid #fde68a;">
          <div style="font-size:28px;font-weight:800;color:#d97706;">${totalHours}h</div>
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Total Hours</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
        <tr style="background:#f8fafc;">
          <td style="padding:8px;font-weight:600;border-bottom:1px solid #e5e7eb;">Job Name</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${project.job_name}</td>
        </tr>
        <tr>
          <td style="padding:8px;font-weight:600;border-bottom:1px solid #e5e7eb;">Address</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${project.address || '—'}</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:8px;font-weight:600;border-bottom:1px solid #e5e7eb;">Job Type</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${project.job_type}</td>
        </tr>
        <tr>
          <td style="padding:8px;font-weight:600;border-bottom:1px solid #e5e7eb;">Water Category</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${cat3 ? 'Category 3 — Black Water' : 'Category 2 — Gray Water'}</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:8px;font-weight:600;border-bottom:1px solid #e5e7eb;">Technician</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${primarySheet.tech_name || '—'}</td>
        </tr>
        <tr>
          <td style="padding:8px;font-weight:600;">Date</td>
          <td style="padding:8px;">${fmtDate(primarySheet.date)}</td>
        </tr>
      </table>

      ${primarySheet.contents_status === 'yes' ? `
        <div style="background:#f5f3ff;border-left:4px solid #a855f7;border-radius:0 6px 6px 0;padding:12px;margin-top:16px;">
          <strong style="color:#7c3aed;">&#128230; Contents Job</strong>
          <span style="margin-left:16px;">${primarySheet.contents_boxes ?? 0} boxes &middot; ${primarySheet.contents_hours ?? 0}h cleaning</span>
        </div>
      ` : ''}
    </div>`;

  // ─── TAB 2: DAILY LOG ─────────────────────────────────────────────────────
  const dailyLogRows = allRooms.map((room: any) => {
    const items: any[] = room.items || [];
    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      const key = item.subsection;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    const sectionsHTML = Object.entries(grouped).map(([sub, sItems]) => {
      const rowsHTML = sItems.map((item: any) => {
        const icon = getStatusIcon(item.status);
        const color = getStatusColor(item.status);
        const hoursCell = item.hours ? `${item.hours}h` : item.no_hours ? '&mdash;' : '';
        const noteCell = item.note ? `<em style="color:#6b7280;font-size:11px;">${item.note}</em>` : '';
        const qtyCell = item.qty_value ? `<span style="color:#6366f1;font-size:11px;">${item.qty_value} ${item.input_type || ''}</span>` : '';
        return `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;"><span style="color:${color};font-weight:bold;">${icon}</span></td>
          <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;">${item.label}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">${qtyCell}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">${hoursCell}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;">${noteCell}</td>
        </tr>`;
      }).join('');

      return `<tr><td colspan="5" style="background:#f1f5f9;padding:4px 8px;font-weight:600;font-size:12px;color:#475569;">${sub}</td></tr>${rowsHTML}`;
    }).join('');

    return `
      <div style="margin-bottom:20px;">
        <h3 style="background:#0077C8;color:#fff;padding:8px 12px;margin:0;border-radius:4px 4px 0 0;font-size:14px;">&#127968; ${room.name}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb;border-top:none;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:4px 8px;width:24px;"></th>
            <th style="padding:4px 8px;text-align:left;">Item</th>
            <th style="padding:4px 8px;text-align:center;width:60px;">Qty</th>
            <th style="padding:4px 8px;text-align:center;width:50px;">Hours</th>
            <th style="padding:4px 8px;text-align:left;">Notes</th>
          </tr></thead>
          <tbody>${sectionsHTML}</tbody>
        </table>
      </div>`;
  }).join('');

  const dailyLogTab = `
    <div class="tab-content" id="tab-daily" style="display:none;">
      <h2 style="color:#0077C8;margin-bottom:16px;">Daily Activity Log</h2>
      <p style="color:#6b7280;margin-bottom:16px;">Date: ${fmtDate(primarySheet.date)} &middot; Tech: ${primarySheet.tech_name || '—'}</p>
      ${dailyLogRows}
    </div>`;

  // ─── TAB 3: BILLING ──────────────────────────────────────────────────────
  let billingTotal = 0;
  const billingRows = allRooms.map((room: any) => {
    const items: any[] = room.items || [];
    const doneItems = items.filter((i: any) => i.status === 'done');
    if (doneItems.length === 0) return '';

    let roomTotal = 0;
    const rows = doneItems.map((item: any) => {
      const pricing = XPC[item.scope_item_id];
      if (!pricing) return '';
      const qty = parseFloat(item.qty_value || '1') || 1;
      const lineTotal = qty * pricing.price;
      roomTotal += lineTotal;
      return `<tr>
        <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;">${item.label}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">${qty}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">${pricing.unit}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">${fmt$(pricing.price)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">${fmt$(lineTotal)}</td>
      </tr>`;
    }).filter(Boolean).join('');

    // Labor
    const roomHrs = doneItems.reduce((s: number, i: any) => s + (i.hours || 0), 0);
    const roomRegHrs = doneItems.reduce((s: number, i: any) => s + (i.hours_type === 'regular' && i.hours ? i.hours : 0), 0);
    const roomAftHrs = roomHrs - roomRegHrs;
    const laborCost = (roomRegHrs * LABOR_REGULAR) + (roomAftHrs * LABOR_AFTER);
    roomTotal += laborCost;
    billingTotal += roomTotal;

    return `
      <div style="margin-bottom:16px;">
        <h3 style="background:#1e293b;color:#fff;padding:6px 10px;margin:0;border-radius:4px 4px 0 0;font-size:13px;">&#127968; ${room.name}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb;border-top:none;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:4px 8px;text-align:left;">Item</th>
            <th style="padding:4px 8px;text-align:center;width:40px;">Qty</th>
            <th style="padding:4px 8px;text-align:center;width:50px;">Unit</th>
            <th style="padding:4px 8px;text-align:right;width:70px;">Rate</th>
            <th style="padding:4px 8px;text-align:right;width:80px;">Total</th>
          </tr></thead>
          <tbody>
            ${rows}
            ${laborCost > 0 ? `<tr style="background:#fefce8;">
              <td style="padding:4px 8px;font-weight:600;" colspan="2">Labor (${roomRegHrs}h reg + ${roomAftHrs}h OT)</td>
              <td style="padding:4px 8px;text-align:center;">HR</td>
              <td style="padding:4px 8px;text-align:right;">&mdash;</td>
              <td style="padding:4px 8px;text-align:right;font-weight:600;">${fmt$(laborCost)}</td>
            </tr>` : ''}
            <tr style="background:#f0f9ff;">
              <td colspan="4" style="padding:6px 8px;font-weight:700;text-align:right;">Room Total</td>
              <td style="padding:6px 8px;text-align:right;font-weight:700;color:#0077C8;">${fmt$(roomTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }).filter(Boolean).join('');

  // Contents billing
  let contentsTotal = 0;
  let contentsBillingHTML = '';
  if (primarySheet.contents_status === 'yes') {
    const boxes = primarySheet.contents_boxes || 0;
    const hrs = primarySheet.contents_hours || 0;
    contentsTotal = (boxes * 95) + (hrs * LABOR_REGULAR);
    billingTotal += contentsTotal;
    contentsBillingHTML = `
      <div style="margin-bottom:16px;">
        <h3 style="background:#7c3aed;color:#fff;padding:6px 10px;margin:0;border-radius:4px 4px 0 0;font-size:13px;">&#128230; Contents</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb;border-top:none;">
          <tbody>
            <tr><td style="padding:4px 8px;">Contents pack/move (medium box)</td><td style="text-align:center;">${boxes}</td><td style="text-align:center;">EA</td><td style="text-align:right;">$95.00</td><td style="text-align:right;font-weight:600;">${fmt$(boxes * 95)}</td></tr>
            <tr><td style="padding:4px 8px;">Contents cleaning labor</td><td style="text-align:center;">${hrs}</td><td style="text-align:center;">HR</td><td style="text-align:right;">${fmt$(LABOR_REGULAR)}</td><td style="text-align:right;font-weight:600;">${fmt$(hrs * LABOR_REGULAR)}</td></tr>
            <tr style="background:#f5f3ff;"><td colspan="4" style="padding:6px 8px;font-weight:700;text-align:right;">Contents Total</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:#7c3aed;">${fmt$(contentsTotal)}</td></tr>
          </tbody>
        </table>
      </div>`;
  }

  const billingTab = `
    <div class="tab-content" id="tab-billing" style="display:none;">
      <h2 style="color:#0077C8;margin-bottom:16px;">Billing Summary</h2>
      ${billingRows}
      ${contentsBillingHTML}
      <div style="background:#0077C8;color:#fff;border-radius:8px;padding:16px;text-align:right;font-size:18px;">
        <strong>Grand Total: ${fmt$(billingTotal)}</strong>
      </div>
    </div>`;

  // ─── TAB 4: TECH HOURS ────────────────────────────────────────────────────
  const techHoursTab = `
    <div class="tab-content" id="tab-hours" style="display:none;">
      <h2 style="color:#0077C8;margin-bottom:16px;">Tech Hours</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:8px;text-align:left;">Technician</th>
          <th style="padding:8px;text-align:center;">Regular</th>
          <th style="padding:8px;text-align:center;">After Hours</th>
          <th style="padding:8px;text-align:center;">Total</th>
          <th style="padding:8px;text-align:right;">Labor Cost</th>
        </tr></thead>
        <tbody>
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${primarySheet.tech_name || '—'}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${regularHours}h</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${afterHours}h</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;">${totalHours}h</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt$(regularHours * LABOR_REGULAR + afterHours * LABOR_AFTER)}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:6px;font-size:12px;color:#6b7280;">
        Regular rate: ${fmt$(LABOR_REGULAR)}/hr &middot; After hours rate: ${fmt$(LABOR_AFTER)}/hr (1.5x)
      </div>
    </div>`;

  // ─── TAB 5: EQUIPMENT ─────────────────────────────────────────────────────
  const equipmentItems = allRooms.flatMap((r: any) =>
    (r.items || []).filter((i: any) => i.no_hours && i.status === 'done' && i.qty_value)
  );

  const equipmentRows = equipmentItems.map((item: any) => {
    const pricing = XPC[item.scope_item_id];
    const qty = parseInt(item.qty_value || '1') || 1;
    const rate = pricing?.price ?? 0;
    const total = qty * rate;
    return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.label}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${qty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${pricing?.unit || 'EA'}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt$(rate)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt$(total)}</td>
    </tr>`;
  }).join('');

  const equipTotal = equipmentItems.reduce((sum: number, item: any) => {
    const pricing = XPC[item.scope_item_id];
    const qty = parseInt(item.qty_value || '1') || 1;
    return sum + (qty * (pricing?.price ?? 0));
  }, 0);

  const equipmentTab = `
    <div class="tab-content" id="tab-equipment" style="display:none;">
      <h2 style="color:#0077C8;margin-bottom:16px;">Equipment Log</h2>
      ${equipmentItems.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:6px 8px;text-align:left;">Equipment</th>
            <th style="padding:6px 8px;text-align:center;width:50px;">Qty</th>
            <th style="padding:6px 8px;text-align:center;width:60px;">Unit</th>
            <th style="padding:6px 8px;text-align:right;width:70px;">Rate</th>
            <th style="padding:6px 8px;text-align:right;width:80px;">Total</th>
          </tr></thead>
          <tbody>${equipmentRows}</tbody>
          <tfoot><tr style="background:#f0f9ff;">
            <td colspan="4" style="padding:8px;text-align:right;font-weight:700;">Equipment Total</td>
            <td style="padding:8px;text-align:right;font-weight:700;color:#0077C8;">${fmt$(equipTotal)}</td>
          </tr></tfoot>
        </table>
      ` : '<p style="color:#6b7280;">No equipment logged for this sheet.</p>'}
    </div>`;

  // ─── TAB 6: XACTIMATE ────────────────────────────────────────────────────
  const allDoneItems = allRooms.flatMap((r: any) =>
    (r.items || []).filter((i: any) => i.status === 'done').map((i: any) => ({ ...i, roomName: r.name }))
  );

  const xactRows = allDoneItems.map((item: any) => {
    const pricing = XPC[item.scope_item_id];
    if (!pricing) return '';
    const qty = parseFloat(item.qty_value || '1') || 1;
    const total = qty * pricing.price;
    return `<tr>
      <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.roomName}</td>
      <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.scope_item_id}</td>
      <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.label}</td>
      <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center;">${qty}</td>
      <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center;">${pricing.unit}</td>
      <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right;">${fmt$(pricing.price)}</td>
      <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right;font-weight:600;">${fmt$(total)}</td>
    </tr>`;
  }).filter(Boolean).join('');

  const xactTotal = allDoneItems.reduce((sum: number, item: any) => {
    const pricing = XPC[item.scope_item_id];
    if (!pricing) return sum;
    const qty = parseFloat(item.qty_value || '1') || 1;
    return sum + (qty * pricing.price);
  }, 0);

  const xactimateTab = `
    <div class="tab-content" id="tab-xactimate" style="display:none;">
      <h2 style="color:#0077C8;margin-bottom:4px;">Xactimate Format</h2>
      <p style="color:#6b7280;font-size:12px;margin-bottom:16px;">PDQ Billing Package — ${project.job_name}</p>
      <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb;">
        <thead><tr style="background:#1e293b;color:#fff;">
          <th style="padding:4px 6px;text-align:left;">Room</th>
          <th style="padding:4px 6px;text-align:left;">Code</th>
          <th style="padding:4px 6px;text-align:left;">Description</th>
          <th style="padding:4px 6px;text-align:center;">Qty</th>
          <th style="padding:4px 6px;text-align:center;">Unit</th>
          <th style="padding:4px 6px;text-align:right;">Rate</th>
          <th style="padding:4px 6px;text-align:right;">Total</th>
        </tr></thead>
        <tbody>${xactRows}</tbody>
        <tfoot><tr style="background:#0077C8;color:#fff;">
          <td colspan="6" style="padding:6px;text-align:right;font-weight:700;">Material/Equipment Total</td>
          <td style="padding:6px;text-align:right;font-weight:700;">${fmt$(xactTotal)}</td>
        </tr></tfoot>
      </table>
      <div style="margin-top:12px;padding:10px;background:#fefce8;border-radius:6px;font-size:11px;color:#92400e;">
        Note: Labor charges calculated separately at ${fmt$(LABOR_REGULAR)}/hr (regular) and ${fmt$(LABOR_AFTER)}/hr (after hours).
        Total labor: ${fmt$(regularHours * LABOR_REGULAR + afterHours * LABOR_AFTER)}.
        <strong>Combined total: ${fmt$(xactTotal + regularHours * LABOR_REGULAR + afterHours * LABOR_AFTER)}</strong>
      </div>
    </div>`;

  // ─── FULL HTML ────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PDQ Report — ${project.job_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #f8fafc; }
    .page { max-width: 900px; margin: 0 auto; padding: 24px; }
    .tabs { display: flex; gap: 2px; margin-bottom: 20px; background: #e2e8f0; border-radius: 8px; overflow: hidden; flex-wrap: wrap; }
    .tab-btn { padding: 10px 14px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: #e2e8f0; color: #475569; transition: all 0.15s; }
    .tab-btn:hover { background: #cbd5e1; }
    .tab-btn.active { background: #0077C8; color: #fff; }
    .tab-content { background: #fff; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb; }
    @media print { .tabs { display: none; } .tab-content { display: block !important; page-break-after: always; } }
  </style>
</head>
<body>
  <div class="page">
    <div style="border-bottom:4px solid #0077C8;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <h1 style="font-size:22px;color:#0077C8;">PDQ Restoration</h1>
        <p style="font-size:11px;color:#6b7280;">Complete Scope Report</p>
      </div>
      <div style="text-align:right;font-size:11px;color:#6b7280;">
        <p>${fmtDate(new Date().toISOString())}</p>
        <p>${project.job_name}</p>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" onclick="showTab('summary')">&#128202; Summary</button>
      <button class="tab-btn" onclick="showTab('daily')">&#128203; Daily Log</button>
      <button class="tab-btn" onclick="showTab('billing')">&#128176; Billing</button>
      <button class="tab-btn" onclick="showTab('hours')">&#128119; Tech Hours</button>
      <button class="tab-btn" onclick="showTab('equipment')">&#128295; Equipment</button>
      <button class="tab-btn" onclick="showTab('xactimate')">&#128196; Xactimate</button>
    </div>

    ${summaryTab}
    ${dailyLogTab}
    ${billingTab}
    ${techHoursTab}
    ${equipmentTab}
    ${xactimateTab}

    <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:12px;font-size:11px;color:#6b7280;display:flex;justify-content:space-between;">
      <span>PDQ Restoration &mdash; Confidential</span>
      <span>${primarySheet.submitted_at ? 'Submitted: ' + fmtDate(primarySheet.submitted_at) : 'Not yet submitted'}</span>
    </div>
  </div>

  <script>
    function showTab(id) {
      document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-' + id).style.display = 'block';
      event.currentTarget.classList.add('active');
    }
  </script>
</body>
</html>`;
}
