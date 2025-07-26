/**
 * Get the appropriate description field based on data evolution.
 * Starting around May 23rd, InitialDescription became the primary field.
 * Before that, Notes was used.
 * 
 * Logic: If InitialDescription is blank, use Notes field. 
 * If both fields blank, return "No description".
 */
export function getDescription(initialDescription?: string, notes?: string): string {
  if (initialDescription && initialDescription.trim()) {
    return initialDescription.trim();
  } else if (notes && notes.trim()) {
    return notes.trim();
  } else {
    return "No description";
  }
}

/**
 * Interface for feedback record with optional description fields
 */
export interface FeedbackRecord {
  id: string;
  initial_description?: string;
  notes?: string;
  description?: string; // Computed field from API
  priority?: string;
  team?: string;
  environment?: string;
  created?: string;
  [key: string]: any;
}

/**
 * Get description from a feedback record, with fallback logic
 */
export function getRecordDescription(record: FeedbackRecord): string {
  // If API already computed the description, use it
  if (record.description) {
    return record.description;
  }
  
  // Otherwise, compute it from the individual fields
  return getDescription(record.initial_description, record.notes);
}