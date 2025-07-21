interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  category: string
  message: string
  data?: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 log entries

  private addLog(level: LogEntry['level'], category: string, message: string, data?: any) {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'pm' : 'am'
    const displayHours = hours % 12 || 12
    const formattedTime = `${displayHours.toString().padStart(2, '0')}-${minutes}${ampm}`

    const entry: LogEntry = {
      timestamp: formattedTime,
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep clone to prevent mutations
    }

    this.logs.push(entry)

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Also log to console
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
    console[consoleMethod](`[${category}] ${message}`, data || '')
  }

  info(category: string, message: string, data?: any) {
    this.addLog('info', category, message, data)
  }

  warn(category: string, message: string, data?: any) {
    this.addLog('warn', category, message, data)
  }

  error(category: string, message: string, data?: any) {
    this.addLog('error', category, message, data)
  }

  debug(category: string, message: string, data?: any) {
    this.addLog('debug', category, message, data)
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  downloadLogs() {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'pm' : 'am'
    const displayHours = hours % 12 || 12
    const timeStamp = `${displayHours.toString().padStart(2, '0')}-${minutes}${ampm}`

    const logsData = {
      exportDate: new Date().toISOString(),
      exportTime: timeStamp,
      totalLogs: this.logs.length,
      logs: this.logs,
    }

    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brain-space-logs-${timeStamp}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export const logger = new Logger()
