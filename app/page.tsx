'use client'
import { useState, useRef, useEffect } from "react"
import { StickyNote, CheckCircle, Bell, Calendar } from "lucide-react"

type Recording = {
  url: string
  blob: Blob,
  transcription: string,
  summary: string
}

export default function Home() {

  const [ recording, setRecording ] = useState(false)
  const [ notes, setNotes ] = useState<Recording[]>([])

  // State for other tabs (now updatable)
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Buy groceries', done: false },
    { id: 2, title: 'Finish project report', done: true },
    { id: 3, title: 'Call Alice', done: false },
  ])
  const [deadlines, setDeadlines] = useState([
    { id: 1, title: 'Submit tax return', date: '2025-10-20' },
    { id: 2, title: 'Pay rent', date: '2025-10-31' },
  ])
  const [reminders, setReminders] = useState([
    { id: 1, text: 'Doctor appointment at 3pm' },
    { id: 2, text: 'Water the plants' },
  ])
  const [ activeSection, setActiveSection ] = useState<'notes' | 'tasks' | 'reminders' | 'deadlines'>('notes')

  // Task tab handlers
  function handleToggleTaskDone(idx: number) {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, done: !t.done } : t))
  }

  function handleDeleteTask(idx: number) {
    setTasks(prev => prev.filter((_, i) => i !== idx))
  }

  // Tab configuration list
  const tabs = [
    {
      key: 'notes',
      label: 'Notes',
      icon: StickyNote,
      content: notes.length === 0
        ? <p className="text-blue-400 italic text-center">No notes yet.</p>
        : notes.map((audio) => (
            <div key={audio.url} className="w-full bg-blue-900 border border-blue-800 rounded-lg p-4 shadow flex flex-col items-center mb-2">
              <div className="flex gap-2 mb-2">
                <button className="px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800 transition" onClick={() => transcribeAudio(audio.url, audio.blob)}>Transcribe</button>
                <button className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition" onClick={() => deleteAudio(audio.url)}>Delete</button>
              </div>
              <audio controls src={audio.url} className="w-full mb-2"></audio>
              {audio.transcription ? (
                <div className="w-full">
                  <h3 className="font-bold text-blue-200">Transcription:</h3>
                  <p className="text-blue-100 mb-2">{audio.transcription}</p>
                  <h3 className="font-bold text-blue-200">Summary:</h3>
                  <p className="text-blue-100">{audio.summary}</p>
                </div>
              ) : (
                <p className="text-blue-400 italic">No transcription yet.</p>
              )}
            </div>
          ))
    },
    {
      key: 'tasks',
      label: 'Tasks',
      icon: CheckCircle,
      content: tasks.length === 0 ? (
        <p className="text-blue-400 italic text-center">No tasks yet.</p>
      ) : (
        <ul className="w-full flex flex-col gap-2">
          {tasks.map((task: {id?: number, title: string, done: boolean}, idx: number) => (
            <li key={task.id ?? task.title} className={`flex items-center justify-between bg-blue-900 border border-blue-800 rounded-lg p-4 shadow mb-1 ${task.done ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-2">
                <button
                  className={`w-5 h-5 rounded-full border-2 ${task.done ? 'bg-green-600 border-green-700' : 'bg-blue-950 border-blue-400'} flex items-center justify-center transition`}
                  title={task.done ? 'Mark as incomplete' : 'Mark as complete'}
                  onClick={() => handleToggleTaskDone(idx)}
                >
                  {task.done && <span className="block w-3 h-3 bg-green-300 rounded-full"></span>}
                </button>
                <span className={`font-medium text-blue-100 ${task.done ? 'line-through' : ''}`}>{task.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${task.done ? 'bg-green-700 text-green-100' : 'bg-yellow-700 text-yellow-100'}`}>{task.done ? 'Done' : 'Pending'}</span>
                <button
                  className="ml-2 px-2 py-1 rounded bg-red-700 text-white text-xs font-semibold hover:bg-red-800 transition"
                  title="Delete task"
                  onClick={() => handleDeleteTask(idx)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )
    },
    {
      key: 'deadlines',
      label: 'Deadlines',
      icon: Calendar,
      content: deadlines.length === 0 ? (
        <p className="text-blue-400 italic text-center">No deadlines yet.</p>
      ) : (
        <ul className="w-full flex flex-col gap-2">
          {deadlines.map(dl => (
            <li key={dl.id} className="flex items-center justify-between bg-blue-900 border border-blue-800 rounded-lg p-4 shadow mb-1">
              <span className="font-medium text-blue-100">{dl.title}</span>
              <span className="ml-4 px-2 py-1 rounded text-xs font-semibold bg-blue-700 text-blue-100">{dl.date}</span>
            </li>
          ))}
        </ul>
      )
    },
    {
      key: 'reminders',
      label: 'Reminders',
      icon: Bell,
      content: reminders.length === 0 ? (
        <p className="text-blue-400 italic text-center">No reminders yet.</p>
      ) : (
        <ul className="w-full flex flex-col gap-2">
          {reminders.map(rem => (
            <li key={rem.id} className="flex items-center bg-blue-900 border border-blue-800 rounded-lg p-4 shadow mb-1">
              <span className="font-medium text-blue-100">{rem.text}</span>
            </li>
          ))}
        </ul>
      )
    },
  ]
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunkRef = useRef<Blob[]>([])

  useEffect(() => {
    // cleanup
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive'){
        mediaRecorderRef.current.stop()
      }
    }
  }, [])


  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })
    mediaRecorderRef.current = new MediaRecorder(stream)
    mediaRecorderRef.current.ondataavailable = (e) => {
      chunkRef.current.push(e.data)
    }
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunkRef.current, {
        type: 'audio/mebm'
      })
      chunkRef.current = []
      // Prompt user for section or use activeSection
      const url = URL.createObjectURL(blob)
  setNotes(prev => [...prev, {url, blob, transcription: '', summary: ''}])
    }
    mediaRecorderRef.current.start()
    setRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording){
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }


  const deleteAudio = (url: string) => {
    setNotes(prev => prev.filter(r => r.url !== url))
    URL.revokeObjectURL(url)
  }


  const transcribeAudio = async (url: string, blob: Blob) => {
    // Only for notes
    const recordingIndex = notes.findIndex(r => r.url === url)
    // if (notes[recordingIndex]?.transcription) {
    //   alert("This audio has already been transcribed.")
    //   return
    // }
    const formData = new FormData()
    formData.append('file', new File([blob], 'recording.mebm'))
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      console.log(data)
      const transcription = data.text
      const summary = data.summary
      const updatedRecording = { ...notes[recordingIndex], transcription, summary }
      setNotes(prev => prev.map((r, i) => i === recordingIndex ? updatedRecording : r))
      // Append new tasks, deadlines, reminders if present
      if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        setTasks(prev => {
          // Avoid duplicates by title
          const existingTitles = new Set(prev.map((t: {title: string}) => t.title))
          const newTasks = data.tasks.filter((t: {title: string}) => !existingTitles.has(t.title))
          return [...prev, ...newTasks]
        })
      }
      if (Array.isArray(data.deadlines) && data.deadlines.length > 0) {
        setDeadlines(prev => {
          const existingTitles = new Set(prev.map((d: {title: string}) => d.title))
          const newDeadlines = data.deadlines.filter((d: {title: string}) => !existingTitles.has(d.title))
          return [...prev, ...newDeadlines]
        })
      }
      if (Array.isArray(data.reminders) && data.reminders.length > 0) {
        setReminders(prev => {
          const existingTexts = new Set(prev.map((r: {text: string}) => r.text))
          const newReminders = data.reminders.filter((r: {text: string}) => !existingTexts.has(r.text))
          return [...prev, ...newReminders]
        })
      }
      alert("Transcription and summary completed! Tabs updated.")
    } catch (error) {
      alert(`error transcribing: ${error}`)
    }
  }


  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-6">
      {/* Title and subtitle at the top */}
      <div className="w-full flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-100 mb-2 mt-4">AI Voice Memo App</h1>
        <p className="text-lg text-blue-200 mb-6 text-center">Welcome to the voice-enabled Memo App!</p>
      </div>
      {/* Recording controls outside the card */}
      <div className="flex gap-4 mb-8 w-full max-w-xl justify-center border-b border-blue-800 pb-6">
        {recording ? (
          <button
            onClick={stopRecording}
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
          >
            Stop Recording
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
          >
            Start Recording
          </button>
        )}
      </div>
      <div className="bg-blue-950 rounded-xl shadow-lg p-8 max-w-xl w-full flex flex-col items-center">
        {/* Section navigation tabs */}
      <div className="flex gap-1 mb-6 w-full bg-blue-950 pt-0 pl-0 justify-start items-start" style={{marginTop: '-12px'}}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setActiveSection(tab.key as any)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition outline-none ${activeSection === tab.key ? 'text-white border-b-4 border-blue-300' : 'text-blue-100 hover:text-white border-b-4 border-transparent'}`}
                style={{background: 'inherit'}}
              >
                <Icon size={20} /> {tab.label}
              </button>
            );
          })}
        </div>
        {/* Sectioned content */}
        <div className="w-full flex flex-col items-center gap-4">
          {tabs.map(tab => (
            activeSection === tab.key && (
              <div key={tab.key} className="w-full">{tab.content}</div>
            )
          ))}
        </div>
      </div>
    </main>
  );
}
