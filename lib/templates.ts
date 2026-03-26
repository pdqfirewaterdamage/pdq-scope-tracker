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

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function buildReportHTML(project: any, sheet: any, rooms: any[]): string {
  const cat3 = project.water_category === 'cat3';
  const catBadge = cat3
    ? `<span style="background:#d32f2f;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">CAT 3</span>`
    : `<span style="background:#0077C8;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">CAT 2</span>`;

  const afterHours = sheet.hours_type === 'after';
  const hoursBadge = afterHours
    ? `<span style="background:#FF6B00;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">After Hours</span>`
    : `<span style="background:#3a9e3f;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">Regular</span>`;

  const roomsHTML = rooms
    .map((room: any) => {
      const items: any[] = room.items || [];
      const grouped: Record<string, any[]> = {};
      for (const item of items) {
        const key = `${item.phase}__${item.subsection}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      }

      const sectionsHTML = Object.entries(grouped)
        .map(([_key, sectionItems]) => {
          const sectionLabel = sectionItems[0].subsection;
          const rowsHTML = sectionItems
            .map((item: any) => {
              const icon = getStatusIcon(item.status);
              const color = getStatusColor(item.status);
              const hoursCell = item.no_hours
                ? '&mdash;'
                : item.hours
                ? `${item.hours}h`
                : '';
              const noteCell = item.note
                ? `<em style="color:#6b7280;">${item.note}</em>`
                : '';
              const photosCell = item.photos?.length
                ? `&#128247; ${item.photos.length}`
                : '';
              return `
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">
                  <span style="color:${color};font-weight:bold;">${icon}</span>
                </td>
                <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.label}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${hoursCell}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${noteCell}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${photosCell}</td>
              </tr>`;
            })
            .join('');

          return `
          <tr>
            <td colspan="5" style="background:#f1f5f9;padding:6px 8px;font-weight:600;color:#1e293b;font-size:13px;">
              ${sectionLabel}
            </td>
          </tr>
          ${rowsHTML}`;
        })
        .join('');

      return `
      <div style="margin-bottom:24px;">
        <h3 style="background:#0077C8;color:#fff;padding:8px 12px;margin:0 0 0 0;border-radius:4px 4px 0 0;font-size:15px;">
          ${room.name}
        </h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:6px 8px;text-align:left;width:32px;"></th>
              <th style="padding:6px 8px;text-align:left;">Item</th>
              <th style="padding:6px 8px;text-align:center;width:60px;">Hours</th>
              <th style="padding:6px 8px;text-align:left;">Notes</th>
              <th style="padding:6px 8px;text-align:center;width:60px;">Photos</th>
            </tr>
          </thead>
          <tbody>
            ${sectionsHTML}
          </tbody>
        </table>
      </div>`;
    })
    .join('');

  const contentsSection =
    sheet.contents_status === 'yes'
      ? `
    <div style="margin-bottom:24px;">
      <h3 style="background:#0077C8;color:#fff;padding:8px 12px;margin:0 0 0 0;border-radius:4px 4px 0 0;font-size:15px;">
        Phase 2 — Contents
      </h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;font-size:13px;">
        <tbody>
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">Medium boxes</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${sheet.contents_boxes ?? 0}</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;">Contents cleaning hours</td>
            <td style="padding:6px 8px;">${sheet.contents_hours ?? 0}h</td>
          </tr>
        </tbody>
      </table>
    </div>`
      : '';

  const submittedAt = sheet.submitted_at
    ? `Submitted: ${formatDate(sheet.submitted_at)}`
    : 'Not yet submitted';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PDQ Scope Report — ${project.job_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div style="border-bottom:4px solid #0077C8;padding-bottom:16px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1 style="font-size:24px;color:#0077C8;font-weight:700;">PDQ Restoration</h1>
          <p style="font-size:12px;color:#6b7280;">Scope of Work Report</p>
        </div>
        <div style="text-align:right;font-size:12px;color:#6b7280;">
          <p>Generated: ${formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>

    <!-- Project Info -->
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <h2 style="font-size:18px;font-weight:700;">${project.job_name}</h2>
        <div style="display:flex;gap:6px;">${catBadge} ${hoursBadge}</div>
      </div>
      <p style="color:#6b7280;margin-bottom:4px;">&#128205; ${project.address}</p>
      <p style="color:#6b7280;margin-bottom:4px;">Job Type: ${project.job_type}</p>
      <p style="color:#6b7280;margin-bottom:4px;">Technician: ${sheet.tech_name ?? 'N/A'}</p>
      <p style="color:#6b7280;">Date: ${formatDate(sheet.date ?? sheet.created_at)}</p>
    </div>

    <!-- Contents -->
    ${contentsSection}

    <!-- Rooms -->
    ${roomsHTML}

    <!-- Footer -->
    <div style="border-top:1px solid #e5e7eb;margin-top:32px;padding-top:16px;font-size:11px;color:#6b7280;display:flex;justify-content:space-between;">
      <span>PDQ Restoration &mdash; Confidential</span>
      <span>${submittedAt}</span>
    </div>
  </div>
</body>
</html>`;
}
