import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

export class WindowManager implements Electron.WindowManagerType {
  windows: BrowserWindow[] = [];
  recentlyClosedWindows: string[] = [];
  previouslyFocusedWindow: BrowserWindow | null = null;
  getCurrentWindow = (): BrowserWindow | null => {
    return BrowserWindow.getFocusedWindow();
  };
  getWindows = (): BrowserWindow[] => {
    return this.windows;
  };
  createNewWindow(options: BrowserWindowConstructorOptions): BrowserWindow {
    let newWin = new BrowserWindow({
      ...options,
      winType: options.winType ?? 'main',
    });
    newWin.name = options.name;
    newWin.type = options.winType;
    this.windows.push(newWin);
    return newWin;
  }
  getEditorWindows() {
    return this.windows.filter((win) => win.type === 'editor');
  }
  getMainWindows() {
    return this.windows.filter((win) => win.type === 'main');
  }
  setPreviouslyFocusedWindow(win: BrowserWindow | null = null) {
    this.previouslyFocusedWindow = win;
  }
  closeWindow(window: BrowserWindow) {
    if (window.closable) {
      window.close();
      const windowIdx = this.windows.findIndex((win) => win.id === window.id);
      this.recentlyClosedWindows.push(JSON.stringify(window))
      this.windows.splice(windowIdx, 1);
    } else {
      alert(`Window ${window.name} cannot be closed.`);
    }
  }
  constructor() {}
}
