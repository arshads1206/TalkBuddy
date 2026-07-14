// Platform-agnostic Embedded Service
export const EmbeddedService = {
  status: async (): Promise<{ running: boolean; url: string; port: number; token?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.embeddedServerStatus();
    }
    const res = await fetch('/api/embedded/status');
    return res.json();
  },

  start: async (): Promise<{ success: boolean; error?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.embeddedServerStart();
    }
    const res = await fetch('/api/embedded/start', { method: 'POST' });
    return res.json();
  },

  stop: async (): Promise<{ success: boolean; error?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.embeddedServerStop();
    }
    const res = await fetch('/api/embedded/stop', { method: 'POST' });
    return res.json();
  },

  restart: async (): Promise<{ success: boolean; error?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.embeddedServerRestart();
    }
    const res = await fetch('/api/embedded/restart', { method: 'POST' });
    return res.json();
  },

  install: {
    check: async (): Promise<any> => {
      if (window.electronAPI) {
        return window.electronAPI.embeddedInstall.check();
      }
      const res = await fetch('/api/embedded/install/check');
      return res.json();
    },
    
    run: async (): Promise<{ ok: boolean; error?: string; cancelled?: boolean }> => {
      if (window.electronAPI) {
        return window.electronAPI.embeddedInstall.run();
      }
      const res = await fetch('/api/embedded/install/run', { method: 'POST' });
      return res.json();
    },
    
    cancel: async (): Promise<{ ok: boolean; error?: string }> => {
      if (window.electronAPI) {
        return window.electronAPI.embeddedInstall.cancel();
      }
      const res = await fetch('/api/embedded/install/cancel', { method: 'POST' });
      return res.json();
    },
    
    onOutput: (callback: (payload: { stream: 'stdout' | 'stderr' | 'info' | 'error'; text: string }) => void): (() => void) => {
      if (window.electronAPI) {
        return window.electronAPI.embeddedInstall.onOutput(callback);
      }
      // For browser mode, mock the output stream for now
      let active = true;
      const interval = setInterval(() => {
        if (active) {
          // Send mock progress
          callback({ stream: 'info', text: 'Browser mode: Mock installer running...' });
        }
      }, 2000);
      
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }
};
