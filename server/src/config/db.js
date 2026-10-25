import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Connected to MongoDB database "${mongoose.connection.name}"`);
}

export function disconnectDatabase() {
  return mongoose.disconnect();
}
