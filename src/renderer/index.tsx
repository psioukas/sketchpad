import { render } from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { App } from './components';

render(
  <HashRouter>
    <App />
  </HashRouter>,
  document.getElementById('root')
);
