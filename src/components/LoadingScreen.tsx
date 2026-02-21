import React from 'react';
import { IonSpinner } from '@ionic/react';
import './LoadingScreen.css';
import logoFallback from '../img/png/logo.png';

const LoadingScreen: React.FC = () => (
  <div className="loading-screen">
    <div className="loading-content">
      <div className="loading-logo">
        <img
          className="loading-logo-img"
          src="/png/logo.png"
          alt="Март Строй"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = logoFallback;
          }}
        />
      </div>
      <h1 className="loading-title">Март Строй</h1>
      <p className="loading-subtitle">Каркасные дома</p>
      <IonSpinner name="crescent" color="primary" className="loading-spinner" />
    </div>
  </div>
);

export default LoadingScreen;
