const express = require('express');
const passportRouter = express.Router();
// Require user model
const User = require('../models/User.model');
// Add bcrypt to encrypt passwords
const bcrypt = require('bcrypt');
// Add passport
const passport = require('passport');
const ensureLogin = require('connect-ensure-login');

//1. Render signup form
passportRouter.get('/signup', checkNotAuth, (req, res) => {
  res.render('passport/signup-form');
});
//2. add user form to DB
passportRouter.post('/signup', (req, res) => {
  const { username, password } = req.body;
  //check form if all inputs are filled by user
  if (!username || !password) {
    return res.render('passport/signup-form', {
      err: 'Please fill up all fields',
    });
  }
  //check if User isn't registered already
  User.findOne({ username })
    .then(currentUser => {
      if (currentUser !== null) {
        return res.render('passport/signup-form', {
          err: 'The username already exists!',
        });
      }
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(password, salt);
      return User.create({
        username,
        password: hashPassword,
      });
    })
    .then(() => res.render('passport/success-msg'))
    .catch(err => {
      res.render('passport/signup-form', { message: 'Something went wrong!' });
      console.log(err);
    });
});

//3. Render login page
passportRouter.get('/login', checkNotAuth, (req, res) => {
  console.log('Output for: req', req.session);
  res.render('passport/login-form', { message: req.flash('error') });
});

//4. login page
passportRouter.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/private-page',
    failureRedirect: '/login',
    failureFlash: true,
    passReqToCallback: true,
  })
);

//5. User account page
passportRouter.get(
  '/private-page',
  checkAuth,
  ensureLogin.ensureLoggedIn(),
  (req, res) => {
    res.render('passport/private', { user: req.user });
    // console.log('Output for: user', req.sessionID);
  }
);

//6.logout
passportRouter.get('/logout', (req, res) => {
  req.logout();
  res.render('passport/success-msg', {
    message: 'Thank you! You successfully signed out!',
  });
});

//some cool functions, which checks if signed in will not allow
//you to go /login or /signup pages or other way,
// if sign out will not allow you to go /private-page
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function checkNotAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/private-page');
  }
  next();
}

module.exports = passportRouter;
