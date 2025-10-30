// Quiz functionality
let currentQuestions = []
let currentQuestion = null
let codeEditor = null

// Declare CodeMirror variable
const CodeMirror = window.CodeMirror

// Initialize CodeMirror editor
function initializeCodeEditor() {
  const textarea = document.getElementById("codeEditor")
  if (textarea && typeof CodeMirror !== "undefined") {
    codeEditor = CodeMirror.fromTextArea(textarea, {
      mode: "python",
      theme: "dracula",
      lineNumbers: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      indentUnit: 4,
      tabSize: 4,
      lineWrapping: true,
    })

    codeEditor.setValue(`# Write your solution here
def solution():
    # Your code goes here
    pass

# Test your solution
if __name__ == "__main__":
    result = solution()
    print(result)
`)
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

// Show message function
function showMessage(message, type) {
  const messageEl = document.createElement("div")
  messageEl.className = `floating-message ${type}`
  messageEl.textContent = message
  messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        background: ${type === "error" ? "#dc3545" : type === "success" ? "#28a745" : "#007bff"};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
    `
  document.body.appendChild(messageEl)

  setTimeout(() => {
    if (document.body.contains(messageEl)) {
      messageEl.style.animation = "slideOutRight 0.3s ease-in"
      setTimeout(() => {
        if (document.body.contains(messageEl)) {
          document.body.removeChild(messageEl)
        }
      }, 300)
    }
  }, 5000)
}

// Load questions from API
async function loadQuestions() {
  try {
    const questions = await apiCall("/api/questions")
    currentQuestions = questions
    displayQuestions()
  } catch (error) {
    console.error("Failed to load questions:", error)
    showMessage("Failed to load questions", "error")
  }
}

// Display questions in list
function displayQuestions() {
  const questionsList = document.getElementById("questionsList")
  if (!questionsList) return

  if (currentQuestions.length === 0) {
    questionsList.innerHTML = `
            <div class="no-questions">
                <i class="fas fa-question-circle"></i>
                <h3>No questions available</h3>
                <p>Generate some questions using AI to get started!</p>
                <button onclick="generateQuestion()" class="btn-primary">
                    <i class="fas fa-plus"></i> Generate Question
                </button>
            </div>
        `
    return
  }

  questionsList.innerHTML = currentQuestions
    .map(
      (question) => `
        <div class="question-item" onclick="selectQuestion(${question.id})">
            <div class="question-header">
                <h3>${question.title}</h3>
                <span class="difficulty-badge difficulty-${question.difficulty.toLowerCase()}">${question.difficulty}</span>
            </div>
            <p class="question-preview">${question.description.substring(0, 150)}...</p>
            <div class="question-meta">
                <span><i class="fas fa-clock"></i> Click to solve</span>
                <span class="topic-tag">${question.topic || "General"}</span>
            </div>
        </div>
    `,
    )
    .join("")
}

// Generate new question using AI with variety
async function generateQuestion() {
  const generateBtn = document.getElementById("generateQuestionBtn")

  // Show loading state
  if (generateBtn) {
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'
    generateBtn.disabled = true
  }

  try {
    showMessage("🤖 AI is creating a unique question...", "info")

    // Add randomness to the request
    const difficulties = ["Easy", "Medium", "Hard"]
    const topics = [
      "arrays",
      "strings",
      "linked lists",
      "stacks",
      "queues",
      "trees",
      "graphs",
      "dynamic programming",
      "sorting",
      "searching",
      "hash tables",
      "recursion",
      "binary search",
      "two pointers",
      "sliding window",
    ]

    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)]
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    const result = await apiCall("/api/generate-question", {
      method: "POST",
      body: JSON.stringify({
        difficulty: randomDifficulty,
        topic: randomTopic,
        timestamp: Date.now(), // Add timestamp for uniqueness
      }),
    })

    if (result.success) {
      showMessage(`✅ New ${result.question.difficulty} question generated!`, "success")
      // Reload questions to show the new one
      await loadQuestions()
    } else {
      showMessage("❌ Failed to generate question. Please try again.", "error")
    }
  } catch (error) {
    console.error("Question generation failed:", error)
    showMessage("❌ Failed to generate question. Please try again.", "error")
  } finally {
    // Reset button
    if (generateBtn) {
      generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate New Question'
      generateBtn.disabled = false
    }
  }
}

// Select and display a specific question
async function selectQuestion(questionId) {
  try {
    showMessage("📖 Loading question...", "info")
    const question = await apiCall(`/api/questions/${questionId}`)
    currentQuestion = question
    console.log("Loaded question:", question) // Debug log
    displayQuestionDetail()
  } catch (error) {
    console.error("Failed to load question:", error)
    showMessage("❌ Failed to load question", "error")
  }
}

// Display question detail view
function displayQuestionDetail() {
  const questionListView = document.getElementById("questionListView")
  const questionDetailView = document.getElementById("questionDetailView")

  if (questionListView) questionListView.style.display = "none"
  if (questionDetailView) questionDetailView.style.display = "block"

  // Update question header
  const questionTitle = document.getElementById("questionTitle")
  const questionDifficulty = document.getElementById("questionDifficulty")

  if (questionTitle) questionTitle.textContent = currentQuestion.title || "Untitled Question"
  if (questionDifficulty) {
    const difficulty = currentQuestion.difficulty || "Medium"
    questionDifficulty.textContent = difficulty
    questionDifficulty.className = `difficulty-badge difficulty-${difficulty.toLowerCase()}`
  }

  // Update question content
  const questionDesc = document.getElementById("questionDesc")
  const inputFormat = document.getElementById("inputFormat")
  const outputFormat = document.getElementById("outputFormat")
  const testCasesPreview = document.getElementById("testCasesPreview")

  if (questionDesc) {
    // Format description with proper line breaks
    const description = currentQuestion.description || "No description available."
    questionDesc.innerHTML = `<p>${description.replace(/\n/g, "</p><p>")}</p>`
  }

  if (inputFormat) {
    const inputFormatText = currentQuestion.input_format || "No input format specified."
    inputFormat.innerHTML = `<code>${inputFormatText}</code>`
  }

  if (outputFormat) {
    const outputFormatText = currentQuestion.output_format || "No output format specified."
    outputFormat.innerHTML = `<code>${outputFormatText}</code>`
  }

  // Display test cases preview (if available)
  if (testCasesPreview && currentQuestion.test_cases) {
    try {
      const testCases =
        typeof currentQuestion.test_cases === "string"
          ? JSON.parse(currentQuestion.test_cases)
          : currentQuestion.test_cases

      if (testCases && testCases.length > 0) {
        const previewHtml = testCases
          .slice(0, 2) // Show first 2 test cases
          .map(
            (testCase, index) => `
          <div class="test-case-preview">
            <strong>Example ${index + 1}:</strong>
            <div class="test-input">Input: <code>${testCase.input || "N/A"}</code></div>
            <div class="test-output">Output: <code>${testCase.expected || "N/A"}</code></div>
          </div>
        `,
          )
          .join("")

        testCasesPreview.innerHTML = previewHtml
      } else {
        testCasesPreview.innerHTML = "<p>No test cases available.</p>"
      }
    } catch (e) {
      console.error("Error parsing test cases:", e)
      testCasesPreview.innerHTML = "<p>Error loading test cases.</p>"
    }
  }

  // Initialize code editor if not already done
  if (!codeEditor) {
    setTimeout(() => {
      initializeCodeEditor()
    }, 100)
  }

  // Clear previous results
  const resultsContainer = document.getElementById("resultsContainer")
  if (resultsContainer) {
    resultsContainer.style.display = "none"
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" })
}

// Reveal answer functionality
function revealAnswer() {
  if (!currentQuestion || !codeEditor) {
    showMessage("❌ No question selected or editor not ready", "error")
    return
  }

  if (!currentQuestion.sample_solution) {
    showMessage("❌ No sample solution available for this question", "error")
    return
  }

  // Show confirmation dialog
  if (confirm("Are you sure you want to reveal the answer? This will replace your current code.")) {
    codeEditor.setValue(currentQuestion.sample_solution)
    showMessage("💡 Sample solution revealed!", "info")
  }
}

// Submit code solution
async function submitCode() {
  if (!currentQuestion || !codeEditor) {
    showMessage("❌ No question selected or editor not ready", "error")
    return
  }

  const code = codeEditor.getValue()
  const submitBtn = document.getElementById("submitCode")

  if (!code.trim()) {
    showMessage("❌ Please write some code before submitting", "error")
    return
  }

  // Show loading state
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running Tests...'
    submitBtn.disabled = true
  }

  try {
    showMessage("🔄 Running your code...", "info")

    const result = await apiCall(`/api/submit/${currentQuestion.id}`, {
      method: "POST",
      body: JSON.stringify({ code }),
    })

    displayResults(result)

    if (result.status === "Passed") {
      showMessage(`🎉 All tests passed! (${result.passed}/${result.total})`, "success")
    } else {
      showMessage(`❌ ${result.passed}/${result.total} tests passed`, "error")
    }
  } catch (error) {
    console.error("Submission failed:", error)
    showMessage("❌ Submission failed. Please try again.", "error")
  } finally {
    // Reset button
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Solution'
      submitBtn.disabled = false
    }
  }
}

// Display submission results
function displayResults(result) {
  const resultsContainer = document.getElementById("resultsContainer")
  const resultsContent = document.getElementById("resultsContent")

  if (!resultsContainer || !resultsContent) return

  resultsContainer.style.display = "block"

  const statusClass = result.status === "Passed" ? "success" : "error"
  const statusIcon = result.status === "Passed" ? "✅" : "❌"

  resultsContent.innerHTML = `
        <div class="result-summary ${statusClass}">
            <h4>${statusIcon} Result: ${result.status}</h4>
            <p>Passed: ${result.passed}/${result.total} test cases</p>
        </div>
        
        <div class="test-results">
            ${result.results
              .map(
                (testResult, index) => `
                <div class="test-result ${testResult.passed ? "passed" : "failed"}">
                    <h5>Test Case ${index + 1} ${testResult.passed ? "✅" : "❌"}</h5>
                    <div><strong>Input:</strong> <code>${testResult.input}</code></div>
                    <div><strong>Expected:</strong> <code>${testResult.expected}</code></div>
                    <div><strong>Actual:</strong> <code>${testResult.actual}</code></div>
                    <div><strong>Status:</strong> <span class="${testResult.passed ? "text-success" : "text-error"}">${testResult.passed ? "PASSED" : "FAILED"}</span></div>
                </div>
            `,
              )
              .join("")}
        </div>
    `

  // Scroll to results
  resultsContainer.scrollIntoView({ behavior: "smooth" })
}

// Go back to question list
function goBackToList() {
  const questionDetailView = document.getElementById("questionDetailView")
  const questionListView = document.getElementById("questionListView")

  if (questionDetailView) questionDetailView.style.display = "none"
  if (questionListView) questionListView.style.display = "block"

  currentQuestion = null

  // Clear results
  const resultsContainer = document.getElementById("resultsContainer")
  if (resultsContainer) {
    resultsContainer.style.display = "none"
  }
}

// Initialize quiz page
function initializeQuiz() {
  loadQuestions()

  // Event listeners
  const generateBtn = document.getElementById("generateQuestionBtn")
  const backBtn = document.getElementById("backToList")
  const runBtn = document.getElementById("runCode")
  const submitBtn = document.getElementById("submitCode")
  const revealBtn = document.getElementById("revealAnswerBtn")

  if (generateBtn) {
    generateBtn.addEventListener("click", generateQuestion)
  }

  if (backBtn) {
    backBtn.addEventListener("click", goBackToList)
  }

  if (runBtn) {
    runBtn.addEventListener("click", () => {
      // For now, just submit - can add run-only functionality later
      submitCode()
    })
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", submitCode)
  }

  if (revealBtn) {
    revealBtn.addEventListener("click", revealAnswer)
  }
}

// Make functions globally available
window.selectQuestion = selectQuestion
window.generateQuestion = generateQuestion
window.revealAnswer = revealAnswer

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname === "/quiz") {
    initializeQuiz()
  }
})