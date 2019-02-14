const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

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
router.post('/register', async (req, res, next) => {
  try {
    const { errors, isValid } = validateRegisterInput(req.body);

    // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const user = await User.findOne({ email: req.body.email }).exec();
    console.log('here');
    // Check if user already exists
    if (user) return res.status(400).json({ email: 'Email already exists' });
    // Create new user
    const avatar = gravatar.url(req.body.email, {
      s: 200, // Size
      r: 'pg', // Rating (no naughty avatars ;))
      d: 'mm' // Default
    });
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      avatar
    });

    // Hash user password
    bcrypt.genSalt(10, (_, salt) => {
      bcrypt.hash(newUser.password, salt, async (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser.password = hash;
        const savedUser = await newUser.save();
        return res.json(savedUser);
      });
    });
  } catch (error) {
    next(error);
  }
});
// @route   POST api/users/login
// @desc    Login user / Returning JWT Token
// @access  Private
router.post('/login', async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    // Match user email to req.body.user
    const savedUser = await User.findOne({ email }).exec();
    // Check for user
    if (!savedUser) return res.status(404).json({ email: 'User not found' });
    // Check password
    bcrypt.compare(password, savedUser.password).then(isMatch => {
      if (isMatch) {
        // User matched
        const payload = {
          id: savedUser.id,
          name: savedUser.name,
          avatar: savedUser.avatar
        }; // Create JWT payload

        // Sign token
        jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (_, token) => {
          res
            .json({
              success: true,
              token: `Bearer ${token}`
            })
            .catch(err => console.error(err));
        });
      } else return res.status(400).json({ password: 'Incorrect password' });
    });
  } catch (error) {
    next(error);
  }
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
