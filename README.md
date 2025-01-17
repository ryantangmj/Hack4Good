
# Digital PA System

A cost-effective digital Personal Assistant (PA) system designed to help administrators efficiently arrange and schedule meetings, automate tasks, send follow-up reminders, generate summaries of email threads, and more.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
  - [Dashboard](#dashboard)
  - [Meetings](#meetings)
  - [Tasks](#tasks)
  - [Email Analytics](#email-analytics)
  - [AI Assistant](#ai-assistant)
- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Introduction

This web application was developed as a solution for the Hack4Good Hackathon. The goal was to create a cost-effective digital PA system that streamlines administrative tasks, making it easier for administrators to manage their schedules, tasks, and communications efficiently.

## Features

### Dashboard

The dashboard provides users with an overview of their:

- **Upcoming Tasks**: View and manage tasks that need to be completed.
- **Meetings**: See all scheduled meetings at a glance.
- **Emails**: Access recent email threads and summaries.
- **AI Assistant**: Quick access to the AI-powered chatbot for assistance.

### Meetings

The meeting module allows users to:

- **Organize Meetings**: Schedule meetings by selecting participants, date, and time.
- **Arrange Meetings with Availability Matching**:
  - **Invite Participants**: Send meeting invites requesting participants to input their available times.
  - **Automatic Scheduling**: The system finds the earliest common available time based on participants' inputs and schedules the meeting.
- **Manage Meetings**:
  - **Edit Meetings**: Modify meeting details as needed.
  - **Delete Meetings**: Cancel meetings if necessary.
- **View Upcoming Meetings**: Keep track of all scheduled meetings in one place.

### Tasks

The tasks module helps users:

- **Create Tasks**: Input tasks that need to be accomplished.
- **Manage Tasks**:
  - **Edit Tasks**: Update task details.
  - **Delete Tasks**: Remove tasks that are no longer needed.
- **Track Progress**: Mark tasks as completed to monitor productivity.

### Email Analytics

Enhance email communications with:

- **Start New Email Threads**: Compose and send emails directly within the app.
- **Summarize Email Threads**:
  - **One-Click Summaries**: Generate concise summaries of lengthy email threads at any point.
  - **Better Understanding**: Quickly grasp the key points without reading through entire conversations.

### AI Assistant

An intelligent assistant that:

- **Chatbot Functionality**: Interact through natural language to get assistance.
- **Schedule Meetings via Chat**: Prompt the AI assistant to schedule meetings, and it will handle the scheduling process.
- **Task Automation**: Use prompts to add tasks or set reminders.

## Installation

To set up the application locally:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/ryantangmj/Hack4Good.git
   ```

2. **Navigate to the Project Directory**:

   ```bash
   cd Hack4Good
   ```

3. **Install Dependencies**:

   ```bash
   npm install
   ```

4. **Configure Environment Variables**:

   Create a `.env` file in the root directory and add the necessary configuration settings as described in the [Environment Variables](#environment-variables) section below.

5. **Run the Application**:

   ```bash
   npm start
   ```

6. **Access the Application**:

   Open your web browser and navigate to `http://localhost:3000`.

## Usage

- **Dashboard**:

  - Access an overview of all your tasks, meetings, emails, and the AI assistant.

- **Meetings**:

  - **Organize a Meeting**: Go to the Meetings page and fill in the meeting details.
  - **Arrange a Meeting with Availability Matching**:
    - Send out invites to participants.
    - Participants input their available times on the Invites page.
    - The system schedules the meeting at the earliest common available time.
  - **Manage Meetings**: Edit or delete meetings as needed.
  - **View Meetings**: See all upcoming meetings on your Meetings page.

- **Tasks**:

  - Navigate to the Tasks page to input and manage your tasks.
  - Mark tasks as completed once done.

- **Email Analytics**:

  - Start new email threads or continue existing ones.
  - Click the "Summarize" button within any email thread to generate a summary.

- **AI Assistant**:

  - Access the assistant from the dashboard or any page.
  - Use natural language prompts to schedule meetings, add tasks, or get assistance.

## Environment Variables

The application requires certain environment variables to function correctly. These variables are used for configuring Firebase services and the AI assistant.

Create a `.env` file in the root directory of your project and add the following variables:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
```

**Note**: Replace `YOUR_FIREBASE_API_KEY`, `YOUR_FIREBASE_AUTH_DOMAIN`, etc., with your actual Firebase and Anthropic API credentials.

### Obtaining the Environment Variables

- **Firebase Configuration**:
  - Sign up for a [Firebase](https://firebase.google.com/) account if you haven't already.
  - Create a new Firebase project.
  - Navigate to your project settings and find the Firebase SDK configuration. Use the values provided there for your environment variables.
  
- **Anthropic API Key**:
  - Sign up for an account with [Anthropic](https://www.anthropic.com/).
  - Obtain your API key from the dashboard.
  
**Security Warning**: Never commit your actual API keys or sensitive credentials to version control or share them publicly. The `.env` file should be added to your `.gitignore` file to prevent it from being committed.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- **Hack4Good Hackathon**: For providing the opportunity and platform to develop this project.
- **Team Members**: Collaborators who contributed their time and skills.
- **Open Source Community**: For the tools and libraries that made development possible.

---

*Disclaimer*: This project uses API keys and services that require secure handling. Ensure that all sensitive information is kept secure and not exposed publicly.
