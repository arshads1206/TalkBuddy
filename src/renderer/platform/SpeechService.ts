// Platform-agnostic Speech Service
export const SpeechService = {
  transcribe: async (params: {
    url: string;
    apiKey: string;
    audioBuffer: Uint8Array;
    model: string;
    filename?: string;
  }): Promise<any> => {
    if (window.electronAPI) {
      return window.electronAPI.speaches.transcribe(params);
    }
    
    // Convert Uint8Array to base64 for JSON transport
    const base64Audio = btoa(
      new Uint8Array(params.audioBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    
    const res = await fetch('/api/speaches/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        audioBuffer: base64Audio
      })
    });
    
    return res.json();
  },

  speak: async (params: {
    url: string;
    apiKey: string;
    payload: Record<string, unknown>;
  }): Promise<any> => {
    if (window.electronAPI) {
      return window.electronAPI.speaches.speak(params);
    }
    
    const res = await fetch('/api/speaches/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    const data = await res.json();
    
    // Convert base64 back to Uint8Array if needed
    if (data.audio && typeof data.audio === 'string') {
      const binaryString = atob(data.audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      data.audio = bytes;
    }
    
    return data;
  }
};
