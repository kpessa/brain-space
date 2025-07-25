import React from 'react'

interface MonthHeaderProps {
  monthName: string
  year: number
  isCurrentMonth: boolean
}

export const MonthHeader: React.FC<MonthHeaderProps> = ({ monthName, year, isCurrentMonth }) => {
  return (
    <div className="month-header flex items-center space-x-2 mb-2 px-1">
      <h3
        className={`text-sm font-semibold ${
          isCurrentMonth
            ? 'text-brain-600 bg-brain-50 px-2 py-0.5 rounded-md'
            : 'text-gray-600'
        }`}
      >
        {monthName}
      </h3>
      <span className="text-xs text-gray-400">{year}</span>
    </div>
  )
}