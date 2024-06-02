import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// Main Config for Project Plato
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
const storage = getStorage(app);

const quizForm = document.getElementById('quiz-form');
const questionsContainer = document.getElementById('questions');
let questionId = 1;

function saveFormData() {
    const formData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        groupId: document.getElementById('group-id-subject').value,
        banner: document.getElementById('banner').value,
        quizType: document.getElementById('quiz-type').value,
        questions: Array.from(document.querySelectorAll('.question')).map((question) => {
            const questionId = question.id.split('-')[1];
            const typeElement = document.getElementById(`question-type-${questionId}`);
            return {
                id: questionId,
                title: document.getElementById(`question-title-${questionId}`).value,
                options: Array.from(document.querySelectorAll(`#question-options-${questionId} input[type="text"]`)).map(input => input.value),
                hint: document.getElementById(`question-hint-${questionId}`).value,
                type: typeElement ? typeElement.value : 'multiple-choice'
            };
        }),
        embeddedText: document.getElementById('preview').innerHTML || '' // Save the embedded text HTML or an empty string
    };
    localStorage.setItem('quizFormData', JSON.stringify(formData));
}

function loadFormData() {
    const formData = JSON.parse(localStorage.getItem('quizFormData'));
    if (formData) {
        document.getElementById('title').value = formData.title;
        document.getElementById('description').value = formData.description;
        document.getElementById('group-id-subject').value = formData.groupId;
        document.getElementById('banner').value = formData.banner;
        document.getElementById('quiz-type').value = formData.quizType;
        formData.questions.forEach((question, index) => {
            addQuestion(question.type);
            document.getElementById(`question-title-${index + 1}`).value = question.title;
            question.options.forEach(option => addOption(index + 1, option));
            document.getElementById(`question-hint-${index + 1}`).value = question.hint;
        });
        if (document.getElementById('preview')) {
            document.getElementById('preview').innerHTML = formData.embeddedText || ''; // Load the embedded text HTML or an empty string
        }
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);
    } else {
        window.location.href = "login_parent_tvt.html";
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadFormData();
    document.getElementById('add-question-button').addEventListener('click', () => {
        const questionType = document.getElementById('question-type').value;
        addQuestion(questionType);
        saveFormData();
    });

    document.querySelectorAll('#embedded-text-creation button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            console.log(`Button ${button.textContent} clicked`);
        });
    });
});

const banner = document.getElementById('banner');
const bannerPreview = document.createElement('div');
bannerPreview.id = 'banner-preview';
document.body.appendChild(bannerPreview);
const quizCardPreview = document.createElement('div');
quizCardPreview.id = 'quiz-card-preview';
banner.insertAdjacentElement('afterend', quizCardPreview);

banner.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            const quizCard = createQuizCard(e.target.result);
            quizCardPreview.innerHTML = '';
            quizCardPreview.appendChild(quizCard);
        };
        reader.readAsDataURL(file);
    } else {
        quizCardPreview.innerHTML = '';
        const quizCard = createQuizCard('MeerDanBijles-Logo.png');
        quizCardPreview.appendChild(quizCard);
    }
});

function addQuestion(type) {
    const question = document.createElement('div');
    question.className = 'question';
    question.id = `question-${questionId}`;
    question.innerHTML = `
        <h2>Question ${questionId}</h2>
        <label for="question-title-${questionId}">Question title</label>
        <input type="text" id="question-title-${questionId}" placeholder="Question ${questionId} text" required />
        <div class="question-options-container">
            <select id="question-type-${questionId}" class="form-control">
                <option value="multiple-choice" ${type === 'multiple-choice' ? 'selected' : ''}>Multiple Choice</option>
                <option value="true-false" ${type === 'true-false' ? 'selected' : ''}>True/False</option>
                <option value="short-answer" ${type === 'short-answer' ? 'selected' : ''}>Short Answer</option>
            </select>
            <div id="question-options-${questionId}"></div>
            ${type === 'multiple-choice' ? '<button type="button" id="add-option-button-${questionId}">Add Option</button>' : ''}
            <select id="correct-option-dropdown-${questionId}">
                <option value="" disabled selected>Select correct option</option>
            </select>
        </div>
        <input type="text" id="question-hint-${questionId}" placeholder="The hint for ${questionId}" required />
        <button type="button" id="remove-question-button-${questionId}">Remove Question</button>
    `;
    questionsContainer.appendChild(question);
    initializeQuestion(questionId, type);
    questionId++;
    question.scrollIntoView({ behavior: 'smooth' });
}

function initializeQuestion(questionId, type) {
    if (type === 'multiple-choice') {
        addOption(questionId); // Automatically add the first option
        const addOptionButton = document.getElementById(`add-option-button-${questionId}`);
        if (addOptionButton) {
            addOptionButton.addEventListener('click', () => {
                addOption(questionId);
                saveFormData();
            });
        }
    }
    const removeQuestionButton = document.getElementById(`remove-question-button-${questionId}`);
    removeQuestionButton.addEventListener('click', () => {
        removeQuestion(questionId);
        saveFormData();
    });
    initializeCorrectOptionDropdown(questionId);
}

function updateQuestionIds() {
    questionId = 1; // Reset questionId to 1
    Array.from(questionsContainer.children).forEach((question) => {
        question.id = `question-${questionId}`;
        question.querySelector('h2').innerText = `Question ${questionId}`;

        const titleInput = question.querySelector(`input[id^="question-title-"]`);
        if (titleInput) {
            titleInput.id = `question-title-${questionId}`;
            titleInput.name = `questions[${questionId}].title`;
            titleInput.placeholder = `Question ${questionId} text`;
        }

        const optionsContainer = question.querySelector(`div[id^="question-options-"]`);
        if (optionsContainer) {
            optionsContainer.id = `question-options-${questionId}`;
        }

        const hintInput = question.querySelector(`input[id^="question-hint-"]`);
        if (hintInput) {
            hintInput.id = `question-hint-${questionId}`;
            hintInput.placeholder = `The hint for ${questionId}`;
        }

        const removeButton = question.querySelector(`button[id^="remove-question-button-"]`);
        if (removeButton) {
            removeButton.id = `remove-question-button-${questionId}`;
        }

        const addOptionButton = question.querySelector(`button[id^="add-option-button-"]`);
        if (addOptionButton) {
            addOptionButton.id = `add-option-button-${questionId}`;
        }

        const correctOptionDropdown = question.querySelector(`select[id^="correct-option-dropdown-"]`);
        if (correctOptionDropdown) {
            correctOptionDropdown.id = `correct-option-dropdown-${questionId}`;
        }

        questionId++;
    });
}

function removeQuestion(questionId) {
    const question = document.getElementById(`question-${questionId}`);
    if (question) {
        questionsContainer.removeChild(question);
        updateQuestionIds();
    }
}

function addOption(questionId, optionText = '') {
    const optionsContainer = document.getElementById(`question-options-${questionId}`);
    const optionSection = document.createElement('div');
    optionSection.classList.add('option-section');
    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.placeholder = 'Option text';
    optionInput.value = optionText;
    optionInput.required = true;
    optionInput.addEventListener('input', (event) => {
        event.stopPropagation();
        saveFormData();
    });
    const removeOptionButton = document.createElement('button');
    removeOptionButton.textContent = 'Remove Option';
    removeOptionButton.addEventListener('click', (event) => {
        removeOption(event, questionId);
        saveFormData();
    });
    optionSection.appendChild(optionInput);
    optionSection.appendChild(removeOptionButton);
    optionsContainer.appendChild(optionSection);
    populateCorrectOptionDropdown(questionId);
}

function removeOption(event, questionId) {
    const optionSection = event.target.parentNode;
    const optionsContainer = optionSection.parentNode;
    optionsContainer.removeChild(optionSection);
    populateCorrectOptionDropdown(questionId);
    saveFormData();
}

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

function initializeCorrectOptionDropdown(questionId) {
    const optionsContainer = document.getElementById(`question-options-${questionId}`);
    if (optionsContainer) {
        optionsContainer.addEventListener('input', (event) => {
            if (event.target.tagName.toLowerCase() === 'input' && event.key !== 'Enter') {
                populateCorrectOptionDropdown(questionId);
                saveFormData();
            }
        });
    }
    const correctOptionDropdown = document.getElementById(`correct-option-dropdown-${questionId}`);
    if (correctOptionDropdown) {
        correctOptionDropdown.addEventListener('change', () => {
            const selectedOptionIndex = correctOptionDropdown.value;
            console.log(`Question ${questionId}: Correct option selected: ${selectedOptionIndex}`);
            saveFormData();
        });
    }
}

const title = document.getElementById('title');
const titleError = document.getElementById('title-error');
const description = document.getElementById('description');
const descriptionError = document.getElementById('description-error');
const groupId = document.getElementById('group-id-subject');
const groupIdError = document.getElementById('group-id-error');
const bannerError = document.getElementById('banner-error');
const quizType = document.getElementById('quiz-type');
const quizTypeError = document.getElementById('quiz-type-error');

quizForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formValid = validateForm();
    if (formValid) {
        const confirmUpload = confirm('Are you sure you want to upload this quiz? You can edit this quiz later through a different interface.');
        if (confirmUpload) {
            try {
                const newQuiz = await createQuizFromForm();
                const quizId = await saveQuizToFirestore(newQuiz);
                resetForm();
                localStorage.removeItem('quizFormData'); // Clear local storage after successful upload
                localStorage.removeItem('sectionOrder'); // Clear embedded text section order
                localStorage.removeItem('sectionContent'); // Clear embedded text section content
                alert(`Quiz uploaded successfully! Quiz ID: ${quizId}`);
                window.location.href = ''; // Add the redirect link here
            } catch (error) {
                alert('Upload failed. Please contact the ICT department if the issue persists.');
            }
        }
    }
});

function validateForm() {
    resetErrorMessages();
    const titleValid = validateTitle();
    const descriptionValid = validateDescription(description.value);
    const groupIdValid = validateGroupId();
    const bannerValid = validateBanner();
    const quizTypeValid = validateQuizType();
    return titleValid && descriptionValid && groupIdValid && bannerValid && quizTypeValid;
}

function resetErrorMessages() {
    titleError.innerText = '';
    descriptionError.innerText = '';
    groupIdError.innerText = '';
    bannerError.innerText = '';
    quizTypeError.innerText = '';
}

function validateTitle() {
    const titleValue = title.value.trim();
    if (titleValue === '') {
        titleError.innerText = 'Title is required';
        return false;
    }
    return true;
}

function validateDescription(description) {
    const wordCount = description.split(' ').length;
    if (wordCount > 80) {
        descriptionError.innerText = 'Description must not exceed 80 words';
        return false;
    }
    return true;
}

function validateGroupId() {
    const groupIdValue = groupId.value.trim();
    if (groupIdValue === '') {
        groupIdError.innerText = 'Group ID is required';
        return false;
    }
    return true;
}

function validateBanner() {
    const bannerFile = banner.files[0];
    if (!bannerFile) {
        bannerError.innerText = 'Banner image is required';
        return false;
    }
    return true;
}

function validateQuizType() {
    const quizTypeValue = quizType.value.trim();
    if (quizTypeValue === '') {
        quizTypeError.innerText = 'Quiz type is required';
        return false;
    }
    return true;
}

async function createQuizFromForm() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const groupId = document.getElementById('group-id-subject').value.trim();
    const banner = document.getElementById('banner').files[0];
    const quizType = document.getElementById('quiz-type').value;
    const questions = Array.from(document.querySelectorAll('.question')).map((question) => {
        const questionId = question.id.split('-')[1];
        const questionTitle = document.getElementById(`question-title-${questionId}`).value.trim();
        const options = Array.from(document.querySelectorAll(`#question-options-${questionId} input[type="text"]`)).map(input => input.value.trim()).filter(text => text !== '');
        const correctOptionIndex = parseInt(document.getElementById(`correct-option-dropdown-${questionId}`).value, 10);
        return {
            QuestionId: questionId,
            Text: questionTitle,
            Options: options,
            CorrectOption: correctOptionIndex,
            Hint: document.getElementById(`question-hint-${questionId}`).value.trim(),
            QuestionType: document.getElementById(`question-type-${questionId}`).value || 'multiple-choice'
        };
    });

    const userEmail = auth.currentUser ? auth.currentUser.email : 'anonymous';
    const quiz = {
        Title: title,
        Description: description,
        QuizGroupId: groupId,
        Banner: banner ? await uploadImage(banner, banner.name) : 'default-banner.png',
        EmbeddedText: document.getElementById('preview').innerHTML || '', // Include the embedded text or an empty string
        Difficulty: 'easy',
        QuizType: quizType,
        Questions: questions,
        Created_at: new Date(),
        Modified_at: new Date(),
        Uploaded_by: userEmail
    };
    return quiz;
}

async function uploadImage(file, filename) {
    const storageRef = ref(storage, `quizzes/${filename}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

function resetForm() {
    title.value = '';
    description.value = '';
    groupId.value = '';
    banner.value = '';
    quizType.value = '';
    questionsContainer.innerHTML = '';
}

async function saveQuizToFirestore(quiz) {
    const quizRef = doc(collection(db, "quizzes"));
    await setDoc(quizRef, quiz);
    return quizRef.id;
}

function createQuizCard(imageSrc) {
    const quizCard = document.createElement('div');
    quizCard.classList.add('card', 'quiz-card');
    quizCard.innerHTML = `
        <img src="${imageSrc}" class="card-img-top" alt="Banner Image">
        <div class="card-body">
            <h5 class="card-title">${title.value || 'Quiz Title'}</h5>
            <p class="card-text">${description.value || 'Quiz Description'}</p>
            <button class="remove-banner-btn">&times;</button>
            <button class="hide-banner-btn">Hide</button>
        </div>
    `;
    quizCard.querySelector('.remove-banner-btn').addEventListener('click', () => {
        banner.value = '';
        quizCardPreview.innerHTML = '';
    });
    quizCard.querySelector('.hide-banner-btn').addEventListener('click', () => {
        quizCard.style.display = 'none';
    });
    return quizCard;
}


// CLear out local storage for the embedded text aswell as the quiz form when uploading the quiz so that they don't imidiatly appear if the user where to immediatly make another quiz.
// There seems to be a bit of a confliciting liver reload cycle with the embeeded text creation being dominant.
// Both sections javascript logics are currently reponsible for live reloading and storing the nescecary object locallu, but since this happens in both instance it seems that the embedded text section might be dominant and changes to the question fiels are not saved when reloading returning them to their previous state before even adding or removing anything.
// the add option button seems to currently be broken because of this asswell since its not really doing what it supossed t anymore, but there is no error happening for this at the moment.

// Add bootstrap to the form elements consistently and to the question fields, addquestion buttton, and submit buttons
// add auto scroll when a new quesrtion is added
// add auto scroll whenever a new text section is added
