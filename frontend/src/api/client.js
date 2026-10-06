const API_BASE_URL = '/api/v1';

// Initial Mock Data Fallback Seed
const MOCK_EQUIPMENT = [
  {
    id: 1,
    name: 'Epson Pro 4K Laser Projector',
    modelCode: 'EP-4K-9000',
    category: 'AUDIO_VISUAL',
    totalQuantity: 8,
    availableQuantity: 6,
    status: 'AVAILABLE',
    location: 'Media Center Room 102',
    description: 'High-brightness 6000 lumens 4K UHD laser projector for main auditorium & halls.',
    specsJson: '{"Lumens": 6000, "Resolution": "4K UHD", "Inputs": "HDMI 2.1, DisplayPort, VGA"}',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80'
  },
  {
    id: 2,
    name: 'JBL Portable PA System with Wireless Mics',
    modelCode: 'JBL-PASYS-800',
    category: 'AUDIO_VISUAL',
    totalQuantity: 12,
    availableQuantity: 10,
    status: 'AVAILABLE',
    location: 'Audio Locker 3B',
    description: 'Dual 15-inch active speakers, 1200W output, 4 wireless handheld microphones, Bluetooth connection.',
    specsJson: '{"Power": "1200 Watts", "Microphones": "4 Wireless VHF", "Coverage": "Up to 400 audience"}',
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80'
  },
  {
    id: 3,
    name: 'Sennheiser Lavalier Wireless Mic Kit',
    modelCode: 'SEN-LAV-G4',
    category: 'AUDIO_VISUAL',
    totalQuantity: 15,
    availableQuantity: 12,
    status: 'AVAILABLE',
    location: 'Audio Locker 3A',
    description: 'Clip-on wireless lavalier mic pack ideal for keynote speakers, workshop hosts, and lectures.',
    specsJson: '{"Frequency": "516-558 MHz", "Battery Life": "8 Hours", "Transmitter": "Bodypack"}',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&q=80'
  },
  {
    id: 4,
    name: 'Cisco 48-Port Gigabit Switch Hub',
    modelCode: 'CSCO-SG350-48',
    category: 'COMPUTING_NETWORKING',
    totalQuantity: 10,
    availableQuantity: 8,
    status: 'AVAILABLE',
    location: 'Network Lab B',
    description: 'Managed 48-Port high speed switch with PoE support for multi-participant hackathons.',
    specsJson: '{"Ports": 48, "Speed": "1000 Mbps", "PoE Power": "370W"}',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&q=80'
  },
  {
    id: 5,
    name: 'Heavy Duty Extension Power Hub (20-Socket)',
    modelCode: 'PWR-DIST-20',
    category: 'COMPUTING_NETWORKING',
    totalQuantity: 25,
    availableQuantity: 20,
    status: 'AVAILABLE',
    location: 'Tech Store Room A',
    description: 'Surge-protected 20-socket power strip box with individual breakers for laptop clusters.',
    specsJson: '{"Sockets": 20, "Rating": "16 Amps", "Cable Length": "15 Meters"}',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&q=80'
  },
  {
    id: 6,
    name: 'Meta Quest 3 VR Headset Bundle',
    modelCode: 'MQ3-BUNDLE-5',
    category: 'COMPUTING_NETWORKING',
    totalQuantity: 6,
    availableQuantity: 5,
    status: 'AVAILABLE',
    location: 'VR Innovation Lab',
    description: 'Virtual Reality immersive headset with controllers and link cables for tech symposiums.',
    specsJson: '{"Storage": "512GB", "Tracking": "6DoF", "Display": "4K+ Infinite Display"}',
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=500&q=80'
  },
  {
    id: 7,
    name: 'Chauvet DJ Stage LED PAR Light Rig',
    modelCode: 'CH-PAR-RGBW',
    category: 'LIGHTING_STAGE',
    totalQuantity: 16,
    availableQuantity: 14,
    status: 'AVAILABLE',
    location: 'Stage Depot 1',
    description: 'DMX controllable RGBW LED stage washes for cultural nights and awards ceremonies.',
    specsJson: '{"Channels": "DMX 8-CH", "Color": "Full RGBW Spectrum", "Mount": "Truss Clamp Included"}',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80'
  },
  {
    id: 8,
    name: 'Modular Aluminum Stage Riser (4x4 ft)',
    modelCode: 'STG-MOD-4X4',
    category: 'LIGHTING_STAGE',
    totalQuantity: 20,
    availableQuantity: 16,
    status: 'AVAILABLE',
    location: 'Stage Depot 2',
    description: 'Interlocking non-slip stage platform panels with adjustable legs.',
    specsJson: '{"Dimensions": "4ft x 4ft", "Load Capacity": "750 kg/sqm", "Surface": "Carpeted Black"}',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'
  },
  {
    id: 9,
    name: 'Wooden Speaker Podium / Lectern',
    modelCode: 'POD-WOOD-PREM',
    category: 'SEATING_FURNITURE',
    totalQuantity: 5,
    availableQuantity: 4,
    status: 'AVAILABLE',
    location: 'Furniture Annex',
    description: 'Executive mahogany wooden podium with built-in mic holder and reading light.',
    specsJson: '{"Material": "Mahogany Wood", "Features": "Built-in cable management & reading lamp"}',
    imageUrl: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=500&q=80'
  },
  {
    id: 10,
    name: 'Folding Event Banquet Chairs (Set of 50)',
    modelCode: 'CHR-FLD-50',
    category: 'SEATING_FURNITURE',
    totalQuantity: 10,
    availableQuantity: 8,
    status: 'AVAILABLE',
    location: 'Furniture Warehouse B',
    description: 'Padded comfortable folding chairs stackable in transport carts.',
    specsJson: '{"Quantity per Set": 50, "Color": "Navy Blue Padded", "Weight Rating": "150 kg"}',
    imageUrl: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=500&q=80'
  },
  {
    id: 11,
    name: 'Honda 10kVA Silent Diesel Generator',
    modelCode: 'GEN-HON-10KV',
    category: 'OUTDOOR_POWER',
    totalQuantity: 3,
    availableQuantity: 2,
    status: 'AVAILABLE',
    location: 'Facilities Yard',
    description: 'Silent emergency power supply generator for outdoor grounds and night festivals.',
    specsJson: '{"Power Output": "10.0 kVA", "Fuel": "Diesel", "Noise Level": "65 dB @ 7m"}',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80'
  },
  {
    id: 12,
    name: 'Outdoor Canopy Tent (20x20 ft)',
    modelCode: 'TNT-CAN-2020',
    category: 'OUTDOOR_POWER',
    totalQuantity: 8,
    availableQuantity: 6,
    status: 'AVAILABLE',
    location: 'Facilities Yard',
    description: 'Weatherproof pop-up canopy tent for outdoor registration counters and food stalls.',
    specsJson: '{"Size": "20ft x 20ft", "Frame": "Aluminum Heavy-duty", "Cover": "UV/Waterproof PVC"}',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&q=80'
  },
  {
    id: 13,
    name: 'Sony 4K Cinema Stage Projector (Dual Lens)',
    modelCode: 'SNY-CINEMA-4K',
    category: 'AUDIO_VISUAL',
    totalQuantity: 4,
    availableQuantity: 0,
    status: 'IN_USE',
    location: 'Media Center Vault',
    description: 'High-end dual lens auditorium projection system. Currently fully reserved for semester finals.',
    specsJson: '{"Resolution": "True 4K DCI", "Lumens": 8500, "Inputs": "HDMI 2.1, 12G-SDI"}',
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&q=80',
    alternativeIds: [1, 2]
  },
  {
    id: 14,
    name: 'Apple MacBook Pro M3 Dev Cluster (Pack of 5)',
    modelCode: 'MBP-M3-CLUST5',
    category: 'COMPUTING_NETWORKING',
    totalQuantity: 5,
    availableQuantity: 0,
    status: 'IN_USE',
    location: 'Advanced Computing Lab',
    description: 'High-performance laptop cluster for deep learning workshops. All units currently deployed.',
    specsJson: '{"Chip": "Apple M3 Pro", "RAM": "36GB Unified", "Storage": "1TB SSD"}',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    alternativeIds: [4, 5]
  },
  {
    id: 15,
    name: 'D.A.S. Line Array Concert Audio Towers',
    modelCode: 'DAS-CONCERT-PRO',
    category: 'AUDIO_VISUAL',
    totalQuantity: 2,
    availableQuantity: 0,
    status: 'MAINTENANCE',
    location: 'Central Stage Store',
    description: 'Concert-grade line array stadium sound towers. Scheduled for biannual acoustic recalibration.',
    specsJson: '{"Peak Power": "4000 Watts", "SPL": "136 dB", "Channels": "Tri-amp active"}',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80',
    alternativeIds: [2, 3]
  }
];

const MOCK_BOOKINGS = [
  {
    id: 1,
    eventTitle: 'Annual HackUni 2026 CodeFest',
    eventType: 'Hackathon',
    venue: 'Computer Lab B & Main Hall',
    expectedAudience: 180,
    startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    requesterId: 1,
    requesterName: 'Alex Rivera',
    requesterRole: 'STUDENT',
    facultySupervisorId: 3,
    facultySupervisorName: 'Dr. Marcus Vance',
    status: 'PENDING_FACULTY',
    purpose: 'National 24-hour student hackathon sponsored by tech companies.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    items: [
      { equipmentId: 1, equipmentName: 'Epson Pro 4K Laser Projector', category: 'AUDIO_VISUAL', quantityRequested: 1 },
      { equipmentId: 4, equipmentName: 'Cisco 48-Port Gigabit Switch Hub', category: 'COMPUTING_NETWORKING', quantityRequested: 2 },
      { equipmentId: 5, equipmentName: 'Heavy Duty Extension Power Hub (20-Socket)', category: 'COMPUTING_NETWORKING', quantityRequested: 5 }
    ]
  },
  {
    id: 2,
    eventTitle: 'AI & Ethics Faculty Symposium',
    eventType: 'Seminar',
    venue: 'Indoor Auditorium 1',
    expectedAudience: 120,
    startDate: new Date(Date.now() + 86400000 * 6).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 6 + 18000000).toISOString(),
    requesterId: 2,
    requesterName: 'Sophia Chen',
    requesterRole: 'CLUB_LEAD',
    facultySupervisorId: 3,
    facultySupervisorName: 'Dr. Marcus Vance',
    status: 'APPROVED',
    purpose: 'Guest lectures from visiting professors and panel discussion.',
    facultyNotes: 'Approved. Excellent initiative for student research.',
    adminNotes: 'Equipment allocated in Media Center.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [
      { equipmentId: 2, equipmentName: 'JBL Portable PA System with Wireless Mics', category: 'AUDIO_VISUAL', quantityRequested: 1 },
      { equipmentId: 9, equipmentName: 'Wooden Speaker Podium / Lectern', category: 'SEATING_FURNITURE', quantityRequested: 1 }
    ]
  }
];

const DEFAULT_DATA = {
  equipment: [
    { id: 1, name: 'Epson Pro L1070U Laser Projector', category: 'Audio_Visual', availableQuantity: 3, totalQuantity: 3, condition: 'EXCELLENT' },
    { id: 2, name: 'JBL EON612 Powered PA Speaker', category: 'Audio_Visual', availableQuantity: 6, totalQuantity: 8, condition: 'GOOD' },
    { id: 3, name: 'Shure SM58 Dynamic Microphone', category: 'Audio_Visual', availableQuantity: 12, totalQuantity: 15, condition: 'EXCELLENT' },
    { id: 4, name: 'Cisco SG350-28P Managed Switch', category: 'Computing_Networking', availableQuantity: 4, totalQuantity: 4, condition: 'EXCELLENT' },
    { id: 5, name: 'APC Smart-UPS 1500VA', category: 'Outdoor_Power', availableQuantity: 5, totalQuantity: 5, condition: 'GOOD' },
  ],
  bookings: [],
  users: [] // Start with an empty database
};

const getStorage = (key) => {
  const data = localStorage.getItem(`uniequip_${key}`);
  if (!data) {
    if (DEFAULT_DATA[key]) {
      localStorage.setItem(`uniequip_${key}`, JSON.stringify(DEFAULT_DATA[key]));
      return DEFAULT_DATA[key];
    }
    return [];
  }
  return JSON.parse(data);
};

const setStorage = (key, data) => {
  localStorage.setItem(`uniequip_${key}`, JSON.stringify(data));
};

function getStored(key, defaultVal) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

// Offline fallback used ONLY when the backend cannot be reached at all.
// When the backend responds (even with an error), its answer is authoritative
// so that H2 remains the source of truth for users.
function registerUserLocal(userData) {
  let users = getStored('ueb_users', DEFAULT_DATA.users);

  if (users.find(u => u.email === userData.email)) {
    throw new Error('Email already registered');
  }

  let accountStatus = userData.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

  const newUser = {
    ...userData,
    id: Date.now(),
    status: accountStatus,
    avatar: userData.role === 'STUDENT' ? '🎓' : userData.role === 'CLUB_LEAD' ? '🚀' : userData.role === 'FACULTY' ? '👨‍🏫' : '🛡️',
    roleLabel: userData.role === 'STUDENT' ? 'Student' : userData.role === 'CLUB_LEAD' ? 'Club Leader' : userData.role === 'FACULTY' ? 'Faculty Supervisor' : 'System Admin'
  };

  users.push(newUser);
  setStored('ueb_users', users);
  return newUser;
}

function loginLocal(email, password, role) {
  let users = getStored('ueb_users', DEFAULT_DATA.users);
  const user = users.find(u => u.email === email && u.password === password && u.role === role);

  if (!user) {
    throw new Error('Invalid email, password, or role combination.');
  }

  if (user.status !== 'APPROVED') {
    throw new Error('Your account is pending Admin approval.');
  }

  return user;
}

export const api = {
  // Equipment APIs
  async getEquipment(category = null, search = '') {
    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.append('category', category);
      if (search) queryParams.append('search', search);

      const res = await fetch(`${API_BASE_URL}/equipment?${queryParams.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    // Local Storage Fallback
    let items = getStored('ueb_equipment', MOCK_EQUIPMENT);
    if (category && category !== 'ALL') {
      items = items.filter(i => i.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)));
    }
    return items;
  },

  async createEquipment(equipment) {
    let savedItem = null;
    try {
      const res = await fetch(`${API_BASE_URL}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipment)
      });
      if (res.ok) {
        savedItem = await res.json();
      }
    } catch (e) {
      console.warn('Backend equipment save failed or not reachable, saving locally.');
    }

    let items = getStored('ueb_equipment', MOCK_EQUIPMENT);
    const newItem = savedItem || {
      ...equipment,
      id: Date.now(),
      totalQuantity: Number(equipment.totalQuantity),
      availableQuantity: equipment.availableQuantity !== undefined ? Number(equipment.availableQuantity) : Number(equipment.totalQuantity),
      status: Number(equipment.totalQuantity) > 0 ? 'AVAILABLE' : 'IN_USE'
    };
    items.unshift(newItem);
    setStored('ueb_equipment', items);
    return newItem;
  },

  // Bookings APIs
  async getBookings() {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`);
      if (res.ok) return await res.json();
    } catch (e) {}

    return getStored('ueb_bookings', MOCK_BOOKINGS);
  },

  async createBooking(bookingData) {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    let bookings = getStored('ueb_bookings', MOCK_BOOKINGS);
    const newBooking = {
      ...bookingData,
      id: Date.now(),
      status: 'PENDING_FACULTY',
      createdAt: new Date().toISOString()
    };
    bookings.unshift(newBooking);
    setStored('ueb_bookings', bookings);
    return newBooking;
  },

  async facultyEndorse(id, endorse, notes = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/faculty-endorse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endorse, notes })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    let bookings = getStored('ueb_bookings', MOCK_BOOKINGS);
    bookings = bookings.map(b => {
      if (b.id === id) {
        return {
          ...b,
          facultyNotes: notes,
          status: endorse ? 'PENDING_ADMIN' : 'REJECTED'
        };
      }
      return b;
    });
    setStored('ueb_bookings', bookings);
    return bookings.find(b => b.id === id);
  },

  async adminApprove(id, approve, notes = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/admin-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve, notes })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    let bookings = getStored('ueb_bookings', MOCK_BOOKINGS);
    bookings = bookings.map(b => {
      if (b.id === id) {
        return {
          ...b,
          adminNotes: notes,
          status: approve ? 'APPROVED' : 'REJECTED'
        };
      }
      return b;
    });
    setStored('ueb_bookings', bookings);
    return bookings.find(b => b.id === id);
  },

  async issueEquipment(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/issue`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {}

    let bookings = getStored('ueb_bookings', MOCK_BOOKINGS);
    let equipment = getStored('ueb_equipment', MOCK_EQUIPMENT);

    const booking = bookings.find(b => b.id === id);
    if (booking) {
      booking.status = 'ISSUED';
      booking.items.forEach(item => {
        const eq = equipment.find(e => e.id === item.equipmentId);
        if (eq) {
          eq.availableQuantity = Math.max(0, eq.availableQuantity - item.quantityRequested);
          if (eq.availableQuantity === 0) eq.status = 'IN_USE';
        }
      });
    }

    setStored('ueb_bookings', bookings);
    setStored('ueb_equipment', equipment);
    return booking;
  },

  async returnEquipment(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/return`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {}

    let bookings = getStored('ueb_bookings', MOCK_BOOKINGS);
    let equipment = getStored('ueb_equipment', MOCK_EQUIPMENT);

    const booking = bookings.find(b => b.id === id);
    if (booking) {
      booking.status = 'RETURNED';
      booking.items.forEach(item => {
        const eq = equipment.find(e => e.id === item.equipmentId);
        if (eq) {
          eq.availableQuantity = Math.min(eq.totalQuantity, eq.availableQuantity + item.quantityRequested);
          if (eq.availableQuantity > 0) eq.status = 'AVAILABLE';
        }
      });
    }

    setStored('ueb_bookings', bookings);
    setStored('ueb_equipment', equipment);
    return booking;
  },

  // Rule-based Recommendation Engine API
  async evaluateRecommendation(eventType, audienceCount, venueType) {
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, audienceCount, venueType })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback recommendation calculation
    const allEq = getStored('ueb_equipment', MOCK_EQUIPMENT);
    const recommendedItems = [];
    const reasoningNotes = [];

    if (eventType === 'Hackathon') {
      reasoningNotes.push(`Matched Rule: Hackathon Starter Package for ${audienceCount} participants.`);
      reasoningNotes.push('Calculated high-amperage power distribution sockets and 48-port gigabit switches.');
      
      allEq.forEach(eq => {
        if (eq.name.includes('Switch')) {
          recommendedItems.push({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category, suggestedQuantity: Math.ceil(audienceCount / 50), availableQuantity: eq.availableQuantity, reason: 'High speed local network for participant laptops' });
        } else if (eq.name.includes('Power Hub') || eq.name.includes('Extension')) {
          recommendedItems.push({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category, suggestedQuantity: Math.ceil(audienceCount / 20), availableQuantity: eq.availableQuantity, reason: '20-socket laptop charger hubs for workstation desks' });
        } else if (eq.name.includes('Projector')) {
          recommendedItems.push({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category, suggestedQuantity: 1, availableQuantity: eq.availableQuantity, reason: 'Keynote & problem statement timer display' });
        }
      });
    } else if (eventType === 'Seminar' || eventType === 'Workshop') {
      reasoningNotes.push(`Matched Rule: Academic Seminar Package for ${venueType}.`);
      allEq.forEach(eq => {
        if (eq.name.includes('Podium')) {
          recommendedItems.push({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category, suggestedQuantity: 1, availableQuantity: eq.availableQuantity, reason: 'Speaker address & lecture lectern' });
        } else if (eq.name.includes('Projector')) {
          recommendedItems.push({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category, suggestedQuantity: 1, availableQuantity: eq.availableQuantity, reason: 'Slide presentation' });
        } else if (eq.name.includes('PA System') || eq.name.includes('Lavalier')) {
          recommendedItems.push({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category, suggestedQuantity: 1, availableQuantity: eq.availableQuantity, reason: 'Clear speech audio amplification' });
        }
      });
    } else {
      reasoningNotes.push(`Matched Rule: Large Event & Cultural Extravaganza (${audienceCount} capacity).`);
      allEq.forEach(eq => {
        if (eq.name.includes('PA System')) {
          recommendedItems.push({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category, suggestedQuantity: 2, availableQuantity: eq.availableQuantity, reason: 'High wattage audio amplification' });
        } else if (eq.name.includes('LED PAR Light') || eq.name.includes('Stage Riser')) {
          recommendedItems.push({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category, suggestedQuantity: 4, availableQuantity: eq.availableQuantity, reason: 'Stage illumination and performer platform' });
        } else if (eq.name.includes('Generator')) {
          recommendedItems.push({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category, suggestedQuantity: 1, availableQuantity: eq.availableQuantity, reason: 'Backup power for high load stage lights' });
        }
      });
    }

    return {
      eventType,
      audienceCount,
      venueType,
      matchedRulesCount: reasoningNotes.length,
      reasoningNotes,
      recommendedItems
    };
  },

  // Analytics API
  async getAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const allEq = getStored('ueb_equipment', MOCK_EQUIPMENT);
    const allBookings = getStored('ueb_bookings', MOCK_BOOKINGS);

    const totalUnits = allEq.reduce((acc, i) => acc + i.totalQuantity, 0);
    const availableUnits = allEq.reduce((acc, i) => acc + i.availableQuantity, 0);
    const inUseUnits = totalUnits - availableUnits;

    return {
      totalEquipmentItems: allEq.length,
      totalEquipmentUnits: totalUnits,
      availableUnits,
      inUseUnits,
      totalBookingsCount: allBookings.length,
      pendingFacultyCount: allBookings.filter(b => b.status === 'PENDING_FACULTY').length,
      pendingAdminCount: allBookings.filter(b => b.status === 'PENDING_ADMIN').length,
      approvedCount: allBookings.filter(b => b.status === 'APPROVED').length,
      issuedCount: allBookings.filter(b => b.status === 'ISSUED').length,
      returnedCount: allBookings.filter(b => b.status === 'RETURNED').length,
      utilizationRate: Math.round((inUseUnits / totalUnits) * 100 * 10) / 10,
      categoryShare: {
        AUDIO_VISUAL: 35,
        COMPUTING_NETWORKING: 35,
        LIGHTING_STAGE: 36,
        SEATING_FURNITURE: 55,
        OUTDOOR_POWER: 11
      }
    };
  },

  // Auth & User Management APIs
  async registerUser(userData) {
    let res;
    try {
      res = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
    } catch (networkError) {
      // Backend unreachable (down / cold start): local fallback only in this case.
      return registerUserLocal(userData);
    }

    if (res.ok) {
      let user = await res.json();
      return {
        ...user,
        avatar: user.role === 'STUDENT' ? '🎓' : user.role === 'CLUB_LEAD' ? '🚀' : user.role === 'FACULTY' ? '👨‍🏫' : '🛡️',
        roleLabel: user.role === 'STUDENT' ? 'Student' : user.role === 'CLUB_LEAD' ? 'Club Leader' : user.role === 'FACULTY' ? 'Faculty Supervisor' : 'System Admin'
      };
    }

    // Backend responded with an error: surface it instead of silently
    // storing the user only in localStorage (H2 stays the source of truth).
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Registration failed');
  },

  async login(email, password, role) {
    let res;
    try {
      res = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
    } catch (networkError) {
      // Backend unreachable (down / cold start): local fallback only in this case.
      return loginLocal(email, password, role);
    }

    if (res.ok) {
      let user = await res.json();
      return {
        ...user,
        avatar: user.role === 'STUDENT' ? '🎓' : user.role === 'CLUB_LEAD' ? '🚀' : user.role === 'FACULTY' ? '👨‍🏫' : '🛡️',
        roleLabel: user.role === 'STUDENT' ? 'Student' : user.role === 'CLUB_LEAD' ? 'Club Leader' : user.role === 'FACULTY' ? 'Faculty Supervisor' : 'System Admin'
      };
    }

    // Backend rejected the credentials: surface the error instead of
    // silently falling back to a possibly stale localStorage copy.
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Invalid email, password, or role combination.');
  },

  async getPendingUsers() {
    let backendUsers = [];
    try {
      const res = await fetch(`${API_BASE_URL}/users/pending`);
      if (res.ok) {
        backendUsers = await res.json();
      }
    } catch (e) {
      console.warn('Backend fetch failed for pending users, using local only.');
    }

    // Add UI fields missing from backend
    backendUsers = backendUsers.map(u => ({
      ...u,
      avatar: u.role === 'STUDENT' ? '🎓' : u.role === 'CLUB_LEAD' ? '🚀' : u.role === 'FACULTY' ? '👨‍🏫' : '🛡️',
      roleLabel: u.role === 'STUDENT' ? 'Student' : u.role === 'CLUB_LEAD' ? 'Club Leader' : u.role === 'FACULTY' ? 'Faculty Supervisor' : 'System Admin'
    }));

    let localUsers = getStored('ueb_users', DEFAULT_DATA.users).filter(u => u.status === 'PENDING');
    
    // Merge, preferring backend users if duplicates exist by email
    const merged = [...backendUsers];
    localUsers.forEach(lu => {
      if (!merged.find(bu => bu.email === lu.email)) {
        merged.push(lu);
      }
    });

    return merged;
  },

  async approveUser(userId, approve) {
    let successBackend = false;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve })
      });
      if (res.ok) {
        successBackend = true;
      }
    } catch (e) {
      console.warn('Backend approval failed, updating local storage only.');
    }

    let users = getStored('ueb_users', DEFAULT_DATA.users);
    users = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: approve ? 'APPROVED' : 'REJECTED' };
      }
      return u;
    });
    setStored('ueb_users', users);
    
    // Return the updated user (or fetch from merged if needed, but simple return is fine)
    return { id: userId, status: approve ? 'APPROVED' : 'REJECTED' };
  },

  async getFacultySupervisors() {
    let faculty = [];
    try {
      const res = await fetch(`${API_BASE_URL}/users?role=FACULTY`);
      if (res.ok) {
        faculty = await res.json();
      }
    } catch (e) {
      // Fallback
    }

    // Merge from local storage
    const localUsers = getStored('ueb_users', DEFAULT_DATA.users)
      .filter(u => u.role === 'FACULTY' && u.status === 'APPROVED');
    
    localUsers.forEach(lu => {
      if (!faculty.find(f => f.email === lu.email)) {
        faculty.push(lu);
      }
    });

    // If still empty, provide standard Department HODs
    if (faculty.length === 0) {
      faculty = [
        { id: 101, name: 'Dr. Marcus Vance', role: 'FACULTY', department: 'Computer Science & Engineering', roleLabel: 'HOD - Computer Science' },
        { id: 102, name: 'Prof. Sarah Jenkins', role: 'FACULTY', department: 'Electronics & Communication', roleLabel: 'HOD - Electronics' },
        { id: 103, name: 'Dr. Robert Chen', role: 'FACULTY', department: 'Mechanical & Civil Engineering', roleLabel: 'HOD - Mechanical' },
        { id: 104, name: 'Prof. Elena Rostova', role: 'FACULTY', department: 'Arts, Cultural & Media Affairs', roleLabel: 'HOD - Cultural Affairs' }
      ];
    }

    return faculty;
  },

  async getAlternatives(equipmentId) {
    const allEq = await this.getEquipment();
    const target = allEq.find(e => e.id === Number(equipmentId));
    if (!target) return [];

    // Filter items in same category with available quantity > 0 and not the target
    let alternatives = allEq.filter(e => 
      e.id !== target.id && 
      e.availableQuantity > 0 && 
      e.category === target.category
    );

    // If no direct category alternatives, find any available item
    if (alternatives.length === 0) {
      alternatives = allEq.filter(e => e.id !== target.id && e.availableQuantity > 0);
    }

    return alternatives;
  },

  async getNotifications(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?userId=${userId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [];
  },

  async getUnreadNotificationCount(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/unread-count?userId=${userId}`);
      if (res.ok) {
        const body = await res.json();
        return body.count || 0;
      }
    } catch (e) {}
    return 0;
  },

  async markNotificationRead(id, userId) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read?userId=${userId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json().catch(() => ({}));
  },

  async markAllNotificationsRead(userId) {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all?userId=${userId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json().catch(() => ({}));
  }
};
