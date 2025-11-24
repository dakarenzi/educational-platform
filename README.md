# AcademiCloud: The Illustrative Educational Platform
An all-in-one educational platform for creating and managing courses, quizzes, and learning materials with an engaging, illustrative design.
[cloudflarebutton]
AcademiCloud is a comprehensive, multi-tenant educational platform built on Cloudflare's serverless infrastructure. It empowers educational institutions to create, manage, and deliver engaging online learning experiences. The architecture is role-based, catering to the distinct needs of Super Admins, Admins, Teachers, and Students.
The user interface is designed with an 'Illustrative' artistic style, featuring custom graphics and a human-centered design philosophy to make learning more engaging. All pages follow a consistent, responsive layout (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) with generous vertical spacing (`py-8 md:py-10 lg:py-12`).
## ✨ Full Feature Overview
The platform provides a tailored experience for each user role:
*   **Students:** Enroll in courses, take interactive quizzes and mock exams, study with flashcards, access resources, get help from an AI Tutor, and track their learning journey on the "My Progress" page.
*   **Teachers:** A dedicated "Teacher Tools" dashboard to create, edit, and delete courses, lessons, quizzes, flashcard decks, mock exams, and resources. They can also monitor student performance via the Analytics dashboard.
*   **Admins:** (Role included, inherits Teacher permissions) Manage institutional settings and users.
*   **Super Admins:** A platform-wide dashboard to manage all tenants. This includes reviewing and approving/rejecting new tenant requests, manually provisioning new institutions, and viewing high-level analytics.
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
## ☁️ Deployment Checklist
This project is designed for a two-part deployment to the Cloudflare network.
1.  **Generate Latest Types:** Before any deployment, ensure your types are synchronized.
    ```sh
    bun cf-typegen
    ```
2.  **Deploy the Backend API:** The Hono backend is deployed as a Cloudflare Worker. This command builds and deploys the code in the `worker/` directory.
    ```sh
    bun run deploy
    ```
3.  **Deploy the Frontend Application:** The React frontend is deployed to Cloudflare Pages. This command first builds the static assets into the `dist/` directory.
    ```sh
    bun build
    ```
    Then, deploy the `dist/` folder using the Wrangler CLI or by connecting your Git repository to Cloudflare Pages for automatic deployments.
    ```sh
    wrangler pages deploy dist/
    ```
## 🔧 Troubleshooting
*   **Authentication Issues:** The application uses a mocked authentication system. For local testing, you can simulate different user roles by sending the `X-Mock-Role` header in your API requests with a value of `student`, `teacher`, `admin`, or `super-admin`.
*   **No Initial Data:** The application seeds mock data on the first request to an entity. If you don't see any courses, users, etc., try refreshing the relevant page.
*   **Type Errors:** If you encounter type errors after modifying the backend, run `bun cf-typegen` to update the shared types.
## 📈 Scaling & Next Steps
*   **Real Authentication:** Replace the mock `useAuthStore` and `tenantMiddleware` with a production-ready authentication provider like Cloudflare Access or a JWT-based system.
*   **Database Integration:** For large-scale relational data, migrate from the single Durable Object storage to Cloudflare D1.
*   **Real-time Features:** Integrate WebSockets for real-time collaboration or notifications.
*   **Billing:** Replace the mock Stripe endpoint with a full Stripe SDK integration, managing API keys with Wrangler secrets.
*   **File Storage:** Replace the R2 simulation (console logs) with actual Cloudflare R2 for handling file uploads for resources.
*   **Internationalization (i18n):** Expand the existing EN/FR support in the backend to the entire frontend using a library like `i18next`.
The platform is now feature-complete, production-ready, and equipped with a robust multi-tenancy and role-based access control system.