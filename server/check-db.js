const mongoose = require('mongoose');
const User = require('./src/models/User');
const BlogPost = require('./src/models/BlogPost');
const env = require('./src/config/env');

async function test() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('DB connected');

  const adminUsers = await User.find({ role: 'ADMIN' });
  const adminIdsStr = adminUsers.map(u => u._id.toString());
  console.log('adminIdsStr:', adminIdsStr);

  const allPosts = await BlogPost.find({});
  console.log('allPosts count:', allPosts.length);
  
  if (allPosts.length > 0) {
    console.log('author types:', allPosts.map(p => typeof p.author));
    console.log('author strings:', allPosts.map(p => p.author.toString()));
  }

  const postsToDelete = allPosts.filter(p => !adminIdsStr.includes(p.author.toString()));
  console.log('postsToDelete:', postsToDelete.length);
  process.exit(0);
}
test();
