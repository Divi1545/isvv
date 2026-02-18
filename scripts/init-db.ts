import { db } from "../server/db";
import { users } from "../shared/schema";

async function initializeDatabase() {
  try {
    console.log("Initializing database with sample users...");
    
    // Create sample admin user
    const adminUser = await db.insert(users).values({
      username: "admin",
      email: "admin@islandloaf.com",
      password: "admin123", 
      fullName: "Admin User",
      businessName: "IslandLoaf Admin",
      businessType: "administration",
      role: "admin",
      categoriesAllowed: []
    }).returning();
    
    console.log("Created admin user:", adminUser[0].email);
    
    // Create sample vendor user
    const vendorUser = await db.insert(users).values({
      username: "vendor",
      email: "vendor@islandloaf.com",
      password: "password123",
      fullName: "Island Vendor",
      businessName: "Beach Paradise Villa",
      businessType: "accommodation",
      role: "vendor",
      categoriesAllowed: ["stays", "tours", "wellness"]
    }).returning();
    
    console.log("Created vendor user:", vendorUser[0].email);
    
    console.log("Database initialized successfully!");
    
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase().then(() => {
  console.log("Database initialization complete");
  process.exit(0);
}).catch(error => {
  console.error("Database initialization failed:", error);
  process.exit(1);
});