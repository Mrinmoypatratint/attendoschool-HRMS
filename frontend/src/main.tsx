/**
 * main.tsx
 * --------
 * Application entry/bootstrap. Mounts the React tree into the #root element,
 * wrapping <App> with StrictMode, the router (BrowserRouter) and the global
 * AuthProvider, and importing global styles. Side-effecting by design.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./features/auth/context/AuthContext";
import "./index.css";

// Mount the app into the #root element (non-null asserted — present in index.html).
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
