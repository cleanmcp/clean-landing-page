/**
 * Cloudflare Tunnel API helper.
 *
 * This runs on YOUR servers. The CF API token never leaves your infra.
 * Users interact with this through your org dashboard — they never touch CF.
 *
 * Required env vars:
 *   CLOUDFLARE_API_TOKEN  — CF API token with Tunnel + DNS permissions
 *   CLOUDFLARE_ACCOUNT_ID — your CF account ID
 *   CLOUDFLARE_ZONE_ID    — zone ID for tryclean.ai
 */

const CF_API = "https://api.cloudflare.com/client/v4";
const TUNNEL_DOMAIN = "tryclean.ai";

function env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

function headers() {
  return {
    Authorization: `Bearer ${env("CLOUDFLARE_API_TOKEN")}`,
    "Content-Type": "application/json",
  };
}

function accountId() {
  return env("CLOUDFLARE_ACCOUNT_ID");
}

function zoneId() {
  return env("CLOUDFLARE_ZONE_ID");
}

// ── Types ──────────────────────────────────────────────────────────────

export interface TunnelCreateResult {
  tunnelId: string;
  token: string;
  hostname: string;
  dnsRecordId: string;
}

export interface TunnelStatus {
  id: string;
  name: string;
  status: string;
  connections: { id: string; originIP: string; openedAt: string }[];
}

// ── Tunnel CRUD ────────────────────────────────────────────────────────

export async function createTunnel(orgSlug: string): Promise<TunnelCreateResult> {
  const tunnelName = `clean-${orgSlug}`;
  const hostname = `${orgSlug}.${TUNNEL_DOMAIN}`;

  // 1. Create the tunnel
  const createRes = await fetch(
    `${CF_API}/accounts/${accountId()}/cfd_tunnel`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: tunnelName,
        tunnel_secret: generateTunnelSecret(),
        config_src: "cloudflare",
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(
      `Failed to create tunnel: ${(err as any)?.errors?.[0]?.message ?? createRes.statusText}`
    );
  }

  const { result: tunnel } = (await createRes.json()) as {
    result: { id: string; token: string };
  };

  // 2. Configure tunnel ingress (route traffic to engine on port 8000)
  await configureTunnelIngress(tunnel.id, hostname);

  // 3. Create DNS CNAME record pointing hostname to tunnel
  const dnsRecordId = await createDnsRecord(tunnel.id, hostname);

  return {
    tunnelId: tunnel.id,
    token: tunnel.token,
    hostname,
    dnsRecordId,
  };
}

export async function deleteTunnel(
  tunnelId: string,
  dnsRecordId: string
): Promise<void> {
  // 1. Delete DNS record first
  await fetch(`${CF_API}/zones/${zoneId()}/dns_records/${dnsRecordId}`, {
    method: "DELETE",
    headers: headers(),
  });

  // 2. Clean up tunnel connections
  await fetch(
    `${CF_API}/accounts/${accountId()}/cfd_tunnel/${tunnelId}/connections`,
    {
      method: "DELETE",
      headers: headers(),
    }
  );

  // 3. Delete the tunnel
  const res = await fetch(
    `${CF_API}/accounts/${accountId()}/cfd_tunnel/${tunnelId}`,
    {
      method: "DELETE",
      headers: headers(),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to delete tunnel: ${(err as any)?.errors?.[0]?.message ?? res.statusText}`
    );
  }
}

export async function getTunnelStatus(tunnelId: string): Promise<TunnelStatus> {
  const res = await fetch(
    `${CF_API}/accounts/${accountId()}/cfd_tunnel/${tunnelId}`,
    { headers: headers() }
  );

  if (!res.ok) {
    throw new Error(`Failed to get tunnel status: ${res.statusText}`);
  }

  const { result } = (await res.json()) as { result: TunnelStatus };
  return result;
}

/**
 * Rotate tunnel token by deleting and recreating the tunnel.
 * CF doesn't support rotating tokens directly.
 */
export async function rotateTunnel(
  orgSlug: string,
  oldTunnelId: string,
  oldDnsRecordId: string
): Promise<TunnelCreateResult> {
  await deleteTunnel(oldTunnelId, oldDnsRecordId);
  return createTunnel(orgSlug);
}

// ── Internal helpers ───────────────────────────────────────────────────

async function configureTunnelIngress(
  tunnelId: string,
  hostname: string
): Promise<void> {
  const res = await fetch(
    `${CF_API}/accounts/${accountId()}/cfd_tunnel/${tunnelId}/configurations`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        config: {
          ingress: [
            {
              hostname,
              path: "/mcp/.*",
              service: "http://clean:8000",
            },
            {
              hostname,
              service: "http://dashboard:3000",
            },
            {
              // Catch-all required by CF
              service: "http_status:404",
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to configure tunnel: ${(err as any)?.errors?.[0]?.message ?? res.statusText}`
    );
  }
}

async function createDnsRecord(
  tunnelId: string,
  hostname: string
): Promise<string> {
  const res = await fetch(`${CF_API}/zones/${zoneId()}/dns_records`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type: "CNAME",
      name: hostname,
      content: `${tunnelId}.cfargotunnel.com`,
      proxied: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to create DNS record: ${(err as any)?.errors?.[0]?.message ?? res.statusText}`
    );
  }

  const { result } = (await res.json()) as { result: { id: string } };
  return result.id;
}

function generateTunnelSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64");
}
