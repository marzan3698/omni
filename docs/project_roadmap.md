Project Roadmap: Enterprise CRM & Company Management System

Project Overview

This document outlines the development phases for a full-stack ERP/CRM system.
Tech Stack: React, Node.js, MySQL/PostgreSQL, Tailwind CSS.

🚀 Phase 1: Setup & Architecture (The Foundation)

Goal: Initialize project, set up database connection, and establish design system.

Initialize Client (Vite + React + TypeScript).

Initialize Server (Node.js + Express/NestJS).

Setup Database ORM (Prisma/TypeORM) with MySQL/PostgreSQL.

Design System: Install Tailwind CSS & Shadcn UI.

Design Standard: Inter Font, rounded-md radius, minimal borders.

🔐 Phase 2: Authentication & Role Management (RBAC)

Goal: Secure the app and manage who can do what.

Database: Users table, Roles table, Permissions table.

Backend:

JWT Authentication (Login/Register).

Middleware for Role verification (e.g., verifyRole('admin')).

Frontend:

Login/Signup Pages (Modern Card Layout).

Protected Routes (Redirect if not logged in).

Dashboard Layout (Sidebar + Topbar).

🏢 Phase 3: Company Management (Core)

Goal: Manage company details, branches, and departments.

Features:

Company Profile Settings.

Branch/Location Management.

Department CRUD (Create, Read, Update, Delete).

Employee Onboarding (Link User to Employee Profile).

📈 Phase 4: CRM & Sales Module

Goal: Manage leads, clients, and pipelines.

Leads: Kanban board for Lead stages (New -> Contacted -> Qualified -> Won).

Clients: Database of customers.

Activities: Log calls, meetings, and emails.

✅ Phase 5: Task Management (Todo)

Goal: Project and task tracking.

Features:

Task creation with priority (High, Medium, Low).

Assign tasks to employees.

Task Status (Pending, In-Progress, Completed).

Calendar View.

💰 Phase 6: Finance & Accounting

Goal: Track money in and out.

Invoicing: Generate PDF invoices.

Expenses: Track company expenses/salaries.

Reports: Monthly Profit/Loss charts (Recharts).

📊 Phase 7: Reporting & Analytics

Goal: Visual insights.

Dashboard Widgets: Total Sales, Active Leads, Pending Tasks.

Export data to CSV/Excel.

💬 Phase 8: Social Media Integration (Unified Inbox)

Goal: Manage Facebook Page messages directly from the dashboard.

Admin Settings:

Create a secure settings page for Admin to input Facebook Page ID and App Access Token.

Backend logic to validate and store these credentials securely (encrypted).

Facebook Webhooks:

Set up a Node.js endpoint (e.g., /api/webhooks/facebook) to receive real-time updates when a user messages the page.

Inbox UI (New Section):

A chat-like interface (similar to Messenger) in the dashboard.

List of conversations on the left, active chat on the right.

Role-Based Access:

Update Roles to include a can_reply_social_messages permission.

Admins can assign this permission to Support Agents or Sales Reps.

Reply Feature:

Use Facebook Graph API to send replies from the dashboard.

📝 Cursor Instruction Strategy

When building a phase, always refer to this roadmap to keep context.