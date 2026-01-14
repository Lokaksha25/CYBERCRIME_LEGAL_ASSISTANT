# 🎨 Frontend – Cybercrime Legal Assistant

<div align="center">

![React](https://img.shields.io/badge/react-18.0+-61dafb.svg)
![Vite](https://img.shields.io/badge/vite-5.0+-646cff.svg)
![Tailwind](https://img.shields.io/badge/tailwind-3.0+-38bdf8.svg)

**A modern, responsive chat interface for AI-powered legal assistance**

</div>

---

## 📋 Table of Contents

- Overview
- Features
- Tech Stack
- Folder Structure
- Getting Started
- Configuration
- Available Scripts
- Development
- Building for Production
- Notes

---

## 🎯 Overview

The frontend provides a clean, intuitive chat-based interface that enables users to:
- Submit cybercrime-related legal queries
- Receive **case-grounded responses** from the RAG backend
- View source citations and legal references
- Browse chat history with persistent storage
- Toggle between dark and light themes

---

## ✨ Features

### User Interface
- 💬 **Real-time Chat**: Smooth, responsive chat experience
- 🎨 **Modern Design**: Clean UI with Tailwind CSS
- 🌓 **Theme Toggle**: Dark and light mode support
- 📱 **Responsive**: Works seamlessly on desktop, tablet, and mobile

### User Experience
- 📚 **Chat History**: Persistent local storage of conversations
- 🔍 **Source Citations**: Display legal references with each response
- ⚡ **Fast Loading**: Optimized with Vite for quick load times
- 🎯 **Quick Questions**: Pre-populated example queries

### Technical
- 🔌 **API Integration**: RESTful communication with backend
- 🎭 **Component-based**: Modular React architecture
- 🎨 **Tailwind CSS**: Utility-first styling
- 📦 **Code Splitting**: Optimized bundle sizes

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.0+ | UI framework |
| **Vite** | 5.0+ | Build tool & dev server |
| **Tailwind CSS** | 3.0+ | Utility-first CSS framework |
| **Lucide React** | Latest | Icon library |
| **React Router** | 6.0+ | Client-side routing |
| **Axios** | Latest | HTTP client for API calls |

---

## 📁 Project Structure

```
frontend/
│
├── src/
│   ├── api/
│   │   └── Client.js              # API client configuration & methods
│   │
│   ├── components/
│   │   ├── Message.jsx            # Chat message component
│   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   ├── Header.jsx             # App header
│   │   └── LoadingSpinner.jsx    # Loading indicator
│   │
│   ├── pages/
│   │   ├── Chat.jsx               # Main chat interface
│   │   └── Landing.jsx               # Landing page
│   │          
│   │
│   ├── hooks/
│   │   ├── useChat.js             # Chat state management
│   │   └── useTheme.js            # Theme management
│   │
│   ├── utils/
│   │   ├── storage.js             # LocalStorage helpers
│   │   └── constants.js           # App constants
│   │
│   ├── styles/
│   │   └── index.css              # Global styles & Tailwind imports
│   │
│   ├── App.jsx                    # Main app component & routing
│   └── main.jsx                   # App entry point
│
├── public/
│   ├── favicon.ico
│   └── logo.svg
│
├── index.html                     # HTML template
├── package.json                   # Dependencies & scripts
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind configuration
├── postcss.config.js              # PostCSS configuration
└── .env.example                   # Environment variables template

```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- Backend API running (see [Backend README](../backend/README.md))

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure API endpoint:**
   Edit `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   ```
   http://localhost:5173
   ```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the frontend root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# App Configuration
VITE_APP_TITLE=Cybercrime Legal Assistant
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_CHAT_HISTORY=true
```

### API Client Configuration

Edit `src/api/Client.js` to customize API behavior:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default apiClient;
```

### Tailwind Customization

Modify `tailwind.config.js` for custom theme:

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
      },
    },
  },
  plugins: [],
};
```

---

## 📜 Available Scripts

### Development

```bash
# Start development server with hot reload
npm run dev

# Start with custom port
npm run dev -- --port 3000

# Start with network access
npm run dev -- --host
```

### Building

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format
```

### Testing

```bash
# Run tests (if configured)
npm run test

# Run tests with coverage
npm run test:coverage
```

---

## 💻 Development

### Running in Development Mode

1. **Ensure backend is running:**
   ```bash
   # In backend directory
   python main.py
   ```

2. **Start frontend dev server:**
   ```bash
   # In frontend directory
   npm run dev
   ```

3. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

### Hot Module Replacement (HMR)

Vite provides instant HMR. Changes to React components will reflect immediately without full page reload.

### Browser DevTools

Recommended extensions:
- **React Developer Tools** - Inspect React component tree
- **Redux DevTools** - If using Redux (future enhancement)

---

## 🏗️ Building for Production

### Create Production Build

```bash
npm run build
```

This generates optimized files in the `dist/` directory:
- Minified JavaScript bundles
- Optimized CSS
- Compressed assets
- Source maps (for debugging)

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally at `http://localhost:4173`

### Deployment Options

#### Option 1: Static Hosting (Netlify, Vercel)

```bash
# Build
npm run build

# Deploy dist/ folder to your hosting service
```

#### Option 2: Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Option 3: Traditional Server

Copy `dist/` contents to web server root (Apache, Nginx)

---

## 🔌 Backend Dependency

### API Communication

The frontend communicates with the backend via RESTful API calls.

**API Base URL Configuration:**
- Located in: `src/api/Client.js`
- Environment variable: `VITE_API_BASE_URL`
- Default: `http://localhost:5000/api`

### Required Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ask` | POST | Submit query and get response |
| `/health` | GET | Check backend status |
| `/history` | GET | Retrieve chat history (future) |

**Example API Call:**
```javascript
import api from './api/Client';

const response = await api.post('/ask', {
  question: "What are the penalties for phishing?",
  top_k: 5
});
```

---

## 📌 Notes

### Current Limitations

- ⚠️ **No Authentication**: User sessions are not implemented
- 💾 **Local Storage Only**: Chat history stored in browser (not synced)
- 🔒 **No Data Encryption**: Sensitive queries are not encrypted in transit (use HTTPS in production)
- 👤 **Single User**: No multi-user support

### Browser Compatibility

Tested and supported on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Performance Considerations

- Initial load time: ~1-2 seconds
- API response time: 2-5 seconds (depending on backend)
- Chat history limited to 50 conversations (configurable)

### Future Enhancements

- [ ] User authentication & sessions
- [ ] Cloud-synced chat history
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Export chat as PDF
- [ ] Dark mode auto-detection based on system preferences

---

## 🐛 Troubleshooting

### Common Issues

**Issue: `npm run dev` fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: API calls failing**
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Verify VITE_API_BASE_URL in .env
cat .env
```

**Issue: Styling not applied**
```bash
# Rebuild Tailwind
npm run build:css
```



<div align="center">


Built with React + Vite 

</div>