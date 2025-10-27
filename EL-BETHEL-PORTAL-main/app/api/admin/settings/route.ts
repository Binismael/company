import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .single()

    if (settingsError) {
      return NextResponse.json({ settings: null })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { school_name, school_code, principal_email, school_phone, school_address, website, current_session, current_term, session_start_date, session_end_date, result_release_enabled, result_download_enabled, student_registration_open, enable_payments, fee_reminder_days_before_due, email_notifications_enabled, sms_notifications_enabled, paystack_webhook_url, maintenance_mode, auto_backup_enabled, backup_time, session_timeout, max_upload_size, enable_two_factor } = body

    const { data: existingSettings } = await supabase
      .from('settings')
      .select('id')
      .single()

    let result
    if (existingSettings?.id) {
      result = await supabase
        .from('settings')
        .update({
          school_name,
          school_code,
          principal_email,
          school_phone,
          school_address,
          website,
          current_session,
          current_term,
          session_start_date,
          session_end_date,
          result_release_enabled,
          result_download_enabled,
          student_registration_open,
          enable_payments,
          fee_reminder_days_before_due,
          email_notifications_enabled,
          sms_notifications_enabled,
          paystack_webhook_url,
          maintenance_mode,
          auto_backup_enabled,
          backup_time,
          session_timeout,
          max_upload_size,
          enable_two_factor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSettings.id)
    } else {
      result = await supabase
        .from('settings')
        .insert({
          school_name,
          school_code,
          principal_email,
          school_phone,
          school_address,
          website,
          current_session,
          current_term,
          session_start_date,
          session_end_date,
          result_release_enabled,
          result_download_enabled,
          student_registration_open,
          enable_payments,
          fee_reminder_days_before_due,
          email_notifications_enabled,
          sms_notifications_enabled,
          paystack_webhook_url,
          maintenance_mode,
          auto_backup_enabled,
          backup_time,
          session_timeout,
          max_upload_size,
          enable_two_factor,
          created_at: new Date().toISOString(),
        })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: result.data })
  } catch (error: any) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
