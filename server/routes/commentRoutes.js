const express = require('express');
const {
  getComments,
  addComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Apply auth middleware to all comment routes
router.use(protect);

router.route('/')
  .get(getComments)
  .post(addComment);

router.route('/:commentId')
  .delete(deleteComment);

module.exports = router;
