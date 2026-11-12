import { describe, it, expect } from 'vitest';
import { MCP_TOOLS, FORBIDDEN_MONEY_TOOLS, GET, POST } from '../src/app/api/mcp/route';
import { NextRequest } from 'next/server';

describe('RestockPilot Read-Only MCP Server Security Boundary', () => {
  it('strictly contains ZERO money-moving or approval tools in tools/list', () => {
    const exposedToolNames = MCP_TOOLS.map((t) => t.name.toLowerCase());

    for (const forbidden of FORBIDDEN_MONEY_TOOLS) {
      expect(
        exposedToolNames.some((tool) => tool.includes(forbidden)),
        `Security failure: Forbidden money tool '${forbidden}' was exposed in MCP tools list!`
      ).toBe(false);
    }

    // Specific forbidden tools explicitly named in hackathon requirements
    const requiredAbsent = ['pay', 'capture', 'approve', 'refund', 'payout', 'update_mandate'];
    for (const absent of requiredAbsent) {
      expect(exposedToolNames).not.toContain(absent);
    }
  });

  it('exposes only read and draft proposal tools', () => {
    const allowed = ['get_mandate', 'get_low_stock', 'get_quotes', 'propose_reorder'];
    const exposed = MCP_TOOLS.map((t) => t.name);
    expect(exposed.sort()).toEqual(allowed.sort());
  });

  it('GET /api/mcp reports readOnly: true and moneyMovingToolsExposed: 0', async () => {
    const res = await GET();
    const json = await res.json();

    expect(json.readOnly).toBe(true);
    expect(json.moneyMovingToolsExposed).toBe(0);
    expect(json.server).toContain('RestockPilot');
  });

  it('POST /api/mcp rejects any forbidden tool execution with JSON-RPC error -32000', async () => {
    for (const forbidden of ['pay', 'capture', 'approve', 'refund', 'payout', 'update_mandate']) {
      const req = new NextRequest('http://localhost:3000/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 42,
          method: 'tools/call',
          params: {
            name: forbidden,
            arguments: { amount: 100 },
          },
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(-32000);
      expect(json.error.message).toContain('SECURITY ERROR');
      expect(json.error.message).toContain('strictly read-and-propose only');
    }
  });

  it('executes get_mandate, get_low_stock, and get_quotes successfully via JSON-RPC 2.0', async () => {
    // 1. tools/list
    const listReq = new NextRequest('http://localhost:3000/api/mcp', {
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    const listRes = await POST(listReq);
    const listJson = await listRes.json();
    expect(listJson.result.tools).toHaveLength(4);

    // 2. get_low_stock
    const lowStockReq = new NextRequest('http://localhost:3000/api/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'get_low_stock' },
      }),
    });
    const lowStockRes = await POST(lowStockReq);
    const lowStockJson = await lowStockRes.json();
    const lowStockParsed = JSON.parse(lowStockJson.result.content[0].text);
    expect(lowStockParsed.lowStockItems.length).toBeGreaterThan(0);
    expect(lowStockParsed.totalDuplicateSpendPrevented).toBe(838.5);

    // 3. get_quotes for ESPRESSO-5LB
    const quotesReq = new NextRequest('http://localhost:3000/api/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_quotes', arguments: { sku: 'ESPRESSO-5LB' } },
      }),
    });
    const quotesRes = await POST(quotesReq);
    const quotesJson = await quotesRes.json();
    const quotesParsed = JSON.parse(quotesJson.result.content[0].text);
    expect(quotesParsed.verifiedPeerMedianPrice).toBe(63.25);
  });
});

