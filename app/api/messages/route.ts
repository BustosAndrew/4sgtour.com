import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const inquiryId = searchParams.get('inquiryId');

  if (!inquiryId) {
    return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
  }

  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { inquiryId, messageText, isAdmin, senderName, senderEmail } = body;

    if (!inquiryId || !messageText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        inquiry_id: inquiryId,
        sender_id: user.id,
        sender_email: senderEmail || user.email,
        sender_name: senderName || user.email,
        is_admin: isAdmin || false,
        message_text: messageText,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send email notification
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Get inquiry details for context
      const { data: inquiry } = await supabase
        .from('inquiries')
        .select('trip_title, customer_name, customer_email')
        .eq('id', inquiryId)
        .single();

      if (inquiry) {
        if (isAdmin) {
          // Admin sent message -> notify customer
          const emailContent = `
Hello ${inquiry.customer_name},

You have received a new message regarding your inquiry for "${inquiry.trip_title}".

Message from Admin:
${messageText}

---
Log in to your account to view the full conversation and reply.
          `.trim();

          await resend.emails.send({
            from: 'Golf Trips <noreply@yourdomain.com>',
            to: inquiry.customer_email,
            subject: `New Message: ${inquiry.trip_title}`,
            text: emailContent,
          });
        } else {
          // Customer sent message -> notify admin
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

          const emailContent = `
New message from ${senderName || user.email} regarding "${inquiry.trip_title}".

Customer: ${inquiry.customer_name} (${inquiry.customer_email})

Message:
${messageText}

---
Log in to the admin dashboard to view and respond.
          `.trim();

          await resend.emails.send({
            from: 'Golf Trips <noreply@yourdomain.com>',
            to: adminEmail,
            subject: `New Customer Message: ${inquiry.trip_title}`,
            text: emailContent,
          });
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Error sending notification email:', emailError);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 },
    );
  }
}
