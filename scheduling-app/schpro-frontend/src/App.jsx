import { useState } from 'react'
import authService from './services/auth'
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
  const [showRegister, setShowRegister] = useState(false)

  const isAuthenticated = authService.isAuthenticated()
  const currentUser = authService.getCurrentUser()

  const handleLogout = async () => {
    await authService.logout()
    window.location.reload()
  }

  // Show Login or Register if not authenticated
  if (!isAuthenticated) {
    if (showRegister) {
      return <Register onSwitchToLogin={() => setShowRegister(false)} />
    }
    return <Login onSwitchToRegister={() => setShowRegister(true)} />
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-primary-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">SchedulePro</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm">{currentUser?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm bg-primary-700 hover:bg-primary-800 px-3 py-1 rounded"
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
