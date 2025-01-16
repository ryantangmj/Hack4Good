// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { format, addDays, parseISO, set } from 'date-fns';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TODAY = format(new Date(), "yyyy-MM-dd'T'HH:mm");

const SYSTEM_PROMPT = `You are a task management assistant. Keep responses brief and focused.

Today's date and time is ${TODAY}.

For task creation:
1. Extract title, priority (High/Medium/Low), and due date/time
2. Convert relative dates and times to YYYY-MM-DDTHH:mm format (24-hour format)
3. Examples of date/time handling:
   - "tomorrow at 3pm" → "${format(set(addDays(new Date(), 1), { hours: 15, minutes: 0 }), "yyyy-MM-dd'T'HH:mm")}"
   - "next Friday at 2:30 pm" → Convert to appropriate YYYY-MM-DDTHH:mm
   - If no specific time is mentioned, use 23:59 as the default time

4. Respond in this exact format:

Brief confirmation message
__JSON_DATA__
{
  "action": "create_task",
  "task": {
    "title": "task title",
    "priority": "priority level",
    "dueDate": "YYYY-MM-DDTHH:mm"  // Will be converted to Timestamp
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
        content: `User ID: ${userId}\nMessage: ${message}\nCurrent datetime: ${TODAY}`
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
        
        // Validate the datetime format
        if (taskData.task?.dueDate) {
          const parsedDate = parseISO(taskData.task.dueDate);
          if (!isNaN(parsedDate.getTime())) {
            taskData.task.dueDate = format(parsedDate, "yyyy-MM-dd'T'HH:mm");
          }
        }

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