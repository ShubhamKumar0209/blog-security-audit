// =============================================================================
// Post Routes
// =============================================================================
// GET    /api/posts          — List all posts (public)
// GET    /api/posts/search   — Search posts (public)
// GET    /api/posts/:id      — Get single post (public)
// POST   /api/posts          — Create post (auth required)
// PUT    /api/posts/:id      — Update post (auth required)
// DELETE /api/posts/:id      — Delete post (auth required)
// =============================================================================

const express = require('express');
const router = express.Router();
const { getPosts, getPost, searchPosts, createPost, updatePost, deletePost } = require('../controllers/postController');
const { authenticate } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validate');

router.get('/', getPosts);
router.get('/search', searchPosts);
router.get('/:id', validateObjectId('id'), getPost);
router.post('/', authenticate, validate('createPost'), createPost);
router.put('/:id', authenticate, validateObjectId('id'), validate('updatePost'), updatePost);
router.delete('/:id', authenticate, validateObjectId('id'), deletePost);

module.exports = router;
