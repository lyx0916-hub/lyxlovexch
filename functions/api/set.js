export async function onRequestPost(context) {
  const body = await context.request.json();
  const { key, value } = body;
  const db = context.env.DB;

  await db.prepare("REPLACE INTO love_data (key, value) VALUES (?, ?)").bind(key, value).run();
  return new Response(JSON.stringify({ ok: 1 }));
}