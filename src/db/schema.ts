import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const citizens = pgTable('citizens', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  cpf: text('cpf').notNull().unique(),
  role: text('role').notNull().default('Cidadão'),
  state: text('state').notNull().default('DF'),
  party: text('party').default('Sem Partido'),
  email: text('email'),
  password: text('password'),
  avatarUrl: text('avatar_url').notNull(),
  titleNumber: text('title_number'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
