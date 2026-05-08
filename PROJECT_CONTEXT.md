# PROJECT_CONTEXT.md

# Notes Workspace — AI Productivity Platform

## Product Vision

Notes Workspace is evolving into an AI-powered productivity operating system.

The platform combines:
- intelligent note-taking
- AI productivity analysis
- meeting intelligence
- collaboration
- workspace management
- semantic retrieval
- AI-assisted workflows

The goal is to help individuals and teams:
- organize information
- extract actionable intelligence
- automate productivity workflows
- improve collaboration
- reduce operational friction

---

# Tech Stack

## Frontend
- React
- Vite
- Responsive dashboard UI
- Premium card system
- AI tools interface

## Backend
- Node.js
- Express
- MongoDB
- JWT authentication
- OpenAI integration
- Stripe billing
- Resend email service

## Deployment
- Frontend: Netlify
- Backend: Render
- Database: MongoDB Atlas

---

# Core Systems

## Authentication
Supports:
- registration
- login
- JWT access tokens
- refresh tokens
- protected routes

Key routes:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

---

# Workspace System

Supports:
- workspace creation
- collaboration
- invite system
- member management
- shared notes

Invite emails use:
- Resend
- verified sending domains

---

# Notes System

Supports:
- standard notes
- meeting notes
- categories
- tags
- attachments
- comments

Meeting notes support:
- AI meeting intelligence
- attendees
- decisions
- blockers
- risks
- deadlines
- follow-ups

---

# AI Systems

## AI Tools
Current AI capabilities:
- improve writing
- executive summaries
- smart suggestions
- task extraction
- study notes
- follow-up email generation

---

# AI Insights

Dashboard AI Insights provide:
- productivity summaries
- focus areas
- follow-up suggestions
- recent topics
- action tracking

Endpoint:
GET /api/ai/insights-dashboard

---

# AI Meeting Intelligence

Endpoint:
POST /api/ai/meeting-intelligence

Capabilities:
- detect attendees
- detect decisions
- extract action items
- identify blockers
- identify risks
- extract deadlines
- generate executive summaries

---

# AI Semantic Search

Planned/partial system:
GET /api/ai/semantic-search?q=

Purpose:
Allow intelligent natural-language note retrieval.

Examples:
- “Find donation meetings”
- “Show Stripe discussions”
- “Find action items from church meetings”

---

# AI Command Center

Planned unified dashboard for:
- AI insights
- follow-ups
- priorities
- deadlines
- productivity tracking
- meeting operations

---

# Billing System

Stripe supports:
- premium plans
- subscriptions
- AI usage limits
- upgrade flows

---

# Analytics

Tracks:
- AI usage
- onboarding
- invites
- note creation
- productivity interactions

---

# Product Positioning

This is NOT just a notes app.

It is:
“An AI Productivity Operating System”

Core positioning:
- intelligent collaboration
- AI-assisted productivity
- meeting intelligence
- operational organization
- workspace intelligence

---

# Development Philosophy

The project prioritizes:
- stability
- safe iteration
- modular AI systems
- scalable architecture
- small incremental improvements

