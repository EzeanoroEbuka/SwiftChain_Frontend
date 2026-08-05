import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address') || '';

  if (!address.includes('*')) {
    return NextResponse.json({ error: 'Invalid federation address' }, { status: 400 });
  }

  const [, domain] = address.split('*');
  if (!domain) {
    return NextResponse.json({ error: 'Invalid domain in address' }, { status: 400 });
  }

  try {
    // Try to discover federation server from stellar.toml
    const tomlUrl = `https://${domain}/.well-known/stellar.toml`;
    let federationServer: string | null = null;

    try {
      const tomlRes = await fetch(tomlUrl);
      if (tomlRes.ok) {
        const toml = await tomlRes.text();
        const m = toml.match(/FEDERATION_SERVER\s*=\s*"(.*?)"/i);
        if (m && m[1]) federationServer = m[1];
      }
    } catch (e) {
      // ignore discovery errors and fallback
    }

    if (!federationServer) {
      federationServer = `https://${domain}/federation`;
    }

    const url = `${federationServer.replace(/\/$/, '')}?type=name&q=${encodeURIComponent(address)}`;
    const fedRes = await fetch(url, { method: 'GET' });

    if (!fedRes.ok) {
      const text = await fedRes.text().catch(() => '');
      return NextResponse.json({ error: `Federation server error: ${text}` }, { status: fedRes.status || 502 });
    }

    const json = await fedRes.json();
    if (!json.account_id) {
      return NextResponse.json({ error: 'No account_id in federation response' }, { status: 404 });
    }

    return NextResponse.json({ stellar_address: json.stellar_address || address, account_id: json.account_id });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
