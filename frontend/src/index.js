import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a2235",
              color: "#f0f4ff",
              border: "1px solid #1e2d45",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.875rem",
            },
            success: { iconTheme: { primary: "#22d3a0", secondary: "#0a0e1a" } },
            error:   { iconTheme: { primary: "#f0566a", secondary: "#0a0e1a" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
