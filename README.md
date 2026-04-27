# 🐛 Lorapok API Atlas

![Lorapok API Atlas](https://img.shields.io/badge/Lorapok-API_Atlas-4ade80?style=for-the-badge&logo=github)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

**Lorapok API Atlas** is a premium, animated web dashboard designed to explore and test over 60 high-quality open-source APIs. Featuring **Lorapok**, our cute larva mascot, the Atlas provides a professional sandbox environment with real-time feedback, dynamic documentation, and rich media visualization.

## ✨ Features

- **🐛 Animated Mascot:** Lorapok reacts to your API tests in real-time.
- **🗺️ Explorer:** Browse curated APIs across 20+ categories (Science, Finance, Games, etc.).
- **🧪 Live Sandbox:** Test endpoints directly from the dashboard and view instant results.
- **🖼️ Rich Media Visualizer:** Automatically renders images, audio, video, and even full HTML pages.
- **📥 Data Export:** One-click "Download JSON" for any API response.
- **📖 Auto-Documentation:** Every API includes automatically generated usage guides and multilingual code snippets (cURL, JS, Python, Go).
- **🎨 Glassmorphic UI:** A modern, high-contrast design optimized for developers.
- **⚡ Performance First:** Powered by Vite and React for near-instant transitions.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/lorapok/api-atlas.git
   cd api-atlas
   ```
2. Install dependencies:
   ```bash
   cd lorapok-api-atlas
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🚢 Deployment

The project is configured for automated deployment to **GitHub Pages** via GitHub Actions.

1. Push your changes to the `main` branch.
2. The `.github/workflows/deploy.yml` workflow will automatically build and deploy the app.
3. Ensure your repository settings have GitHub Pages enabled (Source: GitHub Actions).

## 📂 Project Structure

- `lorapok-api-atlas/src/data`: Contains the `api_collection.json` source.
- `lorapok-api-atlas/src/components`: UI components including the animated Lorapok.
- `lorapok-api-atlas/scripts`: Automation scripts for data repair and validation.
- `.github/workflows`: CI/CD configurations.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*A product of **Lorapok** - Making APIs fun and accessible.*
