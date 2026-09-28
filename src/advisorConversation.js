import { useState } from 'react'
import { answerQuestion } from './advisorHandler'

const INITIAL_MESSAGE = { from: 'bot', tone: 'blue', text: 'Hi, I’m Attendance Advisor. I use the live dashboard data and exact attendance engine to answer your questions about attendance, timetable, detention risk, and leave plans.' }

export function useAdvisorConversation(getContext) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [typing, setTyping] = useState(false)

  function sendMessage(value) {
    const text = value.trim()
    if (!text || typing) return
    const previousUserMessage = [...messages].reverse().find((message) => message.from === 'user')?.text || ''
    setMessages((current) => [...current, { from: 'user', text }])
    setTyping(true)
    window.setTimeout(() => {
      const response = answerQuestion(text, { ...getContext(), lastUserMessage: previousUserMessage })
      setMessages((current) => [...current, { from: 'bot', ...response }])
      setTyping(false)
    }, 450)
  }

  return { messages, typing, sendMessage }
}
