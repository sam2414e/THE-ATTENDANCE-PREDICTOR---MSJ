export const DANGER_THRESHOLD = 75
export const TARGET_ATTENDANCE = 90

export function calculateCurrentAttendance(attended, conducted) {
  return conducted > 0 ? (attended / conducted) * 100 : null
}

export function calculateRequiredAttendance(threshold, attended, conducted, remaining) {
  return Math.max(0, Math.ceil((threshold / 100) * (conducted + remaining) - attended))
}

export function calculateRequiredFor75(attended, conducted, remaining) {
  return calculateRequiredAttendance(DANGER_THRESHOLD, attended, conducted, remaining)
}

export function calculateRequiredFor90(attended, conducted, remaining) {
  return calculateRequiredAttendance(TARGET_ATTENDANCE, attended, conducted, remaining)
}

export function calculateMaximumPossibleAttendance(attended, conducted, remaining) {
  return conducted > 0 ? ((attended + remaining) / (conducted + remaining)) * 100 : null
}

export function calculateMaximumMisses(attended, conducted, remaining, threshold = TARGET_ATTENDANCE) {
  if (conducted <= 0 || remaining <= 0) return 0
  const required = calculateRequiredAttendance(threshold, attended, conducted, remaining)
  return Math.max(0, remaining - required)
}

export function calculateGoalPlan(row, goal) {
  const required = calculateRequiredAttendance(goal, row.attended, row.conducted, row.remaining)
  return {
    goal,
    required,
    achievable: row.conducted > 0 && required <= row.remaining,
    canMiss: row.conducted > 0 ? Math.max(0, row.remaining - required) : 0,
    maximum: row.maximum,
  }
}

export function parseAttendanceHistory(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [date, subject, type, percentage] = line.split(',').map((item) => item.trim())
    return { date, subject, type: type || 'event', percentage: percentage ? Number(percentage) : null }
  }).filter((event) => /^\d{4}-\d{2}-\d{2}$/.test(event.date) && event.subject && ['attended', 'absence', 'leave', 'OD', 'medical', 'event'].includes(event.type))
}

export function calculateUpcomingClasses(section, subjectCode, fromDate, semesterEnd, holidays = new Set(), cancellations = new Set(), limit = 5) {
  const [year, month, day] = fromDate.split('-').map(Number)
  const [endYear, endMonth, endDay] = semesterEnd.split('-').map(Number)
  const cursor = new Date(year, month - 1, day)
  const end = new Date(endYear, endMonth - 1, endDay)
  const dayNames = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri' }
  const results = []
  for (; cursor <= end && results.length < limit; cursor.setDate(cursor.getDate() + 1)) {
    const weekday = dayNames[cursor.getDay()]
    if (!weekday) continue
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    if (holidays.has(key)) continue
    const count = (section.slots[weekday]?.split(',') || []).filter((slot) => slot === subjectCode || slot.split('/').includes(subjectCode)).length
    if (count && !cancellations.has(`${key}:${subjectCode}`)) results.push({ date: key, weekday })
  }
  return results
}

export function getScheduledPeriodsInRange(section, subjectCode, startDate, calendarDays, holidays = new Set(), cancellations = new Set(), semesterEnd) {
  const [year, month, day] = startDate.split('-').map(Number)
  const cursor = new Date(year, month - 1, day)
  const end = new Date(cursor)
  end.setDate(end.getDate() + Math.max(0, Number(calendarDays || 0) - 1))
  const semesterLimit = semesterEnd ? (() => { const [endYear, endMonth, endDay] = semesterEnd.split('-').map(Number); return new Date(endYear, endMonth - 1, endDay) })() : null
  const dayNames = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri' }
  const periods = []
  for (; cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    if (semesterLimit && cursor > semesterLimit) continue
    const weekday = dayNames[cursor.getDay()]
    if (!weekday) continue
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    if (holidays.has(key)) continue
    const slots = section.slots[weekday]?.split(',') || []
    const count = slots.filter((slot) => slot === subjectCode || slot.split('/').includes(subjectCode)).length
    if (count && !cancellations.has(`${key}:${subjectCode}`)) periods.push({ date: key, weekday, count })
  }
  return periods
}

export function simulateLeave({ rows, section, startDate, calendarDays, leaveType, appliesTo, subjectCode, excused, holidays, cancellations, semesterEnd }) {
  const affectedRows = rows.filter((row) => appliesTo === 'all' || row.code === subjectCode)
  return affectedRows.filter((row) => row.conducted > 0).map((row) => {
    const periods = getScheduledPeriodsInRange(section, row.code, startDate, calendarDays, holidays, cancellations, semesterEnd)
    const affected = periods.reduce((sum, period) => sum + period.count, 0)
    const treatedAttended = leaveType === 'OD' ? affected : 0
    const treatedAbsent = leaveType === 'Medical Leave' && !excused ? affected : 0
    const excluded = leaveType === 'Medical Leave' && excused ? affected : 0
    const projectedConducted = row.conducted + affected - excluded
    const projectedAttended = row.attended + treatedAttended
    const remainingAfter = Math.max(0, row.remaining - affected)
    const projected = calculateCurrentAttendance(projectedAttended, projectedConducted)
    const required75 = calculateRequiredFor75(projectedAttended, projectedConducted, remainingAfter)
    const required90 = calculateRequiredFor90(projectedAttended, projectedConducted, remainingAfter)
    const maximum = calculateMaximumPossibleAttendance(projectedAttended, projectedConducted, remainingAfter)
    return { ...row, affected, periods, treatedAttended, treatedAbsent, excluded, projected, required75, required90, maximum, remainingAfter, recoveryPossible: maximum !== null && maximum >= DANGER_THRESHOLD }
  })
}

export function calculateOverallAttendance(rows) {
  const conducted = rows.reduce((sum, row) => sum + row.conducted, 0)
  const attended = rows.reduce((sum, row) => sum + row.attended, 0)
  return { conducted, attended, percentage: conducted > 0 ? (attended / conducted) * 100 : null }
}

export function calculateProjectedOverallAttendance(rows) {
  const conducted = rows.reduce((sum, row) => sum + row.conducted + row.remaining, 0)
  const attended = rows.reduce((sum, row) => sum + row.attended + row.remaining, 0)
  return { conducted, attended, percentage: conducted > 0 ? (attended / conducted) * 100 : null }
}

export function determineStatus(row) {
  if (!row.conducted) return { key: 'empty', label: 'Enter data', tone: 'neutral' }
  if (row.maximum !== null && row.maximum < DANGER_THRESHOLD) return { key: 'irreversible', label: 'Irreversible detention', tone: 'red' }
  if (row.current < DANGER_THRESHOLD) return { key: 'recovery', label: 'Recovery possible', tone: 'orange' }
  if (row.current < 80 || row.targetRequired > row.remaining) return { key: 'attention', label: 'Attention required', tone: 'yellow' }
  return { key: 'safe', label: 'Safe', tone: 'green' }
}

export function calculateRemainingClasses(section, subjectCode, fromDate, semesterEnd, holidays = new Set(), cancellations = new Set()) {
  const [startYear, startMonth, startDay] = fromDate.split('-').map(Number)
  const [endYear, endMonth, endDay] = semesterEnd.split('-').map(Number)
  const start = new Date(startYear, startMonth - 1, startDay)
  const end = new Date(endYear, endMonth - 1, endDay)
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const dayIndexes = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 }
  let total = 0

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const weekday = Object.keys(dayIndexes).find((day) => dayIndexes[day] === cursor.getDay())
    if (!weekday) continue
    const key = dateKey(cursor)
    if (holidays.has(key)) continue
    const slots = section.slots[weekday]?.split(',') || []
    total += slots.filter((slot) => slot === subjectCode || slot.split('/').includes(subjectCode)).length
    if (cancellations.has(`${key}:${subjectCode}`)) total -= 1
  }
  return Math.max(0, total)
}
