// scripts/createAgentKey.ts
import * as readline from "readline";
import crypto from "crypto";
import { db } from "../server/db.js";
import { agentIdentities, agentRoles } from "../shared/schema.js";
import { hashAgentKey } from "../server/security/agentAuth.js";
import dotenv from "dotenv";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("\n🤖 IslandLoaf Agent Key Generator\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set. Cannot create agent key.");
    console.error("   Please configure DATABASE_URL in .env");
    process.exit(1);
  }

  // Prompt for agent name
  const name = await question("Agent name: ");
  if (!name || name.trim().length === 0) {
    console.error("❌ Agent name is required");
    process.exit(1);
  }

  // Prompt for role
  console.log("\nAvailable roles:");
  agentRoles.forEach((role, i) => {
    console.log(`  ${i + 1}) ${role}`);
  });

  const roleInput = await question("\nSelect role (1-9): ");
  const roleIndex = parseInt(roleInput) - 1;

  if (roleIndex < 0 || roleIndex >= agentRoles.length) {
    console.error("❌ Invalid role selection");
    process.exit(1);
  }

  const role = agentRoles[roleIndex];

  // Confirm
  const confirm = await question(`\nCreate agent "${name}" with role "${role}"? (y/n): `);
  if (confirm.toLowerCase() !== "y") {
    console.log("Cancelled.");
    process.exit(0);
  }

  try {
    // Generate secure API key
    const apiKey = `agent_${crypto.randomBytes(32).toString("hex")}`;

    // Hash the key
    const apiKeyHash = await hashAgentKey(apiKey);

    // Insert into database
    const [agent] = await db
      .insert(agentIdentities)
      .values({
        name: name.trim(),
        role,
        apiKeyHash,
        isActive: true,
        metadata: { createdVia: "cli" },
      })
      .returning();

    console.log("\n✅ Agent created successfully!\n");
    console.log(`ID: ${agent.id}`);
    console.log(`Name: ${agent.name}`);
    console.log(`Role: ${agent.role}`);
    console.log(`Active: ${agent.isActive}`);
    console.log(`\n⚠️  API Key (save securely, it will not be shown again):\n`);
    console.log(`${apiKey}\n`);
    console.log("You can test this key with:");
    console.log(`curl -X POST http://localhost:8080/api/agent/cron/tick -H "x-agent-key: ${apiKey}"\n`);
  } catch (error: any) {
    console.error("\n❌ Failed to create agent:", error.message);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();



