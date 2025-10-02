'use client'
import { useState, useRef, useEffect } from "react"

type Recording = {
  url: string
  blob: Blob,
  transcription: string,
  summary: string
}

export default function Home() {

  const [ recording, setRecording ] = useState(false)
  const [ recordings, setRecordings ] = useState<Recording[]>([])
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
      
      uploadTranscribe(blob)
      
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


  const uploadTranscribe = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('file', new File([blob], 'recording.mebm'))

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    const url = URL.createObjectURL(blob)
    const transcription = data.text
    const summary = data.summary
    setRecordings(prev => [...prev, {url, blob, transcription, summary}])
    
  }


  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-500 p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-xl w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">Task App Voice</h1>
        <p className="text-lg text-gray-700 mb-6 text-center">Welcome to the voice-enabled task app!</p>
        <div className="flex gap-4 mb-8">
          {recording ? (
            <button
              onClick={stopRecording}
              className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition"
            >
              Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="px-6 py-2 rounded-lg bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition"
            >
              Start Recording
            </button>
          )}
        </div>
        <div className="w-full flex flex-col items-center gap-4">
          {recordings.map((audio, index) => (
            <div key={index} className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 shadow flex flex-col items-center">
              <div className="flex gap-2 mb-2">
                <button className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition">Transcribe</button>
                <button className="px-3 py-1 rounded bg-red-400 text-white hover:bg-red-500 transition">Delete</button>
              </div>
              <audio controls src={audio.url} className="w-full mb-2"></audio>
              <div className="w-full">
                <h3 className="font-bold text-blue-700">Transcription:</h3>
                <p className="text-gray-800 mb-2">{audio.transcription}</p>
                <h3 className="font-bold text-blue-700">Summary:</h3>
                <p className="text-gray-800">{audio.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
