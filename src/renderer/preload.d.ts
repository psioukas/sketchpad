import {
  EVENT_CONTEXT_MENU_PROPS,
  EVENT_OPEN_MENU_PROPS,
} from './../interfaces';
declare global {
  interface Window {
    electron: {
      ipcRenderer: {

        minimizeWindow: () => void;
        maximizeWindow: () => void;
        closeWindow: () => void;
        openMenu: (openMenuProps: EVENT_OPEN_MENU_PROPS) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        removeListener(channel: string, func: (...args: any[]) => void): void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        on(channel: string, func: (...args: any[]) => void): void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        once(channel: string, func: (...args: any[]) => void): void;
      };
    };
  }
}

export {};
