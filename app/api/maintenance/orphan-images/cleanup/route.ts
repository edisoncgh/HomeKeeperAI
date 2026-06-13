import {
  cleanupOrphanImageFiles,
  handleMaintenanceApiError,
  okMaintenance
} from "@/lib/api/maintenance/orphan-images";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
    return okMaintenance(await cleanupOrphanImageFiles({ confirm: body.confirm === true }));
  } catch (error) {
    return handleMaintenanceApiError(error);
  }
}
