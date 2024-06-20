// import { MockFirebase } from 'firebase-mock';
// import firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/firestore';
// import 'firebase/storage';

// // Create mock instances
// const mockAuth = new MockFirebase().auth();
// const mockFirestore = new MockFirebase().firestore();
// const mockStorage = new MockFirebase().storage();

// // Mock the initializeApp method
// const initializeApp = (config, name) => {
//     const app = firebase.initializeApp(config, name);
//     app.auth = () => mockAuth;
//     app.firestore = () => mockFirestore;
//     app.storage = () => mockStorage;
//     return app;
// };

// // Override Firebase methods
// firebase.auth = () => mockAuth;
// firebase.firestore = () => mockFirestore;
// firebase.storage = () => mockStorage;
// firebase.initializeApp = initializeApp;

// export { mockAuth, mockFirestore, mockStorage, initializeApp };
