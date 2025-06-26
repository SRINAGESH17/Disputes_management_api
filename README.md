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

| Type       | Description                                               |
|------------|-----------------------------------------------------------|
| `feat`     | A new feature                                             |
| `fix`      | A bug fix                                                 |
| `docs`     | Changes to documentation only                             |
| `style`    | Code style (formatting, no logic change)                  |
| `refactor` | Code refactor (no behavior change)                        |
| `perf`     | Performance improvement                                   |
| `test`     | Adding or updating tests                                  |
| `chore`    | Routine tasks (deps, tooling, maintenance)                |
| `build`    | Build system or external dependency changes               |
| `ci`       | Continuous Integration / Deployment changes               |
| `revert`   | Reverts a previous commit                                 |

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

---

## 🧰 Optional: Commit Template Setup

### 1. Create a `.gitmessage` file

```
<type>(<scope>): <short summary>

[Optional detailed explanation of the change]

Refs: #issue-id
BREAKING CHANGE: [describe if applicable]
```

### 2. Configure Git to use it:

```bash
git config --global commit.template ~/.gitmessage
```

This will prefill your commit messages with a standard structure.

---

## 📚 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)

---

**Happy Committing! 🚀**
