import { WINDOW_EVENT_SWITCH_ROUTE_PROPS } from 'interfaces';
import { NavigateFunction } from 'react-router-dom';

type StartEditorProps = {
  route: string;
  navigate: NavigateFunction;
};
const handleStartEditor = (props: StartEditorProps) => {
  if (props.route) {
    props.navigate(props.route);
  }
};

export const addListeners = (navigate: NavigateFunction) => {
  window.electron.ipcRenderer.on(
    'switch-route',
    ({ route }: WINDOW_EVENT_SWITCH_ROUTE_PROPS) =>
      handleStartEditor({ route, navigate })
  );
};

export const removeListeners = (navigate: NavigateFunction) => {
  window.electron.ipcRenderer.removeListener(
    'switch-route',
    ({ route }: WINDOW_EVENT_SWITCH_ROUTE_PROPS) =>
      handleStartEditor({ route, navigate })
  );
};
