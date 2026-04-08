import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data.text);
    } catch (err) {
      console.error(err);
      setResult("Fehler bei der Verarbeitung.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Card className="w-full max-w-2xl p-6">
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-bold">DAT → mobile.de Inserat</h1>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <Button onClick={handleUpload} disabled={loading}>
            {loading ? "Erstelle Inserat..." : "Inserat erstellen"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-white border rounded-xl whitespace-pre-wrap">
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ================= BACKEND (Node.js / Express) =================

// Datei: /pages/api/generate.js (bei Next.js)

import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload Fehler" });

    const file = files.file;
    const dataBuffer = fs.readFileSync(file.filepath);

    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Erstelle ein professionelles mobile.de Inserat basierend auf diesen DAT-Daten:\n${text}`,
          },
        ],
      }),
    });

    const json = await openaiRes.json();

    res.status(200).json({
      text: json.choices[0].message.content,
    });
  });
}
