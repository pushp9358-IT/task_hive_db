require("dotenv").config();
const express = require("express");
const app = express();


const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const List = require("./models/list.js");
const methodOverride = require("method-override"); // to use delete and put method
const User = require('./models/user');
const flash = require("connect-flash");
const dbUrl = process.env.MONGO_URL;
const PORT = process.env.PORT || 3000;


app.use(express.urlencoded({ extended: true })); // to access req.body// body parser  
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());

// session
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

// passport
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});


passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// mongoose.connect('mongodb://127.0.0.1:27017/tasknest')
//   .then(() => console.log('Connected!'));

async function startServer() {
  try {
    
    // 1. CONNECT DB

    await mongoose.connect(dbUrl);
    console.log("connected to DB");
  }catch (err) {
    console.log("DB CONNECTION ERROR:", err);
  }

app.use(methodOverride("_method"));  // to use delete and put method


// set view engine
app.set("view engine", "ejs");

// set views folder path (important)
app.set("views", path.join(__dirname, "views"));



app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
});

// Middleware


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

app.use((req, res, next) => {
  res.locals.error = req.session.messages || [];
  next();
});


// to add new task form

app.get("/", (req, res) => {
  res.render("list/home");
});

app.get("/signup", async(req,res) => {
  res.render('list/signup');

});


app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    // ✅ LOGIN USER AFTER SIGNUP
    req.login(registeredUser, (err) => {
      if (err) {
        console.log(err);
        return res.redirect("/login");
      }
      return res.redirect("/add");
    });

  } catch (err) {
    console.log(err);
    res.render("list/signup", { error: err.message });
  }
});



// Login

app.get("/login", (req, res) => {
  res.render('list/login');
});

app.post("/login", passport.authenticate("local", {
  successRedirect : "/add",
  failureRedirect: "/login",
  failureMessage: true,
}));

//Logout

app.get("/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    res.redirect("/add"); // redirect to home
  });
});


// to add new task

app.post('/add', isLoggedIn, async(req, res) => {
  const newList = new List({
    list: req.body.list,
    user: req.user._id   // important
  });
  await newList.save();
  res.redirect('/add');

  
});

//to show the task

app.get('/add', isLoggedIn, async(req,res) => {
  const lists = await List.find({ user: req.user._id });
  res.render("list/add", {lists});
});


// Destroy task

app.delete('/add/:id', isLoggedIn, async(req, res) => {
  let {id} = req.params;
  await List.findByIdAndDelete(id);
  res.redirect("/add");
});

// Edit  task

app.put('/add/:id', isLoggedIn, async(req, res) => {
  let {id} = req.params;
  let {list} = req.body;
  await List.findByIdAndUpdate(id, {list});
  res.redirect("/add");
  
});
}


startServer();
