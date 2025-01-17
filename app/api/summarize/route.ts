// app/api/summarize/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI assistant that analyzes email threads and extracts key information. For each analysis:

1. Provide a brief summary of the email thread
2. Identify any potential tasks that need to be created
3. Identify any meetings that need to be scheduled

Format your response as:

Brief summary of the thread content
__JSON_DATA__
{
  "summary": "concise summary here",
  "tasks": [
    {
      "title": "task description",
      "priority": "High/Medium/Low",
      "dueDate": "YYYY-MM-DDTHH:mm",
      "extracted_from": "relevant email quote"
    }
  ],
  "meetings": [
    {
      "title": "meeting title",
      "time": "YYYY-MM-DDTHH:mm",
      "participants": ["email1", "email2"],
      "agenda": "meeting purpose",
      "extracted_from": "relevant email quote"
    }
  ]
}

Use null for dueDate/time if not specified in the email.`;

export async function POST(request: Request) {
  try {
    const { messages, subject } = await request.json();
    
    // Format the email thread for analysis
    const emailThread = messages.map((msg: any) => 
      `From: ${msg.sender}
       Time: ${new Date(msg.timestamp.seconds * 1000).toISOString()}
       Content: ${msg.text}\n`
    ).join('\n---\n');

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Subject: ${subject}\n\nEmail Thread:\n${emailThread}`
      }]
    });

    const reply = response.content[0].type === 'text' 
      ? response.content[0].text
      : 'Unable to process the email thread.';
    
    const parts = reply.split('__JSON_DATA__');
    const summary = parts[0].trim();
    
    if (parts.length > 1) {
      try {
        const data = JSON.parse(parts[1].trim());
        return NextResponse.json({
          summary,
          ...data
        });
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return NextResponse.json({ summary, error: 'Failed to parse structured data' });
      }
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in summarize API:', error);
    return NextResponse.json(
      { error: 'Failed to process email thread' },
      { status: 500 }
    );
  }
}