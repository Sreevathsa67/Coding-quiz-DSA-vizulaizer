// DSA Visualization JavaScript
class DSAVisualizer {
  constructor() {
    this.svg = document.getElementById("visualizationSVG")
    this.dataStructure = "linkedlist"
    this.data = []
    this.setupEventListeners()
    this.setupSVG()
  }

  setupEventListeners() {
    document.getElementById("dataStructure").addEventListener("change", (e) => {
      this.dataStructure = e.target.value
      this.clear()
    })

    document.getElementById("insertBtn").addEventListener("click", () => this.insert())
    document.getElementById("deleteBtn").addEventListener("click", () => this.delete())
    document.getElementById("traverseBtn").addEventListener("click", () => this.traverse())
    document.getElementById("clearBtn").addEventListener("click", () => this.clear())
  }

  setupSVG() {
    // Create arrow marker for links
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker")
    marker.setAttribute("id", "arrowhead")
    marker.setAttribute("markerWidth", "10")
    marker.setAttribute("markerHeight", "7")
    marker.setAttribute("refX", "9")
    marker.setAttribute("refY", "3.5")
    marker.setAttribute("orient", "auto")

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7")
    polygon.setAttribute("fill", "#ffffff")

    marker.appendChild(polygon)
    defs.appendChild(marker)
    this.svg.appendChild(defs)
  }

  insert() {
    const value = document.getElementById("nodeValue").value
    const position = document.getElementById("nodePosition").value

    if (!value) {
      this.log("Please enter a value")
      return
    }

    const numValue = Number.parseInt(value)

    switch (this.dataStructure) {
      case "linkedlist":
        this.insertLinkedList(numValue, position ? Number.parseInt(position) : -1)
        break
      case "stack":
        this.insertStack(numValue)
        break
      case "queue":
        this.insertQueue(numValue)
        break
    }

    document.getElementById("nodeValue").value = ""
    document.getElementById("nodePosition").value = ""
  }

  delete() {
    const position = document.getElementById("nodePosition").value

    switch (this.dataStructure) {
      case "linkedlist":
        this.deleteLinkedList(position ? Number.parseInt(position) : 0)
        break
      case "stack":
        this.deleteStack()
        break
      case "queue":
        this.deleteQueue()
        break
    }

    document.getElementById("nodePosition").value = ""
  }

  traverse() {
    switch (this.dataStructure) {
      case "linkedlist":
        this.traverseLinkedList()
        break
      case "stack":
        this.traverseStack()
        break
      case "queue":
        this.traverseQueue()
        break
    }
  }

  clear() {
    this.data = []
    this.svg.innerHTML = ""
    this.setupSVG()
    this.log(`${this.dataStructure} cleared`)
  }

  // Linked List Operations
  insertLinkedList(value, position) {
    if (position === -1 || position >= this.data.length) {
      this.data.push(value)
      this.log(`Inserted ${value} at end`)
    } else {
      this.data.splice(position, 0, value)
      this.log(`Inserted ${value} at position ${position}`)
    }
    this.renderLinkedList()
  }

  deleteLinkedList(position) {
    if (this.data.length === 0) {
      this.log("List is empty")
      return
    }

    if (position >= this.data.length) {
      position = this.data.length - 1
    }

    const deleted = this.data.splice(position, 1)[0]
    this.log(`Deleted ${deleted} from position ${position}`)
    this.renderLinkedList()
  }

  traverseLinkedList() {
    if (this.data.length === 0) {
      this.log("List is empty")
      return
    }

    this.log("Traversing: " + this.data.join(" -> "))
    this.highlightNodes()
  }

  renderLinkedList() {
    this.svg.innerHTML = ""
    this.setupSVG()

    const nodeRadius = 25
    const nodeSpacing = 100
    const startX = 50
    const startY = 200

    this.data.forEach((value, index) => {
      const x = startX + index * nodeSpacing

      // Create node circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", x)
      circle.setAttribute("cy", startY)
      circle.setAttribute("r", nodeRadius)
      circle.setAttribute("class", "node")
      circle.setAttribute("id", `node-${index}`)

      // Create node text
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", x)
      text.setAttribute("y", startY)
      text.setAttribute("class", "node-text")
      text.textContent = value

      this.svg.appendChild(circle)
      this.svg.appendChild(text)

      // Create link to next node
      if (index < this.data.length - 1) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line.setAttribute("x1", x + nodeRadius)
        line.setAttribute("y1", startY)
        line.setAttribute("x2", startX + (index + 1) * nodeSpacing - nodeRadius)
        line.setAttribute("y2", startY)
        line.setAttribute("class", "link")

        this.svg.appendChild(line)
      }
    })
  }

  // Stack Operations
  insertStack(value) {
    this.data.push(value)
    this.log(`Pushed ${value} onto stack`)
    this.renderStack()
  }

  deleteStack() {
    if (this.data.length === 0) {
      this.log("Stack is empty")
      return
    }

    const popped = this.data.pop()
    this.log(`Popped ${popped} from stack`)
    this.renderStack()
  }

  traverseStack() {
    if (this.data.length === 0) {
      this.log("Stack is empty")
      return
    }

    this.log("Stack (top to bottom): " + this.data.slice().reverse().join(" | "))
  }

  renderStack() {
    this.svg.innerHTML = ""
    this.setupSVG()

    const nodeWidth = 80
    const nodeHeight = 40
    const startX = 200
    const startY = 350

    this.data.forEach((value, index) => {
      const y = startY - index * (nodeHeight + 5)

      // Create node rectangle
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      rect.setAttribute("x", startX - nodeWidth / 2)
      rect.setAttribute("y", y - nodeHeight / 2)
      rect.setAttribute("width", nodeWidth)
      rect.setAttribute("height", nodeHeight)
      rect.setAttribute("fill", "#ffd700")
      rect.setAttribute("stroke", "#ffffff")
      rect.setAttribute("stroke-width", "2")
      rect.setAttribute("id", `node-${index}`)

      // Create node text
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", startX)
      text.setAttribute("y", y)
      text.setAttribute("class", "node-text")
      text.textContent = value

      this.svg.appendChild(rect)
      this.svg.appendChild(text)
    })

    // Add "TOP" label
    if (this.data.length > 0) {
      const topText = document.createElementNS("http://www.w3.org/2000/svg", "text")
      topText.setAttribute("x", startX + 60)
      topText.setAttribute("y", startY - (this.data.length - 1) * (nodeHeight + 5))
      topText.setAttribute("fill", "#ffd700")
      topText.setAttribute("font-size", "14")
      topText.textContent = "← TOP"

      this.svg.appendChild(topText)
    }
  }

  // Queue Operations
  insertQueue(value) {
    this.data.push(value)
    this.log(`Enqueued ${value}`)
    this.renderQueue()
  }

  deleteQueue() {
    if (this.data.length === 0) {
      this.log("Queue is empty")
      return
    }

    const dequeued = this.data.shift()
    this.log(`Dequeued ${dequeued}`)
    this.renderQueue()
  }

  traverseQueue() {
    if (this.data.length === 0) {
      this.log("Queue is empty")
      return
    }

    this.log("Queue (front to rear): " + this.data.join(" | "))
  }

  renderQueue() {
    this.svg.innerHTML = ""
    this.setupSVG()

    const nodeWidth = 60
    const nodeHeight = 40
    const startX = 50
    const startY = 200

    this.data.forEach((value, index) => {
      const x = startX + index * (nodeWidth + 10)

      // Create node rectangle
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      rect.setAttribute("x", x)
      rect.setAttribute("y", startY - nodeHeight / 2)
      rect.setAttribute("width", nodeWidth)
      rect.setAttribute("height", nodeHeight)
      rect.setAttribute("fill", "#ffd700")
      rect.setAttribute("stroke", "#ffffff")
      rect.setAttribute("stroke-width", "2")
      rect.setAttribute("id", `node-${index}`)

      // Create node text
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", x + nodeWidth / 2)
      text.setAttribute("y", startY)
      text.setAttribute("class", "node-text")
      text.textContent = value

      this.svg.appendChild(rect)
      this.svg.appendChild(text)
    })

    // Add FRONT and REAR labels
    if (this.data.length > 0) {
      const frontText = document.createElementNS("http://www.w3.org/2000/svg", "text")
      frontText.setAttribute("x", startX + nodeWidth / 2)
      frontText.setAttribute("y", startY - 35)
      frontText.setAttribute("fill", "#ffd700")
      frontText.setAttribute("font-size", "12")
      frontText.setAttribute("text-anchor", "middle")
      frontText.textContent = "FRONT"

      const rearText = document.createElementNS("http://www.w3.org/2000/svg", "text")
      rearText.setAttribute("x", startX + (this.data.length - 1) * (nodeWidth + 10) + nodeWidth / 2)
      rearText.setAttribute("y", startY + 35)
      rearText.setAttribute("fill", "#ffd700")
      rearText.setAttribute("font-size", "12")
      rearText.setAttribute("text-anchor", "middle")
      rearText.textContent = "REAR"

      this.svg.appendChild(frontText)
      this.svg.appendChild(rearText)
    }
  }

  highlightNodes() {
    this.data.forEach((_, index) => {
      setTimeout(() => {
        const node = document.getElementById(`node-${index}`)
        if (node) {
          node.classList.add("highlight")
          setTimeout(() => {
            node.classList.remove("highlight")
          }, 1000)
        }
      }, index * 500)
    })
  }

  log(message) {
    const logContainer = document.getElementById("logContainer")
    const timestamp = new Date().toLocaleTimeString()
    logContainer.innerHTML += `<div>[${timestamp}] ${message}</div>`
    logContainer.scrollTop = logContainer.scrollHeight
  }
}

// Initialize DSA Visualizer when page loads
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("visualizationSVG")) {
    new DSAVisualizer()
  }
})