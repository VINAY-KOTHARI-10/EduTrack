let currentRating = 0;
let allSubjects = [], allStudents = [], allFeedback = [];

async function init() {
  allStudents = await API.get('/api/students');
  allSubjects = await API.get('/api/subjects');

  // Populate selects
  const fbStu = document.getElementById('fbStudent');
  allStudents.forEach(s => {
    const o = document.createElement('option');
    o.value = s.id; o.textContent = `${s.name} (${s.rollNo})`;
    fbStu.appendChild(o);
  });

  const fbSub = document.getElementById('fbSubject');
  const filterSub = document.getElementById('filterFbSubject');
  allSubjects.forEach(s => {
    [fbSub, filterSub].forEach(sel => {
      const o = document.createElement('option');
      o.value = s.id; o.textContent = s.name;
      sel.appendChild(o);
    });
  });

  await loadFeedback();
  await loadInsights();
}

async function loadFeedback() {
  allFeedback = await API.get('/api/feedback');
  renderFeedback();
}

function renderFeedback() {
  const filterSub = document.getElementById('filterFbSubject').value;
  let items = allFeedback;
  if (filterSub) items = items.filter(f => f.subjectId === filterSub);
  items = items.slice().reverse();

  const container = document.getElementById('feedbackList');
  if (items.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">◎</div><p>No feedback yet. Be the first to submit!</p></div>';
    return;
  }

  const subMap = Object.fromEntries(allSubjects.map(s => [s.id, s]));
  const stuMap = Object.fromEntries(allStudents.map(s => [s.id, s]));

  container.innerHTML = items.map(f => {
    const sub = subMap[f.subjectId];
    const stu = stuMap[f.studentId];
    return `
      <div class="feedback-card">
        <div class="fb-card-header">
          <div>
            <div class="ov-name">${f.anonymous ? '🔒 Anonymous' : (stu ? stu.name : 'Unknown')}</div>
            <div class="fb-card-meta">${sub ? sub.name : 'Unknown Subject'} · ${fmtDate(f.submittedAt)}</div>
          </div>
          <div class="fb-card-stars">${starsStr(f.rating)}</div>
        </div>
        ${f.comment ? `<div class="fb-card-comment">"${f.comment}"</div>` : ''}
        <span class="fb-card-tag">${f.type || 'general'}</span>
      </div>
    `;
  }).join('');
}

async function loadInsights() {
  try {
    const stats = await API.get('/api/feedback/stats');
    const subMap = Object.fromEntries(allSubjects.map(s => [s.id, s]));
    const container = document.getElementById('feedbackInsights');

    if (Object.keys(stats.bySubject).length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">◎</div><p>Submit feedback to see insights</p></div>';
      return;
    }

    const maxCount = Math.max(...Object.values(stats.bySubject).map(s => s.count));

    container.innerHTML = `
      <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
        <div style="font-size:0.78rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Overall Average</div>
        <div style="font-family:'Syne',sans-serif;font-size:2rem;font-weight:800">${stats.avgRating} <span style="color:#f59e0b;font-size:1.2rem">${starsStr(stats.avgRating)}</span></div>
        <div style="font-size:0.78rem;color:var(--text-muted)">${stats.total} total responses</div>
      </div>
      ${Object.entries(stats.bySubject).map(([subId, data]) => {
        const sub = subMap[subId];
        const avg = data.count > 0 ? (data.totalRating / data.count).toFixed(1) : 0;
        const pct = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
        return `
          <div class="insight-item">
            <div class="insight-subject">${sub ? sub.name : 'Unknown Subject'}</div>
            <div class="insight-bar-wrap"><div class="insight-bar" style="width:${pct}%"></div></div>
            <div class="insight-meta">${avg} ★ · ${data.count} responses</div>
          </div>
        `;
      }).join('')}
    `;
  } catch (e) { console.error(e); }
}

async function submitFeedback() {
  const studentId = document.getElementById('fbStudent').value;
  const subjectId = document.getElementById('fbSubject').value;
  const type = document.getElementById('fbType').value;
  const rating = parseInt(document.getElementById('fbRating').value);
  const comment = document.getElementById('fbComment').value.trim();
  const anonymous = document.getElementById('fbAnonymous').checked;

  if (!subjectId) { showToast('Please select a subject', 'error'); return; }
  if (!rating) { showToast('Please select a rating', 'error'); return; }
  if (!anonymous && !studentId) { showToast('Please select a student or submit anonymously', 'error'); return; }

  try {
    await API.post('/api/feedback', { studentId: anonymous ? null : studentId, subjectId, type, rating, comment, anonymous });
    showToast('Feedback submitted successfully!', 'success');
    // Reset
    document.getElementById('fbStudent').value = '';
    document.getElementById('fbSubject').value = '';
    document.getElementById('fbComment').value = '';
    document.getElementById('fbAnonymous').checked = false;
    currentRating = 0;
    document.getElementById('fbRating').value = 0;
    document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    await loadFeedback();
    await loadInsights();
  } catch (e) { showToast('Failed to submit feedback', 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
  init();

  // Star rating
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      currentRating = val;
      document.getElementById('fbRating').value = val;
      document.querySelectorAll('.star').forEach((s, i) => {
        s.classList.toggle('active', i < val);
      });
    });

    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val);
      document.querySelectorAll('.star').forEach((s, i) => {
        s.style.color = i < val ? '#f59e0b' : '';
      });
    });

    star.parentElement.addEventListener('mouseleave', () => {
      document.querySelectorAll('.star').forEach((s, i) => {
        s.style.color = '';
        s.classList.toggle('active', i < currentRating);
      });
    });
  });

  document.getElementById('submitFeedbackBtn').addEventListener('click', submitFeedback);
  document.getElementById('filterFbSubject').addEventListener('change', renderFeedback);
});