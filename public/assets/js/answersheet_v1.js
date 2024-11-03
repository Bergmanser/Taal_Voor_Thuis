import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase_config.js";

// Helper function to get quizId from the URL
const getQuizIdFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id'); // Expecting 'id' to be part of the query string
};

// Scroll smoothly to a question based on the question index
const scrollToQuestion = (questionIndex) => {
    const questionElement = document.getElementById(`question-${questionIndex}`);
    if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth' });
    }
};

// Highlight the active pagination number
const highlightPaginationNumber = (questionIndex) => {
    const allPaginationNumbers = document.querySelectorAll('.pagination-number');
    allPaginationNumbers.forEach((number, index) => {
        if (index + 1 === questionIndex) {
            number.classList.add('active');
        } else {
            number.classList.remove('active');
        }
    });
};

// Function to render the pagination numbers
const renderPagination = (totalQuestions) => {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Clear existing pagination

    for (let i = 1; i <= totalQuestions; i++) {
        const paginationNumber = document.createElement('div');
        paginationNumber.classList.add('pagination-number');
        paginationNumber.innerText = i;
        paginationNumber.addEventListener('click', () => {
            scrollToQuestion(i);
            highlightPaginationNumber(i);
        });
        paginationContainer.appendChild(paginationNumber);
    }
};

// Function to render the answer sheet
const renderAnswerSheet = (quizData) => {
    const answerSheetContainer = document.getElementById('answer-sheet-container');
    answerSheetContainer.innerHTML = ''; // Clear any existing content
    document.getElementById('quiz-title').innerText = quizData.Title;  // Set title

    quizData.Questions.forEach((question, questionIndex) => {
        const questionContainer = document.createElement('div');
        questionContainer.classList.add('question-container');
        questionContainer.id = `question-${questionIndex + 1}`; // Unique ID for each question
        questionContainer.innerHTML = `
            <div class="question-text"><strong>${questionIndex + 1}. ${question.Text}</strong></div>
            <ul class="options-list">
                ${question.Options.map((option, index) => `
                    <li class="${index === question.CorrectOption ? 'correct-option' : ''}">
                        ${String.fromCharCode(65 + index)}. ${option}
                    </li>`).join('')}
            </ul>
            <div class="hint"><strong>De hint:</strong> ${question.Hint}</div>
            <div class="correct-description"><strong>Uitleg correcte optie:</strong> ${question.CorrectOptionDescription}</div>
        `;
        answerSheetContainer.appendChild(questionContainer);
    });

    // Render pagination after questions are displayed
    renderPagination(quizData.Questions.length);
};

// Function to render the embedded text section
// Function to get the CSS class for each HTML tag
const getCssClassForTag = (tag) => {
    const tagName = tag.toLowerCase();
    switch (tagName) {
        case 'h1':
            return 'embedded-text-h1';
        case 'h2':
            return 'embedded-text-h2';
        case 'h3':
            return 'embedded-text-h3';
        case 'h4':
            return 'embedded-text-h4';
        case 'p':
            return 'embedded-text-p';
        case 'b':
            return 'embedded-text-b';
        case 'strong':
            return 'embedded-text-strong';
        case 'img':
            return 'embedded-text-img';
        case 'span':
            return 'embedded-text-span';
        default:
            return 'embedded-text-default';
    }
};

// Function to handle the middle section with images
const handleMiddleSection = (section, sectionDiv) => {
    const leftImgElement = document.createElement('div');
    leftImgElement.className = 'embedded-image-middlesection';
    if (section.Images[0]) {
        const imgElement = document.createElement('img');
        imgElement.src = section.Images[0];
        imgElement.alt = 'Image 1';
        leftImgElement.appendChild(imgElement);
    }

    const rightImgElement = document.createElement('div');
    rightImgElement.className = 'embedded-image-middlesection';
    if (section.Images[1]) {
        const imgElement = document.createElement('img');
        imgElement.src = section.Images[1];
        imgElement.alt = 'Image 2';
        rightImgElement.appendChild(imgElement);
    }

    const textDiv = document.createElement('div');
    textDiv.className = 'embedded-text';
    textDiv.style.borderColor = section.BorderColor;
    textDiv.style.color = section.TextColor;
    textDiv.innerHTML = section.Text;

    sectionDiv.appendChild(leftImgElement);
    sectionDiv.appendChild(textDiv);
    sectionDiv.appendChild(rightImgElement);
};

// Function to display processed text sections
const displayTextSections = (processedTextSections, oldFormat) => {
    const textContainer = document.getElementById('text-section-container');
    textContainer.innerHTML = '';

    if (oldFormat) {
        processedTextSections.forEach((section) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'embedded-text-section';
            sectionDiv.innerHTML = `<div class="embedded-text">${section}</div>`;
            textContainer.appendChild(sectionDiv);
        });
    } else {
        processedTextSections.forEach((section) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = `embedded-text-section ${section.SectionType}`;

            if (section.SectionType === 'middle-section') {
                handleMiddleSection(section, sectionDiv);
            } else {
                const textDiv = document.createElement('div');
                textDiv.className = 'embedded-text';
                textDiv.style.borderColor = section.BorderColor;
                textDiv.style.color = section.TextColor;
                textDiv.innerHTML = section.Text;
                sectionDiv.appendChild(textDiv);

                if (section.Images.length) {
                    const imagesDiv = document.createElement('div');
                    imagesDiv.className = 'embedded-images';
                    section.Images.forEach((imgSrc, imgIndex) => {
                        const imgElement = document.createElement('img');
                        imgElement.src = imgSrc;
                        imgElement.alt = `Image ${imgIndex + 1}`;
                        imgElement.style.position = section.ImageDetails[imgIndex].positionOnPage;
                        imagesDiv.appendChild(imgElement);
                    });
                    sectionDiv.appendChild(imagesDiv);
                }
            }

            textContainer.appendChild(sectionDiv);
        });
    }
};

// Function to parse the new embedded text format
const parseNewEmbeddedTextFormat = (htmlDoc) => {
    const sections = htmlDoc.querySelectorAll('.section-container');
    const structuredData = [];
    let currentSection;
    let previousElementClass = '';


    sections.forEach((section, index) => {
        const sectionType = section.querySelector('.section').classList[1];
        const content = section.querySelector('.section-content');
        const boldWords = Array.from(content.querySelectorAll('b')).map(b => b.innerText);
        const borderColor = content.style.borderColor || 'rgb(12, 157, 18)';
        const textColor = content.style.color || 'rgb(0, 0, 0)';
        const images = section.querySelectorAll('img');
        const imageDetails = Array.from(images).map(img => ({
            src: img.src,
            positionOnPage: img.style.position || [],
            backOrForeground: img.closest('.background-section')?.querySelector('.z-index-dropdown')?.value || 'background',
            containedOrUncontained: img.closest('.background-section')?.querySelector('.containment-dropdown')?.value || 'contained'
        }));

        let textContent = content.innerHTML.replace(/<b>|<\/b>/g, '');
        textContent = highlightBoldWords(textContent, boldWords);

        structuredData.push({
            SectionNumber: index + 1,
            Boldwords: boldWords,
            BorderColor: borderColor,
            TextColor: textColor,
            SectionType: sectionType,
            Images: Array.from(images).map(img => img.src),
            ImageDetails: imageDetails,
            Text: textContent
        });

        sections.forEach((section, index) => {
            const tagName = section.tagName.toLowerCase();
            const cssClass = getCssClassForTag(tagName);
            const content = section.innerHTML.trim();

            if (tagName === 'h1') {
                if (currentSection) {
                    textContainer.appendChild(currentSection);
                }
                currentSection = document.createElement('div');
                currentSection.className = 'text-section';
            }

            if (currentSection) {
                const element = document.createElement('div');
                element.className = cssClass;
                element.innerHTML = content;
                currentSection.appendChild(element);
            }

            if (index === sections.length - 1 && currentSection) {
                textContainer.appendChild(currentSection);
            }

            previousElementClass = cssClass;
        });
    });

    return structuredData;
};

// Function to highlight bold words
const highlightBoldWords = (text, boldWords) => {
    boldWords.forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        text = text.replace(regex, '<strong>$1</strong>');
    });
    return text;
};

// Update the renderEmbeddedTextSection function
const renderEmbeddedTextSection = (embeddedTextHTML) => {
    const textContainer = document.getElementById('text-section-container');

    try {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(embeddedTextHTML, 'text/html');

        const oldFormat = !htmlDoc.querySelector('.section-container');
        let processedTextSections;
        if (oldFormat) {
            processedTextSections = Array.from(htmlDoc.body.children).map(section => section.outerHTML);
        } else {
            processedTextSections = parseNewEmbeddedTextFormat(htmlDoc);
        }

        // Display the processed text sections in the DOM
        displayTextSections(processedTextSections, oldFormat);
        // Now that the content is rendered, initialize the screen reader
        initializeScreenReader();
    } catch (error) {
        console.error("Error parsing EmbeddedText HTML:", error);
        textContainer.innerHTML = '<div>Error displaying embedded text.</div>';
    }
};

// Function to initialize the screen reader after content is rendered
const initializeScreenReader = () => {
    console.log('Initializing screen reader...');

    const container = document.querySelector('#text-section-container');
    if (!container) {
        console.warn('Text container not found. Screen reader initialization aborted.');
        return;
    }

    // Now that the content is fully rendered, we can safely initialize the screen reader components
    const textHighlighter = new TextHighlighter('#text-section-container');  // Initialize highlighter
    const screenReader = new ScreenReaderService();  // Initialize speech service

    const navigationControls = new NavigationControls(screenReader, textHighlighter);  // Initialize navigation
    const screenReaderMenu = new ScreenReaderMenu(screenReader, navigationControls);  // Initialize menu
};


// Fetch quiz data from Firestore
const fetchQuizData = async (quizId) => {
    try {
        const docRef = doc(db, "quizzes", quizId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();  // Return the quiz data
        } else {
            console.error("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching document:", error);
        return null;
    }
};

// Call fetchQuizData and render the content after the page is ready
document.addEventListener('DOMContentLoaded', async () => {
    const quizId = getQuizIdFromURL();
    if (quizId) {
        const quizData = await fetchQuizData(quizId);
        if (quizData) {
            renderAnswerSheet(quizData);  // Render answer sheet and initialize screen reader afterwards
        }
    }
});


// Screenreader experiment

// Function to recursively extract text from a DOM node
const extractTextFromNode = (node) => {
    let text = '';

    // If the node is a text node, extract its content
    if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent.trim();  // Add text content
    } else {
        // If it's an element node, recursively extract from its children
        node.childNodes.forEach(child => {
            text += extractTextFromNode(child);  // Recursively gather text from children
        });
    }

    return text;
};

// Updated NavigationControls class to handle text extraction and continuous reading per section
class NavigationControls {
    constructor(screenReader, textHighlighter) {
        this.screenReader = screenReader;
        this.textHighlighter = textHighlighter;
        this.sections = document.querySelectorAll('.embedded-text-section');  // All sections
        this.currentSectionIndex = 0;  // Start at the first section
        this.currentSentenceIndexInSection = 0;  // Track sentence index within the current section

        console.log('NavigationControls initialized with sections:', this.sections);
    }

    nextSection(autoPlay = false) {
        if (this.currentSectionIndex < this.sections.length - 1) {
            this.currentSectionIndex++;
            this.currentSentenceIndexInSection = 0;  // Reset the sentence index when moving to a new section
            console.log('Navigating to next section, index:', this.currentSectionIndex);
            this.readCurrentSection(autoPlay);
        } else {
            console.log('Reached the last section. Stopping...');
            this.screenReader.stop();
        }
    }

    previousSection() {
        if (this.currentSectionIndex > 0) {
            this.currentSectionIndex--;
            this.currentSentenceIndexInSection = 0;  // Reset the sentence index when moving to a previous section
            console.log('Navigating to previous section, index:', this.currentSectionIndex);
            this.readCurrentSection();
        } else {
            console.warn('Already at the first section.');
        }
    }

    readCurrentSection(autoPlay = false) {
        const currentSection = this.sections[this.currentSectionIndex];

        if (!currentSection) {
            console.warn('Current section not found. Check your DOM structure.');
            return;
        }

        const textNode = currentSection.querySelector('.embedded-text');
        if (!textNode) {
            console.warn('No text node found in the current section');
            return;
        }

        // Extract the readable text from the current section
        const text = extractTextFromNode(textNode);

        if (!text) {
            console.warn('No text found to read in the current section');
            return;
        }

        console.log('Reading current section:', text);

        this.screenReader.stop();  // Stop any ongoing speech before starting new section
        this.screenReader.setText(text);
        this.textHighlighter.clearHighlights();

        // Start reading and highlighting from the current sentence index within the section
        this.readAndHighlightCurrentSentenceInSection();

        this.screenReader.speak(() => {
            // Auto-play next section when the current one is finished
            if (autoPlay) {
                this.nextSection(true);  // Move to the next section automatically
            }
        });
        this.scrollToSection(currentSection);
    }

    // Helper to read and highlight the current sentence in the section
    readAndHighlightCurrentSentenceInSection() {
        const currentSentence = this.screenReader.getSentenceByIndex(this.currentSentenceIndexInSection); // Get current sentence by index
        if (currentSentence) {
            console.log(`Highlighting sentence in section: ${currentSentence}`);
            this.textHighlighter.highlightSentenceByText(currentSentence);

            // Increment sentence index for the next read
            this.currentSentenceIndexInSection++;
        } else {
            console.log('All sentences read in the current section.');
            this.nextSection(true);  // Automatically move to the next section
        }
    }

    scrollToSection(section) {
        console.log('Scrolling to section');
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


// Enhanced ScreenReaderService class with ElevenLabs API integration
class ScreenReaderService {
    constructor(textHighlighter) {
        this.synth = window.speechSynthesis;
        this.utterance = new SpeechSynthesisUtterance();
        this.isReading = false;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        this.autoScrollSpeed = 1;
        this.lang = 'nl-NL';
        this.utterance.lang = this.lang;
        this.utterance.onend = () => this.onSentenceEnd();
        this.textHighlighter = textHighlighter;
        this.audio = null; // Add this line to store the Audio object

        // ElevenLabs API configuration
        this.elevenLabsApiKey = ''; // Replace with your API key
        this.elevenLabsFemaleVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Replace with actual voice ID
        this.elevenLabsMaleVoiceId = 's7Z6uboUuE4Nd8Q2nye6'; // Replace with actual voice ID
        this.useExternalTTS = false; // Flag to toggle between built-in and ElevenLabs TTS
        this.currentVoice = 'female'; // Default to female voice

        // Set a female Dutch voice if available for built-in TTS
        this.setBuiltInVoice();
    }

    setBuiltInVoice() {
        const voices = this.synth.getVoices();
        const dutchFemaleVoice = voices.find(voice => voice.lang === 'nl-NL' && voice.name.includes('Flo'));
        const dutchVoice = voices.find(voice => voice.lang === 'nl-NL');

        if (dutchFemaleVoice) {
            this.utterance.voice = dutchFemaleVoice;
            console.log('Using Dutch female voice:', dutchFemaleVoice.name);
        } else if (dutchVoice) {
            this.utterance.voice = dutchVoice;
            console.log('Using Dutch voice:', dutchVoice.name);
        } else {
            console.warn('No suitable Dutch voice found. Using default.');
        }
    }

    setVoice(gender) {
        this.currentVoice = gender;
        console.log(`Set voice to ${gender}`);
        if (!this.useExternalTTS) {
            // Update built-in voice if not using external TTS
            this.setBuiltInVoice();
        }
    }

    async synthesizeSpeech(text) {
        const voiceId = this.currentVoice === 'female' ? this.elevenLabsFemaleVoiceId : this.elevenLabsMaleVoiceId;
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': this.elevenLabsApiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to synthesize speech');
            }

            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
        } catch (error) {
            console.error('Error synthesizing speech:', error);
            return null;
        }
    }

    setText(text) {
        console.log('Setting text:', text);
        this.sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        console.log('Parsed sentences:', this.sentences);
        if (this.sentences.length === 0) {
            console.warn('No sentences were found in the provided text');
        }
    }

    getSentenceByIndex(index) {
        return this.sentences[index] || null;
    }

    async speak(onEndCallback) {
        if (this.isReading) {
            console.log('Already reading, skipping speak()');
            return;
        }

        this.isReading = true;
        this.onEndCallback = onEndCallback;

        if (this.useExternalTTS) {
            await this.readNextSentenceExternal();
        } else {
            this.readNextSentence();
        }
    }

    async readNextSentenceExternal() {
        if (this.currentSentenceIndex < this.sentences.length) {
            const sentence = this.sentences[this.currentSentenceIndex];
            const audioUrl = await this.synthesizeSpeech(sentence);

            if (audioUrl) {
                if (this.audio) {
                    this.audio.pause();
                    this.audio.currentTime = 0;
                }
                this.audio = new Audio(audioUrl);
                this.audio.onended = () => this.onSentenceEnd();
                this.audio.play();

                if (this.textHighlighter) {
                    this.textHighlighter.highlightSentence(this.currentSentenceIndex);
                }
            } else {
                console.warn('Failed to synthesize speech, falling back to built-in TTS');
                this.useExternalTTS = false;
                this.readNextSentence();
            }
        } else {
            console.log('All sentences read');
            this.isReading = false;
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        }
    }

    pause() {
        if (this.useExternalTTS) {
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0; // Reset audio to beginning
            }
        } else {
            this.synth.cancel(); // This immediately stops speech
        }
        this.isReading = false;
        console.log('Speech paused');
    }

    resume() {
        if (this.useExternalTTS) {
            if (this.audio) {
                this.audio.play();
            } else {
                this.readNextSentenceExternal();
            }
        } else {
            // For built-in TTS, we need to restart the current sentence
            this.readNextSentence();
        }
        this.isReading = true;
        console.log('Speech resumed');
    }

    stop() {
        if (this.useExternalTTS) {
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
            }
        } else {
            this.synth.cancel();
        }
        this.isReading = false;
        this.currentSentenceIndex = this.currentSentenceIndex;
        console.log('Speech stopped');
    }


    async readNextSentence() {
        if (this.sentences.length > 0) {
            const sentence = this.sentences[0];  // Take the first sentence
            this.utterance.text = sentence;
            this.utterance.rate = this.autoScrollSpeed;

            console.log('Reading next sentence:', this.utterance.text);
            this.synth.speak(this.utterance);

            // Ensure highlightSentenceByText is triggered with the actual sentence text
            if (this.textHighlighter) {
                this.textHighlighter.highlightSentenceByText(sentence);  // Pass the sentence text
            }
        } else {
            console.log('All sentences read');
            this.isReading = false;
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        }
    }

    onSentenceEnd() {
        this.sentences.shift();  // Remove the first sentence after it is read
        console.log('Sentence finished, moving to the next one');
        if (this.isReading) {
            if (this.useExternalTTS) {
                this.readNextSentenceExternal();
            } else {
                this.readNextSentence();
            }
        }
    }

    // External TTS
    pause() {
        if (this.useExternalTTS) {
            // For external TTS, we need to implement pause functionality
            // This might involve pausing the Audio object
            console.log('Pause not implemented for external TTS');
        } else {
            this.synth.pause();
        }
        this.isReading = false;
        console.log('Speech paused');
    }

    resume() {
        if (this.useExternalTTS) {
            // For external TTS, we need to implement resume functionality
            // This might involve resuming the Audio object
            console.log('Resume not implemented for external TTS');
        } else {
            this.synth.resume();
        }
        this.isReading = true;
        console.log('Speech resumed');
    }

    stop() {
        if (this.useExternalTTS) {
            // For external TTS, we need to implement stop functionality
            // This might involve stopping and resetting the Audio object
            console.log('Stop not implemented for external TTS');
        } else {
            this.synth.cancel();
        }
        this.isReading = false;
        this.currentSentenceIndex = this.currentSentenceIndex;
        console.log('Speech stopped');
    }

    fastForward() {
        this.currentSentenceIndex = Math.min(this.currentSentenceIndex + 1, this.sentences.length - 1);
        if (this.useExternalTTS) {
            // For external TTS, we need to implement fast forward functionality
            console.log('Fast forward not implemented for external TTS');
        } else {
            this.synth.cancel();  // Stop current speech
        }
        console.log('Fast forwarding to sentence index:', this.currentSentenceIndex);
        if (this.isReading) {
            if (this.useExternalTTS) {
                this.readNextSentenceExternal();
            } else {
                this.readNextSentence();
            }
        }
    }

    rewind() {
        this.currentSentenceIndex = Math.max(this.currentSentenceIndex - 1, 0);
        if (this.useExternalTTS) {
            // For external TTS, we need to implement rewind functionality
            console.log('Rewind not implemented for external TTS');
        } else {
            this.synth.cancel();  // Stop current speech
        }
        console.log('Rewinding to sentence index:', this.currentSentenceIndex);
        if (this.isReading) {
            if (this.useExternalTTS) {
                this.readNextSentenceExternal();
            } else {
                this.readNextSentence();
            }
        }
    }

    toggleTTS() {
        this.useExternalTTS = !this.useExternalTTS;
        console.log(`Switched to ${this.useExternalTTS ? 'external' : 'built-in'} TTS`);
        // If we're currently reading, stop and restart with the new TTS
        if (this.isReading) {
            this.stop();
            this.speak(this.onEndCallback);
        }
    }
}

// Update the ScreenReaderMenu to include voice selection and TTS toggle
class ScreenReaderMenu {
    constructor(screenReader, navigationControls) {
        this.screenReader = screenReader;
        this.navigationControls = navigationControls;
        this.isPlaying = false;
        this.totalSections = navigationControls.sections.length;

        console.log('ScreenReaderMenu initialized with total sections:', this.totalSections);

        this.createMenuElement();
        this.attachEventListeners();
    }

    createMenuElement() {
        this.container = document.createElement('div');
        this.container.className = 'screen-reader-menu';
        this.container.innerHTML = `
            <button id="sr-prev-section" class="sr-button">⏮️</button>
            <button id="sr-rewind" class="sr-button">⏪</button>
            <button id="sr-play-pause" class="sr-button">▶️</button>
            <button id="sr-fast-forward" class="sr-button">⏩</button>
            <button id="sr-next-section" class="sr-button">⏭️</button>
            <select id="sr-voice-select">
                <option value="female">Female Voice</option>
                <option value="male">Male Voice</option>
            </select>
            <button id="sr-tts-toggle" class="sr-button">Toggle TTS</button>
        `;
        document.body.appendChild(this.container);
    }

    attachEventListeners() {
        this.container.querySelector('#sr-play-pause').addEventListener('click', () => this.togglePlayPause());
        this.container.querySelector('#sr-rewind').addEventListener('click', () => this.screenReader.rewind());
        this.container.querySelector('#sr-fast-forward').addEventListener('click', () => this.screenReader.fastForward());
        this.container.querySelector('#sr-prev-section').addEventListener('click', () => this.navigationControls.previousSection());
        this.container.querySelector('#sr-next-section').addEventListener('click', () => this.navigationControls.nextSection());
        this.container.querySelector('#sr-voice-select').addEventListener('change', (e) => this.screenReader.setVoice(e.target.value));
        this.container.querySelector('#sr-tts-toggle').addEventListener('click', () => this.screenReader.toggleTTS());
    }

    togglePlayPause() {
        if (this.isPlaying) {
            console.log('Pausing screen reader');
            this.screenReader.pause();
            this.container.querySelector('#sr-play-pause').textContent = '▶️';
        } else {
            console.log('Starting or resuming screen reader');
            if (!this.screenReader.isReading) {
                console.log('Starting from the first section');
                this.navigationControls.readCurrentSection(true);
            } else {
                this.screenReader.resume();
            }
            this.container.querySelector('#sr-play-pause').textContent = '⏸️';
        }
        this.isPlaying = !this.isPlaying;
    }
}

// Initialize everything when the document is ready
$(document).ready(() => {
    console.log('Document ready, initializing enhanced screen reader components');
    const textHighlighter = new TextHighlighter('#text-section-container');
    const screenReader = new ScreenReaderService(textHighlighter);
    const navigationControls = new NavigationControls(screenReader, textHighlighter);
});

// TextHighlighter class to highlight based on sentence text
class TextHighlighter {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        console.log('TextHighlighter initialized for container:', containerSelector);
    }

    highlightSentenceByText(sentenceText) {
        console.log('Highlighting sentence by text:', sentenceText);

        const textNodes = this.getTextNodes(this.container);

        textNodes.forEach(node => {
            const nodeText = node.textContent;

            // Search for the sentence text inside the node text
            const sentenceStartIndex = nodeText.indexOf(sentenceText);

            if (sentenceStartIndex !== -1) {
                console.log(`Found sentence in node: "${sentenceText}"`);

                this.clearHighlights();  // Clear previous highlights

                const range = document.createRange();
                range.setStart(node, sentenceStartIndex);
                range.setEnd(node, sentenceStartIndex + sentenceText.length);

                const span = document.createElement('span');
                span.classList.add('highlighted-sentence');
                range.surroundContents(span);
            }
        });
    }

    clearHighlights() {
        console.log('Clearing all highlights');
        const highlights = this.container.querySelectorAll('.highlighted-sentence');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
            }
            parent.removeChild(highlight);
        });
    }

    getTextNodes(node) {
        const textNodes = [];
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        let currentNode;
        while (currentNode = walker.nextNode()) {
            textNodes.push(currentNode);
        }

        console.log('Extracted text nodes:', textNodes);
        return textNodes;
    }
}


// Function to setup pagination
const setupPagination = (totalQuestions) => {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalQuestions; i++) {
        const pageItem = document.createElement('span');
        pageItem.innerText = i;
        pageItem.addEventListener('click', () => scrollToQuestion(i));
        paginationContainer.appendChild(pageItem);
    }

    document.getElementById('pagination-prev').addEventListener('click', () => navigatePagination('prev'));
    document.getElementById('pagination-next').addEventListener('click', () => navigatePagination('next'));
};


// Function to navigate pagination (previous/next)
const navigatePagination = (direction) => {
    const currentActive = document.querySelector('.pagination span.pagination-active');
    const paginationItems = Array.from(document.querySelectorAll('.pagination span'));

    let currentIndex = paginationItems.indexOf(currentActive);

    if (direction === 'prev' && currentIndex > 0) {
        currentIndex--;
    } else if (direction === 'next' && currentIndex < paginationItems.length - 1) {
        currentIndex++;
    }

    paginationItems.forEach(item => item.classList.remove('pagination-active'));
    paginationItems[currentIndex].classList.add('pagination-active');
    scrollToQuestion(currentIndex + 1);
};

// Toggle pagination visibility
document.getElementById('toggle-pagination-button').addEventListener('click', () => {
    const paginationContent = document.getElementById('pagination-content');
    paginationContent.classList.toggle('hidden');
});

// Initialize answer sheet page
const initAnswerSheet = async () => {
    const quizId = getQuizIdFromURL();
    if (quizId) {
        const quizData = await fetchQuizData(quizId);
        if (quizData) {
            renderAnswerSheet(quizData);
            setupPagination(quizData.Questions.length); // Setup pagination for questions

            // Setup the embedded text section if available
            if (quizData.EmbeddedText) {
                renderEmbeddedTextSection(quizData.EmbeddedText);
            }

            // Event listeners for toggling between sections
            document.getElementById('show-answer-sheet-button').addEventListener('click', () => {
                document.getElementById('answer-sheet-container').classList.remove('hidden');
                document.getElementById('text-section-container').classList.add('hidden');
                document.getElementById('pagination-window').classList.remove('hidden');
            });

            document.getElementById('show-text-section-button').addEventListener('click', () => {
                document.getElementById('answer-sheet-container').classList.add('hidden');
                document.getElementById('text-section-container').classList.remove('hidden');
                document.getElementById('pagination-window').classList.add('hidden');
            });
        } else {
            document.getElementById('answer-sheet-container').innerText = 'Quiz data not found!';
        }
    } else {
        document.getElementById('answer-sheet-container').innerText = 'Vergeet niet een van de bestaande quiz te selecteren!';
    }
};

window.onload = initAnswerSheet;
