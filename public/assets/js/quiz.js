import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { initScreenReader } from '../js/screenreader_quiztext.js';
import { app, auth, db } from "./firebase_config.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";

export let quizData;

// Applies predetermined css classes to the elements of the EmbeddedText
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

const textContainer = document.querySelector('.text-section-container');

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);
        redirectUserBasedOnRole([0])
    } else {
        window.location.href = "login_student_tvt.html";
    }
});

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
                        const cssClass = getCssClassForTag(tagName);
                        if (cssClass) {
                            element.className = cssClass;
                        }
                        Array.prototype.forEach.call(element.childNodes, applyCssClasses);
                    }
                }

                Array.prototype.forEach.call(elements, applyCssClasses);

                return htmlElement.outerHTML;
            });

            const container = document.createElement('div');
            container.className = 'text-section-container';

            let previousHeight = 0;
            processedTextSections.forEach((textSection, index) => {
                const sectionContainer = document.createElement('div');
                sectionContainer.className = 'text-section';
                sectionContainer.innerHTML = textSection;

                sectionContainer.style.maxWidth = '100%';

                const whiteSpaceContainer = document.createElement('div');
                whiteSpaceContainer.className = 'text-section-white-space';
                whiteSpaceContainer.style.height = index === 0 ? '1rem' : (processedTextSections[index - 1].height + previousHeight + 2) + 'rem';
                previousHeight = whiteSpaceContainer.offsetHeight;
                container.appendChild(whiteSpaceContainer);

                const paragraphs = sectionContainer.querySelectorAll('p');
                paragraphs.forEach((paragraph) => {
                    const alignmentClasses = ['embedded-text-left', 'embedded-text-right', 'embedded-text-middle'];
                    const randomIndex = Math.floor(Math.random() * alignmentClasses.length);
                    const alignmentClass = alignmentClasses[randomIndex];
                    paragraph.classList.add(alignmentClass);
                });

                container.appendChild(sectionContainer);
            });

            const hiddenTextContainer = document.createElement('div');
            hiddenTextContainer.className = 'screenreader-text';
            hiddenTextContainer.style.display = 'none';

            const plainText = textSections.join(' ');
            hiddenTextContainer.textContent = plainText;

            document.querySelector('.embedded-text').innerHTML = '';
            document.querySelector('.embedded-text').appendChild(container);
            document.querySelector('.embedded-text').appendChild(hiddenTextContainer);

            initScreenReader();
        } else {
            console.log('quizData is null or undefined');
        }
    }
});

export async function uploadQuizSummary(quizSummary) {
    const user = auth.currentUser;
    if (user) {
        try {
            const userDocRef = doc(db, "studentdb", user.uid);
            await setDoc(userDocRef, {
                quizzes: {
                    [quizSummary.title]: quizSummary
                }
            }, { merge: true });
            console.log("Quiz summary uploaded to Firestore:", quizSummary);
        } catch (error) {
            console.error("Error uploading quiz summary:", error);
        }
    } else {
        console.error("No user is currently signed in.");
    }
}

// Listen for quiz summary export
window.addEventListener('message', (event) => {
    if (event.data.type === 'quizSummary') {
        uploadQuizSummary(event.data.quizSummary);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const startQuizButton = document.querySelector('.start-quiz-button');
    const quizContainer = document.querySelector('.quiz-container');

    if (startQuizButton) {
        startQuizButton.addEventListener('click', () => {
            // Change the grid template columns
            quizContainer.classList.add('active');

            // Hide the start quiz button
            startQuizButton.classList.add('hidden');
        });
    }
});
