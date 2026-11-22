// Read JUNAMI's contact page after validating the caller.
import { createRemoteJWKSet, jwtVerify } from "jose";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname !== "/mcp") return new Response("Not found", {status: 404});
    const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!assertion || !env.ACCESS_TEAM || !env.ACCESS_AUD || !env.ALLOWED_EMAIL)
      return new Response("Access required", {status: 401});
    const issuer = "https://" + env.ACCESS_TEAM + ".cloudflareaccess.com";
    try {
      const keys = createRemoteJWKSet(new URL(issuer + "/cdn-cgi/access/certs"));
      const {payload} = await jwtVerify(assertion, keys, {issuer, audience: env.ACCESS_AUD, algorithms: ["RS256"], requiredClaims: ["exp","sub"]});
      if (typeof payload.email !== "string" || payload.email.toLowerCase() !== env.ALLOWED_EMAIL.toLowerCase())
        return new Response("Forbidden", {status: 403});
    } catch {
      return new Response("Invalid Access identity", {status: 401});
    }
    const server = new McpServer({name: "junami-marketing", version: "0.1.0"});
    server.registerTool("read_contact_page", {
      description: "Verify authenticated editorial access to JUNAMI's contact page.",
      inputSchema: {}, annotations: {readOnlyHint: true}
    }, async () => {
      if (!env.WP_USER || !env.WP_APP_PASSWORD) throw new Error("WordPress credentials missing");
      const url = "https://junami.co.il/wp-json/wp/v2/pages?context=edit&slug=contact-us&_fields=id,slug,status,modified_gmt";
      const response = await fetch(url, {redirect: "error", headers: {
        Authorization: "Basic " + btoa(env.WP_USER + ":" + env.WP_APP_PASSWORD)
      }});
      if (!response.ok) throw new Error("WordPress returned " + response.status);
      const pages = await response.json();
      if (!Array.isArray(pages) || pages.length !== 1 || pages[0].slug !== "contact-us")
        throw new Error("Contact page not uniquely identified");
      return {content: [{type: "text", text: JSON.stringify(pages[0])}]};
    });
    return createMcpHandler(server, {route: "/mcp"})(request, env, ctx);
  }
};
