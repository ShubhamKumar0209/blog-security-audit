import { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import PostCard from '../components/PostCard';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts(page = 1) {
    setLoading(true);
    try {
      const { data } = await postsAPI.getAll(page);
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) {
      loadPosts();
      return;
    }
    setSearching(true);
    try {
      const { data } = await postsAPI.search(search);
      setPosts(data.posts);
      setPagination({});
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Latest Posts</h1>
        <p>Explore articles on web security, development, and best practices.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="search-input"
        />
      </form>

      {/* Posts Grid */}
      {loading || searching ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📝</div>
          <h3>No posts found</h3>
          <p>{search ? 'Try a different search term.' : 'Be the first to write a post!'}</p>
        </div>
      ) : (
        <>
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '2rem' }}>
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => loadPosts(i + 1)}
                  className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
