const adminController = require('./src/controllers/adminController');
console.log('Keys:', Object.keys(adminController));
console.log('Is function:', typeof adminController.deleteAllNonAdminPosts);
