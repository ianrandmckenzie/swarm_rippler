# Security Documentation

## Security Measures Implemented

### Content Security Policy (CSP)
- **Tauri App**: Strict CSP configured in `tauri.conf.json`
- **Web Version**: CSP meta tag in HTML headers
- **Policy**: Restricts script execution to self-origin only, prevents inline scripts, blocks object-src

### HTTP Security Headers
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Enables XSS filtering
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

### Tauri Security
- **Minimal Permissions**: Only essential core permissions enabled
- **No File System Access**: App doesn't require file system permissions
- **No Network Access**: App operates offline, no external network calls

### Data Storage Security
- **Local Storage Only**: All data stored in browser's IndexedDB
- **No Sensitive Data**: App doesn't handle passwords, tokens, or personal information
- **Client-Side Only**: No server communication, reduces attack surface

### Development Security
- **Dependency Scanning**: Regular npm audit and cargo audit checks
- **Dev Server**: Restricted to localhost only (no external hosts)
- **Source Maps**: Disabled in production builds

## Security Considerations

### Known Dependencies Issues
- Some GTK3 Rust bindings are marked as unmaintained but are required by Tauri
- These are runtime dependencies for Linux desktop functionality only
- No security vulnerabilities affecting the application logic

### CSP Exceptions
- `'unsafe-inline'` for styles: Required for Tailwind CSS and dynamic theme switching
- This is considered acceptable for CSS as it doesn't execute JavaScript

## Reporting Security Issues

If you discover a security vulnerability, please report it to the project maintainer.

## Security Audit History

- **2025-01-17**: Initial security audit completed
  - Implemented CSP for both Tauri and web versions
  - Added HTTP security headers
  - Restricted Tauri permissions to minimum required
  - Secured Vite development configuration
