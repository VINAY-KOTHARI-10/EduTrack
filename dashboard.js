document.addEventListener('DOMContentLoaded', async () => {
  // Set date
  const d = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('todayDate').textContent = d.toLocaleDateString('en-IN', opts);

  // Load dashboard stats
  try {
    const stats = await API.get('/api/dashboard');
    document.getElementById('statStudents').textContent = stats.totalStudents;
    document.getElementById('statSubjects').textContent = stats.totalSubjects;
    document.getElementById('statPresent').textContent = stats.presentToday;
    document.getElementById('statFeedback').textContent = stats.avgRating > 0 ? stats.avgRating + ' ★' : '—';
    document.getElementById('feedbackCount').textContent = stats.totalFeedback + ' submissions';
    document.getElementById('statAlert').textContent = stats.lowAttendance;

    const pct = stats.totalStudents > 0 ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0;
    document.getElementById('presentPercent').textContent = `↑ ${pct}% today`;

    if (stats.lowAttendance > 0) {
      document.getElementById('notifDot').classList.add('active');
    }
  } catch (e) { console.error(e); }

  // Attendance overview
  try {
    const attStats = await API.get('/api/attendance/stats');
    const container = document.getElementById('attendanceOverview');
    const sorted = attStats.sort((a, b) => a.percentage - b.percentage).slice(0, 6);
    
    if (sorted.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">◉</div><p>No attendance records yet</p></div>';
    } else {
      container.innerHTML = sorted.map(s => `
        <div class="overview-item">
          <div>
            <div class="ov-name">${s.student.name}</div>
            <div class="ov-detail">${s.student.rollNo} · ${s.student.class}</div>
          </div>
          <span class="ov-badge ${s.percentage >= 75 ? 'green' : s.percentage >= 50 ? 'orange' : 'red'}">
            ${s.percentage}%
          </span>
        </div>
      `).join('');
    }
  } catch (e) { console.error(e); }

  // Recent feedback
  try {
    const feedback = await API.get('/api/feedback');
    const subjects = await API.get('/api/subjects');
    const students = await API.get('/api/students');
    const container = document.getElementById('recentFeedback');
    const recent = feedback.slice(-5).reverse();
    
    if (recent.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">◎</div><p>No feedback submitted yet</p></div>';
    } else {
      container.innerHTML = recent.map(f => {
        const sub = subjects.find(s => s.id === f.subjectId);
        const stu = students.find(s => s.id === f.studentId);
        return `
          <div class="overview-item">
            <div>
              <div class="ov-name">${f.anonymous ? 'Anonymous' : (stu ? stu.name : 'Unknown')}</div>
              <div class="ov-detail">${sub ? sub.name : 'Unknown Subject'}</div>
            </div>
            <span class="ov-badge orange">${starsStr(f.rating)}</span>
          </div>
        `;
      }).join('');
    }
  } catch (e) { console.error(e); }

  // Global search
  document.getElementById('globalSearch')?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length > 1) {
      window.location.href = `students.html?search=${encodeURIComponent(q)}`;
    }
  });
});