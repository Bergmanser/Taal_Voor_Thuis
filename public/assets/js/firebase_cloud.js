// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteStudentUser = functions.https.onCall(async (data, context) => {
    // Verify the caller is authorized (is a parent user)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, parentEmail } = data;

    try {
        // Verify the user exists and belongs to this parent
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }

        if (userDoc.data().parentEmail !== parentEmail) {
            throw new functions.https.HttpsError('permission-denied', 'Not authorized to delete this user');
        }

        // Delete from Authentication
        await admin.auth().deleteUser(userId);

        // Delete from Firestore collections
        await Promise.all([
            admin.firestore().doc(`users/${userId}`).delete(),
            admin.firestore().doc(`studentdb/${userId}`).delete()
        ]);

        return { success: true, message: 'User successfully deleted' };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});