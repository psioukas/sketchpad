import { contextBridge, ipcRenderer } from 'electron';
import { EVENT_OPEN_MENU_PROPS } from './../interfaces';
const validChannels: string[] = [
  'display-app-menu',
  'close-app-menu',
  'copied-text',
  'switch-route',
  'close-window',
];

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    saveData: (data:string) => {
      ipcRenderer.invoke('save-data',data)
    },
    minimizeWindow: () => {
      ipcRenderer.invoke('minimize-window')
    },
    maximizeWindow: () => {
      ipcRenderer.invoke('maximize-window')
    },
    closeWindow: () => {
      ipcRenderer.invoke('close-window')
    },
    openMenu(openMenuProps: EVENT_OPEN_MENU_PROPS) {
      ipcRenderer.invoke('display-app-menu', openMenuProps);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(channel: string, func: (...args: any[]) => void) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (_event, ...args) => func(...args));
      }
    },
    removeListener(channel: string, func: (...args: any[]) => void) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.removeListener(channel, (_event, ...args) => func(...args));
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    once(channel: string, func: (...args: any[]) => void) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
      }
    },
  },
});
