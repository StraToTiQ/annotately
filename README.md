# AnotationBlog — Web Annotation Extension

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

**AnotationBlog** is a powerful browser extension designed to enhance the way users interact with web content. It allows users to highlight text on any website and engage in rich, nested comment threads directly within the page, facilitating seamless collaboration and discussion.

---

## Technical Architecture

### Backend Stack
- **FastAPI (Python)**: High-performance web framework for building APIs.
- **SQLAlchemy**: SQL Toolkit and Object-Relational Mapper.
- **PostgreSQL**: Robust, open-source relational database.

### Frontend Stack
- **React & TypeScript**: Modern UI library with static typing for enhanced code quality.
- **Vite & @crxjs/vite-plugin**: Next-generation frontend tooling tailored for Chrome Extensions.

### CI/CD & DevOps
- **Docker & Docker Compose**: Containerization and orchestration for consistent development environments.
- **GitHub Actions**: Automated pipelines for linting (Ruff/ESLint), testing (Pytest/Vitest), and building.

---

## Core Functionality

- **Floating Overlay**: A draggable UI window that overlays onto websites without breaking their original DOM structure or layout.
- **Hierarchical Threads**: Sophisticated support for multi-level replies, enabling organized and deep conversations.
- **Interactive Highlighting**: Visual highlighter accents that mark annotated text for immediate context.
- **JWT Authentication**: Secure user registration and session management powered by JSON Web Tokens.

---

## Installation and Setup

To run the full stack locally, ensure you have **Docker Desktop** installed and execute:

```bash
docker compose up --build
```

### Accessing the Project:
- **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
- **Extension**: Load the `frontend/dist` directory as an unpacked extension in Chrome.

---

## Development Team

| Member | Primary Responsibilities |
| :--- | :--- |
| **Artur** | Project Lead, Infrastructure, DOM Injection Logic |
| **Volodymyr Vorobiov** | Backend Architect, Auth System, Thread Logic |
| **Illia Bazyliv** | QA Engineer, Testing Suites, CI/CD Pipeline |
