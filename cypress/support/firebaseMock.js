// cypress/support/firebaseMock.js
import { MockFirebase } from 'firebase-mock';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

// Mock Firebase instances
const mockAuth = new MockFirebase().auth();
const mockFirestore = new MockFirebase().firestore();
const mockStorage = new MockFirebase().storage();

// Overwrite Firebase methods with mocks
firebase.auth = () => mockAuth;
firebase.firestore = () => mockFirestore;
firebase.storage = () => mockStorage;

// Mock the initializeApp method
const initializeApp = (config, name) => {
    if (name) {
        // Handle secondary app initialization if necessary
        return {
            auth: () => mockAuth,
            firestore: () => mockFirestore,
            storage: () => mockStorage,
        };
    }
    return {
        auth: () => mockAuth,
        firestore: () => mockFirestore,
        storage: () => mockStorage,
    };
};

firebase.initializeApp = initializeApp;

export { mockAuth, mockFirestore, mockStorage, initializeApp };
