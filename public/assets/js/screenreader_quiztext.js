// Exported functions and variables
export let currentWordIndex = 0;
let words = [];
let autoScrollEnabled = true;

// Function to set auto-scroll
export function setAutoScroll(enabled) {
    autoScrollEnabled = enabled;
    if (autoScrollEnabled) {
        $('#auto-scroll-button-text').removeClass('red').addClass('green').text('On');
        console.log("Auto-scroll is enabled");
    } else {
        $('#auto-scroll-button-text').removeClass('green').addClass('red').text('Off');
        console.log("Auto-scroll is disabled");
    }
}

// Function to render text sections
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

// Initialize the screen reader with the text sections
export function initScreenReader() {
    const screenReader = new SpeechSynthesisUtterance();
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

    return screenReader;
}

// Read the next word
export function readNextWord() {
    if (currentWordIndex >= words.length) {
        return;
    }
    const word = words[currentWordIndex];
    const screenReader = new SpeechSynthesisUtterance(word);
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
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    renderTextSections(quizData);
});

document.getElementById('play-button').addEventListener('click', () => {
    const screenReader = initScreenReader();
    readNextWord();
    setAutoScroll(true); // Enable auto-scroll when playing
});

document.getElementById('pause-button').addEventListener('click', () => {
    window.speechSynthesis.pause();
    setAutoScroll(false); // Disable auto-scroll when pausing
});

document.getElementById('reset-button').addEventListener('click', () => {
    window.speechSynthesis.cancel();
    currentWordIndex = 0;
    setAutoScroll(false); // Disable auto-scroll when resetting
});

document.getElementById('start-from-button').addEventListener('click', () => {
    const startIndex = parseInt(document.getElementById('start-from-input').value, 10);
    currentWordIndex = startIndex - 1;
    const screenReader = initScreenReader();
    readNextWord();
    setAutoScroll(true); // Enable auto-scroll when starting from a specific point
});

document.getElementById('auto-scroll-dropdown-button').addEventListener('click', function () {
    setAutoScroll(!autoScrollEnabled);
});

document.querySelectorAll('.auto-scroll-option').forEach(option => {
    option.addEventListener('click', function () {
        const value = this.dataset.value;
        setAutoScroll(value === 'on');
        document.getElementById('auto-scroll-dropdown').classList.add('hidden');
    });
});

document.getElementById('close-toolbar-button').addEventListener('click', function () {
    document.getElementById('toolbar-inner').classList.add('hidden');
});
