// Replace this clearly marked demo dataset with the college blueprint/database records.
export const roomDataSource = 'GROUND FLOOR BLUEPRINT + AI-GENERATED DEMO DATA FOR FLOORS 1-3'

export const floors = [
  { id: 'ground', label: 'Ground Floor' },
  { id: 'first', label: 'First Floor' },
  { id: 'second', label: 'Second Floor' },
  { id: 'third', label: 'Third Floor' },
]

// Coordinates follow the hand-drawn plan: numbered rooms around the perimeter,
// washrooms and stairs along the edges, and lifts/stairs in the central court.
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

// These additional floor layouts are generated demo data until the remaining
// building blueprints are supplied. Each floor intentionally has a different
// arrangement and mix of learning spaces.
const generatedFloorLayouts = {
  first: [
    ['101', 'Lecture Hall', 4, 4, 18, 15], ['102', 'Classroom', 23, 4, 8, 15], ['103', 'Classroom', 31.5, 4, 8, 15], ['104', 'Computer Lab', 40, 4, 14, 15], ['105', 'Washroom', 55.5, 4, 8, 15], ['106', 'Classroom', 64, 4, 8, 15], ['107', 'Classroom', 72.5, 4, 8, 15], ['108', 'Seminar Room', 81, 4, 14, 15],
    ['109', 'Classroom', 4, 24, 10, 11], ['110', 'Classroom', 4, 36, 10, 11], ['111', 'Classroom', 4, 48, 10, 11], ['112', 'Classroom', 4, 60, 10, 11], ['Stairs A', 'Stairwell', 18, 33, 10, 12], ['Lift 1', 'Lift Lobby', 31, 34, 9, 9], ['Lift 2', 'Lift Lobby', 64, 34, 9, 9],
    ['113', 'Computer Lab', 77, 25, 16, 11], ['114', 'Seminar Room', 77, 37, 16, 11], ['115', 'Classroom', 77, 49, 16, 11], ['116', 'Classroom', 77, 61, 16, 11],
    ['117', 'Classroom', 4, 78, 14, 16], ['118', 'Classroom', 19.5, 78, 14, 16], ['119', 'Common Area', 35, 78, 20, 16], ['120', 'Washroom', 56.5, 78, 10, 16], ['Stairs B', 'Stairwell', 68, 78, 10, 16], ['Student Lounge', 'Common Area', 79.5, 78, 15, 16],
  ],
  second: [
    ['201', 'Seminar Hall', 4, 4, 22, 18], ['202', 'Classroom', 27.5, 4, 9, 18], ['203', 'Classroom', 37, 4, 9, 18], ['204', 'Washroom', 46.5, 4, 9, 18], ['205', 'Classroom', 56, 4, 9, 18], ['206', 'Classroom', 65.5, 4, 9, 18], ['207', 'Classroom', 75, 4, 20, 18],
    ['208', 'Computer Lab', 4, 28, 16, 15], ['209', 'Computer Lab', 22, 28, 16, 15], ['Stairs A', 'Stairwell', 40, 29, 16, 8], ['Lift 1', 'Lift Lobby', 42, 39, 8, 9], ['Lift 2', 'Lift Lobby', 54, 39, 8, 9],
    ['210', 'Seminar Room', 64, 28, 14, 15], ['211', 'Seminar Room', 80, 28, 15, 15], ['212', 'Classroom', 64, 47, 14, 11], ['213', 'Classroom', 80, 47, 15, 11],
    ['214', 'Classroom', 4, 78, 10, 16], ['215', 'Classroom', 15, 78, 10, 16], ['216', 'Classroom', 26, 78, 10, 16], ['217', 'Classroom', 37, 78, 10, 16], ['218', 'Classroom', 48, 78, 10, 16], ['219', 'Washroom', 59, 78, 12, 16], ['Stairs B', 'Stairwell', 72, 78, 10, 16], ['220', 'Common Area', 83, 78, 12, 16],
  ],
  third: [
    ['301', 'Library', 4, 4, 28, 19], ['302', 'Reading Room', 33.5, 4, 14, 19], ['303', 'Washroom', 49, 4, 9, 19], ['304', 'Classroom', 58.5, 4, 10, 19], ['305', 'Classroom', 69, 4, 10, 19], ['306', 'Seminar Room', 79.5, 4, 15.5, 19],
    ['307', 'Study Area', 4, 29, 18, 16], ['308', 'Study Area', 24, 29, 18, 16], ['Stairs A', 'Stairwell', 44, 30, 15, 8], ['Lift 1', 'Lift Lobby', 46, 40, 8, 9], ['Lift 2', 'Lift Lobby', 58, 40, 8, 9], ['309', 'Faculty Room', 70, 29, 11, 16], ['310', 'Faculty Room', 82, 29, 12, 16],
    ['311', 'Classroom', 4, 49, 13, 12], ['312', 'Classroom', 18, 49, 13, 12], ['313', 'Computer Lab', 32, 49, 18, 12], ['314', 'Seminar Room', 70, 49, 12, 12], ['315', 'Seminar Room', 83, 49, 11, 12],
    ['316', 'Common Area', 4, 78, 20, 16], ['317', 'Classroom', 25, 78, 12, 16], ['318', 'Classroom', 38, 78, 12, 16], ['319', 'Washroom', 51, 78, 12, 16], ['Stairs B', 'Stairwell', 64, 78, 10, 16], ['320', 'NCC Room', 75, 78, 19, 16],
  ],
}

const facilitiesByType = {
  Classroom: ['AC', 'Projector', 'Wi-Fi'],
  'Seminar Hall': ['AC', 'Projector', 'Smart Board', 'Wi-Fi'],
  Washroom: ['Accessible'],
  Stairwell: ['Emergency Exit'],
  'Lift Lobby': ['Lift Access'],
  'NCC Room': ['Wi-Fi'],
  'Lecture Hall': ['AC', 'Projector', 'Smart Board', 'Wi-Fi'],
  'Seminar Room': ['AC', 'Projector', 'Wi-Fi'],
  'Library': ['Wi-Fi', 'Study Desks'],
  'Reading Room': ['Wi-Fi', 'Study Desks'],
  'Study Area': ['Wi-Fi', 'Study Desks'],
  'Faculty Room': ['Wi-Fi'],
  'Common Area': ['Wi-Fi', 'Seating'],
}

const layoutForFloor = (floor) => floor.id === 'ground' ? blueprintLayout : generatedFloorLayouts[floor.id]

const timetableTemplates = [
  [{ start: '08:30', end: '09:30', subject: 'Digital Systems' }, { start: '13:30', end: '14:30', subject: 'Computer Networks' }, { start: '17:00', end: '18:00', subject: 'Project Studio' }],
  [{ start: '09:00', end: '10:00', subject: 'Database Systems' }, { start: '14:30', end: '15:30', subject: 'Signals & Systems' }, { start: '18:00', end: '19:00', subject: 'Study Group' }],
  [{ start: '10:00', end: '11:00', subject: 'Machine Learning' }, { start: '15:30', end: '16:30', subject: 'Embedded Systems' }, { start: '19:00', end: '20:00', subject: 'Department Seminar' }],
  [{ start: '11:30', end: '12:30', subject: 'Wireless Communication' }, { start: '16:30', end: '17:30', subject: 'Open Lab' }, { start: '20:00', end: '21:00', subject: 'Revision Hour' }],
]

const timetableFor = (type, index) => ['Washroom', 'Stairwell', 'Lift Lobby'].includes(type) ? [] : timetableTemplates[index % timetableTemplates.length]

export const rooms = floors.flatMap((floor) => layoutForFloor(floor).map(([roomNumber, type, x, y, width, height], index) => ({
  id: `room-${floor.id}-${roomNumber.toLowerCase().replaceAll(' ', '-')}`,
  roomNumber,
  floor: floor.id,
  type,
  capacity: type === 'Classroom' ? 40 : type === 'Seminar Hall' || type === 'Lecture Hall' ? 80 : type === 'Computer Lab' ? 36 : type === 'NCC Room' ? 20 : type === 'Common Area' ? 60 : type === 'Library' ? 100 : type === 'Reading Room' ? 30 : type === 'Study Area' ? 24 : 0,
  facilities: facilitiesByType[type] || [],
  x,
  y,
  width,
  height,
  order: index,
  timetable: timetableFor(type, index),
})))

export const roomTimetable = []
