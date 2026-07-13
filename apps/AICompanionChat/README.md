# Welcome to OnSpace AI

Onspace AI empowers anyone to turn ideas into powerful AI applications in minutes—no coding required. Our free, no-code platform enables effortless creation of custom AI apps; simply describe your vision and our agentic AI handles the rest. The onspace-app, built with React Native and Expo, demonstrates this capability—integrating popular third-party libraries to deliver seamless cross-platform performance across iOS, Android, and Web environments.

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Start the Project

- Start the development server (choose your platform):

```bash
npm run start         # Start Expo development server
npm run android       # Launch Android emulator
npm run ios           # Launch iOS simulator
npm run web           # Start the web version
```

- Reset the project (clear cache, etc.):

```bash
npm run reset-project
```

### 3. Lint the Code

```bash
npm run lint
```

## 🚀 Enterprise Features (Patches 001-006)

- **AI Core Integration**: Full support for Ollama (Local AI) and Supabase (Backend).
- **Interactive Chat UI**: Professional interface with streaming support and generation cancellation.
- **Markdown & Code Highlighting**: Rich text rendering for AI responses with syntax highlighting.
- **Chat History**: Full session management with local caching (AsyncStorage) and remote sync (Supabase).
- **Voice-to-Text**: Integrated audio recording and STT structure for hands-free interaction.
- **Production Ready**: Dockerized environment for stable deployment.

## 🛠 Main Dependencies

- **Framework**: Expo (React Native) ~53.0.12
- **UI Kit**: React Native Paper ^5.12.5
- **State Management**: Zustand ^5.0.2
- **Backend**: Supabase ^2.50.0
- **AI Engine**: Ollama (via local/remote API)
- **Local Caching**: @react-native-async-storage/async-storage
- **Audio**: expo-av
- **Markdown**: react-native-markdown-display

## 🐳 Docker Deployment

To run the application in a production-ready container:

1. **Configure Environment**: Create a `.env` file based on `.env.example`.
2. **Build & Run**:
   ```bash
   docker-compose up --build -d
   ```
3. **Access**: The app will be available at `http://localhost:8080`.

For a full list of dependencies, see [package.json](./package.json).

## Development Tools

- TypeScript: ~5.8.3
- ESLint: ^9.25.0
- @babel/core: ^7.25.2

## Contributing

1. Fork this repository
2. Create a new branch (`git checkout -b main`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is private ("private": true). For collaboration inquiries, please contact the author.

---

Feel free to add project screenshots, API documentation, feature descriptions, or any other information as needed.
