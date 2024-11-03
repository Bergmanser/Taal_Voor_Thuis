import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { initializeEmbeddedTextCreation, getEmbeddedText } from './embedded_text_creation.js';
import { availableFonts } from './fonts.js';
import { auth, db, storage } from "./firebase_config.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";

const quizForm = document.getElementById('quiz-form');
const questionsContainer = document.getElementById('questions');
let questionId = 1;

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);
        redirectUserBasedOnRole([3, 4]);
    } else {
        window.location.href = "login_employee_tvt.html";
    }
});

function compressData(data) {
    return LZString.compress(JSON.stringify(data));
}

function decompressData(compressedData) {
    try {
        let data = LZString.decompress(compressedData);
        return JSON.parse(data);
    } catch (error) {
        console.error("Error decompressing data:", error);
        return null;
    }
}

function saveFormData() {
    const formData = {
        title: document.getElementById('title').value,
        titleColor: document.getElementById('title').style.color,
        titleFont: document.getElementById('title').style.fontFamily,
        description: document.getElementById('description').value,
        groupId: document.getElementById('group-id-subject').value,
        banner: document.getElementById('quiz-card-preview').querySelector('img')?.src || '',
        quizType: document.getElementById('quiz-type').value,
        questions: Array.from(document.querySelectorAll('.question')).map((question) => {
            const questionId = question.id.split('-')[1];
            return {
                id: questionId,
                title: document.getElementById(`question-title-${questionId}`).value,
                options: Array.from(document.querySelectorAll(`#question-options-${questionId} input[type="text"]`)).map(input => input.value),
                hint: document.getElementById(`question-hint-${questionId}`).value,
                correctOptionDescription: document.getElementById(`correct-option-description-${questionId}`).value,
                correctOption: document.getElementById(`correct-option-dropdown-${questionId}`).value,
                type: 'multiple-choice'
            };
        }),
        embeddedText: document.getElementById('preview').innerHTML || '',
        timestamp: new Date().getTime()
    };
    localStorage.setItem('quizFormData', compressData(formData));
}

function clearFormData() {
    localStorage.removeItem('quizFormData');
    localStorage.removeItem('sectionOrder');
    localStorage.removeItem('sectionContent');
    alert("Form data successfully cleared from local storage.");
    location.reload();
}

function checkClearFormData() {
    const formData = decompressData(localStorage.getItem('quizFormData'));
    if (formData) {
        const currentTime = new Date().getTime();
        const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
        if (currentTime - formData.timestamp > twelveHours) {
            clearFormData();
        }
    }
}

document.getElementById('clear-storage-button').addEventListener('click', clearFormData);

function addSection(type, sectionData) {
    let sectionHtml = `
        <div class="section-container">
            <div class="section ${type}-section text-section">
                <div class="section-toolbar">
                    <button class="btn btn-sm btn-secondary bold-btn" title="Bold the selected text">Bold</button>
                    <button class="btn btn-sm btn-secondary color-picker" title="Change the border color">Border Color</button>
                    <button class="btn btn-sm btn-secondary text-color-picker" title="Change the text color">Text Color</button>
                    <button class="btn btn-sm btn-danger remove-section" title="Remove this section">Remove</button>
                    <select class="position-dropdown btn btn-sm btn-secondary" title="Change the section position">
                        <option value="left">Left</option>
                        <option value="middle">Middle</option>
                        <option value="right">Right</option>
                    </select>
                </div>
                <div class="section-content" contenteditable="true" style="border-color: ${sectionData.border_color}; color: ${sectionData.text_color}; font-family: ${sectionData.font};">
                    ${sectionData.text}
                </div>
            </div>
        </div>`;
    $('#preview').append(sectionHtml);
}

function addQuestionFromData(questionData) {
    const question = document.createElement('div');
    question.className = 'question';
    question.id = `question-${questionId}`;
    question.innerHTML = `
        <h2>Question ${questionId}</h2>
        <label for="question-title-${questionId}">Question title</label>
        <input type="text" id="question-title-${questionId}" class="form-control mb-2" placeholder="Question ${questionId} text" value="${questionData.text}" required />
        <label for="question-options-container">Question options:</label>
        <div class="question-options-container">
            <div id="question-options-${questionId}"></div>
            ${questionData.options.map((option, index) => `
                <div class="option-section mb-2">
                    <input type="text" class="form-control mb-2" placeholder="Option text" value="${option}" required />
                    <button type="button" class="btn btn-danger remove-option-button">Remove Option</button>
                </div>
            `).join('')}
            <button type="button" id="add-option-button-${questionId}" class="btn btn-secondary">Add Option</button>
            <select id="correct-option-dropdown-${questionId}" class="form-control mt-2">
                <option value="" disabled selected>Select correct option</option>
                ${questionData.options.map((option, index) => `<option value="${index}">${option}</option>`).join('')}
            </select>
        </div>
        <label for="question-hint-${questionId}">Question hint:</label>
        <input type="text" id="question-hint-${questionId}" class="form-control mb-2" placeholder="This will be the hint for question ${questionId}" required />
        <label for="correct-option-description-${questionId}">Explain the answer:</label>
        <input type="text" id="correct-option-description-${questionId}" class="form-control mb-2" placeholder="Add the explanation for this questions answer here" required />
        <button type="button" id="remove-question-button-${questionId}" class="btn btn-danger">Remove Question</button>
        `;
    questionsContainer.appendChild(question);
    initializeQuestion(questionId, 'multiple-choice', true);
    questionId++;
}

$('#pdf-file').change(function () {
    let file = this.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let typedArray = new Uint8Array(e.target.result);
            pdfjsLib.getDocument(typedArray).promise.then(function (pdf) {
                let totalPages = pdf.numPages;
                let content = [];
                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    pdf.getPage(pageNum).then(function (page) {
                        page.getTextContent().then(function (textContent) {
                            content.push(textContent);
                            if (content.length === totalPages) {
                                processPdfContent(content);
                            }
                        });
                    });
                }
            });
        };
        reader.readAsArrayBuffer(file);
    }
});

function processPdfContent(content) {
    let processedData = {
        title: "",
        quiz_group_id: "",
        sections: [],
        questions: []
    };

    let sectionIndex = 1;
    let isEmbeddedText = true;

    content.forEach((page, pageIndex) => {
        let section = {
            "type": "",
            "text": "",
            "font": "",
            "text_color": "",
            "border_color": "#000000",
            "bold_words": [],
            "section_number": ""
        };

        page.items.forEach((item) => {
            let text = item.str.trim();
            let font = item.fontName;
            let textColor = item.color;

            if (pageIndex === 0 && processedData.title === "") {
                if (text.includes("HOE LEEFDEN DE EERSTE MENSEN OP AARDE")) {
                    processedData.title = text;
                }
                if (text.includes(" - ")) {
                    const parts = text.split(" - ");
                    processedData.quiz_group_id = parts[1].substring(0, 1) + "000";
                }
            } else {
                if (text.match(/^\d+\./)) {
                    isEmbeddedText = false;
                }

                if (isEmbeddedText) {
                    text = text.replace(/HOE LEEFDEN DE EERSTE MENSEN OP AARDE\? - 8013/g, '');
                    text = text.replace(/\d+\/\s?\d+/g, ''); // Remove page numbers with optional space
                    section.text += text + " ";
                    section.font = font;
                    section.text_color = `#${(textColor || [0, 0, 0]).map(c => c.toString(16).padStart(2, '0')).join('')}`;

                    const boldTextMatches = text.match(/<b>(.*?)<\/b>/g);
                    if (boldTextMatches) {
                        boldTextMatches.forEach(match => {
                            section.bold_words.push(match.replace(/<\/?b>/g, ''));
                        });
                    }
                } else {
                    processedData.questions.push(text);
                }
            }
        });

        if (isEmbeddedText && section.text.trim().length > 0) {
            section.type = getSectionType(sectionIndex);
            section.section_number = `section-${sectionIndex}`;
            processedData.sections.push(section);
            sectionIndex++;
        }
    });

    console.log(processedData);
    localStorage.setItem('processedData', JSON.stringify(processedData));
    loadJsonDataFromLocalStorage();
}

function getSectionType(index) {
    if (index % 3 === 1) return 'left';
    if (index % 3 === 2) return 'right';
    return 'middle';
}

function loadJsonDataFromLocalStorage() {
    let data = JSON.parse(localStorage.getItem('processedData'));
    if (data) {
        $('#title').val(data.title);
        $('#group-id-subject').val(data.quiz_group_id);
        $('#description').val("Deze tekst gaat over het volgende onderwerp...");

        data.sections.forEach((section) => {
            addSection(section.type, section);
        });

        data.questions.forEach((question, index) => {
            addQuestionFromData({
                text: question,
                options: [], // Add logic to parse options if available
                hint: "", // Add logic to parse hints if available
                correctOptionDescription: "", // Add logic to parse correct option description if available
                correctOption: "" // Add logic to parse correct option if available
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkClearFormData(); // Add this line
    loadFormData();
    initializeEmbeddedTextCreation(uploadImage);

    document.getElementById('add-question-button').addEventListener('click', () => {
        const questionType = document.getElementById('question-type').value;
        addQuestion(questionType, false);
        saveFormData();
        console.log('Add question button clicked');
    });

    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Submit button clicked');
        const formValid = validateForm();
        if (formValid) {
            console.log('Form is valid');
            const confirmUpload = confirm('Are you sure you want to upload this quiz? You can edit this quiz later through a different interface.');
            if (confirmUpload) {
                try {
                    const newQuiz = await createQuizFromForm();
                    const quizId = await saveQuizToFirestore(newQuiz);
                    resetForm();
                    localStorage.removeItem('quizFormData');
                    localStorage.removeItem('sectionOrder');
                    localStorage.removeItem('sectionContent');
                    alert(`Quiz uploaded successfully! Quiz ID: ${quizId}`);
                    window.location.href = '';
                    console.log('Form submitted successfully');
                } catch (error) {
                    console.error('Upload failed:', error);
                    alert('Upload failed. Please contact the ICT department if the issue persists.');
                }
            }
        } else {
            console.log('Form is not valid');
        }
    });

    initializeTitleCustomization(); // Initialize title customization when the page loads

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

        availableFonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            fontDataList.appendChild(option);
        });

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
            saveFormData();  // Save the banner image immediately after it is loaded
        };
        reader.readAsDataURL(file);
    } else {
        quizCardPreview.innerHTML = '';
        const quizCard = createQuizCard('MeerDanBijles-Logo.png');
        quizCardPreview.appendChild(quizCard);
        saveFormData();
    }
});

function addQuestion(type, isReload) {
    console.log(`Adding question of type: ${type}, isReload: ${isReload}`);
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
    console.log(`Initializing question ${questionId}, type: ${type}, isReload: ${isReload}`);
    if (type === 'multiple-choice' && !isReload) {
        addOption(questionId);
    }
    const addOptionButton = document.getElementById(`add-option-button-${questionId}`);
    if (addOptionButton) {
        addOptionButton.addEventListener('click', () => {
            addOption(questionId);
            saveFormData();
            console.log(`Option added to Question ${questionId}`);
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
    console.log(`Removing question ${questionId}`);
    const question = document.getElementById(`question-${questionId}`);
    if (question) {
        questionsContainer.removeChild(question);
        updateQuestionIds();
    }
}

function addOption(questionId, optionText = '') {
    console.log(`Adding option to question ${questionId}, optionText: ${optionText}`);

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
    console.log(`Removing option from question ${questionId}`);
    const optionSection = event.target.parentNode;
    const optionsContainer = optionSection.parentNode;
    optionsContainer.removeChild(optionSection);
    populateCorrectOptionDropdown(questionId);
    saveFormData();
}

function populateCorrectOptionDropdown(questionId) {
    console.log(`Populating correct option dropdown for question ${questionId}`);
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
    console.log(`Initializing correct option dropdown for question ${questionId}`);
    const optionsContainer = document.getElementById(`question-options-${questionId}`);
    if (optionsContainer) {
        optionsContainer.addEventListener('input', (event) => {
            if (event.target.tagName.toLowerCase() === 'input') {
                populateCorrectOptionDropdown(questionId);
                saveFormData();
            }
        });
    }
    const correctOptionDropdown = document.getElementById(`correct-option-dropdown-${questionId}`);
    if (correctOptionDropdown) {
        correctOptionDropdown.addEventListener('click', () => {
            populateCorrectOptionDropdown(questionId);
        });
        correctOptionDropdown.addEventListener('change', () => {
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
        Banner: banner ? await uploadImage(banner, banner.name) : document.getElementById('quiz-card-preview').querySelector('img')?.src || 'default-banner.png',
        EmbeddedText: getEmbeddedText(),
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
        saveFormData();
    });
    quizCard.querySelector('.hide-banner-btn').addEventListener('click', () => {
        quizCard.style.display = 'none';
    });
    return quizCard;
}

document.addEventListener('embeddedTextChange', () => {
    saveFormData();
});

setInterval(saveFormData, 5000);  // Autosave every 5 seconds

function initializeTitleCustomization() {
    const titleColorPickerElement = document.getElementById('title-color-picker-container');
    if (titleColorPickerElement && !titleColorPickerElement.classList.contains('initialized')) {
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

        titleColorPickerElement.classList.add('initialized');
    }

    const titleStyleOptionsElement = document.getElementById('title-style-options');
    if (titleStyleOptionsElement) {
        const existingFontSearchBar = titleStyleOptionsElement.querySelector('input');
        if (existingFontSearchBar) {
            existingFontSearchBar.remove();
        }

        const fontSearchBar = document.createElement('input');
        fontSearchBar.setAttribute('list', 'fonts');
        fontSearchBar.setAttribute('placeholder', 'Search for fonts...');
        fontSearchBar.className = 'form-control mb-2';

        const fontDataList = document.createElement('datalist');
        fontDataList.id = 'fonts';

        titleStyleOptionsElement.appendChild(fontSearchBar);
        titleStyleOptionsElement.appendChild(fontDataList);

        availableFonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            fontDataList.appendChild(option);
        });

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
}

// Add the following function to clear font pickers before re-initializing them
function clearFontPickers() {
    const existingFontPickers = document.querySelectorAll('.pcr-app');
    existingFontPickers.forEach(picker => picker.remove());
}

// Update loadFormData function to call clearFontPickers before initializeTitleCustomization
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
            bannerPreview.id = 'loaded-banner-img';  // Ensure this ID is unique
            const existingBanner = document.getElementById('loaded-banner-img');
            if (existingBanner) {
                existingBanner.src = formData.banner;
            } else {
                document.getElementById('quiz-card-preview').innerHTML = '';
                const quizCard = createQuizCard(formData.banner);
                document.getElementById('quiz-card-preview').appendChild(quizCard);
            }
        }
        document.getElementById('quiz-type').value = formData.quizType;
        formData.questions.forEach((question, index) => {
            addQuestion(question.type, true);
            document.getElementById(`question-title-${index + 1}`).value = question.title;
            question.options.forEach(option => addOption(index + 1, option));
            document.getElementById(`question-hint-${index + 1}`).value = question.hint;
            document.getElementById(`correct-option-description-${index + 1}`).value = question.correctOptionDescription;
            document.getElementById(`correct-option-dropdown-${index + 1}`).value = question.correctOption;
        });
        if (document.getElementById('preview')) {
            document.getElementById('preview').innerHTML = formData.embeddedText || '';
        }
    }
    clearFontPickers(); // Clear existing font pickers
    initializeTitleCustomization(); // Initialize title customization after loading form data
}

