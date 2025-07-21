/**
 * Text measurement utilities for calculating optimal node dimensions
 */

interface TextDimensions {
  width: number
  height: number
}

/**
 * Measures text dimensions using a temporary DOM element
 * This is more accurate than canvas for multi-line text and handles CSS styling
 */
export function measureText(
  text: string,
  className?: string,
  maxWidth: number = 400
): TextDimensions {
  // Create a temporary div element
  const measureDiv = document.createElement('div')
  measureDiv.style.position = 'absolute'
  measureDiv.style.visibility = 'hidden'
  measureDiv.style.whiteSpace = 'pre-wrap'
  measureDiv.style.wordBreak = 'break-word'
  measureDiv.style.maxWidth = `${maxWidth}px`

  // Apply the same classes as the node text
  if (className) {
    measureDiv.className = className
  } else {
    // Default styles that match our node text
    measureDiv.style.fontSize = '14px' // text-sm
    measureDiv.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif'
    measureDiv.style.lineHeight = '1.5'
  }

  // Set the text content
  measureDiv.textContent = text

  // Append to body for measurement
  document.body.appendChild(measureDiv)

  // Get dimensions
  const rect = measureDiv.getBoundingClientRect()
  const dimensions = {
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
  }

  // Clean up
  document.body.removeChild(measureDiv)

  return dimensions
}

/**
 * Calculate optimal node dimensions based on content
 * Adds padding and ensures minimum sizes
 */
export function calculateNodeDimensions(
  text: string,
  nodeType: 'thought' | 'category' | 'root',
  options: {
    hasIcon?: boolean
    hasChildren?: boolean
    hasControls?: boolean
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    padding?: { x: number; y: number }
  } = {}
): { width: number; height: number } {
  const {
    hasIcon = false,
    hasChildren = false,
    hasControls = false,
    minWidth: initialMinWidth = 100,
    minHeight = 30,
    maxWidth = 400,
    padding = { x: 24, y: 16 }, // Default padding (px-3 py-2)
  } = options
  
  let minWidth = initialMinWidth

  // Measure the text
  const textDimensions = measureText(text, 'text-sm', maxWidth - padding.x * 2)

  // Calculate base dimensions
  let width = textDimensions.width + padding.x * 2
  let height = textDimensions.height + padding.y * 2

  // Add extra width for icons
  if (hasIcon) {
    width += 24 // Icon width + gap
  }

  // Add extra width for children count badge
  if (hasChildren) {
    width += 30 // Badge width
  }

  // Add extra width for collapse/expand chevron
  if (hasControls) {
    width += 20 // Chevron width
  }

  // Special handling for category nodes
  if (nodeType === 'category') {
    // Categories typically need more width
    minWidth = 150
  }

  // Special handling for root nodes
  if (nodeType === 'root') {
    // Root nodes are typically wider
    minWidth = 150
    // Add extra padding for gradient background
    width += 16
    height += 8
  }

  // Ensure minimum dimensions
  width = Math.max(width, minWidth)
  height = Math.max(height, minHeight)

  // Ensure maximum width
  width = Math.min(width, maxWidth)

  return { width, height }
}
