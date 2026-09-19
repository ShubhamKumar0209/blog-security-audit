import { useState, useEffect } from 'react';
import { commentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DOMPurify from 'dompurify';

export default function CommentSection({ postId, securityMode }) {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    try {
      const { data } = await commentsAPI.getByPost(postId);
      setComments(data.comments);
    } catch (err) {
      setError('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');

    try {
      const { data } = await commentsAPI.create(postId, { content });
      setComments([data.comment, ...comments]);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post comment.');
    }
  }

  async function handleDelete(commentId) {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.delete(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete comment.');
    }
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  return (
    <section className="comments-section fade-in">
      <h3>💬 Comments ({comments.length})</h3>

      {/* XSS Warning for baseline mode */}
      {securityMode === 'baseline' && (
        <div className="xss-warning">
          ⚠️ <strong>BASELINE MODE:</strong> Comments are rendered without sanitization.
          Try submitting: <code>&lt;script&gt;alert("XSS Demo")&lt;/script&gt;</code>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              style={{ minHeight: '80px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!content.trim()}>
            Post Comment
          </button>
        </form>
      ) : (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <a href="/login">Login</a> to post a comment.
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : comments.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p>No comments yet. Be the first!</p>
        </div>
      ) : (
        comments.map((comment) => (
          <div key={comment._id} className="comment-card">
            <div className="comment-header">
              <span className="comment-author">{comment.author?.name || 'Unknown'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
                {(user?._id === comment.author?._id || isAdmin) && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            {/* ---------------------------------------------------------------
              SECURITY NOTE (V-04 — XSS):
              BASELINE: Uses dangerouslySetInnerHTML — any HTML in comments
              is rendered as-is, including <script> tags.
              HARDENED: Uses textContent (plain text rendering) — HTML is
              displayed as literal text, preventing script execution.
            --------------------------------------------------------------- */}
            {securityMode === 'baseline' ? (
              <div
                className="comment-body"
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
            ) : (
              <div 
                className="comment-body" 
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }} 
              />
            )}
          </div>
        ))
      )}
    </section>
  );
}
