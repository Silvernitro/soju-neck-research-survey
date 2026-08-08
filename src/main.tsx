import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import CalibrationApp from './calibration/CalibrationApp';

const parameters = new URLSearchParams(window.location.search);
const isCalibration = window.location.pathname.replace(/\/$/, '') === '/calibrate'
  || parameters.get('debug') === '1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isCalibration ? <CalibrationApp /> : <App />}
  </StrictMode>,
);
