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
    const maxT = getMaxTokensForSummary(text)
    console.log(maxT)

    // Get summary
    const summaryResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes audio transcriptions.",
        },
        { role: "user", content: `Summarize the following transcription:\n\n${text}` },
      ],
      max_tokens: maxT,
    })
    const summary = summaryResp.choices[0].message?.content || ""

    // Extraction prompt for OpenAI
    const extractionPrompt = `
You are an expert assistant for extracting actionable items from meeting or memo transcriptions.

Given a transcription, return a JSON object with the following structure:
{
  "tasks": [ { "title": string, "done": boolean } ],
  "deadlines": [ { "title": string, "date": string } ],
  "reminders": [ { "text": string } ]
}

Guidelines:
- Only include items that are clearly mentioned in the text.
- For tasks, extract actionable to-dos. Set "done" to false unless the text says it is completed.
- For deadlines, extract the title and any date mentioned (ISO format if possible).
- For reminders, extract any reminders or follow-ups.
- If a category has no items, return an empty array for it.
- The JSON must be valid and readable.
`

    const extractResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: extractionPrompt,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    })
    let tasks = []
    let deadlines = []
    let reminders = []
    try {
      const parsed = JSON.parse(extractResp.choices[0].message?.content || '{}')
      tasks = parsed.tasks || []
      deadlines = parsed.deadlines || []
      reminders = parsed.reminders || []
    } catch (e) {
      // fallback: empty arrays
    }

    return Response.json({ text, summary, tasks, deadlines, reminders })
  } catch (err) {
    console.error("Transcription error:", err)
    return new Response("Error processing audio", { status: 500 })
  }
}
