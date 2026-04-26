let allStudents = [], attStats = [];

async function loadStudents() {
  try {
    allStudents = await API.get('/api/students');
    attStats = await API.get('/api/attendance/stats');
    renderTable();
  } catch (e) { console.error(e); }
}

function renderTable() {
  const search = document.getElementById('searchStudents').value.toLowerCase();
  const cls = document.getElementById('filterClass').value;
  
  let filtered = allStudents.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search) || s.rollNo.toLowerCase().includes(search);
    const matchClass = !cls || s.class === cls;
    return matchSearch && matchClass;
  });

  const tbody = document.getElementById('studentsTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">◈</div><p>No students found</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const stat = attStats.find(a => a.student.id === s.id);
    const pct = stat ? stat.percentage : 0;
    const pctClass = pct >= 75 ? 'green' : pct >= 50 ? 'orange' : 'red';
    return `
      <tr>
        <td><span class="badge blue">${s.rollNo}</span></td>
        <td><strong>${s.name}</strong></td>
        <td><span class="badge teal">${s.class}</span></td>
        <td><span style="color:var(--text-muted)">${s.email || '—'}</span></td>
        <td>${s.phone || '—'}</td>
        <td>
          <div class="att-pct-bar">
            <div class="pct-track"><div class="pct-fill ${pctClass}" style="width:${pct}%"></div></div>
            <span class="badge ${pctClass}">${stat ? pct + '%' : 'N/A'}</span>
          </div>
        </td>
        <td>
          <button class="btn-delete" onclick="deleteStudent('${s.id}', '${s.name}')" title="Delete student">✕</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteStudent(id, name) {
  if (!confirm(`Delete student "${name}"? This action cannot be undone.`)) return;
  try {
    await API.del(`/api/students/${id}`);
    await loadStudents();
    showToast(`${name} removed successfully`, 'success');
  } catch (e) { showToast('Failed to delete student', 'error'); }
}

async function saveStudent() {
  const name = document.getElementById('studentName').value.trim();
  const rollNo = document.getElementById('studentRoll').value.trim();
  const cls = document.getElementById('studentClass').value;
  const email = document.getElementById('studentEmail').value.trim();
  const phone = document.getElementById('studentPhone').value.trim();

  if (!name || !rollNo) { showToast('Name and Roll Number are required', 'error'); return; }

  try {
    await API.post('/api/students', { name, rollNo, class: cls, email, phone });
    document.getElementById('addStudentModal').classList.remove('open');
    await loadStudents();
    showToast(`${name} added successfully`, 'success');
    // Clear form
    ['studentName','studentRoll','studentEmail','studentPhone'].forEach(id => document.getElementById(id).value = '');
  } catch (e) { showToast('Failed to add student', 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
  // Check URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('search')) {
    document.getElementById('searchStudents').value = params.get('search');
  }

  loadStudents();

  document.getElementById('addStudentBtn').addEventListener('click', () => {
    document.getElementById('addStudentModal').classList.add('open');
  });

  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('addStudentModal').classList.remove('open');
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('addStudentModal').classList.remove('open');
  });

  document.getElementById('saveStudentBtn').addEventListener('click', saveStudent);

  document.getElementById('searchStudents').addEventListener('input', renderTable);
  document.getElementById('filterClass').addEventListener('change', renderTable);

  // Close modal on overlay click
  document.getElementById('addStudentModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('addStudentModal')) {
      document.getElementById('addStudentModal').classList.remove('open');
    }
  });
});