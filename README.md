# Dispute Management API

## Overview

Dispute Management API is a SaaS backend system designed to streamline the management of merchant disputes and chargebacks. It integrates with multiple payment gateways, automates dispute allocation to staff using a round-robin algorithm, and provides detailed logging for tracking dispute lifecycles. The platform also supports staff management for efficient dispute handling. Built with Firebase.js, Node.js, Express, Sequelize, and PostgreSQL, it empowers merchants to efficiently monitor, assign, and resolve disputes.

---

## 🧩 Core Components

1. **Dashboard**
2. **Staff Management**
3. **GSTIN Verification**
4. **Integration & Webhooks**

---

## 🚀 Features

### 📊 Merchant Dashboard

- Overview of disputes (won vs. lost)
- Analysis of top dispute reasons by gateway
- Gateway-specific dashboards
- Gateway-wise dispute reports

### 👥 Staff Management

- Add staff with email and mobile number verification
- Staff dashboard to track assigned disputes
- Automated dispute allocation and reassignment (Round Robin)

### ✅ GSTIN Verification

- Validate merchant GSTIN
- Assign corresponding Merchant ID (MID)

### 🔗 Integration & Webhooks

- Add and manage internal payment gateway integrations
- View webhook activity and dispute triggers
- Maintain detailed webhook logs for tracking dispute events

---

## 📌 Purpose

This platform empowers merchants to:

- Monitor and analyze disputes efficiently
- Automate staff dispute assignment
- Ensure compliance with verified GSTIN
- Track dispute events through webhook integration

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: postgresQL with Sequelize ORM
- **Mailing**: zeptomail
- **mobile verification**: MSG91
- **Notification**: Custom Platform notifications and RabbitMQ
- **Validation**: Yup
- **API Testing**: API Dogs
- **Error Handling**: Custom error handling middleware
- **Gateways listed**: razorpay, cashfree.

### Working Tools & Libraries

- Eslint
- sequelize-cli
- rabbitMQ
- firebase-admin
- lodash
- pg
- sequelize
- yup
- zeptomail

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (version 14.x or higher)
- postgresQL (local installation or Live Cluster link )

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <project-directory>

   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the `.env` file with the appropriate information used in `.env` file from

```bash
./src/constants/env.js
./src/firebase/dispute-firebase-key.js ,
./src/config/config.cjs
./src/config/database.config.js.
```

4. Run the application:

```bash
 npm start
 npm run devstart  // using nodemon
```

5. Open your browser and go to `http://localhost:4001/` to interact with the API.

## API Documentation

You can find detailed API documentation, including request/response formats, authentication, and error handling, in the [Dispute API Documentation](https://apidog.com/apidoc/shared-32bff08e-9d71-4d3b-a5ce-c93cc43338cc/ "Apidogs API Documentation ") .
Password: **Dispute@143M**

## Project Structure

The project is organized in the following structure:

```bash

├── src/
│ ├── config/ # Configuration files (e.g., DB, Firebase, API keys)
│ │ └── db.config.js # Database connection configuration
│
│ ├── constants/ # Global constants and enums
│ │ └── gateway.constants.js# Constants related to payment gateways
│
│ ├── controllers/ # Express route handlers
│ │ └── dispute.controller.js # Logic for dispute-related endpoints
│
│ ├── firebase/ # Firebase SDK setup and helpers
│ │ └── firebase.config.js # Firebase configuration (auth, firestore, etc.)
│
│ ├── middlewares/ # Express middlewares
│ │ └── auth.middleware.js # Request authentication/authorization middleware
│
│ ├── migrations/ # Sequelize migration files
│ │ └── 20250626103000-create-disputes.cjs # Timestamped schema change
│
│ ├── models/ # Sequelize data models
│ │ └── dispute.model.js # Dispute table model definition
│
│ ├── routes/ # API route definitions
│ │ └── dispute.route.js # Endpoints for dispute operations
│
│ ├── seeders/ # Initial/test data for the database
│ │ └── 20250626103500-seed-users.cjs # Timestamped seed script
│
│ ├── services/ # Business logic and service-layer abstractions
│ │ └── dispute.service.js # Core dispute logic (used by controller)
│
│ ├── utils/ # Reusable utility/helper functions
│ │ └── logger.util.js # Custom logging utility
│
│ ├── app.js # Express app entry point and middleware setup
│ └── generate-migration.cjs # Script to scaffold new Sequelize migrations
│
├── .eslintrc.js # ESLint rules for code linting
├── .gitignore # Files and folders to exclude from Git
├── .sequelizerc # Sequelize CLI configuration paths
├── eslint.config.js # ESLint shared config (optional if using flat config)
├── login.html # Static login page (for test/admin login UI)
├── package-lock.json # Dependency lock file
├── package.json # Project metadata and npm dependencies
└── README.md # Project documentation

```

---

**Folder Description**

```

| Folder/File             | Description                                                                 |
|-------------------------|-----------------------------------------------------------------------------|
| `src/config/`           | App-wide configurations (e.g., DB, Firebase, third-party keys).             |
| `src/constants/`        | Static values used throughout the app (gateway codes, enums).               |
| `src/controllers/`      | Contains logic to handle incoming HTTP requests mapped by routes.           |
| `src/firebase/`         | Firebase setup and related service access files.                            |
| `src/middlewares/`      | Custom Express middlewares (auth, error handling, request logging).         |
| `src/migrations/`       | Sequelize migration files to modify the database schema.                    |
| `src/models/`           | Sequelize models that define the structure of database tables.              |
| `src/routes/`           | Route definitions that connect endpoints to their controller logic.         |
| `src/seeders/`          | Seed data scripts for populating the database (development/testing).        |
| `src/services/`         | Business logic layer abstracted from controllers (reusable core logic).     |
| `src/utils/`            | Utility functions like logging, formatting, and error helpers.              |
| `src/app.js`            | Main app entry – initializes server, routes, and middleware.                |
| `generate-migration.cjs`| CLI utility to generate Sequelize migration files with timestamps.          |
| `.sequelizerc`          | Configures paths for Sequelize CLI to locate models/migrations/seeders.     |
| `.eslintrc.js`          | ESLint rules for code style and consistency.                                |
| `.gitignore`            | Prevents unnecessary files from being tracked by Git.                       |
| `login.html`            | A basic static login page (optional).                                       |
| `package.json`          | Defines project name, scripts, dependencies, and metadata.                  |
| `README.md`             | Documentation and developer guide for the project.                          |
```

# 📛 Naming Conventions Guide

This guide defines consistent naming conventions for files and folders in the **Dispute Management API** project. Following these conventions ensures clarity, scalability, and team consistency.

---

## ✅ General Rules

| Rule                                 | Description                                                |
| ------------------------------------ | ---------------------------------------------------------- |
| Use **kebab-case**                   | All folders and file names (e.g., `user.controller.js`)    |
| Be **module-specific**               | Include module name in file (e.g., `dispute.service.js`)   |
| Use **semantic naming**              | Reflect the purpose/role of the file or folder             |
| No abbreviations or acronyms         | Use full, clear words (e.g., `authentication`, not `auth`) |
| Timestamp Sequelize migration/seeder | Format: `YYYYMMDDHHMMSS-description.cjs`                   |

---

## 🗂 Folder Naming

| Folder         | Purpose                             | Example                               |
| -------------- | ----------------------------------- | ------------------------------------- |
| `controllers/` | Request/response logic per module   | `user.controller.js`                  |
| `services/`    | Business logic per module           | `dispute.service.js`                  |
| `routes/`      | Express route definitions           | `staff.route.js`                      |
| `models/`      | Sequelize models                    | `gateway.model.js`                    |
| `middlewares/` | Express middlewares                 | `verify-token.middleware.js`          |
| `utils/`       | Reusable helper functions           | `logger.util.js`                      |
| `constants/`   | Static data and enums               | `status.constants.js`                 |
| `config/`      | App configuration files             | `firebase.config.js`                  |
| `firebase/`    | Firebase-specific setup and helpers | `firebase-admin.js`                   |
| `migrations/`  | Sequelize migration files           | `20250627010101-create-dispute.cjs`   |
| `seeders/`     | Sequelize seed data                 | `20250627011500-seed-staff-users.cjs` |

---

## 📄 File Naming Patterns

| File Type      | Naming Pattern                     | Example                                  |
| -------------- | ---------------------------------- | ---------------------------------------- |
| **Controller** | `<entity>.controller.js`           | `merchant.controller.js`                 |
| **Service**    | `<entity>.service.js`              | `dispute.service.js`                     |
| **Route**      | `<entity>.route.js`                | `gateway.route.js`                       |
| **Model**      | `<entity>.model.js`                | `staff.model.js`                         |
| **Middleware** | `<purpose>.middleware.js`          | `authenticate-request.middleware.js`     |
| **Utility**    | `<purpose>.util.js`                | `format-date.util.js`                    |
| **Constant**   | `<category>.constants.js`          | `gateway.constants.js`                   |
| **Config**     | `<provider>.config.js`             | `firebase.config.js`                     |
| **Migration**  | `YYYYMMDDHHMMSS-<action>.cjs`      | `20250627020100-add-mid-to-merchant.cjs` |
| **Seeder**     | `YYYYMMDDHHMMSS-seed-<target>.cjs` | `20250627021500-seed-users.cjs`          |

---

## 🧠 Tips for Clarity

- ✅ Use plural form for folder names (e.g., `controllers`, `services`, `models`)
- ✅ Be specific (e.g., `verify-gstin.middleware.js` is clearer than `validate.middleware.js`)
- ✅ Use single responsibility per file – keep logic focused and modular
- ✅ Avoid vague names like `index.js` unless bundling or exporting modules

---

## 🚫 Common Mistakes to Avoid

| ❌ Anti-Pattern | ✅ Preferred Pattern              |
| --------------- | --------------------------------- |
| `dispute.js`    | `dispute.model.js`                |
| `utils.js`      | `generate-report.util.js`         |
| `controller.js` | `add-staff.controller.js`         |
| `route.js`      | `gstin.route.js`                  |
| `auth.js`       | `authenticate-user.middleware.js` |
| `gateway.js`    | `razorpay-gateway.service.js`     |

---

## 🛠️ Step-by-Step Setup Guide

Follow these instructions to run the project locally.

**✅ Run Sequelize Migrations**

- shorthand command for db migrate , Check in package.json
  `npm run dev_migrate`
- shorthand To Generate the migration file for updates in db tables, Check in package.json
  `npm run dev_generate`
- shorthand To Generate the migration file for updates in db tables, Check in package.json
  `npm run dev_generate`

**This will create the necessary database tables.**

**✅ Install and Start RabbitMQ**

- RabbitMQ is required to run the backend as it handles internal messaging and webhook processing.

```bash
🐇 Option A: Use Docker (Recommended)
bash
Copy
Edit
docker run -d \ --hostname rabbitmq-host \ --name dispute-rabbitmq \ -p 5672:5672 -p 15672:15672 \ rabbitmq:3-management

Visit http://localhost:15672
Username: guest
Password: guest

  OR

🐇 Option B: Install RabbitMQ Manually
Install RabbitMQ

Ensure it's running locally on port 5672
```

# 📝 Git Commit Message Guidelines

This document defines how to write structured and meaningful Git commit messages using the **Conventional Commits** format. It improves code collaboration, traceability, and release automation.

---

## ✅ Commit Message Format

```
<type>(<scope>): <short summary>
```

- **type**: Type of change (see list below)
- **scope**: (Optional) What part of the project was affected
- **summary**: A short summary (imperative tone, max 72 characters)

---

## 🔧 Commit Types

| Type       | Description                                 |
| ---------- | ------------------------------------------- |
| `feat`     | A new feature                               |
| `fix`      | A bug fix                                   |
| `docs`     | Changes to documentation only               |
| `style`    | Code style (formatting, no logic change)    |
| `refactor` | Code refactor (no behavior change)          |
| `perf`     | Performance improvement                     |
| `test`     | Adding or updating tests                    |
| `chore`    | Routine tasks (deps, tooling, maintenance)  |
| `build`    | Build system or external dependency changes |
| `ci`       | Continuous Integration / Deployment changes |
| `revert`   | Reverts a previous commit                   |

---

## 🧩 Common Scopes

### Functional

- `auth`
- `user`
- `payment`
- `order`
- `product`
- `cart`
- `notification`
- `email`
- `chat`
- `profile`

### Technical

- `api`
- `db`
- `model`
- `route`
- `controller`
- `service`
- `config`
- `middleware`
- `schema`
- `test`

### Infrastructure & Tools

- `docker`
- `build`
- `ci`
- `env`
- `scripts`

### Integrations

- `webhook`
- `rabbitmq`
- `stripe`
- `firebase`
- `sentry`

### General

- `readme`
- `docs`
- `deps`
- `package`

---

## 💬 Commit Examples by Type

### `feat` - New Feature

```bash
feat(user): allow profile image upload
feat(payment): add webhook integration with Stripe
feat(rabbitmq): publish message after payment success
```

### `fix` - Bug Fix

```bash
fix(auth): handle expired JWT tokens properly
fix(order): correct total calculation issue
```

### `docs` - Documentation

```bash
docs(readme): update Docker setup instructions
docs(api): document /v2/payments endpoint
```

### `style` - Code Style

```bash
style(service): format file using Prettier
style(controller): fix indentation and trailing spaces
```

### `refactor` - Code Cleanup

```bash
refactor(user): move validation logic to service layer
refactor(api): simplify response format handling
```

### `perf` - Performance

```bash
perf(db): add index on created_at for faster queries
perf(payment): batch process webhook events
```

### `test` - Testing

```bash
test(webhook): add integration test for payment event
test(auth): mock JWT tokens in login unit test
```

### `chore` - Misc Tasks

```bash
chore(env): clean up unused environment variables
chore(package): update dependencies to latest versions
```

### `build` - Build System

```bash
build(docker): optimize Dockerfile layers
build(deps): upgrade node version in build script
```

### `ci` - CI/CD Pipelines

```bash
ci(github): add test step to pull request workflow
ci(gitlab): update CI pipeline to include linting
```

### `revert` - Undo Commit

```bash
revert: feat(chat): rollback socket integration
```

---

## 📄 Detailed Commit Example

```bash
feat(payment): add webhook for Stripe success

- Adds a new webhook endpoint to sync payment data
- Publishes message to RabbitMQ on success

BREAKING CHANGE: Payment processing is now async and event-driven

Refs: #PAY-123
```

---

## 📌 Best Practices

- ✅ Use **imperative mood**: "add", "fix", "remove" (not "added", "fixed")
- ✅ Keep the **summary short** (under 72 characters)
- ✅ Use a **body** for longer descriptions (optional)
- ✅ Reference issues/tickets (e.g., `Refs: #123`)
- ❌ Avoid vague messages like `update files` or `misc changes`
