const express = require("express");
const cors = require("cors");
const emailjs = require("@emailjs/nodejs");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
  const { customer_name, amount_formatted, date_formatted, receipt_html, to_email } = req.body;

  try {
    const result = await emailjs.send(
      "service_8s0xtaf",
      "template_hqhwz3i",
      { customer_name, amount_formatted, date_formatted, receipt_html, to_email },
      { publicKey: "uy0m-dwW_CcXCzVah" }
    );
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));