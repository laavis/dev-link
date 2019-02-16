const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const router = express.Router();

// Load validation
const validateProfileInput = require('../../validation/profile');

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
      const profile = await Profile.findOne({ user: req.user.id })
        .populate('user', ['name', 'avatar'])
        .exec();

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
// @desc    Create or edit user profile
// @access  Private
// Todo
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const { errors, isValid } = validateProfileInput(req.body);

      // Check validation
      if (!isValid) {
        // Return any errors with 400 status
        return res.status(400).json(errors);
      }
      // Get fields
      const profileFields = {};

      // Get user
      profileFields.user = req.user.id;

      // Handle: access the profile
      if (req.body.handle) profileFields.handle = req.body.handle;
      if (req.body.company) profileFields.company = req.body.company;
      if (req.body.website) profileFields.website = req.body.website;
      if (req.body.location) profileFields.location = req.body.location;
      if (req.body.status) profileFields.status = req.body.status;
      if (req.body.bio) profileFields.bio = req.body.bio;
      profileFields.gitHubUsername = req.body.gitHubUsername;

      // Skills - split into array
      if (typeof req.body.skills !== undefined) {
        profileFields.skills = req.body.skills.split(',');
      }

      if (req.body.gitHubUsername) {
        profileFields.gitHubUsername = req.body.gitHubUsername;
      }

      // Social
      profileFields.social = {};
      if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
      if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
      if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
      if (req.body.linkedIn) profileFields.social.linkedIn = req.body.linkedIn;
      if (req.body.instagram) {
        profileFields.social.instagram = req.body.instagram;
      }

      // Find user profile
      const userId = req.user.id;

      try {
        const profile = await Profile.findOne({ user: userId }).exec();
        if (profile) {
          // Update profile
          const updateProfile = await Profile.findOneAndUpdate(
            { user: userId },
            { $set: profileFields },
            { new: true }
          ).exec();
          console.log(res.json(updateProfile));
          profile => {
            res.json(updateProfile);
          };
        } else {
          // Create profile
          const newProfile = await Profile.findOne({
            handle: profileFields.handle
          }).exec();
          if (profile) {
            errors.handle = 'That handle already exists';
            res.status(400).json(errors);
          }

          // Save profile
          new Profile(profileFields)
            .save()
            .then(profile => res.json(newProfile));
        }
      } catch (err) {
        return err;
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
