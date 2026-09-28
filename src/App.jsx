import { useMemo, useState } from 'react'
import './App.css'
import AttendanceAdvisor from './AttendanceAdvisor'
import { useAdvisorConversation } from './advisorConversation'
import {
  calculateCurrentAttendance,
  calculateMaximumMisses,
  calculateMaximumPossibleAttendance,
  calculateOverallAttendance,
  calculateRemainingClasses,
  calculateRequiredFor75,
  calculateRequiredFor90,
  determineStatus,
  TARGET_ATTENDANCE,
} from './attendanceEngine'

const SEMESTER_START = '2026-08-29'
const SEMESTER_END = '2026-11-29'
const DANGER_THRESHOLD = 75
const TARGET = TARGET_ATTENDANCE

const sections = {
  'IV-ECE-A': { label: 'IV ECE · Section A', slots: { Mon: 'C,,A,D,,,,,', Tue: 'C,D,B,F,,,,,', Wed: 'B,LAB,E,F,,,,,', Thu: 'F,A,E,B,,,,,', Fri: 'C,A,D,E,,,,,' }, subjects: { A: 'Behavioural Psychology', B: 'Wireless Comm & Antenna Systems', C: 'Computer Comm & Network Security', D: 'Semiconductor Memory Design', E: 'Scripting Language for EDA', F: 'Machine Learning for All', LAB: 'CCNS Lab' } },
  'IV-ECE-B': { label: 'IV ECE · Section B', slots: { Mon: 'C,A,E,F,,,,,', Tue: 'C,E,F,B,,,,,', Wed: 'C,D,A,B,,,,,', Thu: 'D,B,LAB,A,,,,,', Fri: 'E,D,F,,,,,,' }, subjects: { A: 'Behavioural Psychology', B: 'Wireless Comm & Antenna Systems', C: 'Computer Comm & Network Security', D: 'Semiconductor Memory Design', E: 'Scripting Language for EDA', F: 'Machine Learning for All', LAB: 'CCNS Lab' } },
  'III-ECE-A': { label: 'III ECE · Section A', slots: { Mon: 'E,B,B,A,,G,G,,', Tue: 'H,D,B,BP,,,G,,', Wed: 'C,A,D,F,,,,LAB,LAB', Thu: 'A,E,C,F,,,,,', Fri: 'D,A,E,C,,LAB,LAB,,' }, subjects: { A: 'Discrete Mathematics', B: 'Microprocessor, Microcontroller & Interfacing', BP: 'Microprocessor (B-Proj)', C: 'VLSI Design & Technology', D: 'System & Network on Chip', E: 'Machine Learning for All', F: 'Community Connect', G: 'Analytical & Logical Thinking Skills', H: 'Indian Art Form', LAB: 'VLSI/Microprocessor Lab' } },
  'III-ECE-B': { label: 'III ECE · Section B', slots: { Mon: 'LAB,LAB,,,,E,B,A,D', Tue: 'G,G,,,,F,B,D,C', Wed: 'G,,,,,BP,B,A,H', Thu: 'LAB,LAB,,,,A,C,E,F', Fri: ',,,,,C,A,E,D' }, subjects: { A: 'Discrete Mathematics', B: 'Microprocessor, Microcontroller & Interfacing', BP: 'Microprocessor (B-Proj)', C: 'VLSI Design & Technology', D: 'System & Network on Chip', E: 'Machine Learning for All', F: 'Community Connect', G: 'Analytical & Logical Thinking Skills', H: 'Indian Art Form', LAB: 'VLSI/Microprocessor Lab' } },
  'III-ECE-DS': { label: 'III ECE · Data Science', slots: { Mon: 'E,B,C,A,,,,,', Tue: 'C,B,D,F,,LAB,LAB,,', Wed: 'H,B,A,C,,,,G,G', Thu: 'A,D,E,F,,,,,', Fri: 'D,A,E,BP,,G,,LAB,LAB' }, subjects: { A: 'Discrete Mathematics', B: 'Microprocessor, Microcontroller & Interfacing', BP: 'Microprocessor (B-Proj)', C: 'VLSI Design & Technology', D: 'Machine Learning for All', E: 'Database Design & Management', F: 'Community Connect', G: 'Analytical & Logical Thinking Skills', H: 'Indian Art Form', LAB: 'VLSI/Microprocessor Lab' } },
  'II-BME': { label: 'II BME', slots: { Mon: 'E,C,I,I,,LAB,LAB,,', Tue: 'C,E,B,A,,H,H,,', Wed: 'B,D,A,,,H,G,,', Thu: 'A,E,B,D,,,,LAB,LAB', Fri: 'F,A,C,D,,,,G,G' }, subjects: { A: 'Transforms & Boundary Value Problems', B: 'Biomedical Signals & Systems', C: 'Electric & Electronic Circuits', D: 'Digital Logic for Medical Systems', E: 'Medical Physics', F: 'Professional Ethics', G: 'Universal Human Values-II', H: 'Verbal Reasoning', I: 'Social Engineering', LAB: 'DLMS/EEC Lab' } },
  'I-ECE-A': { label: 'I ECE · Section A', slots: { Mon: 'E,E,B,A,,CHEL,CHEL,F,CDC', Tue: 'C,B,A,D,,WS,WS,WS,WS', Wed: 'B,E,D,,,PPSL,PPSL,PCBL,PCBL', Thu: 'GER,GER,GER,A,,CDC,CDC,NSS,NSS', Fri: 'D,A,C,B,,F,GER,GER,GER' }, subjects: { E: 'Philosophy of Engineering', A: 'Advanced Calculus & Complex Analysis', B: 'Chemistry', C: 'Electronic System & PCB Design', D: 'Programming for Problem Solving', F: 'Biology', GER: 'German', WS: 'Basic Civil & Mechanical Workshop', CDC: 'General Aptitude', NSS: 'NSS', CHEL: 'Chemistry Lab', PPSL: 'PPS Lab', PCBL: 'PCB Lab' } },
  'I-ECE-B-EEE': { label: 'I ECE/EEE · Section B', slots: { Mon: 'CDC,F/G,CHEL,CHEL,,E,E,B,A', Tue: 'WS,WS,WS,WS,,C,B,A,D', Wed: 'F/G,PPSL,CDC,CDC,PPSL,,B,E,D', Thu: 'NSS,NSS,C,A,,D,GER,GER,GER', Fri: 'PCBL,PCBL,,GER,GER,GER,,B,A' }, subjects: { E: 'Philosophy of Engineering', A: 'Advanced Calculus & Complex Analysis', B: 'Chemistry', F: 'Electronic System & PCB Design', G: 'Electrical Circuits', D: 'Programming for Problem Solving', C: 'Biology', GER: 'German', WS: 'Basic Civil & Mechanical Workshop', CDC: 'General Aptitude', NSS: 'NSS', CHEL: 'Chemistry Lab', PPSL: 'PPS Lab', PCBL: 'PCB Lab' } },
  'I-ECE-DS': { label: 'I ECE · Data Science', slots: { Mon: 'F,CDC,PCBL,PCBL,,E,E,B,A', Tue: 'CHEL,CHEL,NSS,NSS,,C,B,A,D', Wed: 'CDC,CDC,A,,PPSL,PPSL,B,E,D', Thu: 'F,A,D,GER,GER,GER,,C,B', Fri: 'GER,GER,GER,,,WS,WS,WS,WS' }, subjects: { E: 'Philosophy of Engineering', A: 'Advanced Calculus & Complex Analysis', B: 'Chemistry', C: 'Electronic System & PCB Design', D: 'Programming for Problem Solving', F: 'Biology', GER: 'German', WS: 'Basic Civil & Mechanical Workshop', CDC: 'General Aptitude', NSS: 'NSS', CHEL: 'Chemistry Lab', PPSL: 'PPS Lab', PCBL: 'PCB Lab' } },
  'I-BIOTECH-B-BME': { label: 'I Biotech/BME · Section B', slots: { Mon: 'C,YOGA,YOGA,F/G,,E,E,A,B', Tue: 'CDC,CDC,C,F,,,B,A,D', Wed: 'WS,WS,WS,WS,,D,B,E,D', Thu: 'CHEL,CHEL,A,C/G,,B,JAP,JAP,JAP', Fri: 'F,CDC,A,JAP,JAP,JAP,,PPSL,PPSL' }, subjects: { E: 'Philosophy of Engineering', A: 'Advanced Calculus & Complex Analysis', B: 'Chemistry', D: 'Programming for Problem Solving', C: 'Cell Biology', F: 'Biochemistry', G: 'Human Physiology & Anatomy', JAP: 'Japanese', YOGA: 'Physical & Mental Health using Yoga', WS: 'Basic Civil & Mechanical Workshop', CDC: 'General Aptitude', CHEL: 'Chemistry Lab', PPSL: 'PPS Lab' } },
}

const localDate = (value) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day) }
const formatDate = (value) => localDate(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const todayValue = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` }

function App() {
  const today = todayValue()
  const [sectionCode, setSectionCode] = useState('IV-ECE-A')
  const [planningDate, setPlanningDate] = useState(today < SEMESTER_START ? SEMESTER_START : today > SEMESTER_END ? SEMESTER_END : today)
  const [holidaysInput, setHolidaysInput] = useState('')
  const [cancellationsInput, setCancellationsInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [advisorQuery, setAdvisorQuery] = useState('Can I still reach 75% in Behavioural Psychology?')
  const [records, setRecords] = useState(() => Object.fromEntries(Object.keys(sections['IV-ECE-A'].subjects).map((code) => [code, { conducted: '', attended: '' }])))
  const section = sections[sectionCode]
  const holidays = useMemo(() => new Set(holidaysInput.split(',').map((item) => item.trim()).filter(Boolean)), [holidaysInput])
  const cancellations = useMemo(() => new Set(cancellationsInput.split(',').map((item) => item.trim()).filter(Boolean)), [cancellationsInput])
  const rows = Object.entries(section.subjects).map(([code, name]) => {
    const record = records[code] || { conducted: '', attended: '' }
    const conducted = Number(record.conducted) || 0
    const attended = Math.min(Number(record.attended) || 0, conducted)
    const remaining = calculateRemainingClasses(section, code, planningDate, SEMESTER_END, holidays, cancellations)
    const current = calculateCurrentAttendance(attended, conducted)
    const dangerRequired = calculateRequiredFor75(attended, conducted, remaining)
    const targetRequired = calculateRequiredFor90(attended, conducted, remaining)
    const maximum = calculateMaximumPossibleAttendance(attended, conducted, remaining)
    const status = determineStatus({ conducted, current, maximum, targetRequired, remaining })
    return { code, name, conducted, attended, remaining, current, dangerRequired, targetRequired, maximum, status, misses75: calculateMaximumMisses(attended, conducted, remaining, DANGER_THRESHOLD), misses90: calculateMaximumMisses(attended, conducted, remaining) }
  })
  const overall = calculateOverallAttendance(rows)
  const dangerCount = rows.filter((row) => row.maximum !== null && row.maximum < DANGER_THRESHOLD).length
  const belowDangerCount = rows.filter((row) => row.current !== null && row.current < DANGER_THRESHOLD).length
  const enteredCount = rows.filter((row) => row.conducted > 0).length
  const totalRemaining = rows.reduce((sum, row) => sum + row.remaining, 0)
  const recoveryRows = rows.filter((row) => row.status.key === 'recovery')
  const updateRecord = (code, key, value) => setRecords((current) => ({ ...current, [code]: { ...(current[code] || {}), [key]: value } }))
  const changeSection = (value) => { setSectionCode(value); setRecords(Object.fromEntries(Object.keys(sections[value].subjects).map((code) => [code, { conducted: '', attended: '' }]))) }
  const advisorContext = { rows, section, sectionCode, today, planningDate, holidays, cancellations, leavePolicy: null }
  const { messages, typing, sendMessage } = useAdvisorConversation(() => ({ ...advisorContext, today: new Date(`${today}T12:00:00`) }))
  const advisorSubject = rows.find((row) => advisorQuery.toLowerCase().includes(row.name.toLowerCase())) || rows[0]
  const advisorAnswer = advisorSubject.conducted
    ? advisorSubject.status.key === 'irreversible'
      ? `${advisorSubject.name} cannot recover to 75%. Even perfect attendance would finish at ${advisorSubject.maximum.toFixed(1)}%, with ${advisorSubject.dangerRequired} classes required and only ${advisorSubject.remaining} available.`
      : advisorSubject.current < DANGER_THRESHOLD
        ? `${advisorSubject.name} is recoverable. Attend the next ${advisorSubject.dangerRequired} scheduled classes to finish at or above 75%. You can miss ${advisorSubject.misses75} of the remaining ${advisorSubject.remaining}.`
        : `${advisorSubject.name} is currently at ${advisorSubject.current.toFixed(1)}%. You need ${advisorSubject.targetRequired} classes for the 90% target and can miss ${advisorSubject.misses90} while maintaining it.`
    : `Enter conducted and attended counts for ${advisorSubject.name} and I will calculate the exact path from your section timetable.`
  const submitMainAdvisor = (event) => { event.preventDefault(); sendMessage(advisorQuery); setAdvisorQuery('') }
  const inlineMessages = messages.slice(1)

  return (
    <main className="app-shell">
      <header className="topbar"><div className="brand-mark"><img src="/attendance-logo.svg" alt="Attendance Predictor logo" /></div><div><p className="eyebrow">Student planning tool</p><h1>Attendance Predictor</h1></div><div className="semester-chip"><span className="live-dot" /> 2026 semester</div></header>
      <section className="intro"><div><p className="eyebrow coral">Your semester, mapped</p><h2>Know exactly where<br /><em>you stand.</em></h2><p className="intro-copy">Plan your attendance before it's too late. Every number follows your section's actual timetable.</p></div><div className="date-card"><span className="date-label">Today's date</span><strong>{formatDate(today)}</strong><span className="date-note">System date detected automatically</span></div></section>
      <section className="controls panel"><label><span>Class section</span><select value={sectionCode} onChange={(event) => changeSection(event.target.value)}>{Object.entries(sections).map(([code, item]) => <option key={code} value={code}>{item.label}</option>)}</select></label><label><span>Preferred planning date</span><input type="date" value={planningDate} min={SEMESTER_START} max={SEMESTER_END} onChange={(event) => setPlanningDate(event.target.value)} /><small>Counting classes from {formatDate(planningDate)} · semester ends {formatDate(SEMESTER_END)}</small></label><button className="settings-button" type="button" onClick={() => setShowSettings(!showSettings)}>{showSettings ? 'Close schedule settings' : 'Adjust holidays & cancellations'} <span>↗</span></button></section>
      {showSettings && <section className="schedule-settings panel"><div><p className="eyebrow">Schedule exceptions</p><h3>Make the plan match reality</h3><p>Use ISO dates separated by commas. Cancellations use <code>YYYY-MM-DD:SUBJECT_CODE</code>.</p></div><label><span>Holidays</span><input value={holidaysInput} onChange={(event) => setHolidaysInput(event.target.value)} placeholder="2026-10-02, 2026-10-20" /></label><label><span>Cancelled classes</span><input value={cancellationsInput} onChange={(event) => setCancellationsInput(event.target.value)} placeholder="2026-10-05:A, 2026-10-12:LAB" /></label></section>}

      <section className="advisor panel"><div className="advisor-heading"><div><p className="eyebrow coral">Attendance Advisor</p><h3>Ask about your semester in plain language.</h3></div><span className="advisor-pipeline">Natural language → Exact result → Explanation</span></div><form className="advisor-form" onSubmit={submitMainAdvisor}><input aria-label="Ask Attendance Advisor" value={advisorQuery} onChange={(event) => setAdvisorQuery(event.target.value)} placeholder="Can I still reach 75% in Physics?" /><span className="advisor-chip">{advisorSubject.code}</span><button className="advisor-submit" type="submit" aria-label="Ask Attendance Advisor">A</button></form>{typing ? <p className="advisor-answer advisor-loading"><span /> Attendance Advisor is checking your timetable...</p> : inlineMessages.length ? <div className="advisor-history">{inlineMessages.map((message, index) => <p className={`advisor-answer advisor-message ${message.from} ${message.tone || ''}`} key={`${message.from}-${index}`}>{message.text}</p>)}</div> : <p className="advisor-answer"><strong>{advisorSubject.name}</strong> · {advisorAnswer}</p>}</section>

      <section className="summary-cards"><article><span className="summary-label">Current overall attendance</span><strong>{overall.percentage === null ? '—' : `${overall.percentage.toFixed(1)}%`}</strong><small>{overall.conducted ? `${overall.attended} attended of ${overall.conducted} conducted` : 'Enter counts below to calculate'}</small></article><article><span className="summary-label">Total classes remaining</span><strong>{totalRemaining}</strong><small>Across {rows.length} subjects in {section.label}</small></article><article><span className="summary-label">Subjects below 75%</span><strong>{belowDangerCount || '—'}</strong><small>Current attendance, not final projection</small></article><article className={dangerCount ? 'risk-card' : ''}><span className="summary-label">Subjects at irreversible risk</span><strong>{dangerCount || '—'}</strong><small>{dangerCount ? 'Perfect attendance cannot recover them' : 'No entered subject is mathematically trapped'}</small></article></section>

      <section className="status-strip"><div><span className="status-icon">↗</span><div><strong>{enteredCount} of {rows.length}</strong><span>subjects entered</span></div></div><div><span className="status-icon mint">◷</span><div><strong>{Math.max(0, Math.ceil((localDate(SEMESTER_END) - localDate(planningDate)) / 86400000))}</strong><span>days in planning window</span></div></div><div><span className="status-icon amber">!</span><div><strong>{recoveryRows.length || '—'}</strong><span>recovery plans available</span></div></div></section>
      <section className="section-heading"><div><p className="eyebrow">Subject breakdown</p><h2>Attendance outlook</h2></div><div className="legend"><span><i className="dot green" /> Safe</span><span><i className="dot amber-dot" /> Attention</span><span><i className="dot orange-dot" /> Recovery</span><span><i className="dot red" /> Irreversible</span></div></section>
      <section className="subject-list">{rows.map((row) => <article className={`subject-row status-${row.status.tone}`} key={row.code}><div className="subject-info"><div className="subject-code">{row.code}</div><div><h3>{row.name}</h3><p>{row.remaining} scheduled {row.remaining === 1 ? 'class' : 'classes'} remaining</p><span className={`status-pill ${row.status.tone}`}>{row.status.label}</span></div></div><div className="number-fields"><label>Conducted<input type="number" min="0" value={records[row.code]?.conducted || ''} onChange={(event) => updateRecord(row.code, 'conducted', event.target.value)} placeholder="0" /></label><label>Attended<input type="number" min="0" value={records[row.code]?.attended || ''} onChange={(event) => updateRecord(row.code, 'attended', event.target.value)} placeholder="0" /></label></div><div className={`current-percent ${row.current !== null && row.current < DANGER_THRESHOLD ? 'bad' : row.current !== null && row.current < TARGET ? 'watch' : ''}`}><span>Current</span><strong>{row.current === null ? '—' : `${row.current.toFixed(1)}%`}</strong></div><div className="outlook"><div><span>Need for 75%</span><strong className={row.dangerRequired > row.remaining ? 'danger-text' : ''}>{row.conducted ? (row.dangerRequired > row.remaining ? 'Impossible' : row.dangerRequired === 0 ? 'Already safe' : `${row.dangerRequired} classes`) : '—'}</strong></div><div><span>Need for 90%</span><strong className={row.targetRequired > row.remaining ? 'muted-text' : ''}>{row.conducted ? (row.targetRequired > row.remaining ? 'Unreachable' : row.targetRequired === 0 ? 'Maintaining' : `${row.targetRequired} classes`) : '—'}</strong></div></div><div className="max-finish"><span>Max finish</span><strong>{row.maximum === null ? '—' : `${row.maximum.toFixed(1)}%`}</strong></div><div className="progress-panel"><div className="progress-scale"><span>0%</span><span>75% danger</span><span>90% target</span><span>100%</span></div><div className="progress-track"><i className="progress-fill" style={{ width: `${Math.min(100, row.current || 0)}%` }} /><b className="danger-marker" /><b className="target-marker" /></div>{row.conducted > 0 && <p>{row.status.key === 'irreversible' ? `Even perfect attendance stops at ${row.maximum.toFixed(1)}%.` : row.current < DANGER_THRESHOLD ? `Recovery plan: attend ${row.dangerRequired} of the next ${row.remaining} classes. You can miss ${row.misses75}.` : `90% planner: ${row.targetRequired > row.remaining ? 'not achievable' : `attend ${row.targetRequired} classes; you can miss ${row.misses90}.`}`}</p>}</div></article>)}</section>

      {dangerCount > 0 && <section className="detention-alert"><div className="alert-icon">!</div><div><p className="eyebrow">Irreversible detention</p><h3>{dangerCount} subject{dangerCount === 1 ? '' : 's'} cannot reach 75%</h3><p>Even with perfect attendance in every remaining scheduled class, the maximum possible final attendance is below the mandatory threshold. This warning is based on the final projection, not current attendance alone.</p><div className="alert-subjects">{rows.filter((row) => row.status.key === 'irreversible').map((row) => <span key={row.code}><strong>{row.name}</strong> · {row.current.toFixed(1)}% now → {row.maximum.toFixed(1)}% max · {row.dangerRequired} required / {row.remaining} available</span>)}</div></div></section>}
      {recoveryRows.length > 0 && <section className="planner-grid"><article className="recovery-card"><p className="eyebrow">Recovery planner</p><h3>Bring a recoverable subject back above 75%.</h3>{recoveryRows.slice(0, 3).map((row) => <div className="planner-item" key={row.code}><strong>{row.name}</strong><span>Current {row.current.toFixed(1)}% · attend next {row.dangerRequired} classes · {row.misses75} safe miss{row.misses75 === 1 ? '' : 'es'}</span></div>)}</article><article className="target-planner"><p className="eyebrow">90% target planner</p><h3>Keep the target ambitious and exact.</h3>{rows.filter((row) => row.conducted).slice(0, 3).map((row) => <div className="planner-item" key={row.code}><strong>{row.name}</strong><span>{row.targetRequired > row.remaining ? `Not achievable: ${row.targetRequired} required / ${row.remaining} available` : `${row.targetRequired} required · ${row.misses90} classes can be missed`}</span></div>)}</article></section>}
      <footer><span>Semester window · {formatDate(SEMESTER_START)} — {formatDate(SEMESTER_END)}</span><span><i className="dot green" /> Timetable-aware calculations</span></footer>
      <AttendanceAdvisor messages={messages} typing={typing} sendMessage={sendMessage} />
    </main>
  )
}

export default App
