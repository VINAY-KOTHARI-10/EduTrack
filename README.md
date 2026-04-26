# EduTrack — Student Attendance & Feedback Management System

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: JSON file-based (no setup required)

## Project Structure
```
harshaproject/
├── server.js              # Node.js Express backend
├── api.js                 # Frontend API helper
├── dashboard.js
├── students.js
├── attendance.js
├── feedback.js
├── reports.js
├── index.html             # Dashboard
├── students.html          # Student management
├── attendance.html        # Attendance marking
├── feedback.html          # Feedback submission
├── reports.html           # Analytics & reports
├── main.css
├── package.json
├── data/
│   └── db.json            # Auto-generated database
└── render.yaml            # Optional Render service blueprint
```

## Setup & Run

### Prerequisites
- Node.js v16+ installed

### Steps
```bash
# 1. Navigate to the project folder
cd harshaproject

# 2. Install dependencies
npm install

# 3. Start the server
npm start
# or: node server.js

# 4. Open in browser
# http://localhost:3000
```

## Frontend API Base URL

The frontend auto-resolves the backend URL:
- `http://localhost:3000` when opened on `localhost`/`127.0.0.1`.
- Same-origin API (`/api/...`) in production.
- Optional override via `localStorage` key `API_BASE_URL` or global `window.__API_BASE_URL__`.

Example override in browser console:
```js
localStorage.setItem('API_BASE_URL', 'https://your-render-service.onrender.com');
location.reload();
```

## Deploy Backend On Render

1. Push this project to GitHub.
2. In Render, create a `Web Service` from the repo.
3. Use:
    - Build Command: `npm install`
    - Start Command: `npm start`
4. Set optional environment variable:
    - `CORS_ORIGIN` = your frontend domain (or `*` during testing)
5. Deploy and test:
    - `https://your-service.onrender.com/health`
    - `https://your-service.onrender.com/api/dashboard`

If your frontend is hosted separately, set `API_BASE_URL` to your Render backend URL.

## Features

### Dashboard
- Live stats: total students, subjects, present today, avg feedback rating
- Low attendance alerts (< 75%)
- Quick action buttons
- Attendance overview & recent feedback panel

### Students
- View all students in a sortable table
- Filter by class (CS-A, CS-B, CS-C) or search by name/roll number
- Add new students via modal form
- Shows each student's attendance percentage with color-coded progress bar
- Delete students

### Attendance
- Select date, subject, class and load student list
- Mark each student as Present / Absent / Late with one click
- Bulk actions: Mark All Present / Absent
- Live summary count while marking
- View attendance history (filterable by student)
- Pre-loads existing attendance for edits

### Feedback
- Star rating (1–5) with hover effects
- Anonymous submission option
- Filter by subject
- Insights panel with per-subject rating averages
- Feedback type categorization

### Reports
- Attendance bar chart (visual)
- Full summary table with percentage and status badges
- Filter by attendance level (all / low / good)
- Subject-wise feedback rating chart
- Export attendance report as CSV

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/students | All students |
| POST | /api/students | Add student |
| DELETE | /api/students/:id | Remove student |
| GET | /api/subjects | All subjects |
| POST | /api/subjects | Add subject |
| GET | /api/attendance | Attendance records |
| POST | /api/attendance/bulk | Save bulk attendance |
| GET | /api/attendance/stats | Per-student stats |
| GET | /api/feedback | All feedback |
| POST | /api/feedback | Submit feedback |
| GET | /api/feedback/stats | Feedback analytics |
| GET | /api/dashboard | Dashboard summary |
