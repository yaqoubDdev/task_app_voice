import { readdir } from "fs/promises"
import path from "path"

export async function GET() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  const files = await readdir(uploadsDir)

  // return URLs relative to public
  const urls = files.map((f) => `/uploads/${f}`)

  return Response.json(urls)
}
