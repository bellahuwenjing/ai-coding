import { useState, useEffect } from 'react'
import { logout, onAuthStateChange } from './services/auth'
import { supabase } from './config/supabase'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import PeopleList from './components/ResourceList/PeopleList'
import VehiclesList from './components/ResourceList/VehiclesList'
import EquipmentList from './components/ResourceList/EquipmentList'
import BookingsList from './components/BookingsList/BookingsList'
import BookingForm from './components/BookingForm/BookingForm'

function App() {
  const [currentView, setCurrentView] = useState('people')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [authView, setAuthView] = useState('login') // 'login' or 'register'

  // Listen for auth changes on mount
  useEffect(() => {
    // Check if there's already a session
    checkInitialSession()

    // Listen for auth state changes (email confirmation, sign in, etc.)
    const unsubscribe = onAuthStateChange((event, data) => {
      console.log('Auth state changed:', event, data)
      if (event === 'SIGNED_IN') {
        if (data?.person) {
          setCurrentUser(data.person)
        } else {
          console.warn('Person data not available after sign in')
          setCurrentUser(null)
        }
        setIsLoadingUser(false)
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setAuthView('login')
        setIsLoadingUser(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Check for existing session on mount - SKIP person fetch
  async function checkInitialSession() {
    setIsLoadingUser(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        console.log('Session found on refresh')
        // Create minimal user object to keep them logged in
        // Person data will be fetched later or we'll work without it
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.email.split('@')[0], // Temp name from email
          role: 'member' // Default role
        })
        setIsLoadingUser(false)
      } else {
        // No session - show login
        setIsLoadingUser(false)
      }
    } catch (error) {
      console.error('Failed to check session:', error)
      setIsLoadingUser(false)
    }
  }

  // Handle successful login/register
  const handleAuthSuccess = async (result) => {
    console.log('Auth success')
    // Auth state change handler will set the user
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout()
      setCurrentUser(null)
      setAuthView('login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const renderView = () => {
    switch (currentView) {
      case 'people':
        return <PeopleList />
      case 'vehicles':
        return <VehiclesList />
      case 'equipment':
        return <EquipmentList />
      case 'bookings':
        return <BookingsList onEdit={(booking) => {
          setSelectedBooking(booking)
          setCurrentView('booking-form')
        }} />
      case 'booking-form':
        return <BookingForm
          booking={selectedBooking}
          onCancel={() => {
            setSelectedBooking(null)
            setCurrentView('bookings')
          }}
          onSave={() => {
            setSelectedBooking(null)
            setCurrentView('bookings')
          }}
        />
      default:
        return <PeopleList />
    }
  }

  // Show loading state while checking auth
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Show login/register if not authenticated
  if (!currentUser) {
    if (authView === 'register') {
      return (
        <Register
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setAuthView('login')}
        />
      )
    }
    return (
      <Login
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setAuthView('register')}
      />
    )
  }

  // Main app (authenticated)
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-primary-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">SchedulePro</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm">{currentUser.name} ({currentUser.role})</span>
              <button
                onClick={handleLogout}
                className="text-sm text-white hover:text-gray-200 underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 h-16">
            <button
              onClick={() => setCurrentView('people')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'people'
                  ? 'border-primary-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              People
            </button>
            <button
              onClick={() => setCurrentView('vehicles')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'vehicles'
                  ? 'border-primary-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Vehicles
            </button>
            <button
              onClick={() => setCurrentView('equipment')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'equipment'
                  ? 'border-primary-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Equipment
            </button>
            <button
              onClick={() => setCurrentView('bookings')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'bookings' || currentView === 'booking-form'
                  ? 'border-primary-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Bookings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {renderView()}
      </main>
    </div>
  )
}

export default App
