import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;

export const client = new MongoClient(uri!);
export const db = client.db();

const host = client.options.srvHost;
console.log(`MongoDB Connected: ${host}`.cyan.underline.bold);
