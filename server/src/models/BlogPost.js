// =============================================================================
// BlogPost Model
// =============================================================================
// Fields: title, content, author (ref User), timestamps.
// =============================================================================

const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required']
    }
  },
  {
    timestamps: true
  }
);

// Index for search
blogPostSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('BlogPost', blogPostSchema);
