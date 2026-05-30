# VedaAI Assignment Creator
A full‑stack web application that lets teachers generate AI‑powered assignment papers from uploaded PDFs or plain text. The UI is built with **React (Next.js)**, vanilla CSS, and a sleek modern design (glassmorphism, subtle animations). The backend runs on **Node.js + Express** and uses **BullMQ** for background job processing.

📦 Project Structure
```
VedaAI-Assignment-Creator/
├─ backend/                 # Express server, assignment routes, BullMQ workers
│   ├─ assignments.js       # Handles file upload, builds prompt, calls LLM
│   └─ server.js            # Starts HTTP & WebSocket server
├─ frontend/                # Next.js React app
│   ├─ components/          # UI components
│   │   ├─ AssignmentsList.tsx   # Lists generated assignments (green active status badge)
│   │   └─ CreateAssignmentForm.tsx  # Form + header with custom green status badge
│   ├─ pages/               # Next.js page routing (index, etc.)
│   └─ styles/              # Global CSS, design tokens
├─ .gitignore               # Ignored files for Node/Next.js projects
└─ README.md                # ⇐ You are reading it now!
```
---
## 🚀 Getting Started (Local Development)
1. **Clone the repo** (you already have it).
2. **Install dependencies**:
   ```bash
   cd backend && npm install   # server deps
   cd ../frontend && npm install   # Next.js deps
   ```
3. **Run the services** (in separate terminals):
   ```bash
   # Backend (REST + WebSocket on port 3001)
   cd backend && npm start
   # Frontend (Next dev server on port 3000)
   cd frontend && npm run dev
   ```
4. Open <http://localhost:3000> in a browser.
---
## 🛠️ Core Features
- **PDF / Text Upload** – Drag‑and‑drop or browse to select a source document.
- **Dynamic Prompt Generation** – Combines assignment metadata (due date, school, class, etc.) with an LLM prompt.
- **Background Job Queue** – Uses BullMQ to off‑load heavy LLM calls; UI shows a real‑time progress overlay.
- **Assignments List** – Shows each generated assignment with:
  - Title (clickable → opens the question‑paper view)
  - Assigned / Due dates
  - **Green active status badge** (nested circles) – appears **only on the newest assignment** (`assignments[0]`).
- **Create Assignment Header** – Mirrors the same green badge for visual consistency.
- **Responsive Design** – Mobile & desktop layouts, glass‑like cards, subtle hover animations.
---
## 🎨 Design System
- **Colors** – Custom palette; primary green `#4BC26D` with background `#CFEED8` for the active badge.
- **Typography** – Google Font **Inter** (fallback: system UI).
- **Components** – All UI elements live in `frontend/components/` and use reusable CSS classes defined in `frontend/styles/`.
- **Micro‑animations** – Hover scaling on cards, progress‑bar transitions, spinner spin.
---
## 📁 Important Files & Logic
| File | Purpose |
|------|---------|
| `frontend/components/AssignmentsList.tsx` | Renders assignment cards; conditional green badge shown only for the first item (`assignment.id === assignments[0]?.id`). |
| `frontend/components/CreateAssignmentForm.tsx` | Form for uploading a file and setting metadata; header now contains the same nested‑circle badge (`bg-[#CFEED8]` → inner `bg-[#4BC26D]`). |
| `backend/assignments.js` | Handles multipart/form‑data, builds the prompt, talks to the LLM, stores the generated assignment, and emits WebSocket events. |
| `backend/server.js` | Express + Socket.io entry point; creates BullMQ queue and workers. |
---
## 🧪 Testing
- **Frontend** – Run `npm run dev` and interact with the UI. The progress overlay (`GenerationOverlay`) visualises each step defined in `GENERATION_STEPS`.
- **Backend** – Use Postman or `curl`:
  ```bash
  curl -F "file=@sample.pdf" -F "prompt=Generate..." http://localhost:3001/assignments
  ```
  Expect a JSON response containing the assignment object.
---
## 📦 Deployment
1. **Build the frontend**:
   ```bash
   cd frontend && npm run build   # creates .next output
   ```
2. **Start the backend in production** (ensure environment variables are set, e.g., `PORT`, `REDIS_URL`).
3. Serve the built Next.js app with a Node server or Vercel.
The `.gitignore` already excludes build artefacts, `node_modules`, logs, env files, and temporary uploads.
---
## 🛡️ Future Work (Roadmap)
- Add unit/integration tests (Jest & React Testing Library).
- Implement authentication & per‑teacher assignment storage.
- Extend the status badge logic to support multiple "active" assignments based on custom criteria.
- Optimize PDF parsing (currently a placeholder).
---
## 🙏 Contributing
1. Fork the repo.
2. Create a feature branch.
3. Submit a pull request with a clear description of changes.
4. Ensure `npm run lint` passes (pre‑commit hook can be set up).
---
## 📜 License
MIT – feel free to use, modify, and share.
---
*Happy coding! 🚀*
