import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsAPI, healthAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';

export default function Post() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [securityMode, setSecurityMode] = useState('baseline');

  useEffect(() => {
    loadPost();
    healthAPI.check().then(({ data }) => setSecurityMode(data.mode)).catch(() => {});
  }, [id]);

  async function loadPost() {
    try {
      const { data } = await postsAPI.getOne(id);
      setPost(data.post);
    } catch (err) {
      setError('Post not found.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postsAPI.delete(id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete post.');
    }
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!post) return null;

  const isOwner = user?._id === post.author?._id;

  return (
    <div className="fade-in">
      {/* XSS Warning for baseline mode */}
      {securityMode === 'baseline' && (
        <div className="xss-warning">
          ⚠️ <strong>BASELINE MODE (V-04):</strong> Post content is rendered using <code>dangerouslySetInnerHTML</code>.
          This means any HTML in the content — including <code>&lt;script&gt;</code> tags — will be executed by the browser.
        </div>
      )}

      <article className="post-detail">
        <h1>{post.title}</h1>
        <div className="card-meta" style={{ marginBottom: '1.5rem' }}>
          <span className="author">{post.author?.name || 'Unknown'}</span>
          <span>•</span>
          <span>{formatDate(post.createdAt)}</span>
          {post.updatedAt !== post.createdAt && (
            <>
              <span>•</span>
              <span>Updated {formatDate(post.updatedAt)}</span>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------------
          SECURITY NOTE (V-04 — Unsafe Output Handling):
          BASELINE: Post content is rendered using dangerouslySetInnerHTML.
          If the content contains <script>alert("XSS")</script>, it will
          execute in the user's browser. This demonstrates stored XSS.

          HARDENED: Content is rendered as text OR sanitized HTML.
          Script tags are stripped, event handlers removed.
        --------------------------------------------------------------- */}
        {securityMode === 'baseline' ? (
          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <div className="post-content">{post.content}</div>
        )}

        {/* Post Actions */}
        {(isOwner || isAdmin) && (
          <div className="post-actions">
            {isOwner && (
              <Link to={`/edit/${post._id}`} className="btn btn-secondary btn-sm">
                ✏️ Edit
              </Link>
            )}
            <button onClick={handleDelete} className="btn btn-danger btn-sm">
              🗑️ Delete
            </button>
          </div>
        )}
      </article>

      {/* Comments */}
      <CommentSection postId={post._id} securityMode={securityMode} />
    </div>
  );
}
