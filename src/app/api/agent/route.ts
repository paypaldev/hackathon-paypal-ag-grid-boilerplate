import { NextRequest, NextResponse } from "next/server";
import { toolSearch, executeTool, COSMOS_TOOL_CATALOG } from "@/lib/mcp-gateway";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "SEARCH", // "SEARCH" or "EXECUTE"
      intentQuery = "",
      callerRole = "buyer_agent",
      toolName = "",
      arguments: toolArgs = {},
      approvalDigest = "",
    } = body;

    if (action === "SEARCH") {
      const searchResult = toolSearch(intentQuery, callerRole);
      return NextResponse.json({
        action: "SEARCH",
        callerRole,
        query: intentQuery,
        toolCount: searchResult.count,
        tools: searchResult.tools,
        metaTools: [
          COSMOS_TOOL_CATALOG.find((t) => t.name === "tool_search"),
          COSMOS_TOOL_CATALOG.find((t) => t.name === "execute_tool"),
        ],
      });
    }

    if (action === "EXECUTE") {
      if (!toolName) {
        return NextResponse.json({ error: "toolName is required for EXECUTE action" }, { status: 400 });
      }

      const execution = await executeTool(toolName, toolArgs, approvalDigest, callerRole);

      if (!execution.success) {
        return NextResponse.json(
          {
            error: execution.error,
            audit: execution.audit,
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        action: "EXECUTE",
        toolName,
        result: execution.result,
        audit: execution.audit,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

