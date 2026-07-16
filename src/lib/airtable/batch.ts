export const AIRTABLE_WRITE_BATCH_SIZE = 10;

export function chunkAirtableRecords<T>(items: T[], size = AIRTABLE_WRITE_BATCH_SIZE) {
  if (!Number.isInteger(size) || size < 1 || size > AIRTABLE_WRITE_BATCH_SIZE) {
    throw new Error(`Airtable batch size must be between 1 and ${AIRTABLE_WRITE_BATCH_SIZE}`);
  }
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}
