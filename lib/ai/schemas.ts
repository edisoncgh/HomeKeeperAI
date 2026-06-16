export const AI_FIELD_SOURCES = ["image", "order", "inference", "user"] as const;

export type AiFieldSource = (typeof AI_FIELD_SOURCES)[number];

export interface AiCandidateField<T> {
  confidence: number;
  reason?: string;
  source: AiFieldSource;
  value: T;
}

export interface AiItemCandidate {
  categoryName?: AiCandidateField<string>;
  expiryDate?: AiCandidateField<string>;
  expiryDays?: AiCandidateField<number>;
  locationName?: AiCandidateField<string>;
  name: AiCandidateField<string>;
  notes?: AiCandidateField<string>;
  purchaseDate?: AiCandidateField<string>;
  purchasePrice?: AiCandidateField<number>;
  quantity?: AiCandidateField<number>;
  specification?: AiCandidateField<string>;
  unit?: AiCandidateField<string>;
}

export interface AiCandidateResponse {
  candidates: AiItemCandidate[];
  warnings: string[];
}

const sourceSchema = { enum: AI_FIELD_SOURCES, type: "string" } as const;
const confidenceSchema = { maximum: 1, minimum: 0, type: "number" } as const;

const baseFieldProperties = {
  confidence: confidenceSchema,
  reason: { type: "string" },
  source: sourceSchema
} as const;

const stringFieldSchema = buildFieldSchema({ minLength: 1, type: "string" });
const priceFieldSchema = buildFieldSchema({ minimum: 0, type: "number" });
const integerFieldSchema = buildFieldSchema({ minimum: 0, type: "integer" });
const quantityFieldSchema = buildFieldSchema({ minimum: 1, type: "integer" });
const dateFieldSchema = buildFieldSchema({ pattern: "^\\d{4}-\\d{2}-\\d{2}$", type: "string" });

export const AI_ITEM_CANDIDATE_JSON_SCHEMA = {
  additionalProperties: false,
  properties: {
    candidates: {
      items: {
        additionalProperties: false,
        properties: {
          categoryName: stringFieldSchema,
          expiryDate: dateFieldSchema,
          expiryDays: integerFieldSchema,
          locationName: stringFieldSchema,
          name: stringFieldSchema,
          notes: stringFieldSchema,
          purchaseDate: dateFieldSchema,
          purchasePrice: priceFieldSchema,
          quantity: quantityFieldSchema,
          specification: stringFieldSchema,
          unit: stringFieldSchema
        },
        required: ["name"],
        type: "object"
      },
      type: "array"
    },
    warnings: {
      items: { type: "string" },
      type: "array"
    }
  },
  required: ["candidates", "warnings"],
  type: "object"
} as const;

function buildFieldSchema(valueSchema: Record<string, unknown>) {
  return {
    additionalProperties: false,
    properties: {
      ...baseFieldProperties,
      value: valueSchema
    },
    required: ["value", "source", "confidence"],
    type: "object"
  } as const;
}
