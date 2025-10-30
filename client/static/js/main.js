// Global variables
let currentUser = null
let isAuthenticated = false

// Utility functions
function showMessage(message, type = "info") {
  const messageEl = document.getElementById("authMessage")
  if (messageEl) {
    messageEl.textContent = message
    messageEl.className = `message ${type}`
    messageEl.style.display = "block"

    setTimeout(() => {
      messageEl.style.display = "none"
    }, 5000)
  } else {
    // Create floating message if no message element exists
    const floatingMsg = document.createElement("div")
    floatingMsg.className = `floating-message ${type}`
    floatingMsg.textContent = message
    floatingMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 9999;
            background: ${type === "error" ? "#dc3545" : type === "success" ? "#28a745" : "#007bff"};
        `
    document.body.appendChild(floatingMsg)

    setTimeout(() => {
      if (document.body.contains(floatingMsg)) {
        document.body.removeChild(floatingMsg)
      }
    }, 5000)
  }
}

// API helper function
async function apiCall(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  }

  try {
    const response = await fetch(endpoint, { ...defaultOptions, ...options })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Request failed")
    }

    return data
  } catch (error) {
    console.error("API call failed:", error)
    throw error
  }
}

// Authentication functions
async function checkAuthStatus() {
  try {
    const response = await apiCall("/api/status")
    if (response.authenticated) {
      currentUser = response.user
      isAuthenticated = true

      // Update UI elements
      const usernameEl = document.getElementById("username")
      if (usernameEl) {
        usernameEl.textContent = response.user.username
      }
    }
    return response.authenticated
  } catch (error) {
    console.error("Auth check failed:", error)
    return false
  }
}

async function login(formData) {
  try {
    const response = await apiCall("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    })

    showMessage("Login successful!", "success")
    setTimeout(() => {
      window.location.href = "/dashboard"
    }, 1000)
  } catch (error) {
    showMessage(error.message || "Login failed", "error")
  }
}

async function register(formData) {
  try {
    const response = await apiCall("/api/register", {
      method: "POST",
      body: JSON.stringify({
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
        user_type: formData.get("user_type"),
      }),
    })

    showMessage("Registration successful! Please login.", "success")
    switchToLogin()
  } catch (error) {
    showMessage(error.message || "Registration failed", "error")
  }
}

async function logout() {
  try {
    await apiCall("/api/logout", { method: "POST" })
    window.location.href = "/"
  } catch (error) {
    console.error("Logout failed:", error)
    window.location.href = "/"
  }
}

// UI switching functions
function switchToRegister() {
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")
  const authTitle = document.getElementById("authTitle")
  const authSubtitle = document.getElementById("authSubtitle")
  const switchText = document.getElementById("switchText")

  if (loginForm) loginForm.style.display = "none"
  if (registerForm) registerForm.style.display = "block"
  if (authTitle) authTitle.textContent = "Create Account"
  if (authSubtitle) authSubtitle.textContent = "Join our learning community"
  if (switchText) {
    switchText.innerHTML = 'Already have an account? <a href="#" id="switchLink">Sign in</a>'

    // Re-attach event listener to new link
    const newSwitchLink = document.getElementById("switchLink")
    if (newSwitchLink) {
      newSwitchLink.addEventListener("click", (e) => {
        e.preventDefault()
        switchToLogin()
      })
    }
  }
}

function switchToLogin() {
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")
  const authTitle = document.getElementById("authTitle")
  const authSubtitle = document.getElementById("authSubtitle")
  const switchText = document.getElementById("switchText")

  if (registerForm) registerForm.style.display = "none"
  if (loginForm) loginForm.style.display = "block"
  if (authTitle) authTitle.textContent = "Welcome Back"
  if (authSubtitle) authSubtitle.textContent = "Sign in to continue your learning journey"
  if (switchText) {
    switchText.innerHTML = 'Don\'t have an account? <a href="#" id="switchLink">Sign up</a>'

    // Re-attach event listener to new link
    const newSwitchLink = document.getElementById("switchLink")
    if (newSwitchLink) {
      newSwitchLink.addEventListener("click", (e) => {
        e.preventDefault()
        switchToRegister()
      })
    }
  }
}

// Stats animation
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

// Load stats for landing page
async function loadStats() {
  try {
    const stats = await apiCall("/api/stats")

    const userCountEl = document.getElementById("userCount")
    const questionCountEl = document.getElementById("questionCount")
    const submissionCountEl = document.getElementById("submissionCount")

    if (userCountEl) animateCounter(userCountEl, stats.total_users)
    if (questionCountEl) animateCounter(questionCountEl, stats.total_questions)
    if (submissionCountEl) animateCounter(submissionCountEl, stats.total_submissions)
  } catch (error) {
    console.error("Failed to load stats:", error)
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const stats = await apiCall("/api/stats")

    const totalUsersEl = document.getElementById("totalUsers")
    const totalQuestionsEl = document.getElementById("totalQuestions")
    const totalSubmissionsEl = document.getElementById("totalSubmissions")

    if (totalUsersEl) totalUsersEl.textContent = stats.total_users
    if (totalQuestionsEl) totalQuestionsEl.textContent = stats.total_questions
    if (totalSubmissionsEl) totalSubmissionsEl.textContent = stats.total_submissions
  } catch (error) {
    console.error("Failed to load dashboard data:", error)
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication status
  await checkAuthStatus()

  // Landing page
  if (document.querySelector(".landing-page")) {
    loadStats()
  }

  // Auth page
  if (document.getElementById("loginForm")) {
    // Login form handler
    const loginForm = document.getElementById("loginForm")
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        await login(formData)
      })
    }

    // Register form handler
    const registerForm = document.getElementById("registerForm")
    if (registerForm) {
      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        await register(formData)
      })
    }

    // Switch link handler
    const switchLink = document.getElementById("switchLink")
    if (switchLink) {
      switchLink.addEventListener("click", (e) => {
        e.preventDefault()
        switchToRegister()
      })
    }
  }

  // Dashboard
  if (document.querySelector(".dashboard")) {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      window.location.href = "/login"
      return
    }

    // Load dashboard data
    if (window.location.pathname === "/dashboard") {
      loadDashboardData()
    }

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault()
        logout()
      })
    }
  }
})
