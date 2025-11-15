# AcademiCloud: The Illustrative Educational Platform

An all-in-one educational platform for creating and managing courses, quizzes, and learning materials with an engaging, illustrative design.

[cloudflarebutton]

AcademiCloud is a comprehensive, multi-tenant educational platform built on Cloudflare's serverless infrastructure. It empowers educational institutions like schools, universities, and training centers to create, manage, and deliver engaging online learning experiences. The platform provides a suite of integrated tools including course and lesson management, interactive quizzes, flashcard decks for spaced repetition, and a placeholder for a future AI Tutor. The user interface is designed with an 'Illustrative' artistic style, featuring custom graphics, playful elements, and a human-centered design philosophy to make learning more engaging and enjoyable. The architecture is role-based, catering to the distinct needs of Admins, Teachers, and Students within each institution.

## ✨ Key Features

*   **Role-Based Access:** Separate experiences for Admins, Teachers, and Students.
*   **Course Management:** Create, manage, and browse courses with detailed lesson structures.
*   **Interactive Quizzes:** Build and take quizzes to assess learning and comprehension.
*   **Flashcard Decks:** A tool for creating and studying with digital flashcards to reinforce knowledge.
*   **Student Analytics:** A dashboard for tracking student progress, engagement, and performance.
*   **AI Tutor (Placeholder):** A foundation for a future conversational AI learning assistant.
*   **Illustrative & Engaging UI:** A beautiful, modern interface designed to make learning enjoyable.

## 🛠️ Technology Stack

*   **Framework:** React (Vite) & Hono
*   **Infrastructure:** Cloudflare Workers & Durable Objects
*   **Styling:** Tailwind CSS & shadcn/ui
*   **State Management:** Zustand (UI State) & TanStack Query (Server State)
*   **Routing:** React Router
*   **Animations:** Framer Motion
*   **Language:** TypeScript
*   **Schema Validation:** Zod

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following tools installed:

*   [Bun](https://bun.sh/) (v1.0 or higher)
*   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare's CLI tool)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_REPOSITORY_URL>
    cd academcloud_educational_platform
    ```

2.  **Install dependencies:**
    This project uses Bun for package management.
    ```sh
    bun install
    ```

### Running the Development Server

To start the local development server, which includes the Vite frontend and the Hono backend worker, run:

```sh
bun dev
```

This will start the application, typically on `http://localhost:3000`. The command concurrently runs the Vite dev server and a local instance of the Cloudflare Worker.

## 📂 Project Structure

The codebase is organized into three main directories:

*   `src/`: Contains the frontend React application, including pages, components, hooks, and utility functions.
*   `worker/`: Contains the backend Cloudflare Worker code, built with Hono. This is where API routes and data entities are defined.
*   `shared/`: Contains shared code, primarily TypeScript types, that are used by both the frontend and the backend to ensure type safety.

## 💻 Development

*   **Backend:** Add new API endpoints in `worker/user-routes.ts`. Define new data structures and logic in `worker/entities.ts`, following the provided `IndexedEntity` pattern for interacting with the global Durable Object.
*   **Frontend:** Create new pages in `src/pages/` and reusable components in `src/components/`. Use the `api()` function in `src/lib/api-client.ts` to communicate with the backend.
*   **Styling:** Leverage the pre-configured `shadcn/ui` components and use Tailwind CSS for custom styling and layout.

## ☁️ Deployment

This project is designed for seamless deployment to the Cloudflare network.

1.  **Build the application:**
    This command bundles the frontend and worker code for production.
    ```sh
    bun build
    ```

2.  **Deploy to Cloudflare:**
    This command publishes your application to your Cloudflare account.
    ```sh
    bun deploy
    ```

Alternatively, you can deploy directly from your GitHub repository using the button below.

[cloudflarebutton]