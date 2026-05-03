#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { getApis, getApi, searchApis, getCategories, getRandomApi, getCount, getSnippets } from 'lorapok-atlas'

const server = new Server(
  { name: 'lorapok-atlas', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_apis',
      description: 'Search the Lorapok Atlas directory of 2100+ free/open-source APIs by query, category, or auth type',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term (name, description, or category)' },
          category: { type: 'string', description: 'Filter by category (e.g. "AI & Machine Learning", "Weather")' },
          authType: { type: 'string', enum: ['free', 'key', 'oauth', 'any'], description: 'Filter by auth requirement' },
          limit: { type: 'number', description: 'Max results to return (default 10)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_api',
      description: 'Get full details for a specific API by name',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Exact API name' },
        },
        required: ['name'],
      },
    },
    {
      name: 'get_code_snippet',
      description: 'Get a ready-to-use code snippet for an API in your preferred language',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'API name' },
          language: { type: 'string', enum: ['curl', 'javascript', 'python', 'go'], description: 'Programming language' },
        },
        required: ['name', 'language'],
      },
    },
    {
      name: 'list_categories',
      description: 'List all 34 API categories available in Lorapok Atlas',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_apis_by_category',
      description: 'Get all APIs in a specific category',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Category name' },
          authType: { type: 'string', enum: ['free', 'key', 'oauth', 'any'] },
          limit: { type: 'number' },
        },
        required: ['category'],
      },
    },
    {
      name: 'get_random_api',
      description: 'Get a random API, optionally from a specific category',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Optional category to pick from' },
        },
      },
    },
    {
      name: 'get_stats',
      description: 'Get statistics about the Lorapok Atlas API directory',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'search_apis': {
        const results = searchApis(args?.query as string, {
          category: args?.category as string,
          authType: args?.authType as any,
          limit: (args?.limit as number) || 10,
        })
        return {
          content: [{
            type: 'text',
            text: results.length === 0
              ? `No APIs found for "${args?.query}"`
              : `Found ${results.length} APIs:\n\n` + results.map(a =>
                  `**${a.name}** (${a.category})\n` +
                  `  ${a.description}\n` +
                  `  ${a.method} ${a.url}\n` +
                  `  Auth: ${a.authRequired || 'Free'}`
                ).join('\n\n'),
          }],
        }
      }

      case 'get_api': {
        const api = getApi(args?.name as string)
        if (!api) return { content: [{ type: 'text', text: `API "${args?.name}" not found. Try search_apis to find it.` }] }
        return {
          content: [{
            type: 'text',
            text: `**${api.name}**\nCategory: ${api.category}\nDescription: ${api.description}\nMethod: ${api.method}\nURL: ${api.url}\nAuth: ${api.authRequired || 'Free (no key needed)'}${api.authLink ? `\nGet key: ${api.authLink}` : ''}`,
          }],
        }
      }

      case 'get_code_snippet': {
        const api = getApi(args?.name as string)
        if (!api) return { content: [{ type: 'text', text: `API "${args?.name}" not found.` }] }
        const snippets = getSnippets(api)
        const lang = (args?.language as keyof typeof snippets) || 'javascript'
        return {
          content: [{
            type: 'text',
            text: `\`\`\`${lang}\n${snippets[lang]}\n\`\`\``,
          }],
        }
      }

      case 'list_categories': {
        const cats = getCategories()
        const all = getApis()
        return {
          content: [{
            type: 'text',
            text: `${cats.length} categories in Lorapok Atlas:\n\n` +
              cats.map(c => `- **${c}** (${all.filter(a => a.category === c).length} APIs)`).join('\n'),
          }],
        }
      }

      case 'get_apis_by_category': {
        const results = getApis({
          category: args?.category as string,
          authType: args?.authType as any,
          limit: (args?.limit as number) || 20,
        })
        return {
          content: [{
            type: 'text',
            text: results.length === 0
              ? `No APIs found in category "${args?.category}"`
              : `${results.length} APIs in **${args?.category}**:\n\n` +
                results.map(a => `- **${a.name}** — ${a.description} (${a.authRequired || 'Free'})`).join('\n'),
          }],
        }
      }

      case 'get_random_api': {
        const api = getRandomApi(args?.category as string)
        const snippets = getSnippets(api)
        return {
          content: [{
            type: 'text',
            text: `**${api.name}** (${api.category})\n${api.description}\n\n\`\`\`javascript\n${snippets.javascript}\n\`\`\``,
          }],
        }
      }

      case 'get_stats': {
        const all = getApis()
        const cats = getCategories()
        const free = all.filter(a => !a.authRequired).length
        const keyed = all.filter(a => a.authRequired === 'API Key').length
        const oauth = all.filter(a => a.authRequired === 'OAuth').length
        return {
          content: [{
            type: 'text',
            text: `**Lorapok Atlas Stats**\nTotal APIs: ${getCount()}\nCategories: ${cats.length}\nFree (no auth): ${free}\nAPI Key required: ${keyed}\nOAuth required: ${oauth}\n\nWebsite: https://maijied.github.io/Lorapok-API_Atlas/\nGitHub: https://github.com/Maijied/Lorapok-API_Atlas`,
          }],
        }
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] }
    }
  } catch (e: any) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Lorapok Atlas MCP server running')
}

main().catch(console.error)
