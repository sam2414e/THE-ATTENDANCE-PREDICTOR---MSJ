const now = Date.now()

export const floors = [
  { id: 'ground', label: 'Ground Floor', shortLabel: 'Ground' },
  { id: 'first', label: 'First Floor', shortLabel: '1st Floor' },
  { id: 'second', label: 'Second Floor', shortLabel: '2nd Floor' },
  { id: 'third', label: 'Third Floor', shortLabel: '3rd Floor' },
]

const standard = { ac: true, projector: true, smartBoard: false, computers: 0, chargingPoints: 8 }

// Local prototype data. Timetable offsets are relative to the first app load so
// the demo remains alive without a backend or a real-time room feed.
export const rooms = [
  { id: 'IST-101', roomNumber: 'IST 101', floor: 'ground', type: 'Classroom', capacity: 40, facilities: { ...standard }, x: 4, y: 5, width: 16, height: 17, distance: 1, usage: 18, schedule: [{ start: 90, duration: 60, subject: 'Data Structures' }] },
  { id: 'IST-102', roomNumber: 'IST 102', floor: 'ground', type: 'Classroom', capacity: 35, facilities: { ...standard, projector: false, chargingPoints: 12 }, x: 22, y: 5, width: 16, height: 17, distance: 2, usage: 24, schedule: [{ start: -35, duration: 45, subject: 'Digital Logic' }] },
  { id: 'IST-103', roomNumber: 'IST 103', floor: 'ground', type: 'Computer Lab', capacity: 30, facilities: { ac: true, projector: true, smartBoard: false, computers: 30, chargingPoints: 14 }, x: 40, y: 5, width: 21, height: 17, distance: 3, usage: 31, schedule: [{ start: -20, duration: 70, subject: 'Computer Networks' }] },
  { id: 'IST-104', roomNumber: 'IST 104', floor: 'ground', type: 'Seminar Room', capacity: 55, facilities: { ac: true, projector: true, smartBoard: true, computers: 0, chargingPoints: 18 }, x: 63, y: 5, width: 30, height: 17, distance: 4, usage: 15, schedule: [{ start: 150, duration: 60, subject: 'Faculty Seminar' }] },
  { id: 'IST-201', roomNumber: 'IST 201', floor: 'first', type: 'Classroom', capacity: 45, facilities: { ...standard, smartBoard: true, chargingPoints: 10 }, x: 4, y: 5, width: 19, height: 17, distance: 5, usage: 22, schedule: [{ start: 25, duration: 60, subject: 'Signals and Systems' }] },
  { id: 'IST-202', roomNumber: 'IST 202', floor: 'first', type: 'Classroom', capacity: 28, facilities: { ac: false, projector: true, smartBoard: false, computers: 0, chargingPoints: 6 }, x: 25, y: 5, width: 19, height: 17, distance: 6, usage: 17, schedule: [] },
  { id: 'IST-203', roomNumber: 'IST 203', floor: 'first', type: 'Computer Lab', capacity: 42, facilities: { ac: true, projector: true, smartBoard: true, computers: 42, chargingPoints: 22 }, x: 46, y: 5, width: 23, height: 17, distance: 7, usage: 36, schedule: [{ start: -10, duration: 25, subject: 'Machine Learning Lab' }] },
  { id: 'IST-204', roomNumber: 'IST 204', floor: 'first', type: 'Classroom', capacity: 60, facilities: { ...standard, smartBoard: true, chargingPoints: 20 }, x: 71, y: 5, width: 22, height: 17, distance: 8, usage: 27, schedule: [{ start: 210, duration: 50, subject: 'Open Elective' }] },
  { id: 'IST-301', roomNumber: 'IST 301', floor: 'second', type: 'Lecture Hall', capacity: 90, facilities: { ...standard, smartBoard: true, chargingPoints: 30 }, x: 4, y: 5, width: 28, height: 20, distance: 9, usage: 42, schedule: [{ start: -8, duration: 20, subject: 'Engineering Mathematics' }] },
  { id: 'IST-302', roomNumber: 'IST 302', floor: 'second', type: 'Classroom', capacity: 50, facilities: { ...standard, chargingPoints: 16 }, x: 34, y: 5, width: 20, height: 20, distance: 10, usage: 19, schedule: [] },
  { id: 'IST-303', roomNumber: 'IST 303', floor: 'second', type: 'Seminar Room', capacity: 24, facilities: { ac: true, projector: true, smartBoard: true, computers: 0, chargingPoints: 12 }, x: 56, y: 5, width: 18, height: 20, distance: 11, usage: 14, schedule: [{ start: 45, duration: 40, subject: 'Project Review' }] },
  { id: 'IST-304', roomNumber: 'IST 304', floor: 'second', type: 'Classroom', capacity: 32, facilities: { ac: true, projector: false, smartBoard: false, computers: 0, chargingPoints: 9 }, x: 76, y: 5, width: 17, height: 20, distance: 12, usage: 21, schedule: [{ start: -60, duration: 75, subject: 'Microprocessors' }] },
  { id: 'IST-401', roomNumber: 'IST 401', floor: 'third', type: 'Library', capacity: 110, facilities: { ac: true, projector: false, smartBoard: false, computers: 12, chargingPoints: 40 }, x: 4, y: 5, width: 34, height: 23, distance: 13, usage: 49, schedule: [] },
  { id: 'IST-402', roomNumber: 'IST 402', floor: 'third', type: 'Study Room', capacity: 12, facilities: { ac: true, projector: true, smartBoard: false, computers: 0, chargingPoints: 12 }, x: 40, y: 5, width: 18, height: 23, distance: 14, usage: 12, schedule: [{ start: 120, duration: 60, subject: 'Reserved group study' }] },
  { id: 'IST-403', roomNumber: 'IST 403', floor: 'third', type: 'Computer Lab', capacity: 36, facilities: { ac: true, projector: true, smartBoard: false, computers: 36, chargingPoints: 18 }, x: 60, y: 5, width: 16, height: 23, distance: 15, usage: 29, schedule: [{ start: -30, duration: 55, subject: 'Database Lab' }] },
  { id: 'IST-404', roomNumber: 'IST 404', floor: 'third', type: 'Common Area', capacity: 70, facilities: { ac: true, projector: false, smartBoard: false, computers: 0, chargingPoints: 28 }, x: 78, y: 5, width: 15, height: 23, distance: 16, usage: 33, schedule: [] },
]

export const demoAnchor = now
