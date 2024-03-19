import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getDatabase, ref, set, update, } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCHFj9oABXSxiWm7u1yPOvyhXQw_FRp5Lw",
    authDomain: "project-plato-eb365.firebaseapp.com",
    databaseURL: "https://project-plato-eb365-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-plato-eb365",
    storageBucket: "project-plato-eb365.appspot.com",
    messagingSenderId: "753582080609",
    appId: "1:753582080609:web:98b2db93e63a500a56e020",
    measurementId: "G-KHJXGLJM4Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const database = getDatabase(app);
const db = getFirestore(app);

// Contains test data for 3 quizes
const quizzes = [
    {
        QuizUID: '1',
        QuizGroupId: '8001',
        Title: 'Introduction to Programming Quiz',
        Description: 'A quiz about the basics of programming',
        Banner: 'https://example.com/programming-banner.jpg',
        embedded_text: '<p>This quiz covers the basics of programming, including variables, data types, and control flow.</p>',
        Difficulty: 'Beginner',
        Created_at: firebase.firestore.Timestamp.fromDate(new Date()),
        Modified_at: firebase.firestore.Timestamp.fromDate(new Date()),
        GroupID_Subject: '1001',
        Questions: [
            {
                QuestionID: '1',
                Text: 'What is a variable in programming?',
                Options: ['A container for data', 'A type of data', 'A function', 'A loop'],
                CorrectOption: 0,
                Type: 'Multiple Choice',
                Hint: 'Think about how you store and manipulate data in a program',
                ScoreWithoutHints: 0,
                ScoreWithHints: 0
            },
            {
                QuestionID: '2',
                Text: 'Which of the following is a data type in JavaScript?',
                Options: ['Number', 'String', 'Boolean', 'All of the above'],
                CorrectOption: 3,
                Type: 'Multiple Choice',
                Hint: 'Consider the different types of data that can be used in a program',
                ScoreWithoutHints: 0,
                ScoreWithHints: 0
            },
            {
                QuestionID: '3',
                Text: 'What is a conditional statement in programming?',
                Options: ['A statement that executes code based on a condition', 'A statement that loops through code', 'A statement that assigns a value to a variable', 'A statement that defines a function'],
                CorrectOption: 0,
                Type: 'Multiple Choice',
                Hint: 'Think about how you make decisions in a program',
                ScoreWithoutHints: 0,
                ScoreWithHints: 0
            }
        ]
    },
    {
        QuizUID: '2',
        QuizGroupId: '8002',
        Title: 'Intermediate Programming Quiz',
        Description: 'A quiz about intermediate programming concepts',
        Banner: 'https://example.com/programming-banner.jpg',
        embedded_text: '<p>This quiz covers intermediate programming concepts, including functions, arrays, and objects.</p>',
        Difficulty: 'Intermediate',
        Created_at: firebase.firestore.Timestamp.fromDate(new Date()),
        Modified_at: firebase.firestore.Timestamp.fromDate(new Date()),
        GroupID_Subject: '1002',
        Questions: [
            {
                QuestionID: '1',
                Text: 'What is a function in programming?',
                Options: ['A block of code that performs a specific task', 'A data type', 'A variable', 'A loop'],
                CorrectOption: 0,
                Type: 'Multiple Choice',
                Hint: 'Think about how you can reuse code in a program',
                ScoreWithoutHints: 0,
                ScoreWithHints: 0
            },
            {
                QuestionID: '2',
                Text: 'What is an array in programming?',
                Options: ['A collection of values', 'A data type', 'A function', 'A loop'],
                CorrectOption: 0,
                Type: 'Multiple Choice',
                Hint: 'Think about how you can store and manipulate multiple values in a program',
                ScoreWithoutHints: 0,
                ScoreWithHints: 0
            },
            {
                QuestionID: '3',
                Text: 'What is an object in programming?',
                Options: ['A collection of properties and methods', 'Adata type', 'A function', 'A loop'],
                CorrectOption: 0,
                Type: 'Multiple Choice',
                Hint: 'Think about how you can represent complex data structures in a program',
                ScoreWithoutHints: 0,
                ScoreWithHints: 0
            }
        ]
    }
];

// Temporary function for uploading a quiz filled with test data and sends it to Firestore
async function updateQuizzes() {
    try {
        // Get a reference to the quizzes document
        const docRef = db.collection('quizzes').doc('main');

        // Try to get the document
        const doc = await docRef.get();

        // If the document doesn't exist, create it
        if (!doc.exists) {
            console.log('Creating new quizzes document...');
            await docRef.set({ quizzes });
            console.log('Quizzes document created!');
        } else {
            console.log('Updating quizzes document...');
            await docRef.update({ quizzes });
            console.log('Quizzes document updated!');
        }
    } catch (error) {
        console.error('Error updating quizzes document:', error);
    }
}

// Call the updateQuizzes function
updateQuizzes();



// Cals upon firestore to find a quiz by id
async function getQuizById(quizId) {
    const quizDocRef = doc(db, "quizzes", quizId);
    const quizDocSnap = await getDoc(quizDocRef);

    if (quizDocSnap.exists()) {
        return quizDocSnap.data();
    } else {
        console.log(`Quiz with ID ${quizId} not found`);
        return null;
    }
}

/* Binary Search Tree logic related to searching relevant quiz data*/

class Node {
    constructor(data, left = null, right = null) {
        this.data = data;
        this.left = left;
        this.right = right;
    }
}

class BST {
    constructor() {
        this.root = null;
    }
    add(data) {
        const node = this.root;
        if (node === null) {
            this.root = new Node(data);
            return;
        } else {
            const searchTree = function (node) {
                if (data < node.data) {
                    if (node.left === null) {
                        node.left = new Node(data);
                        return;
                    } else if (node.left !== null) {
                        return searchTree(node.left);
                    }
                } else if (data > node.data) {
                    if (node.right === null) {
                        node.right = new Node(data);
                        return;
                    } else if (node.right !== null) {
                        return searchTree(node.right);
                    }
                } else {
                    return null;
                }
            };
            return searchTree(node);
        }
    }

    generate() {
        for (let i = 0; i < 4096; i++) {
            this.insert(i);
        }
    }

    // findMin() {
    //     let current = this.root;
    //     while (current.left !== null) {
    //         current = current.left;
    //     }
    //     return current.data;
    // }
    // findMax() {
    //     let current = this.root;
    //     while (current.right !== null) {
    //         current = current.right;
    //     }
    //     return current.data;
    // }
    find(data) {
        let current = this.root;
        while (current.data !== data) {
            if (data < current.data) {
                current = current.left;
            } else {
                current = current.right;
            }
            if (current === null) {
                return null;
            }
        }
        return current;
    }
    isPresent(data) {
        let current = this.root;
        while (current) {
            if (data === current.data) {
                return true;
            }
            if (data < current.data) {
                current = current.left;
            } else {
                current = current.right;
            }
        }
        return false;
    }
    // remove(data) {
    //     const removeNode = function (node, data) {
    //         if (node == null) {
    //             return null;
    //         }
    //         if (data == node.data) {
    //             // node has no children 
    //             if (node.left == null && node.right == null) {
    //                 return null;
    //             }
    //             // node has no left child 
    //             if (node.left == null) {
    //                 return node.right;
    //             }
    //             // node has no right child 
    //             if (node.right == null) {
    //                 return node.left;
    //             }
    //             // node has two children 
    //             var tempNode = node.right;
    //             while (tempNode.left !== null) {
    //                 tempNode = tempNode.left;
    //             }
    //             node.data = tempNode.data;
    //             node.right = removeNode(node.right, tempNode.data);
    //             return node;
    //         } else if (data < node.data) {
    //             node.left = removeNode(node.left, data);
    //             return node;
    //         } else {
    //             node.right = removeNode(node.right, data);
    //             return node;
    //         }
    //     }
    //     this.root = removeNode(this.root, data);
    // }
    // isBalanced() {
    //     return (this.findMinHeight() >= this.findMaxHeight() - 1)
    // }
    // findMinHeight(node = this.root) {
    //     if (node == null) {
    //         return -1;
    //     };
    //     let left = this.findMinHeight(node.left);
    //     let right = this.findMinHeight(node.right);
    //     if (left < right) {
    //         return left + 1;
    //     } else {
    //         return right + 1;
    //     };
    // }
    // findMaxHeight(node = this.root) {
    //     if (node == null) {
    //         return -1;
    //     };
    //     let left = this.findMaxHeight(node.left);
    //     let right = this.findMaxHeight(node.right);
    //     if (left > right) {
    //         return left + 1;
    //     } else {
    //         return right + 1;
    //     };
    // }

}

const bst = new BST();
bst.generate();

bst.insert(4);
bst.insert(2);
bst.insert(6);
bst.insert(1);
bst.insert(3);
bst.insert(5);
bst.insert(7);

// test
const quizId = 1;
// const quizNode = bst.search(quizId);

// if (quizNode !== null) {
//     // Use the Firebase Realtime Database or Firestore API to retrieve the quiz data for the node
//     const quizData = // ...

//         // Use the quiz data as needed
//         console.log(quizData);
// } else {
//     console.log(`Quiz with ID ${quizId} not found`);
// }

if (quizData !== null) {
    // Use the Firebase Firestore API to retrieve the quiz data for the node
    const quizData = await getQuizById(quizId);
    console.log(quizData);
} else {
    console.log(`Quiz with ID ${quizId} not found`);
}