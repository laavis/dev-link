const express = require('express');
const mongoose = require('mongoose');
const passport = 'ey';
const router = express.Router();

// Load helpers
const errorSafeRequest = require('../helpers/helpers');

// Load validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

// Load Profile model
const Profile = require('../../models/Profile');

// Load User model
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

  errorSafeRequest(async (req, res) => {
    errors = {};
    const profile = await Profile.findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar'])
      .exec();
    if (!profile) {
      errors.noProfile = 'There is no profile for this user';
      return res.status(404).json(errors);
    }
    return res.json(profile);
  })
);

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public
router.get(
  '/handle/:handle',
  errorSafeRequest(async (req, res) => {
    const errors = {};
    // handle: get ':handle' (name) from the url
    const profile = await Profile.findOne({ handle: req.params.handle })
      .populate('user', ['name', 'avatar'])
      .exec();
    if (!profile) {
      errors.noProfile = 'Seems like there is no profile for this user :(';
      res.status(404).json(errors);
    }
    res.json(profile);
  })
);

// @route   GET api/profile/all
// @desc    Get all user profiles
// @access  Public
router.get(
  '/all',
  errorSafeRequest(async (req, res) => {
    const profiles = await Profile.find()
      .populate('user', ['name', 'avatar'])
      .exec();
    if (!profiles) {
      errors.noProfiles = 'There are no profiles yet';
      return res.status(404).json(errors);
    }
    res.json(profiles);
  })
);

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get(
  '/user/:user_id',
  errorSafeRequest(async (req, res) => {
    const errors = {};
    const profile = await Profile.findOne({ user: req.params.user_id })
      .populate('user', ['name', 'avatar'])
      .exec();
    if (!profile) {
      errors.noProfile = 'Seems like there is no profile for this user :(';
      res.status(404).json(errors);
    }
    res.json(profile);
  })
);

// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post(
  '/',
  errorSafeRequest(async (req, res) => {
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
    const profile = await Profile.findOne({ user: userId }).exec();
    if (profile) {
      // Update profile
      const updateProfile = await Profile.findOneAndUpdate(
        { user: userId },
        { $set: profileFields },
        { new: true }
      ).exec();
      res.json(updateProfile);
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
      new Profile(profileFields).save().then(prof => res.json(prof));
    }
  })
);

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post(
  '/education',
  errorSafeRequest(async (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    // Check validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    const profile = await Profile.findOne({ user: req.user.id }).exec();
    const newEdu = {
      school: req.body.school,
      degree: req.body.degree,
      fieldOfStudy: req.body.fieldOfStudy,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description
    };
    // Add to experience array
    profile.education.unshift(newEdu);
    profile
      .save()
      .then(prof => res.json(prof))
      .catch(err => console.error(err));
  })
);

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post(
  '/experience',
  errorSafeRequest(async (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    // Check validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    const profile = await Profile.findOne({ user: req.user.id }).exec();
    const newExp = {
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description
    };
    // Add to experience array
    profile.experience.unshift(newExp);

    const savedProfile = await profile.save();

    return res.json(savedProfile);
  })
);

// @route   POST api/profile/experience/:exp_id
// @desc    Edit experience from profile
// @access  Private
// TODO
router.post(
  '/experience/:exp_id',
  errorSafeRequest(async (req, res) => {
    const profile = await Profile.findOne({ user: req.user.id }).exec();

    // Get remove index
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

    // Splice out of array
    profile.experience.splice(removeIndex, 1);

    // Save
    profile
      .save()
      .then(prof => res.json(prof))
      .catch(err => console.error(err));
  })
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete(
  '/education/:exp_id',
  errorSafeRequest(async (req, res) => {
    const profile = await Profile.findOne({ user: req.user.id }).exec();

    // Get remove index
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.exp_id);

    // Splice out of array
    profile.education.splice(removeIndex, 1);

    // Save
    profile
      .save()
      .then(prof => res.json(prof))
      .catch(err => console.error(err));
  })
);

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete(
  '/',
  errorSafeRequest(async (req, res) => {
    const profile = await Profile.remove({ user: req.user.id }).exec();
    if (profile) {
      User.findByIdAndRemove({ _id: req.user.id }).exec();
    }
    res.json({ success: true });
  })
);

module.exports = router;
