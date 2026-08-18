# Jamboree Signature Generator

A pure JavaScript application to generate multilingual email signatures for the Jamboree organization.

## Features

- **Pure JavaScript**: No server-side dependencies - runs entirely in the browser
- **Multilingual Support**: German, French, and Italian translations
- **Configuration-Based**: Easy to maintain through JSON configuration files
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Preview**: Instant signature generation and preview
- **Copy to Clipboard**: Easy copying of generated HTML signatures

## Architecture

This application has been converted from PHP to a pure client-side JavaScript solution for better maintainability and easier deployment.

### Configuration Files

**src/config/app-config.json**: Contains application settings, validation rules, and UI configuration.

**src/config/translations.json**: Contains all translations for:
- UI text in German, French, and Italian
- Role translations by gender and language
- Sector/department translations

## Development

### Prerequisites
- Node.js (for the development server)
- Modern web browser with ES6+ support

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:8080 in your browser

### Build for Production

No build step is required - just upload the files to your hosting service.

```bash
# For production deployment, you can use:
npm run start
```

## License

MIT License
