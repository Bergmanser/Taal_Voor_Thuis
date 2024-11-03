class ScreenReaderMenu {
    constructor(screenReader, navigationControls) {
        this.screenReader = screenReader;
        this.navigationControls = navigationControls;
        this.isPlaying = false;
        this.currentSection = 1;
        this.totalSections = navigationControls.sections.length;
        this.autoScrollSpeed = 1;
        this.container = null;

        this.createMenuElement();
        this.attachEventListeners();
    }

    createMenuElement() {
        this.container = document.createElement('div');
        this.container.className = 'screen-reader-menu';
        this.container.innerHTML = `
        <div class="menu-controls">
          <button id="sr-prev-section" class="sr-button" ${this.currentSection === 1 ? 'disabled' : ''}>⏮️</button>
          <button id="sr-rewind" class="sr-button">⏪</button>
          <button id="sr-play-pause" class="sr-button">▶️</button>
          <button id="sr-fast-forward" class="sr-button">⏩</button>
          <button id="sr-next-section" class="sr-button" ${this.currentSection === this.totalSections ? 'disabled' : ''}>⏭️</button>
          <button id="sr-settings" class="sr-button">⚙️</button>
        </div>
        <div class="section-info">Section ${this.currentSection} of ${this.totalSections}</div>
        <div id="sr-settings-panel" class="settings-panel" style="display: none;">
          <div class="speed-control">
            <label for="sr-speed-slider">Speed: </label>
            <input type="range" id="sr-speed-slider" min="0.5" max="2" step="0.1" value="${this.autoScrollSpeed}">
            <span id="sr-speed-value">${this.autoScrollSpeed.toFixed(1)}x</span>
          </div>
          <div class="language-control">
            <button id="sr-lang-nl" class="sr-button">Dutch</button>
            <button id="sr-lang-en" class="sr-button">English</button>
          </div>
        </div>
      `;

        document.body.appendChild(this.container);
    }

    attachEventListeners() {
        this.container.querySelector('#sr-play-pause').addEventListener('click', () => this.togglePlayPause());
        this.container.querySelector('#sr-rewind').addEventListener('click', () => this.screenReader.rewind());
        this.container.querySelector('#sr-fast-forward').addEventListener('click', () => this.screenReader.fastForward());
        this.container.querySelector('#sr-prev-section').addEventListener('click', () => this.handlePreviousSection());
        this.container.querySelector('#sr-next-section').addEventListener('click', () => this.handleNextSection());
        this.container.querySelector('#sr-settings').addEventListener('click', () => this.toggleSettings());
        this.container.querySelector('#sr-speed-slider').addEventListener('input', (e) => this.handleSpeedChange(e.target.value));
        this.container.querySelector('#sr-lang-nl').addEventListener('click', () => this.handleLanguageChange('nl-NL'));
        this.container.querySelector('#sr-lang-en').addEventListener('click', () => this.handleLanguageChange('en-US'));
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.screenReader.pause();
            this.container.querySelector('#sr-play-pause').textContent = '▶️';
        } else {
            this.screenReader.resume();
            this.container.querySelector('#sr-play-pause').textContent = '⏸️';
        }
        this.isPlaying = !this.isPlaying;
    }

    handlePreviousSection() {
        this.navigationControls.previousSection();
        this.updateSectionInfo(--this.currentSection);
    }

    handleNextSection() {
        this.navigationControls.nextSection();
        this.updateSectionInfo(++this.currentSection);
    }

    updateSectionInfo(newSection) {
        this.currentSection = newSection;
        this.container.querySelector('.section-info').textContent = `Section ${this.currentSection} of ${this.totalSections}`;
        this.container.querySelector('#sr-prev-section').disabled = this.currentSection === 1;
        this.container.querySelector('#sr-next-section').disabled = this.currentSection === this.totalSections;
    }

    toggleSettings() {
        const settingsPanel = this.container.querySelector('#sr-settings-panel');
        settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
    }

    handleSpeedChange(value) {
        this.autoScrollSpeed = parseFloat(value);
        this.screenReader.setAutoScrollSpeed(this.autoScrollSpeed);
        this.container.querySelector('#sr-speed-value').textContent = `${this.autoScrollSpeed.toFixed(1)}x`;
    }

    handleLanguageChange(lang) {
        this.screenReader.setLanguage(lang);
    }
}


class ScreenReaderService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = new SpeechSynthesisUtterance();
        this.isReading = false;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        this.autoScrollSpeed = 1; // Default speed
        this.lang = 'nl-NL'; // Default to Dutch

        this.utterance.lang = this.lang;
        this.utterance.onend = () => this.onSentenceEnd();
    }

    setText(text) {
        this.sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
        this.currentSentenceIndex = 0;
    }

    speak() {
        if (this.isReading) return;
        this.isReading = true;
        this.readNextSentence();
    }

    pause() {
        this.synth.pause();
        this.isReading = false;
    }

    resume() {
        this.synth.resume();
        this.isReading = true;
    }

    stop() {
        this.synth.cancel();
        this.isReading = false;
        this.currentSentenceIndex = 0;
    }

    readNextSentence() {
        if (this.currentSentenceIndex < this.sentences.length) {
            this.utterance.text = this.sentences[this.currentSentenceIndex];
            this.utterance.rate = this.autoScrollSpeed;
            this.synth.speak(this.utterance);
        } else {
            this.isReading = false;
        }
    }

    onSentenceEnd() {
        this.currentSentenceIndex++;
        if (this.isReading) {
            this.readNextSentence();
        }
    }

    setAutoScrollSpeed(speed) {
        this.autoScrollSpeed = speed;
    }

    setLanguage(lang) {
        this.lang = lang;
        this.utterance.lang = lang;
    }

    fastForward() {
        this.currentSentenceIndex = Math.min(this.currentSentenceIndex + 1, this.sentences.length - 1);
        this.synth.cancel();
        if (this.isReading) this.readNextSentence();
    }

    rewind() {
        this.currentSentenceIndex = Math.max(this.currentSentenceIndex - 1, 0);
        this.synth.cancel();
        if (this.isReading) this.readNextSentence();
    }
}

// Navigation controls
class NavigationControls {
    constructor(screenReader, textHighlighter) {
        this.screenReader = screenReader;
        this.textHighlighter = textHighlighter;
        this.sections = document.querySelectorAll('.embedded-text-section');
        this.currentSectionIndex = 0;
    }

    nextSection() {
        this.currentSectionIndex = Math.min(this.currentSectionIndex + 1, this.sections.length - 1);
        this.readCurrentSection();
    }

    previousSection() {
        this.currentSectionIndex = Math.max(this.currentSectionIndex - 1, 0);
        this.readCurrentSection();
    }

    goToSection(index) {
        if (index >= 0 && index < this.sections.length) {
            this.currentSectionIndex = index;
            this.readCurrentSection();
        }
    }

    readCurrentSection() {
        const currentSection = this.sections[this.currentSectionIndex];
        const text = currentSection.querySelector('.embedded-text').textContent;
        this.screenReader.stop();
        this.screenReader.setText(text);
        this.textHighlighter.clearHighlights();
        this.screenReader.speak();
        this.scrollToSection(currentSection);
    }

    scrollToSection(section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Highlights the selected screanreader text
class TextHighlighter {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
    }

    highlightSentence(sentenceIndex) {
        const textNodes = this.getTextNodes(this.container);
        let currentIndex = 0;

        textNodes.forEach(node => {
            const sentences = node.textContent.match(/[^\.!\?]+[\.!\?]+/g) || [];
            sentences.forEach((sentence, index) => {
                if (currentIndex === sentenceIndex) {
                    const range = document.createRange();
                    range.setStart(node, node.textContent.indexOf(sentence));
                    range.setEnd(node, node.textContent.indexOf(sentence) + sentence.length);

                    const span = document.createElement('span');
                    span.classList.add('highlighted-sentence');
                    range.surroundContents(span);
                }
                currentIndex++;
            });
        });
    }

    clearHighlights() {
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
        return textNodes;
    }
}


import { Button, Slider } from '@/components/ui/button';

const ScreenReaderMenu = ({ screenReader, navigationControls }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSection, setCurrentSection] = useState(1);
    const [totalSections, setTotalSections] = useState(1);
    const [autoScrollSpeed, setAutoScrollSpeed] = useState(1);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        setTotalSections(navigationControls.sections.length);
    }, [navigationControls]);

    const togglePlayPause = () => {
        if (isPlaying) {
            screenReader.pause();
        } else {
            screenReader.resume();
        }
        setIsPlaying(!isPlaying);
    };

    const handleFastForward = () => {
        screenReader.fastForward();
    };

    const handleRewind = () => {
        screenReader.rewind();
    };

    const handleNextSection = () => {
        navigationControls.nextSection();
        setCurrentSection(currentSection + 1);
    };

    const handlePreviousSection = () => {
        navigationControls.previousSection();
        setCurrentSection(currentSection - 1);
    };

    const handleSpeedChange = (value) => {
        setAutoScrollSpeed(value);
        screenReader.setAutoScrollSpeed(value);
    };

    const handleLanguageChange = (lang) => {
        screenReader.setLanguage(lang);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
            <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                    <Button onClick={handlePreviousSection} disabled={currentSection === 1}>
                        <SkipBack size={24} />
                    </Button>
                    <Button onClick={handleRewind}>
                        <Rewind size={24} />
                    </Button>
                    <Button onClick={togglePlayPause}>
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </Button>
                    <Button onClick={handleFastForward}>
                        <FastForward size={24} />
                    </Button>
                    <Button onClick={handleNextSection} disabled={currentSection === totalSections}>
                        <SkipForward size={24} />
                    </Button>
                    <Button onClick={() => setShowSettings(!showSettings)}>
                        <Settings size={24} />
                    </Button>
                </div>
                <div className="text-sm">
                    Section {currentSection} of {totalSections}
                </div>
            </div>
            {showSettings && (
                <div className="mt-4">
                    <div className="flex items-center space-x-4">
                        <span>Speed:</span>
                        <Slider
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={autoScrollSpeed}
                            onChange={handleSpeedChange}
                        />
                        <span>{autoScrollSpeed.toFixed(1)}x</span>
                    </div>
                    <div className="mt-2">
                        <span>Language:</span>
                        <Button onClick={() => handleLanguageChange('nl-NL')}>Dutch</Button>
                        <Button onClick={() => handleLanguageChange('en-US')}>English</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreenReaderMenu;



// // Exported functions and variables
// export let currentWordIndex = 0;
// let words = [];
// let autoScrollEnabled = true;

// // Function to set auto-scroll
// export function setAutoScroll(enabled) {
//     autoScrollEnabled = enabled;
//     if (autoScrollEnabled) {
//         $('#auto-scroll-button-text').removeClass('red').addClass('green').text('On');
//         console.log("Auto-scroll is enabled");
//     } else {
//         $('#auto-scroll-button-text').removeClass('green').addClass('red').text('Off');
//         console.log("Auto-scroll is disabled");
//     }
// }

// // Function to render text sections
// export function renderTextSections(quizData) {
//     const embeddedTextContainer = document.querySelector('.embedded-text');
//     const hiddenTextContainer = document.querySelector('.screenreader-text');

//     if (!hiddenTextContainer) {
//         console.error('The hidden text container element was not found.');
//         return;
//     }

//     hiddenTextContainer.style.display = 'none';
//     const textContent = hiddenTextContainer.innerText;
//     words = textContent.split(' ');

//     // Split the embedded text into individual words for highlighting
//     let index = 0;
//     embeddedTextContainer.innerHTML = embeddedTextContainer.innerHTML.replace(/\b(\w+)\b/g, (match) => {
//         return `<span data-word-index="${index++}">${match}</span>`;
//     });
// }

// // Initialize the screen reader with the text sections
// export function initScreenReader() {
//     const screenReader = new SpeechSynthesisUtterance();
//     screenReader.lang = 'nl-NL'; // Set the language to Dutch
//     screenReader.rate = 1; // Set the speech rate to 1
//     screenReader.pitch = 1; // Set the speech pitch to 1
//     screenReader.volume = 1; // Set the speech volume to 1

//     // Set the onend event handler to move to the next word
//     screenReader.onend = () => {
//         currentWordIndex++;
//         if (currentWordIndex < words.length) {
//             readNextWord();
//         }
//     };

//     return screenReader;
// }

// // Read the next word
// export function readNextWord() {
//     if (currentWordIndex >= words.length) {
//         return;
//     }
//     const word = words[currentWordIndex];
//     const screenReader = new SpeechSynthesisUtterance(word);
//     window.speechSynthesis.speak(screenReader);

//     highlightCurrentWord();
// }

// // Highlight the current word
// export function highlightCurrentWord() {
//     const wordElements = document.querySelectorAll('.embedded-text span');
//     wordElements.forEach(element => element.classList.remove('highlight'));

//     const currentWordElement = document.querySelector(`.embedded-text span[data-word-index="${currentWordIndex}"]`);
//     if (currentWordElement) {
//         currentWordElement.classList.add('highlight');

//         // Scroll to the current word if auto-scroll is enabled
//         if (autoScrollEnabled) {
//             currentWordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         }
//     }
// }

// // Event listeners
// document.addEventListener('DOMContentLoaded', () => {
//     renderTextSections(quizData);
// });

// document.getElementById('play-button').addEventListener('click', () => {
//     const screenReader = initScreenReader();
//     readNextWord();
//     setAutoScroll(true); // Enable auto-scroll when playing
// });

// document.getElementById('pause-button').addEventListener('click', () => {
//     window.speechSynthesis.pause();
//     setAutoScroll(false); // Disable auto-scroll when pausing
// });

// document.getElementById('reset-button').addEventListener('click', () => {
//     window.speechSynthesis.cancel();
//     currentWordIndex = 0;
//     setAutoScroll(false); // Disable auto-scroll when resetting
// });

// document.getElementById('start-from-button').addEventListener('click', () => {
//     const startIndex = parseInt(document.getElementById('start-from-input').value, 10);
//     currentWordIndex = startIndex - 1;
//     const screenReader = initScreenReader();
//     readNextWord();
//     setAutoScroll(true); // Enable auto-scroll when starting from a specific point
// });

// document.getElementById('auto-scroll-dropdown-button').addEventListener('click', function () {
//     setAutoScroll(!autoScrollEnabled);
// });

// document.querySelectorAll('.auto-scroll-option').forEach(option => {
//     option.addEventListener('click', function () {
//         const value = this.dataset.value;
//         setAutoScroll(value === 'on');
//         document.getElementById('auto-scroll-dropdown').classList.add('hidden');
//     });
// });

// document.getElementById('close-toolbar-button').addEventListener('click', function () {
//     document.getElementById('toolbar-inner').classList.add('hidden');
// });
