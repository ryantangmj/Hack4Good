import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { format, addDays, parseISO, set } from 'date-fns';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TODAY = format(new Date(), "yyyy-MM-dd'T'HH:mm");

const SYSTEM_PROMPT = `You are an AI assistant that helps manage tasks and meetings. Keep responses brief and focused.

Today's date and time is ${TODAY}.

You can:
1. Create tasks with priority and due date/time
2. Schedule meetings with title, time, participants, and agenda

For tasks, respond with:
__JSON_DATA__
{
  "action": "create_task",
  "task": {
    "title": "task title",
    "priority": "High/Medium/Low",
    "dueDate": "YYYY-MM-DDTHH:mm",
    "participants": [] // Leave empty, will be filled with current user
  }
}

For meetings, respond with:
__JSON_DATA__
{
  "action": "create_meeting",
  "meeting": {
    "title": "meeting title",
    "time": "YYYY-MM-DDTHH:mm",
    "participants": [],
    "agenda": "meeting agenda"
  }
}

When interpreting dates/times:
- Use exactly "YYYY-MM-DDTHH:mm" format (as used by datetime-local input)
- For "tomorrow at 3pm" → "${format(set(addDays(new Date(), 1), { hours: 15, minutes: 0 }), "yyyy-MM-dd'T'HH:mm")}"
- If no specific time mentioned for tasks, use 23:59
- Always include a time for meetings

First respond conversationally explaining what you understood, then include the JSON block.`;

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
        const data = JSON.parse(jsonStr);
        
        // Ensure dates are in the correct format
        if (data.action === 'create_task' && data.task?.dueDate) {
          try {
            const parsedDate = parseISO(data.task.dueDate);
            data.task.dueDate = format(parsedDate, "yyyy-MM-dd'T'HH:mm");
          } catch (e) {
            console.error('Error parsing task date:', e);
          }
        } else if (data.action === 'create_meeting' && data.meeting?.time) {
          try {
            const parsedDate = parseISO(data.meeting.time);
            data.meeting.time = format(parsedDate, "yyyy-MM-dd'T'HH:mm");
          } catch (e) {
            console.error('Error parsing meeting date:', e);
          }
        }

        return NextResponse.json({
          reply: conversationalPart,
          data,
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