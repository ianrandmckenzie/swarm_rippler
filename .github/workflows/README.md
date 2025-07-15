# GitHub Actions Workflows

This repository contains two GitHub Actions workflows for building and releasing the Swarm Rippler application across multiple platforms.

## Workflows

### 1. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- When you push a git tag starting with `v` (e.g., `v1.0.0`, `v2.1.3`)
- Manual dispatch with version input

**Platforms Built:**
- **Desktop**: Windows (x64), macOS (Intel + Apple Silicon), Linux (x64)
- **Mobile**: iOS, Android
- **Web**: Static files for web hosting

**Artifacts Created:**
- Windows: `.msi` installer, `.exe` portable
- macOS: `.dmg` installer, `.app` bundle
- Linux: `.deb`, `.rpm`, `.AppImage` packages
- iOS: `.ipa` file
- Android: `.apk` and `.aab` files
- Web: `.tar.gz` and `.zip` archives

### 2. Build & Test Workflow (`.github/workflows/build-test.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Purpose:**
- Tests builds on all desktop platforms
- Runs code formatting and linting checks
- Provides build artifacts for testing (7-day retention)

## How to Create a Release

### Method 1: Git Tags (Recommended)
```bash
# Create and push a new tag
git tag v1.0.0
git push origin v1.0.0
```

### Method 2: Manual Dispatch
1. Go to the "Actions" tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter the version (e.g., `v1.0.0`)
5. Click "Run workflow"

## Platform-Specific Notes

### Desktop Applications
- **Windows**: Both MSI installer and portable EXE are provided
- **macOS**: Universal binaries supporting both Intel and Apple Silicon
- **Linux**: Multiple package formats for broad compatibility

### Mobile Applications
- **iOS**: Requires code signing to install on devices
- **Android**: APK for direct installation, AAB for Google Play Store

### Web Application
- Self-contained static files
- Can be deployed to any web server or CDN
- No server-side processing required

## Local Development

### Prerequisites
- Node.js 20+
- Rust (latest stable)
- Platform-specific dependencies:
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`
  - **Android**: Android SDK, NDK, Java 17+
  - **iOS**: Xcode (macOS only)

### Available Scripts
```bash
# Web development
npm run dev          # Start development server
npm run build        # Build web app

# Desktop development
npm run tauri:dev    # Start Tauri development
npm run tauri:build  # Build desktop app

# Mobile development
npm run android:init # Initialize Android project
npm run android:build# Build Android app
npm run ios:init     # Initialize iOS project (macOS only)
npm run ios:build    # Build iOS app (macOS only)
```

## Troubleshooting

### Common Issues

1. **Mobile builds failing**: Ensure all mobile dependencies are installed
2. **macOS builds failing**: Check Xcode command line tools are installed
3. **Linux builds failing**: Verify all system dependencies are available
4. **Release not creating**: Ensure tag follows `v*` pattern (e.g., `v1.0.0`)

### Build Logs
Check the "Actions" tab in GitHub for detailed build logs and error messages.

## Configuration

The workflows can be customized by editing:
- `.github/workflows/release.yml` - Release workflow settings
- `.github/workflows/build-test.yml` - Build/test workflow settings
- `src-tauri/tauri.conf.json` - Tauri application settings
- `package.json` - Node.js build scripts
