declare namespace Electron {
  interface App {
    on(event: 'win-manager-getWindows', listener: Function): this;
    on(event: 'new-editor-window', listener: Function): this;
    windowManager: WindowManagerType;
  }
  interface BrowserWindow {
    type?: 'main' | 'editor';
    name?: string;
  }
  interface BrowserWindowConstructorOptions {
    name?: string;
    winType?: 'main' | 'editor';
  }
  export type WindowManagerType = {
    windows: BrowserWindow[];
    recentlyClosedWindows: string[];
    previouslyFocusedWindow: BrowserWindow | null;
    getCurrentWindow: () => BrowserWindow | null;
    createNewWindow: (
      options: BrowserWindowConstructorOptions
    ) => BrowserWindow;
    getWindows: () => BrowserWindow[];
    getEditorWindows: () => BrowserWindow[];
    getMainWindows: () => BrowserWindow[];
    setPreviouslyFocusedWindow: (win?: BrowserWindow | null) => void;
    closeWindow: (win: BrowserWindow) => void;
  };
}
