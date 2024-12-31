import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";
import { createQuizStateManager } from "./quiz_state_manager.js";

// import { ScreenReaderService, NavigationControls, TextHighlighter, ScreenReaderMenu } from "./screenreader_quiztext.js";
// import { ScreenReaderService } from './screenreader/ScreenReaderService.js';
// import { TextHighlighter } from './screenreader/TextHighlighter.js';
// import { NavigationControls } from './screenreader/NavigationControls.js';
// import { ScreenReaderMenu } from './screenreader/ScreenReaderMenu.js';

export let quizData;

document.addEventListener("DOMContentLoaded", function () {
    // Array of background image URLs
    const backgroundImages = [
        '/public/assets/images/quiz_background_1.png',
        '/public/assets/images/quiz_background_2.png',
        '/public/assets/images/quiz_background_3.png',
        '/public/assets/images/quiz_background_4.png',
        '/public/assets/images/quiz_background_5.png'
    ];

    function setRandomBackground() {
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        const selectedImage = backgroundImages[randomIndex];
        console.log('Selected Image:', selectedImage); // Debugging line
        document.body.style.backgroundImage = `url(${selectedImage})`;
    }

    console.log('Running setRandomBackground'); // Debugging line
    setRandomBackground();

    // Initialize screenreader components
    const screenReader = new ScreenReaderService();
    const navigationControls = new NavigationControls(screenReader, new TextHighlighter('#text-section-container'));
    const screenReaderMenu = new ScreenReaderMenu(screenReader, navigationControls);

    // Toolbar toggle logic
    const toggleButton = document.getElementById('screenreader-toggle');
    const toolbar = document.querySelector('.sigma-screenreader-toolbar');

    toggleButton.addEventListener('click', () => {
        toolbar.classList.toggle('hidden');
    });
});

window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    if (!quizId) {
        console.error('No quiz ID provided');
        return;
    }

    const START_BUTTON_KEY = `startButtonClicked_${quizId}`;
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

    const startButton = document.getElementById('start-quiz-button');

    if (!startButton) {
        console.error('Start button not found');
        return;
    }

    const lastClickTimestamp = localStorage.getItem(START_BUTTON_KEY);

    try {
        const stateManager = await createQuizStateManager(quizId, auth.currentUser?.uid);
        const hasExistingState = await stateManager.checkExistingState();

        if (
            (lastClickTimestamp && Date.now() - parseInt(lastClickTimestamp, 10) < THREE_HOURS_MS) ||
            hasExistingState
        ) {
            console.log(
                hasExistingState
                    ? 'Auto-clicking the start button due to existing state'
                    : 'Auto-clicking the start button due to 3-hour condition'
            );
            startButton.click();
        }
    } catch (error) {
        console.error('Error handling reload or initializing stateManager:', error);
    }

    // Add click event listener to store the timestamp in localStorage
    startButton.addEventListener('click', () => {
        localStorage.setItem(START_BUTTON_KEY, Date.now().toString());
    });
});

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

const highlightBoldWords = (text, boldWords) => {
    boldWords.forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        text = text.replace(regex, '<strong>$1</strong>');
    });
    return text;
};

const parseNewEmbeddedTextFormat = (htmlDoc) => {
    const sections = htmlDoc.querySelectorAll('.section-container');
    const structuredData = [];

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
            backOrForeground: img.closest('.background-section').querySelector('.z-index-dropdown').value || 'background',
            containedOrUncontained: img.closest('.background-section').querySelector('.containment-dropdown').value || 'contained'
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
    });

    console.log("Structured Data:", structuredData); // Added log statement

    return structuredData;
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);
        const currentUserUid = user.uid;
        const quizId = getQuizIdFromURL();
        const docRef = doc(db, 'quizzes', quizId);
        const textHighlighter = new TextHighlighter('#text-section-container');
        const textContainer = document.querySelector('.text-section-container');

        getDoc(docRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    quizData = docSnap.data();
                    document.getElementById('quiz-title').innerText = quizData.quizTitle;

                    // Show/hide word list button based on begrippen availability
                    const wordListButton = document.getElementById('word-list-button');
                    if (wordListButton) {
                        wordListButton.classList.toggle('hidden', !quizData?.Begrippen?.length);
                    }

                    if (quizData.embedTextHTML) {
                        const htmlDoc = new DOMParser().parseFromString(quizData.embedTextHTML, 'text/html');
                        const sections = htmlDoc.querySelectorAll('*');

                        let currentSection;
                        let previousElementClass = '';

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

                        document.getElementById('start-quiz-button').style.display = 'block';

                        const textContainer = document.getElementById('text-section-container');

                        // Populate sections for NavigationControls
                        const navigationControls = new NavigationControls(
                            screenReader,
                            new TextHighlighter('#text-section-container')
                        );

                        // Handle dynamic section creation
                        quizData.embedTextHTML && populateSections(quizData.embedTextHTML, textContainer);
                    } else {
                        document.querySelector('.embedded-text-section').innerText = 'No embedded text provided.';
                    }
                    const swapButton = document.createElement('button');
                    swapButton.id = 'swap-layers-button';
                    swapButton.textContent = 'Swap Layers';
                    swapButton.style.display = 'none';
                    swapButton.addEventListener('click', () => {
                        document.querySelector('.text-section-container').classList.toggle('hidden');
                        document.querySelector('.quiz-window-container').classList.toggle('hidden');
                    });
                    document.body.appendChild(swapButton);
                } else {
                    console.log('No such document!');
                }
            })
            .catch((error) => {
                console.log('Error getting document:', error);
            });
    } else {
        redirectUserBasedOnRole(null);
    }
});

const getQuizIdFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('quizId');
};

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    console.log('Quiz ID:', quizId);

    if (!quizId) {
        console.error('No quiz ID provided');
        return;
    }

    try {
        // Get quiz data
        const quizDocRef = doc(db, "quizzes", quizId);
        const quizDocSnap = await getDoc(quizDocRef);

        if (!quizDocSnap.exists()) {
            console.log("No such document!");
            window.location.href = "student_dashboard.html";
            return;
        }

        quizData = quizDocSnap.data();

        // Initialize stateManager after auth check
        const user = auth.currentUser;
        if (!user) {
            console.error('No user authenticated');
            return;
        }

        // Create state manager instance
        const stateManager = await createQuizStateManager(quizId, user.uid);

        // Check for existing state
        const hasExistingState = await stateManager.checkExistingState();
        console.log('Has existing state:', hasExistingState);

        // Setup auto-start functionality
        if (hasExistingState) {
            console.log('Found existing state, attempting auto-start');
            const startButton = document.getElementById('start-quiz-button');
            if (startButton) {
                setTimeout(() => {
                    console.log('Auto-starting quiz');
                    startButton.click();
                }, 100);
            }
        }

        // Display quiz content
        if (quizData) {
            console.log("Document data:", quizData);
            document.querySelector('.title').innerText = quizData.Title;

            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(quizData.EmbeddedText, 'text/html');

            const oldFormat = !htmlDoc.querySelector('.section-container');
            let processedTextSections = oldFormat ?
                parseOldEmbeddedTextFormat(htmlDoc) :
                parseNewEmbeddedTextFormat(htmlDoc);

            displayTextSections(processedTextSections, oldFormat);

        } else {
            console.log('quizData is null or undefined');
        }

    } catch (error) {
        console.error('Error initializing quiz:', error);
    }
});

const parseOldEmbeddedTextFormat = (htmlDoc) => {
    const textElements = htmlDoc.body.childNodes;
    const textSections = [];

    textElements.forEach((element) => {
        if (element.nodeType === Node.TEXT_NODE) {
            const text = element.textContent;
            textSections.push(text);
        } else if (element.tagName) {
            const tagName = element.tagName.toLowerCase();
            const html = element.outerHTML;
            textSections.push(html);
        }
    });

    const processedTextSections = textSections.map((text) => {
        const htmlElement = htmlDoc.createElement('div');
        htmlElement.innerHTML = text;
        const elements = htmlElement.childNodes;

        function applyCssClasses(element) {
            if (element.nodeType === Node.TEXT_NODE) {
            } else if (element.tagName) {
                const tagName = element.tagName.toLowerCase();
                element.classList.add(getCssClassForTag(tagName));
            }

            element.childNodes.forEach(child => applyCssClasses(child));
        }

        elements.forEach(element => applyCssClasses(element));

        return htmlElement.innerHTML;
    });

    return processedTextSections;
};

const displayTextSections = (processedTextSections, oldFormat) => {
    const textContainer = document.getElementById('text-section-container');
    textContainer.innerHTML = '';

    if (oldFormat) {
        processedTextSections.forEach((section, index) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'embedded-text-section';
            sectionDiv.innerHTML = `<div class="embedded-text">${section}</div>`;
            textContainer.appendChild(sectionDiv);
        });
    } else {
        processedTextSections.forEach((section, index) => {
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

const logLayerVisibility = () => {
    console.log('Content Layer Visible:', !document.querySelector('.text-section-container').classList.contains('hidden'));
    console.log('Quiz Layer Visible:', !document.querySelector('.quiz-window-container').classList.contains('hidden'));
};

logLayerVisibility();

document.getElementById('start-quiz-button').addEventListener('click', () => {
    const quizContainer = document.getElementById('quiz-window-container');
    const textContainer = document.querySelector('.text-section-container');
    quizContainer.classList.remove('hidden', 'inactive-quiz-window-container');
    quizContainer.style.position = 'absolute';
    quizContainer.style.top = `${textContainer.offsetTop}px`;
    quizContainer.style.right = '0';
    document.getElementById('start-quiz-button').classList.add('hidden');
    logLayerVisibility();
});

const hideEmptySections = () => {
    const embeddedTexts = document.querySelectorAll('.embedded-text');
    embeddedTexts.forEach(section => {
        if (!section.innerHTML.trim()) {
            section.closest('.embedded-text-section').classList.add('hidden');
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    hideEmptySections();
});

// Add button for swapping between layers
document.addEventListener('DOMContentLoaded', () => {
    const swapButton = document.getElementById('swap-layers-button');
    const quizContainer = document.querySelector('.quiz-container');
    const quizWindow = document.querySelector('.quiz-window-container');

    swapButton.addEventListener('click', () => {
        if (quizWindow.classList.contains('inactive-quiz-window-container')) {
            quizWindow.classList.remove('inactive-quiz-window-container');
            quizWindow.classList.remove('hidden');
            quizContainer.classList.add('active');
        } else {
            quizWindow.classList.add('inactive-quiz-window-container');
            quizContainer.classList.remove('active');
        }
    });

    const startQuizButton = document.querySelector('.start-quiz-button');

    if (startQuizButton) {
        startQuizButton.addEventListener('click', () => {
            quizContainer.classList.add('active');
            startQuizButton.classList.add('hidden');

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            quizWindow.classList.remove('inactive-quiz-window-container', 'hidden');
            swapButton.classList.remove('hidden');
        });
    }

    quizWindow.addEventListener('transitionend', (event) => {
        if (quizWindow.classList.contains('inactive-quiz-window-container')) {
            quizWindow.classList.add('hidden');
        } else {
            quizWindow.classList.remove('hidden');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const startQuizButton = document.querySelector('.start-quiz-button');
    const quizContainer = document.querySelector('.quiz-container');

    if (startQuizButton) {
        startQuizButton.addEventListener('click', () => {
            quizContainer.classList.add('active');
            startQuizButton.classList.add('hidden');

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            const quizWindowContainer = document.getElementById('quiz-window-container');
            quizWindowContainer.classList.remove('inactive-quiz-window-container', 'hidden');

            const swapButton = document.getElementById('swap-layers-button');
            if (swapButton) {
                swapButton.style.display = 'block';
            }
        });
    }
});

// Add an event listener to set display to none after the transition ends
document.getElementById('quiz-window-container').addEventListener('transitionend', (event) => {
    const quizWindow = document.getElementById('quiz-window-container');
    if (quizWindow.classList.contains('inactive-quiz-window-container')) {
        quizWindow.classList.add('hidden');
    } else {
        quizWindow.classList.remove('hidden');
    }
});

document.getElementById('swap-layers-button').addEventListener('click', function () {
    const quizWindow = document.querySelector('.quiz-window-container');
    this.classList.toggle('flipped');

    if (quizWindow.classList.contains('inactive-quiz-window-container')) {
        // Opening animation
        // quizWindow.classList.remove('inactive-quiz-window-container');
        // quizWindow.classList.add('active-quiz-window-container');
        this.classList.remove('shifted');
    } else {
        // Closing animation
        // quizWindow.classList.remove('active-quiz-window-container');
        // quizWindow.classList.add('inactive-quiz-window-container');
        this.classList.add('shifted');
    }
});

document.addEventListener('scroll', () => {
    const container = document.querySelector('.proto-quiz-container');
    const scrollY = window.scrollY;

    // Adjust margin-top dynamically
    const maxMargin = 13;
    const minMargin = 2;
    const newMargin = Math.max(minMargin, maxMargin - (scrollY / 100));

    container.style.marginTop = `${newMargin}%`;
});

if (typeof quizData === 'undefined') {
    quizData = {
        Begrippen: [
            { term: "Beperkt", definition: "Iets dat niet veel ruimte of mogelijkheden heeft." },
            { term: "Ceremoniële", definition: "Te maken met officiële gebeurtenissen." }
        ]
    };
}

function initBegrippenLogic() {
    const popup = document.getElementById('begrippen-popup');
    const content = document.querySelector('.begrippen-content');
    const container = document.getElementById('begrippen-container');
    const searchInput = document.getElementById('begrippen-search');
    const gridViewBtn = document.querySelector('.grid-view');
    const listViewBtn = document.querySelector('.list-view');
    const closeBtn = document.querySelector('.close-btn');
    const wordListButton = document.getElementById('word-list-button');

    // Define soft colors for the cards
    const cardColors = ["#f8f9fa", "#e8eaf6", "#ffe4b5", "#e0f7fa", "#ffebee"];

    // Helper: Update button visibility based on Begrippen content
    function updateButtonVisibility() {
        const hasCards = container.querySelector('.begrip-card') !== null; // Check for Begrippen cards
        const hasNoBegrippen = container.querySelector('.no-begrippen') !== null; // Check for empty placeholder

        // Show the button if Begrippen cards exist; hide otherwise
        wordListButton.classList.toggle('hidden', !hasCards && hasNoBegrippen);
    }

    // Render Begrippen
    function renderBegrippen(begrippen = [], searchTerm = '') {
        container.innerHTML = '';

        // No Begrippen available at all
        if (!begrippen.length) {
            container.innerHTML = `
                <div class="no-begrippen">
                    <p>Voor deze tekst zijn er geen begrippen</p>
                </div>`;
            updateButtonVisibility();
            return;
        }

        // Filter Begrippen based on the search term
        const filteredBegrippen = begrippen.filter(item =>
            item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.definition.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // If no Begrippen match the search term, show the placeholder
        if (filteredBegrippen.length === 0) {
            container.innerHTML = `
                <div class="no-begrippen">
                    <p>Er zijn geen begrippen beschikbaar voor deze zoek opdracht</p>
                </div>`;
            updateButtonVisibility();
            return;
        }

        // Render Begrippen cards if matches are found
        filteredBegrippen.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'begrip-card';
            // Assign one of the five colors cyclically
            card.style.backgroundColor = cardColors[index % cardColors.length];
            card.style.animationDelay = `${index * 50}ms`; // Staggered animation
            card.innerHTML = `<h3>${item.term}</h3><p>${item.definition}</p>`;
            container.appendChild(card);
        });

        updateButtonVisibility();
    }

    // Event handlers
    gridViewBtn?.addEventListener('click', () => {
        container.classList.remove('list-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    });

    listViewBtn?.addEventListener('click', () => {
        container.classList.add('list-view');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    });

    searchInput?.addEventListener('input', (e) => {
        renderBegrippen(quizData.Begrippen, e.target.value);
    });

    content.addEventListener('click', (e) => {
        if (e.target.matches('.close-btn')) {
            console.log('Close button clicked');
            popup.classList.remove('show');
            setTimeout(() => popup.classList.add('hidden'), 300);
        }
    });

    // Allow closing popup by clicking outside
    popup?.addEventListener('click', (e) => {
        if (!content.contains(e.target)) {
            popup.classList.remove('show');
            setTimeout(() => popup.classList.add('hidden'), 300);
        }
    });

    wordListButton?.addEventListener('click', () => {
        popup.classList.remove('hidden');
        setTimeout(() => popup.classList.add('show'), 10);
        renderBegrippen(quizData.Begrippen);
    });

    // Initial rendering of Begrippen
    renderBegrippen(quizData.Begrippen);
}

// Initialize Begrippen logic
initBegrippenLogic();

document.addEventListener('DOMContentLoaded', () => {
    // Initialize screenreader components
    const screenReader = new ScreenReaderService();
    const navigationControls = new NavigationControls(screenReader, new TextHighlighter('#text-section-container'));
    const screenReaderMenu = new ScreenReaderMenu(screenReader, navigationControls);

    // Toolbar toggle logic
    const toggleButton = document.getElementById('screenreader-toggle');
    const toolbar = document.querySelector('.sigma-screenreader-toolbar');

    toggleButton.addEventListener('click', () => {
        toolbar.classList.toggle('hidden');
    });
});





// // Firebase and Core Imports
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// import { app, auth, db } from "./firebase_config.js";
// import { redirectUserBasedOnRole } from "./roleRedirect.js";
// import { createQuizStateManager } from "./quiz_state_manager.js";

// // Screenreader Components Import
// // import {
// //     ScreenReaderService,
// //     NavigationControls,
// //     TextHighlighter,
// //     ScreenReaderMenu
// // } from "./screenreader_quiztext.js";

// // // Global State Management
// export let quizData;

// // Screenreader Component Instances
// let screenReader;
// let textHighlighter;
// let navigationControls;
// let screenReaderMenu;

// // Core initialization function for screenreader components
// function initializeScreenReader() {
//     if (!textHighlighter) {
//         textHighlighter = new TextHighlighter('#text-section-container');
//         textHighlighter.addStyles();
//     }

//     if (!screenReader) {
//         screenReader = new ScreenReaderService(textHighlighter);
//     }

//     if (!navigationControls) {
//         navigationControls = new NavigationControls(screenReader, textHighlighter);
//     }

//     if (!screenReaderMenu) {
//         screenReaderMenu = new ScreenReaderMenu(screenReader, navigationControls);
//     }

//     setupScreenReaderToolbar();
// }

// // Setup toolbar functionality
// function setupScreenReaderToolbar() {
//     const toggleButton = document.getElementById('screenreader-toggle');
//     const toolbar = document.getElementById('screenreader-toolbar');

//     if (toggleButton && toolbar) {
//         toggleButton.addEventListener('click', () => {
//             toolbar.classList.toggle('hidden');

//             if (!toolbar.classList.contains('hidden')) {
//                 const textContainer = document.querySelector('.text-section-container');
//                 if (textContainer) {
//                     const content = textContainer.textContent;
//                     screenReader.setText(content);
//                 }
//             } else {
//                 screenReader.stop();
//             }
//         });
//     }
// }

// // Complete onAuth handler with original functionality
// onAuthStateChanged(auth, async (user) => {
//     if (!user) {
//         redirectUserBasedOnRole(null);
//         return;
//     }

//     try {
//         console.log('Current User Email:', user.email);
//         const currentUserUid = user.uid;
//         const quizId = getQuizIdFromURL(); // Using our existing helper
//         const docRef = doc(db, 'quizzes', quizId);

//         // Initialize highlighting and text container
//         const textHighlighter = new TextHighlighter('#text-section-container');
//         const textContainer = document.querySelector('.text-section-container');

//         const docSnap = await getDoc(docRef);
//         if (!docSnap.exists()) {
//             console.log('No such document!');
//             return;
//         }

//         // Set quiz data
//         quizData = docSnap.data();

//         // Update quiz title and handle word list visibility
//         document.getElementById('quiz-title').innerText = quizData.quizTitle;
//         const wordListButton = document.getElementById('word-list-button');
//         if (wordListButton) {
//             wordListButton.classList.toggle('hidden', !quizData?.Begrippen?.length);
//         }

//         // Handle embedded text processing
//         if (quizData.embedTextHTML) {
//             const htmlDoc = new DOMParser().parseFromString(quizData.embedTextHTML, 'text/html');
//             const sections = htmlDoc.querySelectorAll('*');

//             let currentSection;
//             let previousElementClass = '';

//             // Process sections
//             sections.forEach((section, index) => {
//                 const tagName = section.tagName.toLowerCase();
//                 const cssClass = getCssClassForTag(tagName);
//                 const content = section.innerHTML.trim();

//                 if (tagName === 'h1') {
//                     if (currentSection) {
//                         textContainer.appendChild(currentSection);
//                     }
//                     currentSection = document.createElement('div');
//                     currentSection.className = 'text-section';
//                 }

//                 if (currentSection) {
//                     const element = document.createElement('div');
//                     element.className = cssClass;
//                     element.innerHTML = content;
//                     currentSection.appendChild(element);
//                 }

//                 if (index === sections.length - 1 && currentSection) {
//                     textContainer.appendChild(currentSection);
//                 }

//                 previousElementClass = cssClass;
//             });

//             // Show start button after content is loaded
//             document.getElementById('start-quiz-button').style.display = 'block';

//             // Initialize navigation controls with new content
//             const navigationControls = new NavigationControls(
//                 screenReader,
//                 textHighlighter
//             );

//             // Handle dynamic section creation if needed
//             if (quizData.embedTextHTML) {
//                 populateSections(quizData.embedTextHTML, textContainer);
//             }
//         } else {
//             // Handle case where no embedded text is provided
//             document.querySelector('.embedded-text-section').innerText = 'No embedded text provided.';
//         }

//         // Initialize swap button
//         const swapButton = document.createElement('button');
//         swapButton.id = 'swap-layers-button';
//         swapButton.textContent = 'Swap Layers';
//         swapButton.style.display = 'none';
//         swapButton.addEventListener('click', () => {
//             document.querySelector('.text-section-container').classList.toggle('hidden');
//             document.querySelector('.quiz-window-container').classList.toggle('hidden');
//             logLayerVisibility(); // Log layer state changes
//         });
//         document.body.appendChild(swapButton);

//         // Handle existing state
//         const stateManager = await createQuizStateManager(quizId, currentUserUid);
//         const hasExistingState = await stateManager.checkExistingState();
//         if (hasExistingState) {
//             console.log('Found existing state, attempting auto-start');
//             const startButton = document.getElementById('start-quiz-button');
//             if (startButton) {
//                 setTimeout(() => {
//                     console.log('Auto-starting quiz');
//                     startButton.click();
//                 }, 100);
//             }
//         }

//     } catch (error) {
//         console.error('Error processing quiz:', error);
//         handleError(error);
//     }
// });

// // Helper function for populating sections (restored from original)
// function populateSections(embedTextHTML, container) {
//     const parser = new DOMParser();
//     const htmlDoc = parser.parseFromString(embedTextHTML, 'text/html');
//     const oldFormat = !htmlDoc.querySelector('.section-container');

//     let processedTextSections = oldFormat ?
//         parseOldEmbeddedTextFormat(htmlDoc) :
//         parseNewEmbeddedTextFormat(htmlDoc);

//     displayTextSections(processedTextSections, oldFormat);
// }

// // Function to handle content updates for screenreader
// function handleContentUpdate(newContent) {
//     if (screenReader) {
//         screenReader.stop();
//         screenReader.setText(newContent);
//     }

//     if (textHighlighter) {
//         textHighlighter.clearHighlights();
//     }
// }

// // Core quiz state checking function
// async function checkQuizState(quizId, userId) {
//     try {
//         const stateManager = await createQuizStateManager(quizId, userId);
//         const hasExistingState = await stateManager.checkExistingState();

//         if (hasExistingState) {
//             const startButton = document.getElementById('start-quiz-button');
//             if (startButton && !startButton.classList.contains('hidden')) {
//                 console.log('Reloaded with active state, auto-starting quiz');
//                 startButton.click();
//             }
//         }

//         return stateManager;
//     } catch (error) {
//         console.error('Error checking quiz state:', error);
//         return null;
//     }
// }

// // Helper function to get quiz ID from URL (consolidated version)
// const getQuizIdFromURL = () => {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get('id') || urlParams.get('quizId'); // Handle both URL parameter formats
// };

// // Error handling function
// const handleError = (error) => {
//     console.error('Quiz loading error:', error);
//     const errorContainer = document.createElement('div');
//     errorContainer.className = 'error-message';
//     errorContainer.textContent = 'Er is een fout opgetreden bij het laden van de quiz.';
//     document.body.appendChild(errorContainer);
// };

// // Background image configuration
// const backgroundImages = [
//     '/public/assets/images/quiz_background_1.png',
//     '/public/assets/images/quiz_background_2.png',
//     '/public/assets/images/quiz_background_3.png',
//     '/public/assets/images/quiz_background_4.png',
//     '/public/assets/images/quiz_background_5.png'
// ];

// function setRandomBackground() {
//     const randomIndex = Math.floor(Math.random() * backgroundImages.length);
//     const selectedImage = backgroundImages[randomIndex];
//     console.log('Selected Image:', selectedImage);
//     document.body.style.backgroundImage = `url(${selectedImage})`;
// }

// // Default quiz data setup
// if (typeof quizData === 'undefined') {
//     quizData = {
//         Begrippen: [
//             { term: "Beperkt", definition: "Iets dat niet veel ruimte of mogelijkheden heeft." },
//             { term: "Ceremoniële", definition: "Te maken met officiële gebeurtenissen." }
//         ]
//     };
// }

// // CSS class helper functions
// const getCssClassForTag = (tag) => {
//     const tagName = tag.toLowerCase();
//     switch (tagName) {
//         case 'h1': return 'embedded-text-h1';
//         case 'h2': return 'embedded-text-h2';
//         case 'h3': return 'embedded-text-h3';
//         case 'h4': return 'embedded-text-h4';
//         case 'p': return 'embedded-text-p';
//         case 'b': return 'embedded-text-b';
//         case 'strong': return 'embedded-text-strong';
//         case 'img': return 'embedded-text-img';
//         case 'span': return 'embedded-text-span';
//         default: return 'embedded-text-default';
//     }
// };

// // Text processing helpers
// const highlightBoldWords = (text, boldWords) => {
//     boldWords.forEach(word => {
//         const regex = new RegExp(`(${word})`, 'gi');
//         text = text.replace(regex, '<strong>$1</strong>');
//     });
//     return text;
// };

// // Parse embedded text format
// const parseNewEmbeddedTextFormat = (htmlDoc) => {
//     const sections = htmlDoc.querySelectorAll('.section-container');
//     const structuredData = [];

//     sections.forEach((section, index) => {
//         const sectionType = section.querySelector('.section').classList[1];
//         const content = section.querySelector('.section-content');
//         const boldWords = Array.from(content.querySelectorAll('b')).map(b => b.innerText);
//         const borderColor = content.style.borderColor || 'rgb(12, 157, 18)';
//         const textColor = content.style.color || 'rgb(0, 0, 0)';
//         const images = section.querySelectorAll('img');
//         const imageDetails = Array.from(images).map(img => ({
//             src: img.src,
//             positionOnPage: img.style.position || [],
//             backOrForeground: img.closest('.background-section')?.querySelector('.z-index-dropdown')?.value || 'background',
//             containedOrUncontained: img.closest('.background-section')?.querySelector('.containment-dropdown')?.value || 'contained'
//         }));

//         let textContent = content.innerHTML.replace(/<b>|<\/b>/g, '');
//         textContent = highlightBoldWords(textContent, boldWords);

//         structuredData.push({
//             SectionNumber: index + 1,
//             Boldwords: boldWords,
//             BorderColor: borderColor,
//             TextColor: textColor,
//             SectionType: sectionType,
//             Images: Array.from(images).map(img => img.src),
//             ImageDetails: imageDetails,
//             Text: textContent
//         });
//     });

//     console.log("Structured Data:", structuredData);
//     return structuredData;
// };

// const parseOldEmbeddedTextFormat = (htmlDoc) => {
//     const textElements = htmlDoc.body.childNodes;
//     const textSections = [];

//     textElements.forEach((element) => {
//         if (element.nodeType === Node.TEXT_NODE) {
//             const text = element.textContent;
//             textSections.push(text);
//         } else if (element.tagName) {
//             const html = element.outerHTML;
//             textSections.push(html);
//         }
//     });

//     return textSections.map((text) => {
//         const htmlElement = htmlDoc.createElement('div');
//         htmlElement.innerHTML = text;
//         const elements = htmlElement.childNodes;

//         function applyCssClasses(element) {
//             if (element.nodeType === Node.TEXT_NODE) {
//                 return;
//             }
//             if (element.tagName) {
//                 element.classList.add(getCssClassForTag(element.tagName.toLowerCase()));
//             }
//             element.childNodes.forEach(child => applyCssClasses(child));
//         }

//         elements.forEach(element => applyCssClasses(element));
//         return htmlElement.innerHTML;
//     });
// };

// // Enhanced quiz data initialization
// function initializeQuizData(data) {
//     quizData = {
//         ...data,
//         // Default values if not provided
//         Begrippen: data.Begrippen || [],
//         Title: data.Title || 'Untitled Quiz',
//         embedTextHTML: data.embedTextHTML || ''
//     };

//     // Update UI based on quiz data
//     updateQuizUI(quizData);
// }

// // UI updates based on quiz data
// function updateQuizUI(quizData) {
//     // Title setting with fallback
//     const titleElement = document.getElementById('quiz-title');
//     if (titleElement) {
//         titleElement.innerText = quizData.quizTitle || quizData.Title || 'Untitled Quiz';
//     }

//     // Enhanced word list button handling
//     const wordListButton = document.getElementById('word-list-button');
//     if (wordListButton) {
//         const hasBegrippen = quizData?.Begrippen?.length > 0;
//         wordListButton.classList.toggle('hidden', !hasBegrippen);
//         if (hasBegrippen) {
//             initBegrippenLogic(quizData.Begrippen);
//         }
//     }

//     // Text container setup
//     setupTextContainer();
// }

// // Enhanced text container management
// function setupTextContainer() {
//     const textContainer = document.querySelector('.text-section-container');
//     if (!textContainer) {
//         console.warn('Text container not found');
//         return;
//     }

//     // Clear existing content
//     textContainer.innerHTML = '';

//     // Add necessary attributes
//     textContainer.setAttribute('role', 'article');
//     textContainer.setAttribute('aria-label', 'Quiz Content');

//     // Set up content observers
//     initializeContentObservers(textContainer);
// }

// // Enhanced text section processing
// function processTextSections(htmlContent) {
//     const parser = new DOMParser();
//     const htmlDoc = parser.parseFromString(htmlContent, 'text/html');

//     // Determine format and process accordingly
//     const isNewFormat = htmlDoc.querySelector('.section-container');

//     return {
//         sections: isNewFormat ?
//             parseNewEmbeddedTextFormat(htmlDoc) :
//             parseOldEmbeddedTextFormat(htmlDoc),
//         isNewFormat
//     };
// }

// // Enhanced section creation
// function createSection(sectionData, index) {
//     const sectionDiv = document.createElement('div');
//     sectionDiv.className = 'embedded-text-section';
//     sectionDiv.dataset.sectionIndex = index;

//     // Add accessibility attributes
//     sectionDiv.setAttribute('role', 'region');
//     sectionDiv.setAttribute('aria-label', `Section ${index + 1}`);

//     // Add navigation markers
//     sectionDiv.dataset.navTarget = `section-${index}`;

//     return sectionDiv;
// }

// // Enhanced CSS class handling
// function applySectionStyles(element, sectionData) {
//     // Apply basic styles
//     element.style.borderColor = sectionData.BorderColor || 'inherit';
//     element.style.color = sectionData.TextColor || 'inherit';

//     // Add transition classes
//     element.classList.add('section-transition');

//     // Handle special section types
//     if (sectionData.SectionType) {
//         element.classList.add(`section-type-${sectionData.SectionType}`);
//     }
// }

// // Main initialization sequence
// document.addEventListener('DOMContentLoaded', async () => {
//     try {
//         // 1. Set background (from first handler)
//         setRandomBackground();

//         // 2. Initialize screenreader components (from first handler)
//         initializeScreenReader();

//         // 3. Get quiz ID and validate (from fifth handler)
//         const quizId = getQuizIdFromURL();
//         if (!quizId) {
//             console.error('No quiz ID provided');
//             return;
//         }

//         // 4. Handle quiz data initialization (from fifth handler)
//         const quizDocRef = doc(db, "quizzes", quizId);
//         const quizDocSnap = await getDoc(quizDocRef);

//         if (!quizDocSnap.exists()) {
//             console.log("No such document!");
//             window.location.href = "student_dashboard.html";
//             return;
//         }

//         // 5. Set quiz data (from fifth handler)
//         quizData = quizDocSnap.data();

//         // 6. Initialize layer management (from second handler)
//         initializeLayerManagement();

//         // 7. Initialize UI components
//         initializeUIComponents();

//         // 8. Initialize quiz state (from fifth handler)
//         const user = auth.currentUser;
//         if (user) {
//             const stateManager = await createQuizStateManager(quizId, user.uid);
//             await handleExistingState(stateManager);
//         }

//         // 9. Display quiz content (from fifth handler)
//         if (quizData) {
//             await displayQuizContent(quizData);
//         }

//         // 10. Hide empty sections (from fourth handler)
//         hideEmptySections();

//         // 11. Initialize begrippen logic
//         initBegrippenLogic();

//     } catch (error) {
//         console.error('Error during initialization:', error);
//         handleError(error);
//     }
// });

// // Initialize UI components (consolidated from multiple handlers)
// function initializeUIComponents() {
//     // Initialize toolbar toggle (from first handler)
//     const toggleButton = document.getElementById('screenreader-toggle');
//     const toolbar = document.querySelector('.sigma-screenreader-toolbar');
//     if (toggleButton && toolbar) {
//         toggleButton.addEventListener('click', () => {
//             toolbar.classList.toggle('hidden');
//         });
//     }

//     // Initialize start button (from third handler)
//     const startButton = document.querySelector('.start-quiz-button');
//     const quizContainer = document.querySelector('.quiz-container');

//     if (startButton) {
//         startButton.addEventListener('click', () => {
//             handleQuizStart(startButton, quizContainer);
//         });
//     }

//     // Initialize swap button listener (from second handler)
//     const swapButton = document.getElementById('swap-layers-button');
//     if (swapButton) {
//         initializeSwapButton(swapButton, quizContainer);
//     }
// }

// // Handle quiz start (from third handler)
// function handleQuizStart(startButton, quizContainer) {
//     quizContainer.classList.add('active');
//     startButton.classList.add('hidden');

//     window.scrollTo({
//         top: 0,
//         behavior: 'smooth'
//     });

//     const quizWindowContainer = document.getElementById('quiz-window-container');
//     quizWindowContainer.classList.remove('inactive-quiz-window-container', 'hidden');
//     quizWindowContainer.style.position = 'absolute';
//     quizWindowContainer.style.top = `${quizContainer.offsetTop}px`;
//     quizWindowContainer.style.right = '0';

//     const swapButton = document.getElementById('swap-layers-button');
//     if (swapButton) {
//         swapButton.style.display = 'block';
//     }
// }

// // Handle existing state check (from fifth handler)
// async function handleExistingState(stateManager) {
//     const hasExistingState = await stateManager.checkExistingState();
//     console.log('Has existing state:', hasExistingState);

//     if (hasExistingState) {
//         console.log('Found existing state, attempting auto-start');
//         const startButton = document.getElementById('start-quiz-button');
//         if (startButton) {
//             setTimeout(() => {
//                 console.log('Auto-starting quiz');
//                 startButton.click();
//             }, 100);
//         }
//     }
// }

// // Display quiz content (from fifth handler)
// async function displayQuizContent(quizData) {
//     console.log("Document data:", quizData);
//     document.querySelector('.title').innerText = quizData.Title;

//     if (quizData.embedTextHTML) {
//         const parser = new DOMParser();
//         const htmlDoc = parser.parseFromString(quizData.embedTextHTML, 'text/html');

//         const oldFormat = !htmlDoc.querySelector('.section-container');
//         let processedTextSections = oldFormat ?
//             parseOldEmbeddedTextFormat(htmlDoc) :
//             parseNewEmbeddedTextFormat(htmlDoc);

//         displayTextSections(processedTextSections, oldFormat);
//     }
// }

// // Layer management initialization (from original layer management)
// function initializeLayerManagement() {
//     const quizWindow = document.querySelector('.quiz-window-container');

//     // Add transition end handler (from original code)
//     quizWindow.addEventListener('transitionend', (event) => {
//         if (quizWindow.classList.contains('inactive-quiz-window-container')) {
//             quizWindow.classList.add('hidden');
//         } else {
//             quizWindow.classList.remove('hidden');
//         }
//     });

//     // Add scroll handler for margin adjustment (from original code)
//     document.addEventListener('scroll', () => {
//         const container = document.querySelector('.proto-quiz-container');
//         if (container) {
//             const scrollY = window.scrollY;
//             const maxMargin = 13;
//             const minMargin = 2;
//             const newMargin = Math.max(minMargin, maxMargin - (scrollY / 100));
//             container.style.marginTop = `${newMargin}%`;
//         }
//     });
// }
// // Missing the logLayerVisibility function
// const logLayerVisibility = () => {
//     console.log('Content Layer Visible:', !document.querySelector('.text-section-container').classList.contains('hidden'));
//     console.log('Quiz Layer Visible:', !document.querySelector('.quiz-window-container').classList.contains('hidden'));
// };

// // Missing initializeSwapButton function
// function initializeSwapButton(swapButton, quizContainer) {
//     // Original swap button logic
//     swapButton.addEventListener('click', function () {
//         const quizWindow = document.querySelector('.quiz-window-container');
//         this.classList.toggle('flipped');

//         if (quizWindow.classList.contains('inactive-quiz-window-container')) {
//             this.classList.remove('shifted');
//         } else {
//             this.classList.add('shifted');
//         }
//     });
// }

// // Complete displayTextSections implementation
// const displayTextSections = (processedTextSections, oldFormat) => {
//     const textContainer = document.getElementById('text-section-container');
//     if (!textContainer) {
//         console.error('Text container not found');
//         return;
//     }

//     // Clear existing content
//     textContainer.innerHTML = '';

//     // Create a document fragment for better performance
//     const fragment = document.createDocumentFragment();

//     // Store text content for screenreader
//     const textForScreenReader = [];

//     if (oldFormat) {
//         processedTextSections.forEach((section, index) => {
//             const sectionDiv = document.createElement('div');
//             sectionDiv.className = 'embedded-text-section';
//             sectionDiv.dataset.sectionIndex = index;
//             sectionDiv.setAttribute('role', 'region');
//             sectionDiv.setAttribute('aria-label', `Section ${index + 1}`);

//             // Create text container with the original HTML content
//             const textDiv = document.createElement('div');
//             textDiv.className = 'embedded-text';
//             textDiv.innerHTML = section;

//             // Extract clean text for screenreader
//             const cleanText = section.replace(/<[^>]*>/g, ' ').trim();
//             textForScreenReader.push(cleanText);

//             sectionDiv.appendChild(textDiv);
//             fragment.appendChild(sectionDiv);
//         });
//     } else {
//         processedTextSections.forEach((section, index) => {
//             const sectionDiv = document.createElement('div');
//             sectionDiv.className = `embedded-text-section ${section.SectionType || ''}`;
//             sectionDiv.dataset.sectionIndex = index;
//             sectionDiv.setAttribute('role', 'region');
//             sectionDiv.setAttribute('aria-label', `Section ${index + 1}`);

//             if (section.SectionType === 'middle-section') {
//                 handleMiddleSection(section, sectionDiv);
//                 const cleanText = section.Text.replace(/<[^>]*>/g, ' ').trim();
//                 textForScreenReader.push(cleanText);
//             } else {
//                 // Create main text container
//                 const textDiv = document.createElement('div');
//                 textDiv.className = 'embedded-text';
//                 textDiv.style.borderColor = section.BorderColor || 'inherit';
//                 textDiv.style.color = section.TextColor || 'inherit';
//                 textDiv.innerHTML = section.Text;

//                 // Process text for screenreader
//                 const cleanText = section.Text.replace(/<[^>]*>/g, ' ').trim();
//                 textForScreenReader.push(cleanText);

//                 sectionDiv.appendChild(textDiv);

//                 // Handle images if present
//                 if (section.Images?.length) {
//                     const imagesDiv = document.createElement('div');
//                     imagesDiv.className = 'embedded-images';

//                     section.Images.forEach((imgSrc, imgIndex) => {
//                         const imgWrapper = document.createElement('div');
//                         imgWrapper.className = 'image-wrapper';

//                         const imgElement = document.createElement('img');
//                         imgElement.src = imgSrc;
//                         imgElement.alt = `Image ${imgIndex + 1}`;
//                         imgElement.loading = 'lazy'; // Add lazy loading

//                         if (section.ImageDetails?.[imgIndex]) {
//                             const details = section.ImageDetails[imgIndex];
//                             imgElement.style.position = details.positionOnPage || 'relative';

//                             // Apply additional image settings if available
//                             if (details.backOrForeground === 'background') {
//                                 imgWrapper.style.zIndex = '-1';
//                             }

//                             if (details.containedOrUncontained === 'contained') {
//                                 imgWrapper.style.overflow = 'hidden';
//                             }
//                         }

//                         imgWrapper.appendChild(imgElement);
//                         imagesDiv.appendChild(imgWrapper);
//                     });

//                     sectionDiv.appendChild(imagesDiv);
//                 }
//             }

//             fragment.appendChild(sectionDiv);
//         });
//     }

//     // Append all content at once
//     textContainer.appendChild(fragment);

//     // Initialize screenreader with processed text if available
//     if (window.screenReader) {
//         window.screenReader.setText(textForScreenReader.join(' '));
//     }

//     // Initialize observers for dynamic content
//     initializeContentObservers(textContainer);

//     // Handle empty sections
//     hideEmptySections();

//     return {
//         container: textContainer,
//         textContent: textForScreenReader,
//         sectionCount: processedTextSections.length
//     };
// };

// // Helper function to handle middle sections
// const handleMiddleSection = (section, sectionDiv) => {
//     // Create left image container
//     const leftImgElement = document.createElement('div');
//     leftImgElement.className = 'embedded-image-middlesection';
//     if (section.Images[0]) {
//         const imgElement = document.createElement('img');
//         imgElement.src = section.Images[0];
//         imgElement.alt = 'Image 1';
//         imgElement.loading = 'lazy';
//         leftImgElement.appendChild(imgElement);
//     }

//     // Create right image container
//     const rightImgElement = document.createElement('div');
//     rightImgElement.className = 'embedded-image-middlesection';
//     if (section.Images[1]) {
//         const imgElement = document.createElement('img');
//         imgElement.src = section.Images[1];
//         imgElement.alt = 'Image 2';
//         imgElement.loading = 'lazy';
//         rightImgElement.appendChild(imgElement);
//     }

//     // Create text container
//     const textDiv = document.createElement('div');
//     textDiv.className = 'embedded-text';
//     textDiv.style.borderColor = section.BorderColor;
//     textDiv.style.color = section.TextColor;
//     textDiv.innerHTML = section.Text;

//     // Add components in order
//     sectionDiv.appendChild(leftImgElement);
//     sectionDiv.appendChild(textDiv);
//     sectionDiv.appendChild(rightImgElement);
// };

// // Helper function to observe content changes
// const initializeContentObservers = (container) => {
//     const config = {
//         childList: true,
//         subtree: true,
//         characterData: true
//     };

//     const observer = new MutationObserver((mutations) => {
//         if (window.screenReader) {
//             const newText = Array.from(container.querySelectorAll('.embedded-text'))
//                 .map(el => el.textContent.trim())
//                 .join(' ');
//             window.screenReader.setText(newText);
//         }
//     });

//     observer.observe(container, config);
// };

// // Helper function to hide empty sections
// const hideEmptySections = () => {
//     const embeddedTexts = document.querySelectorAll('.embedded-text');
//     embeddedTexts.forEach(section => {
//         if (!section.innerHTML.trim()) {
//             const parentSection = section.closest('.embedded-text-section');
//             if (parentSection) {
//                 parentSection.classList.add('hidden');
//             }
//         }
//     });
// };

// // Add to initializeLayerManagement
// document.getElementById('quiz-window-container').addEventListener('transitionend', (event) => {
//     const quizWindow = document.getElementById('quiz-window-container');
//     if (quizWindow.classList.contains('inactive-quiz-window-container')) {
//         quizWindow.classList.add('hidden');
//     } else {
//         quizWindow.classList.remove('hidden');
//     }
// });

// // Complete BegrippenLogic implementation
// function initBegrippenLogic() {
//     const popup = document.getElementById('begrippen-popup');
//     const content = document.querySelector('.begrippen-content');
//     const container = document.getElementById('begrippen-container');
//     const searchInput = document.getElementById('begrippen-search');
//     const gridViewBtn = document.querySelector('.grid-view');
//     const listViewBtn = document.querySelector('.list-view');
//     const wordListButton = document.getElementById('word-list-button');

//     // Card color configuration
//     const cardColors = ["#f8f9fa", "#e8eaf6", "#ffe4b5", "#e0f7fa", "#ffebee"];

//     function updateButtonVisibility() {
//         if (!container) return;

//         const hasCards = container.querySelector('.begrip-card') !== null;
//         const hasNoBegrippen = container.querySelector('.no-begrippen') !== null;

//         if (wordListButton) {
//             wordListButton.classList.toggle('hidden', !hasCards && hasNoBegrippen);
//         }
//     }

//     function renderBegrippen(begrippen = [], searchTerm = '') {
//         if (!container) return;
//         container.innerHTML = '';

//         // Handle empty begrippen case
//         if (!begrippen.length) {
//             container.innerHTML = `
//                 <div class="no-begrippen">
//                     <p>Voor deze tekst zijn er geen begrippen</p>
//                 </div>`;
//             updateButtonVisibility();
//             return;
//         }

//         // Filter begrippen based on search
//         const filteredBegrippen = begrippen.filter(item =>
//             item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             item.definition.toLowerCase().includes(searchTerm.toLowerCase())
//         );

//         // Handle no search results
//         if (filteredBegrippen.length === 0) {
//             container.innerHTML = `
//                 <div class="no-begrippen">
//                     <p>Er zijn geen begrippen beschikbaar voor deze zoek opdracht</p>
//                 </div>`;
//             updateButtonVisibility();
//             return;
//         }

//         // Create and render begrippen cards
//         filteredBegrippen.forEach((item, index) => {
//             const card = document.createElement('div');
//             card.className = 'begrip-card';
//             card.style.backgroundColor = cardColors[index % cardColors.length];
//             card.style.animationDelay = `${index * 50}ms`;
//             card.innerHTML = `
//                 <h3>${item.term}</h3>
//                 <p>${item.definition}</p>
//             `;
//             container.appendChild(card);
//         });

//         updateButtonVisibility();
//     }

//     // Event handlers setup
//     function setupEventHandlers() {
//         // Grid view toggle
//         if (gridViewBtn) {
//             gridViewBtn.addEventListener('click', () => {
//                 container?.classList.remove('list-view');
//                 gridViewBtn.classList.add('active');
//                 listViewBtn?.classList.remove('active');
//             });
//         }

//         // List view toggle
//         if (listViewBtn) {
//             listViewBtn.addEventListener('click', () => {
//                 container?.classList.add('list-view');
//                 listViewBtn.classList.add('active');
//                 gridViewBtn?.classList.remove('active');
//             });
//         }

//         // Search functionality
//         if (searchInput) {
//             searchInput.addEventListener('input', (e) => {
//                 renderBegrippen(quizData.Begrippen, e.target.value);
//             });
//         }

//         // Popup close button
//         if (content) {
//             content.addEventListener('click', (e) => {
//                 if (e.target.matches('.close-btn')) {
//                     console.log('Close button clicked');
//                     popup?.classList.remove('show');
//                     setTimeout(() => popup?.classList.add('hidden'), 300);
//                 }
//             });
//         }

//         // Close popup when clicking outside
//         if (popup) {
//             popup.addEventListener('click', (e) => {
//                 if (content && !content.contains(e.target)) {
//                     popup.classList.remove('show');
//                     setTimeout(() => popup.classList.add('hidden'), 300);
//                 }
//             });
//         }

//         // Word list button handling
//         if (wordListButton) {
//             wordListButton.addEventListener('click', () => {
//                 popup?.classList.remove('hidden');
//                 setTimeout(() => popup?.classList.add('show'), 10);
//                 renderBegrippen(quizData.Begrippen);
//             });
//         }
//     }

//     // Initialize animation handlers
//     function setupAnimations() {
//         const cards = document.querySelectorAll('.begrip-card');
//         cards.forEach((card, index) => {
//             card.style.animationDelay = `${index * 50}ms`;
//             card.classList.add('fade-in');
//         });
//     }

//     // Initial setup
//     function initialize() {
//         setupEventHandlers();
//         renderBegrippen(quizData.Begrippen);
//         setupAnimations();
//     }

//     // Start initialization
//     initialize();
// }

// // Export necessary functions and variables for module usage
// export {
//     screenReader,
//     textHighlighter,
//     navigationControls,
//     handleContentUpdate,
//     initializeScreenReader,
//     checkQuizState,
//     getQuizIdFromURL,
//     handleError,
//     setRandomBackground,
//     parseNewEmbeddedTextFormat,
//     parseOldEmbeddedTextFormat,
//     hideEmptySections,
//     getCssClassForTag,
//     highlightBoldWords
// };

