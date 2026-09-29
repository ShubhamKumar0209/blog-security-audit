const mongoose = require('mongoose');
const User = require('./src/models/User');
const BlogPost = require('./src/models/BlogPost');
const env = require('./src/config/env');

async function test() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to DB');
    const adminUsers = await User.find({ role: 'ADMIN' });
    const adminIdsStr = adminUsers.map(u => u._id.toString());
    console.log('Admin IDs:', adminIdsStr);

    const allPosts = await BlogPost.find({});
    console.log('All posts count:', allPosts.length);
    if (allPosts.length > 0) {
      console.log('First post author:', allPosts[0].author, typeof allPosts[0].author, allPosts[0].author.toString());
    }
    
    const postsToDelete = allPosts.filter(p => !adminIdsStr.includes(p.author.toString()));
    const postIds = postsToDelete.map(p => p._id);
    
    console.log('Posts to delete:', postIds.length);
    console.log('Post IDs to delete:', postIds);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
