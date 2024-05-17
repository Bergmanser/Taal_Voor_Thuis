// import { quizData } from "./quiz";

// Get the text container and toolbar elements
const textContainer = document.getElementById('text-section-container');
const toolbar = document.getElementById('toolbar');
const playButton = document.getElementById('play-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const startFromInput = document.getElementById('start-from-input');
const startFromButton = document.getElementById('start-from-button');

// Initialize the screen reader
let screenReader = null;
export let currentTextSectionIndex = 0;
export let currentWordIndex = 0;
let textSections = [];
let autoScrollEnabled = true;

// Parse the quizData object and render the text sections
export function renderTextSections(quizData) {
    textSections = parseHtmlElementsFromQuizData(quizData);

    // Retrieve the parent element of the text sections
    const textContainer = getTextContainer();

    textSections.forEach((textSection, index) => {
        const textElement = document.createElement('div');
        textElement.className = 'text-section';
        textElement.innerHTML = textSection;

        // Remove the HTML tags from the text section
        const processedText = textElement.innerText;

        // Create a new text node with the processed text
        const processedTextNode = document.createTextNode(processedText);

        // Replace the original text node with the processed text node
        textElement.replaceChild(processedTextNode, textElement.childNodes[0]);

        textContainer.appendChild(textElement);
    });
}

// Retrieve the parent element of the text sections
function getTextContainer() {
    const quiz = document.getElementById('quiz-container');
    const textContainer = quiz.querySelector('.text-section-container');

    if (!textContainer) {
        throw new Error('The text container element was not found.');
    }

    return textContainer;
}

// Initialize the screen reader with the text sections
export function initScreenReader() {
    screenReader = new SpeechSynthesisUtterance();
    screenReader.lang = 'nl-NL'; // Set the language to Dutch
    screenReader.rate = 1; // Set the speech rate to 1
    screenReader.pitch = 1; // Set the speech pitch to 1
    screenReader.volume = 1; // Set the speech volume to 1

    // Set the onend event handler to move to the next word
    screenReader.onend = () => {
        currentWordIndex++;
        if (currentWordIndex >= textSections[currentTextSectionIndex].textContent.split(' ').length) {
            currentTextSectionIndex++;
            currentWordIndex = 0;
        }
        readNextWord();
    };
}

// Read the next word
export function readNextWord() {
    if (currentTextSectionIndex >= textSections.length) {
        return;
    }
    const words = textSections[currentTextSectionIndex].textContent.split(' ');
    const word = words[currentWordIndex];
    screenReader.text = word;
    window.speechSynthesis.speak(screenReader);

    // Move to the next word
    currentWordIndex++;
    if (currentWordIndex >= words.length) {
        currentTextSectionIndex++;
        currentWordIndex = 0;
    }

    // Scroll to the current word if auto-scroll is enabled
    if (autoScrollEnabled) {
        const currentWordElement = textSections[currentTextSectionIndex].querySelectorAll('span')[currentWordIndex];
        currentWordElement.scrollIntoView({ behavior: 'mooth', block: 'center' });
    }

    // Read the next word after a short delay
    setTimeout(readNextWord, 1000);
    highlightCurrentWord();
}

// Highlight the current word
export function highlightCurrentWord() {
    const currentWordElement = textSections[currentTextSectionIndex].querySelectorAll('span')[currentWordIndex];
    currentWordElement.classList.add('highlight');

    setTimeout(() => {
        currentWordElement.classList.remove('highlight');
    }, 500);
}

// Play the screen reader
playButton.addEventListener('click', () => {
    initScreenReader();
    readNextWord();
});

// Pause the screen reader
pauseButton.addEventListener('click', () => {
    window.speechSynthesis.pause();
});

// Reset the screen reader
resetButton.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    currentWordIndex = 0;
    currentTextSectionIndex = 0;
});

// Start the screen reader from a specific point
startFromButton.addEventListener('click', () => {
    const startIndex = parseInt(startFromInput.value, 10);
    currentWordIndex = startIndex - 1;
    currentTextSectionIndex = 0;
    initScreenReader();
    readNextWord();
});

function parseHtmlElementsFromQuizData(quizData) {
    let textSections = quizData.EmbeddedText.split('<div class="text-section">');

    textSections = textSections.map((textSection) => {
        // Remove all HTML elements using a regular expression
        const processedText = textSection.replace(/<[^>]*>?/gm, '');

        // Create a new text node with the processed text
        const processedTextNode = document.createTextNode(processedText);

        // Create a new div element with the processed text node
        const processedTextElement = document.createElement('div');
        processedTextElement.appendChild(processedTextNode);

        // Add the CSS class to the processed text element
        processedTextElement.className = 'text-section';

        return processedTextElement.outerHTML;
    });

    return textSections;
}

// Add an event listener to the auto-scroll toggle button
$('#auto-scroll-dropdown-button').on('click', function () {
    autoScrollEnabled = !autoScrollEnabled;
    $(this).find('#auto-scroll-button-text').remove();
    if (autoScrollEnabled) {
        $(this).text('Screenreader auto scroll: ');
        $(this).append('<span id="auto-scroll-button-text" class="green">On</span>');
    } else {
        $(this).text('Screenreader auto scroll: ');
        $(this).append('<span id="auto-scroll-button-text" class="red">Off</span>');
    }
});