// src/DateRangeFilter.jsx
import { useState } from 'react'

function DateRangeFilter({ onDateRangeChange, onExport, isExporting }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleDateChange = () => {
    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null
    onDateRangeChange(dateRange)
  }

  const handleQuickSelect = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    
    setStartDate(startStr)
    setEndDate(endStr)
    onDateRangeChange({ start: startStr, end: endStr })
  }

  return (
    <div className="export-section">
      <h3>📊 Export Options</h3>
      
      {/* Quick Date Selections */}
      <div className="quick-dates">
        <button 
          onClick={() => handleQuickSelect(7)}
          className="btn-quick"
        >
          Last 7 Days
        </button>
        <button 
          onClick={() => handleQuickSelect(30)}
          className="btn-quick"
        >
          Last 30 Days
        </button>
        <button 
          onClick={() => handleQuickSelect(90)}
          className="btn-quick"
        >
          Last 3 Months
        </button>
        <button 
          onClick={() => {
            setStartDate('')
            setEndDate('')
            onDateRangeChange(null)
          }}
          className="btn-quick"
        >
          All Time
        </button>
      </div>

      {/* Custom Date Range */}
      <div className="date-range">
        <div className="form-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (e.target.value && endDate) {
                handleDateChange()
              }
            }}
            className="date-input"
          />
        </div>
        <div className="form-group">
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              if (startDate && e.target.value) {
                handleDateChange()
              }
            }}
            className="date-input"
          />
        </div>
      </div>

      {/* Export Buttons */}
      <div className="export-buttons">
        <button
          onClick={() => onExport('csv')}
          disabled={isExporting}
          className="btn-export csv"
        >
          {isExporting ? '⏳ Exporting...' : '📊 Export CSV'}
        </button>
        
        <button
          onClick={() => onExport('pdf')}
          disabled={isExporting}
          className="btn-export pdf"
        >
          {isExporting ? '⏳ Generating...' : '📄 Export PDF'}
        </button>
      </div>
    </div>
  )
}

export default DateRangeFilter