import { eq, and, desc, inArray } from 'drizzle-orm';
import { tickets, ticketComments } from '../db/schema/ticket.schema.js';
import { TenantRepository } from './base.repository.js';
import { db } from '../db/index.js';

export class TicketRepository extends TenantRepository {
  async createTicket(data: Omit<typeof tickets.$inferInsert, 'tenantId'>): Promise<typeof tickets.$inferSelect> {
    const dbClient = this.txSession || db;
    const [ticket] = await dbClient
      .insert(tickets)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return ticket!;
  }

  async findTicketById(id: number): Promise<typeof tickets.$inferSelect | undefined> {
    const dbClient = this.txSession || db;
    const [ticket] = await dbClient
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, id), eq(tickets.tenantId, this.tenantId)))
      .limit(1);
    return ticket;
  }

  async updateTicketWithVersion(
    id: number,
    currentVersion: number,
    data: Partial<Omit<typeof tickets.$inferInsert, 'id' | 'tenantId' | 'version'>>
  ): Promise<typeof tickets.$inferSelect | undefined> {
    const dbClient = this.txSession || db;
    const [updatedTicket] = await dbClient
      .update(tickets)
      .set({
        ...data,
        version: currentVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.tenantId, this.tenantId),
          eq(tickets.version, currentVersion)
        )
      )
      .returning();
    return updatedTicket;
  }

  async findTicketsByCreator(creatorId: number): Promise<(typeof tickets.$inferSelect)[]> {
    const dbClient = this.txSession || db;
    return dbClient
      .select()
      .from(tickets)
      .where(and(eq(tickets.creatorId, creatorId), eq(tickets.tenantId, this.tenantId)))
      .orderBy(desc(tickets.createdAt));
  }

  async findTicketsByAssignee(assigneeId: number): Promise<(typeof tickets.$inferSelect)[]> {
    const dbClient = this.txSession || db;
    return dbClient
      .select()
      .from(tickets)
      .where(and(eq(tickets.assignedToId, assigneeId), eq(tickets.tenantId, this.tenantId)))
      .orderBy(desc(tickets.createdAt));
  }

  async findAllTickets(): Promise<(typeof tickets.$inferSelect)[]> {
    const dbClient = this.txSession || db;
    return dbClient
      .select()
      .from(tickets)
      .where(eq(tickets.tenantId, this.tenantId))
      .orderBy(desc(tickets.createdAt));
  }

  async addComment(data: Omit<typeof ticketComments.$inferInsert, 'tenantId'>): Promise<typeof ticketComments.$inferSelect> {
    const dbClient = this.txSession || db;
    const [comment] = await dbClient
      .insert(ticketComments)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return comment!;
  }

  async getCommentsByTicket(ticketId: number): Promise<(typeof ticketComments.$inferSelect)[]> {
    const dbClient = this.txSession || db;
    return dbClient
      .select()
      .from(ticketComments)
      .where(and(eq(ticketComments.ticketId, ticketId), eq(ticketComments.tenantId, this.tenantId)))
      .orderBy(desc(ticketComments.createdAt));
  }
  
  async transaction<T>(callback: (txRepo: this) => Promise<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.transaction(async (tx: any) => {
      const txRepo = this.withTx(tx);
      return callback(txRepo);
    });
  }
}

export const ticketRepository = new TicketRepository();
