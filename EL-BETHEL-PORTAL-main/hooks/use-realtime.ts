import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  table: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
}

export function useRealtime<T>(
  options: UseRealtimeOptions,
  onData?: (data: T) => void
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError('Supabase client not initialized')
      return
    }

    try {
      const channelName = `${options.table}:${options.filter || '*'}`
      let realtimeChannel = supabase.channel(channelName)

      realtimeChannel.on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: 'public',
          table: options.table,
          filter: options.filter,
        },
        (payload) => {
          if (onData) {
            onData(payload.new as T)
          }
        }
      )

      realtimeChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
          setError(null)
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to subscribe to realtime updates')
          setIsSubscribed(false)
        }
      })

      setChannel(realtimeChannel)

      return () => {
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel)
        }
      }
    } catch (err: any) {
      setError(err.message)
    }
  }, [options.table, options.filter, options.event, onData])

  const unsubscribe = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel)
      setIsSubscribed(false)
    }
  }, [channel])

  return {
    isSubscribed,
    error,
    unsubscribe,
  }
}

export function useRealtimeChat(chatRoomId: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { isSubscribed } = useRealtime(
    {
      table: 'chat_messages',
      filter: `chat_room_id=eq.${chatRoomId}`,
      event: 'INSERT',
    },
    (newMessage) => {
      setMessages((prev) => [...prev, newMessage])
    }
  )

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('chat_messages')
          .select(`
            *,
            sender:users(id, full_name, email)
          `)
          .eq('chat_room_id', chatRoomId)
          .order('created_at', { ascending: true })
          .limit(100)

        if (fetchError) throw fetchError

        setMessages(data || [])
        setError(null)
      } catch (err: any) {
        setError(err.message)
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [chatRoomId])

  return {
    messages,
    isLoading,
    error,
    isSubscribed,
  }
}
