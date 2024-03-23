

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

    generate(numNodes = 4096) {
        for (let i = 0; i < numNodes; i++) {
            this.add(i);
        }
    };

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
}



// Creates Binary Search Tree
const bst = new BST();
bst.generate();

bst.add(1024);
bst.add(3072);
bst.add(256);
bst.add(768);
bst.add(2304);
bst.add(767);
bst.add(3);

const node = bst.find(3);

if (node) {
    console.log(`Node with value ${node.value} found!`);
} else {
    console.log(`Node with value 3 not found in the BST.`);
}

// test
// const quizId = 2;
// let quizData = null; // declare quizData here
// const quizNode = bst.find(quizId);

// if (quizNode !== null) {
//   // Use the Firebase Firestore API to retrieve the quiz data for the node
//   getQuizById(quizId).then((quizData) => {
//     console.log(quizData);
//   }).catch((error) => {
//     console.log(`Quiz data for ID ${quizId} not found in Firestore: ${error}`);
//   });
// } else {
//   console.log(`Quiz with ID ${quizId} not found in the BST`);
// }

