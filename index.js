const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

//DATABASE CONNECTIVITY-----------
mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "Learning_Backend",
  })
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));
//---------------------------------

//DATABASE SCHEMA------------------
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);
//---------------------------------

//setting up view engine-----------
app.set("view engine", "ejs");
//---------------------------------

//MIDDLEWARE-----------------------
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
async function isAuthticated(req, res, next) {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "asdfgh");
    req.user = await User.findById(decoded._id);
    // console.log(decoded);
    next();
  } else {
    res.redirect("/login");
  }
}
//---------------------------------

//GET------------------------------
app.get("/", isAuthticated, (req, res) => {
  console.log(req.user);
  const { name } = req.user;
  res.render("logout", {
    name: name,
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});
//---------------------------------

//POST-----------------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) {
    return res.redirect("/register");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.render("login", {
      message: "Incorrect Password",
    });

  const token = jwt.sign(
    {
      _id: user._id,
    },
    "asdfgh"
  );
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let userData = await User.findOne({ email });
  if (userData) {
    return res.redirect("/login");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  userData = await User.create({
    name: name,
    email: email,
    password: hashedPassword,
  });
  const token = jwt.sign(
    {
      _id: userData._id,
    },
    "asdfgh"
  );
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

// app.post("/", (req, res) => {
//   users
//     .push({
//       userName: req.body.name,
//       email: req.body.email,
//     })
//     .then(res.redirect("/users"));
// });
//---------------------------------

app.listen(5000, () => {
  console.log("Server is running");
});
