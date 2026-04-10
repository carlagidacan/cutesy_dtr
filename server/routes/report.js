import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.post('/generate-reflection', authMiddleware, async (req, res) => {
  try {
    const { tasks, requiredQuestions } = req.body
    
    if (!tasks || tasks.trim() === '') {
      return res.status(400).json({ message: 'No tasks provided for reflection.' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'GEMINI_API_KEY is missing from server environment variables.' 
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

    const prompt = `You are helping a student intern write a weekly accomplishment report.

Here are the tasks the student did this week (some may repeat):
"${tasks}"

Tone and style rules:
- Write in first person, as if the student is genuinely sharing their experience.
- Use simple, plain language — avoid technical jargon and overly formal phrases.
- Keep sentences short and clear, but maintain a calm and composed tone suitable for academic submission.
- Do NOT use exclamation marks anywhere. The tone should be sincere and reflective, not excited or dramatic.
- Do not exaggerate. Keep it honest and grounded.

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "tasksSummary": "1-2 sentences summarizing what the student did this week. Remove repeated tasks and keep it straightforward.",
  "reflection": "ONE short paragraph (3-5 sentences) in first person. Cover what was learned, how school knowledge was applied, any difficulties encountered, and what the student wishes they had known or practiced beforehand. Write as a student would — simply and sincerely, without exclamation marks."
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()

    // Strip markdown code fences if present
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // If parsing fails, return raw text as reflection fallback
      return res.json({ reflection: text, tasksSummary: null })
    }

    res.json({ 
      reflection: (parsed.reflection || '').trim(),
      tasksSummary: (parsed.tasksSummary || '').trim()
    })

  } catch (error) {
    console.error('Gemini generation error:', error)
    
    const errorMsg = error?.message || String(error)

    // 429 – Model is overloaded / rate limited
    if (error.status === 429 || errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('too many requests') || errorMsg.toLowerCase().includes('resource_exhausted')) {
      return res.status(429).json({ 
        message: 'The AI model is currently experiencing high demand. Please wait a moment and try again.',
        error: errorMsg
      })
    }

    // 404 – Region lock / model unavailable
    if (error.status === 404) {
      return res.status(404).json({ 
        message: 'Google Gemini Free-Tier API is restricted in your region, or your API key lacks model access. You will have to draft the reflection manually, or use a VPN/Paid Tier.',
        error: errorMsg
      })
    }

    res.status(500).json({ 
      message: 'Failed to generate reflection with AI.',
      error: errorMsg
    })
  }
})

export default router
