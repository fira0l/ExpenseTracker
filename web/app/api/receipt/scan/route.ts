import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageBase64, textInput } = await req.json()

    // Fetch user's actual categories from Supabase for intelligent matching
    const { data: categories } = await supabase.from('categories').select('*').eq('user_id', user.id)

    let extractedText = textInput || ''

    // If pure base64 image is uploaded and no raw text provided, perform REAL OCR
    if (!extractedText && imageBase64) {
      try {
        const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

        if (geminiApiKey) {
          // Use Google Gemini 1.5 Flash Multimodal Vision API for ultra-accurate receipt parsing
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        inline_data: {
                          mime_type: 'image/jpeg',
                          data: cleanBase64,
                        },
                      },
                      {
                        text: 'Extract the full text, merchant name, date, and total amount from this receipt image. Return text.',
                      },
                    ],
                  },
                ],
              }),
            }
          )

          const data = await response.json()
          const visionText = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (visionText) {
            extractedText = visionText
          }
        }

        // Fallback to free public OCR.space engine if Gemini key is not configured
        if (!extractedText) {
          const formData = new URLSearchParams()
          formData.append('base64Image', imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`)
          formData.append('apikey', 'helloworld') // Official free public OCR.space API key
          formData.append('language', 'eng')
          formData.append('isOverlayRequired', 'false')

          const ocrRes = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
          })

          const ocrData = await ocrRes.json()
          if (ocrData?.ParsedResults?.[0]?.ParsedText) {
            extractedText = ocrData.ParsedResults[0].ParsedText
          }
        }
      } catch (ocrErr) {
        console.warn('Real OCR API call warning:', ocrErr)
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json({
        error: 'Could not extract text from receipt image. Please paste receipt text or upload a clearer photo.',
      }, { status: 400 })
    }

    const lower = extractedText.toLowerCase()

    // 1. Extract Real Amount
    let amount: number | null = null

    // Look for total patterns: "TOTAL: 120.00", "TOTAL ETB 450", "AMOUNT PAID $35.50"
    const totalMatch = extractedText.match(/(?:total|amount|sum|net|paid|br|etb|\$)\s*:?\s*(?:etb|birr|usd|\$|br\.?)?\s*([\d,]+\.?\d*)/i)
    if (totalMatch && totalMatch[1]) {
      const parsedVal = parseFloat(totalMatch[1].replace(/,/g, ''))
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal
      }
    }

    if (!amount) {
      // Find the highest floating point currency number in the entire extracted receipt text
      const allNumbers = extractedText.match(/[\d]+\.\d{2}/g)
      if (allNumbers && allNumbers.length > 0) {
        const floats = allNumbers.map((n: string) => parseFloat(n)).filter((n: number) => !isNaN(n))
        if (floats.length > 0) {
          amount = Math.max(...floats)
        }
      }
    }

    // 2. Extract Real Date
    let date: string | null = null
    const dateMatch = extractedText.match(/(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})/)
    if (dateMatch) {
      const matchedStr = dateMatch[1].replace(/\//g, '-')
      const parts = matchedStr.split('-')
      if (parts[0].length === 4) {
        date = matchedStr
      } else if (parts[2].length === 4) {
        date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
      }
    }
    if (!date) {
      date = new Date().toISOString().split('T')[0]
    }

    // 3. Extract Real Merchant Name
    let merchant = ''
    const lines = extractedText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)
    if (lines.length > 0) {
      const headerLine = lines[0]
      if (headerLine.length < 50 && !headerLine.toLowerCase().includes('date') && !headerLine.toLowerCase().includes('total')) {
        merchant = headerLine
      }
    }
    if (!merchant) merchant = 'Scanned Merchant'

    // 4. Intelligent Category Match
    let categoryName = 'Food & Dining'
    if (categories && categories.length > 0) {
      if (lower.includes('supermarket') || lower.includes('grocery') || lower.includes('food') || lower.includes('market') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('coffee')) {
        categoryName = categories.find(c => c.name.toLowerCase().includes('food'))?.name || categories[0].name
      } else if (lower.includes('fuel') || lower.includes('gas') || lower.includes('ride') || lower.includes('uber') || lower.includes('transport') || lower.includes('taxi')) {
        categoryName = categories.find(c => c.name.toLowerCase().includes('transport'))?.name || categories[0].name
      } else if (lower.includes('electric') || lower.includes('bill') || lower.includes('water') || lower.includes('utility')) {
        categoryName = categories.find(c => c.name.toLowerCase().includes('bill'))?.name || categories[0].name
      } else if (lower.includes('pharmacy') || lower.includes('clinic') || lower.includes('hospital') || lower.includes('health')) {
        categoryName = categories.find(c => c.name.toLowerCase().includes('health'))?.name || categories[0].name
      } else {
        categoryName = categories[0].name
      }
    }

    return NextResponse.json({
      merchant,
      amount: amount || 0,
      date,
      type: 'expense',
      categoryName,
      rawText: extractedText,
    })
  } catch (error: any) {
    console.error('Receipt Scanner Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to scan receipt' }, { status: 500 })
  }
}
