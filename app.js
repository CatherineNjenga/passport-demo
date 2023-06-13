'use strict';
require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');


const port = process.env.PORT || 3000;
const authRouter = require('./routes/auth');
const User = require('./models/User');

const connectDB = require('./db/connect');

const MongoDBStore = require('connect-mongodb-session')(session);

var store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions',
});

// Catch errors
store.on('error', function(error) {
  console.log(error);
});

passport.use(
  new LocalStrategy(async(username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      };
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Incorrect password" });
        }
      });  
    } catch(err) {
      return done(err);
    };
  })
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err);
  };
});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({ 
  secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true,
  store: store,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

const authMiddleware = (req, res, next) => {
  if (!req.user) {
    if (!req.session.messages) {
      req.session.messages = [];
    }
    req.session.messages.push("You can't access that page before logon.");
    res.redirect('/');
  } else {
    next();
  }
}

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureMessage: true,
  })
);

app.get('/restricted', authMiddleware, (req, res) => {
  if (!req.session.pageCount) {
    req.session.pageCount = 1;
  } else {
    req.session.pageCount += 1;
  }
  res.render('restricted', { pageCount: req.session.pageCount });
})

app.get('/log-out', (req, res, next) => {
  req.session.destroy(function(err) {
    res.redirect('/');
  });
  // req.logout(function(err) {
  //   if (err) {
  //     return next(err);
  //   }
  //   res.redirect('/');
  // })
});

app.use('/', authRouter);
app.use('/sign-up', authRouter);


const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server listening on port: ${port}...`);
    })
  } catch (error) {
    console.log(error);
  }
}

start();