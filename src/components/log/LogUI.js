import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';

import './LogUI.scss';

const LogUI = ({ logs }) => {

  const logDOM = useMemo(() => {
    return logs.map(log => <p key={log.key} className={log.type}>> {log.text}</p>);
  }, [logs]);

  return <section className='logUI'>
    <Card bg='dark' text='white'>
      <Card.Body>
        {logDOM}
      </Card.Body>
    </Card>
  </section>;
};

export default LogUI;
