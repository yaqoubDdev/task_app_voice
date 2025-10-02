import OpenAI from "openai"


function getMaxTokensForSummary(transcript: string): number {
  const length = transcript.split(" ").length 
  if (length < 100) return 80
  if (length < 500) return 150
  if (length < 2000) return 300
  return 500
}

export const runtime = "nodejs" // ensures backend runs on server

export async function POST(req: Request) {
  try {
    const data = await req.formData()
    const file = data.get("file") as File | null

    if (!file) {
      return new Response("No audio file uploaded", { status: 400 })
    }

    // Convert file for OpenAI API
    const buffer = Buffer.from(await file.arrayBuffer())

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], "recording.webm", { type: "audio/webm" }),
      model: "gpt-4o-mini-transcribe", // or "whisper-1"
    })

    const text = transcription.text

    const summaryResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes audio transcriptions.",
        },
        { role: "user", content: `Summarize the following transcription:\n\n${text}` },
      ],
      max_tokens: getMaxTokensForSummary(text),
    })

    const summary = summaryResp.choices[0].message?.content || ""

    return Response.json({ text, summary })
  } catch (err) {
    console.error("Transcription error:", err)
    return new Response("Error processing audio", { status: 500 })
  }
}
