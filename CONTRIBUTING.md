# Contributing to Jules Client

We love your input! We want to make contributing to Jules Client as easy and transparent as possible.

## How to Contribute

1.  **Fork the repository** on GitHub.
2.  **Clone the fork** to your local machine.
3.  **Create a branch** for your feature or bug fix: `git checkout -b feature/your-feature-name` or `fix/your-fix-name`.
4.  **Make your changes**. Ensure you follow the project's coding style and practices.
5.  **Run checks and tests** (see below).
6.  **Commit your changes** with a clear and descriptive commit message.
7.  **Push to your fork** and **submit a pull request**.

## Development Setup

See the [README.md](README.md) for installation and setup instructions.

### Coding Style

- Use Prettier for formatting (it should be configured for the project).
- Follow Svelte 5 runes best practices.
- Ensure Rust code is formatted using `cargo fmt`.

### Quality Checks

Before submitting a PR, please run:
- `bun run check`: For Svelte and TypeScript checks.
- `cd src-tauri && cargo check`: For Rust backend checks.

## Bug Reports

If you find a bug, please create an issue on GitHub with a detailed description and steps to reproduce.

## Feature Requests

Feel free to open an issue to discuss new features or improvements.
