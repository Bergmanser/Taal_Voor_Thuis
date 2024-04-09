import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
const db = getFirestore(app);

const quizForm = document.getElementById('quiz-form');
const questionsContainer = document.getElementById('questions');

// This code is responsible for dynamically adding new questions input fields
let questionId = 1;

// This code is responsible for handling the image upload related to the banner image
// const banner = document.getElementById('banner');
// banner.addEventListener('change', (event) => {
//     const file = event.target.files[0];
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = (e) => {
//             const img = document.createElement('img');
//             img.src = e.target.result;
//             document.getElementById('banner-preview').appendChild(img);
//         };
//         reader.readAsDataURL(file);
//     } else {
//         const img = document.createElement('img');
//         img.src = 'MeerDanBijles-Logo.png';
//         document.getElementById('banner-preview').appendChild(img);
//     }
// });

// //Responsible for generating a GroupID for the quiz based on the selected group
// const groupIdSubject = document.getElementById('group-id-subject').value;
// const groupRef = doc(collection(db, 'quizzes'), groupIdSubject);
// getDoc(groupRef).then((doc) => {
//   if (doc.exists) {
//     // Generate the next group ID based on the current number of quizzes
//     const nextGroupId = parseInt(groupIdSubject) + doc.data().nextQuizId;
//     // Update the nextQuizId for the group
//     setDoc(groupRef, { nextQuizId: nextGroupId }, { merge: true });
//     // Set the group ID for the new quiz
//     quizForm.groupIdSubject.value = nextGroupId;
//   } else {
//     setDoc(groupRef, { nextQuizId: 1 });
//     quizForm.groupIdSubject.value = groupIdSubject;
//   }
// });

// Add a question
function addQuestion() {
    const question = document.createElement('div');
    question.id = `question-${questionId}`;
    question.innerHTML = `
    <h2>Question ${questionId}</h2>
    <label for="question-title-${questionId}">Question title</label>
    <input type="text" id="question-title-${questionId}" placeholder="Question text" required />
    <select id="question-type-${questionId}" required>
      <option value="multiple-choice">Multiple Choice</option>
      <option value="true-or-false">True or False</option>
    </select>
    <div id="question-options-${questionId}"></div>
    <button type="button" id="add-option-button-${questionId}">Add Option</button>
    <button type="button" id="select-correct-option-button-${questionId}">Select correct option</button>
    <input type="text" id="question-correct-option-text-${questionId}" placeholder="Correct option text" required>
    <input type="text" id="question-hint-${questionId}" placeholder="Hint" required />
    <button type="button" id="remove-question-button-${questionId}">Remove Question</button>
  `;

    questionsContainer.appendChild(question);

    // Initialize the question
    initializeQuestion(questionId);

    questionId++;
};

// Initialize a question
function initializeQuestion(questionId) {
    const addOptionButton = document.getElementById(`add-option-button-${questionId}`);
    const selectCorrectOptionButton = document.getElementById(`select-correct-option-button-${questionId}`);
    const correctOptionSelect = document.getElementById(`question-correct-option-select-${questionId}`);

    if (addOptionButton) {
        addOptionButton.addEventListener('click', () => {
            addOption(questionId);
            addOptionRemoveButton(questionId);
        });
    }

    if (selectCorrectOptionButton) {
        selectCorrectOptionButton.addEventListener('click', () => {
            selectCorrectOption(questionId, correctOptionSelect);
        });
    }

    // Call addRemoveQuestionButton after the remove-question-button-${questionId} element has been created
    addRemoveQuestionButton(questionId);
};

// Add a remove question button
function addRemoveQuestionButton(questionId) {
    const removeQuestionButton = document.getElementById(`remove-question-button-${questionId}`);
    if (removeQuestionButton) {
        removeQuestionButton.addEventListener('click', () => {
            removeQuestion(questionId);
            questionId--;
        });
    };
};

// Add an option
function addOption(questionId) {
    const question = document.getElementById(`question-${questionId}`);
    const optionsContainer = document.getElementById(`question-options-${questionId}`);

    const option = document.createElement('div');
    option.innerHTML = `
    <input type="text" id="question-option-text-${questionId}-0" placeholder="Option text" required />
    <input type="radio" name="question-option-correct-${questionId}" value="0" required />
  `;

    for (let i = 1; i < 1; i++) {
        option.innerHTML += `
      <input type="text" id="question-option-text-${questionId}-${i}" placeholder="Option text" />
      <input type="radio" name="question-option-correct-${questionId}" value="${i}" />
    `;
    }

    optionsContainer.appendChild(option);

    addOptionRemoveButton(questionId);
};

// Add a remove option button
function addOptionRemoveButton(questionId) {
    const removeOptionButton = document.createElement('button');
    removeOptionButton.textContent = 'Remove Option';
    removeOptionButton.addEventListener('click', () => {
        removeOption(questionId);
    });

    const optionsContainer = document.getElementById(`question-options-${questionId}`);
    optionsContainer.appendChild(removeOptionButton);
};

// Remove an option
function removeOption(questionId) {
    const question = document.getElementById(`question-${questionId}`);
    const optionsContainer = document.getElementById(`question-options-${questionId}`);

    if (optionsContainer.children.length > 1) {
        optionsContainer.removeChild(optionsContainer.lastChild);
    }
};

// Select a correct option
function selectCorrectOption(questionId) {
    // Update the correct option radio input and text field
}

// Remove a question
function removeQuestion(questionId) {
    const question = document.getElementById(`question-${questionId}`);
    questionsContainer.removeChild(question);
}

document.addEventListener('DOMContentLoaded', () => {
    addQuestion();

    // Add an event listener to the "Add Question" button
    document.getElementById('add-question-button').addEventListener('click', () => {
        addQuestion();
    });

    // Add event listeners for the existing questions
    for (let i = 0; i < 2; i++) {
        initializeQuestion(i);
    }
});



// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);

        const quizForm = document.getElementById('quiz-form');

        // This addEventListener is responsible for uploading the quiz data to Firestore
        quizForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('title');
            const groupId = document.getElementById('group-id-subject');
            const banner = document.getElementById('banner');
            const quillContainer = document.getElementById('quill-container');
            const difficulty = document.getElementById('difficulty');

            const titleError = document.getElementById(`title-error`);
            const groupIdError = document.getElementById(`group-id-error`);
            const bannerError = document.getElementById(`banner-error`);
            const quillError = document.getElementById(`quill-error`);
            const difficultyError = document.getElementById(`difficulty-error`);

            if (title.value.trim() === '') {
                titleError.innerText = 'Title is required';
            } else {
                titleError.innerText = '';
            }

            if (groupId.value === '') {
                groupIdError.innerText = 'Group ID is required';
            } else {
                groupIdError.innerText = '';
            }

            if (banner.files.length === 0) {
                bannerError.innerText = 'Banner is required';
            }

            if (quillContainer.innerHTML.trim() === '') {
                quillError.innerText = 'Embedded text is required';
            }

            if (difficulty.value.trim() === '') {
                difficultyError.innerText = 'Difficulty is required';
            }

            if (
                title.value.trim() !== '' &&
                groupId.value !== '' &&
                banner.files.length > 0 &&
                quillContainer.innerHTML.trim() !== '' &&
                difficulty.value.trim() !== ''
            ) {
                // Collect question data
                const questionsData = [];
                for (const questionId of questionsAndIds) {
                    const correctOptionSelected = document.querySelector(`input[name="question-option-correct-${questionId}"]:checked`);
                    if (!correctOptionSelected) {
                        // Display an error message to the user
                        document.getElementById(`select-correct-option-button-${questionId}`).setCustomValidity('Please select a correct option for this question');
                        document.getElementById(`select-correct-option-button-${questionId}`).reportValidity();
                        return;
                    }

                    const questionTitle = document.getElementById(`question-title-${questionId}`).value;
                    const questionType = document.getElementById(`question-type-${questionId}`).value;
                    const correctOptionText = document.getElementById(`question-correct-option-text-${questionId}`).value;
                    const correctOptionIndex = Array.from(document.getElementsByName(`question-option-correct-${questionId}`)).findIndex(option => option.checked);

                    const questionOptions = [];
                    for (let i = 0; i < 3; i++) {
                        const optionInput = document.getElementById(`question-option-text-${questionId}-${i}`);
                        const isCorrect = i === correctOptionIndex;
                        if (optionInput) {
                            questionOptions.push({
                                text: optionInput.value,
                                isCorrect
                            });
                        }
                    }

                    questionsData.push({
                        title: questionTitle,
                        type: questionType,
                        options: questionOptions,
                        correctOption: {
                            text: correctOptionText,
                            index: correctOptionIndex
                        }
                    });
                };

                const creationDate = new Date();
                const modificationDate = new Date();

                // Update the modification date before saving the quiz to Firestore
                modificationDate.setSeconds(modificationDate.getSeconds() + 1); newQuiz.modificationDate = modificationDate;

                // Create a new quiz object
                const newQuiz = {
                    title: title.value,
                    groupId: groupId.value,
                    banner: banner.files[0],
                    quillContainer: quillContainer.innerHTML,
                    difficulty: difficulty.value,
                    questions: questionsData,
                    creationDate,
                    modificationDate
                };

                // Save the new quiz to Firestore
                saveQuizToFirestore(newQuiz);

            } else {
                alert('Please fill out all required fields.');
            }
        });

    } else {
        // Redirect the user to the 'login_parent_tvt.html' page if the user is not logged in
        window.location.href = "login_parent_tvt.html";
    }
});

async function saveQuizToFirestore(quiz) {
    // Get a reference to the Firestore collection
    const quizCollection = firebase.firestore().collection('quizzes');

    // Create a new quiz document in the Firestore collection
    const quizDocument = await quizCollection.add({
        title: quiz.title,
        description: quiz.description,
        questions: Object.values(quiz.questions).map(question => ({
            id: question.id,
            text: question.text,
            correctOption: question.correctOption,
            options: question.options.map(option => ({
                id: option.id,
                text: option.text,
            })),
        })),
    });

    // Return the Firestore document ID
    return quizDocument.id;
};
