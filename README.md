# AcademiCloud: The Illustrative Educational Platform
An all-in-one educational platform for creating and managing courses, quizzes, and learning materials with an engaging, illustrative design.
[cloudflarebutton]
AcademiCloud is a comprehensive, multi-tenant educational platform built on Cloudflare's serverless infrastructure. It empowers educational institutions to create, manage, and deliver engaging online learning experiences. The architecture is role-based, catering to the distinct needs of Super Admins, Admins, Teachers, and Students.
The user interface is designed with an 'Illustrative' artistic style, featuring custom graphics and a human-centered design philosophy to make learning more engaging. All pages follow a consistent, responsive layout (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) with generous vertical spacing (`py-8 md:py-10 lg:py-12`).
## ✨ Key Features
*   **Multi-Tenant Architecture:** Securely isolate data for each educational institution.
*   **Role-Based Access:** Separate experiences for Super Admins, Admins, Teachers, and Students.
*   **Tenant Onboarding:** A public form for new institutions to request a tenant, with a super-admin approval workflow.
*   **Manual Tenant Provisioning:** Super Admins can manually create and configure new tenants directly from their dashboard.
*   **Course Management:** Teachers can create, edit, delete, and manage courses with detailed lesson structures.
*   **Interactive Learning:** Build and take quizzes, and study with fully manageable flashcard decks.
*   **Student Progress Tracking:** A dedicated "My Progress" dashboard for students to view enrolled courses and quiz history.
*   **AI Tutor:** An interactive chat assistant to help students with summarizing, explaining, and practice questions, with multi-language support (EN/FR).
*   **Analytics Dashboard:** A dashboard for teachers and admins to track student progress, engagement, and performance.
*   **Super Admin Dashboard:** A platform-wide view for managing tenants, approving requests, and monitoring analytics.
## 🏛️ Tenant Management
AcademiCloud is designed for scalability with a robust tenant management system:
1.  **Request:** New institutions can apply for a tenant via the public `/request-tenant` page.
2.  **Review:** Super Admins are notified (via console log simulation) and can review pending requests in their dashboard.
3.  **Approve/Reject:** With a single click, Super Admins can approve or reject requests.
4.  **Manual Creation:** Super Admins can bypass the request form and provision a new tenant instantly using a detailed form in their dashboard.
5.  **Provisioning (Mocked):** Upon approval or manual creation, the system simulates provisioning of tenant resources (like KV, R2, Vectorize via console logs) and sends a mock email notification to the new tenant's administrator.
## 🛠️ Technology Stack
*   **Framework:** React (Vite) & Hono
*   **Infrastructure:** Cloudflare Workers & Durable Objects
*   **Styling:** Tailwind CSS & shadcn/ui
*   **State Management:** Zustand (UI State) & TanStack Query (Server State)
*   **Routing:** React Router
*   **Language:** TypeScript
*   **Schema Validation:** Zod
## 🚀 Getting Started
### Prerequisites
*   [Bun](https://bun.sh/) (v1.0 or higher)
*   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
### Installation
1.  **Clone the repository and install dependencies:**
    ```sh
    git clone <YOUR_REPOSITORY_URL>
    cd academcloud_educational_platform
    bun install
    ```
2.  **Generate Worker Types:**
    ```sh
    bun cf-typegen
    ```
### Running Locally
To start the local development server, which includes the Vite frontend and the Hono backend worker:
```sh
bun dev
```
## ☁️ Deployment as a SaaS
This project is designed for a two-part deployment to the Cloudflare network: the backend API on Workers and the frontend on Pages.
1.  **Deploy the Backend API:**
    The Hono backend is deployed as a Cloudflare Worker. This command builds and deploys the code in the `worker/` directory.
    ```sh
    bun run deploy
    ```
2.  **Deploy the Frontend Application:**
    The React frontend is deployed to Cloudflare Pages. This command first builds the static assets into the `dist/` directory, then deploys them.
    ```sh
    # This command is an example. You can also set up Git integration for automatic deployments.
    wrangler pages deploy dist/
    ```
### SaaS Configuration
*   **Custom Domains:** For each tenant, you can add a custom domain by configuring a CNAME record in your Cloudflare DNS settings to point to your Pages deployment.
*   **Billing:** The application includes a mock Stripe integration endpoint. To implement real billing, you would need to integrate the Stripe SDK and manage API keys using Wrangler secrets.
*   **Scalability:** The architecture uses a single Durable Object with tenant-prefixed keys for data isolation, which scales effectively for many tenants. For very large-scale relational data needs, integrating Cloudflare D1 would be the next step.
*   **Compliance & Webhooks:** The application simulates audit logs and webhooks by logging events to the console. For production, these would be integrated with a dedicated logging service.
*   **Internationalization (i18n):** The backend is structured to support multiple languages (EN/FR). The AI Tutor and tenant creation features demonstrate this with language toggles/selections.
## ✅ Production Checklist
Before going live, ensure the following:
1.  **Type Generation:** Run `bun cf-typegen` after any changes to the worker to ensure frontend and backend types are synchronized.
2.  **Type Safety:** Verify the project builds without any TypeScript errors (`bun build`).
3.  **Role Testing:** Log in with each user role (Student, Teacher, Admin, Super Admin) and test all accessible routes and features to ensure permissions are correctly enforced.
4.  **Review Environment Variables:** For a real deployment, configure secrets for any third-party services (e.g., Stripe) using `wrangler secret put`.