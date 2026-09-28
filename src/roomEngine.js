import { rooms, roomTimetable } from './roomData'

function timeToMinutes(value) {
  if (!value) return null
  const match = String(value).toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (!match) return null
  let hour = Number(match[1])
  const minute = Number(match[2] || 0)
  if (match[3] === 'pm' && hour < 12) hour += 12
  if (match[3] === 'am' && hour === 12) hour = 0
  return hour * 60 + minute
}

function dateValue(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function roomAvailability(room, date, startTime, endTime) {
  const requestedStart = timeToMinutes(startTime)
  const requestedEnd = timeToMinutes(endTime)
  const conflicts = roomTimetable.filter((entry) => {
    const entryStart = timeToMinutes(entry.startTime)
    const entryEnd = timeToMinutes(entry.endTime)
    return entry.roomId === room.id && entry.date === date && requestedStart !== null && requestedEnd !== null && entryStart < requestedEnd && entryEnd > requestedStart
  })
  if (!roomTimetable.length) return { status: 'unknown', available: false, conflicts: [], reason: 'Availability data unavailable.' }
  if (conflicts.length) return { status: 'occupied', available: false, conflicts, reason: 'A timetable or booking conflict exists.' }
  return { status: 'available', available: true, conflicts: [], reason: 'No conflict found in the configured timetable.' }
}

export function filterRooms({ floor = 'all', type = 'all', status = 'all', capacity = '', facilities = [] } = {}) {
  return rooms.filter((room) => {
    const availability = roomAvailability(room, '', '', '')
    return (floor === 'all' || room.floor === floor)
      && (type === 'all' || room.type === type)
      && (status === 'all' || availability.status === status)
      && (!capacity || room.capacity >= Number(capacity))
      && facilities.every((facility) => room.facilities.includes(facility))
  })
}

export function parseRoomQuery(query) {
  const normalized = query.toLowerCase()
  const floor = normalized.includes('ground') ? 'ground' : normalized.includes('first') || normalized.includes('1st') ? 'first' : normalized.includes('second') || normalized.includes('2nd') ? 'second' : normalized.includes('third') || normalized.includes('3rd') ? 'third' : 'all'
  const requiredFacilities = ['ac', 'projector', 'wi-fi', 'wifi', 'computer lab', 'smart board'].filter((facility) => normalized.includes(facility)).map((facility) => facility === 'wifi' ? 'Wi-Fi' : facility === 'computer lab' ? 'Computer Lab' : facility === 'smart board' ? 'Smart Board' : facility[0].toUpperCase() + facility.slice(1))
  const peopleMatch = normalized.match(/(?:for|of)\s+(?:me\s+and\s+)?(\d+)\s*(?:people|person|students|members)?/)
  const durationMatch = normalized.match(/(\d+)\s*(?:hour|hours|hr)/)
  const rangeMatch = normalized.match(/(?:from|between)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+(?:to|and|-)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/)
  const timeMatch = normalized.match(/(?:after|at|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  const roomType = normalized.includes('computer lab') ? 'Computer Lab' : normalized.includes('lecture hall') ? 'Lecture Hall' : normalized.includes('seminar') ? 'Seminar Hall' : normalized.includes('library') ? 'Library' : normalized.includes('reading room') ? 'Reading Room' : normalized.includes('study') ? 'Study Area' : normalized.includes('washroom') || normalized.includes('toilet') ? 'Washroom' : normalized.includes('stair') ? 'Stairwell' : normalized.includes('lift') ? 'Lift Lobby' : normalized.includes('ncc') ? 'NCC Room' : normalized.includes('classroom') ? 'Classroom' : 'all'
  const startTime = rangeMatch ? rangeMatch[1] : timeMatch ? timeMatch[0].replace(/^(after|at|from)\s+/, '') : null
  const endTime = rangeMatch ? rangeMatch[2] : durationMatch && startTime ? `${(timeToMinutes(startTime) / 60 + Number(durationMatch[1])).toFixed(0)}:00` : null
  const date = normalized.includes('tomorrow') ? dateValue(1) : normalized.includes('today') ? dateValue() : null
  return { floor, roomType, requiredFacilities: [...new Set(requiredFacilities)], capacity: peopleMatch ? Number(peopleMatch[1]) : null, durationHours: durationMatch ? Number(durationMatch[1]) : null, date, startTime, endTime, requestedTime: rangeMatch ? rangeMatch[0] : timeMatch ? timeMatch[0] : null }
}

export function findRoomMatches(requirements) {
  const candidates = filterRooms({ floor: requirements.floor, type: requirements.roomType, capacity: requirements.capacity || '' , facilities: requirements.requiredFacilities })
  return candidates.map((room) => ({ room, availability: roomAvailability(room, requirements.date || '', requirements.startTime || '', requirements.endTime || '') }))
}
