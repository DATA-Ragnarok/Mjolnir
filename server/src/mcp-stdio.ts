import readline from 'readline';
import mongoose from 'mongoose';
import { config } from './config.js';
import { ApiKeyService } from './services/ApiKeyService.js';
import { McpServerService } from './services/McpServerService.js';

async function main() {
  const apiKey = process.env.MJOLNIR_API_KEY || process.argv[2];
  if (!apiKey) {
    console.error('MJOLNIR_API_KEY environment variable or CLI argument is required');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri, { dbName: config.dbName });
  const user = await ApiKeyService.validateApiKey(apiKey);
  if (!user || !user.isApproved) {
    console.error('Invalid API key or user not approved');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
      const msg = JSON.parse(line);
      const response = await McpServerService.handleJsonRpc(msg, user);
      if (response !== null) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (e: any) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' }
      }) + '\n');
    }
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
