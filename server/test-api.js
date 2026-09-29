const jwt = require('jsonwebtoken');
const env = require('./src/config/env');

async function trigger() {
  const payload = {
    id: '6a7b7080c5ee00d6fed3809d', // from previous test
    email: 'admin@blog.local',
    role: 'ADMIN'
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });

  try {
    const res = await fetch('http://localhost:5001/api/admin/posts/non-admin', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Success:', data);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
trigger();
