# OmniSupport-Core

OmniSupport-Core is a high-performance, full-stack Omnichannel Customer Support & Ticketing platform designed for modern call centers. It leverages asynchronous architectures and AI integration to optimize support ticket dispatching and enhance customer support workflows.

---

## Core Tech Stack

- **Backend:** Node.js (NestJS Framework), TypeScript
- **Database & Cache:** PostgreSQL (TypeORM), Redis (BullMQ)
- **Real-time Engine:** WebSocket (Socket.io)
- **AI Integration:** Gemini API / OpenAI API (AI Copilot & Auto-tagging)
- **Infrastructure:** Docker, Docker Compose

---

## Key Features & Architecture (In Progress)

### 1. Asynchronous Ticket Queueing & Auto-Routing 🏎️
- When a customer submits a support issue, the request is processed via **Database Transactions** to ensure strict data consistency across `tickets` and `messages` tables.
- Instead of synchronous bottlenecks, the ticket ID is instantly pushed to a distributed **Redis Queue (powered by BullMQ)** for asynchronous agent assignment and background telemetry.

### 2. Embedded API Documentation 📑
- Fully integrated with **Swagger UI (OpenAPI Specification)** for live endpoints visualization, sandboxed schema testing, and standard architectural maintenance.

### 3. Planned Deliverables (Next Phases)
- **Real-time Gateway:** Socket.io bidirectional channels for instant chat sync between agents and customers.
- **AI Copilot Module:** LLM prompt-engineering workflows to auto-classify ticket domains (`Bug`, `Billing`, `Inquiry`) and suggest contextual draft text responses for agents.
- **Agent Dashboard:** A responsive React (Vite + TailwindCSS) control room application.

---

## Infrastructure Setup & Installation

### Prerequisites
Make sure you have **Docker**, **Docker Compose**, and **Node.js (v18+)** installed.

### 1. Environment Configuration
Clone the template configuration from the root directory:
```bash
cp .env.example .env

```

*Note: Open the `.env` file and customize your local credentials (ports, DB passwords, and AI API keys).*

### 2. Spin Up Infrastructure Containers

Launch the containerized **PostgreSQL 15** and **Redis 7** engines in detached mode:

```bash
docker compose up -d

```

### 3. Start the NestJS Development Server

Navigate into the backend service folder, fetch dependencies, and trigger the hot-reload compiler:

```bash
cd backend
npm install
npm run start:dev

```

Once started successfully, visit the sandboxed API workspace:

* **Interactive API Documentation (Swagger):** `http://localhost:3000/api/docs`

---

## Database Schema Design Overview

The persistence tier relies on an optimized relational mapping blueprint utilizing `UUID` keys for security:

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