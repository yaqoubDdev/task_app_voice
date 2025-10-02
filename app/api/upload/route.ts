import { writeFile } from "fs/promises"
import path from 'path'

export async function POST(req: Request) {
    const data = await req.formData()
    const file = data.get('audio') as File | null

    if (!file) return new Response('no file uploded', {status: 400})
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadsDir, `${file.name}-${Date.now()}`)
    await writeFile(filePath, buffer)

    return Response.json({success: true, filePath: `/uploads/${file.name}`})
}