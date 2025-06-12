import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { openRouter } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    // Get the current user
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { messages, model = 'openai/gpt-3.5-turbo', chatId } = await request.json();

    // Call OpenRouter API
    const completion = await openRouter.chat.completions.create({
      model,
      messages,
    });

    const assistantMessage = completion.choices[0]?.message;

    // If a chatId was provided, update the chat in the database
    if (chatId) {
      // Get the current chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .single();

      if (chatError) {
        console.error('Error fetching chat:', chatError);
      } else if (chat) {
        // Update the chat with the new messages
        const updatedMessages = [
          ...chat.messages,
          messages[messages.length - 1], // Add the user message
          assistantMessage // Add the assistant response
        ];

        const { error: updateError } = await supabase
          .from('chats')
          .update({
            messages: updatedMessages,
            updated_at: new Date()
          })
          .eq('id', chatId);

        if (updateError) {
          console.error('Error updating chat:', updateError);
        }
      }
    }

    // Return the assistant's response
    return NextResponse.json(assistantMessage);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}