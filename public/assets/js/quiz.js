import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { initScreenReader } from '../js/screenreader_quiztext.js';
import { app, auth, db } from "./firebase_config.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";

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

const textContainer = document.querySelector('.text-section-container');

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);
        const currentUserUid = user.uid;
        const quizId = getQuizIdFromURL();
        const docRef = doc(db, 'quizzes', quizId);

        getDoc(docRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    quizData = docSnap.data();
                    document.getElementById('quiz-title').innerText = quizData.quizTitle;

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
                    } else {
                        document.querySelector('.embedded-text-section').innerText = 'No embedded text provided.';
                    }

                    const screenReaderToolbar = document.querySelector('.screenreader-toolbar-container');
                    screenReaderToolbar.classList.remove('hidden');
                    const autoScrollDropdownButton = document.getElementById('auto-scroll-dropdown-button');
                    const autoScrollDropdown = document.getElementById('auto-scroll-dropdown');
                    const autoScrollOptions = document.querySelectorAll('.auto-scroll-option');

                    autoScrollDropdownButton.addEventListener('click', () => {
                        const isExpanded = autoScrollDropdownButton.getAttribute('aria-expanded') === 'true';
                        autoScrollDropdownButton.setAttribute('aria-expanded', !isExpanded);
                        autoScrollDropdown.style.display = !isExpanded ? 'block' : 'none';
                    });

                    autoScrollOptions.forEach((option) => {
                        option.addEventListener('click', (event) => {
                            const value = event.target.getAttribute('data-value');
                            autoScrollDropdownButton.setAttribute('aria-expanded', 'false');
                            autoScrollDropdown.style.display = 'none';
                            document.getElementById('auto-scroll-button-text').textContent = value.charAt(0).toUpperCase() + value.slice(1);
                        });
                    });

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

    const quizDocRef = doc(db, "quizzes", quizId);
    const quizDocSnap = await getDoc(quizDocRef);

    if (!quizDocSnap.exists()) {
        console.log("No such document!");
        window.location.href = "student_dashboard.html";
    } else {
        quizData = quizDocSnap.data();

        if (quizData) {
            console.log("Document data:", quizData);
            document.querySelector('.title').innerText = quizData.Title;

            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(quizData.EmbeddedText, 'text/html');

            const oldFormat = !htmlDoc.querySelector('.section-container');

            let processedTextSections;
            if (oldFormat) {
                processedTextSections = parseOldEmbeddedTextFormat(htmlDoc);
            } else {
                processedTextSections = parseNewEmbeddedTextFormat(htmlDoc);
            }

            displayTextSections(processedTextSections, oldFormat);

            initScreenReader();
        } else {
            console.log('quizData is null or undefined');
        }
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

const clearState = () => {
    localStorage.removeItem('quizState');
    console.log("State cleared from localStorage.");
    currentQuestionIndex = 0;
    attempts = {};
};

export async function uploadQuizSummary(quizSummary) {
    const user = auth.currentUser;
    if (user) {
        try {
            const userDocRef = doc(db, "studentdb", user.uid);
            const quizKey = `${quizSummary.title}`;
            await setDoc(userDocRef, {
                quizzes: {
                    [quizKey]: {
                        dateTime: new Date().toISOString(),
                        groupId: quizSummary.groupId,
                        scoreWithHints: quizSummary.scoreWithHints,
                        scoreWithoutHints: quizSummary.scoreWithoutHints,
                        state: "finished",
                        time: quizSummary.time,
                        title: quizSummary.title,
                        type: quizSummary.type
                    }
                }
            }, { merge: true });
            console.log("Quiz summary uploaded to Firestore:", quizSummary);

            clearState();
            console.log("Local storage and quiz state cleared for next quiz.");

        } catch (error) {
            console.error("Error uploading quiz summary:", error);
        }
    } else {
        console.error("No user is currently signed in.");
    }
}

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

