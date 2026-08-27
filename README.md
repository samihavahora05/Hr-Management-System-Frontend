# 🏢 HR Management System — Frontend

A modern, full-featured **Enterprise Human Resource Management System (HRMS)** web application built with **Next.js 15 (App Router)**, **TypeScript**, and **Tailwind CSS**. Designed with rich aesthetics, responsive design, dark/light theme toggle, and dedicated role-based portals for complete organizational workforce management.

---

## 🌟 Key Features

### 👥 1. Role-Based Access Control (RBAC) & Portals
- **Admin Portal**: System configurations, organizational hierarchy, department & role definitions, audit logs, and global user management.
- **HR Portal**: Employee onboarding/offboarding, recruitment pipeline, leave & attendance approvals, company-wide payroll processing, and announcement broadcasts.
- **Manager Portal**: Team workforce overview, subordinate leave approvals, shift allocations, expense & loan authorizations, and performance reviews.
- **Team Leader Portal**: Team project/task assignments, timesheet validations, productivity monitoring, and member performance evaluations.
- **Employee Self-Service (ESS)**: Personal profile, clock-in/out, leave balance & requests, salary slip generation, document vault, ticket submissions, and reimbursement claims.

---

### 💼 2. Core Modules & Functionalities
- **📊 Real-Time Dynamic Dashboards**: Role-tailored metrics, workforce statistics, attendance breakdown, upcoming events, and quick-action toolbars.
- **🕒 Attendance & Shift Management**: Daily clock-in/clock-out, shift scheduling, anomaly tracking, timesheet logging, and attendance history.
- **🏖️ Leave Management**: Multi-tier leave requests, balance tracker (Casual, Sick, Paid, Maternity/Paternity), and approval workflows.
- **💰 Payroll & Compensation**: Automated salary breakdown, deductions/allowances, tax calculations, and printable **PDF Salary Slips**.
- **🎯 Recruitment & Onboarding**: Job postings, candidate applicant tracking (ATS), interview scheduling, offer letters, and interactive onboarding checklists.
- **📈 Performance & Goals (OKRs)**: Appraisal cycles, manager ratings, KPI tracking, and employee task performance charts.
- **📋 Task & Project Workspace**: Agile task boards, priority filters, progress tracking, and deadline monitoring.
- **💳 Expenses & Loans**: Expense claim submissions with receipts, loan application management, and EMI schedules.
- **💻 Asset & Helpdesk Management**: Company asset allocations and internal support ticket lifecycle tracking.
- **🤖 AI-Powered HR Assistant**: Built-in interactive assistant for employee queries, HR policies, and quick navigation.
- **🌓 Modern UI/UX**: Dark mode & light mode support, glassmorphism elements, dynamic toasts, confirmation modals, and responsive layouts.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: Lucide Icons & Custom SVG Icon Suite
- **State & Context**: React Context API (`AuthContext`, `ThemeContext`)
- **HTTP Client**: Native Fetch with custom centralized API client (`lib/api.ts`)
- **Exporting**: CSV, Excel, and Printable PDF formats

---

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router Pages
│   ├── admin/                    # Admin portal routes (dashboard, users, roles, audit)
│   ├── hr/                       # HR portal routes (recruitment, employees, payroll)
│   ├── manager/                  # Manager portal routes (team, approvals, tasks)
│   ├── team-leader/              # Team Leader portal routes
│   ├── employee/                 # Employee self-service routes
│   ├── attendance/               # Global attendance views
│   ├── leave/                    # Leave tracking & applications
│   ├── performance/              # Performance & KPI reviews
│   ├── expenses/                 # Expense claims
│   ├── loans/                    # Loan requests
│   ├── assets/                   # Asset allocation
│   ├── helpdesk/                 # Support tickets
│   ├── layout.tsx                # Root layout & Theme provider
│   └── page.tsx                  # Landing / Authentication router
├── components/                   # Reusable UI Components
│   ├── assistant/                # AI Chat Assistant interface
│   ├── dashboard/                # Role-specific dashboard widgets
│   ├── layout/                   # Sidebar, Topbar, PortalLayout, RoleGuard
│   ├── payroll/                  # SalarySlipModal & compensation tables
│   ├── performance/              # Evaluation matrices & scorecards
│   ├── reports/                  # Workforce analytics & visual reports
│   ├── tasks/                    # Task management & Kanban components
│   └── ui/                       # Buttons, Modals, Badges, StatCards, Toasts
├── lib/                          # Core Utilities & Contexts
│   ├── api.ts                    # API client with token management
│   ├── auth-context.tsx          # Authentication & RBAC context
│   ├── theme-context.tsx         # Dark / Light theme provider
│   ├── export.ts                 # Data export utilities
│   └── types/                    # TypeScript interfaces & definitions
└── public/                       # Static assets & illustrations
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.17.0 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)
- Running instance of the **HR Management System Backend** (Laravel API)

---

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/samihavahora05/Hr-Management-System-Frontend.git
   cd Hr-Management-System-Frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with hot-reload |
| `npm run build` | Compiles and builds the production bundle |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint checks across the project |

---

## 🔒 Security & RBAC Enforcement

- Client-side route protection using `<RoleGuard>` and `<PortalLayout>`.
- Token-based API authorization headers attached to all backend requests.
- Automatic session invalidation and redirect to `/login` upon token expiration.

---

## 📄 License & Copyright

This project is licensed under the **MIT License** — Copyright © 2026 **Samiha Vahora** & **BlueBoxx**. All rights reserved. See the [LICENSE](LICENSE) file for more details.
