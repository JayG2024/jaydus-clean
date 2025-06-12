import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { openRouter } from '@/lib/openrouter';
import { getUserByEmail, updateChat, createChat } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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
      // Update the chat with the new messages
      const updatedMessages = [
        ...messages,
        assistantMessage // Add the assistant response
      ];

      await updateChat(chatId, {
        messages: updatedMessages,
      });
    } else {
      // Create a new chat
      await createChat({
        userId: user.id,
        title: messages[0]?.content?.slice(0, 50) || 'New Chat',
        messages: [...messages, assistantMessage],
        model,
      });
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