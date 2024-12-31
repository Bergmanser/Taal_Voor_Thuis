// screenreader.js - Core Service Class
export class ScreenReaderService {
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

        // Voice configuration
        this.useExternalTTS = false;
        this.currentVoice = 'female';

        // Initialize voice
        setTimeout(() => this.setBuiltInVoice(), 100);
    }

    setBuiltInVoice() {
        const voices = this.synth.getVoices();
        const dutchFemaleVoice = voices.find(voice =>
            voice.lang === 'nl-NL' && voice.name.includes('Flo'));
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

    setText(text) {
        console.log('Setting text:', text);
        this.sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        this.currentSentenceIndex = 0;
        console.log('Parsed sentences:', this.sentences);
    }

    getSentenceByIndex(index) {
        return this.sentences[index] || null;
    }

    speak(onEndCallback) {
        if (this.isReading) {
            console.log('Already reading, skipping speak()');
            return;
        }

        this.isReading = true;
        this.onEndCallback = onEndCallback;
        this.readNextSentence();
    }

    readNextSentence() {
        if (this.currentSentenceIndex < this.sentences.length) {
            const sentence = this.sentences[this.currentSentenceIndex];
            this.utterance.text = sentence;
            this.utterance.rate = this.autoScrollSpeed;

            console.log('Reading sentence:', sentence);
            this.synth.speak(this.utterance);

            if (this.textHighlighter) {
                this.textHighlighter.highlightSentenceByText(sentence);
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
        this.currentSentenceIndex++;
        console.log('Sentence finished, moving to next one');
        if (this.isReading) {
            this.readNextSentence();
        }
    }

    pause() {
        this.synth.pause();
        this.isReading = false;
        console.log('Speech paused');
    }

    resume() {
        if (!this.isReading) {
            this.synth.resume();
            this.isReading = true;
            console.log('Speech resumed');
        }
    }

    stop() {
        this.synth.cancel();
        this.isReading = false;
        this.currentSentenceIndex = 0;
        console.log('Speech stopped');
    }

    setSpeed(speed) {
        this.autoScrollSpeed = Math.max(0.5, Math.min(2, speed));
        console.log('Speed set to:', this.autoScrollSpeed);
    }

    setVoice(gender) {
        this.currentVoice = gender;
        console.log(`Set voice to ${gender}`);
        if (!this.useExternalTTS) {
            this.setBuiltInVoice();
        }
    }
}

// TextHighlighter.js
export class TextHighlighter {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.currentHighlight = null;
        this.textNodeCache = new Map(); // Cache for text nodes
        this.lastProcessedText = '';

        // Configure the observer
        this.observer = new MutationObserver(() => this.rebuildCache());
        this.observer.observe(this.container, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Initial cache build
        this.rebuildCache();
    }

    // Rebuild the text node cache when content changes
    rebuildCache() {
        this.textNodeCache.clear();
        this.processNode(this.container);
        console.log('Cache rebuilt with nodes:', this.textNodeCache.size);
    }

    // Process nodes recursively to build cache
    processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                this.textNodeCache.set(text, node);
            }
        } else {
            node.childNodes.forEach(child => this.processNode(child));
        }
    }

    // Improved sentence matching using similarity scoring
    findBestMatch(targetSentence) {
        let bestMatch = null;
        let highestScore = 0;

        for (const [cachedText, node] of this.textNodeCache.entries()) {
            const score = this.getSimilarityScore(targetSentence, cachedText);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = node;
            }
        }

        return highestScore > 0.8 ? bestMatch : null; // Threshold for matching
    }

    // Calculate similarity score between two strings
    getSimilarityScore(str1, str2) {
        str1 = str1.toLowerCase().trim();
        str2 = str2.toLowerCase().trim();

        if (str1 === str2) return 1;
        if (str1.includes(str2) || str2.includes(str1)) return 0.9;

        // Calculate Levenshtein distance
        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - (distance / maxLength);
    }

    // Levenshtein distance calculation for fuzzy matching
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                        dp[i - 1][j],    // deletion
                        dp[i][j - 1],    // insertion
                        dp[i - 1][j - 1] // substitution
                    );
                }
            }
        }

        return dp[m][n];
    }

    // Highlight text with improved accuracy and error handling
    highlightSentenceByText(sentenceText) {
        if (!sentenceText || sentenceText === this.lastProcessedText) return;
        this.lastProcessedText = sentenceText;

        console.log('Attempting to highlight:', sentenceText);

        // Clear previous highlight
        this.clearHighlights();

        const textNode = this.findBestMatch(sentenceText);
        if (!textNode) {
            console.warn('No matching text node found for:', sentenceText);
            return;
        }

        try {
            const nodeText = textNode.textContent;
            let startIndex = nodeText.toLowerCase().indexOf(sentenceText.toLowerCase());

            // If exact match fails, try fuzzy matching
            if (startIndex === -1) {
                const words = sentenceText.split(' ');
                for (const word of words) {
                    if (word.length > 4) { // Only match on significant words
                        startIndex = nodeText.toLowerCase().indexOf(word.toLowerCase());
                        if (startIndex !== -1) break;
                    }
                }
            }

            if (startIndex === -1) {
                console.warn('Could not find sentence position in node');
                return;
            }

            // Create highlight
            const range = document.createRange();
            range.setStart(textNode, startIndex);
            range.setEnd(textNode, startIndex + sentenceText.length);

            const highlight = document.createElement('span');
            highlight.className = 'highlighted-sentence';

            // Add smooth transition effect
            highlight.style.transition = 'background-color 0.3s ease';

            try {
                range.surroundContents(highlight);
                this.currentHighlight = highlight;

                // Ensure highlighted text is visible
                highlight.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            } catch (e) {
                console.warn('Failed to create highlight:', e);
                this.attemptPartialHighlight(textNode, sentenceText);
            }
        } catch (e) {
            console.error('Highlighting failed:', e);
        }
    }

    // Attempt to highlight partial matches when exact matching fails
    attemptPartialHighlight(textNode, sentenceText) {
        const words = sentenceText.split(' ');
        const nodeText = textNode.textContent;

        words.forEach(word => {
            if (word.length > 4) { // Only highlight significant words
                const index = nodeText.toLowerCase().indexOf(word.toLowerCase());
                if (index !== -1) {
                    const range = document.createRange();
                    range.setStart(textNode, index);
                    range.setEnd(textNode, index + word.length);

                    const highlight = document.createElement('span');
                    highlight.className = 'highlighted-word';

                    try {
                        range.surroundContents(highlight);
                    } catch (e) {
                        console.warn('Failed to highlight word:', word);
                    }
                }
            }
        });
    }

    // Clear all highlights
    clearHighlights() {
        const highlights = this.container.querySelectorAll('.highlighted-sentence, .highlighted-word');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
            }
            parent.removeChild(highlight);
        });
        this.currentHighlight = null;
    }

    // Add relevant CSS styles to the document
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .highlighted-sentence {
                background-color: rgba(255, 255, 0, 0.3);
                border-radius: 3px;
                padding: 2px 0;
                transition: background-color 0.3s ease;
            }
            
            .highlighted-word {
                background-color: rgba(255, 255, 0, 0.2);
                border-radius: 2px;
                padding: 1px 0;
            }
            
            @keyframes highlightPulse {
                0% { background-color: rgba(255, 255, 0, 0.3); }
                50% { background-color: rgba(255, 255, 0, 0.4); }
                100% { background-color: rgba(255, 255, 0, 0.3); }
            }
            
            .highlighted-sentence {
                animation: highlightPulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }
}


















// // ScreenReaderManager.js

// // ScreenReaderService handles text-to-speech operations
// class ScreenReaderService {
//     constructor() {
//         this.synth = window.speechSynthesis;
//         this.utterance = new SpeechSynthesisUtterance();
//         this.isReading = false;
//         this.currentSentenceIndex = 0;
//         this.sentences = [];
//         this.autoScrollSpeed = 1; // Default speed
//         this.lang = 'nl-NL'; // Default language (Dutch)

//         this.utterance.lang = this.lang;
//         this.utterance.onend = () => this.onSentenceEnd();
//     }

//     setText(text) {
//         this.sentences = text.match(/[^.!?]+[.!?]+/g) || [];
//         this.currentSentenceIndex = 0;
//     }

//     speak() {
//         if (this.isReading) return;
//         this.isReading = true;
//         this.readNextSentence();
//     }

//     pause() {
//         this.synth.pause();
//         this.isReading = false;
//     }

//     resume() {
//         if (this.sentences.length === 0) return;
//         this.synth.resume();
//         this.isReading = true;
//     }

//     stop() {
//         this.synth.cancel();
//         this.isReading = false;
//         this.currentSentenceIndex = 0;
//     }

//     readNextSentence() {
//         if (this.currentSentenceIndex < this.sentences.length) {
//             this.utterance.text = this.sentences[this.currentSentenceIndex];
//             this.utterance.rate = this.autoScrollSpeed;
//             this.synth.speak(this.utterance);
//         } else {
//             this.isReading = false;
//         }
//     }

//     onSentenceEnd() {
//         this.currentSentenceIndex++;
//         if (this.isReading) {
//             this.readNextSentence();
//         }
//     }

//     setAutoScrollSpeed(speed) {
//         this.autoScrollSpeed = speed;
//     }

//     setLanguage(lang) {
//         this.lang = lang;
//         this.utterance.lang = lang;
//     }

//     fastForward() {
//         this.currentSentenceIndex = Math.min(this.currentSentenceIndex + 1, this.sentences.length - 1);
//         this.synth.cancel();
//         if (this.isReading) this.readNextSentence();
//     }

//     rewind() {
//         this.currentSentenceIndex = Math.max(this.currentSentenceIndex - 1, 0);
//         this.synth.cancel();
//         if (this.isReading) this.readNextSentence();
//     }
// }

// // NavigationControls manages section navigation
// class NavigationControls {
//     constructor(screenReader, textHighlighter) {
//         this.screenReader = screenReader;
//         this.textHighlighter = textHighlighter;
//         this.sections = document.querySelectorAll('.embedded-text-section');
//         this.currentSectionIndex = 0;
//     }

//     nextSection() {
//         this.currentSectionIndex = Math.min(this.currentSectionIndex + 1, this.sections.length - 1);
//         this.readCurrentSection();
//     }

//     previousSection() {
//         this.currentSectionIndex = Math.max(this.currentSectionIndex - 1, 0);
//         this.readCurrentSection();
//     }

//     readCurrentSection() {
//         const currentSection = this.sections[this.currentSectionIndex];
//         const text = currentSection.querySelector('.embedded-text').textContent;
//         this.screenReader.stop();
//         this.screenReader.setText(text);
//         this.textHighlighter.clearHighlights();
//         this.screenReader.speak();
//         this.scrollToSection(currentSection);
//     }

//     scrollToSection(section) {
//         section.scrollIntoView({ behavior: 'smooth', block: 'start' });
//     }
// }

// // TextHighlighter highlights the active text
// class TextHighlighter {
//     constructor(containerSelector) {
//         this.container = document.querySelector(containerSelector);
//     }

//     highlightSentence(sentenceIndex) {
//         const textNodes = this.getTextNodes(this.container);
//         let currentIndex = 0;

//         textNodes.forEach(node => {
//             const sentences = node.textContent.match(/[^.!?]+[.!?]+/g) || [];
//             sentences.forEach((sentence) => {
//                 if (currentIndex === sentenceIndex) {
//                     const range = document.createRange();
//                     range.setStart(node, node.textContent.indexOf(sentence));
//                     range.setEnd(node, node.textContent.indexOf(sentence) + sentence.length);

//                     const span = document.createElement('span');
//                     span.classList.add('highlighted-sentence');
//                     range.surroundContents(span);
//                 }
//                 currentIndex++;
//             });
//         });
//     }

//     clearHighlights() {
//         const highlights = this.container.querySelectorAll('.highlighted-sentence');
//         highlights.forEach(highlight => {
//             const parent = highlight.parentNode;
//             while (highlight.firstChild) {
//                 parent.insertBefore(highlight.firstChild, highlight);
//             }
//             parent.removeChild(highlight);
//         });
//     }

//     getTextNodes(node) {
//         const textNodes = [];
//         const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
//         let currentNode;
//         while ((currentNode = walker.nextNode())) {
//             textNodes.push(currentNode);
//         }
//         return textNodes;
//     }
// }

// // ScreenReaderMenu defines the toolbar UI and controls
// class ScreenReaderMenu {
//     constructor(screenReader, navigationControls) {
//         this.screenReader = screenReader;
//         this.navigationControls = navigationControls;
//         this.isPlaying = false;
//         this.autoScrollSpeed = 1;

//         this.init();
//     }

//     init() {
//         this.createMenuElement();
//         this.attachEventListeners();
//     }

//     createMenuElement() {
//         this.container = document.createElement('div');
//         this.container.className = 'sigma-screenreader-toolbar hidden';
//         this.container.innerHTML = `
//             <button id="sr-prev" class="sr-button">
//                 <span class="material-symbols-outlined">skip_previous</span>
//             </button>
//             <button id="sr-play-pause" class="sr-button">
//                 <span id="sr-play-icon" class="material-symbols-outlined">play_arrow</span>
//                 <span id="sr-pause-icon" class="material-symbols-outlined hidden">pause</span>
//             </button>
//             <button id="sr-next" class="sr-button">
//                 <span class="material-symbols-outlined">skip_next</span>
//             </button>
//             <select id="sr-voice-select" class="sr-dropdown">
//                 <option value="nl-NL">Dutch</option>
//                 <option value="en-US">English</option>
//             </select>
//             <div id="sr-settings-panel" class="settings-panel hidden">
//                 <label for="sr-speed-slider">Speed:</label>
//                 <input type="range" id="sr-speed-slider" min="0.5" max="2" step="0.1" value="${this.autoScrollSpeed}">
//                 <span id="sr-speed-value">${this.autoScrollSpeed.toFixed(1)}x</span>
//             </div>
//         `;
//         document.body.appendChild(this.container);
//     }

//     attachEventListeners() {
//         this.container.querySelector('#sr-play-pause').addEventListener('click', () => this.togglePlayPause());
//         this.container.querySelector('#sr-prev').addEventListener('click', () => this.navigationControls.previousSection());
//         this.container.querySelector('#sr-next').addEventListener('click', () => this.navigationControls.nextSection());
//         this.container.querySelector('#sr-voice-select').addEventListener('change', (e) => this.screenReader.setLanguage(e.target.value));
//         this.container.querySelector('#sr-speed-slider').addEventListener('input', (e) => this.updateSpeed(e.target.value));
//     }

//     togglePlayPause() {
//         const playIcon = this.container.querySelector('#sr-play-icon');
//         const pauseIcon = this.container.querySelector('#sr-pause-icon');

//         if (this.isPlaying) {
//             this.screenReader.pause();
//             playIcon.classList.remove('hidden');
//             pauseIcon.classList.add('hidden');
//         } else {
//             this.screenReader.resume();
//             playIcon.classList.add('hidden');
//             pauseIcon.classList.remove('hidden');
//         }

//         this.isPlaying = !this.isPlaying;
//     }

//     updateSpeed(value) {
//         this.autoScrollSpeed = parseFloat(value);
//         this.screenReader.setAutoScrollSpeed(this.autoScrollSpeed);
//         this.container.querySelector('#sr-speed-value').textContent = `${this.autoScrollSpeed.toFixed(1)}x`;
//     }
// }

// // Export components for use in other files
// export { ScreenReaderService, NavigationControls, TextHighlighter, ScreenReaderMenu };


// class ScreenReaderMenu {
//     constructor(screenReader, navigationControls) {
//         this.screenReader = screenReader;
//         this.navigationControls = navigationControls;
//         this.isPlaying = false;
//         this.currentSection = 1;
//         this.totalSections = navigationControls.sections.length;
//         this.autoScrollSpeed = 1;
//         this.container = null;

//         this.createMenuElement();
//         this.attachEventListeners();
//     }

//     createMenuElement() {
//         this.container = document.createElement('div');
//         this.container.className = 'screen-reader-menu';
//         this.container.innerHTML = `
//         <div class="menu-controls">
//           <button id="sr-prev-section" class="sr-button" ${this.currentSection === 1 ? 'disabled' : ''}>⏮️</button>
//           <button id="sr-rewind" class="sr-button">⏪</button>
//           <button id="sr-play-pause" class="sr-button">▶️</button>
//           <button id="sr-fast-forward" class="sr-button">⏩</button>
//           <button id="sr-next-section" class="sr-button" ${this.currentSection === this.totalSections ? 'disabled' : ''}>⏭️</button>
//           <button id="sr-settings" class="sr-button">⚙️</button>
//         </div>
//         <div class="section-info">Section ${this.currentSection} of ${this.totalSections}</div>
//         <div id="sr-settings-panel" class="settings-panel" style="display: none;">
//           <div class="speed-control">
//             <label for="sr-speed-slider">Speed: </label>
//             <input type="range" id="sr-speed-slider" min="0.5" max="2" step="0.1" value="${this.autoScrollSpeed}">
//             <span id="sr-speed-value">${this.autoScrollSpeed.toFixed(1)}x</span>
//           </div>
//           <div class="language-control">
//             <button id="sr-lang-nl" class="sr-button">Dutch</button>
//             <button id="sr-lang-en" class="sr-button">English</button>
//           </div>
//         </div>
//       `;

//         document.body.appendChild(this.container);
//     }

//     attachEventListeners() {
//         this.container.querySelector('#sr-play-pause').addEventListener('click', () => this.togglePlayPause());
//         this.container.querySelector('#sr-rewind').addEventListener('click', () => this.screenReader.rewind());
//         this.container.querySelector('#sr-fast-forward').addEventListener('click', () => this.screenReader.fastForward());
//         this.container.querySelector('#sr-prev-section').addEventListener('click', () => this.handlePreviousSection());
//         this.container.querySelector('#sr-next-section').addEventListener('click', () => this.handleNextSection());
//         this.container.querySelector('#sr-settings').addEventListener('click', () => this.toggleSettings());
//         this.container.querySelector('#sr-speed-slider').addEventListener('input', (e) => this.handleSpeedChange(e.target.value));
//         this.container.querySelector('#sr-lang-nl').addEventListener('click', () => this.handleLanguageChange('nl-NL'));
//         this.container.querySelector('#sr-lang-en').addEventListener('click', () => this.handleLanguageChange('en-US'));
//     }

//     togglePlayPause() {
//         if (this.isPlaying) {
//             this.screenReader.pause();
//             this.container.querySelector('#sr-play-pause').textContent = '▶️';
//         } else {
//             this.screenReader.resume();
//             this.container.querySelector('#sr-play-pause').textContent = '⏸️';
//         }
//         this.isPlaying = !this.isPlaying;
//     }

//     handlePreviousSection() {
//         this.navigationControls.previousSection();
//         this.updateSectionInfo(--this.currentSection);
//     }

//     handleNextSection() {
//         this.navigationControls.nextSection();
//         this.updateSectionInfo(++this.currentSection);
//     }

//     updateSectionInfo(newSection) {
//         this.currentSection = newSection;
//         this.container.querySelector('.section-info').textContent = `Section ${this.currentSection} of ${this.totalSections}`;
//         this.container.querySelector('#sr-prev-section').disabled = this.currentSection === 1;
//         this.container.querySelector('#sr-next-section').disabled = this.currentSection === this.totalSections;
//     }

//     toggleSettings() {
//         const settingsPanel = this.container.querySelector('#sr-settings-panel');
//         settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
//     }

//     handleSpeedChange(value) {
//         this.autoScrollSpeed = parseFloat(value);
//         this.screenReader.setAutoScrollSpeed(this.autoScrollSpeed);
//         this.container.querySelector('#sr-speed-value').textContent = `${this.autoScrollSpeed.toFixed(1)}x`;
//     }

//     handleLanguageChange(lang) {
//         this.screenReader.setLanguage(lang);
//     }
// }


// class ScreenReaderService {
//     constructor() {
//         this.synth = window.speechSynthesis;
//         this.utterance = new SpeechSynthesisUtterance();
//         this.isReading = false;
//         this.currentSentenceIndex = 0;
//         this.sentences = [];
//         this.autoScrollSpeed = 1; // Default speed
//         this.lang = 'nl-NL'; // Default to Dutch

//         this.utterance.lang = this.lang;
//         this.utterance.onend = () => this.onSentenceEnd();
//     }

//     setText(text) {
//         this.sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
//         this.currentSentenceIndex = 0;
//     }

//     speak() {
//         if (this.isReading) return;
//         this.isReading = true;
//         this.readNextSentence();
//     }

//     pause() {
//         this.synth.pause();
//         this.isReading = false;
//     }

//     resume() {
//         this.synth.resume();
//         this.isReading = true;
//     }

//     stop() {
//         this.synth.cancel();
//         this.isReading = false;
//         this.currentSentenceIndex = 0;
//     }

//     readNextSentence() {
//         if (this.currentSentenceIndex < this.sentences.length) {
//             this.utterance.text = this.sentences[this.currentSentenceIndex];
//             this.utterance.rate = this.autoScrollSpeed;
//             this.synth.speak(this.utterance);
//         } else {
//             this.isReading = false;
//         }
//     }

//     onSentenceEnd() {
//         this.currentSentenceIndex++;
//         if (this.isReading) {
//             this.readNextSentence();
//         }
//     }

//     setAutoScrollSpeed(speed) {
//         this.autoScrollSpeed = speed;
//     }

//     setLanguage(lang) {
//         this.lang = lang;
//         this.utterance.lang = lang;
//     }

//     fastForward() {
//         this.currentSentenceIndex = Math.min(this.currentSentenceIndex + 1, this.sentences.length - 1);
//         this.synth.cancel();
//         if (this.isReading) this.readNextSentence();
//     }

//     rewind() {
//         this.currentSentenceIndex = Math.max(this.currentSentenceIndex - 1, 0);
//         this.synth.cancel();
//         if (this.isReading) this.readNextSentence();
//     }
// }

// // Navigation controls
// class NavigationControls {
//     constructor(screenReader, textHighlighter) {
//         this.screenReader = screenReader;
//         this.textHighlighter = textHighlighter;
//         this.sections = document.querySelectorAll('.embedded-text-section');
//         this.currentSectionIndex = 0;
//     }

//     nextSection() {
//         this.currentSectionIndex = Math.min(this.currentSectionIndex + 1, this.sections.length - 1);
//         this.readCurrentSection();
//     }

//     previousSection() {
//         this.currentSectionIndex = Math.max(this.currentSectionIndex - 1, 0);
//         this.readCurrentSection();
//     }

//     goToSection(index) {
//         if (index >= 0 && index < this.sections.length) {
//             this.currentSectionIndex = index;
//             this.readCurrentSection();
//         }
//     }

//     readCurrentSection() {
//         const currentSection = this.sections[this.currentSectionIndex];
//         const text = currentSection.querySelector('.embedded-text').textContent;
//         this.screenReader.stop();
//         this.screenReader.setText(text);
//         this.textHighlighter.clearHighlights();
//         this.screenReader.speak();
//         this.scrollToSection(currentSection);
//     }

//     scrollToSection(section) {
//         section.scrollIntoView({ behavior: 'smooth', block: 'start' });
//     }
// }

// // Highlights the selected screanreader text
// class TextHighlighter {
//     constructor(containerSelector) {
//         this.container = document.querySelector(containerSelector);
//     }

//     highlightSentence(sentenceIndex) {
//         const textNodes = this.getTextNodes(this.container);
//         let currentIndex = 0;

//         textNodes.forEach(node => {
//             const sentences = node.textContent.match(/[^\.!\?]+[\.!\?]+/g) || [];
//             sentences.forEach((sentence, index) => {
//                 if (currentIndex === sentenceIndex) {
//                     const range = document.createRange();
//                     range.setStart(node, node.textContent.indexOf(sentence));
//                     range.setEnd(node, node.textContent.indexOf(sentence) + sentence.length);

//                     const span = document.createElement('span');
//                     span.classList.add('highlighted-sentence');
//                     range.surroundContents(span);
//                 }
//                 currentIndex++;
//             });
//         });
//     }

//     clearHighlights() {
//         const highlights = this.container.querySelectorAll('.highlighted-sentence');
//         highlights.forEach(highlight => {
//             const parent = highlight.parentNode;
//             while (highlight.firstChild) {
//                 parent.insertBefore(highlight.firstChild, highlight);
//             }
//             parent.removeChild(highlight);
//         });
//     }

//     getTextNodes(node) {
//         const textNodes = [];
//         const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
//         let currentNode;
//         while (currentNode = walker.nextNode()) {
//             textNodes.push(currentNode);
//         }
//         return textNodes;
//     }
// }


// import { Button, Slider } from '@/components/ui/button';

// const ScreenReaderMenu = ({ screenReader, navigationControls }) => {
//     const [isPlaying, setIsPlaying] = useState(false);
//     const [currentSection, setCurrentSection] = useState(1);
//     const [totalSections, setTotalSections] = useState(1);
//     const [autoScrollSpeed, setAutoScrollSpeed] = useState(1);
//     const [showSettings, setShowSettings] = useState(false);

//     useEffect(() => {
//         setTotalSections(navigationControls.sections.length);
//     }, [navigationControls]);

//     const togglePlayPause = () => {
//         if (isPlaying) {
//             screenReader.pause();
//         } else {
//             screenReader.resume();
//         }
//         setIsPlaying(!isPlaying);
//     };

//     const handleFastForward = () => {
//         screenReader.fastForward();
//     };

//     const handleRewind = () => {
//         screenReader.rewind();
//     };

//     const handleNextSection = () => {
//         navigationControls.nextSection();
//         setCurrentSection(currentSection + 1);
//     };

//     const handlePreviousSection = () => {
//         navigationControls.previousSection();
//         setCurrentSection(currentSection - 1);
//     };

//     const handleSpeedChange = (value) => {
//         setAutoScrollSpeed(value);
//         screenReader.setAutoScrollSpeed(value);
//     };

//     const handleLanguageChange = (lang) => {
//         screenReader.setLanguage(lang);
//     };

//     return (
//         <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
//             <div className="flex justify-between items-center">
//                 <div className="flex space-x-2">
//                     <Button onClick={handlePreviousSection} disabled={currentSection === 1}>
//                         <SkipBack size={24} />
//                     </Button>
//                     <Button onClick={handleRewind}>
//                         <Rewind size={24} />
//                     </Button>
//                     <Button onClick={togglePlayPause}>
//                         {isPlaying ? <Pause size={24} /> : <Play size={24} />}
//                     </Button>
//                     <Button onClick={handleFastForward}>
//                         <FastForward size={24} />
//                     </Button>
//                     <Button onClick={handleNextSection} disabled={currentSection === totalSections}>
//                         <SkipForward size={24} />
//                     </Button>
//                     <Button onClick={() => setShowSettings(!showSettings)}>
//                         <Settings size={24} />
//                     </Button>
//                 </div>
//                 <div className="text-sm">
//                     Section {currentSection} of {totalSections}
//                 </div>
//             </div>
//             {showSettings && (
//                 <div className="mt-4">
//                     <div className="flex items-center space-x-4">
//                         <span>Speed:</span>
//                         <Slider
//                             min={0.5}
//                             max={2}
//                             step={0.1}
//                             value={autoScrollSpeed}
//                             onChange={handleSpeedChange}
//                         />
//                         <span>{autoScrollSpeed.toFixed(1)}x</span>
//                     </div>
//                     <div className="mt-2">
//                         <span>Language:</span>
//                         <Button onClick={() => handleLanguageChange('nl-NL')}>Dutch</Button>
//                         <Button onClick={() => handleLanguageChange('en-US')}>English</Button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ScreenReaderMenu;



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
