// Platform-agnostic Application Service
export const AppService = {
  getVersion: async (): Promise<string> => {
    if (window.electronAPI) {
      return window.electronAPI.app.getVersion();
    }
    const res = await fetch('/api/app/version');
    const data = await res.json();
    return data.version;
  },

  getPath: async (name: string): Promise<string> => {
    if (window.electronAPI) {
      return window.electronAPI.app.getPath(name);
    }
    const res = await fetch(`/api/app/path/${name}`);
    const data = await res.json();
    return data.path;
  },

  getEnvVar: async (name: string): Promise<string | null> => {
    if (window.electronAPI) {
      return window.electronAPI.app.getEnvVar(name);
    }
    const res = await fetch(`/api/app/env/${name}`);
    const data = await res.json();
    return data.value;
  },

  openExternal: async (url: string): Promise<void> => {
    if (window.electronAPI) {
      return window.electronAPI.shell.openExternal(url);
    }
    window.open(url, '_blank');
  },

  openFile: async (): Promise<{ canceled: boolean; filePaths: string[] }> => {
    if (window.electronAPI) {
      return window.electronAPI.dialog.openFile();
    }
    
    // In browser mode, we simulate the dialog using an input element.
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: any) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          (window as any)._lastSelectedFile = file;
          resolve({ canceled: false, filePaths: [file.name] });
        } else {
          resolve({ canceled: true, filePaths: [] });
        }
      };
      
      window.addEventListener('focus', () => {
        setTimeout(() => {
          if (!input.value) resolve({ canceled: true, filePaths: [] });
        }, 300);
      }, { once: true });
      
      input.click();
    });
  },

  saveFile: async (defaultPath?: string): Promise<{ canceled: boolean; filePath?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.dialog.saveFile(defaultPath);
    }
    return { canceled: false, filePath: defaultPath || 'export.json' };
  },

  getPlatform: (): string => {
    if (window.electronAPI) {
      return window.electronAPI.platform;
    }
    return 'browser';
  },
  
  readSelectedFile: async (): Promise<string> => {
    const file = (window as any)._lastSelectedFile;
    if (!file) return "";
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },
  
  restoreDefaultScenarios: async (): Promise<{ success: boolean; restoredCount?: number; error?: string }> => {
    if (window.electronAPI) {
      return window.electronAPI.scenarios.restoreDefaults();
    }
    const res = await fetch('/api/scenarios/restore', { method: 'POST' });
    return res.json();
  }
};
