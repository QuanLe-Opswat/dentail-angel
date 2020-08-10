import React from 'react';
import { Router, Redirect } from '@reach/router';
import Layout from './components/layout';
import ImportPage from './components/import/ImportPage';
import ExportPage from './components/export/ExportPage';

import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    return (
        <Layout>
            <Router>
                <Redirect from="/" to="/export" noThrow/>
                <ExportPage path="export"/>
                <ImportPage path="secretImport"/>
            </Router>
        </Layout>

    );
}

export default App;
