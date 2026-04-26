let allStats = [], allSubjects = [];

async function init() {
  allStats = await API.get('/api/attendance/stats');
  allSubjects = await API.get('/api/subjects');
  const fbStats = await API.get('/api/feedback/stats');

  renderBarChart(allStats);
  renderTable(allStats);
  renderSubjectFeedbackChart(fbStats);
}

function getFilteredStats() {
  const filter = document.getElementById('reportFilter').value;
  if (filter === 'low') return allStats.filter(s => s.percentage < 75 && s.total > 0);
  if (filter === 'good') return allStats.filter(s => s.percentage >= 75);
  return allStats;
}

function renderBarChart(stats) {
  const container = document.getElementById('attendanceChart');
  const maxH = 120;

  container.innerHTML = stats.map(s => {
    const h = s.total > 0 ? Math.max(4, (s.percentage / 100) * maxH) : 4;
    const cls = s.percentage >= 75 ? 'good' : s.percentage >= 50 ? 'medium' : 'low';
    const firstName = s.student.name.split(' ')[0];
    return `
      <div class="bar-wrap">
        <span class="bar-pct">${s.percentage}%</span>
        <div class="bar ${cls}" style="height:${h}px" title="${s.student.name}: ${s.percentage}%"></div>
        <span class="bar-label">${firstName}</span>
      </div>
    `;
  }).join('');
}

function renderTable(stats) {
  const tbody = document.getElementById('reportTableBody');
  if (stats.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">▣</div><p>No data available</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = stats.map(s => {
    const pct = s.percentage;
    const cls = pct >= 75 ? 'good' : pct >= 50 ? 'medium' : 'low';
    const badgeCls = pct >= 75 ? 'green' : pct >= 50 ? 'orange' : 'red';
    const status = pct >= 75 ? 'Good' : pct >= 50 ? 'At Risk' : 'Critical';
    return `
      <tr>
        <td><strong>${s.student.name}</strong></td>
        <td><span class="badge teal">${s.student.class}</span></td>
        <td>${s.total}</td>
        <td style="color:var(--green);font-weight:600">${s.present}</td>
        <td style="color:var(--red)">${s.absent}</td>
        <td style="color:var(--orange)">${s.late}</td>
        <td>
          <div class="att-pct-bar">
            <div class="pct-track"><div class="pct-fill ${cls}" style="width:${pct}%"></div></div>
            <strong>${pct}%</strong>
          </div>
        </td>
        <td><span class="badge ${badgeCls}">${status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderSubjectFeedbackChart(fbStats) {
  const container = document.getElementById('subjectFeedbackChart');
  const subMap = Object.fromEntries(allSubjects.map(s => [s.id, s]));
  const entries = Object.entries(fbStats.bySubject);

  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">◎</div><p>No feedback data yet</p></div>';
    return;
  }

  const maxH = 120;

  container.innerHTML = entries.map(([subId, data]) => {
    const sub = subMap[subId];
    const avg = data.count > 0 ? (data.totalRating / data.count) : 0;
    const h = Math.max(4, (avg / 5) * maxH);
    const cls = avg >= 4 ? 'good' : avg >= 2.5 ? 'medium' : 'low';
    return `
      <div class="bar-wrap">
        <span class="bar-pct">${avg.toFixed(1)}★</span>
        <div class="bar ${cls}" style="height:${h}px" title="${sub ? sub.name : subId}: ${avg.toFixed(1)}/5"></div>
        <span class="bar-label">${sub ? sub.code : subId}</span>
      </div>
    `;
  }).join('');
}

function exportCSV() {
  const stats = getFilteredStats();
  const rows = [
    ['Student Name', 'Roll No', 'Class', 'Total Classes', 'Present', 'Absent', 'Late', 'Attendance %', 'Status'],
    ...stats.map(s => [
      s.student.name, s.student.rollNo, s.student.class,
      s.total, s.present, s.absent, s.late, s.percentage + '%',
      s.percentage >= 75 ? 'Good' : s.percentage >= 50 ? 'At Risk' : 'Critical'
    ])
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'attendance_report.csv';
  a.click();
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  document.getElementById('reportFilter').addEventListener('change', () => {
    const filtered = getFilteredStats();
    renderBarChart(filtered);
    renderTable(filtered);
  });
  document.getElementById('exportBtn').addEventListener('click', exportCSV);
});