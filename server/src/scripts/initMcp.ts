import fs from 'fs';
import path from 'path';
import os from 'os';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { UserDAL } from '../dal/UserDAL.js';
import { ApiKeyService } from '../services/ApiKeyService.js';

async function initMcp() {
  console.log('\n🔨 Mjolnir MCP Setup & Initialization');
  console.log('====================================\n');

  // 1. Connect to MongoDB
  try {
    await mongoose.connect(config.mongoUri, { dbName: config.dbName });
    console.log(`✓ Connected to MongoDB database: ${config.dbName}`);
  } catch (err: any) {
    console.error('✗ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  // 2. Find or create an approved user
  let user = await UserDAL.findOne({ isApproved: true });
  if (!user) {
    console.log('Creating initial approved admin user...');
    user = await UserDAL.create({
      googleId: 'local-admin-id',
      email: 'admin@mjolnir.local',
      name: 'Mjolnir Admin',
      isApproved: true,
      isAdmin: true
    });
    console.log(`✓ Created approved user: ${user.email} (${user._id})`);
  } else {
    console.log(`✓ Found approved user: ${user.name} (${user.email})`);
  }

  // 3. Get or generate API key
  let apiKeyDoc = await ApiKeyService.getApiKeyForUser(user._id.toString());
  if (!apiKeyDoc) {
    console.log('Generating new API key...');
    apiKeyDoc = await ApiKeyService.createOrRegenerateApiKey(user._id.toString(), 'CLI Generated Key');
  }

  const apiKey = apiKeyDoc.key;
  const mcpUrl = `http://localhost:${config.port}/api/mcp/sse`;

  console.log(`\n🔑 Personal API Key: \x1b[32m${apiKey}\x1b[0m`);
  console.log(`🌐 MCP SSE Endpoint: \x1b[36m${mcpUrl}\x1b[0m\n`);

  // 4. Update configuration files
  const homeDir = os.homedir();
  const configsToUpdate = [
    {
      name: 'VS Code User Settings',
      path: path.join(homeDir, 'Library/Application Support/Code/User/settings.json'),
      update: (json: any) => {
        // Support github.copilot.chat.mcpServers
        json['github.copilot.chat.mcpServers'] = json['github.copilot.chat.mcpServers'] || {};
        json['github.copilot.chat.mcpServers']['mjolnir'] = {
          url: mcpUrl,
          headers: { 'x-api-key': apiKey }
        };
        // Also support standard mcpServers
        json['mcpServers'] = json['mcpServers'] || {};
        json['mcpServers']['mjolnir'] = {
          url: mcpUrl,
          headers: { 'x-api-key': apiKey }
        };
      }
    },
    {
      name: 'VS Code Workspace Settings',
      path: path.join(process.cwd(), '.vscode/settings.json'),
      update: (json: any) => {
        json['github.copilot.chat.mcpServers'] = json['github.copilot.chat.mcpServers'] || {};
        json['github.copilot.chat.mcpServers']['mjolnir'] = {
          url: mcpUrl,
          headers: { 'x-api-key': apiKey }
        };
        json['mcpServers'] = json['mcpServers'] || {};
        json['mcpServers']['mjolnir'] = {
          url: mcpUrl,
          headers: { 'x-api-key': apiKey }
        };
      }
    },
    {
      name: 'Claude Desktop Config',
      path: path.join(homeDir, 'Library/Application Support/Claude/claude_desktop_config.json'),
      update: (json: any) => {
        json['mcpServers'] = json['mcpServers'] || {};
        json['mcpServers']['mjolnir'] = {
          url: mcpUrl,
          headers: { 'x-api-key': apiKey }
        };
      }
    },
    {
      name: 'Gemini CLI Settings',
      path: path.join(homeDir, '.gemini/settings.json'),
      update: (json: any) => {
        json['mcpServers'] = json['mcpServers'] || {};
        json['mcpServers']['mjolnir'] = {
          url: mcpUrl,
          headers: { 'x-api-key': apiKey }
        };
      }
    },
    {
      name: 'Gemini Antigravity Settings',
      path: path.join(homeDir, '.gemini/antigravity/settings.json'),
      update: (json: any) => {
        json['mcpServers'] = json['mcpServers'] || {};
        json['mcpServers']['mjolnir'] = {
          url: mcpUrl,
          headers: { 'x-api-key': apiKey }
        };
      }
    }
  ];

  for (const cfg of configsToUpdate) {
    try {
      const dir = path.dirname(cfg.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let data: any = {};
      if (fs.existsSync(cfg.path)) {
        try {
          const raw = fs.readFileSync(cfg.path, 'utf-8');
          data = JSON.parse(raw);
        } catch (_) {
          data = {};
        }
      }

      cfg.update(data);
      fs.writeFileSync(cfg.path, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✓ Updated \x1b[33m${cfg.name}\x1b[0m at ${cfg.path}`);
    } catch (e: any) {
      // Non-critical, skip if directory not accessible
      console.log(`- Skipped ${cfg.name} (${e.message})`);
    }
  }

  console.log('\n✨ MCP integration is ready!');
  console.log('Run the backend with: \x1b[36mnpm run server\x1b[0m (or \x1b[36mnpm run dev\x1b[0m from root)\n');

  await mongoose.disconnect();
}

initMcp().catch(err => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
