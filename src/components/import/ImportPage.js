import React, { useEffect, useState } from 'react';
import ControlUI from '../control/ControlUI';
import LogUI from '../log/LogUI';
import FirebaseImport from '../../service/FirebaseImport';
import firebase from 'firebase';

const ImportPage = () => {
  const [disabled, setDisabled] = useState(false);

  const [logs, setLogs] = useState([]);
  const [files, setFiles] = useState([]);
  const [data, setData] = useState(undefined);
  const [db, setDb] = useState(undefined);

  useEffect(() => {
    firebase.initializeApp({
      apiKey: 'AIzaSyAqGto5WgSmXLq8cA-XlJBtaQhqOvm2DYg',
      authDomain: 'dental-angel.appspot.com',
      projectId: 'dental-angel',
    });
    setDb(firebase.firestore());

    firebase.auth().signInWithEmailAndPassword('kakazaro@gmail.com', '123456').catch(function(error) {
      console.log(error.message);
    }).then(() => console.log('log success.'));

  }, []);

  const onFilesChange = (files) => setFiles([].slice.call(files, 0));

  const onClear = () => setLogs([]);

  const onAnalyze = async () => {
    setDisabled(true);
    setData(undefined);
    try {
      await FirebaseImport.analyze(files, callback);
    } catch (e) {
      setDisabled(false);
      pushLog({ type: 'error', text: `Error during analyze file: ${e.message}` });
      console.error(e);
    }
  };

  const callback = (result) => {
    pushLog(result);

    if (result.done) {
      setDisabled(false);
      if (result.success) {
        setData(result.data);
      }
    }
  };

  const onStart = async () => {
    if (!data) {
      return;
    }

    try {
      setDisabled(true);
      await FirebaseImport.upload(data, db, callback);
    } catch (e) {
      setDisabled(false);
      pushLog({ type: 'error', text: `Error during upload: ${e.message}` });
    }
  };

  const onReset = async () => {
    try {
      setDisabled(true);
      await FirebaseImport.clear(db, callback);
    } catch (e) {
      setDisabled(false);
      pushLog({ type: 'error', text: `Error during delete: ${e.message}` });
    }
  };

  const pushLog = (log) => {
    logs.push({ ...log, key: Math.random() });
    setLogs(logs.slice(0));
  };

  return <>
    <ControlUI onSetFiles={onFilesChange} onAnalyze={onAnalyze} onStart={onStart} onClear={onClear} onReset={onReset}
               disabled={disabled}/>
    <LogUI logs={logs}/>
  </>;
};

export default ImportPage;
