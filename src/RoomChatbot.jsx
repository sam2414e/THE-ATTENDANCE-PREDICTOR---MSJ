import { useEffect, useRef, useState } from 'react'
import { answerRoomQuestion } from './roomAdvisor'

const QUICK_PROMPTS = ['Find an AC room on the ground floor for 2 hours', 'Which rooms are free now?', 'How do I claim a room?']
const INITIAL_MESSAGE = { from: 'bot', tone: 'blue', text: 'Hi, I’m Room Advisor. Tell me the floor, facilities, room type, group size, or duration you need, and I’ll check the live timetable.' }

function readClaims() { try { return JSON.parse(localStorage.getItem('attendance-predictor-room-claims') || '{}') } catch { return {} } }

export default function RoomChatbot({ now, claims = null }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [typing, setTyping] = useState(false)
  const messagesRef = useRef(null)
  const responseTimerRef = useRef(null)

  useEffect(() => {
    const panel = messagesRef.current
    if (panel) panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])
  useEffect(() => () => window.clearTimeout(responseTimerRef.current), [])

  function submitMessage(value = draft) {
    const text = value.trim()
    if (!text || typing) return
    setDraft('')
    setMessages((current) => [...current, { from: 'user', text }])
    setTyping(true)
    responseTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, { from: 'bot', ...answerRoomQuestion(text, { now, claims: claims || readClaims() }) }])
      setTyping(false)
    }, 350)
  }

  return <>
    {open && <section className="chat-window room-chat-window" aria-label="Room Advisor chat"><header className="chat-header"><div><span className="chat-avatar">🗺️</span><div><strong>Room Advisor</strong><small>Live timetable connected</small></div></div><button type="button" aria-label="Close Room Advisor" onClick={() => setOpen(false)}>×</button></header><div className="chat-messages" ref={messagesRef} aria-live="polite">{messages.map((message, index) => <div className={`chat-message ${message.from} ${message.tone || ''}`} key={`${message.from}-${index}`}>{message.text}</div>)}{typing && <div className="chat-message bot typing" aria-label="Room Advisor is typing"><i /><i /><i /></div>}</div><div className="quick-prompts">{QUICK_PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => submitMessage(prompt)}>{prompt}</button>)}</div><form className="chat-input" onSubmit={(event) => { event.preventDefault(); submitMessage() }}><input aria-label="Message Room Advisor" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask for a room..." /><button type="submit" aria-label="Send room question">↗</button></form></section>}
    <button type="button" className={`chat-launcher room-chat-launcher ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}><span>🗺️</span> Room Advisor</button>
  </>
}
