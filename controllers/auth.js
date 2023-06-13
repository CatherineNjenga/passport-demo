'use strict';
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const homePage = (req, res) => {
  // res.send('Home');
  let messages = [];
  if (req.session.messages) {
    messages = req.session.messages;
    req.session.messages = [];
  }
  res.render('index', { messages });
};

const signUp = async (req, res, next) => {
  res.render('sign-up-form');
};

const userSignUp = async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await User.create({ username: req.body.username, password: hashedPassword});
    res.redirect('/');
  } catch (error) {
    return next(error);
  }
};

// const logOut = (req, res, next) => {
//   req.log
// };

module.exports = {
  homePage,
  signUp, 
  userSignUp,
};