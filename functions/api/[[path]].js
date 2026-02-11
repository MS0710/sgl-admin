export async function onRequest(context) {
  const { request, params } = context;

  // 你的上游 API 網域
  const upstream = "https://api-dev.sgl.com.tw";

  // /api/<...> 的 <...> 會落在 params.path
  const rest = (params.path || []).join("/");

  // 保留 query string
  const incomingUrl = new URL(request.url);
  const targetUrl = `${upstream}/${rest}${incomingUrl.search}`;

  // 先處理 CORS preflight（有些情況會遇到）
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": incomingUrl.origin,
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // 轉發 request：保留 method/body/headers
  const headers = new Headers(request.headers);

  // 避免把 pages 網域的 Host/Origin 直接轉上游造成誤判（保守處理）
  headers.delete("host");
  headers.delete("origin");
  headers.set("accept", headers.get("accept") || "application/json");

  const init = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
    redirect: "follow",
  };

  const upstreamResp = await fetch(targetUrl, init);

  // 把上游回應原樣回傳（並補 CORS，避免瀏覽器擋）
  const outHeaders = new Headers(upstreamResp.headers);
  outHeaders.set("Access-Control-Allow-Origin", incomingUrl.origin);
  outHeaders.set("Access-Control-Allow-Credentials", "true");

  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    headers: outHeaders,
  });
}
