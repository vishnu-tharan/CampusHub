import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/campushub";

const globalForMongo = globalThis;

if (!globalForMongo._mongoClient) {
  const client = new MongoClient(uri);
  globalForMongo._mongoClient = client;
  globalForMongo._mongoDb = client.db();
}

export const client = globalForMongo._mongoClient;
export const db = globalForMongo._mongoDb;

export function toObjectId(id) {
  if (typeof id === "string" && ObjectId.isValid(id) && id.length === 24) {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }
  return id;
}

export function toIdFilter(id) {
  if (!id) return { id: "__none__" };
  const oid = toObjectId(id);
  if (oid instanceof ObjectId) {
    return { $or: [{ _id: oid }, { _id: id }, { id }] };
  }
  return { $or: [{ _id: id }, { id }] };
}

export function normalizeDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: doc.id ?? _id?.toString(),
    ...rest,
  };
}
