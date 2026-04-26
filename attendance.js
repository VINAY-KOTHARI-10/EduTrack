let allStudents = [], allSubjects = [], currentStatuses = {};

async function init() {
  allStudents = await API.get('/api/students');
  allSubjects = await API.get('/api/subjects');

  // Set today's date
  document.getElementById('attDate').value = new Date().toISOString().split('T')[0];

  // Populate subject dropdown
  const subSel = document.getElementById('attSubject');
  allSubjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.code})`;
    subSel.appendChild(opt);
  });

  // Populate history student dropdown
  const histSel = document.getElementById('historyStudent');
  allStudents.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    histSel.appendChild(opt);
  });

  loadHistory();
}

async function loadStudentsForAttendance() {
  const date = document.getElementById('attDate').value;
  const subjectId = document.getElementById('attSubject').value;
  const cls = document.getElementById('attClass').value;

  if (!date || !subjectId || !cls) {
    showToast('Please select date, subject, and class', 'error');
    return;
  }

  const subject = allSubjects.find(s => s.id === subjectId);
  const students = allStudents.filter(s => s.class === cls);

  if (students.length === 0) {
    showToast('No students found for this class', 'error');
    return;
  }

  // Check existing attendance
  const existing = await API.get(`/api/attendance?date=${date}&subjectId=${subjectId}`);
  const existingMap = {};
  existing.forEach(r => existingMap[r.studentId] = r.status);

  currentStatuses = {};
  students.forEach(s => { currentStatuses[s.id] = existingMap[s.id] || 'present'; });

  const title = document.getElementById('sheetTitle');
  title.textContent = `${subject.name} · ${cls} · ${date}`;
  document.getElementById('attendanceSheetPanel').style.display = 'block';

  renderSheet(students);
  updateSummary(students);
}

function renderSheet(students) {
  const sheet = document.getElementById('attendanceSheet');
  sheet.innerHTML = students.map(s => `
    <div class="att-row ${currentStatuses[s.id] || 'present'}" id="row-${s.id}">
      <div class="att-student-info">
        <span class="att-student-name">${s.name}</span>
        <span class="att-student-roll">${s.rollNo}</span>
      </div>
      <div class="att-buttons">
        <button class="att-btn present ${currentStatuses[s.id] === 'present' ? 'active' : ''}" onclick="setStatus('${s.id}','present')">✓ Present</button>
        <button class="att-btn absent ${currentStatuses[s.id] === 'absent' ? 'active' : ''}" onclick="setStatus('${s.id}','absent')">✗ Absent</button>
        <button class="att-btn late ${currentStatuses[s.id] === 'late' ? 'active' : ''}" onclick="setStatus('${s.id}','late')">⧖ Late</button>
      </div>
    </div>
  `).join('');
}

function setStatus(studentId, status) {
  currentStatuses[studentId] = status;
  const row = document.getElementById(`row-${studentId}`);
  row.className = `att-row ${status}`;
  row.querySelectorAll('.att-btn').forEach(btn => btn.classList.remove('active'));
  row.querySelector(`.att-btn.${status}`).classList.add('active');
  const students = allStudents.filter(s => s.class === document.getElementById('attClass').value);
  updateSummary(students);
}

function updateSummary(students) {
  const ids = students.map(s => s.id);
  const present = ids.filter(id => currentStatuses[id] === 'present').length;
  const absent = ids.filter(id => currentStatuses[id] === 'absent').length;
  const late = ids.filter(id => currentStatuses[id] === 'late').length;
  document.getElementById('attSummary').innerHTML = `
    <span class="s-present">✓ Present: <span>${present}</span></span>
    <span class="s-absent">✗ Absent: <span>${absent}</span></span>
    <span class="s-late">⧖ Late: <span>${late}</span></span>
    <span style="color:var(--text-muted)">Total: <span>${ids.length}</span></span>
  `;
}

async function saveAttendance() {
  const date = document.getElementById('attDate').value;
  const subjectId = document.getElementById('attSubject').value;
  const records = Object.entries(currentStatuses).map(([studentId, status]) => ({ studentId, status }));

  try {
    await API.post('/api/attendance/bulk', { date, subjectId, records });
    showToast(`Attendance saved for ${records.length} students`, 'success');
    loadHistory();
  } catch (e) { showToast('Failed to save attendance', 'error'); }
}

async function loadHistory() {
  const studentId = document.getElementById('historyStudent').value;
  let url = '/api/attendance';
  if (studentId) url += `?studentId=${studentId}`;

  try {
    const records = await API.get(url);
    const subjects = await API.get('/api/subjects');
    const students = await API.get('/api/students');
    const subMap = Object.fromEntries(subjects.map(s => [s.id, s]));
    const stuMap = Object.fromEntries(students.map(s => [s.id, s]));

    const tbody = document.getElementById('historyTableBody');
    const recent = records.slice(-50).reverse();

    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">◉</div><p>No attendance records</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = recent.map(r => {
      const stu = stuMap[r.studentId];
      const sub = subMap[r.subjectId];
      return `
        <tr>
          <td>${r.date}</td>
          <td>${stu ? stu.name : 'Unknown'}</td>
          <td>${sub ? sub.name : 'Unknown'}</td>
          <td><span class="status-pill ${r.status}">${r.status}</span></td>
          <td style="color:var(--text-muted);font-size:0.78rem">${r.markedAt ? new Date(r.markedAt).toLocaleTimeString('en-IN') : '—'}</td>
        </tr>
      `;
    }).join('');
  } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('loadStudentsBtn').addEventListener('click', loadStudentsForAttendance);

  document.getElementById('markAllPresent').addEventListener('click', () => {
    const cls = document.getElementById('attClass').value;
    const students = allStudents.filter(s => s.class === cls);
    students.forEach(s => setStatus(s.id, 'present'));
  });

  document.getElementById('markAllAbsent').addEventListener('click', () => {
    const cls = document.getElementById('attClass').value;
    const students = allStudents.filter(s => s.class === cls);
    students.forEach(s => setStatus(s.id, 'absent'));
  });

  document.getElementById('saveAttendanceBtn').addEventListener('click', saveAttendance);
  document.getElementById('historyStudent').addEventListener('change', loadHistory);
});