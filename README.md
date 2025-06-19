# Connections Backend

This is the backend component of the **Connections** hackathon project. It provides the server-side logic and API endpoints for the application, and serves a frontend located in the `frontend/` subdirectory.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Frontend](#frontend)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

**Connections** is a hackathon project designed to demonstrate rapid prototyping of a full-stack web application. The backend is built with Node.js and Express, serving both API endpoints and static frontend files.

## Features

- RESTful API endpoints (see below)
- Serves static frontend files
- QR code generation (see `QRCODE_LIB_DOCS.md` in frontend)
- Easy local development and deployment

## Tech Stack

- **Node.js** (JavaScript runtime)
- **Express** (Web framework)
- **Frontend:** HTML, CSS, JavaScript (served from `/backend/frontend`)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd connections/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   node index.js
   ```
   The server will start on the default port (see `index.js` for details).

4. **Access the frontend:**
   Open your browser and navigate to [http://localhost:PORT/](http://localhost:PORT/) (replace `PORT` with the port specified in `index.js`).

## Project Structure

```
backend/
  ├── frontend/           # Frontend static files (HTML, CSS, JS)
  ├── index.js            # Main server file (Express app)
  ├── package.json        # Project metadata and scripts
  ├── package-lock.json   # Dependency lock file
  └── .gitignore
```

## API Endpoints

> **Note:** For detailed API documentation, see inline comments in `index.js`.

- `GET /`  
  Serves the main frontend page.

- `GET /api/...`  
  (Add your API endpoints here as you implement them.)

- (Add more endpoints as needed.)

## Frontend

The frontend is located in the `frontend/` directory and is served statically by the backend.  
Key files:
- `index.html` — Main entry point
- `config.html` — Configuration page
- `src/js/` — JavaScript source files
- `src/css/` — CSS styles
- `QRCODE_LIB_DOCS.md` — Documentation for QR code library

## Contributing

Pull requests and suggestions are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is for hackathon/demo purposes.

---