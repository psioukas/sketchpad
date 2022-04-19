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

        <h1>skethpad</h1>
      </div>

      <span>{`Copied text: ${copiedText}`}</span>
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
