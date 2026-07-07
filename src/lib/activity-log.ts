import { db } from '@/lib/db';
import type { LogAction, Prisma } from '@prisma/client';

export interface LogEntry {
  userId: string;
  action: LogAction;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

// Append-only — this function only ever INSERTs. There is intentionally no update/delete.
export async function writeLog(entry: LogEntry): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata,
      },
    });
  } catch (e) {
    // Log failures must never crash the calling operation
    console.error('ActivityLog write failed:', e);
  }
}
