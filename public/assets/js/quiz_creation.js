import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { initializeEmbeddedTextCreation, getEmbeddedText } from './embedded_text_creation.js';

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
const googleFontsApiUrl = 'https://www.googleapis.com/webfonts/v1/webfonts?key=YOUR_API_KEY';


const quizForm = document.getElementById('quiz-form');
const questionsContainer = document.getElementById('questions');
let questionId = 1;

function compressData(data) {
    return LZString.compress(JSON.stringify(data));
}

function decompressData(compressedData) {
    try {
        let data = LZString.decompress(compressedData);
        return JSON.parse(data);
    } catch (error) {
        console.error("Error decompressing data:", error);
        return null; // Return null or some default value if decompression fails
    }
}

function saveFormData() {
    const formData = {
        title: document.getElementById('title').value,
        titleColor: document.getElementById('title').style.color,
        titleFont: document.getElementById('title').style.fontFamily,
        description: document.getElementById('description').value,
        groupId: document.getElementById('group-id-subject').value,
        banner: document.getElementById('banner').src || '',
        quizType: document.getElementById('quiz-type').value,
        questions: Array.from(document.querySelectorAll('.question')).map((question) => {
            const questionId = question.id.split('-')[1];
            return {
                id: questionId,
                title: document.getElementById(`question-title-${questionId}`).value,
                options: Array.from(document.querySelectorAll(`#question-options-${questionId} input[type="text"]`)).map(input => input.value),
                hint: document.getElementById(`question-hint-${questionId}`).value,
                correctOptionDescription: document.getElementById(`correct-option-description-${questionId}`).value,
                type: 'multiple-choice'
            };
        }),
        embeddedText: document.getElementById('preview').innerHTML || '' // Save the embedded text HTML or an empty string
    };
    localStorage.setItem('quizFormData', compressData(formData));
}

function loadFormData() {
    const formData = decompressData(localStorage.getItem('quizFormData'));
    if (formData) {
        document.getElementById('title').value = formData.title;
        document.getElementById('title').style.color = formData.titleColor;
        document.getElementById('title').style.fontFamily = formData.titleFont;
        document.getElementById('description').value = formData.description;
        document.getElementById('group-id-subject').value = formData.groupId;
        if (formData.banner) {
            const bannerPreview = document.createElement('img');
            bannerPreview.src = formData.banner;
            bannerPreview.alt = "Banner Image";
            document.getElementById('quiz-card-preview').appendChild(bannerPreview);
        }
        document.getElementById('quiz-type').value = formData.quizType;
        formData.questions.forEach((question, index) => {
            addQuestion(question.type, true); // Pass true to indicate reloading
            document.getElementById(`question-title-${index + 1}`).value = question.title;
            question.options.forEach(option => addOption(index + 1, option));
            document.getElementById(`question-hint-${index + 1}`).value = question.hint;
            document.getElementById(`correct-option-description-${index + 1}`).value = question.correctOptionDescription;
        });
        if (document.getElementById('preview')) {
            document.getElementById('preview').innerHTML = formData.embeddedText || '';
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
    initializeEmbeddedTextCreation(uploadImage); // Initialize embedded text creation with the uploadImage function

    document.getElementById('add-question-button').addEventListener('click', () => {
        const questionType = document.getElementById('question-type').value;
        addQuestion(questionType, false); // pass false for isReload
        saveFormData();
        console.log('Add question button clicked'); // Debugging log
    });

    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Submit button clicked'); // Debugging log
        const formValid = validateForm();
        if (formValid) {
            console.log('Form is valid'); // Debugging log
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
                    console.log('Form submitted successfully'); // Debugging log
                } catch (error) {
                    console.error('Upload failed:', error); // Debugging log
                    alert('Upload failed. Please contact the ICT department if the issue persists.');
                }
            }
        } else {
            console.log('Form is not valid'); // Debugging log
        }
    });

    // Ensure the title color picker element exists
    const titleColorPickerElement = document.getElementById('title-color-picker-container');
    if (titleColorPickerElement) {
        const titleColorPicker = Pickr.create({
            el: '#title-color-picker-container',
            theme: 'nano',
            default: '#000000',
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    hsla: true,
                    hsva: true,
                    cmyk: true,
                    input: true,
                    clear: true,
                    save: true
                }
            }
        });

        titleColorPicker.on('save', (color) => {
            const colorStr = color.toHEXA().toString();
            document.getElementById('title').style.color = colorStr;
            titleColorPicker.hide();
            saveFormData();
        });
    }

    // Create a datalist and input for font selection
    const titleStyleOptionsElement = document.getElementById('title-style-options');
    if (titleStyleOptionsElement) {
        const fontSearchBar = document.createElement('input');
        fontSearchBar.setAttribute('list', 'fonts');
        fontSearchBar.setAttribute('placeholder', 'Search for fonts...');
        fontSearchBar.className = 'form-control mb-2';

        const fontDataList = document.createElement('datalist');
        fontDataList.id = 'fonts';

        titleStyleOptionsElement.appendChild(fontSearchBar);
        titleStyleOptionsElement.appendChild(fontDataList);

        // Add available fonts to the datalist
        const availableFonts = [
            'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
            'Slabo 27px', 'Slabo 13px', 'Raleway', 'PT Sans', 'Merriweather', 'Noto Sans',
            'Nunito', 'Ubuntu', 'Playfair Display', 'Rubik', 'Poppins', 'Inconsolata',
            'Cabin', 'Karla', 'Libre Baskerville', 'Anton', 'Abril Fatface', 'Lobster',
            'Arimo', 'Varela Round', 'Dancing Script', 'Fira Sans', 'Josefin Sans',
            'Quicksand', 'Barlow', 'Exo 2', 'Righteous', 'Pacifico', 'Muli', 'Work Sans',
            'Titillium Web', 'Asap', 'Catamaran', 'Crete Round', 'Alegreya', 'Cinzel',
            'Baloo', 'Bungee', 'Cairo', 'IBM Plex Sans', 'Heebo', 'Red Hat Display',
            'Manrope', 'Saira', 'Space Mono', 'OpenDyslexic', 'Lexend Deca', 'Lexend Tera',
            'Lexend Giga', 'Lexend Mega', 'Lexend Peta', 'Lexend Zetta', 'Lexend Exa',
            'Comic Sans MS', 'Arial', 'Verdana', 'overlock'
        ];

        availableFonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            fontDataList.appendChild(option);
        });

        // Load the selected font
        fontSearchBar.addEventListener('input', (event) => {
            const selectedFont = event.target.value;
            if (availableFonts.includes(selectedFont)) {
                document.getElementById('title').style.fontFamily = selectedFont;
                const link = document.createElement('link');
                link.href = `https://fonts.googleapis.com/css?family=${selectedFont}&display=swap`;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
                saveFormData();
            }
        });
    }
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
            img.alt = "Banner Image";
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

function addQuestion(type, isReload) {
    console.log(`Adding question of type: ${type}, isReload: ${isReload}`); // Debugging log
    const question = document.createElement('div');
    question.className = 'question';
    question.id = `question-${questionId}`;
    question.innerHTML = `
    <h2>Question ${questionId}</h2>
    <label for="question-title-${questionId}">Question title</label>
    <input type="text" id="question-title-${questionId}" class="form-control mb-2" placeholder="Question ${questionId} text" required />
    <label for="question-options-container">Question options:</label>
    <div class="question-options-container">
        <div id="question-options-${questionId}"></div>
        ${type === 'multiple-choice' ? `<button type="button" id="add-option-button-${questionId}" class="btn btn-secondary">Add Option</button>` : ''}
        <select id="correct-option-dropdown-${questionId}" class="form-control mt-2">
            <option value="" disabled selected>Select correct option</option>
        </select>
    </div>
    <label for="question-hint-${questionId}">Question hint:</label>
    <input type="text" id="question-hint-${questionId}" class="form-control mb-2" placeholder="This will be the hint for question ${questionId}" required />
    <label for="correct-option-description-${questionId}">Explain the answer:</label>
    <input type="text" id="correct-option-description-${questionId}" class="form-control mb-2" placeholder="Add the explanation for this questions answer here" required />
    <button type="button" id="remove-question-button-${questionId}" class="btn btn-danger">Remove Question</button>
`;
    questionsContainer.appendChild(question);
    initializeQuestion(questionId, type, isReload);
    questionId++;
    question.scrollIntoView({ behavior: 'smooth' });
}

function initializeQuestion(questionId, type, isReload) {
    console.log(`Initializing question ${questionId}, type: ${type}, isReload: ${isReload}`); // Debugging log
    if (type === 'multiple-choice' && !isReload) {
        addOption(questionId); // Automatically add the first option
    }
    const addOptionButton = document.getElementById(`add-option-button-${questionId}`);
    if (addOptionButton) {
        addOptionButton.addEventListener('click', () => {
            addOption(questionId);
            saveFormData();
            console.log(`Option added to Question ${questionId}`); // Debugging log
        });
    } else {
        console.error(`Add option button not found for question ${questionId}`);
    }


    const removeQuestionButton = document.getElementById(`remove-question-button-${questionId}`);
    removeQuestionButton.addEventListener('click', () => {
        removeQuestion(questionId);
        saveFormData();
    });
    initializeCorrectOptionDropdown(questionId);
}

function updateQuestionIds() {
    questionId = 1;
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
            hintInput.placeholder = `This will be the hint for question ${questionId}`;
        }

        const correctOptionDescriptionInput = question.querySelector(`input[id^="correct-option-description-"]`);
        if (correctOptionDescriptionInput) {
            correctOptionDescriptionInput.id = `correct-option-description-${questionId}`;
            correctOptionDescriptionInput.placeholder = `Add the explanation for this questions answer here`;
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
    console.log(`Removing question ${questionId}`); // Debugging log
    const question = document.getElementById(`question-${questionId}`);
    if (question) {
        questionsContainer.removeChild(question);
        updateQuestionIds();
    }
}

function addOption(questionId, optionText = '') {
    console.log(`Adding option to question ${questionId}, optionText: ${optionText}`); // Debugging log

    // Check if the question container exists
    const optionsContainer = document.getElementById(`question-options-${questionId}`);
    if (!optionsContainer) {
        console.error(`Options container not found for question ${questionId}`);
        return;
    }

    const optionSection = document.createElement('div');
    optionSection.classList.add('option-section', 'mb-2');

    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.classList.add('form-control', 'mb-2');
    optionInput.placeholder = 'Option text';
    optionInput.value = optionText;
    optionInput.required = true;
    optionInput.addEventListener('input', (event) => {
        event.stopPropagation();
        saveFormData();
    });

    const removeOptionButton = document.createElement('button');
    removeOptionButton.textContent = 'Remove Option';
    removeOptionButton.classList.add('btn', 'btn-danger');
    removeOptionButton.addEventListener('click', (event) => {
        removeOption(event, questionId);
        saveFormData();
    });

    optionSection.appendChild(optionInput);
    optionSection.appendChild(removeOptionButton);
    optionsContainer.appendChild(optionSection);

    populateCorrectOptionDropdown(questionId);
    console.log(`Option added to question ${questionId}`);
}

function removeOption(event, questionId) {
    console.log(`Removing option from question ${questionId}`); // Debugging log
    const optionSection = event.target.parentNode;
    const optionsContainer = optionSection.parentNode;
    optionsContainer.removeChild(optionSection);
    populateCorrectOptionDropdown(questionId);
    saveFormData();
}


function populateCorrectOptionDropdown(questionId) {
    console.log(`Populating correct option dropdown for question ${questionId}`); // Debugging log
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
    console.log(`Initializing correct option dropdown for question ${questionId}`); // Debugging log
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

function validateForm() {
    resetErrorMessages();
    const titleValid = validateTitle();
    const descriptionValid = validateDescription(description.value);
    const groupIdValid = validateGroupId();
    const bannerValid = validateBanner();
    const quizTypeValid = validateQuizType();
    const formValid = titleValid && descriptionValid && groupIdValid && bannerValid && quizTypeValid;

    if (!formValid) {
        if (!titleValid) document.getElementById('title').scrollIntoView();
        else if (!descriptionValid) document.getElementById('description').scrollIntoView();
        else if (!groupIdValid) document.getElementById('group-id-subject').scrollIntoView();
        else if (!bannerValid) document.getElementById('banner').scrollIntoView();
        else if (!quizTypeValid) document.getElementById('quiz-type').scrollIntoView();
    }

    return formValid;
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
            CorrectOptionDescription: document.getElementById(`correct-option-description-${questionId}`).value.trim(),
            QuestionType: 'multiple-choice'
        };
    });

    const userEmail = auth.currentUser ? auth.currentUser.email : 'anonymous';
    const quiz = {
        Title: title,
        Description: description,
        QuizGroupId: groupId,
        Banner: banner ? await uploadImage(banner, banner.name) : 'default-banner.png',
        EmbeddedText: getEmbeddedText(), // Use the function to get embedded text
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
            <button class="remove-banner-btn btn btn-danger">&times;</button>
            <button class="hide-banner-btn btn btn-secondary">Hide</button>
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

document.addEventListener('embeddedTextChange', () => {
    saveFormData();
});
