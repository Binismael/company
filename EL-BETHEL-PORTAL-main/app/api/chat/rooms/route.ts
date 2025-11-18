import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const roomId = searchParams.get('id')

    if (!userId && !roomId) {
      return NextResponse.json(
        { error: 'userId or id is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('chat_rooms')
      .select(`
        *,
        participant_1:users!participant_1_id(id, full_name, email),
        participant_2:users!participant_2_id(id, full_name, email),
        latest_message:chat_messages(
          id,
          content,
          created_at,
          sender_id
        ) | order(created_at.desc()) | limit(1)
      `)

    if (roomId) {
      query = query.eq('id', roomId).single()
    } else if (userId) {
      query = query
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('updated_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { participant1Id, participant2Id, name } = body

    if (!participant1Id || !participant2Id) {
      return NextResponse.json(
        { error: 'Both participant IDs are required' },
        { status: 400 }
      )
    }

    if (participant1Id === participant2Id) {
      return NextResponse.json(
        { error: 'Cannot create chat with the same user' },
        { status: 400 }
      )
    }

    // Check if room already exists
    const { data: existingRoom } = await supabaseAdmin
      .from('chat_rooms')
      .select('id')
      .or(
        `and(participant_1_id.eq.${participant1Id},participant_2_id.eq.${participant2Id}),and(participant_1_id.eq.${participant2Id},participant_2_id.eq.${participant1Id})`
      )
      .single()

    if (existingRoom) {
      return NextResponse.json(existingRoom)
    }

    const { data, error } = await supabaseAdmin
      .from('chat_rooms')
      .insert([
        {
          name: name || 'Direct Message',
          participant_1_id: participant1Id,
          participant_2_id: participant2Id,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
