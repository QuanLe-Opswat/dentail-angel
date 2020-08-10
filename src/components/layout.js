
import React from 'react';
import PropTypes from 'prop-types';

import Header from './header';
import './layout.css';

const Layout = ({ children }) => {

  return (
    <>
      <Header siteTitle='Export Data Page'/>
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
        }}
      >
        <main>{children}</main>
        <footer>
          © {new Date().getFullYear()}, Built by QuanLe
        </footer>
      </div>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
