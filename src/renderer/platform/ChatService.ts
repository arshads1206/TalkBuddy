// Platform-agnostic Chat Proxy Service
export const ChatService = {
  fetch: async (params: { url: string; options: any }): Promise<{ ok: boolean; status?: number; statusText?: string; headers?: any; data?: any; error?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.fetch(params);
    }
    
    // In browser mode, we proxy this to our FastAPI backend to bypass CORS
    const res = await fetch('/api/proxy/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    const result = await res.json();
    if (result.b64Data) {
      const binaryString = atob(result.b64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      result.data = bytes;
      delete result.b64Data;
    }
    return result;
  },

  fetchText: async (url: string): Promise<{ ok: boolean; text?: string; error?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.fetchText(url);
    }
    
    const res = await fetch('/api/proxy/fetchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    return res.json();
  }
};
