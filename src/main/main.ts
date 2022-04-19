import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import path from 'path';
import { EVENT_OPEN_MENU_PROPS } from './../interfaces';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { WindowManager } from './WindowManager';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null;
let editorWindow: BrowserWindow | null;
let menuBuilder: MenuBuilder;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};
app.on('browser-window-blur', (_, window) => {
  handleWindowBlur(window);
});

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = app.windowManager.createNewWindow({
    name: 'main',
    winType: 'main',
    show: false,
    frame: false,
    width: 800,
    height: 450,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });
  if (mainWindow) {
    mainWindow.loadURL(resolveHtmlPath('index.html'));
    mainWindow.on('ready-to-show', () => {
      // menu = menuBuilder.buildMenu();
      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined');
      }
      if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
      } else {
        mainWindow.webContents.send('switch-route', { route: 'editor' });

        mainWindow.show();
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    menuBuilder.setSystemContextMenu(mainWindow);
    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
      shell.openExternal(edata.url);
      return { action: 'deny' };
    });
  }
  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */
app.on('new-editor-window', () => {
  editorWindow = app.windowManager.createNewWindow({
    name: 'canvas',
    winType: 'editor',
    width: 800,
    height: 450,
    show: false,
    frame: false,
    webPreferences: {
      devTools: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    modal: true,
  });
  if (editorWindow) {
    editorWindow.loadURL(resolveHtmlPath('index.html'));
    editorWindow.on('ready-to-show', () => {
      if (!editorWindow) {
        throw new Error('"mainWindow" is not defined');
      } else {
        editorWindow.show();
        editorWindow.webContents.send('switch-route', { route: 'editor' });
      }
      menuBuilder.setSystemContextMenu(editorWindow);
    });
  }
});

ipcMain.handle('save-data', (_, data) => {
  if (mainWindow) {
    let filePath = dialog.showSaveDialogSync(mainWindow, {
      title: 'Choose where to save file',
      buttonLabel: 'Save',
      defaultPath: './',
      filters: [
        {
          name: 'json',
          extensions: ['json'],
        },
      ],
      properties: ['showOverwriteConfirmation'],
    });
    if (filePath && filePath.length > 0)
      fs.writeFileSync(filePath, data, 'utf-8');
  }
});
ipcMain.handle('close-window', (_) => {
  const windowManager = app.windowManager;
  const win = windowManager.getCurrentWindow();
  if (win) windowManager.closeWindow(win);
});
ipcMain.handle('minimize-window', (_) => {
  const windowManager = app.windowManager;
  const win = windowManager.getCurrentWindow();
  if (win && win.isMinimizable()) win.minimize();
});
ipcMain.handle('maximize-window', (_) => {
  const windowManager = app.windowManager;
  const win = windowManager.getCurrentWindow();
  if (win)
    if (win.isMaximizable()) {
      win.maximize();
    } else {
      win.unmaximize();
    }
});

ipcMain.handle(
  'display-app-menu',
  (_, openMenuProps: EVENT_OPEN_MENU_PROPS) => {
    let currentWindow = app.windowManager.getCurrentWindow();
    if (menuBuilder) {
      const currentMenu = menuBuilder.buildSeperateMenu(openMenuProps.type);
      if (currentMenu && currentWindow) {
        currentMenu.on('menu-will-close', () => {
          currentWindow && currentWindow.webContents.send('close-app-menu');
        });
        currentMenu.popup({
          window: currentWindow,
          x: Math.round(openMenuProps.x),
          y: Math.round(openMenuProps.y),
        });
      }
    }
  }
);

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    app.windowManager = new WindowManager();
    menuBuilder = new MenuBuilder(app.windowManager);
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

function handleWindowBlur(window: BrowserWindow | null) {
  app.windowManager.setPreviouslyFocusedWindow(window);
  window && window.webContents.send('close-app-menu');
}
