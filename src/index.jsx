import './index.css';

import { Router, hashIntegration } from '@rturnq/solid-router';

import App from './App';
/* @refresh reload */
import { render } from 'solid-js/web';

let Routed = () => {
  return (
    <Router integration={hashIntegration()}>
      <App />
    </Router>
  );
};

render(Routed, document.getElementById('root'));
