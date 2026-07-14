// Platform-agnostic Database Service
export const DatabaseService = {
  op: async (name: string, params?: Record<string, any>): Promise<{ success: boolean; data?: any; error?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.database.op(name, params);
    }
    
    // Convert to REST API calls
    const res = await fetch('/api/db/op', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, params })
    });
    
    return res.json();
  },

  reset: async (): Promise<{ success: boolean; error?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.database.reset();
    }
    const res = await fetch('/api/db/reset', { method: 'POST' });
    return res.json();
  }
};
