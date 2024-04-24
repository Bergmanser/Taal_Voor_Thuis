import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// import { embeddedTextCreation } from '../js/embedded_text_creation.js';

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


// This code is responsible for handling the image upload related to the banner image (preview)
const banner = document.getElementById('banner');

// Create the banner preview and quiz card preview elements
const bannerPreview = document.createElement('div');
bannerPreview.id = 'banner-preview';
document.body.appendChild(bannerPreview);

const quizCardPreview = document.createElement('div');
quizCardPreview.id = 'quiz-card-preview';
document.body.appendChild(quizCardPreview);

banner.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            // bannerPreview.innerHTML = '';
            // bannerPreview.appendChild(img);

            // Create a new quiz card preview element
            const quizCard = document.createElement('div');
            quizCard.classList.add('card');

            // Create a new img element with the card-img-top class
            const cardImg = document.createElement('img');
            cardImg.classList.add('card-img-top');
            cardImg.src = e.target.result;
            quizCard.appendChild(cardImg);

            // Create a new card body element
            const cardBody = document.createElement('div');
            cardBody.classList.add('card-body');

            // Create a new h5 element for the quiz title
            const quizTitle = document.createElement('h5');
            quizTitle.classList.add('card-title');
            quizTitle.textContent = 'Quiz Title';
            cardBody.appendChild(quizTitle);

            // Create a new p element for the quiz description
            const quizDescription = document.createElement('p');
            quizDescription.classList.add('card-text');
            quizDescription.textContent = 'Quiz Description';
            cardBody.appendChild(quizDescription);

            // Append the card body to the quiz card
            quizCard.appendChild(cardBody);

            // Replace the existing quiz card preview with the new one
            quizCardPreview.innerHTML = '';
            quizCardPreview.appendChild(quizCard);
        };
        reader.readAsDataURL(file);
    } else {
        // bannerPreview.innerHTML = '';
        // const img = document.createElement('img');
        // img.src = 'MeerDanBijles-Logo.png';
        // bannerPreview.appendChild(img);

        quizCardPreview.innerHTML = '';
        const quizCard = document.createElement('div');
        quizCard.classList.add('card');
        quizCardPreview.appendChild(quizCard);

        // Create a new img element with the card-img-top class
        const cardImg = document.createElement('img');
        cardImg.classList.add('card-img-top');
        cardImg.src = 'MeerDanBijles-Logo.png';
        quizCard.appendChild(cardImg);

        // Create a new card body element
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        // Create a new h5 element for the quiz title
        const quizTitle = document.createElement('h5');
        quizTitle.classList.add('card-title');
        quizTitle.textContent = 'Quiz Title';
        cardBody.appendChild(quizTitle);

        // Create a new p element for the quiz description
        const quizDescription = document.createElement('p');
        quizDescription.classList.add('card-text');
        quizDescription.textContent = 'Quiz Description';
        cardBody.appendChild(quizDescription);

        // Append the card body to the quiz card
        quizCard.appendChild(cardBody);
    }
});
// Add this function to upload the image to Firestore
async function uploadImage(dataUrl, filename) {
    return new Promise(function (resolve, reject) {
        const blob = dataURLToBlob(dataUrl);
        const storageRef = firebase.storage().ref();
        const task = storageRef.child(`quizzes/${filename}`).put(blob);

        task.on('state_changed', null, reject, function () {
            task.snapshot.ref.getDownloadURL().then(resolve);
        });

        if (file.name === 'default-banner.png') {
            resolve('MeerDanBijles-Logo.png');
        }
    });
}

// Add this function to convert a Data URL to a Blob
function dataURLToBlob(dataURL) {
    const BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) === -1) {
        const parts = dataURL.split(',');
        const contentType = parts[0].split(':')[1];
        const raw = parts[1];

        return new Blob([raw], { type: contentType });
    }

    const parts = dataURL.split(BASE64_MARKER);
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;

    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}


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

    // Add an input event listener to stop propagation
    optionInput.addEventListener('input', (event) => {
        event.stopPropagation();
    });

    // Create a remove button for the option section
    const removeOptionButton = document.createElement('button');
    removeOptionButton.textContent = 'Remove Option';
    removeOptionButton.addEventListener('click', (event) => {
        removeOption(event);
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
}


// Remove an option
function removeOption(event) {
    if (event.target.tagName.toLowerCase() === 'button') {
        const optionsContainer = event.target.parentNode.parentNode;
        optionsContainer.removeChild(event.target.parentNode);
    }
}


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
    const optionsContainer = document.getElementById(`question-options-${questionId}`);
    if (optionsContainer) {
        optionsContainer.addEventListener('input', (event) => {
            if (event.target.tagName.toLowerCase() === 'input' && event.key !== 'Enter') {
                populateCorrectOptionDropdown(questionId);
            }
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

const title = document.getElementById('title');
const titleError = document.getElementById(`title-error`);
const description = document.getElementById('description')
const descriptionError = document.getElementById('description-error')
const groupId = document.getElementById('group-id-subject');
const groupIdError = document.getElementById(`group-id-error`);
const bannerError = document.getElementById(`banner-error`);
const quillContainer = document.getElementById('quill-container');
const quillError = document.getElementById(`quill-error`);
const quizType = document.getElementById('quiz-type');
const quizTypeError = document.getElementById('quiz-type-error')
const difficulty = document.getElementById('difficulty');
const difficultyError = document.getElementById(`difficulty-error`);

// This addEventListener is responsible for uploading the quiz data to Firestore
quizForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show a confirmation popup
    const confirmUpload = confirm('Are you sure you want to upload this quiz? You can edit this quiz later through a different interface.');

    if (confirmUpload) {

        validateForm();
        // Create a new quiz object based on the form data
        const newQuiz = createQuizFromForm();

        // Save the new quiz to Firestore
        const quizId = await saveQuizToFirestore(newQuiz);

        // Clear the form fields
        title.value = '';
        description.value = '';
        groupId.value = '';
        banner.value = '';
        quillContainer.innerHTML = '';
        quizType.value = '';
        difficulty.value = '';

        // Clear the error messages
        titleError.innerText = '';
        descriptionError.innerText = '';
        groupIdError.innerText = '';
        bannerError.innerText = '';
        quillError.innerText = '';
        quizTypeError.innerText = '';
        difficultyError.innerText = '';

        // Clear the questions container
        questionsContainer.innerHTML = '';

        // Display a success message
        alert(`Quiz uploaded successfully! Quiz ID: ${quizId}`);
    } else {
        // Do nothing or redirect the user back to the previous page
    }
});

function validateForm() {
    // Reset the error messages
    titleError.innerText = '';
    description.innerText = '';
    groupIdError.innerText = '';
    bannerError.innerText = '';
    quillError.innerText = '';
    quizTypeError.innerText = '';
    difficultyError.innerText = '';

    // Check for empty or invalid fields
    const titleValid = validateTitle();
    const descriptionValid = validateDescription();
    const groupIdValid = validateGroupId();
    const bannerValid = validateBanner();
    const quillValid = validateQuill();
    const quizTypeValid = validateQuizType();
    const difficultyValid = validateDifficulty();

    return titleValid && descriptionValid && groupIdValid && bannerValid && quillValid && quizTypeValid && difficultyValid;
}

function validateTitle() {
    const title = title.value.trim();
    if (title === '') {
        titleError.innerText = 'Title is required';
        return false;
    }
    return true;
}

function validateDescription(description) {
    // if (!description) {
    //     alert("Beschrijving mag niet leeg zijn.");
    //     return false;
    // }

    const wordCount = description.split(' ').length;
    if (wordCount > 80) {
        alert("Beschrijving mag maximaal 80 woorden bevatten.");
        return false;
    }

    const regex = /[<>[\]{}|`~!@#$%^&*()_+={}:";',./<>?\\]/;
    const allowedSpecialCharacters = ['?', '!', ':', ',', ' ', '.', '/', '@', '&', '%'];
    if (regex.test(description)) {
        alert("Beschrijving bevat ongeldige tekens.");
        return false;
    }

    for (let i = 0; i < description.length; i++) {
        const character = description[i];
        if (regex.test(character) && !allowedSpecialCharacters.includes(character)) {
            alert("Beschrijving bevat ongeldige tekens.");
            return false;
        }
    }
    return true;
}

function validateGroupId() {
    const groupId = groupId.value.trim();
    if (groupId === '') {
        groupIdError.innerText = 'Group ID is required';
        return false;
    }
    return true;
}

// There should always be a banner, if one is not selected by a user then a standard filler image should be used
function validateBanner() {
    const bannerFile = banner.files[0];

    if (!bannerFile) {
        // Set a default banner image if no file is selected
        const defaultBannerImage = 'MeerDanBijles-Logo.png';
        const defaultBannerFile = new File([defaultBannerImage], 'default-banner.png', {
            type: 'image/png',
        });
        banner.files = [defaultBannerFile];
    }

    return true;
}

function validateQuill() {
    const quillText = quillContainer.querySelector('.ql-editor').innerHTML;
    if (quillText === '') {
        quillError.innerText = 'Quiz description is required';
        return false;
    }
    return true;
}

function validateQuizType() {
    const quizType = quizType.value;
    if (quizType === '') {
        quizTypeError.innerText = 'Quiz type is required';
        return false;
    }
    return true;
}

function validateDifficulty() {
    const difficulty = difficulty.value;
    if (difficulty === '') {
        difficultyError.innerText = 'Difficulty is required';
        return false;
    }
    return true;
}

async function createQuizFromForm() {

    const questionsAndIds = Array.from(document.querySelectorAll('.question-row'))
        .map((question, index) => ({ id: question.id.split('-')[1], index }));

    // Declare the variables
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const groupId = document.getElementById('group-id').value.trim();
    const banner = document.getElementById('banner').files[0];
    const quizText = quillContainer.querySelector('.ql-editor').innerHTML;
    const quizType = document.getElementById('quiz-type').value;
    const difficulty = document.getElementById('difficulty').value;

    // Select the questions container
    const questionsContainer = document.getElementById('questions');

    // Check if the questions container exists
    if (!questionsContainer) {
        console.error('Questions container not found');
        return;
    }

    const bannerFile = banner.files[0];
    if (bannerFile.name === 'default-banner.png') {
        // Use the default banner image
        banner = 'MeerDanBijles-Logo.png';
    } else {
        // Upload the user-selected banner image to Firestore
        banner = await uploadImage(bannerFile);
    }
    // Create a new quiz object
    const quiz = {
        title: title,
        quiz_description: description,
        category_description: `A ${difficulty} quiz of type: ${quizType} for ${groupId}`,
        banner: banner,
        quillText: quizText,
        questions: {},
    };

    // Extract the questions and ids data from the form
    questionsAndIds.forEach(({ id, index }) => {
        const questionTitle = document.getElementById(`question-title-${index}`).value.trim();
        const questionType = document.getElementById(`question-type-${index}`).value;
        const correctOptionText = document.getElementById(`question-correct-option-text-${index}`).value;
        const correctOptionIndex = parseInt(correctOptionText, 10);

        const options = Array.from(document.querySelectorAll(`#question-options-${index} input[type="text"]`))
            .map(input => input.value.trim())
            .filter(text => text !== '');

        const questionData = {
            id: index,
            text: questionTitle,
            type: questionType,
            correctOption: {
                text: options[correctOptionIndex],
                index: correctOptionIndex,
            },
            options: options.map((option, optionIndex) => ({
                text: option,
                index: optionIndex,
            })),
        };

        quiz.questions[index] = questionData;
    });

    return quiz;
}

function saveQuizToFirestore(quiz, user) {
    const quizRef = doc(collection(db, "quizzes"));
    return setDoc(quizRef, {
        ...quiz,
        modificationDate: serverTimestamp(),
        uploadDate: serverTimestamp(),
        uploadedBy: user.email
    }).then(() => {
        const quizTypeRef = doc(collection(db, "quiz-types"), quiz.quizType);
        return setDoc(quizTypeRef, { quizId: quizRef.id }).then(() => {
            return quizRef.id;
        });
    });
}