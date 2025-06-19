# Connections – Telegram Mini App Specification

## Overview

**Project Name:** Connections

**Description:** A Telegram Web App built in Vanilla JavaScript that enables crypto conference attendees to share contact profiles via QR codes, capture conversation notes, automatically structure insights with AI, and export follow-ups to Notion or other task managers.

**Goals:**

* Simplify contact exchange and note-taking at events
* Leverage AI for instant summarization, tagging, and action-item extraction
* Seamlessly integrate with Notion, Trello, or Asana for structured follow-up

---

## Table of Contents

1. [User Flow](#user-flow)
2. [Technical Architecture](#technical-architecture)
3. [Project Structure](#project-structure)
4. [AI Integration](#ai-integration)
5. [API Endpoints](#api-endpoints)
6. [Data Models](#data-models)
7. [Color Scheme & Theming](#color-scheme--theming)
8. [Vanilla JS Guidelines](#vanilla-js-guidelines)
9. [UI/UX Considerations](#uiux-considerations)
10. [Next Steps for AI Agent](#next-steps-for-ai-agent)

---

## User Flow

1. **Launch App**: User opens the "Connections" Web App via Telegram.
2. **Login**: Authenticate with Telegram to retrieve user ID and profile info.
3. **Share QR Code**: Display personal QR code encoding `user_id` + session token.
4. **Scan QR**: Use the camera API to scan another attendee’s QR code.
5. **Note Capture**: Immediately open a note interface (text and optional voice).
6. **AI Summarization**: Send raw notes to AI for:

   * Topic extraction
   * Action-item tagging
   * Metadata (company, title)
7. **Review & Edit**: Present structured summary for user confirmation.
8. **Export**: Push structured record to Notion/Trello/Asana via OAuth.

---

## Technical Architecture

```mermaid
flowchart TD
  A[Telegram Web App (Vanilla JS)] --> B[Telegram Bot API]
  A --> C[QR Scanner Module]
  A --> D[Notes Interface]
  D --> E[AI Service (OpenAI GPT)]
  E --> F[Backend API]
  F --> G[Database (MongoDB/Postgres)]
  F --> H[OAuth & Export Service]
  H --> I[Notion/Trello/Asana APIs]
```

* **Frontend:** Vanilla JavaScript, HTML5, CSS3, Telegram Web App SDK
* **Backend:** Node.js + Express or Fastify (in a separate service)
* **Database:** MongoDB or PostgreSQL for storing users, notes, summaries
* **AI:** OpenAI GPT endpoints
* **Integration:** OAuth for Notion, Trello, Asana

---

## Project Structure

```text
/ (root)
├── public/
│   └── index.html          # Web App entrypoint
├── src/
│   ├── js/
│   │   ├── app.js          # Core logic & Telegram SDK init
│   │   ├── qrScanner.js    # QR code scanning module
│   │   ├── notes.js        # Note-taking UI & events
│   │   └── export.js       # OAuth flow & export handlers
│   ├── css/
│   │   └── theme.css       # Color scheme & styles
│   └── assets/             # Icons, fonts, images
├── server/
│   ├── index.js            # Express server
│   ├── controllers/        # API logic
│   ├── routes/             # REST endpoints
│   ├── services/
│   │   ├── aiService.js    # OpenAI API integration
│   │   └── oauthService.js # Notion/Trello/Asana SDKs
│   └── models/             # DB schemas
└── README.md
```

---

## AI Integration

**Key Components:**

* **Prompt Template:**

  ```text
  "Extract:
  1. Top 3 topics,
  2. 2 follow-up action items,
  3. Metadata (company, title)
  from the following notes:
  {{raw_notes}}"
  ```

* **Endpoints:**

  * `POST /summarize` → calls OpenAI with prompt → returns structured JSON

---

## API Endpoints

| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| POST   | `/scan`          | Save scanned connection and raw notes    |
| POST   | `/summarize`     | AI summarization of raw notes            |
| GET    | `/connections`   | List all connections for user            |
| POST   | `/export`        | Export structured record to external API |
| GET    | `/auth/:service` | OAuth redirect for Notion/Trello/Asana   |

---

## Data Models

**Connection Document (MongoDB)**

```js
{
  user_id: String,
  connection_id: String,
  raw_notes: String,
  summary: {
    topics: [String],
    actions: [String],
    metadata: { company: String, title: String }
  },
  created_at: Date
}
```

---

## Color Scheme & Theming

Base your CSS theme on a modern, crypto-friendly palette:

| Role           | Hex       | Usage                    |
| -------------- | --------- | ------------------------ |
| Primary        | `#1D4ED8` | Buttons, links, accents  |
| Secondary      | `#2563EB` | Hover states, highlights |
| Accent         | `#10B981` | Action items, tags       |
| Background     | `#F9FAFB` | Page background          |
| Surface        | `#FFFFFF` | Cards, panels            |
| Text Primary   | `#111827` | Main text                |
| Text Secondary | `#6B7280` | Subheadings, metadata    |
| Error          | `#EF4444` | Validation messages      |

Include these tokens in `src/css/theme.css` and reference in your components.

---

## Vanilla JS Guidelines

* **Modularize** each feature (scanner, notes, export) into ES6 modules.
* **Async/Await** for all network calls.
* **DOM Manipulation**: Use `document.createElement` and `appendChild` rather than innerHTML.
* **State Management**: Keep minimal global state in a simple store object.
* **Bundling:** Use Rollup or esbuild for bundling and minification.

---

## UI/UX Considerations

* Provide immediate AI feedback: show a loading skeleton while generating summary.
* Editable summary fields: allow inline editing before final save.
* Responsive design: ensure usability on both mobile and desktop.
* Offline caching: store unsynced notes in `localStorage`.

---

## Next Steps for AI Agent

1. **Scaffold Project:** Initialize folder structure, install dependencies:

   ```bash
   mkdir connections && cd connections
   npm init -y
   npm install express telegram-web-app-sdk qrcode
   ```
2. **Create HTML/CSS:** Set up `index.html` and `theme.css` with the color tokens.
3. **Implement QR Scanner:** Integrate a Vanilla JS QR library (e.g., `jsQR`).
4. **Build Note UI:** Create modules for capturing and displaying notes.
5. **AI Endpoint:** Stub `/summarize` route and integrate with OpenAI.
6. **OAuth Flow:** Set up Notion/Trello/Asana OAuth routes and token storage.
7. **Export Logic:** Map summary JSON to external API calls.

---

*This specification is ready for an AI coding agent to scaffold and implement the Connections mini app in Vanilla JavaScript.*
