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

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const dataBuffer = fs.readFileSync(file.filepath);

    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `Erstelle ein professionelles mobile.de Inserat:\n${text}`,
          },
        ],
      }),
    });

    const json = await response.json();

    res.status(200).json({
      text: json.choices[0].message.content,
    });
  });
}