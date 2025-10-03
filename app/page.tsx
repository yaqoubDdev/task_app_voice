'use client'
import { useState, useRef, useEffect } from "react"

type Recording = {
  url: string
  blob: Blob,
  transcription: string,
  summary: string,
  section: 'notes' | 'tasks' | 'reminders' | 'deadlines'
}

export default function Home() {

  const [ recording, setRecording ] = useState(false)
  const [ recordings, setRecordings ] = useState<Recording[]>([])
  const [ activeSection, setActiveSection ] = useState<'notes' | 'tasks' | 'reminders' | 'deadlines'>('notes')
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
      setRecordings(prev => [...prev, {url, blob, transcription: '', summary: '', section: activeSection}])
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
    setRecordings(prev => prev.filter(r => r.url !== url))
    URL.revokeObjectURL(url)
  }


  const transcribeAudio = async (url: string, blob: Blob) => {

    // check if already has transcription
    const recordingIndex = recordings.findIndex(r => r.url === url)
    if (recordings[recordingIndex].transcription) {
      alert("This audio has already been transcribed.")
      return
    }
    
    const formData = new FormData()
    formData.append('file', new File([blob], 'recording.mebm'))

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    
    const transcription = data.text
    const summary = data.summary

    const updatedRecording = { ...recordings[recordingIndex], transcription, summary }
    setRecordings(prev => prev.map((r, i) => i === recordingIndex ? updatedRecording : r))
    alert("Transcription and summary completed!")
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
        <div className="flex gap-4 mb-6 w-full justify-center">
          <button onClick={() => setActiveSection('notes')} className={`px-4 py-2 rounded-lg font-semibold shadow transition ${activeSection === 'notes' ? 'bg-blue-800 text-white' : 'bg-blue-700 text-blue-100 hover:bg-blue-800'}`}>Notes</button>
          <button onClick={() => setActiveSection('tasks')} className={`px-4 py-2 rounded-lg font-semibold shadow transition ${activeSection === 'tasks' ? 'bg-blue-800 text-white' : 'bg-blue-700 text-blue-100 hover:bg-blue-800'}`}>Tasks</button>
          <button onClick={() => setActiveSection('reminders')} className={`px-4 py-2 rounded-lg font-semibold shadow transition ${activeSection === 'reminders' ? 'bg-blue-800 text-white' : 'bg-blue-700 text-blue-100 hover:bg-blue-800'}`}>Reminders</button>
          <button onClick={() => setActiveSection('deadlines')} className={`px-4 py-2 rounded-lg font-semibold shadow transition ${activeSection === 'deadlines' ? 'bg-blue-800 text-white' : 'bg-blue-700 text-blue-100 hover:bg-blue-800'}`}>Deadlines</button>
        </div>
        {/* Sectioned content */}
        <div className="w-full flex flex-col items-center gap-4">
          {['notes', 'tasks', 'reminders', 'deadlines'].map(section => (
            <div key={section} className={activeSection === section ? 'w-full' : 'hidden'}>
              {recordings.filter(r => r.section === section).length === 0 ? (
                <p className="text-blue-400 italic text-center">No {section} yet.</p>
              ) : (
                recordings.filter(r => r.section === section).map((audio) => (
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
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
