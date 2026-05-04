export async function onRequestGet(context) {
  const { key } = context.request.query;
  const db = context.env.DB;

  const row = await db.prepare("SELECT value FROM love_data WHERE key = ?").bind(key).first();
  return new Response(JSON.stringify({ value: row ? row.value : null }));
}