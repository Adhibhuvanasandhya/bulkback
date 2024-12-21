require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();


// Configure CORS
app.use(cors({
  origin: "https://bulkfront.onrender.com", // Replace with your frontend domain
  methods: ["GET", "POST"], // Specify allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  credentials: true, // Allow credentials (optional)
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const users = [];

// Signup route
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (users.find(user => user.username === username)) {
    return res.status(400).json({ message: "User already exists!" });
  }
  users.push({ username, password });
  res.status(201).json({ message: "Signup successful!" });
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials!" });
  }
  res.status(200).json({ message: "Login successful!" });
});

// MongoDB connection
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to DB"))
  .catch(err => console.error("Failed to connect to DB:", err));

// Define the Credential schema and model
const Credential = mongoose.model("Credential", {}, "bulkmail");

// Email-sending route
app.post("/sendemail", async (req, res) => {
  const { msg, emailList } = req.body;

  try {
    const credentials = await Credential.find();
    if (!credentials || credentials.length === 0) {
      return res.status(500).json({ message: "No email credentials found!" });
    }

    const { user, pass } = credentials[0].toJSON();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    // Send emails to all recipients
    for (const email of emailList) {
      try {
        await transporter.sendMail({
          from: user,
          to: email,
          subject: "A message from Bulk Mail App",
          text: msg,
        });
        console.log("Email sent to:", email);
      } catch (err) {
        console.error(`Error sending email to ${email}:`, err);
        return res.status(500).json({ message: "Failed to send some emails." });
      }
    }

    res.status(200).json({ message: "Emails sent successfully!" });
  } catch (err) {
    console.error("Error fetching email credentials:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}...`);
});
