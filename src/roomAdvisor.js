import { findRoomMatches, formatClock, getRoomStatus, parseRoomQuery } from './roomEngine'
import { rooms } from './roomData'

function exactRoomQuery(text) {
  const normalized = text.toLowerCase().replace(/^room\s+/, '').trim()
  return rooms.find((room) => room.roomNumber.toLowerCase() === normalized)
}

function floorLabel(floor) { return `${floor[0].toUpperCase()}${floor.slice(1)} Floor` }

export function answerRoomQuestion(text, { now = new Date(), claims = {} } = {}) {
  const normalized = text.toLowerCase()
  const exactRoom = exactRoomQuery(text)
  if (exactRoom) {
    const status = getRoomStatus(exactRoom, now, claims)
    const next = status.next ? ` Next class: ${status.next.subject} at ${formatClock(status.next.startAt)}.` : ''
    return { tone: status.key === 'free' ? 'blue' : 'orange', text: `${exactRoom.roomNumber} is ${status.label.toLowerCase()} right now. ${status.detail}.${next}` }
  }
  if (/^(hi|hello|hey|help)\b/.test(normalized)) return { tone: 'blue', text: 'Tell me what you need, for example: “Find an AC room on the ground floor for the next 2 hours.” I’ll check the live timetable and current claims.' }
  if (normalized.includes('claim') || normalized.includes('reserve')) return { tone: 'blue', text: 'Choose a green or yellow room on the map, open its details, then select Claim Room. Once claimed, you can use Call the Squad to prepare a WhatsApp invite.' }

  const requirements = parseRoomQuery(text)
  const matches = findRoomMatches(requirements, claims).filter(({ availability }) => availability.available)
  if (!matches.length) return { tone: 'orange', text: 'I couldn’t find a room that stays available for that request. Try a shorter duration, another floor, or remove a facility requirement.' }

  const duration = requirements.durationHours ? ` for the next ${requirements.durationHours} hour${requirements.durationHours === 1 ? '' : 's'}` : ''
  const preview = matches.slice(0, 5).map(({ room }) => `${room.roomNumber} (${floorLabel(room.floor)}, ${room.capacity || 'shared'} seats)`).join(' · ')
  const suffix = matches.length > 5 ? ` I found ${matches.length} total; the first five are shown here.` : ''
  return { tone: 'green', text: `I found ${matches.length} matching room${matches.length === 1 ? '' : 's'}${duration}: ${preview}.${suffix}` }
}
