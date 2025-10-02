'use client'
import { useState, useRef, useEffect } from "react"

type Recording = {
  url: string
  blob: Blob
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

  useEffect(() => {
    const loadRecordings = async () => {
      const res = await fetch('/api/recordings')
      const data = await res.json()
      const loadedRecordings = data.map((url: string) => ({url, blob: new Blob()}))
      setRecordings(loadedRecordings)
    }
    loadRecordings()
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
      const url = URL.createObjectURL(blob)
      setRecordings(prev => [...prev, {url, blob}])
      uploadAudio(blob)
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

  const uploadAudio = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('audio', new File([blob], 'recording.mebm'))

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    console.log('uploaded:', data);
    
  }


  return (
    <div className="p-4">
      {recording? (
        <button onClick={stopRecording} className="bg-red-500">Stop Recording</button>
      ): (
        <button onClick={startRecording} className="bg-green-500">Start Recording</button>
      )}

      {recordings.map((audio, index) => (
        <div key={index} className="mt-2 border-2 p-3 w-96">
          <div className="flex gap-2 mb-2">
            <button className="bg-blue-400">transcribe</button>
            <button className="bg-red-500">delete</button>
          </div>
          <audio controls src={audio.url}></audio>
        </div>
      ))}
      

    </div>
  );
}
