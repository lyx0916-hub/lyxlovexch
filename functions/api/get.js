export async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const key = searchParams.get('key');
    const db = context.env.DB;

    if (!key) {
      return new Response(JSON.stringify({ value: null }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const row = await db.prepare("SELECT value FROM love_data WHERE key = ?").bind(key).first();
    return new Response(JSON.stringify({ value: row?.value || null }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ value: null, error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
