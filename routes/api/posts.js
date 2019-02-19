const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const router = express.Router();

// Load helpers
const errorSafeRequest = require('../helpers/helpers');

// Load Post model
const Post = require('../../models/Post');

// Load Profile model
const Profile = require('../../models/Profile');

// Load validation
const validatePostInput = require('../../validation/post');

// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Posts Works' }));

// @route   GET api/posts/
// @desc    Get posts
// @access  Public
router.get(
  '/',
  errorSafeRequest(async (req, res) => {
    const posts = await Post.find()
      .sort({ date: -1 })
      .exec();
    res.json(posts);
  })
);

// @route   GET api/posts/:id
// @desc    Get single post by id
// @access  Public
router.get(
  '/:id',
  errorSafeRequest(async (req, res) => {
    const post = await Post.findById(req.params.id).exec();
    res.json(post);
  })
);

// @route   POST api/posts/
// @desc    Create post
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  errorSafeRequest(async (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    const newPost = await Post.create({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    newPost
      .save()
      .then(post => res.json(post))
      .catch(console.error());
  })
);

// @route   DELETE api/posts/:id
// @desc    Delete post
// @access  Private
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  errorSafeRequest(async (req, res) => {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user.id
    }).exec();

    if (!post) {
      return res.json({ success: false, error: 'Post not found' });
    }

    // Delete post
    await post.remove();
    return res.json({ success: true });
  })
);

// @route   POST api/posts/like/:id
// @desc    Like Post
// @access  Private
router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  errorSafeRequest(async (req, res) => {
    const profile = await Profile.findOne({ user: req.user.id });
    console.log(profile);
  })
);

module.exports = router;
