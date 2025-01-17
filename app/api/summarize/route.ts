import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI assistant that analyzes email threads and extracts key information. For each analysis:

1. Provide a brief summary of the email thread
2. Identify any potential tasks that need to be created
3. Identify any meetings that need to be scheduled

For tasks, ensure they match this exact interface:
interface Task {
  title: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  dueDate: string; // Format must be exactly "YYYY-MM-DDTHH:mm"
  userId: string;
  participants: string[];
  extracted_from: string;
}

Format your response as:

Brief summary of the thread content
__JSON_DATA__
{
  "summary": "concise summary here",
  "tasks": [
    {
      "title": "task description",
      "priority": "High",  // Must be exactly "High", "Medium", or "Low"
      "completed": false,
      "dueDate": "2025-02-01T14:44", // Format must be exactly "YYYY-MM-DDTHH:mm"
      "participants": ["email1@example.com", "email2@example.com"],
      "extracted_from": "relevant email quote"
    }
  ],
  "meetings": [
    {
      "title": "meeting title",
      "time": "2025-02-01T14:44", // Format must be exactly "YYYY-MM-DDTHH:mm"
      "participants": ["email1@example.com", "email2@example.com"],
      "agenda": "meeting purpose",
      "extracted_from": "relevant email quote"
    }
  ]
}

Important:
- For participants array:
  - Include all email addresses mentioned in the task context
  - Include relevant participants from the thread participants list
  - Include the sender's email for tasks they are involved in
  - Include any mentioned assignees or stakeholders
- Dates MUST be in exactly "YYYY-MM-DDTHH:mm" format, matching the datetime-local input format
- Priority must be exactly "High", "Medium", or "Low"
- completed must be false for new tasks
- Use empty string for dueDate/time if not specified in the email`;

export async function POST(request: Request) {
  try {
    const { messages, subject, participants } = await request.json();
    
    // Format the email thread for analysis
    const emailThread = messages.map((msg: any) => 
      `From: ${msg.sender}
       Time: ${new Date(msg.timestamp.seconds * 1000).toISOString().slice(0, 16)}
       Content: ${msg.text}\n`
    ).join('\n---\n');

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Subject: ${subject}
Thread Participants: ${participants?.join(', ')}
Please include all relevant participants from both the thread participants list and the email content when creating tasks.

Email Thread:\n${emailThread}`
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
        
        // Ensure tasks have all required fields and correct formats
        if (data.tasks) {
          data.tasks = data.tasks.map((task: any) => {
            // Ensure date is in YYYY-MM-DDTHH:mm format
            let dueDate = '';
            if (task.dueDate) {
              try {
                const date = new Date(task.dueDate);
                dueDate = date.toISOString().slice(0, 16);
              } catch (e) {
                console.error('Error formatting date:', e);
              }
            }

            return {
              title: task.title,
              priority: task.priority || "Medium",
              completed: false,
              dueDate,
              participants: task.participants || [],
              extracted_from: task.extracted_from
            };
          });
        }
        
        return NextResponse.json({
          summary,
          ...data
        });
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return NextResponse.json({ 
          summary, 
          error: 'Failed to parse structured data',
          details: e instanceof Error ? e.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in summarize API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process email thread',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}