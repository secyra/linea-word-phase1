interface OpenFileResult {
    canceled?: boolean;
    error?: string;
    filePath?: string;
    htmlContent?: string;
}

interface SaveFileResult {
    canceled?: boolean;
    error?: string;
    filePath?: string;
    success?: boolean;
}

/**
 * Define the Electron API interface exposed via contextBridge
 * This ensures TypeScript knows what methods exist on window.electronAPI
 */
export interface IElectronAPI {
    // Existing functions
    openFile: () => Promise<OpenFileResult>;
    
    // NEW FUNCTION
    saveFile: (defaultFilename: string, content: string) => Promise<SaveFileResult>;
}

// Extend the Window interface to include our custom electronAPI property
declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}