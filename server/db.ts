import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = "mongodb+srv://sihabsorker:0QbHvqaHUBVi62jj@cluster0.ijcuovp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DATABASE_NAME = "gmailmarket";

if (!MONGODB_URI) {
  throw new Error(
    "MongoDB URI must be set.",
  );
}

export const client = new MongoClient(MONGODB_URI);
export const db: Db = client.db(DATABASE_NAME);

// Connect to MongoDB
export const connectToMongoDB = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};