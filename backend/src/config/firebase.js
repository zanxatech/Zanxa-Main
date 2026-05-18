const admin = require('firebase-admin');

try {
  let serviceAccount;
  const saBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (saBase64) {
    try {
      const decoded = Buffer.from(saBase64, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
    } catch (e) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64');
    }
  } else if (saRaw) {
    try {
      serviceAccount = JSON.parse(saRaw);
    } catch (e) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT is not valid JSON');
    }
  }

  if (!admin.apps.length) {
    let credential;
    
    // Check if we have a valid-looking private key to prevent ASN.1 parsing errors
    const hasValidKey = serviceAccount && 
                        serviceAccount.private_key && 
                        serviceAccount.private_key.includes('BEGIN PRIVATE KEY');

    if (hasValidKey) {
      credential = admin.credential.cert(serviceAccount);
      admin.initializeApp({
        credential,
        projectId: projectId || serviceAccount.project_id
      });
      console.log('✅ Firebase Admin Initialized Successfully');
    } else {
      console.error('❌ CRITICAL: Firebase Private Key is missing or invalid in .env');
      console.log('💡 Note: Backend Auth will return 401 until a valid key is provided.');
      
      // Initialize with a dummy config to prevent "App does not exist" crashes
      // but without a valid cert so it fails gracefully on auth attempts
      admin.initializeApp({
        projectId: projectId || 'zanxa-tech-placeholder'
      });
    }
  }
} catch (error) {
  console.error('❌ Firebase Admin Initialization Error:', error.message);
}

module.exports = admin;
