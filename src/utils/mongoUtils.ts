/**
 * Utility functions for MongoDB operations
 */

type ObjectIdLike = string | { toString: () => string } | { _id: any };

/**
 * Safely convert a value to a MongoDB ObjectId string
 */
export function toObjectIdString(id: ObjectIdLike | null | undefined): string {
  if (!id) return '';
  
  // If it's an object with _id, use that
  if (typeof id === 'object' && id !== null && '_id' in id) {
    return toObjectIdString(id._id);
  }
  
  // If it's an object with toString(), use that
  if (typeof id === 'object' && id !== null && 'toString' in id) {
    return id.toString();
  }
  
  // If it's already a string, return it
  if (typeof id === 'string') {
    return id;
  }
  
  // Fallback to string conversion
  return String(id);
}

/**
 * Check if two IDs are the same
 */
export function areIdsEqual(id1: ObjectIdLike | null | undefined, id2: ObjectIdLike | null | undefined): boolean {
  if (!id1 || !id2) return false;
  return toObjectIdString(id1) === toObjectIdString(id2);
}

/**
 * Create a new ObjectId-like string (for client-side use)
 */
export function createObjectId(): string {
  // Simple implementation for client-side use
  // In a real app, you might want to use a UUID or similar
  return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a string looks like a MongoDB ObjectId
 */
export function isObjectId(id: string): boolean {
  // Check if it's a 24 character hex string
  return /^[0-9a-fA-F]{24}$/.test(id);
}
