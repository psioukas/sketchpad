import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  MenuItemConstructorOptions,
  shell,
} from 'electron';
import { MENU_OPTIONS, MENU_OPTION_TYPE } from './../interfaces';
import { WindowManager } from './WindowManager';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  windowManager: WindowManager;
  setSystemContextMenu(window: BrowserWindow): void {
    window.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;
      window &&
        Menu.buildFromTemplate([
          {
            label: 'Inspect element',
            click: () => {
              window && window.webContents.inspectElement(x, y);
            },
          },
          { role: 'copy' },
          { role: 'paste' },
        ]).popup({ window: window });
    });
  }

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }
  getCurrentWindow() {
    let win = this.windowManager.getCurrentWindow() as BrowserWindow;
    return win;
  }
  buildSeperateMenu(typeMenu: MENU_OPTION_TYPE): Menu | null {
    let window = this.getCurrentWindow();
    if (!window) return null;
    const fileMenu = Menu.buildFromTemplate([
      {
        label: 'New Editor',
        click: () => {
          app.emit('new-editor-window');
        },
      },
      {
        label: 'Open',
        click: () => {
          dialog.showOpenDialog(window, {
            buttonLabel: 'Import file',
            title: 'whatever',
            filters: [{ name: 'Images', extensions: ['*'] }],
          });
        },
      },
      {
        label: 'Quit',
        enabled: window.closable,
        click: () => app.quit(),
      },
    ]);
    const editMenu = Menu.buildFromTemplate([
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ]);
    const viewMenu = Menu.buildFromTemplate([
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { role: 'resetZoom' },
      { role: 'minimize' },
      { role: 'forceReload' },
      { role: 'togglefullscreen' },
    ]);

    const aboutMenu = Menu.buildFromTemplate([{ role: 'about' }]);

    switch (typeMenu) {
      case MENU_OPTIONS.FILE:
        return fileMenu;
      case MENU_OPTIONS.EDIT:
        return editMenu;
      case MENU_OPTIONS.VIEW:
        return viewMenu;
      case MENU_OPTIONS.ABOUT:
        return aboutMenu;
      case MENU_OPTIONS.UNSET:
      default:
        return null;
    }
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    return menu;
  }

  setupDevelopmentEnvironment(): void {
    let window = this.getCurrentWindow();
    if (!window) return;
    window.webContents.on('context-menu', (_, props) => {
      console.log(props);
      const { x, y } = props;
      window &&
        Menu.buildFromTemplate([
          {
            label: 'Inspect element',
            click: () => {
              window && window.webContents.inspectElement(x, y);
            },
          },
          {
            label: 'Copy text',
            click: () => {
              if (props.selectionText.length > 0 && window)
                window.webContents.send('copied-text', {
                  copiedText: props.selectionText,
                });
            },
          },
        ]).popup({ window: window });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    let window = this.getCurrentWindow();
    if (!window) return [];
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'Electron',
      submenu: [
        {
          label: 'About ElectronReact',
          selector: 'orderFrontStandardAboutPanel:',
        },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide ElectronReact',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            window && window.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            window && window.setFullScreen(!window.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            window && window.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            window && window.setFullScreen(!window.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            shell.openExternal('https://electronjs.org');
          },
        },
        {
          label: 'Documentation',
          click() {
            shell.openExternal(
              'https://github.com/electron/electron/tree/main/docs#readme'
            );
          },
        },
        {
          label: 'Community Discussions',
          click() {
            shell.openExternal('https://www.electronjs.org/community');
          },
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/electron/electron/issues');
          },
        },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
        ? subMenuViewDev
        : subMenuViewProd;

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate() {
    let window = this.getCurrentWindow();
    if (!window) return [];
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: '&Open',
            accelerator: 'Ctrl+O',
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              window && window.close();
            },
          },
        ],
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development' ||
          process.env.DEBUG_PROD === 'true'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'Ctrl+R',
                  click: () => {
                    window && window.webContents.reload();
                  },
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    window && window.setFullScreen(!window.isFullScreen());
                  },
                },
                {
                  label: 'Toggle &Developer Tools',
                  accelerator: 'Alt+Ctrl+I',
                  click: () => {
                    window.webContents.toggleDevTools();
                  },
                },
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    window && window.setFullScreen(!window.isFullScreen());
                  },
                },
              ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Learn More',
            click() {
              shell.openExternal('https://electronjs.org');
            },
          },
          {
            label: 'Documentation',
            click() {
              shell.openExternal(
                'https://github.com/electron/electron/tree/main/docs#readme'
              );
            },
          },
          {
            label: 'Community Discussions',
            click() {
              shell.openExternal('https://www.electronjs.org/community');
            },
          },
          {
            label: 'Search Issues',
            click() {
              shell.openExternal('https://github.com/electron/electron/issues');
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
