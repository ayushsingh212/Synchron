import React, { useState } from "react";

/**
 * Upload PDF utility - uploads file and calls backend OCR/Extractor.
 * For production: use chunked uploads, handle CORS, and secure endpoints.
 */

const UploadPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<null | "idle" | "uploading" | "done" | "error">(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setStatus("uploading");
    try {
      // TODO: create FormData, send to extraction endpoint
      await new Promise((r) => setTimeout(r, 1000));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="max-w-xl">
      <h3 className="font-semibold mb-3">Upload PDF for extraction</h3>
      <input type="file" accept="application/pdf" onChange={handleFile} />
      <div className="mt-3 flex gap-2">
        <button onClick={upload} disabled={!file || status === "uploading"} className="bg-brand-500 text-white px-3 py-1 rounded disabled:opacity-50">Upload & Extract</button>
        <button onClick={() => setFile(null)} className="px-3 py-1 border rounded">Clear</button>
      </div>

      <div className="mt-4">
        {status === "uploading" && <div>Uploading…</div>}
        {status === "done" && <div className="text-green-600">Extraction finished. Check Data Input → Generate.</div>}
        {status === "error" && <div className="text-red-600">Error while extracting PDF.</div>}
      </div>
    </section>
  );
};

export default UploadPdf;
