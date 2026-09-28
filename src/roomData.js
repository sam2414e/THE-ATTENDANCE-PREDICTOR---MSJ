// Ground Floor is transcribed from the supplied blueprint. The same model is
// reused on all four floors until separate floor drawings are provided.
export const roomDataSource = 'SUPPLIED BLUEPRINT MODEL + AI-GENERATED DEMO TIMETABLE'

export const floors = [
  { id: 'ground', label: 'Ground Floor' },
  { id: 'first', label: 'First Floor' },
  { id: 'second', label: 'Second Floor' },
  { id: 'third', label: 'Third Floor' },
]

const blueprintLayout = [
  ['1', 'Seminar Hall', 4, 4, 8, 15], ['2', 'Classroom', 12.5, 4, 8, 15], ['3', 'Classroom', 21, 4, 8, 15],
  ['4', 'Washroom', 29.5, 4, 8, 15], ['Stairs A', 'Stairwell', 39, 4, 7, 15], ['5', 'Washroom', 47.5, 4, 8, 15],
  ['6', 'Classroom', 56, 4, 8, 15], ['7', 'Classroom', 64.5, 4, 8, 15], ['8', 'Classroom', 73, 4, 8, 15], ['9', 'Classroom', 81.5, 4, 8, 15],
  ['10', 'Classroom', 4, 23, 10, 7], ['11', 'Classroom', 4, 30.5, 10, 7], ['12', 'Classroom', 4, 38, 10, 7],
  ['13', 'Classroom', 4, 45.5, 10, 7], ['14', 'Classroom', 4, 53, 10, 7], ['15', 'Classroom', 4, 60.5, 10, 7],
  ['Stairs B', 'Stairwell', 38, 32, 24, 7], ['Lift 1', 'Lift Lobby', 27, 43, 9, 9], ['Lift 2', 'Lift Lobby', 64, 43, 9, 9],
  ['23', 'Classroom', 69, 23, 10, 7], ['24', 'Classroom', 69, 30.5, 10, 7], ['25', 'Classroom', 69, 38, 10, 7],
  ['26', 'Classroom', 69, 45.5, 10, 7], ['27', 'Classroom', 69, 53, 10, 7], ['28', 'Classroom', 69, 60.5, 10, 7],
  ['16', 'Classroom', 4, 76, 9, 18], ['17', 'Classroom', 13.5, 76, 9, 18], ['18', 'Classroom', 23, 76, 9, 18],
  ['19', 'Classroom', 32.5, 76, 9, 18], ['20', 'Classroom', 42, 76, 9, 18], ['21', 'Classroom', 51.5, 76, 9, 18],
  ['22', 'Washroom', 61, 76, 12, 18], ['Stairs C', 'Stairwell', 74.5, 76, 8, 18], ['NCC Room', 'NCC Room', 83.5, 76, 12, 18],
]

const facilitiesByType = {
  Classroom: ['Projector', 'Wi-Fi'],
  'Seminar Hall': ['Projector', 'Smart Board', 'Wi-Fi'],
  Washroom: ['Accessible'],
  Stairwell: ['Emergency Exit'],
  'Lift Lobby': ['Lift Access'],
  'NCC Room': ['Wi-Fi'],
}

const capacityByType = {
  Classroom: 40,
  'Seminar Hall': 80,
  'NCC Room': 20,
}

export const rooms = floors.flatMap((floor) => blueprintLayout.map(([roomNumber, type, x, y, width, height], index) => ({
  id: `room-${floor.id}-${roomNumber.toLowerCase().replaceAll(' ', '-')}`,
  roomNumber,
  floor: floor.id,
  type,
  capacity: capacityByType[type] || 0,
  facilities: facilitiesByType[type] || [],
  x,
  y,
  width,
  height,
  order: index,
})))

// AI-generated demo records for interaction testing only. Replace with the
// college timetable/booking feed before showing real availability to students.
export const roomTimetable = [
  { roomId: 'room-ground-2', date: '2026-09-29', startTime: '10:00', endTime: '12:00', subject: 'Digital Systems', status: 'class' },
  { roomId: 'room-ground-7', date: '2026-09-29', startTime: '09:00', endTime: '11:00', subject: 'Reserved study session', status: 'reserved' },
  { roomId: 'room-first-12', date: '2026-09-29', startTime: '13:00', endTime: '14:00', subject: 'Signals and Systems', status: 'class' },
  { roomId: 'room-second-23', date: '2026-09-30', startTime: '10:00', endTime: '12:00', subject: 'Project review', status: 'reserved' },
  { roomId: 'room-third-1', date: '2026-10-01', startTime: '14:00', endTime: '16:00', subject: 'Department seminar', status: 'class' },
]
