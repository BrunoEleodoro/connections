const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve frontend as static files
app.use(express.static(path.resolve(__dirname, '../frontend')));

app.use(cors());

// POST /api/chat - forwards message and contacts to OpenRouter API
app.post('/api/chat', async (req, res) => {
  const { message, contacts } = req.body;
  // TODO: Replace with your OpenRouter API key
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'YOUR_API_KEY_HERE';

  try {
    // Compose prompt with contacts context
    const prompt = `Contacts: ${JSON.stringify(contacts)}\nUser: ${message}`;
    // Call OpenRouter API (example endpoint, adjust as needed)
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an event assistant AI. Answer based on the provided contacts.' },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const aiMessage = response.data.choices[0].message.content;
    res.json({ aiMessage });
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Fallback: serve index.html for any unknown route (SPA support)
app.use(/(.*)/, (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
