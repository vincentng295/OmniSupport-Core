# OmniSupport-Core 🤖📞

OmniSupport-Core is a high-performance, full-stack Omnichannel Customer Support & Ticketing platform designed for modern call centers. It leverages asynchronous architectures, sub-second WebSocket communication, and Gemini AI auto-triaging to optimize support ticket dispatching and enhance real-time customer support workflows.

---

## The AI-Agent Collaborative Development Story

This project represents a modern engineering approach, built entirely through continuous **Human-AI Collaboration**. 

Using **Gemini (as a context-aware AI Coding Agent)**, the core architecture was co-designed, debugged, and optimized incrementally. From implementing fail-fast strict environment variables validation to resolving Tailwind v4's zero-configuration paradigm over Vite, this codebase stands as a testament to how elite developers utilize AI agents to accelerate cycle times, eliminate bottlenecks, and implement production-grade patterns (like Database Transactions alongside Distributed Redis queues) under a unified workflow.

---

## Core Tech Stack

- **Backend:** Node.js (NestJS Framework), TypeScript
- **Frontend:** React (Vite, TypeScript), TailwindCSS v4
- **Database & Cache:** PostgreSQL (TypeORM), Redis (BullMQ Engine)
- **Real-time Gateway:** WebSocket (Socket.io Architecture)
- **AI Integration:** Google Gemini API (`gemini-1.5-flash` for high-throughput classification)
- **Infrastructure:** Docker, Docker Compose

---

## Key Features & Architecture

### 1. Asynchronous Ticket Queueing & Auto-Routing
- **Transactional Consistency:** When a customer submits an issue, requests are bound inside database transactions ensuring strict sync across isolated `tickets` and `messages` tables.
- **BullMQ + Redis Pipeline:** Avoids synchronous HTTP blockages. Ticket IDs are instantly decoupled and pushed into a distributed Redis memory stream for background routing, telemetry, and automated agent distribution.

### 2. Live Gemini AI Auto-Tagging & Triaging
- The background pipeline nhặt tickets từ queue, hands them over to the **Gemini AI Engine**. 
- Using targeted engineering prompts, the AI autonomously classifies customer content into native boundaries: `[Bug]`, `[Billing]`, or `[Inquiry]`, shifting the status to `IN_PROGRESS` and updating DB telemetry contextually in real-time.

### 3. Bidirectional Real-time Chat Gateway
- Powered by NestJS WebSockets (`@nestjs/websockets` + Socket.io). It features dedicated multi-tenant room boundaries matching `ticketId` instances, supporting dynamic multi-role testing (Customer vs. Support Agent) across independent views with sub-second feedback loops.

### 4. Interactive Sandbox API Docs
- Fully integrated with **Swagger UI (OpenAPI Specification)** for sandbox validation, schema checks, and endpoint execution.

---

## Database Schema Design Overview

The persistence tier relies on an optimized relational mapping blueprint utilizing `UUID` keys for enterprise security:

```text
  [ tickets ] (1) <------- (N) [ messages ]
  - id (UUID, PK)              - id (UUID, PK)
  - title (Varchar)            - ticketId (UUID, FK)
  - description (Text)         - sender (Enum: CUSTOMER, AGENT, AI)
  - status (Enum)              - content (Text)
  - priority (Enum)            - createdAt (Timestamp)
  - aiTag (Varchar)
  - createdAt / updatedAt

```

---

## Step-by-Step Installation & Run Guide

Follow these steps to fork, install, configuration, and launch the complete stack from absolute scratch.

### Prerequisites

Ensure your local workspace has these engines installed globally:

* **Node.js** (v18 or higher recommended)
* **Git**
* **Docker & Docker Compose**

---

### 1. Fork and Clone the Repository

Fork this repository on GitHub to your account, then clone it locally:

```bash
git clone [https://github.com/YOUR_USERNAME/omnisupport-core.git](https://github.com/YOUR_USERNAME/omnisupport-core.git)
cd omnisupport-core

```

---

### 2. Infrastructure Configuration (Environment Variables)

Create a consolidated `.env` configuration file in the **root** folder of your cloned repository:

```bash
cp .env.example .env

```

Open the `.env` file and append your credentials along with your Gemini API key:

```env
# Database Credentials
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=omnisupport_db

# Redis Cache Configurations
REDIS_HOST=localhost
REDIS_PORT=6379

# Google Gemini API
GEMINI_API_KEY=AIzaSyYour_Actual_Gemini_API_Key_From_Google_Studio

```

---

### 3. Spin Up Docker Containers (Postgres & Redis)

Launch the isolated persistence layers using Docker Compose in detached mode:

```bash
docker compose up -d

```

*Verify containers are operating perfectly using `docker ps`.*

---

### 4. Setup and Run Backend (NestJS Engine)

Open a fresh terminal window, navigate into the backend module, install packages, and initiate the hot-reloading compilation pipeline:

```bash
# Move to backend folder
cd backend

# Install node dependencies
npm install

# Run the dev compiler
npm run start:dev

```

Once initialized, the service monitors the workspace port `3000`. You can access the sandbox:

* **Interactive Documentation Workspace (Swagger):** `http://localhost:3000/api/docs`

---

### 5. Setup and Run Frontend (React Dashboard)

Open a separate terminal instance, head to the frontend workspace, execute package installation, and launch Vite's live dev platform:

```bash
# Move to frontend folder
cd frontend

# Install node dependencies
npm install

# Launch Vite Dev Server
npm run dev

```

The interface launches on local port `5173`. Open your browser to:

* **Live Agent Dashboard Application:** `http://localhost:5173`

---

## 🔬 How to Test the Project Flow

1. Open **Swagger UI** (`http://localhost:3000/api/docs`) and hit the `POST /tickets` route.
2. Provide a mock JSON containing an implicit request issue, then execute:
```json
{
  "title": "Critical Payment failure",
  "messageContent": "I tried paying via credit card but the app crashed and threw a 500 error on checkout.",
  "priority": "HIGH"
}

```


3. Watch your **Backend Terminal logs**: You will see BullMQ handling the job asynchronously, requesting Gemini AI analysis, and resolving the tag assignment down to database state files.
4. Execute `GET /tickets` to capture the newly updated metadata, then copy the generated ticket `id` (UUID).
5. Head over to the **React Dashboard Interface** (`http://localhost:5173`), paste the token inside the **Ticket UUID** field, select your operational role (`Support Agent` or `Customer`), hit **Vao Phong Chat**, and start exchanging messages in sub-second real-time sync across connected components!