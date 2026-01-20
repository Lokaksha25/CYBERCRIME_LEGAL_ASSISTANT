import { useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

export default function RTIForm() {
  const navigate = useNavigate();

  const [showPreview, setShowPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    pio: "",
    info: "",
    date: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const inputClass = `
    w-full p-3 rounded-xl border
    bg-white dark:bg-slate-900
    text-slate-900 dark:text-slate-100
    placeholder-slate-400 dark:placeholder-slate-500
    border-slate-300 dark:border-slate-700
    focus:outline-none focus:ring-2 focus:ring-indigo-500/30
  `;

  /* ================= PDF GENERATION ================= */

  const generateRTIPDF = () => {
    if (!form.name || !form.address || !form.pio || !form.info || !form.date) {
      alert("Please fill all fields before generating the RTI application.");
      return null;
    }

    const doc = new jsPDF("p", "mm", "a4");

    const marginX = 20;
    let y = 25;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = 170;

    const addText = (
      text,
      style = "normal",
      size = 12,
      spacing = 7
    ) => {
      doc.setFont("times", style);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, contentWidth);
      lines.forEach((line) => {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 25;
        }
        doc.text(line, marginX, y);
        y += spacing;
      });
    };

    /* -------- Header -------- */
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("FORM ‘A’", 105, y, { align: "center" });
    y += 6;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("(See Rule 3 of the Right to Information Rules, 2012)", 105, y, {
      align: "center",
    });
    y += 14;

    /* -------- Address -------- */
    addText("To,", "bold");
    addText("The Public Information Officer (PIO),");
    addText(form.pio);
    y += 6;

    /* -------- Subject -------- */
    addText(
      "Subject: Application seeking information under Section 6(1) of the Right to Information Act, 2005.",
      "bold"
    );
    y += 6;

    /* -------- Body -------- */
    addText("Sir / Madam,");
    addText(
      "I, the undersigned, hereby seek the following information under the provisions of the Right to Information Act, 2005. The requisite particulars are furnished below:"
    );
    y += 4;

    /* -------- Applicant Details -------- */
    addText(`1. Name of the Applicant: ${form.name}`);
    addText(`2. Address for Correspondence: ${form.address}`);
    y += 4;

    /* -------- Information Sought -------- */
    addText("3. Particulars of Information Required:");
    addText(form.info);
    y += 4;

    /* -------- Declarations -------- */
    addText("4. Declaration:",);
    addText(
      "(i) The information sought does not fall under the exemptions specified under Sections 8 and 9 of the RTI Act, 2005."
    );
    addText(
      "(ii) To the best of my knowledge, the information sought pertains to your public authority."
    );
    addText("(iii) I am a citizen of India.");
    y += 10;

    /* -------- Closing -------- */
    addText(
      "I request you to kindly provide the above information within the statutory time limit prescribed under the Act."
    );
    y += 10;

    addText("Yours faithfully,");
    y += 14;

    addText("(Signature of the Applicant)", "italic", 11);
    addText(form.name, "bold");
    y += 6;

    addText("Place: ____________________");
    addText(`Date: ${form.date}`);

    return doc;
  };

  /* ================= DOWNLOAD ================= */

  const downloadRTIPDF = () => {
    const doc = generateRTIPDF();
    if (!doc) return;

    const safeName = form.name.replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`RTI_Application_FormA_${safeName}.pdf`);
  };

  /* ================= PREVIEW ================= */

  const openPdfPreview = () => {
    const doc = generateRTIPDF();
    if (!doc) return;

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfPreviewUrl(url);
    setShowPreview(true);
  };

  const closePreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate("/chat")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
            bg-white dark:bg-slate-900
            text-slate-700 dark:text-slate-200
            border border-slate-200 dark:border-slate-700
            hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          ← Back to Chat
        </button>

        <h1 className="text-3xl font-extrabold">
          RTI Application Generator
        </h1>

        {/* Form */}
        <input className={inputClass} name="name" placeholder="Applicant Name" onChange={handleChange} />
        <textarea className={inputClass} name="address" placeholder="Address" rows={2} onChange={handleChange} />
        <input className={inputClass} name="pio" placeholder="PIO Office / Department" onChange={handleChange} />
        <textarea className={inputClass} name="info" placeholder="Information Requested" rows={5} onChange={handleChange} />
        <input type="date" className={inputClass} name="date" onChange={handleChange} />

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={openPdfPreview}
            className="px-6 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800
              text-slate-900 dark:text-slate-100 font-semibold
              hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            👁 View Preview
          </button>

          <button
            onClick={downloadRTIPDF}
            className="px-6 py-3 rounded-2xl bg-indigo-600
              text-white font-semibold hover:bg-indigo-500 transition"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] mx-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold">RTI Application – PDF Preview</h2>
              <button onClick={closePreview} className="text-2xl hover:text-red-500">
                ×
              </button>
            </div>

            <iframe
              src={pdfPreviewUrl}
              title="RTI PDF Preview"
              className="flex-1 w-full"
            />

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={closePreview}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800"
              >
                Close
              </button>

              <button
                onClick={downloadRTIPDF}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
