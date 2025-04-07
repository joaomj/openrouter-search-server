# OpenRouter Search Server

An MCP server that provides web search capabilities using OpenRouter's API with Google Gemini Pro.

## Features
- Web search via OpenRouter API
- Uses Google Gemini Pro model
- Simple MCP interface

## Installation
1. Clone this repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`

## Configuration
Add the following to your MCP settings file:
```json
{
  "command": "node",
  "args": ["/path/to/build/index.js"],
  "env": {
    "OPENROUTER_API_KEY": "your-api-key-here"
  }
}
```

**Important:** Never commit your API key to the repository!

## Usage
The server provides a single tool called `web_search` that takes a query string and returns search results.

## License
MIT