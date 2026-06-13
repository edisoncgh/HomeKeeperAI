import {
  handleMaintenanceApiError,
  okMaintenance,
  scanOrphanImageFiles
} from "@/lib/api/maintenance/orphan-images";

export async function GET() {
  try {
    return okMaintenance(await scanOrphanImageFiles());
  } catch (error) {
    return handleMaintenanceApiError(error);
  }
}
