// Platform-agnostic Preference Service
export const PreferenceService = {
  get: async (key: string): Promise<string> => {
    if (window.electronAPI) {
      return window.electronAPI.secrets.get(key);
    }
    const res = await fetch(`/api/secrets/${key}`);
    const data = await res.json();
    return data.value;
  },

  set: async (key: string, value: string): Promise<{ success: boolean; error?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.secrets.set(key, value);
    }
    const res = await fetch(`/api/secrets/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    });
    return res.json();
  }
};
