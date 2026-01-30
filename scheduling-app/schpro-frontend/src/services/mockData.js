/**
 * Mock Data Service
 *
 * Provides mock data for development without backend
 * Simulates API responses with localStorage persistence
 */

// Initialize mock data in localStorage if not exists
function initMockData() {
  if (!localStorage.getItem('mock_people')) {
    localStorage.setItem('mock_people', JSON.stringify([
      {
        id: 1,
        company_id: 1,
        name: 'John Smith',
        email: 'john@demo.com',
        role: 'member',
        phone: '555-0101',
        skills: ['JavaScript', 'React'],
        is_deleted: false,
        created_at: '2026-01-01T10:00:00Z',
        updated_at: '2026-01-01T10:00:00Z',
      },
      {
        id: 2,
        company_id: 1,
        name: 'Sarah Johnson',
        email: 'sarah@demo.com',
        role: 'member',
        phone: '555-0102',
        skills: ['Project Management', 'Leadership'],
        is_deleted: false,
        created_at: '2026-01-02T10:00:00Z',
        updated_at: '2026-01-02T10:00:00Z',
      },
      {
        id: 3,
        company_id: 1,
        name: 'Mike Davis',
        email: 'mike@demo.com',
        role: 'member',
        phone: '555-0103',
        skills: ['Electrical', 'HVAC'],
        is_deleted: false,
        created_at: '2026-01-03T10:00:00Z',
        updated_at: '2026-01-03T10:00:00Z',
      },
    ]));
  }

  if (!localStorage.getItem('mock_vehicles')) {
    localStorage.setItem('mock_vehicles', JSON.stringify([
      {
        id: 1,
        company_id: 1,
        name: 'Ford F-150',
        type: 'Truck',
        make: 'Ford',
        model: 'F-150',
        year: 2024,
        license_plate: 'ABC-123',
        capacity: 3,
        is_deleted: false,
        created_at: '2026-01-01T10:00:00Z',
        updated_at: '2026-01-01T10:00:00Z',
      },
      {
        id: 2,
        company_id: 1,
        name: 'Chevy Silverado',
        type: 'Truck',
        make: 'Chevrolet',
        model: 'Silverado',
        year: 2023,
        license_plate: 'XYZ-789',
        capacity: 3,
        is_deleted: false,
        created_at: '2026-01-02T10:00:00Z',
        updated_at: '2026-01-02T10:00:00Z',
      },
      {
        id: 3,
        company_id: 1,
        name: 'Toyota Tacoma',
        type: 'Truck',
        make: 'Toyota',
        model: 'Tacoma',
        year: 2024,
        license_plate: 'DEF-456',
        capacity: 2,
        is_deleted: false,
        created_at: '2026-01-03T10:00:00Z',
        updated_at: '2026-01-03T10:00:00Z',
      },
    ]));
  }

  if (!localStorage.getItem('mock_equipment')) {
    localStorage.setItem('mock_equipment', JSON.stringify([
      {
        id: 1,
        company_id: 1,
        name: 'Generator 5000W',
        type: 'Generator',
        serial_number: 'GEN-001',
        condition: 'Good',
        is_deleted: false,
        created_at: '2026-01-01T10:00:00Z',
        updated_at: '2026-01-01T10:00:00Z',
      },
      {
        id: 2,
        company_id: 1,
        name: 'Drill Press',
        type: 'Power Tool',
        serial_number: 'DP-002',
        condition: 'Excellent',
        is_deleted: false,
        created_at: '2026-01-02T10:00:00Z',
        updated_at: '2026-01-02T10:00:00Z',
      },
      {
        id: 3,
        company_id: 1,
        name: 'Welding Machine',
        type: 'Welder',
        serial_number: 'WM-003',
        condition: 'Good',
        is_deleted: false,
        created_at: '2026-01-03T10:00:00Z',
        updated_at: '2026-01-03T10:00:00Z',
      },
    ]));
  }

  if (!localStorage.getItem('mock_bookings')) {
    localStorage.setItem('mock_bookings', JSON.stringify([
      {
        id: 1,
        company_id: 1,
        created_by: 1,
        title: 'Site Inspection - Downtown',
        location: '123 Main St',
        start_time: '2026-02-01T09:00:00Z',
        end_time: '2026-02-01T12:00:00Z',
        notes: 'Pre-construction site visit',
        is_deleted: false,
        people: [1, 2],
        vehicles: [1],
        equipment: [1],
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
      {
        id: 2,
        company_id: 1,
        created_by: 1,
        title: 'Equipment Delivery',
        location: '456 Oak Ave',
        start_time: '2026-02-02T08:00:00Z',
        end_time: '2026-02-02T10:00:00Z',
        notes: 'Deliver generator and tools',
        is_deleted: false,
        people: [3],
        vehicles: [2],
        equipment: [1, 2],
        created_at: '2026-01-16T10:00:00Z',
        updated_at: '2026-01-16T10:00:00Z',
      },
    ]));
  }

  if (!localStorage.getItem('mock_next_id')) {
    localStorage.setItem('mock_next_id', JSON.stringify({
      people: 4,
      vehicles: 4,
      equipment: 4,
      bookings: 3,
    }));
  }
}

// Get next ID for a resource type
function getNextId(type) {
  const nextIds = JSON.parse(localStorage.getItem('mock_next_id'));
  const id = nextIds[type];
  nextIds[type] = id + 1;
  localStorage.setItem('mock_next_id', JSON.stringify(nextIds));
  return id;
}

// Mock API simulator
export const mockApi = {
  // People endpoints
  getPeople: () => {
    const people = JSON.parse(localStorage.getItem('mock_people'));
    return Promise.resolve({ data: people.filter(p => !p.is_deleted) });
  },

  getPerson: (id) => {
    const people = JSON.parse(localStorage.getItem('mock_people'));
    const person = people.find(p => p.id === parseInt(id));
    return Promise.resolve({ data: person });
  },

  createPerson: (data) => {
    const people = JSON.parse(localStorage.getItem('mock_people'));
    const newPerson = {
      ...data,
      id: getNextId('people'),
      company_id: 1,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    people.push(newPerson);
    localStorage.setItem('mock_people', JSON.stringify(people));
    return Promise.resolve({ data: newPerson });
  },

  updatePerson: (id, data) => {
    const people = JSON.parse(localStorage.getItem('mock_people'));
    const index = people.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      people[index] = {
        ...people[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mock_people', JSON.stringify(people));
      return Promise.resolve({ data: people[index] });
    }
    return Promise.reject(new Error('Person not found'));
  },

  deletePerson: (id) => {
    const people = JSON.parse(localStorage.getItem('mock_people'));
    const index = people.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      people[index].is_deleted = true;
      people[index].deleted_at = new Date().toISOString();
      localStorage.setItem('mock_people', JSON.stringify(people));
      return Promise.resolve({ data: { success: true } });
    }
    return Promise.reject(new Error('Person not found'));
  },

  undeletePerson: (id) => {
    const people = JSON.parse(localStorage.getItem('mock_people'));
    const index = people.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      people[index].is_deleted = false;
      people[index].deleted_at = null;
      localStorage.setItem('mock_people', JSON.stringify(people));
      return Promise.resolve({ data: people[index] });
    }
    return Promise.reject(new Error('Person not found'));
  },

  // Vehicles endpoints
  getVehicles: () => {
    const vehicles = JSON.parse(localStorage.getItem('mock_vehicles'));
    return Promise.resolve({ data: vehicles.filter(v => !v.is_deleted) });
  },

  getVehicle: (id) => {
    const vehicles = JSON.parse(localStorage.getItem('mock_vehicles'));
    const vehicle = vehicles.find(v => v.id === parseInt(id));
    return Promise.resolve({ data: vehicle });
  },

  createVehicle: (data) => {
    const vehicles = JSON.parse(localStorage.getItem('mock_vehicles'));
    const newVehicle = {
      ...data,
      id: getNextId('vehicles'),
      company_id: 1,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vehicles.push(newVehicle);
    localStorage.setItem('mock_vehicles', JSON.stringify(vehicles));
    return Promise.resolve({ data: newVehicle });
  },

  updateVehicle: (id, data) => {
    const vehicles = JSON.parse(localStorage.getItem('mock_vehicles'));
    const index = vehicles.findIndex(v => v.id === parseInt(id));
    if (index !== -1) {
      vehicles[index] = {
        ...vehicles[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mock_vehicles', JSON.stringify(vehicles));
      return Promise.resolve({ data: vehicles[index] });
    }
    return Promise.reject(new Error('Vehicle not found'));
  },

  deleteVehicle: (id) => {
    const vehicles = JSON.parse(localStorage.getItem('mock_vehicles'));
    const index = vehicles.findIndex(v => v.id === parseInt(id));
    if (index !== -1) {
      vehicles[index].is_deleted = true;
      vehicles[index].deleted_at = new Date().toISOString();
      localStorage.setItem('mock_vehicles', JSON.stringify(vehicles));
      return Promise.resolve({ data: { success: true } });
    }
    return Promise.reject(new Error('Vehicle not found'));
  },

  undeleteVehicle: (id) => {
    const vehicles = JSON.parse(localStorage.getItem('mock_vehicles'));
    const index = vehicles.findIndex(v => v.id === parseInt(id));
    if (index !== -1) {
      vehicles[index].is_deleted = false;
      vehicles[index].deleted_at = null;
      localStorage.setItem('mock_vehicles', JSON.stringify(vehicles));
      return Promise.resolve({ data: vehicles[index] });
    }
    return Promise.reject(new Error('Vehicle not found'));
  },

  // Equipment endpoints
  getEquipment: () => {
    const equipment = JSON.parse(localStorage.getItem('mock_equipment'));
    return Promise.resolve({ data: equipment.filter(e => !e.is_deleted) });
  },

  getEquipmentItem: (id) => {
    const equipment = JSON.parse(localStorage.getItem('mock_equipment'));
    const item = equipment.find(e => e.id === parseInt(id));
    return Promise.resolve({ data: item });
  },

  createEquipment: (data) => {
    const equipment = JSON.parse(localStorage.getItem('mock_equipment'));
    const newEquipment = {
      ...data,
      id: getNextId('equipment'),
      company_id: 1,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    equipment.push(newEquipment);
    localStorage.setItem('mock_equipment', JSON.stringify(equipment));
    return Promise.resolve({ data: newEquipment });
  },

  updateEquipment: (id, data) => {
    const equipment = JSON.parse(localStorage.getItem('mock_equipment'));
    const index = equipment.findIndex(e => e.id === parseInt(id));
    if (index !== -1) {
      equipment[index] = {
        ...equipment[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mock_equipment', JSON.stringify(equipment));
      return Promise.resolve({ data: equipment[index] });
    }
    return Promise.reject(new Error('Equipment not found'));
  },

  deleteEquipment: (id) => {
    const equipment = JSON.parse(localStorage.getItem('mock_equipment'));
    const index = equipment.findIndex(e => e.id === parseInt(id));
    if (index !== -1) {
      equipment[index].is_deleted = true;
      equipment[index].deleted_at = new Date().toISOString();
      localStorage.setItem('mock_equipment', JSON.stringify(equipment));
      return Promise.resolve({ data: { success: true } });
    }
    return Promise.reject(new Error('Equipment not found'));
  },

  undeleteEquipment: (id) => {
    const equipment = JSON.parse(localStorage.getItem('mock_equipment'));
    const index = equipment.findIndex(e => e.id === parseInt(id));
    if (index !== -1) {
      equipment[index].is_deleted = false;
      equipment[index].deleted_at = null;
      localStorage.setItem('mock_equipment', JSON.stringify(equipment));
      return Promise.resolve({ data: equipment[index] });
    }
    return Promise.reject(new Error('Equipment not found'));
  },

  // Bookings endpoints
  getBookings: () => {
    const bookings = JSON.parse(localStorage.getItem('mock_bookings'));
    return Promise.resolve({ data: bookings.filter(b => !b.is_deleted) });
  },

  getBooking: (id) => {
    const bookings = JSON.parse(localStorage.getItem('mock_bookings'));
    const booking = bookings.find(b => b.id === parseInt(id));
    return Promise.resolve({ data: booking });
  },

  createBooking: (data) => {
    const bookings = JSON.parse(localStorage.getItem('mock_bookings'));
    const newBooking = {
      ...data,
      id: getNextId('bookings'),
      company_id: 1,
      created_by: 1,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    bookings.push(newBooking);
    localStorage.setItem('mock_bookings', JSON.stringify(bookings));
    return Promise.resolve({ data: newBooking });
  },

  updateBooking: (id, data) => {
    const bookings = JSON.parse(localStorage.getItem('mock_bookings'));
    const index = bookings.findIndex(b => b.id === parseInt(id));
    if (index !== -1) {
      bookings[index] = {
        ...bookings[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mock_bookings', JSON.stringify(bookings));
      return Promise.resolve({ data: bookings[index] });
    }
    return Promise.reject(new Error('Booking not found'));
  },

  deleteBooking: (id) => {
    const bookings = JSON.parse(localStorage.getItem('mock_bookings'));
    const index = bookings.findIndex(b => b.id === parseInt(id));
    if (index !== -1) {
      bookings[index].is_deleted = true;
      bookings[index].deleted_at = new Date().toISOString();
      localStorage.setItem('mock_bookings', JSON.stringify(bookings));
      return Promise.resolve({ data: { success: true } });
    }
    return Promise.reject(new Error('Booking not found'));
  },

  undeleteBooking: (id) => {
    const bookings = JSON.parse(localStorage.getItem('mock_bookings'));
    const index = bookings.findIndex(b => b.id === parseInt(id));
    if (index !== -1) {
      bookings[index].is_deleted = false;
      bookings[index].deleted_at = null;
      localStorage.setItem('mock_bookings', JSON.stringify(bookings));
      return Promise.resolve({ data: bookings[index] });
    }
    return Promise.reject(new Error('Booking not found'));
  },
};

// Initialize mock data on import
initMockData();

export default mockApi;
