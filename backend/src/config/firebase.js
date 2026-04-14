const admin = require('firebase-admin');

try {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  // Check if we have a real-looking service account or project ID
  const hasValidServiceAccount = serviceAccountRaw && 
    !serviceAccountRaw.includes('your-project-id') && 
    !serviceAccountRaw.includes('...');
    
  const hasValidProjectId = projectId && !projectId.includes('your-project-id');

  if (hasValidServiceAccount || hasValidProjectId) {
    let credential;
    
    if (hasValidServiceAccount) {
      try {
        const saJson = JSON.parse(serviceAccountRaw);
        credential = admin.credential.cert(saJson);
      } catch (e) {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT is not valid JSON. Falling back to applicationDefault.');
        credential = admin.credential.applicationDefault();
      }
    } else {
      credential = admin.credential.applicationDefault();
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential,
        projectId: hasValidProjectId ? projectId : undefined
      });
      console.log('✅ Firebase Admin Initialized');
    }
  } else {
    console.warn('⚠️ Firebase credentials missing or set to placeholders in .env. Authentication features may be limited.');
  }
} catch (error) {
  console.error('❌ Firebase Admin Initialization Error:', error.message);
}

module.exports = admin;
