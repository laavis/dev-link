const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const router = express.Router();

// Load Profile model
const Profile = require('../../models/Profile');

// Load User profile
const User = require('../../models/User');

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (_, res) => res.json({ msg: 'Profile Works' }));

// @route   GET api/profile
// @desc    Get current user's profile
// @access  Private
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      errors = {};
      const profile = await Profile.findOne({ user: req.user.id }).exec();

      if (!profile) {
        errors.noProfile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
);

// @route   Post api/profile
// @desc    Create user profile
// @access  Private
// Todo
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      errors = {};
      const profile = await Profile.findOne({ user: req.user.id }).exec();

      if (!profile) {
        errors.noProfile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
