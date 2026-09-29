import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <div className="card profile-card">
        <div className="profile-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>

        <dl className="profile-info">
          <dt>Name</dt>
          <dd>{user?.name}</dd>

          <dt>Email</dt>
          <dd>{user?.email}</dd>

          <dt>Role</dt>
          <dd>
            <span className={`role-badge ${user?.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
              {user?.role}
            </span>
          </dd>

          <dt>Member Since</dt>
          <dd>{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</dd>
        </dl>
      </div>
    </div>
  );
}
