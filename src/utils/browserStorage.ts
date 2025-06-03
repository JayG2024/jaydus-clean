/**
 * Browser Storage Utility
 * 
 * This provides browser-compatible storage mechanisms that can be used as
 * fallbacks when MongoDB isn't available (in browser environments).
 */

// Generate a unique ID (mimicking MongoDB ObjectId)
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// LocalStorage-based data store
class LocalStorageDB {
  private getCollection<T>(collectionName: string): Record<string, T> {
    try {
      const data = localStorage.getItem(`jaydus_${collectionName}`);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error(`Error accessing collection ${collectionName}:`, error);
      return {};
    }
  }

  private saveCollection<T>(collectionName: string, data: Record<string, T>): void {
    try {
      localStorage.setItem(`jaydus_${collectionName}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving collection ${collectionName}:`, error);
    }
  }

  // Find one document by filter
  async findOne<T>(collectionName: string, filter: Partial<T>): Promise<T | null> {
    const collection = this.getCollection<T>(collectionName);
    
    // Simple filter implementation
    const result = Object.values(collection).find(item => {
      return Object.entries(filter).every(([key, value]) => 
        (item as any)[key] === value
      );
    });
    
    return result || null;
  }

  // Find documents by filter
  async find<T>(collectionName: string, filter: Partial<T> = {}): Promise<T[]> {
    const collection = this.getCollection<T>(collectionName);
    
    // Filter the collection
    if (Object.keys(filter).length === 0) {
      return Object.values(collection);
    }
    
    return Object.values(collection).filter(item => {
      return Object.entries(filter).every(([key, value]) => 
        (item as any)[key] === value
      );
    });
  }

  // Insert a document
  async insertOne<T>(collectionName: string, document: T): Promise<{ id: string }> {
    const collection = this.getCollection<T>(collectionName);
    const id = (document as any)._id || generateId();
    (document as any)._id = id;
    
    collection[id] = document;
    this.saveCollection(collectionName, collection);
    
    return { id };
  }

  // Update a document
  async updateOne<T>(
    collectionName: string, 
    filter: Partial<T>, 
    update: Partial<T>
  ): Promise<boolean> {
    const collection = this.getCollection<T>(collectionName);
    
    // Find the item to update
    const entries = Object.entries(collection);
    for (const [id, item] of entries) {
      const matches = Object.entries(filter).every(([key, value]) => 
        (item as any)[key] === value
      );
      
      if (matches) {
        // Update the item
        collection[id] = { ...item, ...update };
        this.saveCollection(collectionName, collection);
        return true;
      }
    }
    
    return false;
  }

  // Delete a document
  async deleteOne<T>(collectionName: string, filter: Partial<T>): Promise<boolean> {
    const collection = this.getCollection<T>(collectionName);
    
    // Find the item to delete
    const entries = Object.entries(collection);
    for (const [id, item] of entries) {
      const matches = Object.entries(filter).every(([key, value]) => 
        (item as any)[key] === value
      );
      
      if (matches) {
        // Delete the item
        delete collection[id];
        this.saveCollection(collectionName, collection);
        return true;
      }
    }
    
    return false;
  }
}

// Export singleton instance
export const browserDB = new LocalStorageDB();

// Collection names (same as MongoDB collections)
export const COLLECTIONS = {
  USERS: 'users',
  CHATS: 'chats',
  USAGE: 'usage',
  API_KEYS: 'api_keys',
  INTEGRATIONS: 'integrations',
  SUBSCRIPTIONS: 'subscriptions',
};
