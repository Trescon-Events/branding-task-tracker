// ================= STATE MANAGEMENT =================
let state = {
  tasks: [],
  timesheets: [],
  users: ['Nazim', 'Waseem S', 'Sajeesh Kombath', 'Krishanu Karmakar', 'Lohith BC', 'Kalander Shafi', 'Monith', 'Imran', 'Utkarsh', 'Rovie', 'Samprity'],
  currentUser: '',
  dailyGoalHours: 8,
  activeTimer: {
    taskId: null,
    taskName: 'No active task',
    startTime: null,
    accumulatedTime: 0, // in ms
    isRunning: false
  },
  currentSort: {
    column: 'id',
    direction: 'desc'
  },
  charts: {
    workload: null,
    category: null
  }
};

let timerInterval = null;

// ================= OFFLINE STORAGE & BRAND FALLBACKS =================
const useLocalStorageFallback = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';
let isOfflineMode = useLocalStorageFallback;

const defaultOfflineTasks = [
  {
    id: 1,
    event_name: "Bespoke Events",
    description: "Zoom - LP",
    assigned_by: "Monith",
    assigned_to: "Sajeesh Kombath",
    assigned_date: "2026-04-27",
    deadline: "2026-04-30",
    status: "In-Progress",
    priority: "High",
    remarks: "Initial sync setup",
    tracked_seconds: 0
  },
  {
    id: 2,
    event_name: "BSS: Bengaluru, India, Nov",
    description: "PR banner",
    assigned_by: "Imran",
    assigned_to: "Sajeesh Kombath",
    assigned_date: "2026-04-28",
    deadline: "2026-04-30",
    status: "Not-Started",
    priority: "High",
    remarks: "",
    tracked_seconds: 0
  },
  {
    id: 3,
    event_name: "Others",
    description: "WAIS Malaysia - website",
    assigned_by: "Utkarsh",
    assigned_to: "Sajeesh Kombath",
    assigned_date: "2026-04-29",
    deadline: "2026-05-04",
    status: "Not-Started",
    priority: "Medium",
    remarks: "",
    tracked_seconds: 0
  },
  {
    id: 4,
    event_name: "DFS: Dubai, UAE, 2-6 Nov",
    description: "Event Guideline",
    assigned_by: "Rovie",
    assigned_to: "Kalander Shafi",
    assigned_date: "2026-05-04",
    deadline: "2026-05-06",
    status: "In-Progress",
    priority: "High",
    remarks: "Awaiting final layout approval",
    tracked_seconds: 0
  },
  {
    id: 5,
    event_name: "Others",
    description: "Event Logos",
    assigned_by: "Rovie",
    assigned_to: "Kalander Shafi",
    assigned_date: "2026-05-08",
    deadline: "2026-05-15",
    status: "In-Progress",
    priority: "High",
    remarks: "",
    tracked_seconds: 0
  },
  {
    id: 6,
    event_name: "DFS: Dubai, UAE, 2-6 Nov",
    description: "New Floorplan",
    assigned_by: "",
    assigned_to: "Kalander Shafi",
    assigned_date: "2026-06-24",
    deadline: "2026-07-03",
    status: "In-Progress",
    priority: "Medium",
    remarks: "",
    tracked_seconds: 0
  },
  {
    id: 7,
    event_name: "DFS: Dubai, UAE, 2-6 Nov",
    description: "Socials",
    assigned_by: "Samprity",
    assigned_to: "Kalander Shafi",
    assigned_date: "2026-06-26",
    deadline: "2026-07-10",
    status: "Not-Started",
    priority: "High",
    remarks: "",
    tracked_seconds: 0
  },
  {
    id: 8,
    event_name: "DFS: Dubai, UAE, 2-6 Nov",
    description: "Media banners",
    assigned_by: "Samprity",
    assigned_to: "Kalander Shafi",
    assigned_date: "2026-06-26",
    deadline: "2026-07-17",
    status: "In-Progress",
    priority: "Medium",
    remarks: "",
    tracked_seconds: 0
  },
  {
    id: 9,
    event_name: "DFFW: UAE, 2-6 Nov",
    description: "Banners",
    assigned_by: "Samprity",
    assigned_to: "Kalander Shafi",
    assigned_date: "2026-06-29",
    deadline: "2026-07-17",
    status: "Not-Started",
    priority: "High",
    remarks: "",
    tracked_seconds: 0
  },
  {
    id: 10,
    event_name: "DFFW: UAE, 2-6 Nov",
    description: "Socials",
    assigned_by: "Samprity",
    assigned_to: "Kalander Shafi",
    assigned_date: "2026-06-29",
    deadline: "2026-07-24",
    status: "In-Progress",
    priority: "High",
    remarks: "",
    tracked_seconds: 0
  }
];

function initOfflineStorage() {
  if (!localStorage.getItem('studio_tasks')) {
    localStorage.setItem('studio_tasks', JSON.stringify(defaultOfflineTasks));
  }
  if (!localStorage.getItem('studio_timesheets')) {
    localStorage.setItem('studio_timesheets', JSON.stringify([]));
  }
  if (!localStorage.getItem('studio_next_task_id')) {
    localStorage.setItem('studio_next_task_id', '11');
  }
  if (!localStorage.getItem('studio_next_log_id')) {
    localStorage.setItem('studio_next_log_id', '1');
  }

  // Update UI Status bar
  const statusText = document.querySelector('.status-left span:not(.status-indicator)');
  if (statusText) statusText.textContent = 'JSON Storage Fallback';
  const indicator = document.querySelector('.status-indicator');
  if (indicator) {
    indicator.classList.remove('online');
    indicator.style.backgroundColor = '#f59e0b'; // Amber warning color
    indicator.style.boxShadow = '0 0 4px #f59e0b';
  }
}

if (isOfflineMode) {
  initOfflineStorage();
}

// Unified API calls routing wrapper
async function apiGet(url) {
  if (!isOfflineMode) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      throw new Error('API server returned error');
    } catch (err) {
      console.warn('API connection failed, falling back to LocalStorage:', err);
      isOfflineMode = true;
      initOfflineStorage();
    }
  }

  // Fallback Logic
  if (url === '/api/users') {
    const standardUsers = ['Nazim', 'Waseem S', 'Sajeesh Kombath', 'Krishanu Karmakar', 'Lohith BC', 'Kalander Shafi', 'Monith', 'Imran', 'Utkarsh', 'Rovie', 'Samprity'];
    const tasks = JSON.parse(localStorage.getItem('studio_tasks') || '[]');
    const dbUsers = [];
    tasks.forEach(t => {
      if (t.assigned_to && !dbUsers.includes(t.assigned_to)) dbUsers.push(t.assigned_to);
      if (t.assigned_by && !dbUsers.includes(t.assigned_by)) dbUsers.push(t.assigned_by);
    });
    return Array.from(new Set([...standardUsers, ...dbUsers]));
  }

  if (url === '/api/tasks') {
    return JSON.parse(localStorage.getItem('studio_tasks') || '[]');
  }

  if (url === '/api/timesheets') {
    const timesheets = JSON.parse(localStorage.getItem('studio_timesheets') || '[]');
    const tasks = JSON.parse(localStorage.getItem('studio_tasks') || '[]');
    return timesheets.map(log => {
      const task = tasks.find(t => t.id === log.task_id);
      return {
        ...log,
        task_description: task ? task.description : log.description,
        event_name: task ? task.event_name : 'Others'
      };
    });
  }
}

async function apiPost(url, data) {
  if (!isOfflineMode) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
      throw new Error('API post failed');
    } catch (err) {
      console.warn('API connection failed, falling back to LocalStorage:', err);
      isOfflineMode = true;
      initOfflineStorage();
    }
  }

  // Fallback Logic
  if (url === '/api/tasks') {
    const tasks = JSON.parse(localStorage.getItem('studio_tasks') || '[]');
    let nextId = parseInt(localStorage.getItem('studio_next_task_id') || '11');
    const newTask = {
      ...data,
      id: nextId++,
      tracked_seconds: 0
    };
    tasks.unshift(newTask);
    localStorage.setItem('studio_tasks', JSON.stringify(tasks));
    localStorage.setItem('studio_next_task_id', nextId.toString());
    return newTask;
  }

  if (url === '/api/timesheets') {
    const timesheets = JSON.parse(localStorage.getItem('studio_timesheets') || '[]');
    const tasks = JSON.parse(localStorage.getItem('studio_tasks') || '[]');
    let nextId = parseInt(localStorage.getItem('studio_next_log_id') || '1');
    const newLog = {
      ...data,
      id: nextId++
    };
    timesheets.unshift(newLog);
    localStorage.setItem('studio_timesheets', JSON.stringify(timesheets));
    localStorage.setItem('studio_next_log_id', nextId.toString());

    // Update task tracked seconds
    if (newLog.task_id) {
      const task = tasks.find(t => t.id === newLog.task_id);
      if (task) {
        task.tracked_seconds = (task.tracked_seconds || 0) + newLog.duration_seconds;
        localStorage.setItem('studio_tasks', JSON.stringify(tasks));
      }
    }
    return newLog;
  }
}

async function apiPut(url, data) {
  if (!isOfflineMode) {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
      throw new Error('API put failed');
    } catch (err) {
      console.warn('API connection failed, falling back to LocalStorage:', err);
      isOfflineMode = true;
      initOfflineStorage();
    }
  }

  // Fallback Logic
  if (url.startsWith('/api/tasks/')) {
    const id = parseInt(url.split('/').pop());
    const tasks = JSON.parse(localStorage.getItem('studio_tasks') || '[]');
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...data, id };
      localStorage.setItem('studio_tasks', JSON.stringify(tasks));
      return { message: 'Task updated', task: tasks[idx] };
    }
  }
}

async function apiDelete(url) {
  if (!isOfflineMode) {
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) return await res.json();
      throw new Error('API delete failed');
    } catch (err) {
      console.warn('API connection failed, falling back to LocalStorage:', err);
      isOfflineMode = true;
      initOfflineStorage();
    }
  }

  // Fallback Logic
  if (url.startsWith('/api/tasks/')) {
    const id = parseInt(url.split('/').pop());
    let tasks = JSON.parse(localStorage.getItem('studio_tasks') || '[]');
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('studio_tasks', JSON.stringify(tasks));

    let timesheets = JSON.parse(localStorage.getItem('studio_timesheets') || '[]');
    timesheets = timesheets.filter(ts => ts.task_id !== id);
    localStorage.setItem('studio_timesheets', JSON.stringify(timesheets));
    return { message: 'Task deleted' };
  }

  if (url.startsWith('/api/timesheets/')) {
    const id = parseInt(url.split('/').pop());
    const timesheets = JSON.parse(localStorage.getItem('studio_timesheets') || '[]');
    const idx = timesheets.findIndex(ts => ts.id === id);
    if (idx !== -1) {
      const log = timesheets[idx];
      timesheets.splice(idx, 1);
      localStorage.setItem('studio_timesheets', JSON.stringify(timesheets));

      // Deduct from task
      if (log.task_id) {
        const tasks = JSON.parse(localStorage.getItem('studio_tasks') || '[]');
        const task = tasks.find(t => t.id === log.task_id);
        if (task) {
          task.tracked_seconds = Math.max(0, (task.tracked_seconds || 0) - log.duration_seconds);
          localStorage.setItem('studio_tasks', JSON.stringify(tasks));
        }
      }
      return { message: 'Timesheet deleted' };
    }
  }
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // Load preferences from localStorage
  loadSettingsFromStorage();

  // Bind UI Events
  setupEventListeners();

  // Initial Sync with Backend
  syncData();

  // Initialize Active Timer from Storage
  initActiveTimerFromStorage();
});

// Sync data with API
async function syncData() {
  await Promise.all([
    fetchUsers(),
    fetchTasks(),
    fetchTimesheets()
  ]);
  
  // Populate dropdowns & lists
  populateUserDropdowns();
  populateEventDropdownOptions();
  
  // Render active view
  renderCurrentTab();
}

// ================= API CALLS =================

async function fetchUsers() {
  const data = await apiGet('/api/users');
  if (Array.isArray(data)) {
    state.users = data;
  }
}

async function fetchTasks() {
  state.tasks = await apiGet('/api/tasks') || [];
}

async function fetchTimesheets() {
  state.timesheets = await apiGet('/api/timesheets') || [];
}

async function saveTask(task) {
  const isEdit = !!task.id;
  const url = isEdit ? `/api/tasks/${task.id}` : '/api/tasks';
  if (isEdit) {
    await apiPut(url, task);
  } else {
    await apiPost(url, task);
  }
  await syncData();
}

async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  if (state.activeTimer.taskId === parseInt(id)) {
    stopTimer(false);
  }
  await apiDelete(`/api/tasks/${id}`);
  await syncData();
}

async function deleteTimesheet(id) {
  if (!confirm('Are you sure you want to delete this timesheet entry? This will deduct the hours from the task.')) return;
  await apiDelete(`/api/timesheets/${id}`);
  await syncData();
}

// ================= TIMING AND TRACKING =================

function initActiveTimerFromStorage() {
  const savedTimer = localStorage.getItem('activeTimer');
  if (savedTimer) {
    const data = JSON.parse(savedTimer);
    state.activeTimer = data;
    
    if (state.activeTimer.isRunning && state.activeTimer.startTime) {
      // Restart interval
      startTimerInterval();
      updateTimerUIState(true);
    } else {
      updateTimerUIState(state.activeTimer.isRunning);
      updateTimerClockUI(state.activeTimer.accumulatedTime);
    }
  }
}

function saveTimerToStorage() {
  localStorage.setItem('activeTimer', JSON.stringify(state.activeTimer));
}

function startTimer(taskId, taskDescription) {
  if (!state.currentUser) {
    alert('Please select your user profile in the top-right header dropdown before tracking time.');
    return;
  }
  // If another timer is running, stop it first
  if (state.activeTimer.isRunning && state.activeTimer.taskId !== taskId) {
    stopTimer(true); // Save current running
  }

  // If resuming same task, load accumulated
  if (state.activeTimer.taskId === taskId) {
    state.activeTimer.startTime = Date.now();
    state.activeTimer.isRunning = true;
  } else {
    // New task timer
    state.activeTimer = {
      taskId: taskId,
      taskName: taskDescription,
      startTime: Date.now(),
      accumulatedTime: 0,
      isRunning: true
    };
    
    // Automatically update task status to In-Progress on start
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.status !== 'In-Progress' && task.status !== 'Completed') {
      task.status = 'In-Progress';
      saveTask(task);
    }
  }

  startTimerInterval();
  updateTimerUIState(true);
  saveTimerToStorage();
}

function pauseTimer() {
  if (!state.activeTimer.isRunning) return;
  
  clearInterval(timerInterval);
  const elapsed = Date.now() - state.activeTimer.startTime;
  state.activeTimer.accumulatedTime += elapsed;
  state.activeTimer.isRunning = false;
  state.activeTimer.startTime = null;

  updateTimerUIState(false);
  saveTimerToStorage();
  
  // Refresh views to show paused status
  renderCurrentTab();
}

async function stopTimer(shouldSave = true) {
  if (!state.activeTimer.taskId) return;

  clearInterval(timerInterval);
  
  let totalTimeMs = state.activeTimer.accumulatedTime;
  if (state.activeTimer.isRunning && state.activeTimer.startTime) {
    totalTimeMs += (Date.now() - state.activeTimer.startTime);
  }

  const durationSec = Math.round(totalTimeMs / 1000);

  if (shouldSave && durationSec > 0) {
    // Prompt remarks/notes
    const logDesc = prompt(`Enter work description for tracked session on: "${state.activeTimer.taskName}"`, `Tracked session`);
    if (logDesc !== null) {
      const today = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - totalTimeMs).toTimeString().split(' ')[0].substring(0, 5);
      const end = new Date().toTimeString().split(' ')[0].substring(0, 5);

      const timeLog = {
        task_id: state.activeTimer.taskId,
        description: logDesc || `Session tracking`,
        user_name: state.currentUser,
        category: 'Development',
        date: today,
        start_time: start,
        end_time: end,
        duration_seconds: durationSec
      };

      // Post to timesheets
      const res = await apiPost('/api/timesheets', timeLog);
      if (res) {
        // Automatically check if task should be marked as complete
        const task = state.tasks.find(t => t.id === state.activeTimer.taskId);
        if (task && task.status === 'Not-Started') {
          task.status = 'In-Progress';
          await saveTask(task);
        }
      }
    }
  }

  // Clear timer state
  state.activeTimer = {
    taskId: null,
    taskName: 'No active task',
    startTime: null,
    accumulatedTime: 0,
    isRunning: false
  };

  updateTimerUIState(false);
  updateTimerClockUI(0);
  saveTimerToStorage();
  
  await syncData();
}

function startTimerInterval() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - state.activeTimer.startTime;
    const totalMs = state.activeTimer.accumulatedTime + elapsed;
    updateTimerClockUI(totalMs);
  }, 1000);
}

function updateTimerClockUI(totalMs) {
  const clock = document.getElementById('headerTimerClock');
  clock.textContent = formatDuration(Math.round(totalMs / 1000));
}

function updateTimerUIState(isRunning) {
  const widget = document.getElementById('headerTimerWidget');
  const taskName = document.getElementById('headerTimerTaskName');
  const pauseBtn = document.getElementById('headerTimerPauseBtn');
  const stopBtn = document.getElementById('headerTimerStopBtn');

  taskName.textContent = state.activeTimer.taskName || 'No active task';

  if (state.activeTimer.taskId) {
    widget.classList.add('has-task');
    pauseBtn.removeAttribute('disabled');
    stopBtn.removeAttribute('disabled');
    
    if (isRunning) {
      widget.classList.add('running');
      pauseBtn.innerHTML = '<i data-lucide="pause"></i>';
    } else {
      widget.classList.remove('running');
      pauseBtn.innerHTML = '<i data-lucide="play"></i>';
    }
  } else {
    widget.classList.remove('has-task', 'running');
    pauseBtn.setAttribute('disabled', 'true');
    stopBtn.setAttribute('disabled', 'true');
    pauseBtn.innerHTML = '<i data-lucide="play"></i>';
  }
  lucide.createIcons();
}

// ================= RENDER METHODS =================

function renderCurrentTab() {
  const activeTab = document.querySelector('.nav-item.active').dataset.tab;
  
  if (activeTab === 'dashboard') {
    renderDashboard();
  } else if (activeTab === 'grid') {
    renderGrid();
  } else if (activeTab === 'kanban') {
    renderKanban();
  } else if (activeTab === 'timesheet') {
    renderTimesheets();
  }
}

// --- Dashboard Render ---
function renderDashboard() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.status === 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  document.getElementById('statCompletionRate').textContent = `${completionRate}%`;
  document.getElementById('statCompletedRatio').textContent = `${completedTasks} of ${totalTasks} tasks`;

  // Compute timesheet durations (today & week)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMs = new Date(todayStr).getTime();
  const oneWeekAgoMs = todayMs - (7 * 24 * 60 * 60 * 1000);

  let secondsToday = 0;
  let secondsWeek = 0;

  state.timesheets.forEach(log => {
    const logTime = new Date(log.date).getTime();
    if (log.date === todayStr) {
      secondsToday += log.duration_seconds;
    }
    if (logTime >= oneWeekAgoMs) {
      secondsWeek += log.duration_seconds;
    }
  });

  const hoursTodayDecimal = secondsToday / 3600;
  document.getElementById('statHoursToday').textContent = `${Math.floor(hoursTodayDecimal)}h ${Math.round((secondsToday % 3600) / 60)}m`;
  document.getElementById('statHoursWeek').textContent = `${(secondsWeek / 3600).toFixed(1)} hrs`;

  // High priority tasks count
  const highPriorityCount = state.tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
  document.getElementById('statHighPriority').textContent = highPriorityCount;

  // Daily Work Hours Goal Progress
  const goalPercent = Math.min(100, Math.round((hoursTodayDecimal / state.dailyGoalHours) * 100));
  document.getElementById('goalPercentText').textContent = `${goalPercent}%`;
  document.getElementById('goalProgressBar').style.width = `${goalPercent}%`;
  document.getElementById('goalProgressText').textContent = `${hoursTodayDecimal.toFixed(1)} / ${state.dailyGoalHours} hours logged today`;

  // Excel Summary Table: "Count of Assigned To" + hours spent
  const summaryBody = document.querySelector('#assigneeSummaryTable tbody');
  summaryBody.innerHTML = '';
  
  // Aggregate tasks & hours by user
  let userStats = {};
  state.users.forEach(user => {
    userStats[user] = { count: 0, seconds: 0 };
  });

  state.tasks.forEach(task => {
    if (task.assigned_to) {
      if (!userStats[task.assigned_to]) {
        userStats[task.assigned_to] = { count: 0, seconds: 0 };
      }
      userStats[task.assigned_to].count += 1;
      userStats[task.assigned_to].seconds += (task.tracked_seconds || 0);
    }
  });

  let grandTotalTasks = 0;
  let grandTotalSeconds = 0;

  Object.keys(userStats).forEach(user => {
    const count = userStats[user].count;
    const hours = userStats[user].seconds / 3600;
    
    // Only display user if they have tasks assigned to them to keep summary table tight
    if (count > 0) {
      grandTotalTasks += count;
      grandTotalSeconds += userStats[user].seconds;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${user}</strong></td>
        <td>${count}</td>
        <td>${hours.toFixed(1)}h</td>
      `;
      summaryBody.appendChild(tr);
    }
  });

  document.getElementById('summaryTotalTasks').textContent = grandTotalTasks;
  document.getElementById('summaryTotalHours').textContent = `${(grandTotalSeconds / 3600).toFixed(1)}h`;

  // Draw Charts
  drawCharts(userStats);
}

function drawCharts(userStats) {
  // Chart 1: Workload Bar Chart
  const workloadCtx = document.getElementById('workloadChart').getContext('2d');
  if (state.charts.workload) state.charts.workload.destroy();

  const activeUsers = Object.keys(userStats).filter(u => userStats[u].count > 0);
  const taskCounts = activeUsers.map(u => userStats[u].count);
  const isDark = document.body.classList.contains('dark-theme');
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.05)';

  state.charts.workload = new Chart(workloadCtx, {
    type: 'bar',
    data: {
      labels: activeUsers,
      datasets: [{
        label: 'Task Count',
        data: taskCounts,
        backgroundColor: 'rgba(0, 165, 163, 0.7)',
        borderColor: '#00A5A3',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { 
          grid: { color: gridColor }, 
          ticks: { color: textColor, stepSize: 1 },
          beginAtZero: true
        }
      }
    }
  });

  // Chart 2: Category Hours Doughnut Chart
  const categoryCtx = document.getElementById('categoryChart').getContext('2d');
  if (state.charts.category) state.charts.category.destroy();

  // Aggregate hours by Event Name
  let eventTime = {};
  state.tasks.forEach(task => {
    const event = task.event_name || 'Others';
    if (!eventTime[event]) eventTime[event] = 0;
    eventTime[event] += (task.tracked_seconds || 0);
  });

  const events = Object.keys(eventTime).filter(e => eventTime[e] > 0);
  const eventHours = events.map(e => (eventTime[e] / 3600).toFixed(1));

  // Default fallback if no time is tracked yet
  const chartLabels = events.length > 0 ? events : ['No Tracked Time'];
  const chartData = events.length > 0 ? eventHours : [1];
  const bgColors = events.length > 0 
    ? ['#00A5A3', '#C0F43C', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'] 
    : [isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'];

  state.charts.category = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        data: chartData,
        backgroundColor: bgColors,
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#0d1219' : '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: textColor, font: { family: 'Inter', size: 11 } }
        }
      }
    }
  });
}

// --- Excel Grid Render ---
function renderGrid() {
  const searchQuery = document.getElementById('filterSearch').value.toLowerCase();
  const eventFilter = document.getElementById('filterEvent').value;
  const assigneeFilter = document.getElementById('filterAssignedTo').value;
  const assignerSelectEl = document.getElementById('filterAssignedBy');
  const assignerFilter = assignerSelectEl ? assignerSelectEl.value : '';
  const priorityFilter = document.getElementById('filterPriority').value;
  const statusFilter = document.getElementById('filterStatus').value;

  // Filter tasks
  let filtered = state.tasks.filter(task => {
    const textMatch = !searchQuery || 
                      task.description.toLowerCase().includes(searchQuery) ||
                      (task.remarks && task.remarks.toLowerCase().includes(searchQuery)) ||
                      task.event_name.toLowerCase().includes(searchQuery);
    
    const eventMatch = !eventFilter || task.event_name === eventFilter;
    const assigneeMatch = !assigneeFilter || task.assigned_to === assigneeFilter;
    const assignerMatch = !assignerFilter || task.assigned_by === assignerFilter;
    const priorityMatch = !priorityFilter || task.priority === priorityFilter;
    const statusMatch = !statusFilter || task.status === statusFilter;

    return textMatch && eventMatch && assigneeMatch && assignerMatch && priorityMatch && statusMatch;
  });

  // Sort tasks
  const col = state.currentSort.column;
  const dir = state.currentSort.direction === 'asc' ? 1 : -1;

  filtered.sort((a, b) => {
    let valA = a[col] || '';
    let valB = b[col] || '';
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return -1 * dir;
    if (valA > valB) return 1 * dir;
    return 0;
  });

  const tbody = document.getElementById('tasksGridBody');
  tbody.innerHTML = '';

  filtered.forEach(task => {
    const tr = document.createElement('tr');
    
    // Highlight task row if it has high priority to align with user's Excel formatting
    if (task.priority === 'High' && task.status !== 'Completed') {
      tr.style.backgroundColor = document.body.classList.contains('dark-theme') 
        ? 'rgba(244, 63, 94, 0.05)' 
        : 'rgba(244, 63, 94, 0.03)';
    }

    const isTimerRunningOnThisTask = state.activeTimer.taskId === task.id && state.activeTimer.isRunning;
    const timerBtnClass = isTimerRunningOnThisTask ? 'grid-timer-btn active' : 'grid-timer-btn';
    const timerBtnText = isTimerRunningOnThisTask ? 'Stop' : 'Start';
    const timerIcon = isTimerRunningOnThisTask ? 'square' : 'play';

    const deadlineDate = task.deadline ? formatDateString(task.deadline) : '-';
    const assignedDate = task.assigned_date ? formatDateString(task.assigned_date) : '-';

    tr.innerHTML = `
      <td><strong>${task.event_name || 'Others'}</strong></td>
      <td>${task.description || ''}</td>
      <td>${task.assigned_by || '-'}</td>
      <td>${task.assigned_to || '-'}</td>
      <td>${assignedDate}</td>
      <td class="${isOverdue(task) ? 'card-due overdue' : ''}">${deadlineDate}</td>
      <td>
        <span class="status-badge">
          <span class="status-dot ${task.status.toLowerCase()}"></span>
          ${task.status}
        </span>
      </td>
      <td>
        <span class="priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="${timerBtnClass}" data-id="${task.id}" data-desc="${task.description}">
            <i data-lucide="${timerIcon}"></i> ${timerBtnText}
          </button>
          <span style="font-family: monospace; font-size: 11px;">${formatDuration(task.tracked_seconds || 0)}</span>
        </div>
      </td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${task.remarks || ''}">
        ${task.remarks || '-'}
      </td>
      <td class="actions-col">
        <button class="action-icon-btn edit-btn" data-id="${task.id}" title="Edit Task">
          <i data-lucide="edit-2"></i>
        </button>
        <button class="action-icon-btn delete-btn" data-id="${task.id}" title="Delete Task">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Re-render lucide icons in the grid
  lucide.createIcons();
  setupGridActions();
}

// --- Kanban Render ---
function renderKanban() {
  const lanes = {
    'Not-Started': document.getElementById('cardsNotStarted'),
    'In-Progress': document.getElementById('cardsInProgress'),
    'In-Review': document.getElementById('cardsInReview'),
    'Completed': document.getElementById('cardsCompleted')
  };

  // Clear lanes
  Object.keys(lanes).forEach(status => {
    lanes[status].innerHTML = '';
  });

  let laneCounts = { 'Not-Started': 0, 'In-Progress': 0, 'In-Review': 0, 'Completed': 0 };

  state.tasks.forEach(task => {
    const lane = lanes[task.status];
    if (!lane) return;

    laneCounts[task.status]++;

    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = task.id;

    const overdueClass = isOverdue(task) ? 'card-due overdue' : 'card-due';

    card.innerHTML = `
      <div class="card-header-row">
        <span class="card-event">${task.event_name}</span>
        <span class="priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
      </div>
      <div class="card-desc">${task.description}</div>
      <div class="card-meta-row">
        <span class="card-assignee"><i data-lucide="user"></i> ${task.assigned_to}</span>
        <span class="${overdueClass}"><i data-lucide="calendar"></i> ${task.deadline ? formatDateString(task.deadline) : '-'}</span>
      </div>
    `;

    // Edit task on double click
    card.addEventListener('dblclick', () => {
      openTaskModal(task.id);
    });

    // Drag events
    card.addEventListener('dragstart', () => {
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    lane.appendChild(card);
  });

  // Update counts
  document.getElementById('countNotStarted').textContent = laneCounts['Not-Started'];
  document.getElementById('countInProgress').textContent = laneCounts['In-Progress'];
  document.getElementById('countInReview').textContent = laneCounts['In-Review'];
  document.getElementById('countCompleted').textContent = laneCounts['Completed'];

  lucide.createIcons();
  setupKanbanDragAndDrop();
}

// --- Timesheets Render ---
function renderTimesheets() {
  const list = document.getElementById('timesheetsHistoryList');
  list.innerHTML = '';

  if (state.timesheets.length === 0) {
    list.innerHTML = '<div class="empty-state">No timesheet logs found. Work session logs will appear here.</div>';
    return;
  }

  state.timesheets.forEach(log => {
    const item = document.createElement('div');
    item.className = 'time-log-item';

    const catClass = (log.category || 'Other').toLowerCase();
    const formattedDate = formatDateString(log.date);

    item.innerHTML = `
      <div class="log-left">
        <div class="log-category-icon ${catClass}">
          <i data-lucide="${getCategoryIcon(log.category)}"></i>
        </div>
        <div class="log-main-info">
          <span class="log-description">${log.description}</span>
          <div class="log-sub-info">
            <span><i data-lucide="user" style="width:10px;height:10px;vertical-align:middle;margin-right:3px;"></i>${log.user_name}</span>
            <span><i data-lucide="folder" style="width:10px;height:10px;vertical-align:middle;margin-right:3px;"></i>${log.event_name || 'Others'}</span>
            <span><i data-lucide="calendar" style="width:10px;height:10px;vertical-align:middle;margin-right:3px;"></i>${formattedDate}</span>
            <span><i data-lucide="clock" style="width:10px;height:10px;vertical-align:middle;margin-right:3px;"></i>${log.start_time} - ${log.end_time}</span>
          </div>
        </div>
      </div>
      <div class="log-right">
        <span class="log-duration">${formatDuration(log.duration_seconds)}</span>
        <button class="action-icon-btn delete-btn" data-id="${log.id}" title="Delete Log">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    // Setup deletion
    item.querySelector('.delete-btn').addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      deleteTimesheet(id);
    });

    list.appendChild(item);
  });
  lucide.createIcons();
}

// ================= DRAG AND DROP HANDLERS =================

function setupKanbanDragAndDrop() {
  const columns = document.querySelectorAll('.kanban-column');
  
  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      const container = column.querySelector('.kanban-cards-container');
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard) {
        container.appendChild(draggingCard);
      }
    });

    column.addEventListener('drop', async (e) => {
      e.preventDefault();
      const draggingCard = document.querySelector('.dragging');
      if (!draggingCard) return;

      const taskId = parseInt(draggingCard.dataset.id);
      const newStatus = column.dataset.status;

      const task = state.tasks.find(t => t.id === taskId);
      if (task && task.status !== newStatus) {
        task.status = newStatus;
        
        // If task is completed and has a running timer, stop it!
        if (newStatus === 'Completed' && state.activeTimer.taskId === taskId) {
          stopTimer(true);
        }

        await saveTask(task);
      }
    });
  });
}

// ================= ACTIONS & HELPERS =================

function setupGridActions() {
  // Sort Headers
  document.querySelectorAll('.data-grid-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (state.currentSort.column === col) {
        state.currentSort.direction = state.currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.currentSort.column = col;
        state.currentSort.direction = 'asc';
      }
      renderGrid();
    });
  });

  // Start / Stop timers from grid row buttons
  document.querySelectorAll('.grid-timer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const desc = btn.dataset.desc;

      if (state.activeTimer.taskId === id && state.activeTimer.isRunning) {
        stopTimer(true);
      } else {
        startTimer(id, desc);
      }
    });
  });

  // Edit action
  document.querySelectorAll('.data-grid-table .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      openTaskModal(id);
    });
  });

  // Delete action
  document.querySelectorAll('.data-grid-table .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      deleteTask(id);
    });
  });
}

// Populate user names in dropdown options
function populateUserDropdowns() {
  // Current user header selector
  const headerSelect = document.getElementById('currentUserSelect');
  headerSelect.innerHTML = '';
  
  // Add placeholder
  const placeholderOpt = document.createElement('option');
  placeholderOpt.value = '';
  placeholderOpt.textContent = 'Select Profile...';
  if (!state.currentUser) placeholderOpt.selected = true;
  headerSelect.appendChild(placeholderOpt);

  state.users.forEach(user => {
    const opt = document.createElement('option');
    opt.value = user;
    opt.textContent = user;
    if (user === state.currentUser) opt.selected = true;
    headerSelect.appendChild(opt);
  });

  // Datalists for Modal inputs
  const userDatalist = document.getElementById('userListOptions');
  userDatalist.innerHTML = '';
  state.users.forEach(user => {
    const opt = document.createElement('option');
    opt.value = user;
    userDatalist.appendChild(opt);
  });

  // Update status bar active user indicator
  const statusActiveUser = document.getElementById('statusActiveUserText');
  if (statusActiveUser) {
    if (state.currentUser) {
      statusActiveUser.textContent = state.currentUser;
      statusActiveUser.style.color = '';
    } else {
      statusActiveUser.textContent = 'None Selected (Please select profile)';
      statusActiveUser.style.color = '#f59e0b'; // warning color
    }
  }
}

// Populate unique Event names in filter panel
function populateEventDropdownOptions() {
  const eventSelect = document.getElementById('filterEvent');
  const assigneeSelect = document.getElementById('filterAssignedTo');
  const assignerSelect = document.getElementById('filterAssignedBy');
  
  // Clear but keep first
  eventSelect.innerHTML = '<option value="">All Events</option>';
  assigneeSelect.innerHTML = '<option value="">All Assignees</option>';
  if (assignerSelect) {
    assignerSelect.innerHTML = '<option value="">All Assigners</option>';
  }

  // Unique Events
  const events = Array.from(new Set(state.tasks.map(t => t.event_name).filter(Boolean)));
  events.forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev;
    opt.textContent = ev;
    eventSelect.appendChild(opt);
  });

  // Assignees & Assigners
  state.users.forEach(user => {
    const opt = document.createElement('option');
    opt.value = user;
    opt.textContent = user;
    assigneeSelect.appendChild(opt);
    
    if (assignerSelect) {
      const opt2 = document.createElement('option');
      opt2.value = user;
      opt2.textContent = user;
      assignerSelect.appendChild(opt2);
    }
  });
}

// Format duration from seconds -> HH:MM:SS
function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0')
  ].join(':');
}

// Convert YYYY-MM-DD to standard view format MM/DD/YYYY
function formatDateString(str) {
  if (!str) return '';
  const pts = str.split('-');
  if (pts.length === 3) {
    return `${parseInt(pts[1])}/${parseInt(pts[2])}/${pts[0]}`;
  }
  return str;
}

function getCategoryIcon(cat) {
  switch ((cat || '').toLowerCase()) {
    case 'design': return 'palette';
    case 'development': return 'code-2';
    case 'meeting': return 'users';
    case 'research': return 'search';
    case 'review': return 'check-square';
    default: return 'folder';
  }
}

function isOverdue(task) {
  if (!task.deadline || task.status === 'Completed') return false;
  const deadline = new Date(task.deadline);
  const today = new Date();
  today.setHours(0,0,0,0);
  return deadline < today;
}

// ================= MODAL CONTROLLERS =================

function openTaskModal(taskId = null) {
  const modal = document.getElementById('taskModal');
  const form = document.getElementById('taskForm');
  const title = document.getElementById('taskModalTitle');
  
  form.reset();

  if (taskId) {
    title.textContent = 'Edit Task';
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      document.getElementById('taskFormId').value = task.id;
      document.getElementById('taskEventName').value = task.event_name;
      document.getElementById('taskDescription').value = task.description;
      document.getElementById('taskAssignedBy').value = task.assigned_by;
      document.getElementById('taskAssignedTo').value = task.assigned_to;
      document.getElementById('taskAssignedDate').value = task.assigned_date || '';
      document.getElementById('taskDeadline').value = task.deadline || '';
      document.getElementById('taskStatus').value = task.status;
      document.getElementById('taskPriority').value = task.priority;
      document.getElementById('taskRemarks').value = task.remarks || '';
    }
  } else {
    title.textContent = 'Create Task';
    document.getElementById('taskFormId').value = '';
    // Set default values
    document.getElementById('taskAssignedDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('taskAssignedBy').value = state.currentUser;
  }

  modal.classList.add('show');
}

function closeTaskModal() {
  document.getElementById('taskModal').classList.remove('show');
}

function openManualTimeModal() {
  if (!state.currentUser) {
    alert('Please select your user profile in the top-right header dropdown before logging time.');
    return;
  }
  const modal = document.getElementById('manualTimeModal');
  const form = document.getElementById('manualTimeForm');
  form.reset();

  // Populate task dropdown
  const select = document.getElementById('manualTimeTaskId');
  select.innerHTML = '<option value="">No Associated Task</option>';
  
  state.tasks.forEach(task => {
    if (task.status !== 'Completed') {
      const opt = document.createElement('option');
      opt.value = task.id;
      opt.textContent = `[${task.event_name}] ${task.description}`;
      select.appendChild(opt);
    }
  });

  // Default date
  document.getElementById('manualTimeDate').value = new Date().toISOString().split('T')[0];
  modal.classList.add('show');
}

function closeManualTimeModal() {
  document.getElementById('manualTimeModal').classList.remove('show');
}

// ================= EVENT BINDINGS =================

function setupEventListeners() {
  // Workspace Canvas Navigation Swapping
  document.querySelectorAll('.canvas-tabs .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.canvas-tabs .nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Toggle views
      document.querySelectorAll('.tab-content').forEach(pane => pane.classList.remove('active'));
      const activeTabId = `${btn.dataset.tab}Tab`;
      document.getElementById(activeTabId).classList.add('active');
      
      renderCurrentTab();
    });
  });

  // Profile Selector Change
  document.getElementById('currentUserSelect').addEventListener('change', (e) => {
    state.currentUser = e.target.value;
    localStorage.setItem('currentUser', state.currentUser);
    populateUserDropdowns(); // Keep footer and inputs in sync
    renderCurrentTab();
  });

  // Add User Profile
  document.getElementById('addUserProfileBtn').addEventListener('click', () => {
    document.getElementById('addUserModal').classList.add('show');
  });
  document.getElementById('closeAddUserModal').addEventListener('click', () => {
    document.getElementById('addUserModal').classList.remove('show');
  });
  document.getElementById('cancelAddUserModal').addEventListener('click', () => {
    document.getElementById('addUserModal').classList.remove('show');
  });
  
  document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('newProfileName');
    const newName = nameInput.value.trim();
    if (newName && !state.users.includes(newName)) {
      state.users.push(newName);
      state.currentUser = newName;
      localStorage.setItem('currentUser', newName);
      
      populateUserDropdowns();
      populateEventDropdownOptions();
      
      document.getElementById('addUserModal').classList.remove('show');
      nameInput.value = '';
      
      renderCurrentTab();
    }
  });

  // Task Creation Buttons
  const openCreateBtns = ['dashboardAddTaskBtn', 'gridAddTaskBtn', 'kanbanAddTaskBtn'];
  openCreateBtns.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openTaskModal(null));
  });

  // Task Modal Closing
  document.getElementById('closeTaskModal').addEventListener('click', closeTaskModal);
  document.getElementById('cancelTaskModal').addEventListener('click', closeTaskModal);
  
  // Submit Task Form
  document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('taskFormId').value;
    const task = {
      event_name: document.getElementById('taskEventName').value,
      description: document.getElementById('taskDescription').value,
      assigned_by: document.getElementById('taskAssignedBy').value,
      assigned_to: document.getElementById('taskAssignedTo').value,
      assigned_date: document.getElementById('taskAssignedDate').value,
      deadline: document.getElementById('taskDeadline').value,
      status: document.getElementById('taskStatus').value,
      priority: document.getElementById('taskPriority').value,
      remarks: document.getElementById('taskRemarks').value
    };

    if (id) {
      task.id = parseInt(id);
      // Retain tracked_seconds
      const orig = state.tasks.find(t => t.id === task.id);
      if (orig) task.tracked_seconds = orig.tracked_seconds;
    }

    saveTask(task);
    closeTaskModal();
  });

  // Header active timer buttons
  document.getElementById('headerTimerPauseBtn').addEventListener('click', () => {
    if (state.activeTimer.isRunning) {
      pauseTimer();
    } else {
      startTimer(state.activeTimer.taskId, state.activeTimer.taskName);
    }
  });
  document.getElementById('headerTimerStopBtn').addEventListener('click', () => {
    stopTimer(true);
  });

  // Manual timesheet logs buttons
  document.getElementById('logManualTimeBtn').addEventListener('click', openManualTimeModal);
  document.getElementById('closeManualTimeModal').addEventListener('click', closeManualTimeModal);
  document.getElementById('cancelManualTimeModal').addEventListener('click', closeManualTimeModal);
  
  document.getElementById('manualTimeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const taskId = document.getElementById('manualTimeTaskId').value;
    const desc = document.getElementById('manualTimeDesc').value;
    const category = document.getElementById('manualTimeCategory').value;
    const date = document.getElementById('manualTimeDate').value;
    const start = document.getElementById('manualTimeStart').value;
    const end = document.getElementById('manualTimeEnd').value;

    // Calculate duration in seconds
    const startPts = start.split(':').map(Number);
    const endPts = end.split(':').map(Number);
    const startSec = startPts[0] * 3600 + startPts[1] * 60;
    const endSec = endPts[0] * 3600 + endPts[1] * 60;
    
    let durationSec = endSec - startSec;
    if (durationSec < 0) {
      // Overnight task duration offset
      durationSec += 24 * 3600;
    }

    const log = {
      task_id: taskId ? parseInt(taskId) : null,
      description: desc,
      user_name: state.currentUser,
      category: category,
      date: date,
      start_time: start,
      end_time: end,
      duration_seconds: durationSec
    };

    const res = await apiPost('/api/timesheets', log);
    if (res) {
      closeManualTimeModal();
      await syncData();
    }
  });

  // Edit Work Daily Goal Modal
  document.getElementById('editGoalBtn').addEventListener('click', () => {
    document.getElementById('dailyGoalHours').value = state.dailyGoalHours;
    document.getElementById('goalModal').classList.add('show');
  });
  document.getElementById('closeGoalModal').addEventListener('click', () => {
    document.getElementById('goalModal').classList.remove('show');
  });
  document.getElementById('cancelGoalModal').addEventListener('click', () => {
    document.getElementById('goalModal').classList.remove('show');
  });
  document.getElementById('goalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.dailyGoalHours = parseFloat(document.getElementById('dailyGoalHours').value) || 8;
    localStorage.setItem('dailyGoalHours', state.dailyGoalHours);
    document.getElementById('goalModal').classList.remove('show');
    renderCurrentTab();
  });

  // Grid Filters Event Bindings
  const filterInputs = ['filterSearch', 'filterEvent', 'filterAssignedTo', 'filterAssignedBy', 'filterPriority', 'filterStatus'];
  filterInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', renderGrid);
      el.addEventListener('change', renderGrid);
    }
  });

  // Clear Filters
  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterEvent').value = '';
    document.getElementById('filterAssignedTo').value = '';
    const assignerEl = document.getElementById('filterAssignedBy');
    if (assignerEl) assignerEl.value = '';
    document.getElementById('filterPriority').value = '';
    document.getElementById('filterStatus').value = '';
    renderGrid();
  });

  // Theme Toggle Button
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

  // CSV Export Buttons
  document.getElementById('gridExportCsvBtn').addEventListener('click', () => {
    exportToCsv('tasks', state.tasks);
  });
  document.getElementById('timesheetExportCsvBtn').addEventListener('click', () => {
    exportToCsv('timesheets', state.timesheets);
  });
}

// Local Storage Helper
function loadSettingsFromStorage() {
  const current = localStorage.getItem('currentUser');
  if (current) state.currentUser = current;

  const goal = localStorage.getItem('dailyGoalHours');
  if (goal) state.dailyGoalHours = parseFloat(goal) || 8;

  const darkTheme = localStorage.getItem('darkTheme');
  if (darkTheme === 'false') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    updateThemeToggleUI();
  }
}

// Theme Toggle Code
function toggleTheme() {
  const body = document.body;
  if (body.classList.contains('dark-theme')) {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    localStorage.setItem('darkTheme', 'false');
  } else {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    localStorage.setItem('darkTheme', 'true');
  }
  updateThemeToggleUI();
  // Redraw charts since text/grid colors might have changed
  renderCurrentTab();
}

function updateThemeToggleUI() {
  const btn = document.getElementById('themeToggleBtn');
  const isDark = document.body.classList.contains('dark-theme');
  btn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
  lucide.createIcons();
}

// ================= CSV EXPORT UTILITY =================
function exportToCsv(filenamePrefix, dataset) {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  if (filenamePrefix === 'tasks') {
    // Header
    csvContent += "ID,Event Name,Task Description,Assigned By,Assigned To,Assigned Date,Deadline,Status,Priority,Tracked Hours,Remarks\n";
    dataset.forEach(item => {
      const hours = (item.tracked_seconds / 3600).toFixed(2);
      const row = [
        item.id,
        `"${(item.event_name || '').replace(/"/g, '""')}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        `"${(item.assigned_by || '').replace(/"/g, '""')}"`,
        `"${(item.assigned_to || '').replace(/"/g, '""')}"`,
        item.assigned_date || '',
        item.deadline || '',
        item.status,
        item.priority,
        hours,
        `"${(item.remarks || '').replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });
  } else {
    // Timesheets Header
    csvContent += "Log ID,Task ID,Task Description,Category,Worker Name,Date,Start Time,End Time,Tracked Hours\n";
    dataset.forEach(item => {
      const hours = (item.duration_seconds / 3600).toFixed(2);
      const row = [
        item.id,
        item.task_id || 'Manual',
        `"${(item.description || '').replace(/"/g, '""')}"`,
        item.category,
        `"${(item.user_name || '').replace(/"/g, '""')}"`,
        item.date,
        item.start_time,
        item.end_time,
        hours
      ].join(",");
      csvContent += row + "\n";
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute("download", `${filenamePrefix}_export_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
