// scripts/listAgents.ts
import { db } from "../server/db.js";
import { agentIdentities } from "../shared/schema.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n🤖 IslandLoaf Agent Identities\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set. Cannot list agents.");
    console.error("   Please configure DATABASE_URL in .env");
    process.exit(1);
  }

  try {
    const agents = await db.select().from(agentIdentities);

    if (agents.length === 0) {
      console.log("No agents found. Create one with: npm run agent:create-key\n");
      process.exit(0);
    }

    console.log(`Found ${agents.length} agent(s):\n`);

    // Print table header
    console.log(
      "ID".padEnd(38) +
        "Name".padEnd(25) +
        "Role".padEnd(25) +
        "Active".padEnd(10) +
        "Created"
    );
    console.log("-".repeat(120));

    // Print agents
    agents.forEach((agent) => {
      const id = agent.id.slice(0, 8) + "...";
      const name = agent.name.slice(0, 23);
      const role = agent.role.slice(0, 23);
      const active = agent.isActive ? "✅ Yes" : "❌ No";
      const created = agent.createdAt
        ? new Date(agent.createdAt).toISOString().split("T")[0]
        : "N/A";

      console.log(
        id.padEnd(38) +
          name.padEnd(25) +
          role.padEnd(25) +
          active.padEnd(10) +
          created
      );
    });

    console.log("\n");
  } catch (error: any) {
    console.error("\n❌ Failed to list agents:", error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();



