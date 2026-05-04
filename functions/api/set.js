export async function onRequestPost(context) {
  try {
    const { key, value } = await context.request.json();
    const db = context.env.DB;

    await db.prepare("REPLACE INTO love_data (key, value) VALUES (?, ?)").bind(key, value).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
