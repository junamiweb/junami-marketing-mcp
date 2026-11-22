# JUNAMI WordPress access check

This first Worker provides one read-only MCP tool. It requests the contact page with WordPress edit context and returns only its ID, slug, status and modification date. It never edits the site.

1. Connect this private repository in Cloudflare Workers Builds. Install with npm install, build with npm run build and deploy with npm run deploy.
2. Protect the Worker hostname with a Cloudflare Access self-hosted application. Allow the intended JUNAMI identity. Set ACCESS_TEAM (team subdomain only), ACCESS_AUD (application audience) and ALLOWED_EMAIL on the Worker.
3. Store WP_USER and WP_APP_PASSWORD as Cloudflare Worker secrets. Use an application password for a WordPress account permitted to edit the contact page. Never commit credentials.
4. From an Access-authenticated MCP client, connect to /mcp and call read_contact_page. A request without an Access assertion must be denied. Confirm the returned slug is contact-us.

This bootstrap uses Cloudflare Access. Interactive ChatGPT connector OAuth, Google authorization, analytics administration and site mutations are separate integration stages. An Access login in the browser alone does not authenticate ChatGPT's remote MCP requests.
