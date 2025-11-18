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
    const chatRoomId = searchParams.get('chatRoomId')
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'

    if (!chatRoomId) {
      return NextResponse.json(
        { error: 'chatRoomId is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select(`
        *,
        sender:users(id, full_name, email)
      `)
      .eq('chat_room_id', chatRoomId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data.reverse())
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
    const { chatRoomId, senderId, content, fileUrl } = body

    if (!chatRoomId || !senderId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([
        {
          chat_room_id: chatRoomId,
          sender_id: senderId,
          content,
          file_url: fileUrl || null,
        },
      ])
      .select(`
        *,
        sender:users(id, full_name, email)
      `)
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

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { messageId, isRead } = body

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .update({
        is_read: isRead !== undefined ? isRead : true,
        read_at: isRead ? new Date().toISOString() : null,
      })
      .eq('id', messageId)
      .select()
      .single()

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

export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { chatRoomId, userId } = body

    if (!chatRoomId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Mark all unread messages as read
    const { error } = await supabaseAdmin
      .from('chat_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('chat_room_id', chatRoomId)
      .neq('sender_id', userId)
      .eq('is_read', false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
