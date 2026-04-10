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

    const prompt = `You are helping a student intern fill out a weekly accomplishment report form.

Raw daily logs (may have repeated or similar tasks):
"${tasks}"

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "tasksSummary": "1-2 sentence summary of the week's tasks with no redundancy",
  "reflection": "ONE short paragraph (4-6 sentences) in first person addressing: new skills learned, how school knowledge was applied at work, difficulties encountered, and what skills would have helped."
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
