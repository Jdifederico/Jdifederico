import React from 'react';
import './index.css';
import "./styles.css";
import App from './App';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SentryContextProvider } from "./context/SentryContext";


const root = createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
  <SentryContextProvider >
    <App />
  </SentryContextProvider>
</BrowserRouter>
);

