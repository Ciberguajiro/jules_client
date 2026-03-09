# Jules Client

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/built%20with-Tauri-blue)](https://tauri.app/)
[![Svelte](https://img.shields.io/badge/Svelte-5-orange)](https://svelte.dev/)

A modern, open-source desktop client for the [Jules API](https://jules.googleapis.com/v1alpha), built with Tauri, Svelte 5, and Rust.

## Features

- **Session Management**: Create, view, and manage your Jules sessions easily.
- **Activity Feed**: Real-time activity tracking and history.
- **Source Explorer**: Browse and manage your sources.
- **Cross-Platform**: Available for Windows, macOS, and Linux.
- **Performance**: Lightweight and fast, thanks to Rust and Svelte.
- **Secure**: Local API key management and secure interactions.

## Installation

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Bun](https://bun.sh/)
- [Tauri Dependencies](https://tauri.app/v1/guides/getting-started/prerequisites)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/ciberguajiro/jules-client.git
   cd jules-client
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run the application in development mode:
   ```bash
   bun run tauri dev
   ```

4. Build for production:
   ```bash
   bun run tauri build
   ```

## Configuration

To use Jules Client, you need a Jules API key.
1. Go to the **Settings** section in the app.
2. Enter your API key.
3. Your key is saved locally in your application data directory.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- Frontend powered by [Svelte 5](https://svelte.dev/)
- Icons by [Lucide](https://lucide.dev/)
