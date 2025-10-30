import { Chart } from "@/components/ui/chart"
// Dashboard functionality
let progressChart = null
const apiCall = null // Declare apiCall variable

// Initialize dashboard
function initializeDashboard() {
  loadDashboardData()
  initializeProgressChart()
  loadRecentActivity()
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const stats = await apiCall("/api/stats")

    // Update stats
    const totalUsersEl = document.getElementById("totalUsers")
    const totalQuestionsEl = document.getElementById("totalQuestions")
    const totalSubmissionsEl = document.getElementById("totalSubmissions")

    if (totalUsersEl) animateCounter(totalUsersEl, stats.total_users)
    if (totalQuestionsEl) animateCounter(totalQuestionsEl, stats.total_questions)
    if (totalSubmissionsEl) animateCounter(totalSubmissionsEl, stats.total_submissions)

    // Update user-specific stats
    updateUserStats()
  } catch (error) {
    console.error("Failed to load dashboard data:", error)
  }
}

// Update user-specific stats
function updateUserStats() {
  // Simulate user stats - in real app, fetch from API
  const userStreak = document.getElementById("userStreak")
  const userScore = document.getElementById("userScore")

  if (userStreak) animateCounter(userStreak, 7)
  if (userScore) animateCounter(userScore, 1250)
}

// Initialize progress chart
function initializeProgressChart() {
  const ctx = document.getElementById("progressChart")
  if (!ctx) return

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Problems Solved",
        data: [2, 4, 3, 5, 2, 6, 4],
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
        label: "Study Time (hours)",
        data: [1, 3, 2, 4, 2, 5, 3],
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

  progressChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: chartOptions,
  })
}

// Load recent activity
function loadRecentActivity() {
  // Simulate recent activity - in real app, fetch from API
  const activities = [
    {
      type: "success",
      icon: "fas fa-check",
      title: 'Solved "Two Sum" Problem',
      time: "2 hours ago",
    },
    {
      type: "info",
      icon: "fas fa-play",
      title: "Started DSA Learning - Arrays",
      time: "5 hours ago",
    },
    {
      type: "warning",
      icon: "fas fa-code",
      title: 'Attempted "Binary Search"',
      time: "1 day ago",
    },
    {
      type: "success",
      icon: "fas fa-trophy",
      title: 'Earned "7-Day Streak" Achievement',
      time: "2 days ago",
    },
  ]

  const activityContainer = document.getElementById("recentActivity")
  if (activityContainer) {
    activityContainer.innerHTML = activities
      .map(
        (activity) => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.time}</p>
                </div>
            </div>
        `,
      )
      .join("")
  }
}

// Counter animation
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

// Chart period change handler
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname === "/dashboard") {
    initializeDashboard()

    // Chart period selector
    const chartPeriod = document.getElementById("chartPeriod")
    if (chartPeriod) {
      chartPeriod.addEventListener("change", (e) => {
        // Update chart data based on selected period
        updateChartData(e.target.value)
      })
    }
  }
})

// Update chart data based on period
function updateChartData(period) {
  if (!progressChart) return

  let newData, newLabels

  switch (period) {
    case "week":
      newLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      newData = [
        [2, 4, 3, 5, 2, 6, 4],
        [1, 3, 2, 4, 2, 5, 3],
      ]
      break
    case "month":
      newLabels = ["Week 1", "Week 2", "Week 3", "Week 4"]
      newData = [
        [15, 22, 18, 25],
        [12, 18, 15, 20],
      ]
      break
    case "year":
      newLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      newData = [
        [45, 52, 48, 61, 55, 67],
        [38, 42, 40, 48, 45, 52],
      ]
      break
  }

  progressChart.data.labels = newLabels
  progressChart.data.datasets[0].data = newData[0]
  progressChart.data.datasets[1].data = newData[1]
  progressChart.update("active")
}
