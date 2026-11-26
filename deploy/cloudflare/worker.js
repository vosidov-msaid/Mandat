// Cloudflare Containers front for the scanner page (`mandat web`): every request goes to one container,
// because reports and rate limits live in that process's memory.
import { DurableObject } from "cloudflare:workers";

const PORT = 8080;
// The longest idle time Cloudflare allows. After it, the container stops and in-memory reports are lost.
const INACTIVITY_TIMEOUT_MS = 6 * 60 * 60 * 1000;
// Set only by this Worker, never trusted from the visitor: the scanner rate-limits on it.
const CLIENT_IP_HEADER = "x-mandat-client-ip";

export class Scanner extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		const container = ctx.container;
		if (container.running) void ctx.blockConcurrencyWhile(() => container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS));
	}

	async fetch(request) {
		// Concurrent requests share one startup and readiness check.
		this.starting ??= this.startAndWaitForPort().finally(() => {
			this.starting = undefined;
		});
		await this.starting;
		const url = new URL(request.url);
		url.protocol = "http:";
		url.host = "container";
		const forwarded = new Request(url, request);
		forwarded.headers.delete("host");
		return this.ctx.container.getTcpPort(PORT).fetch(forwarded);
	}

	async startAndWaitForPort() {
		const container = this.ctx.container;
		if (!container.running) {
			container.start({
				image: container.images.base,
				instance: "lite",
				// The scanner fetches public MCP servers; its own SSRF guard refuses private addresses.
				enableInternet: true,
				entrypoint: ["node", "/app/dist/cli/bin.js", "web", "--host", "0.0.0.0", "--port", String(PORT), "--client-ip-header", CLIENT_IP_HEADER],
			});
		}
		await container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS);
		const port = container.getTcpPort(PORT);
		let lastError;
		for (let attempt = 0; attempt < 100; attempt++) {
			try {
				const response = await port.fetch("http://container/healthz", { signal: AbortSignal.timeout(1000) });
				await response.body?.cancel();
				if (response.ok) return;
				lastError = new Error(`Health check returned ${response.status}`);
			} catch (error) {
				lastError = error;
			}
			await scheduler.wait(200);
		}
		throw new Error(`Scanner container did not become ready on port ${PORT}`, { cause: lastError });
	}
}

export default {
	fetch(request, env) {
		const headers = new Headers(request.headers);
		headers.set(CLIENT_IP_HEADER, request.headers.get("cf-connecting-ip") ?? "unknown");
		// The scanner sends HSTS only behind HTTPS.
		headers.set("x-forwarded-proto", new URL(request.url).protocol === "https:" ? "https" : "http");
		return env.SCANNER.getByName("scanner").fetch(new Request(request, { headers }));
	},
};
