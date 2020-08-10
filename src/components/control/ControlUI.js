import React, { useRef } from 'react';
import { Button } from 'react-bootstrap';

import './ControlUI.scss';

const ControlUI = ({ onSetFiles, onAnalyze, onStart, onClear, onReset, disabled }) => {

  const inputRef = useRef(null);

  const onFilesChange = (e) => {
    // setFiles(e.target.files);
    onSetFiles(e.target.files);
  };

  // accept='.csv'
  return <section className='controlUI'>
    <input type='file' style={{ display: 'none' }} ref={inputRef} onChange={onFilesChange} multiple/>
    <Button onClick={() => inputRef.current.click()} disabled={disabled}>
      Select Files
    </Button>

    <Button onClick={() => onAnalyze()} disabled={disabled}>
      Analyze
    </Button>

    <Button onClick={() => onStart()} disabled={disabled}>
      Start
    </Button>

    <Button onClick={() => onClear()}>
      Clear
    </Button>

    <Button onClick={() => onReset()} disabled={disabled}>
      Reset Data
    </Button>
  </section>;
};

export default ControlUI;
