export interface ParsedTransaction {
  amount: number | null
  type: 'expense' | 'income'
  description: string
  date: string | null
}

export function parseBankSMS(text: string): ParsedTransaction {
  const lowerText = text.toLowerCase()

  // 1. Determine Type
  const incomeKeywords = ['credited', 'received', 'deposited', 'added', 'refunded']
  const expenseKeywords = ['debited', 'paid', 'withdrawn', 'sent', 'transferred', 'purchase']
  
  let type: 'expense' | 'income' = 'expense' // Default
  if (incomeKeywords.some(k => lowerText.includes(k))) {
    type = 'income'
  } else if (expenseKeywords.some(k => lowerText.includes(k))) {
    type = 'expense'
  }

  // 2. Extract Amount
  // Matches: ETB 150.00, 150.00 ETB, Birr 500, $50.00, etc.
  let amount: number | null = null
  const amountRegex = /(?:etb|birr|usd|\$|br\.?)?\s*([\d,]+\.?\d*)\s*(?:etb|birr|usd)?/i
  // Try to find amount specifically near keywords first
  const keywordAmountRegex = /(?:debited|paid|credited|received|transferred|withdrawn)\s+(?:etb|birr|usd|\$|br\.?)?\s*([\d,]+\.?\d*)/i
  
  let match = text.match(keywordAmountRegex)
  if (!match) match = text.match(amountRegex)

  if (match && match[1]) {
    amount = parseFloat(match[1].replace(/,/g, ''))
  }

  // 3. Extract Merchant / Description
  let description = 'Parsed Transaction'
  // Try to find text after "to " or "at " or "from "
  const toMatch = text.match(/\b(?:to|at|from)\s+([A-Za-z0-9\s*]+?)(?:\s+on|\.|$)/i)
  if (toMatch && toMatch[1]) {
    description = toMatch[1].trim()
  }

  // 4. Extract Date (optional, fallback to today)
  let date: string | null = null
  // Matches dd-MMM-yy or yyyy-mm-dd or dd/mm/yyyy
  const dateRegex = /(\d{2,4}[-/]\d{2}[-/]\d{2,4}|\d{2}-[A-Za-z]{3}-\d{2,4})/
  const dateMatch = text.match(dateRegex)
  if (dateMatch) {
    // Attempt to parse or just store raw
    // For simplicity, we just return the raw string and let the UI handle/default it to today if parsing fails
    date = dateMatch[1]
  }

  return { amount, type, description, date }
}
