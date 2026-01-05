# Markdown to CSV Converter

A simple, beautiful web application to convert markdown files containing tables into CSV format.

## Features

- 🎨 Modern, responsive UI
- 📤 Drag and drop file upload
- 📁 Multiple file support
- ⚡ Instant conversion in the browser (no server required)
- 💾 Download converted CSV files
- 🔄 Batch processing

## How to Use

1. Open `index.html` in your web browser
2. Drag and drop markdown files (`.md` or `.markdown`) into the upload area, or click to browse
3. Click "Convert All to CSV" button
4. Download the converted CSV files

## File Structure

- `index.html` - Main HTML file
- `style.css` - Styling
- `script.js` - Conversion logic
- `README.md` - This file

## How It Works

The application:
1. Parses markdown tables from uploaded files
2. Extracts table data (handles markdown formatting like bold text)
3. Converts the data to CSV format
4. Provides download links for each converted file

## Browser Compatibility

Works in all modern browsers that support:
- File API
- Drag and Drop API
- ES6 JavaScript

## Notes

- The conversion happens entirely in your browser - no data is sent to any server
- Supports markdown tables with standard markdown table syntax
- Automatically handles CSV escaping (quotes, commas, newlines)

