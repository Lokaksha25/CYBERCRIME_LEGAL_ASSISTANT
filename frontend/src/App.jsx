import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import Chat from "./pages/chat";
import RTIForm from "./pages/RTIForm";
import CyberCellLocator from "./pages/CyberCellLocator";
import LegalHelpLocator from "./pages/LegalHelpLocator";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/rti" element={<RTIForm />} />
        <Route path="/cyber-cell" element={<CyberCellLocator />} />
        <Route path="/legal-help" element={<LegalHelpLocator />} />
      </Routes>
    </BrowserRouter>
  );
}

