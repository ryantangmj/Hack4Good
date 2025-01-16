// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { format, addDays } from 'date-fns';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TODAY = format(new Date(), 'yyyy-MM-dd');

const SYSTEM_PROMPT = `You are a task management assistant. Keep responses brief and focused.

Today's date is ${TODAY}.

For task creation:
1. Extract title, priority (High/Medium/Low), and due date
2. Convert relative dates to YYYY-MM-DD format
3. Respond in this exact format:

Brief confirmation message
__JSON_DATA__
{
  "action": "create_task",
  "task": {
    "title": "task title",
    "priority": "priority level",
    "dueDate": "YYYY-MM-DD"
  }
}

For other queries, provide short, helpful responses.`;

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json();

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `User ID: ${userId}\nMessage: ${message}\nToday: ${TODAY}`
      }]
    });

    const reply = response.content[0].type === 'text' 
      ? response.content[0].text
      : 'Sorry, I can only process text responses.';
    
    const parts = reply.split('__JSON_DATA__');
    const hasJsonData = parts.length > 1;
    
    if (hasJsonData) {
      try {
        const conversationalPart = parts[0].trim();
        const jsonStr = parts[1].trim();
        const taskData = JSON.parse(jsonStr);
        
        return NextResponse.json({
          reply: conversationalPart,
          taskData,
          needsConfirmation: true
        });
      } catch (e) {
        return NextResponse.json({ reply });
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}