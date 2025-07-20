
import { MongoClient, type Db } from 'mongodb';

// MONGODB_DB_NAME is optional and has a default.
// process.env.MONGODB_URI will be checked within connectToDatabase.

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB_NAME || 'can_ecommerce';

  if (!MONGODB_URI || MONGODB_URI.trim() === "") {
    const dbConfigError = new Error('Database configuration error: MONGODB_URI environment variable is not defined or is empty.');
    console.error('------------------------------------------------------');
    console.error('FATAL: MONGODB_URI IS MISSING OR EMPTY IN YOUR .env FILE');
    console.error('Please ensure MONGODB_URI is correctly set in your .env file for the application to connect to the database.');
    console.error('Example for local MongoDB: MONGODB_URI="mongodb://localhost:27017/can_ecommerce"');
    console.error('Example for MongoDB Atlas: MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-address>/can_ecommerce?retryWrites=true&w=majority"');
    console.error('------------------------------------------------------');
    throw dbConfigError;
  }

  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    const schemeError = new Error(`Invalid MongoDB URI scheme. Expected "mongodb://" or "mongodb+srv://", but received: "${MONGODB_URI.substring(0, MONGODB_URI.indexOf(':') + 3)}..."`);
    console.error('------------------------------------------------------');
    console.error('FATAL: INVALID MONGODB_URI SCHEME');
    console.error(schemeError.message);
    console.error(`Current MONGODB_URI value: ${MONGODB_URI}`);
    console.error('Ensure your MONGODB_URI starts with either "mongodb://" or "mongodb+srv://".');
    console.error('------------------------------------------------------');
    throw schemeError;
  }

  if (cachedClient && cachedDb) {
    try {
      // Ping the database to ensure the cached connection is still alive
      await cachedClient.db(MONGODB_DB).command({ ping: 1 });
       console.log("Using cached MongoDB connection.");
       return { client: cachedClient, db: cachedDb };
    } catch (e) {
      console.warn("Cached MongoDB client connection lost. Reconnecting...", (e as Error).message);
      cachedClient = null;
      cachedDb = null;
      // Attempt to close the potentially broken client
      if (cachedClient) {
        try {
          await cachedClient.close();
        } catch (closeError) {
          console.warn("Error closing broken cached client:", (closeError as Error).message);
        }
      }
    }
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    const client = new MongoClient(MONGODB_URI); // MongoClient constructor handles parsing
    await client.connect();
    const db = client.db(MONGODB_DB);

    cachedClient = client;
    cachedDb = db;

    console.log("Successfully connected to MongoDB.");
    return { client, db };
  } catch (error: unknown) { 
    const connectionError = new Error(`Could not connect to the database. Original error: ${(error as Error).message}`);
    console.error("Failed to connect to MongoDB:", (error as Error).message, (error as Error).stack);
    throw connectionError;
  }
}
