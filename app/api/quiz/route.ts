import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check subscriber
    const { data: profile } = await supabase
      .from('profiles').select('is_subscriber').eq('id', user.id).single()
    if (!profile?.is_subscriber) {
      return NextResponse.json({ error: 'Subscribers only' }, { status: 403 })
    }

    const { transmissaoId } = await request.json()

    // Check if quiz already exists
    const { data: existing } = await supabase
      .from('quizzes').select('*').eq('transmissao_id', transmissaoId).single()
    if (existing) return NextResponse.json(existing)

    // Fetch article content
    const { data: transmissao } = await supabase
      .from('transmissoes').select('title, content, categories').eq('id', transmissaoId).single()
    if (!transmissao) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

    // Strip HTML tags for prompt
    const plainText = (transmissao.content as string)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)

    // Generate quiz via OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é Hermes Trismegisto — um professor hermético exigente e perspicaz.
          Gere um quiz de compreensão em português brasileiro com 5 questões de múltipla escolha
          sobre o texto fornecido. Cada questão deve ter 4 alternativas (A-D) e uma explicação
          concisa da resposta correta. Retorne APENAS JSON válido no formato especificado.`,
        },
        {
          role: 'user',
          content: `Título: ${transmissao.title}\n\nTexto:\n${plainText}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'quiz',
          schema: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question:      { type: 'string' },
                    options:       { type: 'array', items: { type: 'string' } },
                    correct_index: { type: 'number' },
                    explanation:   { type: 'string' },
                  },
                  required: ['question', 'options', 'correct_index', 'explanation'],
                },
              },
            },
            required: ['questions'],
          },
        },
      },
    })

    const quizData = JSON.parse(completion.choices[0].message.content!)

    // Save to DB
    const { data: savedQuiz } = await supabase
      .from('quizzes')
      .insert({
        transmissao_id: transmissaoId,
        questions: quizData.questions,
        xp_reward: 50,
      })
      .select()
      .single()

    return NextResponse.json(savedQuiz)
  } catch (err) {
    console.error('[quiz]', err)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
