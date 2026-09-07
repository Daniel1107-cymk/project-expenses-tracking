import { Pool } from "pg";

// ponytail: one pool, one tagged template. No ORM, no query builder.
// `sql\`... ${x} ...\`` -> parameterized query, never string-concatenated values.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const sql = async (strings: TemplateStringsArray, ...values: unknown[]) =>
  (await pool.query(strings.reduce((q, s, i) => `${q}$${i}${s}`), values)).rows;

let ready: Promise<unknown> | null = null;
// ponytail: CREATE TABLE IF NOT EXISTS instead of a migration tool.
// Add real migrations when the schema starts changing in production.
// pool.query without values uses the simple query protocol, so the whole schema
// goes out as ONE round trip -- it used to be three, serially, on every cold start.
export function ensureSchema() {
  ready ??= pool.query(`
    create table if not exists projects (
      id serial primary key,
      name text not null unique,
      created_at timestamptz not null default now()
    );
    create table if not exists expenses (
      id serial primary key,
      project_id int not null references projects(id) on delete cascade,
      spent_on date not null,
      category text not null default 'Lainnya',
      person text not null default '',
      amount bigint not null check (amount >= 0),
      note text not null default '',
      created_at timestamptz not null default now()
    );
    create index if not exists expenses_project_spent on expenses (project_id, spent_on);
  `);
  return ready;
}
