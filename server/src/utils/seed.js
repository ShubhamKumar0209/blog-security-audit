// =============================================================================
// Seed Utility
// =============================================================================
// Creates sample data for demonstration purposes.
// Run: npm run seed
// =============================================================================

const mongoose = require('mongoose');
const User = require('../models/User');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const env = require('../config/env');

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await BlogPost.deleteMany({});
    await Comment.deleteMany({});
    console.log('Cleared existing data.');

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@blog.local',
      passwordHash: 'Admin@123',
      role: 'ADMIN'
    });
    await admin.save();

    // Create regular users
    const user1 = new User({
      name: 'Alice Johnson',
      email: 'alice@blog.local',
      passwordHash: 'Alice@123',
      role: 'USER'
    });
    await user1.save();

    const user2 = new User({
      name: 'Bob Smith',
      email: 'bob@blog.local',
      passwordHash: 'Bobby@123',
      role: 'USER'
    });
    await user2.save();

    console.log('Created users: admin@blog.local, alice@blog.local, bob@blog.local');

    // Create blog posts
    const posts = [
      {
        title: 'Understanding Web Application Security',
        content: `<h2>Introduction to Web Security</h2>
<p>Web application security is a critical aspect of modern software development. In this post, we explore the fundamental concepts that every developer should understand.</p>
<h3>The OWASP Top 10</h3>
<p>The Open Web Application Security Project (OWASP) maintains a list of the most critical security risks to web applications. Understanding these risks is the first step toward building secure applications.</p>
<p>Key areas include:</p>
<ul>
<li><strong>Injection</strong> — SQL, NoSQL, OS command injection</li>
<li><strong>Broken Authentication</strong> — Session management flaws</li>
<li><strong>Cross-Site Scripting (XSS)</strong> — Reflected, stored, DOM-based</li>
<li><strong>Broken Access Control</strong> — Missing authorization checks</li>
</ul>
<p>Security is not a feature — it's a requirement.</p>`,
        author: admin._id
      },
      {
        title: 'JWT Authentication: Best Practices',
        content: `<h2>JSON Web Tokens in Practice</h2>
<p>JWT (JSON Web Tokens) are widely used for stateless authentication in modern web applications. However, they come with their own set of security considerations.</p>
<h3>Important Considerations</h3>
<p>When implementing JWT authentication:</p>
<ul>
<li>Always specify the <strong>algorithm</strong> in verification</li>
<li>Use strong, randomly generated secrets</li>
<li>Set appropriate token expiration times</li>
<li>Consider token refresh strategies</li>
<li>Never store sensitive data in the payload</li>
</ul>
<p>Remember: JWT does not automatically provide secure authentication. The implementation details matter enormously.</p>`,
        author: user1._id
      },
      {
        title: 'Defense in Depth: Layered Security',
        content: `<h2>Why One Security Control Is Never Enough</h2>
<p>Defense in depth is a security strategy that employs multiple layers of controls throughout an application. If one layer fails, another layer prevents the attack from succeeding.</p>
<h3>Layers of Security</h3>
<p>A well-secured web application uses:</p>
<ul>
<li><strong>Network layer</strong> — Firewalls, HTTPS</li>
<li><strong>Application layer</strong> — Input validation, output encoding</li>
<li><strong>Authentication layer</strong> — Strong passwords, MFA</li>
<li><strong>Authorization layer</strong> — Role-based access, ownership checks</li>
<li><strong>Data layer</strong> — Encryption at rest, parameterized queries</li>
</ul>
<p>No single control can protect against all attacks. That's why we layer our defenses.</p>`,
        author: user2._id
      }
    ];

    const createdPosts = await BlogPost.insertMany(posts);
    console.log(`Created ${createdPosts.length} blog posts.`);

    // Create comments
    const comments = [
      {
        postId: createdPosts[0]._id,
        author: user1._id,
        content: 'Great overview of web security fundamentals! The OWASP Top 10 is a must-read for every developer.'
      },
      {
        postId: createdPosts[0]._id,
        author: user2._id,
        content: 'I learned a lot from this post. Would love to see more about specific attack prevention techniques.'
      },
      {
        postId: createdPosts[1]._id,
        author: user2._id,
        content: 'The point about specifying algorithms in JWT verification is crucial. I\'ve seen many tutorials skip this step.'
      },
      {
        postId: createdPosts[2]._id,
        author: admin._id,
        content: 'Defense in depth is the cornerstone of good security architecture. Well explained!'
      }
    ];

    await Comment.insertMany(comments);
    console.log(`Created ${comments.length} comments.`);

    console.log('\n--- Seed Complete ---');
    console.log('Login credentials (password is hashed in DB):');
    console.log('  Admin: admin@blog.local / Admin@123');
    console.log('  User1: alice@blog.local / Alice@123');
    console.log('  User2: bob@blog.local   / Bobby@123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
