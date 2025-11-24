# AcademiCloud: The Illustrative Educational Platform
An all-in-one educational platform for creating and managing courses, quizzes, and learning materials with an engaging, illustrative design.
[cloudflarebutton]
AcademiCloud is a comprehensive, multi-tenant educational platform built on Cloudflare's serverless infrastructure. It empowers educational institutions like schools, universities, and training centers to create, manage, and deliver engaging online learning experiences. The platform provides a suite of integrated tools including course and lesson management, interactive quizzes, flashcard decks for spaced repetition, and a placeholder for a future AI Tutor. The user interface is designed with an 'Illustrative' artistic style, featuring custom graphics, playful elements, and a human-centered design philosophy to make learning more engaging and enjoyable. The architecture is role-based, catering to the distinct needs of Admins, Teachers, and Students within each institution.
## ✨ Key Features
*   **Multi-Tenant Architecture:** Securely isolate data for each educational institution.
*   **Role-Based Access:** Separate experiences for Super Admins, Admins, Teachers, and Students.
*   **Course Management:** Create, manage, and browse courses with detailed lesson structures.
*   **Interactive Quizzes & Flashcards:** Tools to build and take quizzes and study with flashcards.
*   **Student Analytics:** A dashboard for tracking student progress, engagement, and performance.
*   **Super Admin Dashboard:** A platform-wide view for managing tenants and monitoring analytics.
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
*   **Custom Domains:** For each tenant (institution), you can add a custom domain by configuring a CNAME record in your Cloudflare DNS settings to point to your Pages deployment.
*   **Billing:** The application includes a mock Stripe integration endpoint. To implement real billing, you would need to integrate the Stripe SDK and manage API keys using Wrangler secrets (not included in this free-tier simulation).
*   **Scalability:** The architecture uses a single Durable Object with tenant-prefixed keys for data isolation, which scales effectively for many tenants. For very large-scale relational data needs, integrating Cloudflare D1 would be the next step (not configured in this template).
*   **Compliance & Webhooks:** The application simulates audit logs and webhooks by logging events to the console. For production, these would be integrated with a dedicated logging service and a webhook delivery system.
*   **Internationalization (i18n):** The backend is structured to support multiple languages (EN/FR), which can be requested via API query parameters.