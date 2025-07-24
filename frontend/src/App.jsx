import { useState, useEffect, createContext, useContext } from 'react'
import axios from 'axios'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts'
import DateRangeFilter from './components/DateRangeFilter.jsx'
import { exportTransactionsToCSV } from './utils/exportUtils'
import { generateReportWithCharts } from './utils/pdfUtils'
import './App.css'

// API Configuration
const API_BASE_URL = 'https://flowtrack-backend-87cf.onrender.com/api'
axios.defaults.baseURL = API_BASE_URL

// Auth Context
const AuthContext = createContext()

// Auth Provider Component
// Replace your AuthProvider component with this fixed version:

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')
      
      if (storedToken) {
        // Set the token in axios defaults
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        
        // Test the token with an endpoint we know exists (categories)
        try {
          await axios.get('/categories/')
          // If categories call succeeds, token is valid
          setToken(storedToken)
          
          // Get stored username or use fallback
          const storedUsername = localStorage.getItem('username')
          setUser({ username: storedUsername || 'user' })
        } catch (error) {
          console.log('Token invalid or expired, clearing auth')
          // Token is invalid, clear it
          localStorage.removeItem('token')
          localStorage.removeItem('username') // Also clear username
          delete axios.defaults.headers.common['Authorization']
          setToken(null)
          setUser(null)
        }
      } else {
        // No token, make sure auth header is cleared
        delete axios.defaults.headers.common['Authorization']
      }
      
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login/', { username, password })
      const { access, user: userData } = response.data
      setToken(access)
      setUser(userData || { username }) // Use backend data or fallback to username
      localStorage.setItem('token', access)
      localStorage.setItem('username', username) // Store username for session persistence
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' }
    }
  }

  const register = async (username, email, password, confirmPassword) => {
    try {
      const response = await axios.post('/auth/register/', { 
        username, 
        email, 
        password,
        password_confirm: confirmPassword, 
        first_name: '',
        last_name: ''
      })
      const { access, user: userData } = response.data
      setToken(access)
      setUser(userData || { username }) // Use backend data or fallback to username
      localStorage.setItem('token', access)
      localStorage.setItem('username', username) // Store username for session persistence
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data || 'Registration failed' }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('username') // Clear username on logout
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = () => useContext(AuthContext)

// Login Component
function LoginForm({ onSwitchToRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const result = await login(username, password)
    if (!result.success) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="auth-form">
      <h2>🏦 Welcome to FlowTrack</h2>
      <p>Sign in to manage your finances</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <p>
        Don't have an account?{' '}
        <button onClick={onSwitchToRegister} className="link-button">
          Sign up here
        </button>
      </p>
      
      <div className="demo-credentials">
        <p><strong>Demo Account:</strong></p>
        <p>Username: testuser | Password: testpass123</p>
      </div>
    </div>
  )
}

// Register Component
// Replace your RegisterForm component in App.jsx with this:

function RegisterForm({ onSwitchToLogin }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('') // NEW FIELD
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    
    const result = await register(username, email, password, confirmPassword) // Pass confirmPassword
    if (!result.success) {
      // Better error handling
      let errorMessage = result.error
      if (typeof result.error === 'object') {
        const errorMessages = []
        for (const [field, messages] of Object.entries(result.error)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field.replace('_', ' ')}: ${messages.join(', ')}`)
          } else {
            errorMessages.push(`${field.replace('_', ' ')}: ${messages}`)
          }
        }
        errorMessage = errorMessages.join('. ')
      }
      setError(errorMessage)
    }
    setLoading(false)
  }

  return (
    <div className="auth-form">
      <h2>🎯 Create FlowTrack Account</h2>
      <p>Start tracking your finances today</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {/* NEW PASSWORD CONFIRMATION FIELD */}
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      
      <p>
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="link-button">
          Sign in here
        </button>
      </p>
    </div>
  )
}
// Chart Components
function CategoryBreakdownChart({ transactions }) {
  const categoryData = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'expense') {
      const existing = acc.find(item => item.name === transaction.category_name)
      if (existing) {
        existing.value += parseFloat(transaction.amount)
      } else {
        acc.push({
          name: transaction.category_name,
          value: parseFloat(transaction.amount),
          color: transaction.category_color
        })
      }
    }
    return acc
  }, [])

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (categoryData.length === 0) {
    return (
      <div className="chart-container">
        <h3>📊 Expense Breakdown</h3>
        <div className="no-data">No expense data available</div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3>📊 Expense Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function MonthlyTrendsChart({ transactions }) {
  const monthlyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, income: 0, expenses: 0 }
    }
    
    if (transaction.type === 'income') {
      acc[monthKey].income += parseFloat(transaction.amount)
    } else {
      acc[monthKey].expenses += parseFloat(transaction.amount)
    }
    
    return acc
  }, {})

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(item => ({
      ...item,
      balance: item.income - item.expenses,
      monthName: new Date(item.month + '-01').toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      })
    }))

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <h3>📈 Monthly Trends</h3>
        <div className="no-data">No transaction data available</div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3>📈 Monthly Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthName" />
          <YAxis />
          <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#27ae60" 
            strokeWidth={3}
            name="Income"
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#e74c3c" 
            strokeWidth={3}
            name="Expenses"
          />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="#3498db" 
            strokeWidth={3}
            name="Balance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function IncomeVsExpensesChart({ transactions }) {
  const totals = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'income') {
      acc.income += parseFloat(transaction.amount)
    } else {
      acc.expenses += parseFloat(transaction.amount)
    }
    return acc
  }, { income: 0, expenses: 0 })

  const data = [
    { name: 'Income', amount: totals.income, fill: '#27ae60' },
    { name: 'Expenses', amount: totals.expenses, fill: '#e74c3c' }
  ]

  return (
    <div className="chart-container">
      <h3>💰 Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
          <Bar dataKey="amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Dashboard Component
function Dashboard() {
  const { user, logout } = useAuth()
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // New Category Form
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryType, setCategoryType] = useState('expense')

  // New Transaction Form
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionDescription, setTransactionDescription] = useState('')
  const [transactionType, setTransactionType] = useState('expense')
  const [transactionCategory, setTransactionCategory] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])

  // Export functionality state
  const [dateRange, setDateRange] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = transactions

// Filter by category
if (selectedCategory !== 'all') {
  filtered = filtered.filter(t => t.category_name === selectedCategory)
}

// Filter by date range (if dateRange exists)
if (dateRange && dateRange.start && dateRange.end) {
  const startDate = new Date(dateRange.start)
  const endDate = new Date(dateRange.end)
  endDate.setHours(23, 59, 59, 999)
  
  filtered = filtered.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate >= startDate && transactionDate <= endDate
  })
}

setFilteredTransactions(filtered)
  }, [selectedCategory, transactions, dateRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [categoriesRes, transactionsRes] = await Promise.all([
        axios.get('/categories/'),
        axios.get('/transactions/')
      ])
      setCategories(categoriesRes.data)
      setTransactions(transactionsRes.data)
      setError('')
    } catch (error) {
      setError('Failed to load data')
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/categories/', {
        name: categoryName,
        description: categoryDescription,
        type: categoryType
      })
      setCategoryName('')
      setCategoryDescription('')
      setCategoryType('expense')
      setShowCategoryForm(false)
      fetchData()
    } catch (error) {
      setError('Failed to create category')
    }
  }

  const handleCreateTransaction = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/transactions/', {
        amount: transactionAmount,
        description: transactionDescription,
        type: transactionType,
        category: parseInt(transactionCategory),
        date: transactionDate
      })
      setTransactionAmount('')
      setTransactionDescription('')
      setTransactionType('expense')
      setTransactionCategory('')
      setTransactionDate(new Date().toISOString().split('T')[0])
      setShowTransactionForm(false)
      fetchData()
    } catch (error) {
      setError('Failed to create transaction')
    }
  }

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`/transactions/${id}/`)
        fetchData()
      } catch (error) {
        setError('Failed to delete transaction')
      }
    }
  }

  const calculateTotalsByType = () => {
    const totals = { income: 0, expense: 0 }
    filteredTransactions.forEach(transaction => {
      totals[transaction.type] += parseFloat(transaction.amount)
    })
    return totals
  }

  const handleExport = async (type) => {
    setIsExporting(true)
    setExportMessage(null)
    
    try {
      if (type === 'csv') {
        const result = exportTransactionsToCSV(transactions, dateRange)
        setExportMessage({
          type: 'success',
          text: `Successfully exported ${result.recordCount} transactions to ${result.filename}`
        })
      } else if (type === 'pdf') {
        // Create summary object for PDF
        const summary = {
          totalIncome: totals.income,
          totalExpenses: totals.expense,
          balance: balance,
          transactionCount: transactions.length
        }
        
        const pdf = await generateReportWithCharts(transactions, summary, categories, dateRange)
        const filename = `flowtrack_report_${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(filename)
        setExportMessage({
          type: 'success',
          text: `Successfully generated PDF report: ${filename}`
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportMessage({
        type: 'error',
        text: `Export failed: ${error.message}`
      })
    } finally {
      setIsExporting(false)
      // Clear message after 5 seconds
      setTimeout(() => setExportMessage(null), 5000)
    }
  }

  const totals = calculateTotalsByType()
  const balance = totals.income - totals.expense

  if (loading) {
    return <div className="loading">Loading your financial data...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>💰 FlowTrack Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}!</span>
          <button onClick={logout} className="btn-secondary">Logout</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {/* Financial Summary */}
      <div className="summary-cards">
        <div className="card income">
          <h3>💚 Total Income</h3>
          <p className="amount">${totals.income.toFixed(2)}</p>
        </div>
        <div className="card expense">
          <h3>❤️ Total Expenses</h3>
          <p className="amount">${totals.expense.toFixed(2)}</p>
        </div>
        <div className={`card balance ${balance >= 0 ? 'positive' : 'negative'}`}>
          <h3>💎 Balance</h3>
          <p className="amount">${balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Export Section */}
      <DateRangeFilter 
        onDateRangeChange={setDateRange}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Export Message */}
      {exportMessage && (
        <div className={`export-message ${exportMessage.type}`}>
          <span>{exportMessage.type === 'success' ? '✅' : '❌'}</span>
          <span>{exportMessage.text}</span>
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-section">
        <div className="charts-grid">
          <div id="expense-pie-chart">
            <CategoryBreakdownChart transactions={filteredTransactions} />
          </div>
          <div id="income-expense-bar-chart">
            <IncomeVsExpensesChart transactions={filteredTransactions} />
          </div>
        </div>
        <div className="chart-full-width">
          <div id="trend-line-chart">
            <MonthlyTrendsChart transactions={filteredTransactions} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={() => setShowCategoryForm(true)} 
          className="btn-primary"
        >
          + Add Category
        </button>
        <button 
          onClick={() => setShowTransactionForm(true)} 
          className="btn-primary"
        >
          + Add Transaction
        </button>
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <label>Filter by Category:</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>
              {category.name} ({category.type})
            </option>
          ))}
        </select>
      </div>

      {/* Transactions List */}
      <div className="transactions-section">
        <h2>Recent Transactions</h2>
        {filteredTransactions.length === 0 ? (
          <p>No transactions found. Add your first transaction!</p>
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map(transaction => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-info">
                  <div className="transaction-main">
                    <span className="amount">
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount}
                    </span>
                    <span className="description">{transaction.description}</span>
                  </div>
                  <div className="transaction-meta">
                    <span 
                      className="category"
                      style={{ backgroundColor: transaction.category_color }}
                    >
                      {transaction.category_name}
                    </span>
                    <span className="date">{transaction.date}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteTransaction(transaction.id)}
                  className="btn-delete"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Category</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Description"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                />
              </div>
              <div className="form-group">
                <select 
                  value={categoryType} 
                  onChange={(e) => setCategoryType(e.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">Create Category</button>
                <button 
                  type="button" 
                  onClick={() => setShowCategoryForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Transaction</h3>
            <form onSubmit={handleCreateTransaction}>
              <div className="form-group">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Description"
                  value={transactionDescription}
                  onChange={(e) => setTransactionDescription(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <select 
                  value={transactionType} 
                  onChange={(e) => setTransactionType(e.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="form-group">
                <select 
                  value={transactionCategory} 
                  onChange={(e) => setTransactionCategory(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories
                    .filter(cat => cat.type === transactionType)
                    .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">Add Transaction</button>
                <button 
                  type="button" 
                  onClick={() => setShowTransactionForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Main App Component
function App() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <AuthProvider>
      <div className="App">
        <AuthenticatedApp isLogin={isLogin} setIsLogin={setIsLogin} />
      </div>
    </AuthProvider>
  )
}

function AuthenticatedApp({ isLogin, setIsLogin }) {
  const { token, loading } = useAuth()

  if (loading) {
    return <div className="loading">Initializing FlowTrack...</div>
  }

  if (!token) {
    return isLogin ? (
      <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
    )
  }

  return <Dashboard />
}

export default App