import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { addListeners, removeListeners } from 'renderer/listeners';
import icon from '../../../../assets/icon.svg';
import { AppBar, Editor } from '../../components';
import './App.css';

const Hello = observer(() => {
  const anchorRef = useRef<HTMLImageElement>(null);
  const [copiedText, setCopiedText] = useState<string>('');

  useEffect(() => {
    window.electron.ipcRenderer.on('copied-text', (args) => {
      if (args.copyText) {
        setCopiedText(args.copyText);
      }
    });
  }, []);
  return (
    <div className="flexColumn">
      <div className="Hello flexColumn">
        <img width="200px" alt="icon" src={icon} ref={anchorRef} />

        <h1>electron-react-boilerplate</h1>
      </div>
      <div className="Hello">
        <a
          href="https://electron-react-boilerplate.js.org/"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              📚
            </span>
            Read our docs
          </button>
        </a>
        <span>{`Copied text: ${copiedText}`}</span>

        <a
          href="https://github.com/sponsors/electron-react-boilerplate"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              🙏
            </span>
            Donate
          </button>
        </a>
      </div>
    </div>
  );
});

export default function App() {
  const navigate = useNavigate();
  useEffect(() => {
    addListeners(navigate);
    return () => {
      removeListeners(navigate);
    };
  }, []);
  return (
    <>
      <AppBar />
      <div className="mainBody">
        <Routes>
          <Route path="/" element={<Hello />} />
          <Route path="/editor" element={<Editor />} />
        </Routes>
      </div>
    </>
  );
}
