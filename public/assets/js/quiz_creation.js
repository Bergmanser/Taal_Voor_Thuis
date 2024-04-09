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

// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);

    } else {
        // Redirect the user to the 'login_parent_tvt.html' page if the user is not logged in
        window.location.href = "login_parent_tvt.html";
    }
});

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
        <input type="text" id="question-title-${questionId}" placeholder="Question ${questionId} text" required />
        <div id="question-options-${questionId}"></div>
        <select id="correct-option-dropdown-${questionId}">
            <option value="" disabled selected>Select correct option</option>
        </select>
        <button type="button" id="add-option-button-${questionId}">Add Option</button>
        <input type="text" id="question-hint-${questionId}" placeholder="The hint for ${questionId}" required />
        <button type="button" id="remove-question-button-${questionId}">Remove Question</button>
    `;

    questionsContainer.appendChild(question);

    // Initialize the question only if it's not the first one
    if (questionId !== 1) {
        initializeQuestion(questionId);
    }

    console.log(`Question ${questionId} added.`);

    questionId++;
};


// Initialize a question
function initializeQuestion(questionId) {
    console.log(`Initializing question ${questionId}`);
    const addOptionButton = document.getElementById(`add-option-button-${questionId}`);
    if (addOptionButton) {
        addOptionButton.addEventListener('click', () => {
            addOption(questionId);
        });
    }

    const removeQuestionButton = document.getElementById(`remove-question-button-${questionId}`);
    if (removeQuestionButton) {
        removeQuestionButton.addEventListener('click', () => {
            removeQuestion(questionId);
        });
    }
};


// Remove a question
function removeQuestion(questionId) {
    const question = document.getElementById(`question-${questionId}`);
    if (question) {
        questionsContainer.removeChild(question);

        // Update the ID and title of the remaining questions
        for (let i = questionId + 1; i < questionsContainer.children.length + 1; i++) {
            const remainingQuestion = document.getElementById(`question-${i}`);
            if (remainingQuestion) {
                remainingQuestion.id = `question-${i - 1}`;

                // Update the title input
                const titleInput = remainingQuestion.querySelector(`#question-title-${i}`);
                if (titleInput) {
                    titleInput.id = `question-title-${i - 1}`;
                    titleInput.name = `questions[${i - 1}].title`;
                    titleInput.placeholder = `Question ${i - 1} text`;
                    titleInput.value = ""; // Clear the value of the title input
                    console.log(`Updated title input with ID: question-title-${i - 1}`);
                }

                // Update the remove button ID
                const removeButton = remainingQuestion.querySelector(`#remove-question-button-${i}`);
                if (removeButton) {
                    removeButton.id = `remove-question-button-${i - 1}`;
                    console.log(`Updated remove button with ID: remove-question-button-${i - 1}`);
                }
            }
        }

        console.log(`Question ${questionId} removed.`);
    } else {
        console.log(`Question ${questionId} does not exist.`);
    }

    // Log the current IDs of the questions
    console.log("Current IDs of questions:");
    for (let i = 0; i < questionsContainer.children.length; i++) {
        console.log(`Question ${i + 1}: ${questionsContainer.children[i].id}`);
    }
}

// Add an option
function addOption(questionId) {
    const optionsContainer = document.getElementById(`question-options-${questionId}`);

    // Create a section for the option
    const optionSection = document.createElement('div');
    optionSection.classList.add('option-section');

    // Create an input field for the option text
    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.placeholder = 'Option text';
    optionInput.required = true;

    // Create a remove button for the option section
    const removeOptionButton = document.createElement('button');
    removeOptionButton.textContent = 'Remove Option';
    removeOptionButton.addEventListener('click', () => {
        removeOption(optionSection);
    });

    // Append input field and remove button to the option section
    optionSection.appendChild(optionInput);
    optionSection.appendChild(removeOptionButton);

    // Append the option section to the options container
    optionsContainer.appendChild(optionSection);

    // Populate the correct option dropdown
    populateCorrectOptionDropdown(questionId);

    // Initialize the correct option dropdown
    initializeCorrectOptionDropdown(questionId);
};

// Populate the correct option dropdown
function populateCorrectOptionDropdown(questionId) {
    const correctOptionDropdown = document.getElementById(`correct-option-dropdown-${questionId}`);
    if (correctOptionDropdown) {
        const optionsContainer = document.getElementById(`question-options-${questionId}`);
        correctOptionDropdown.innerHTML = `
            <option value="" disabled selected>Select correct option</option>
        `;
        optionsContainer.querySelectorAll('input[type="text"]').forEach((input, index) => {
            const optionText = input.value.trim();
            if (optionText) {
                const option = document.createElement('option');
                option.text = optionText;
                option.value = index;
                correctOptionDropdown.appendChild(option);
            }
        });
    }
}

// Initialize the correct option dropdown
function initializeCorrectOptionDropdown(questionId) {
    populateCorrectOptionDropdown(questionId);

    const optionsContainer = document.getElementById(`question-options-${questionId}`);
    if (optionsContainer) {
        optionsContainer.addEventListener('input', () => {
            populateCorrectOptionDropdown(questionId);
        });
    }

    const correctOptionDropdown = document.getElementById(`correct-option-dropdown-${questionId}`);
    if (correctOptionDropdown) {
        correctOptionDropdown.addEventListener('change', () => {
            const selectedOptionIndex = correctOptionDropdown.value;
            console.log(`Question ${questionId}: Correct option selected: ${selectedOptionIndex}`);
            // Save the selected option as the correct option for the question
        });
    }
}

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

    // Check if all option fields are filled
    const optionInputs = document.querySelectorAll('input[type="text"][id^="question-option-text"]');
    let allOptionsFilled = true;
    optionInputs.forEach(input => {
        if (input.value.trim() === '') {
            allOptionsFilled = false;
        }
    });

    if (!allOptionsFilled) {
        alert('Please fill out all option fields.');
        return;
    }

    // Check if all question titles are filled
    const questionTitleInputs = document.querySelectorAll('input[type="text"][id^="question-title"]');
    let allTitlesFilled = true;
    questionTitleInputs.forEach(input => {
        if (input.value.trim() === '') {
            allTitlesFilled = false;
        }
    });

    if (!allTitlesFilled) {
        alert('Please fill out all question titles.');
        return;
    }

    // Check if a correct option is selected for each question
    const allCorrectOptionsSelected = Array.from(document.querySelectorAll('[id^="question-option-correct-"]')).every(correctOption => correctOption.checked);
    if (!allCorrectOptionsSelected) {
        alert('Please select a correct option for each question.');
        return;
    }

    // Collect question data
    const questionsData = [];
    for (const questionId of questionsAndIds) {
        // Extract hint field value
        const hint = document.getElementById(`question-hint-${questionId}`).value;

        // Extract question title
        const questionTitle = document.getElementById(`question-title-${questionId}`).value;

        // Extract question type
        const questionType = document.getElementById(`question-type-${questionId}`).value;

        // Extract correct option text
        const correctOptionText = document.getElementById(`question-correct-option-text-${questionId}`).value;

        // Extract options
        const options = [];
        const optionInputs = document.querySelectorAll(`#question-options-${questionId} input[type="text"]`);
        optionInputs.forEach((input, index) => {
            options.push({
                text: input.value,
                isCorrect: index === parseInt(correctOptionText)  // Assuming correctOptionText contains the index of the correct option
            });
        });

        // Construct question data object
        const questionData = {
            title: questionTitle,
            type: questionType,
            options: options,
            correctOption: {
                text: correctOptionText,
                index: parseInt(correctOptionText)  // Assuming correctOptionText contains the index of the correct option
            },
            hint: hint
        };

        // Push question data to the array
        questionsData.push(questionData);
    }

    if (
        title.value.trim() !== '' &&
        groupId.value !== '' &&
        banner.files.length > 0 &&
        quillContainer.innerHTML.trim() !== '' &&
        difficulty.value.trim() !== ''
    ) {
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
