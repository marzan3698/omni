Database Schema Design

Database System: MySQL (Compatible with PostgreSQL)
ORM: Prisma (Recommended for Type Safety with Cursor)

This schema handles Multi-tenant architecture (Optional) or Single Company with multiple branches.

1. Authentication & Users

Users

id (UUID/Int)

email (Unique)

password_hash

role_id (FK -> Roles)

profile_image

created_at

Roles

id

name (Admin, Manager, Sales, Employee)

permissions (JSON - e.g., {"can_delete_users": true, "can_reply_social": false})

2. Company Structure

Employees

id

user_id (FK -> Users)

department

designation

salary

join_date

Departments

id

name

manager_id (FK -> Employees)

3. CRM (Sales)

Leads

id

title

source (Website, Referral)

status (New, Negotiation, Won, Lost)

assigned_to (FK -> Employees)

value (Decimal - Estimated revenue)

Clients

id

name

contact_info

address

4. Task Management

Tasks

id

title

description

priority (Low, Medium, High)

due_date

assigned_to (FK -> Employees)

status (Todo, In Progress, Done)

5. Finance

Invoices

id

client_id (FK -> Clients)

issue_date

due_date

total_amount

status (Paid, Unpaid, Overdue)

Transactions (Income/Expense)

id

type (Credit/Debit)

category (Salary, Rent, Sales)

amount

date

6. Social Integrations & Inbox

Integrations (Stores API Keys securely)

id

provider (ENUM: 'facebook', 'whatsapp')

page_id (String)

access_token (Text - Encrypted)

is_active (Boolean)

Social_Conversations

id

platform (ENUM: 'facebook')

external_user_id (Sender's PSID from Facebook)

external_user_name (Sender's Name)

status (Open, Closed)

last_message_at (DateTime)

Social_Messages

id

conversation_id (FK -> Social_Conversations)

sender_type (ENUM: 'customer', 'agent')

content (Text)

created_at (DateTime)

Relationships Overview

One User has one Employee profile.

One Employee can have many Tasks and Leads.

One Client can have many Invoices.

One Integration connects to external APIs.

Social_Conversations contain many Social_Messages.