const { Server } = require('@modelcontextprotocol/sdk');
const axios = require('axios');

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface SearchParams {
  query: string;
}

const server = new Server('openrouter-search-server');

server.addTool('web_search', {
  description: 'Perform a web search using OpenRouter API',
  parameters: {
    query: {
      type: 'string',
      description: 'Search query'
    }
  },
  handler: async ({ query }: SearchParams) => {
    try {
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'google/gemini-pro',
        messages: [{
          role: 'user',
          content: `Perform a web search for: ${query}`
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      // Parse and format results
      const results: SearchResult[] = response.data.choices[0].message.content
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const [title, ...rest] = line.split(' - ');
          const link = rest.pop()?.trim() || '';
          const snippet = rest.join(' - ').trim();
          return { title, link, snippet };
        });

      return { results };
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to perform search');
    }
  }
});

server.start();