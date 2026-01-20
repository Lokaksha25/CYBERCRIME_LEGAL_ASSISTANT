import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import Chat from "./pages/chat";
import RTIForm from "./pages/RTIForm";




export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/rti" element={<RTIForm />} />
      </Routes>
    </BrowserRouter>
  );
}
