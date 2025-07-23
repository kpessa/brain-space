import React from 'react'

interface MonthHeaderProps {
  monthName: string
  year: number
  isCurrentMonth: boolean
}

export const MonthHeader: React.FC<MonthHeaderProps> = ({
  monthName,
  year,
  isCurrentMonth,
}) => {
  return (
    <div className="month-header flex items-center gap-2 mb-2">
      <div className="flex-grow h-px bg-gray-300"></div>
      <h3
        className={`text-sm font-medium px-3 ${
          isCurrentMonth ? 'text-brain-600' : 'text-gray-500'
        }`}
      >
        {monthName} {year}
      </h3>
      <div className="flex-grow h-px bg-gray-300"></div>
    </div>
  )
}