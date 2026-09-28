import { useEffect, useMemo, useState } from 'react'
import { floors, roomDataSource, rooms } from './roomData'
import { ENDING_SOON_MINUTES, filterRooms, findRoomMatches, formatClock, formatDuration, getRoomStatus, parseRoomQuery } from './roomEngine'

const CLAIM_MINUTES = 15
const CLAIMS_KEY = 'attendance-predictor-room-claims'

function readClaims() {
  try { return JSON.parse(localStorage.getItem(CLAIMS_KEY) || '{}') } catch { return {} }
}

function statusMatches(status, filter) {
  if (filter === 'all') return true
  if (filter === 'available') return status.key === 'free' || status.key === 'ending'
  if (filter === 'occupied') return status.key === 'occupied' || status.key === 'ending'
  if (filter === 'reserved') return status.key === 'claimed'
  return false
}

function RoomDetails({ room, status, now, claim, onClaim, onCall, onClose }) {
  if (!room || !status) return <aside className="room-details room-details-empty"><p className="eyebrow coral">Live room details</p><h2>Choose a room</h2><p>Click any room on the building map to see its timetable and live countdown.</p></aside>
  const countdownLabel = status.key === 'claimed' ? `Claim ends in ${formatDuration(status.countdownSeconds)}` : status.active ? `${status.active.subject} ends in ${formatDuration(status.countdownSeconds)}` : status.countdownSeconds !== null ? `Free for ${formatDuration(status.countdownSeconds)}` : 'Free now'
  const nextClass = status.next ? `${status.next.subject} · ${formatClock(status.next.startAt)}` : 'No upcoming class'
  const nextClassCountdown = status.next ? `Next class starts in ${formatDuration((status.next.startAt - now) / 1000)}` : 'No upcoming class'
  const claimed = claim && claim.until > now.getTime()

  return <aside className="room-details"><button className="details-close" aria-label="Close room details" onClick={onClose}>×</button><p className="eyebrow coral">Room details</p><div className="room-details-title"><div><h2>{room.roomNumber}</h2><p className="room-type">{room.type} · {floors.find((item) => item.id === room.floor)?.label}</p></div><span className={`live-status ${status.key}`}>{status.icon} {status.label}</span></div><div className={`live-countdown ${status.key}`}><strong>{countdownLabel}</strong><small>{status.detail}</small><small>{nextClassCountdown}</small></div><dl><dt>Capacity</dt><dd>{room.capacity || 'Shared'} people</dd><dt>Facilities</dt><dd>{room.facilities.length ? room.facilities.join(' · ') : 'Core building space'}</dd><dt>Next class</dt><dd>{nextClass}</dd></dl>{claimed && <p className="claim-note">🔵 Claimed by You · expires at {formatClock(claim.until)}</p>}<div className="room-action-stack"><button className="claim-button" type="button" onClick={() => onClaim(room)}>{claimed ? 'Release Room' : '🔒 Claim Room'}</button>{claimed ? <button className="squad-button" type="button" onClick={() => onCall(room)}>📲 Call the Squad</button> : <p className="claim-hint">Claim a free room to invite your friends.</p>}</div></aside>
}

export default function LiveRoomTracker() {
  const [now, setNow] = useState(() => new Date())
  const [floor, setFloor] = useState('ground')
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [finderQuery, setFinderQuery] = useState('')
  const [finderResults, setFinderResults] = useState(null)
  const [type, setType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [capacity, setCapacity] = useState('')
  const [facility, setFacility] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [claims, setClaims] = useState(readClaims)
  const [pendingClaim, setPendingClaim] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => { localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims)) }, [claims])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer) }, [toast])

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null
  const selectedStatus = selectedRoom ? getRoomStatus(selectedRoom, now, claims) : null
  const filteredRooms = useMemo(() => {
    const base = filterRooms({ floor: 'all', type, capacity, facilities: facility ? [facility] : [] })
    return base.filter((room) => room.floor === floor).filter((room) => statusMatches(getRoomStatus(room, now, claims), statusFilter))
  }, [floor, type, capacity, facility, statusFilter, now, claims])

  function selectRoom(room) { setSelectedRoomId(room.id); setFloor(room.floor); setPan({ x: 0, y: 0 }) }
  function claimRoom(room) {
    const current = claims[room.id]
    if (current && current.until > now.getTime()) { setClaims((value) => { const next = { ...value }; delete next[room.id]; return next }); setToast(`${room.roomNumber} released`); return }
    if (getRoomStatus(room, now, claims).key === 'free' || getRoomStatus(room, now, claims).key === 'ending') setPendingClaim(room)
  }
  function confirmClaim() {
    if (!pendingClaim) return
    setClaims((value) => ({ ...value, [pendingClaim.id]: { name: 'You', claimedAt: now.getTime(), until: now.getTime() + CLAIM_MINUTES * 60000 } }))
    setToast(`${pendingClaim.roomNumber} claimed for ${CLAIM_MINUTES} minutes`)
    setPendingClaim(null)
  }
  function callSquad(room) {
    const status = getRoomStatus(room, now, claims)
    const claim = claims[room.id]
    const timetableUntil = status.next?.startAt?.getTime()
    const until = timetableUntil && claim ? Math.min(timetableUntil, claim.until) : timetableUntil || claim?.until || now.getTime() + CLAIM_MINUTES * 60000
    const message = `📍 Heading to ${room.roomNumber}. It's free until ${formatClock(until)}. Come fast!`
    const opened = window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    if (!opened) { navigator.clipboard?.writeText(message); setToast('Invite message copied to clipboard') }
  }
  function runFinder(event) {
    event.preventDefault()
    if (!finderQuery.trim()) return
    const exactRoom = rooms.find((room) => room.roomNumber.toLowerCase() === finderQuery.trim().toLowerCase().replace(/^room\s+/, ''))
    if (exactRoom) { selectRoom(exactRoom); setFinderResults({ matches: [{ room: exactRoom, availability: { status: 'available' } }] }); return }
    const requirements = parseRoomQuery(finderQuery)
    const matches = findRoomMatches(requirements).filter(({ availability }) => availability.available)
    setFinderResults({ requirements, matches })
    if (requirements.floor !== 'all') setFloor(requirements.floor)
  }

  return <section className="workspace-page room-tracker-page"><div className="page-kicker room-page-heading"><p className="eyebrow coral">Room tracker</p><h1>Find your next study space.</h1><p>See live room availability, select a room, and bring your squad along.</p><span className="demo-badge">{roomDataSource} · live demo timetable</span></div><form className="room-finder" onSubmit={runFinder}><span>⌕</span><input aria-label="Describe the room you need" value={finderQuery} onChange={(event) => setFinderQuery(event.target.value)} placeholder="Find an AC room for 5 people for 1 hour..." /><button type="submit">Find rooms ↗</button></form><div className="room-prompts">{['Find an AC room on the ground floor.', 'Find a free classroom for 40 people.', 'Find a computer lab on the third floor.'].map((prompt) => <button type="button" key={prompt} onClick={() => setFinderQuery(prompt)}>{prompt}</button>)}</div><div className="room-layout"><aside className="room-sidebar"><div className="room-side-section"><p className="eyebrow">Floors</p>{floors.map((item) => <button type="button" className={floor === item.id ? 'floor-button active' : 'floor-button'} key={item.id} onClick={() => { setFloor(item.id); setSelectedRoomId(null) }}>{item.label}<span>↗</span></button>)}</div><div className="room-side-section"><p className="eyebrow">Filters</p><label>Room type<select aria-label="Room type filter" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option>Classroom</option><option>Computer Lab</option><option>Seminar Room</option><option>Common Area</option></select></label><label>Status<select aria-label="Room status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Any status</option><option value="available">Free / ending soon</option><option value="occupied">Occupied</option><option value="reserved">Claimed</option></select></label><label>Capacity<select aria-label="Capacity filter" value={capacity} onChange={(event) => setCapacity(event.target.value)}><option value="">Any capacity</option><option value="20">20+</option><option value="40">40+</option><option value="60">60+</option></select></label><label>Facility<select aria-label="Facility filter" value={facility} onChange={(event) => setFacility(event.target.value)}><option value="">Any facility</option><option>AC</option><option>Projector</option><option>Wi-Fi</option><option>Computer Lab</option><option>Smart Board</option></select></label></div><div className="room-legend"><p className="eyebrow">Live status</p><span>🟢 Free</span><span>🔴 Occupied</span><span>🟡 Ending soon <small>({ENDING_SOON_MINUTES} min)</small></span><span>🔵 Claimed</span></div></aside><div className="floor-area"><div className="floor-toolbar"><div><p className="eyebrow">{floors.find((item) => item.id === floor)?.label}</p><strong>Interactive building map</strong></div><div className="zoom-tools"><button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(.7, value - .1))}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.5, value + .1))}>+</button><button type="button" aria-label="Reset view" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>⟳</button></div></div><div className="floor-grid-wrap" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.dataset.x = event.clientX; event.currentTarget.dataset.y = event.clientY }} onPointerMove={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; setPan((value) => ({ x: value.x + event.clientX - Number(event.currentTarget.dataset.x), y: value.y + event.clientY - Number(event.currentTarget.dataset.y) })); event.currentTarget.dataset.x = event.clientX; event.currentTarget.dataset.y = event.clientY }} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}><div className="floor-grid" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>{filteredRooms.map((room) => { const roomStatus = getRoomStatus(room, now, claims); return <button type="button" className={`map-room ${roomStatus.key} ${selectedRoomId === room.id ? 'selected' : ''}`} key={room.id} style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.width}%`, height: `${room.height}%` }} onClick={() => selectRoom(room)} aria-label={`${room.roomNumber}, ${roomStatus.label}`}><span>{roomStatus.icon}</span><strong>{room.roomNumber}</strong><small>{room.type}</small></button> })}<div className="map-corridor corridor-a">Main corridor · click a room</div><div className="map-stairs">Stairs / lifts</div></div></div><p className="map-note">Colors are generated from each room's timetable and local demo claims. The map updates every second.</p></div><RoomDetails room={selectedRoom} status={selectedStatus} now={now} claim={selectedRoom ? claims[selectedRoom.id] : null} onClaim={claimRoom} onCall={callSquad} onClose={() => setSelectedRoomId(null)} /></div>{finderResults && <section className="finder-results"><div className="section-mini-heading"><div><p className="eyebrow coral">Room finder</p><h3>{finderResults.matches.length ? `${finderResults.matches.length} room${finderResults.matches.length === 1 ? '' : 's'} found` : 'No exact room match'}</h3></div><button className="details-close" onClick={() => setFinderResults(null)}>×</button></div>{finderResults.matches.length ? <div className="finder-list">{finderResults.matches.map(({ room }) => <article className="finder-card" key={room.id}><div><span className="room-status">{getRoomStatus(room, now, claims).icon} {getRoomStatus(room, now, claims).label}</span><h2>{room.roomNumber}</h2><p>{room.type} · {room.capacity || 'Shared'} people · {room.facilities.join(' · ')}</p></div><button type="button" onClick={() => selectRoom(room)}>View on floor plan ↗</button></article>)}</div> : <p className="empty-state">No room matches every requirement. Try another floor or facility.</p>}</section>}{pendingClaim && <div className="claim-modal-backdrop" role="presentation"><div className="claim-modal" role="dialog" aria-modal="true" aria-labelledby="claim-title"><p className="eyebrow coral">Local demo claim</p><h2 id="claim-title">Claim {pendingClaim.roomNumber}?</h2><p>Claim this free room for your group for {CLAIM_MINUTES} minutes?</p><div className="claim-modal-actions"><button type="button" className="cancel-button" onClick={() => setPendingClaim(null)}>Cancel</button><button type="button" className="claim-button" onClick={confirmClaim}>Claim Room</button></div></div></div>}{toast && <div className="room-toast">✓ {toast}</div>}</section>
}
