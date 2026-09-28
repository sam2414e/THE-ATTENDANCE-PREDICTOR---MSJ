import { rooms, roomTimetable } from './roomData'

export const ENDING_SOON_MINUTES = 5

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

function eventAtDate(date, event) {
  const [hour, minute] = event.start.split(':').map(Number)
  const [endHour, endMinute] = event.end.split(':').map(Number)
  const startAt = new Date(date)
  startAt.setHours(hour, minute, 0, 0)
  const endAt = new Date(date)
  endAt.setHours(endHour, endMinute, 0, 0)
  return { ...event, startAt, endAt }
}

function eventsForDate(room, date) {
  return (room.timetable || []).map((event) => eventAtDate(date, event)).sort((a, b) => a.startAt - b.startAt)
}

export function formatClock(value) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0))
  return `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} sec`
}

export function getRoomStatus(room, now = new Date(), claims = {}) {
  const todayEvents = eventsForDate(room, now)
  const active = todayEvents.find((event) => event.startAt <= now && event.endAt > now)
  const nextToday = todayEvents.find((event) => event.startAt > now)
  let next = nextToday
  if (!next) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    next = eventsForDate(room, tomorrow)[0]
  }

  if (active) {
    const countdownSeconds = (active.endAt - now) / 1000
    const ending = countdownSeconds <= ENDING_SOON_MINUTES * 60
    return { key: ending ? 'ending' : 'occupied', label: ending ? 'Ending soon' : 'Occupied', icon: ending ? '🟡' : '🔴', detail: `${active.subject} ends at ${formatClock(active.endAt)}`, countdownSeconds, active, next }
  }

  const claim = claims[room.id]
  if (claim && claim.until > now.getTime()) return { key: 'claimed', label: 'Claimed', icon: '🔵', detail: `Claimed by ${claim.name} until ${formatClock(claim.until)}`, countdownSeconds: (claim.until - now.getTime()) / 1000, active: null, next }

  const countdownSeconds = next ? (next.startAt - now) / 1000 : null
  const ending = countdownSeconds !== null && countdownSeconds <= ENDING_SOON_MINUTES * 60
  return { key: ending ? 'ending' : 'free', label: ending ? 'Ending soon' : 'Free', icon: ending ? '🟡' : '🟢', detail: next ? `Next class: ${next.subject}` : 'No upcoming class in the demo schedule', countdownSeconds, active: null, next }
}

export function roomAvailability(room, date, startTime, endTime) {
  const requestedStart = timeToMinutes(startTime)
  const requestedEnd = timeToMinutes(endTime)
  if (!date && requestedStart === null && requestedEnd === null) {
    const status = getRoomStatus(room)
    return { status: status.key === 'free' || status.key === 'ending' ? 'available' : status.key === 'claimed' ? 'reserved' : 'occupied', available: status.key === 'free' || status.key === 'ending', conflicts: [], reason: status.detail }
  }
  const requestedDate = date ? new Date(`${date}T00:00:00`) : new Date()
  const timetableConflicts = eventsForDate(room, requestedDate).filter((entry) => requestedStart !== null && requestedEnd !== null && timeToMinutes(entry.start) < requestedEnd && timeToMinutes(entry.end) > requestedStart)
  const conflicts = roomTimetable.filter((entry) => {
    const entryStart = timeToMinutes(entry.startTime)
    const entryEnd = timeToMinutes(entry.endTime)
    return entry.roomId === room.id && entry.date === date && requestedStart !== null && requestedEnd !== null && entryStart < requestedEnd && entryEnd > requestedStart
  })
  const allConflicts = [...timetableConflicts, ...conflicts]
  if (allConflicts.length) return { status: 'occupied', available: false, conflicts: allConflicts, reason: 'A timetable or booking conflict exists.' }
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
