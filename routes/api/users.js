const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const { check, validationResult } = require('express-validator');

const router = express.Router();

const validateLoginInput = require('../../validation/login');

const User = require('../../models/User');

// @route   POST api/users/register
// @desc    Register new user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Please input valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ errors: [{ msg: 'Email already exists' }] });

      const avatar = gravatar.url(email, {
        s: 200,
        r: 'pg',
        d: 'mm'
      });

      user = new User({
        name,
        email,
        password,
        avatar
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 36000 }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST api/users/login
// @desc    Login user / Returning JWT Token
// @access  Private
router.post('/login', async (req, res, next) => {
  try {
    const { errors, isValid } = validateLoginInput(req.body);

    // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    // Match user email to req.body.user
    const savedUser = await User.findOne({ email }).exec();
    // Check for user
    if (!savedUser) {
      errors.email = 'User not found';
      return res.status(404).json(errors);
    }
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
      } else {
        errors.password = 'Invalid credentials';
        return res.status(400).json(errors);
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
