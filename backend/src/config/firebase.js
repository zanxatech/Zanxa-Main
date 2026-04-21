const admin = require('firebase-admin');

try {
  let serviceAccount;
  const saBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;

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
    if (serviceAccount) {
      credential = admin.credential.cert(serviceAccount);
    } else {
      console.warn('⚠️ No valid Firebase credentials found, falling back to applicationDefault()');
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential,
      projectId: projectId || (serviceAccount ? serviceAccount.project_id : undefined)
    });
    console.log('✅ Firebase Admin Initialized');
  }
} catch (error) {
  console.error('❌ Firebase Admin Initialization Error:', error.message);
}

module.exports = admin;

