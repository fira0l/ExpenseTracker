import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await req.json()

    // 1. Fetch User Data Context from Supabase
    const [{ data: profile }, { data: transactions }, { data: categories }, { data: budgets }, { data: investments }, { data: debts }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('transactions').select('*, categories(*)').eq('user_id', user.id).order('transaction_date', { ascending: false }).limit(50),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('budgets').select('*, categories(*)').eq('user_id', user.id),
      supabase.from('investments').select('*').eq('user_id', user.id),
      supabase.from('debts').select('*').eq('user_id', user.id),
    ])

    const currency = profile?.currency || 'ETB'
    const monthlyIncome = Number(profile?.monthly_income || 0)

    // Calculate Financial Aggregates
    const recentTx = transactions || []
    const totalSpent = recentTx
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    const totalIncome = recentTx
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    const totalAssets = (investments || []).reduce((sum: number, i: any) => sum + Number(i.value), 0)
    const totalDebt = (debts || []).reduce((sum: number, d: any) => sum + Number(d.amount), 0)
    const netWorth = totalAssets - totalDebt

    // Category Spending Breakdown
    const categoryTotals: Record<string, number> = {}
    recentTx.forEach((t: any) => {
      if (t.type === 'expense') {
        const catName = t.categories?.name || 'Uncategorized'
        categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(t.amount)
      }
    })

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => `${name}: ${amount.toLocaleString()} ${currency}`)

    // Formulate Context Summary
    const lowerMessage = (message || '').toLowerCase()
    let aiResponse = ''

    if (lowerMessage.includes('summary') || lowerMessage.includes('overview') || lowerMessage.includes('net worth')) {
      aiResponse = `📊 **Financial Health Overview:**\n\n` +
        `• **Net Worth:** ${netWorth.toLocaleString()} ${currency} (Assets: ${totalAssets.toLocaleString()} ${currency} | Debt: ${totalDebt.toLocaleString()} ${currency})\n` +
        `• **Recent Incomes:** ${totalIncome.toLocaleString()} ${currency}\n` +
        `• **Recent Expenses:** ${totalSpent.toLocaleString()} ${currency}\n` +
        (monthlyIncome > 0 ? `• **Monthly Target Income:** ${monthlyIncome.toLocaleString()} ${currency}\n\n` : '\n') +
        `**Top Spending Categories:**\n` +
        (sortedCategories.slice(0, 3).map(c => `• ${c}`).join('\n') || '• No expense data recorded yet.') +
        `\n\n💡 *Tip: Keep your monthly expenses below 70% of total income to build a healthy emergency fund!*`
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('limit')) {
      const budgetList = (budgets || []).map((b: any) => {
        const catName = b.categories?.name || 'Category'
        const spent = categoryTotals[catName] || 0
        const pct = Math.round((spent / Number(b.amount)) * 100)
        const statusEmoji = pct > 100 ? '🚨 Over Budget' : pct > 80 ? '⚠️ Near Limit' : '✅ On Track'
        return `• **${catName}**: ${spent.toLocaleString()} / ${Number(b.amount).toLocaleString()} ${currency} (${pct}%) - ${statusEmoji}`
      })

      aiResponse = `🎯 **Budget Tracking Report:**\n\n` +
        (budgetList.length > 0 ? budgetList.join('\n') : 'You currently have no active budget limits set. Head over to the Budgets tab to configure monthly category limits!') +
        `\n\n💡 *Tip: Set spending alerts at 80% to avoid end-of-month budget breaches.*`
    } else if (lowerMessage.includes('save') || lowerMessage.includes('cut') || lowerMessage.includes('recommendation') || lowerMessage.includes('tip')) {
      const topCat = sortedCategories[0] ? sortedCategories[0] : 'Food & Dining'
      aiResponse = `💡 **Personalized Savings Recommendations:**\n\n` +
        `1. **Focus on Top Expense Area:** Your largest expense area is **${topCat}**. Reducing this by 15% could save you around ${(totalSpent * 0.15).toFixed(0)} ${currency} per month.\n` +
        `2. **Automate Savings:** Set up a Recurring Transaction or Savings Goal to transfer 10-20% of your income into savings as soon as your paycheck arrives.\n` +
        `3. **Review Debt Interest:** If you have high-interest debts (${totalDebt.toLocaleString()} ${currency} total), prioritize paying down the highest interest rate first (Debt Avalanche strategy).`
    } else {
      aiResponse = `Hello! Based on your active financial records in SpendWise:\n\n` +
        `• **Current Total Tracked Expenses:** ${totalSpent.toLocaleString()} ${currency}\n` +
        `• **Current Total Tracked Incomes:** ${totalIncome.toLocaleString()} ${currency}\n` +
        `• **Tracked Net Worth:** ${netWorth.toLocaleString()} ${currency}\n\n` +
        `You can ask me questions like:\n` +
        `- *"Summarize my spending and net worth"* \n` +
        `- *"How am I doing on my budget targets?"*\n` +
        `- *"Give me personalized savings recommendations"*`
    }

    return NextResponse.json({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('AI Advisor Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
