import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PasscodeProvider } from "@/contexts/PasscodeContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PasscodeProvider>
      <App />
    </PasscodeProvider>
  </StrictMode>
);
