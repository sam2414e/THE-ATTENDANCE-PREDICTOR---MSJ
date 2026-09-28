import { useEffect, useMemo, useRef, useState } from 'react'
import { answerQuestion } from './advisorHandler'

const QUICK_PROMPTS = [
  'Can I reach 90%?',
  'Am I at detention risk?',
  'How many classes do I need to attend?',
  'What happens if I take leave?',
]


export default function AttendanceAdvisor({ context }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState([{ from: 'bot', tone: 'blue', text: 'Hi, I’m Attendance Advisor. I use the live dashboard data and exact attendance engine to answer your questions.' }])
  const endRef = useRef(null)
  const today = useMemo(() => new Date(`${context.today}T12:00:00`), [context.today])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  function sendMessage(value = draft) {
    const text = value.trim()
    if (!text || typing) return
    setDraft('')
    setMessages((current) => [...current, { from: 'user', text }])
    setTyping(true)
    window.setTimeout(() => { setMessages((current) => [...current, { from: 'bot', ...answerQuestion(text, { ...context, today }) }]); setTyping(false) }, 450)
  }

  return <>
    {open && <section className="chat-window" aria-label="Attendance Advisor chat"><header className="chat-header"><div><span className="chat-avatar">🤖</span><div><strong>Attendance Advisor</strong><small>Live dashboard connected</small></div></div><button type="button" aria-label="Close Attendance Advisor" onClick={() => setOpen(false)}>×</button></header><div className="chat-messages">{messages.map((message, index) => <div className={`chat-message ${message.from} ${message.tone || ''}`} key={`${message.from}-${index}`}>{message.text}</div>)}{typing && <div className="chat-message bot typing"><i /><i /><i /></div>}<div ref={endRef} /></div><div className="quick-prompts">{QUICK_PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => sendMessage(prompt)}>{prompt}</button>)}</div><form className="chat-input" onSubmit={(event) => { event.preventDefault(); sendMessage() }}><input aria-label="Message Attendance Advisor" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about your attendance..." /><button type="submit" aria-label="Send message">↗</button></form></section>}
    <button type="button" className={`chat-launcher ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}><span>🤖</span> Attendance Advisor</button>
  </>
}
