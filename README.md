# TaskSphere - Interactive Timesheet & Task Tracking Dashboard

TaskSphere is a premium, glassmorphic web dashboard built to automate and coordinate the manual tasks you track in Excel. Powered by a local **Node.js + Express** server and a self-contained **JSON-file database** (`db.json`), it enables your entire team (e.g., Sajeesh, Shafi, Monith, etc.) to access, log time, and update tasks simultaneously from any device in your local network with zero database dependencies or compilation compilation issues.

---

## 🌟 Key Features

1. **Excel-Aligned Structure**: Maps all fields from your Excel tracking system:
   * **Event Name** (e.g., *DFS: Dubai, UAE*, *Bespoke Events*, *Others*)
   * **Task Description**
   * **Assigned By**
   * **Assigned To**
   * **Assigned Date**
   * **Deadline** (displays red indicators if overdue)
   * **Priority** (Color-coded High [pinkish-red], Medium [yellow], and Low [blue] badges)
   * **Remarks/Notes**

2. **Team Profile Selector (Multi-User)**:
   * A dropdown at the top-right allows users to switch profiles (e.g., Shafi, Sajeesh, Monith, Rovie, Samprity).
   * Actions (creating/editing tasks or starting the active timer) are associated with the selected profile.
   * Add new profiles dynamically directly from the header user selector.

3. **Count of Assigned To (Live Excel Summary)**:
   * A summary widget reproducing your **Count of Assigned To** table.
   * Recalculates in real-time as tasks are completed, reassigned, or when active time is tracked.

4. **Integrated Active Timer**:
   * A global stopwatch timer widget in the header.
   * Play/pause/stop time tracking directly from any row in the spreadsheet.
   * Starting a timer automatically transitions the task's status to **In-Progress**.
   * Timers are persisted in `localStorage`, surviving browser refreshes or close operations without drift.

5. **Dynamic Charts**:
   * Visual charts using **Chart.js** displaying team workload counts and time tracked per event.

6. **Excel CSV Export**:
   * Dedicated CSV download buttons for both tasks and timesheets, making it simple to export your data back into Excel or backup logs.

---

## 🚀 Getting Started

TaskSphere runs entirely locally on your machine with zero cloud configuration.

### Prerequisites
* **Node.js**: Make sure Node.js is installed on the host machine. You can download it from [nodejs.org](https://nodejs.org/).

### Quick Start
1. Simply double-click the **`run.bat`** file in this folder.
2. The script will automatically install dependencies (`express`) on its first run and start the server on port **3000**.
3. Open your browser and navigate to:
   * **[http://localhost:3000](http://localhost:3000)**

### Accessing From Other Devices (Multi-User setup)
To allow other team members to log in from their computers or mobile devices:
1. Open a Command Prompt (`cmd`) on the host computer.
2. Run `ipconfig` and note your **IPv4 Address** (e.g., `192.168.1.15`).
3. Share the address with your team: **`http://[your-ip-address]:3000`**
4. Any member connected to the same Wi-Fi/network can load the dashboard, select their profile, and log hours!

---

## 📁 Project Structure

```bash
Task Sheet/
├── public/
│   ├── index.html     # Dashboard views, spreadsheet grids, Kanban lanes
│   ├── style.css      # Custom HSL design, glassmorphism CSS styling
│   └── app.js         # State controller, API integrations, timers, and charts
├── server.js          # Express API server with db.json data storage
├── db.json            # Generated JSON database file (created on startup)
├── package.json       # App metadata and package dependency configuration
├── run.bat            # Double-click helper script
└── README.md          # Project documentation
```
