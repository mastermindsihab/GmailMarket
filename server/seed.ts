import { storage } from "./storage";

const defaultCategories = [
  {
    name: "Fresh Gmail",
    slug: "fresh",
    description: "Brand new Gmail accounts with clean history",
    buyPrice: "12.00",
    sellPrice: "15.00",
    icon: "sparkles",
    iconColor: "text-green-500",
  },
  {
    name: "Aged Gmail", 
    slug: "aged",
    description: "Established Gmail accounts with authentic aging",
    buyPrice: "28.00",
    sellPrice: "35.00",
    icon: "clock",
    iconColor: "text-orange-500",
  },
  {
    name: "Used Gmail",
    slug: "used",
    description: "Previously used accounts with activity history",
    buyPrice: "9.50",
    sellPrice: "12.00",
    icon: "user",
    iconColor: "text-blue-500",
  },
  {
    name: "Edu Gmail",
    slug: "edu",
    description: "Educational Gmail accounts with .edu domains",
    buyPrice: "68.00",
    sellPrice: "85.00",
    icon: "graduation-cap",
    iconColor: "text-purple-500",
  },
  {
    name: "Bulk Gmail",
    slug: "bulk",
    description: "Multiple Gmail accounts at wholesale pricing", 
    buyPrice: "96.00",
    sellPrice: "120.00",
    icon: "layer-group",
    iconColor: "text-violet-500",
  },
  {
    name: "Temporary Gmail",
    slug: "temporary",
    description: "Short-term use Gmail accounts for specific projects",
    buyPrice: "6.40",
    sellPrice: "8.00",
    icon: "timer",
    iconColor: "text-gray-500",
  },
  {
    name: "PVA Gmail",
    slug: "pva",
    description: "Phone verified Gmail accounts with mobile verification",
    buyPrice: "17.60", 
    sellPrice: "22.00",
    icon: "check-circle",
    iconColor: "text-green-600",
  },
  {
    name: "Non-PVA Gmail",
    slug: "non-pva",
    description: "Gmail accounts without phone verification",
    buyPrice: "8.00",
    sellPrice: "10.00",
    icon: "shield-x", 
    iconColor: "text-red-500",
  },
];

export async function seedDatabase() {
  console.log("🌱 Seeding database...");
  
  try {
    console.log("Creating new Gmail categories...");
    
    // Create new Gmail categories using storage
    for (const categoryData of defaultCategories) {
      await storage.createCategory({
        ...categoryData,
        isActive: true
      });
    }
    
    console.log("✅ Gmail categories seeded successfully");
    console.log("🎉 Database seeding completed");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
