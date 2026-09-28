import { useEffect, useRef, useState } from 'react'
import { AttendanceTracker } from './App.jsx'
import './AppShell.css'
import './RoomTracker.css'
import { floors, roomDataSource, rooms } from './roomData'
import { filterRooms, findRoomMatches, parseRoomQuery, roomAvailability } from './roomEngine'

const SESSION_KEY = 'attendance-predictor-session'
const ACCOUNT_KEY = 'attendance-predictor-account'
const CAPTCHA_SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }
function validPassword(password) { return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password) }
function routeFor(path) { return ['/login', '/signup', '/home', '/attendance', '/rooms', '/account'].includes(path) ? path : '/home' }

function AuthForm({ mode, onAuthenticated, onSwitch }) {
  const signup = mode === 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captcha, setCaptcha] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const demoCaptcha = !CAPTCHA_SITE_KEY
  const captchaRef = useRef(null)

  useEffect(() => {
    if (demoCaptcha || !captchaRef.current) return undefined
    const renderCaptcha = () => {
      if (window.turnstile && captchaRef.current && !captchaRef.current.dataset.rendered) {
        window.turnstile.render(captchaRef.current, { sitekey: CAPTCHA_SITE_KEY, callback: () => setCaptcha(true), 'expired-callback': () => setCaptcha(false), 'error-callback': () => setCaptcha(false) })
        captchaRef.current.dataset.rendered = 'true'
      }
    }
    if (window.turnstile) renderCaptcha()
    else { const script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; script.async = true; script.onload = renderCaptcha; document.body.appendChild(script) }
    return undefined
  }, [demoCaptcha])

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!validEmail(email)) return setError('Enter a valid email address.')
    if (!captcha) return setError(demoCaptcha ? 'Complete the local CAPTCHA demo check.' : 'Complete the CAPTCHA verification.')
    if (signup && (!name.trim() || !validPassword(password) || password !== confirm)) return setError('Use a name, an 8+ character password with a number, and matching passwords.')
    if (!signup && !password) return setError('Enter your password.')
    setBusy(true)
    const passwordHash = await hashPassword(password)
    const account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null')
    if (signup) {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ name: name.trim(), email: email.toLowerCase(), passwordHash }))
      onAuthenticated({ name: name.trim(), email: email.toLowerCase() })
    } else if (!account || account.email !== email.toLowerCase() || account.passwordHash !== passwordHash) {
      setBusy(false)
      return setError('Invalid email or password.')
    } else onAuthenticated({ name: account.name, email: account.email })
    setBusy(false)
  }

  return <main className="auth-page"><div className="auth-art"><img src="/attendance-logo.svg" alt="Attendance Predictor logo" /><p className="eyebrow coral">Student utility platform</p><h1>Make every class<br /><em>count.</em></h1><p>One calm place for attendance planning, campus rooms, and the choices between them.</p></div><section className="auth-card"><div className="auth-card-top"><img src="/attendance-logo.svg" alt="" /><span className="auth-mode">{signup ? 'New student account' : 'Campus workspace'}</span></div><p className="eyebrow">{signup ? 'Create your account' : 'Welcome back'}</p><h2>{signup ? 'Start planning smarter.' : 'Good to see you.'}</h2><p className="auth-copy">{signup ? 'Save your attendance workspace and pick up where you left off.' : 'Sign in to your student utility workspace.'}</p><form onSubmit={submit} className="auth-form">{signup && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your full name" autoComplete="name" /></label>}<label>Email ID<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" type="email" autoComplete="email" /></label><label>Password<div className="password-field"><input value={password} onChange={(event) => setPassword(event.target.value)} placeholder={signup ? 'Create a password' : 'Enter your password'} type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>{signup && <label>Confirm password<input value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Confirm your password" type="password" autoComplete="new-password" /></label>}{demoCaptcha ? <><label className="captcha-box"><input type="checkbox" checked={captcha} onChange={(event) => setCaptcha(event.target.checked)} /> <span>Local development CAPTCHA demo</span></label><small className="captcha-note">Production CAPTCHA is enabled when `VITE_CAPTCHA_SITE_KEY` is configured.</small></> : <div className="turnstile-box" ref={captchaRef} aria-label="Cloudflare Turnstile CAPTCHA" />}{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={busy} type="submit">{busy ? 'Checking...' : signup ? 'Create account' : 'Log in'} <span>↗</span></button></form><p className="auth-switch">{signup ? 'Already have an account?' : "Don't have an account?"} <button type="button" onClick={onSwitch}>{signup ? 'Log in' : 'Sign up'}</button></p></section></main>
}

function HomePage({ user, navigate }) {
  return <section className="workspace-page"><div className="page-kicker"><p className="eyebrow coral">Your campus workspace</p><h1>Good morning, {user.name.split(' ')[0]}.</h1><p>Choose a tool and keep your semester moving with less guesswork.</p></div><div className="home-grid"><article className="home-card attendance-home"><span className="card-mark">AP</span><p className="eyebrow">Attendance tracker</p><h2>Plan before it's too late.</h2><p>Model 75% recovery, 90% targets, timetable classes, leave impact, and advisor guidance.</p><button className="text-button" onClick={() => navigate('/attendance')}>Open Attendance Tracker ↗</button></article><article className="home-card room-home"><span className="card-mark room-mark">RM</span><p className="eyebrow">Room tracker</p><h2>Find a quiet place to work.</h2><p>Search the campus room space when you need a desk, lab, or a gap between classes.</p><button className="text-button" onClick={() => navigate('/rooms')}>Open Room Tracker ↗</button></article><article className="home-card quick-home"><p className="eyebrow">Quick actions</p><h2>Small moves, clearer days.</h2><div className="quick-action" onClick={() => navigate('/attendance')}><span>01</span><strong>Check attendance health</strong><b>↗</b></div><div className="quick-action" onClick={() => navigate('/rooms')}><span>02</span><strong>Browse campus rooms</strong><b>↗</b></div></article></div></section>
}

function RoomsPage() {
  function selectRoom(room) { setSelectedRoom(room.id); setFloor(room.floor) }
  const [query, setQuery] = useState('')
  const [finderQuery, setFinderQuery] = useState('')
  const [finderResults, setFinderResults] = useState(null)
  const [floor, setFloor] = useState('ground')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [capacity, setCapacity] = useState('')
  const [facility, setFacility] = useState('')
  const [dragging, setDragging] = useState(false)
  const availableRooms = filterRooms({ floor, type, status, capacity, facilities: facility ? [facility] : [] })
  const floorRooms = availableRooms.filter((room) => `${room.roomNumber} ${room.type}`.toLowerCase().includes(query.toLowerCase())).filter((room) => room.floor === floor)
  const currentRoom = selectedRoom ? rooms.find((room) => room.id === selectedRoom) : null
  const roomStatus = currentRoom ? roomAvailability(currentRoom) : null
  const statusLabel = { available: 'Available', occupied: 'Occupied', reserved: 'Reserved', unknown: 'Unknown' }

  function runFinder(event) {
    event.preventDefault()
    if (!finderQuery.trim()) return
    const exactRoom = rooms.find((room) => room.roomNumber.toLowerCase() === finderQuery.trim().toLowerCase().replace(/^room\s+/, ''))
    if (exactRoom) {
      setQuery(exactRoom.roomNumber)
      selectRoom(exactRoom)
      setFinderResults({ requirements: { exactRoom: true }, matches: [{ room: exactRoom, availability: roomAvailability(exactRoom) }] })
      return
    }
    const requirements = parseRoomQuery(finderQuery)
    const matches = findRoomMatches(requirements)
    setFinderResults({ requirements, matches })
    if (requirements.floor !== 'all') setFloor(requirements.floor)
  }


  return <section className="workspace-page room-tracker-page"><div className="page-kicker room-page-heading"><p className="eyebrow coral">Room tracker</p><h1>Find your next study space.</h1><p>Explore the campus floor plan, inspect room details, or describe what you need and let the deterministic room engine narrow it down.</p><span className="demo-badge">{roomDataSource}</span></div><form className="room-finder" onSubmit={runFinder}><span>⌕</span><input aria-label="Describe the room you need" value={finderQuery} onChange={(event) => setFinderQuery(event.target.value)} placeholder="Describe the room you need..." /><button type="submit">Find rooms ↗</button></form><div className="room-prompts">{['Find an AC room on the ground floor for 2 hours.', 'Find a free classroom for 40 people.', 'Find a computer lab tomorrow from 10 AM to 12 PM.'].map((prompt) => <button type="button" key={prompt} onClick={() => setFinderQuery(prompt)}>{prompt}</button>)}</div><div className="room-layout"><aside className="room-sidebar"><div className="room-side-section"><p className="eyebrow">Floors</p>{floors.map((item) => <button type="button" className={floor === item.id ? 'floor-button active' : 'floor-button'} key={item.id} onClick={() => setFloor(item.id)}>{item.label}<span>↗</span></button>)}</div><div className="room-side-section"><p className="eyebrow">Filters</p><label>Room type<select aria-label="Room type filter" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option>Classroom</option><option>Computer Lab</option><option>Seminar Room</option><option>Common Area</option></select></label><label>Status<select aria-label="Room status filter" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Any status</option><option value="available">Available</option><option value="occupied">Occupied</option><option value="unknown">Unknown</option></select></label><label>Capacity<select aria-label="Room capacity filter" value={capacity} onChange={(event) => setCapacity(event.target.value)}><option value="">Any capacity</option><option value="20">20+</option><option value="40">40+</option><option value="60">60+</option></select></label><label>Facility<select aria-label="Room facility filter" value={facility} onChange={(event) => setFacility(event.target.value)}><option value="">Any facility</option><option>AC</option><option>Projector</option><option>Wi-Fi</option><option>Computer Lab</option><option>Smart Board</option></select></label></div><div className="room-legend"><p className="eyebrow">Status</p><span>⚪ Unknown</span><span>🟢 Available</span><span>🔴 Occupied</span></div></aside><div className="floor-area"><div className="floor-toolbar"><div><p className="eyebrow">{floors.find((item) => item.id === floor)?.label}</p><strong>Interactive floor grid</strong></div><div className="zoom-tools"><button type="button" aria-label="Zoom out" onClick={() => setZoom(Math.max(.7, zoom - .1))}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" aria-label="Zoom in" onClick={() => setZoom(Math.min(1.5, zoom + .1))}>+</button><button type="button" aria-label="Reset view" onClick={() => setZoom(1)}>⟳</button></div></div><div className={`floor-grid-wrap ${dragging ? 'dragging' : ''}`} onMouseDown={() => setDragging(true)} onMouseUp={() => setDragging(false)} onMouseLeave={() => setDragging(false)}><div className="floor-grid" style={{ transform: `scale(${zoom})` }}>{floorRooms.map((room) => <button type="button" className={`map-room ${selectedRoom === room.id ? 'selected' : ''}`} key={room.id} style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.width}%`, height: `${room.height}%` }} onClick={() => selectRoom(room)}><span>⚪</span><strong>{room.roomNumber}</strong><small>{room.type}</small></button>)}<div className="map-corridor corridor-a">Main corridor</div><div className="map-stairs">Stairs</div></div></div><p className="map-note">Room positions are demo placeholders until the raw building blueprint is supplied. Availability data is unavailable until a room timetable or booking feed is connected.</p></div>{currentRoom && <aside className="room-details"><button className="details-close" aria-label="Close room details" onClick={() => setSelectedRoom(null)}>×</button><p className="eyebrow coral">Room details</p><h2>{currentRoom.roomNumber}</h2><p className="room-type">{currentRoom.type} · {floors.find((item) => item.id === currentRoom.floor)?.label}</p><div className="detail-status">⚪ {statusLabel[roomStatus.status]}<small>{roomStatus.reason}</small></div><dl><dt>Capacity</dt><dd>{currentRoom.capacity} people</dd><dt>Facilities</dt><dd>{currentRoom.facilities.join(' · ')}</dd><dt>Next class</dt><dd>Timetable unavailable</dd></dl></aside>}</div>{finderResults && <section className="finder-results"><div className="section-mini-heading"><div><p className="eyebrow coral">Room finder</p><h3>{finderResults.matches.length ? `${finderResults.matches.length} structural match${finderResults.matches.length === 1 ? '' : 'es'}` : 'No exact room match'}</h3></div><button className="details-close" onClick={() => setFinderResults(null)}>×</button></div>{finderResults.matches.length ? <div className="finder-list">{finderResults.matches.map(({ room, availability }) => <article className="finder-card" key={room.id}><div><span className="room-status">⚪ {statusLabel[availability.status]}</span><h2>{room.roomNumber}</h2><p>{room.type} · {room.capacity} people · {room.facilities.join(' · ')}</p></div><button type="button" onClick={() => selectRoom(room)}>View on floor plan ↗</button></article>)}</div> : <p className="empty-state">No room can be confirmed for this request. Availability data is unavailable because no room timetable or booking feed has been supplied.</p>}</section>}</section>
}

function AccountPage({ user, logout }) {
  return <section className="workspace-page account-page"><div className="page-kicker"><p className="eyebrow coral">Account</p><h1>Your student profile.</h1><p>Your login details are kept separate from attendance data.</p></div><article className="account-card"><div className="account-avatar">{user.name.slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">Signed in as</p><h2>{user.name}</h2><p>{user.email}</p></div></article><div className="account-actions"><button className="secondary-button">Account settings <span>↗</span></button><button className="danger-button" onClick={logout}>Log out <span>↗</span></button></div></section>
}

export default function AppShell() {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'))
  const [path, setPath] = useState(() => routeFor(window.location.pathname))
  const navigate = (nextPath) => { window.history.pushState({}, '', nextPath); setPath(nextPath); window.scrollTo(0, 0) }
  useEffect(() => { const onPop = () => setPath(routeFor(window.location.pathname)); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop) }, [])
  const auth = (nextUser) => { sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser)); setUser(nextUser); navigate('/home') }
  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setUser(null); navigate('/home') }
  if (!user) return <AuthForm mode={path === '/signup' ? 'signup' : 'login'} onAuthenticated={auth} onSwitch={() => navigate(path === '/signup' ? '/login' : '/signup')} />
  const labels = [['/home', 'Home'], ['/attendance', 'Attendance Tracker'], ['/rooms', 'Room Tracker']]
  return <div className="student-app"><header className="app-nav"><button className="app-brand" onClick={() => navigate('/home')}><img src="/attendance-logo.svg" alt="Attendance Predictor" /><span>Attendance Predictor</span></button><nav>{labels.map(([href, label]) => <button className={path === href ? 'active' : ''} key={href} onClick={() => navigate(href)}>{label}</button>)}</nav><button className="account-link" onClick={() => navigate('/account')}><span>{user.name.slice(0, 1).toUpperCase()}</span>{user.name.split(' ')[0]}</button></header><main>{path === '/attendance' ? <AttendanceTracker /> : path === '/rooms' ? <RoomsPage /> : path === '/account' ? <AccountPage user={user} logout={logout} /> : <HomePage user={user} navigate={navigate} />}</main><footer className="app-footer"><span>Attendance Predictor · Student utility workspace</span><span>{user.email}</span></footer></div>
}
