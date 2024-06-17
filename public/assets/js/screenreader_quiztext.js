import { quizData } from "../js/quiz.js";

// Get the text container and toolbar elements
const toolbar = document.getElementById('toolbar');
const playButton = document.getElementById('play-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const startFromInput = document.getElementById('start-from-input');
const startFromButton = document.getElementById('start-from-button');

// Initialize the screen reader
let screenReader = null;
export let currentWordIndex = 0;
let words = [];
let autoScrollEnabled = true;

// Parse the quizData object and render the text sections
export function renderTextSections(quizData) {
    const embeddedTextContainer = document.querySelector('.embedded-text');
    const hiddenTextContainer = document.querySelector('.screenreader-text');

    if (!hiddenTextContainer) {
        console.error('The hidden text container element was not found.');
        return;
    }

    hiddenTextContainer.style.display = 'none';
    const textContent = hiddenTextContainer.innerText;
    words = textContent.split(' ');

    // Split the embedded text into individual words for highlighting
    let index = 0;
    embeddedTextContainer.innerHTML = embeddedTextContainer.innerHTML.replace(/\b(\w+)\b/g, (match) => {
        return `<span data-word-index="${index++}">${match}</span>`;
    });
}

// Wait for the DOM to be fully loaded before rendering the text sections
document.addEventListener('DOMContentLoaded', () => {
    renderTextSections(quizData);
});

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
        if (currentWordIndex < words.length) {
            readNextWord();
        }
    };
}

// Read the next word
export function readNextWord() {
    if (currentWordIndex >= words.length) {
        return;
    }
    const word = words[currentWordIndex];
    screenReader.text = word;
    console.log("Reading word:", word);
    window.speechSynthesis.speak(screenReader);

    highlightCurrentWord();
}

// Highlight the current word
export function highlightCurrentWord() {
    const wordElements = document.querySelectorAll('.embedded-text span');
    wordElements.forEach(element => element.classList.remove('highlight'));

    const currentWordElement = document.querySelector(`.embedded-text span[data-word-index="${currentWordIndex}"]`);
    if (currentWordElement) {
        currentWordElement.classList.add('highlight');

        // Scroll to the current word if auto-scroll is enabled
        if (autoScrollEnabled) {
            currentWordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        console.log("Highlighted word:", currentWordElement.textContent);
    }
}

// Event listener for the play button
playButton.addEventListener('click', () => {
    console.log("Play button clicked");
    initScreenReader();
    readNextWord();
    setAutoScroll(true); // Enable auto-scroll when playing
});

// Event listener for the pause button
pauseButton.addEventListener('click', () => {
    console.log("Pause button clicked");
    window.speechSynthesis.pause();
    setAutoScroll(false); // Disable auto-scroll when pausing
});

// Event listener for the reset button
resetButton.addEventListener('click', () => {
    console.log("Reset button clicked");
    window.speechSynthesis.cancel();
    currentWordIndex = 0;
    setAutoScroll(false); // Disable auto-scroll when resetting
});

// Event listener for the start-from button
startFromButton.addEventListener('click', () => {
    console.log("Start from button clicked");
    const startIndex = parseInt(startFromInput.value, 10);
    currentWordIndex = startIndex - 1;
    initScreenReader();
    readNextWord();
    setAutoScroll(true); // Enable auto-scroll when starting from a specific point
});

// Event listener for the auto-scroll dropdown button
$('#auto-scroll-dropdown-button').on('click', function () {
    console.log("Auto-scroll dropdown button clicked");
    setAutoScroll(!autoScrollEnabled);
});

// Event listener for the auto-scroll dropdown options
$(document).on('click', '.auto-scroll-option', function () {
    console.log("Auto-scroll dropdown option clicked");
    const value = $(this).data('value');
    if (value === 'on') {
        setAutoScroll(true);
    } else {
        setAutoScroll(false);
    }
    $(toolbar).find('#auto-scroll-dropdown').toggleClass('hidden');
});

// Event listener for closing the toolbar
$('#close-toolbar-button').on('click', function () {
    console.log("Close toolbar button clicked");
    $(toolbar).find('#toolbar-inner').toggleClass('hidden');
});

// Function to enable or disable auto-scroll
function setAutoScroll(enabled) {
    autoScrollEnabled = enabled;
    if (autoScrollEnabled) {
        $(toolbar).find('#auto-scroll-button-text').remove();
        $(toolbar).find('#auto-scroll-dropdown-button').text('Screenreader auto scroll: ');
        $(toolbar).find('#auto-scroll-dropdown-button').append('<span id="auto-scroll-button-text" class="green">On</span>');
        console.log("Auto-scroll is enabled");
    } else {
        $(toolbar).find('#auto-scroll-button-text').remove();
        $(toolbar).find('#auto-scroll-dropdown-button').text('Screenreader auto scroll: ');
        $(toolbar).find('#auto-scroll-dropdown-button').append('<span id="auto-scroll-button-text" class="red">Off');
        console.log("Auto-scroll is disabled");
    }
}

// Set the initial state of auto-scroll to "on"
setAutoScroll(true);