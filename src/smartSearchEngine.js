import { demoAnchor, floors, rooms } from './smartSearchData'

const facilityAliases = {
  ac: 'ac', 'air conditioning': 'ac', projector: 'projector', 'smart board': 'smartBoard', computer: 'computers', computers: 'computers', 'charging point': 'chargingPoints', 'charging points': 'chargingPoints', wifi: 'wifi', 'wi-fi': 'wifi',
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes} min ${String(remaining).padStart(2, '0')} sec`
}

export function parseSmartQuery(query) {
  const normalized = query.toLowerCase()
  const floorMatch = floors.find((floor) => normalized.includes(floor.id) || normalized.includes(floor.label.toLowerCase()) || normalized.includes(floor.shortLabel.toLowerCase()))
  const capacityMatch = normalized.match(/(?:for|capacity(?: of)?|with)\s+(?:a\s+)?(?:team\s+of\s+)?(\d+)\s*(?:people|person|students|members)?/)
  const durationMatch = normalized.match(/(\d+)\s*(?:hour|hours|hr|minute|min)/)
  const facilities = Object.entries(facilityAliases).filter(([phrase]) => normalized.includes(phrase)).map(([, value]) => value)
  const roomType = normalized.includes('computer') ? 'Computer Lab' : normalized.includes('lecture') ? 'Lecture Hall' : normalized.includes('seminar') ? 'Seminar Room' : normalized.includes('study') ? 'Study Room' : normalized.includes('library') ? 'Library' : null
  const wantsFree = /free|available|empty|quiet/.test(normalized)
  return {
    floor: floorMatch?.id || 'all',
    capacity: capacityMatch ? Number(capacityMatch[1]) : null,
    durationMinutes: durationMatch ? (normalized.includes('hour') || normalized.includes('hr') ? Number(durationMatch[1]) * 60 : Number(durationMatch[1])) : null,
    facilities: [...new Set(facilities)],
    roomType,
    wantsFree,
  }
}

function roomWindow(room, now) {
  const elapsedMinutes = (now - demoAnchor) / 60000
  return room.schedule.map((event) => ({ ...event, startAt: event.start + demoAnchor, endAt: event.start + event.duration + demoAnchor, elapsedMinutes })).sort((a, b) => a.startAt - b.startAt)
}

export function getRoomStatus(room, now, claims = {}) {
  const claim = claims[room.id]
  if (claim && claim.until > now) return { key: 'claimed', label: 'Claimed', icon: '🔵', detail: `Claimed by ${claim.name} until ${new Date(claim.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, countdownSeconds: (claim.until - now) / 1000, active: null }
  const active = roomWindow(room, now).find((event) => event.startAt <= now && event.endAt > now)
  if (active) {
    const seconds = (active.endAt - now) / 1000
    return { key: seconds <= 15 * 60 ? 'ending' : 'occupied', label: seconds <= 15 * 60 ? 'Ending soon' : 'Occupied', icon: seconds <= 15 * 60 ? '🟡' : '🔴', detail: `${active.subject} ends at ${new Date(active.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, countdownSeconds: seconds, active }
  }
  const next = roomWindow(room, now).find((event) => event.startAt > now)
  return { key: 'free', label: 'Free', icon: '🟢', detail: next ? `Next class: ${next.subject}` : 'No upcoming class in the demo schedule', countdownSeconds: next ? (next.startAt - now) / 1000 : null, next }
}

export function getFutureAvailability(room, now) {
  const events = roomWindow(room, now)
  const active = events.find((event) => event.startAt <= now && event.endAt > now)
  const next = events.find((event) => event.startAt > now)
  const periods = []
  if (active && next) periods.push({ start: active.endAt, end: next.startAt })
  else if (!active && next) periods.push({ start: now, end: next.startAt })
  else periods.push({ start: now, end: now + 60 * 60 * 1000 })
  return periods.slice(0, 2).map((period) => `${new Date(period.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${new Date(period.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`)
}

export function roomMatches(room, requirements, status) {
  const facilitiesMatch = requirements.facilities.every((facility) => facility === 'wifi' ? true : facility === 'computers' ? room.facilities.computers > 0 : Boolean(room.facilities[facility]))
  return (requirements.floor === 'all' || room.floor === requirements.floor)
    && (!requirements.capacity || room.capacity >= requirements.capacity)
    && (!requirements.roomType || room.type === requirements.roomType)
    && facilitiesMatch
    && (!requirements.wantsFree || status.key === 'free')
}

export function searchRooms(query, filters, now, claims) {
  const requirements = parseSmartQuery(query)
  const searchable = query.trim() ? rooms : rooms.filter((room) => filters.floor === 'all' || room.floor === filters.floor)
  const matches = searchable.filter((room) => {
    const status = getRoomStatus(room, now, claims)
    const textMatch = !query.trim() || `${room.roomNumber} ${room.type} ${room.floor}`.toLowerCase().includes(query.toLowerCase()) || roomMatches(room, requirements, status)
    const filterFacilities = filters.facilities.every((facility) => facility === 'computers' ? room.facilities.computers > 0 : Boolean(room.facilities[facility]))
    return textMatch && (filters.status === 'all' || status.key === filters.status) && (!filters.capacity || room.capacity >= Number(filters.capacity)) && filterFacilities
  })
  return { requirements, matches }
}

export function getFloorSummary(floorId, now, claims) {
  const floorRooms = rooms.filter((room) => room.floor === floorId)
  const free = floorRooms.filter((room) => getRoomStatus(room, now, claims).key === 'free').length
  return { free, total: floorRooms.length }
}

export function getHistoryStats() {
  const mostUsed = [...rooms].sort((a, b) => b.usage - a.usage)[0]
  return { mostUsed: mostUsed.roomNumber, mostFree: '10:00 AM – 12:00 PM', todayUsage: rooms.reduce((sum, room) => sum + Math.round(room.usage / 6), 0) }
}
