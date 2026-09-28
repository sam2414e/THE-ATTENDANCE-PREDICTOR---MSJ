const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatPercent(value) {
  return value === null || value === undefined ? 'not available' : `${value.toFixed(1)}%`
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function findSubject(query, rows) {
  const normalized = query.toLowerCase()
  return rows.find((row) => normalized.includes(row.name.toLowerCase()))
    || rows.find((row) => normalized.includes(row.code.toLowerCase()))
    || rows.find((row) => row.name.toLowerCase().split(/\s+/).some((word) => word.length > 4 && normalized.includes(word)))
}

function nextWeekday(fromDate, dayName) {
  const target = DAY_NAMES.indexOf(dayName)
  const result = new Date(fromDate)
  const distance = (target - result.getDay() + 7) % 7 || 7
  result.setDate(result.getDate() + distance)
  return result
}

function findLeaveDays(query, today) {
  const dayMatch = query.match(/(\d+)\s*[- ]?day/)
  const days = dayMatch ? Number(dayMatch[1]) : null
  const weekdayMatch = query.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i)
  const start = query.includes('tomorrow') ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) : weekdayMatch ? nextWeekday(today, weekdayMatch[1].replace(/^./, (letter) => letter.toUpperCase())) : null
  return { days, start, weekdayMatch: weekdayMatch?.[1] }
}

function classesDuringLeave(section, rows, start, days) {
  if (!start || !days) return []
  const affected = []
  for (let index = 0; index < days; index += 1) {
    const cursor = new Date(start)
    cursor.setDate(cursor.getDate() + index)
    const dayName = DAY_NAMES[cursor.getDay()].slice(0, 3)
    const slots = section.slots[dayName]?.split(',') || []
    slots.forEach((slot) => {
      rows.filter((row) => slot === row.code || slot.split('/').includes(row.code)).forEach((row) => {
        affected.push({ row, date: dateKey(cursor) })
      })
    })
  }
  return affected
}

export function answerQuestion(query, context) {
  const { rows, section, today, planningDate, sectionCode } = context
  const normalized = query.toLowerCase()
  const subject = findSubject(query, rows)
  const dangerRows = rows.filter((row) => row.maximum !== null && row.maximum < 75)
  const enteredRows = rows.filter((row) => row.conducted > 0)

  if (/leave|sick|medical|od|off|absent/.test(normalized)) {
    const leaveType = /medical|sick/.test(normalized) ? 'Medical leave' : /\bod\b|official duty/.test(normalized) ? 'OD leave' : 'Leave'
    const leave = findLeaveDays(query, today)
    if (!leave.start || !leave.days) return { tone: 'yellow', text: `${leaveType} simulation needs a clear start date and duration. Try “3-day sick leave starting tomorrow”. The timetable is ready, but I will not guess missing leave details.` }
    if (!context.leavePolicy) {
      const affected = classesDuringLeave(section, rows, leave.start, leave.days)
      const affectedNames = [...new Set(affected.map((item) => item.row.name))]
      return { tone: 'yellow', text: `${leaveType} from ${dateKey(leave.start)} for ${leave.days} days would touch ${affected.length} scheduled class${affected.length === 1 ? '' : 'es'}${affectedNames.length ? ` (${affectedNames.join(', ')})` : ''}. No OD/Medical leave policy is configured in this dashboard, so I cannot accurately recalculate attendance or claim those classes are excused.` }
    }
  }

  if (/detention|risk|danger|irreversible/.test(normalized)) {
    if (!dangerRows.length) return { tone: 'green', text: `No entered subject is at irreversible detention risk for ${sectionCode}. That warning only appears when maximum possible final attendance is below 75%.` }
    return { tone: 'red', text: `${dangerRows.length} subject${dangerRows.length === 1 ? '' : 's'} are at irreversible risk: ${dangerRows.map((row) => `${row.name} (${formatPercent(row.maximum)} maximum final attendance)`).join('; ')}.` }
  }

  if (/every remaining|perfect attendance|attend all|maximum/.test(normalized)) {
    if (!enteredRows.length) return { tone: 'yellow', text: 'Enter conducted and attended counts for at least one subject. Then I can show the exact maximum final attendance.' }
    const lines = enteredRows.map((row) => `${row.name}: ${formatPercent(row.maximum)}`).join('; ')
    return { tone: 'green', text: `If you attend every remaining scheduled class from ${planningDate}, the maximum final attendance is ${lines}. These projections come directly from the selected section timetable.` }
  }

  if (subject && /90|target/.test(normalized) && !/75|danger|maintain/.test(normalized)) {
    if (!subject.conducted) return { tone: 'yellow', text: `I need conducted and attended counts for ${subject.name} before calculating its 90% target.` }
    if (subject.targetRequired > subject.remaining) return { tone: 'yellow', text: `${subject.name} needs ${subject.targetRequired} classes to finish at 90%, but only ${subject.remaining} remain. The 90% target is not achievable.` }
    return { tone: 'green', text: `${subject.name} needs ${subject.targetRequired} of the ${subject.remaining} remaining classes to finish at or above 90%. You can miss ${Math.max(0, subject.remaining - subject.targetRequired)} and still meet that target.` }
  }

  if (subject && /75|danger|attend|classes|reach|maintain/.test(normalized)) {
    if (!subject.conducted) return { tone: 'yellow', text: `I need conducted and attended counts for ${subject.name} before calculating the exact 75% path.` }
    if (subject.maximum < 75) return { tone: 'red', text: `🔴 ${subject.name} is irreversible. Its maximum possible final attendance is ${formatPercent(subject.maximum)}, below 75%. It needs ${subject.dangerRequired} classes, but only ${subject.remaining} are available.` }
    if (subject.current < 75) return { tone: 'orange', text: `🟠 ${subject.name} is recoverable. Attend the next ${subject.dangerRequired} scheduled classes to finish at or above 75%. You can miss ${subject.misses75} of the ${subject.remaining} remaining.` }
    return { tone: 'green', text: `🟢 ${subject.name} is currently at ${formatPercent(subject.current)}. It needs ${subject.dangerRequired} classes to maintain 75%, and can miss ${subject.misses75} while staying above the threshold.` }
  }

  if (/90|target/.test(normalized)) {
    const targets = enteredRows.map((row) => row.targetRequired > row.remaining ? `${row.name}: not achievable` : `${row.name}: ${row.targetRequired} required`).join('; ')
    return targets ? { tone: 'blue', text: `🎯 90% target outlook: ${targets}.` } : { tone: 'yellow', text: 'Enter attendance counts and I will calculate the exact 90% target outlook.' }
  }

  if (/monday|tuesday|wednesday|thursday|friday/.test(normalized)) {
    const day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].find((name) => normalized.includes(name.toLowerCase()))
    const dayKey = day.slice(0, 3)
    const slots = section.slots[dayKey]?.split(',').filter(Boolean) || []
    const names = slots.map((slot) => rows.filter((row) => slot === row.code || slot.split('/').includes(row.code)).map((row) => row.name)).flat()
    return names.length ? { tone: 'blue', text: `Your next ${day} has ${names.length} scheduled class${names.length === 1 ? '' : 'es'}: ${names.join(', ')}. This uses ${sectionCode}'s actual timetable.` } : { tone: 'green', text: `There are no scheduled classes for your selected section on ${day}.` }
  }

  const summary = enteredRows.length ? `${enteredRows.length} subjects have data. ${dangerRows.length ? `${dangerRows.length} are at irreversible risk.` : 'None are mathematically trapped below 75%.'}` : 'No subject counts have been entered yet.'
  return { tone: 'blue', text: `I’m reading your live ${sectionCode} dashboard. ${summary} Ask me about a subject, 75%, 90%, detention risk, a timetable day, or a leave scenario with a start date and duration.` }
}
