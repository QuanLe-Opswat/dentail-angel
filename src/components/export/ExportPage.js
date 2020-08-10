import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import LogUI from '../log/LogUI';
import FirebaseExport from '../../service/FirebaseExport';
import firebase from 'firebase';
import ReactExport from 'react-data-export';

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const ExportPage = () => {
    const [logs, setLogs] = useState([]);
    const [db, setDb] = useState(undefined);
    const [allData, setAllData] = useState(undefined);
    const [loading, setLoading] = useState(false);

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

    const pushLog = (log) => {
        logs.push({ ...log, key: Math.random() });
        setLogs(logs.slice(0));
    };

    const onExportClick = async () => {
        if (db) {
            setLoading(true);
            pushLog({ text: 'Get data from server...' });
            try {
                const data = await FirebaseExport.export(db);
                setAllData(data);
                pushLog({ text: 'Ready to export!', type: 'success' });
            } catch (err) {
                pushLog({ text: 'Something wrong! Please try again.', type: 'error' });
                console.log(err);
            }
            setLoading(false);
        }
    };

    return <>
        <section className='exportSection'>
            {!loading && db && !allData && <Button onClick={onExportClick}>Get Data</Button>}
            {!loading && allData && <ExcelFile element={<Button>Download Data</Button>} filename='NhaKhoa'>
                {allData.map((d, index) => <ExcelSheet key={index} data={d.data} name={d.sheet}>
                    {d.column.map((col) => <ExcelColumn key={col.prop} label={col.name} value={(rowValue) => {
                        if (col.type === 'Date') {
                            return new Date(rowValue[col.prop].seconds * 1000);
                        }
                        if (col.parse) {
                            const i = col.parse.to.indexOf(rowValue[col.prop]);
                            if (i >= 0) {
                                return col.parse.from[i];
                            }
                        }
                        return rowValue[col.prop];
                    }}/>)}
                </ExcelSheet>)}
            </ExcelFile>}
        </section>
        <LogUI logs={logs}/>
    </>;
};

export default ExportPage;
