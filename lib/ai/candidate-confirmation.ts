import type { AiCandidateField, AiCandidateResponse, AiFieldSource, AiItemCandidate } from "@/lib/ai/schemas";
import { buildItemPayload, emptyItemForm, type ItemFormState } from "@/lib/inventory/item-view";

type EditableCandidateField = keyof ItemFormState;

export interface AiTaxonomyOption {
  id: number;
  name: string;
}

export interface AiCandidateFieldMeta {
  confidence: number;
  label: string;
  reason?: string;
  source: AiFieldSource;
}

export interface AiCandidateConfirmation {
  candidate: AiItemCandidate;
  fieldMeta: Partial<Record<EditableCandidateField, AiCandidateFieldMeta>>;
  form: ItemFormState;
  id: string;
  warnings: string[];
}

interface BuildAiCandidateConfirmationsInput extends AiCandidateResponse {
  categories: AiTaxonomyOption[];
  locations: AiTaxonomyOption[];
  today: string;
}

export function buildAiCandidateConfirmations(input: BuildAiCandidateConfirmationsInput) {
  return input.candidates.map((candidate, index) => {
    const warnings = [...input.warnings];
    const confirmation = buildSingleConfirmation(candidate, index, input);
    return { ...confirmation, warnings: [...warnings, ...confirmation.warnings] };
  });
}

export function applyUserCandidateEdit(
  confirmation: AiCandidateConfirmation,
  field: EditableCandidateField,
  value: string
): AiCandidateConfirmation {
  return {
    ...confirmation,
    fieldMeta: {
      ...confirmation.fieldMeta,
      [field]: { confidence: 1, label: value, reason: "用户在确认界面修改或补充。", source: "user" }
    },
    form: { ...confirmation.form, [field]: value }
  };
}

export function buildAiConfirmedItemPayload(confirmation: AiCandidateConfirmation) {
  return buildItemPayload(confirmation.form);
}

export async function confirmAiCandidateItem(
  confirmation: AiCandidateConfirmation,
  fetcher: typeof fetch = fetch,
  options: { imageFile?: File } = {}
): Promise<{ item: unknown; ok: true; warning?: string } | { message: string; ok: false }> {
  const response = await fetcher("/api/items", {
    body: JSON.stringify(buildAiConfirmedItemPayload(confirmation)),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = (await response.json().catch(() => null)) as { data?: { item?: unknown }; message?: string } | null;

  if (!response.ok) {
    return { message: payload?.message ?? "AI 候选入库失败，请检查字段后重试。", ok: false };
  }

  let item = payload?.data?.item ?? null;
  const itemId = getItemId(item);
  if (!options.imageFile || !itemId) {
    return { item, ok: true };
  }

  const uploadResult = await uploadSourceImage(itemId, options.imageFile, fetcher);
  if (!uploadResult.ok) {
    return { item, ok: true, warning: "候选已写入物品，但图片保存失败；可在物品详情中重新上传。" };
  }

  try {
    const refreshed = await fetcher(`/api/items/${itemId}`);
    const refreshedPayload = (await refreshed.json().catch(() => null)) as { data?: { item?: unknown } } | null;
    if (refreshed.ok && refreshedPayload?.data?.item) {
      item = refreshedPayload.data.item;
    } else {
      return { item, ok: true, warning: "候选已写入物品，图片已保存；详情刷新失败，请稍后重新打开物品。" };
    }
  } catch {
    return { item, ok: true, warning: "候选已写入物品，图片已保存；详情刷新失败，请稍后重新打开物品。" };
  }

  return { item, ok: true, warning: "候选已写入物品，图片已保存。" };
}

async function uploadSourceImage(itemId: number, imageFile: File, fetcher: typeof fetch) {
  const formData = new FormData();
  formData.set("file", imageFile);
  try {
    const response = await fetcher(`/api/items/${itemId}/images`, {
      body: formData,
      method: "POST"
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}

function getItemId(item: unknown) {
  if (!item || typeof item !== "object" || !("id" in item)) {
    return null;
  }

  const id = Number((item as { id: unknown }).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function buildSingleConfirmation(
  candidate: AiItemCandidate,
  index: number,
  input: BuildAiCandidateConfirmationsInput
): AiCandidateConfirmation {
  const form = { ...emptyItemForm, name: candidate.name.value };
  const fieldMeta: AiCandidateConfirmation["fieldMeta"] = { name: toFieldMeta(candidate.name) };
  const warnings: string[] = [];

  applyBasicFields(candidate, form, fieldMeta, input.today);
  applyTaxonomyField(candidate, form, fieldMeta, warnings, "categoryId", "分类", input.categories);
  applyTaxonomyField(candidate, form, fieldMeta, warnings, "locationId", "位置", input.locations);

  return { candidate, fieldMeta, form, id: `candidate-${index + 1}`, warnings };
}

function applyBasicFields(
  candidate: AiItemCandidate,
  form: ItemFormState,
  fieldMeta: AiCandidateConfirmation["fieldMeta"],
  today: string
) {
  applyStringField(candidate.quantity, "quantity", form, fieldMeta);
  applyStringField(candidate.notes, "notes", form, fieldMeta);
  applyStringField(candidate.purchaseDate, "purchaseDate", form, fieldMeta);
  applyStringField(candidate.purchasePrice, "purchasePrice", form, fieldMeta);
  applyStringField(candidate.specification, "specification", form, fieldMeta);
  applyStringField(candidate.unit, "unit", form, fieldMeta);

  if (candidate.expiryDate) {
    applyStringField(candidate.expiryDate, "expiryDate", form, fieldMeta);
  } else if (candidate.expiryDays) {
    const baseDate = candidate.purchaseDate?.value ?? today;
    form.expiryDate = addDays(baseDate, candidate.expiryDays.value);
    fieldMeta.expiryDate = toFieldMeta(candidate.expiryDays, form.expiryDate);
  }
}

function applyTaxonomyField(
  candidate: AiItemCandidate,
  form: ItemFormState,
  fieldMeta: AiCandidateConfirmation["fieldMeta"],
  warnings: string[],
  field: "categoryId" | "locationId",
  label: "位置" | "分类",
  options: AiTaxonomyOption[]
) {
  const candidateField = field === "categoryId" ? candidate.categoryName : candidate.locationName;
  if (!candidateField) {
    return;
  }

  const option = findTaxonomyOption(options, candidateField.value);
  fieldMeta[field] = toFieldMeta(candidateField, option?.name ?? candidateField.value);
  if (option) {
    form[field] = String(option.id);
  } else {
    warnings.push(`${candidate.name.value} 的候选${label}“${candidateField.value}”未匹配到现有${label}，请手动选择。`);
  }
}

function applyStringField<T extends EditableCandidateField>(
  candidateField: AiCandidateField<number | string> | undefined,
  formField: T,
  form: ItemFormState,
  fieldMeta: AiCandidateConfirmation["fieldMeta"]
) {
  if (!candidateField) {
    return;
  }
  form[formField] = String(candidateField.value);
  fieldMeta[formField] = toFieldMeta(candidateField);
}

function toFieldMeta(field: AiCandidateField<number | string>, label = String(field.value)): AiCandidateFieldMeta {
  return field.reason
    ? { confidence: field.confidence, label, reason: field.reason, source: field.source }
    : { confidence: field.confidence, label, source: field.source };
}

function findTaxonomyOption(options: AiTaxonomyOption[], name: string) {
  const normalized = name.trim().toLocaleLowerCase();
  return options.find((option) => option.name.trim().toLocaleLowerCase() === normalized);
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
