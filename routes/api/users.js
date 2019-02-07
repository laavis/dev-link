const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const chalk = require('chalk');

const router = express.Router();

// Load input validation
const validateRegisterInput = require('../../validation/register');

// Load User model
const User = require('../../models/User');

// Load keys
const keys = require('../../config/keys');

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Users Works' }));

// @route   POST api/users/register
// @desc    Register new user
// @access  Public
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    // Check if user already exists
    if (user) return res.status(400).json({ email: 'Email already exists' });
    // Create new user
    const avatar = gravatar.url(req.body.email, {
      s: 200, // Size
      r: 'pg', // Rating (no naughty avatars)
      d: 'mm' // Default
    });
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      avatar
    });

    // Hash user password
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser
          .save()
          .then(user => res.json(user))
          .catch(err => console.error(err));
      });
    });
  });
});

// @route   POST api/users/login
// @desc    Login user / Returning JWT Token
// @access  Private
router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  // Match user email to req.body.user
  User.findOne({ email })
    .then(user => {
      // Check for user
      if (!user) return res.status(404).json({ email: 'User not found' });
      // Check password
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          // User matched
          const payload = { id: user.id, name: user.name, avatar: user.avatar }; // Create JWT payload

          // Sign token
          jwt.sign(
            payload,
            keys.secretOrKey,
            { expiresIn: 3600 },
            (err, token) => {
              res
                .json({
                  success: true,
                  token: `Bearer ${token}`
                })
                .catch(err => console.error(err));
            }
          );
        } else return res.status(400).json({ password: 'Incorrect password' });
      });
    })
    .catch(err => console.error(err));
});

// @route   POST api/users/current
// @desc    Return current user (whoever the JWT belongs to)
// @access  Private
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);

module.exports = router;
