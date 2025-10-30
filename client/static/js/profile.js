import { Chart } from "@/components/ui/chart"
// Profile page functionality
let profileProgressChart = null

// Initialize profile page
function initializeProfile() {
  loadProfileData()
  initializeProfileChart()
  generateStreakCalendar()
}

// Load profile data
async function loadProfileData() {
  try {
    // In a real app, fetch user profile data from API
    const profileData = {
      username: "CodeMaster",
      email: "codemaster@example.com",
      userType: "Student",
      score: 1250,
      solved: 42,
      submissions: 89,
      timeSpent: "24h",
    }

    // Update profile info
    const usernameEl = document.getElementById("profileUsername")
    const emailEl = document.getElementById("profileEmail")
    const typeEl = document.getElementById("profileType")
    const scoreEl = document.getElementById("profileScore")
    const solvedEl = document.getElementById("profileSolved")
    const submissionsEl = document.getElementById("profileSubmissions")
    const timeEl = document.getElementById("profileTime")

    if (usernameEl) usernameEl.textContent = profileData.username
    if (emailEl) emailEl.textContent = profileData.email
    if (typeEl) typeEl.textContent = profileData.userType
    if (scoreEl) animateCounter(scoreEl, profileData.score)
    if (solvedEl) animateCounter(solvedEl, profileData.solved)
    if (submissionsEl) animateCounter(submissionsEl, profileData.submissions)
    if (timeEl) timeEl.textContent = profileData.timeSpent
  } catch (error) {
    console.error("Failed to load profile data:", error)
  }
}

// Initialize profile progress chart
function initializeProfileChart() {
  const ctx = document.getElementById("progressChart")
  if (!ctx) return

  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Problems Solved",
        data: [5, 12, 8, 15, 22, 18, 25],
        borderColor: "#667eea",
        backgroundColor: "rgba(102, 126, 234, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#667eea",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: "Score Gained",
        data: [150, 300, 200, 375, 550, 450, 625],
        borderColor: "#764ba2",
        backgroundColor: "rgba(118, 75, 162, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#764ba2",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: "500",
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  }

  profileProgressChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: chartOptions,
  })
}

// Generate streak calendar
function generateStreakCalendar() {
  const calendarGrid = document.querySelector(".calendar-grid")
  if (!calendarGrid) return

  // Generate last 30 days
  const today = new Date()
  const days = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Simulate activity (in real app, fetch from API)
    const hasActivity = Math.random() > 0.3 // 70% chance of activity

    days.push({
      date: date.getDate(),
      hasActivity: hasActivity,
      isToday: i === 0,
    })
  }

  calendarGrid.innerHTML = days
    .map(
      (day) => `
        <div class="calendar-day ${day.hasActivity ? "active" : ""} ${day.isToday ? "today" : ""}"
             title="${day.hasActivity ? "Solved problems" : "No activity"}">
            ${day.date}
        </div>
    `,
    )
    .join("")
}

// Counter animation (reuse from dashboard)
function animateCounter(element, target, duration = 2000) {
  let start = 0
  const increment = target / (duration / 16)

  const timer = setInterval(() => {
    start += increment
    element.textContent = Math.floor(start)

    if (start >= target) {
      element.textContent = target
      clearInterval(timer)
    }
  }, 16)
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname === "/profile") {
    initializeProfile()
  }
})
