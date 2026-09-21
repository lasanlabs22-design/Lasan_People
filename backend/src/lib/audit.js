import { db, schema } from "../db/client.js";

export async function audit(actorId, action, entity, entityId = null, meta = null) {
  try {
    await db.insert(schema.auditLogs).values({ actorId, action, entity, entityId, meta });
  } catch (err) {
    // Audit must never break the request it describes.
    console.error("audit log failed", err);
  }
}
