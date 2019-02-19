module.exports = errorSafeRequest = body => async (req, res, next) => {
  try {
    await body(req, res, next);
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.json({ error: 'Internal server error' });
  }
};
