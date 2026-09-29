import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  const excerpt = post.content
    ?.replace(/<[^>]*>/g, '') // Strip HTML
    .substring(0, 180);

  const date = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <article className="card fade-in">
      <h2 className="card-title">
        <Link to={`/post/${post._id}`}>{post.title}</Link>
      </h2>
      <div className="card-meta">
        <span className="author" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {post.author?.name || 'Unknown'}
          {post.author?.role && (
            <span className={`role-badge ${post.author.role === 'ADMIN' ? 'role-admin' : 'role-user'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
              {post.author.role}
            </span>
          )}
        </span>
        <span>•</span>
        <span>{date}</span>
      </div>
      <p className="card-excerpt">{excerpt}...</p>
      <div className="card-footer">
        <Link to={`/post/${post._id}`} className="btn btn-secondary btn-sm">
          Read More →
        </Link>
      </div>
    </article>
  );
}
