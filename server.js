const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Seed Tasks Data
const initialTasks = [
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
    status: "Not-Started",
    priority: "High",
    remarks: "",
    tracked_seconds: 0
  }
];

// Helper functions to read/write JSON Database
function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDb = {
      tasks: initialTasks,
      timesheets: [],
      nextTaskId: 11,
      nextTimesheetId: 1
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf8');
    return defaultDb;
  }
  
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading JSON DB, resetting to defaults:', err);
    return {
      tasks: initialTasks,
      timesheets: [],
      nextTaskId: 11,
      nextTimesheetId: 1
    };
  }
}

function saveDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ================= API ENDPOINTS =================

// --- Task Routes ---

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const db = getDb();
  res.json(db.tasks);
});

// Create a task
app.post('/api/tasks', (req, res) => {
  const db = getDb();
  const { event_name, description, assigned_by, assigned_to, assigned_date, deadline, status, priority, remarks } = req.body;
  
  const newTask = {
    id: db.nextTaskId++,
    event_name: event_name || 'Others',
    description: description || '',
    assigned_by: assigned_by || '',
    assigned_to: assigned_to || '',
    assigned_date: assigned_date || '',
    deadline: deadline || '',
    status: status || 'Not-Started',
    priority: priority || 'Medium',
    remarks: remarks || '',
    tracked_seconds: 0
  };

  db.tasks.unshift(newTask); // Add to the top of list
  saveDb(db);
  res.status(201).json(newTask);
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = getDb();
  const taskIndex = db.tasks.findIndex(t => t.id === id);

  if (taskIndex !== -1) {
    const updatedTask = {
      ...db.tasks[taskIndex],
      ...req.body,
      id: id // Ensure ID doesn't change
    };
    db.tasks[taskIndex] = updatedTask;
    saveDb(db);
    res.json({ message: 'Task updated successfully', task: updatedTask });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = getDb();
  const initialLength = db.tasks.length;
  
  db.tasks = db.tasks.filter(t => t.id !== id);
  
  if (db.tasks.length < initialLength) {
    // Clean up timesheets associated with this task
    db.timesheets = db.timesheets.filter(ts => ts.task_id !== id);
    saveDb(db);
    res.json({ message: 'Task deleted successfully' });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// --- Timesheet Routes ---

// Get all timesheets
app.get('/api/timesheets', (req, res) => {
  const db = getDb();
  
  // Map tasks to get task description and event name
  const logs = db.timesheets.map(log => {
    const associatedTask = db.tasks.find(t => t.id === log.task_id);
    return {
      ...log,
      task_description: associatedTask ? associatedTask.description : log.description,
      event_name: associatedTask ? associatedTask.event_name : 'Others'
    };
  });
  
  res.json(logs);
});

// Create a timesheet entry
app.post('/api/timesheets', (req, res) => {
  const db = getDb();
  const { task_id, description, user_name, category, date, start_time, end_time, duration_seconds } = req.body;

  const newLog = {
    id: db.nextTimesheetId++,
    task_id: task_id ? parseInt(task_id) : null,
    description: description || '',
    user_name: user_name || 'Anonymous',
    category: category || 'General',
    date: date || '',
    start_time: start_time || '',
    end_time: end_time || '',
    duration_seconds: parseInt(duration_seconds) || 0
  };

  db.timesheets.unshift(newLog); // Add to the top of logs

  // If linked to a task, update the task's tracked seconds
  if (newLog.task_id) {
    const task = db.tasks.find(t => t.id === newLog.task_id);
    if (task) {
      task.tracked_seconds = (task.tracked_seconds || 0) + newLog.duration_seconds;
    }
  }

  saveDb(db);
  res.status(201).json(newLog);
});

// Delete a timesheet entry
app.delete('/api/timesheets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = getDb();
  const logIndex = db.timesheets.findIndex(ts => ts.id === id);

  if (logIndex !== -1) {
    const log = db.timesheets[logIndex];
    
    // Deduct duration from the linked task
    if (log.task_id) {
      const task = db.tasks.find(t => t.id === log.task_id);
      if (task) {
        task.tracked_seconds = Math.max(0, (task.tracked_seconds || 0) - log.duration_seconds);
      }
    }

    db.timesheets.splice(logIndex, 1);
    saveDb(db);
    res.json({ message: 'Timesheet log deleted successfully' });
  } else {
    res.status(404).json({ error: 'Timesheet log not found' });
  }
});

// --- User List Route ---
app.get('/api/users', (req, res) => {
  const standardUsers = ['Khalifa', 'Nazim', 'Waseem S', 'Sajeesh Kombath', 'Krishanu Karmakar', 'Lohith BC', 'Kalander Shafi', 'Monith', 'Imran', 'Utkarsh', 'Rovie', 'Samprity'];
  const db = getDb();
  
  // Extract any custom users from tasks
  const dbUsers = [];
  db.tasks.forEach(t => {
    if (t.assigned_to && !dbUsers.includes(t.assigned_to)) dbUsers.push(t.assigned_to);
    if (t.assigned_by && !dbUsers.includes(t.assigned_by)) dbUsers.push(t.assigned_by);
  });

  const combined = Array.from(new Set([...standardUsers, ...dbUsers]));
  res.json(combined);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
