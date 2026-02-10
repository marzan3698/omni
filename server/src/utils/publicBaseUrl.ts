import axios from 'axios';

export interface PublicBaseUrlResult {
  baseUrl: string;
  source: 'NGROK_URL' | 'API_URL' | 'PUBLIC_URL' | 'BASE_URL' | 'x-forwarded' | 'request' | 'ngrok-auto';
  _debug?: {
    ngrokAttempted?: boolean;
    ngrokSuccess?: boolean;
    ngrokError?: string;
    host?: string;
    isLocalhost?: boolean;
  };
}

type RequestLike = { protocol: string; get(name: string): string | undefined } | null;

/**
 * Resolves the public base URL for webhooks and OAuth callbacks.
 * Priority: NGROK_URL > API_URL > PUBLIC_URL > BASE_URL > x-forwarded > request host.
 * If host is localhost/127.0.0.1 and no env URL set, tries ngrok API to auto-detect tunnel.
 */
export async function getPublicBaseUrl(req: RequestLike = null): Promise<PublicBaseUrlResult> {
  const normalize = (url: string) => url.replace(/\/$/, '');

  // 1. Env vars (highest priority)
  const fromEnv = process.env.NGROK_URL || process.env.API_URL || process.env.PUBLIC_URL || process.env.BASE_URL;
  if (fromEnv && fromEnv.trim()) {
    const source = process.env.NGROK_URL
      ? 'NGROK_URL'
      : process.env.API_URL
        ? 'API_URL'
        : process.env.PUBLIC_URL
          ? 'PUBLIC_URL'
          : 'BASE_URL';
    return { baseUrl: normalize(fromEnv.trim()), source };
  }

  // 2. Request-based: x-forwarded (reverse proxy) or req.protocol/host
  let fromRequest = '';
  if (req) {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('x-forwarded-host') || req.get('host') || '';
    if (host) {
      fromRequest = `${proto.replace(/,.*$/, '').trim() || 'https'}://${host.replace(/,.*$/, '').trim()}`;
    }
  }

  // 3. If we got a non-localhost URL from request, use it
  if (fromRequest) {
    try {
      const u = new URL(fromRequest);
      const isLocal = ['localhost', '127.0.0.1'].includes(u.hostname);
      if (!isLocal) {
        return {
          baseUrl: normalize(fromRequest),
          source: req?.get('x-forwarded-host') ? 'x-forwarded' : 'request',
          _debug: { host: u.host, isLocalhost: false },
        };
      }
    } catch {
      // Invalid URL, continue
    }
  }

  // 4. Localhost detected - try ngrok API
  let debugHost = 'localhost:5001';
  if (fromRequest) {
    try {
      debugHost = new URL(fromRequest).host;
    } catch {
      // ignore invalid URL
    }
  }
  const debug: PublicBaseUrlResult['_debug'] = {
    ngrokAttempted: true,
    host: debugHost,
    isLocalhost: true,
  };

  try {
    const res = await axios.get<{
      tunnels?: Array<{
        public_url: string;
        proto?: string;
        config?: { addr?: string };
      }>;
    }>('http://127.0.0.1:4040/api/tunnels', { timeout: 1000 });

    const tunnels = res.data?.tunnels || [];
    const httpsTunnel = tunnels.find(
      (t) => t.public_url?.startsWith('https://') && (t.proto === 'https' || !t.proto)
    );
    const anyTunnel = tunnels.find((t) => t.public_url?.startsWith('https://')) || tunnels[0];

    if (anyTunnel?.public_url) {
      const url = (httpsTunnel || anyTunnel).public_url;
      debug.ngrokSuccess = true;
      return {
        baseUrl: normalize(url),
        source: 'ngrok-auto',
        _debug: debug,
      };
    }
    debug.ngrokError = 'No tunnels found';
  } catch (err: unknown) {
    debug.ngrokSuccess = false;
    debug.ngrokError = err instanceof Error ? err.message : 'ngrok API unreachable';
  }

  // 5. Fallback to request host or default
  const fallback = fromRequest || 'http://localhost:5001';
  return {
    baseUrl: normalize(fallback),
    source: 'request',
    _debug: debug,
  };
}
