const express = require("express")
const cors = require("cors")
const nodemailer = require("nodemailer");
const bodyParser = require('body-parser');
const mongoose = require("mongoose")

const app = express()
app.use(cors())
app.use(express.json())
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



mongoose.connect("mongodb+srv://sandhya:1234@cluster0.l7vwr.mongodb.net/passkey?retryWrites=true&w=majority&appName=Cluster0").then(function () {
  console.log("connected to DB")
}).catch(function () {
  console.log("Failed to connect")
})


const credential = mongoose.model("credential", {}, "bulkmail")



app.post("/sendemail", function (req, res) {
  var msg = req.body.msg
  var emailList = req.body.emailList

  credential.find().then(function (data) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: data[0].toJSON().user,
        pass: data[0].toJSON().pass,
      },
    });


    new Promise(async function (resolve, reject) {
      try {
        for (var i = 0; i < emailList.length; i++) {
          await transporter.sendMail(
            {
              from: "sandhyaponrajan.l@gmail.com",
              to: emailList[i],
              subject: "A message from Bulk Mail App",
              text: msg
            },

          )
          console.log("Email sent to:" + emailList[i])
        }
        resolve("Success")

      }
      catch (error) {
        reject("Failed")
      }


    }).then(function () {
      res.send(true)
    })
      .catch(function () {
        res.send(false)
      })

  }).catch(function (error) {
    console.log(error)
  })

})

app.listen(5000, function () {
  console.log("Server started...")
})