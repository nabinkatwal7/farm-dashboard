import { ok, fail, requireEntityAccess, readJson, ApiError } from "@/app/lib/api";
import { processTagRead, processBulkScan, completeSession } from "@/app/server/livestock/rfid/rfid-engine";

export async function POST(request: Request) {
  try {
    const user = await requireEntityAccess("rfidScanSessions", "write");
    const body = await readJson<{
      action: string;
      sessionId: string;
      earTag?: string;
      earTags?: string[];
    }>(request);

    const { action, sessionId, earTag, earTags } = body;

    let result: unknown;
    switch (action) {
      case "scan":
        if (!earTag) throw new ApiError(400, "earTag is required");
        result = await processTagRead(user.farmId, sessionId, earTag);
        break;
      case "bulk":
        if (!earTags || !Array.isArray(earTags)) throw new ApiError(400, "earTags array is required");
        result = await processBulkScan(user.farmId, sessionId, earTags);
        break;
      case "complete":
        result = await completeSession(sessionId);
        break;
      default:
        throw new ApiError(400, `Unknown action: ${action}`);
    }

    return ok({ result });
  } catch (error) {
    return fail(error);
  }
}
