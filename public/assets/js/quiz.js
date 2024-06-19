import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { initScreenReader, setAutoScroll } from '../js/screenreader_quiztext.js';
import { app, auth, db } from "./firebase_config.js";

export let quizData; // Export quizData so it can be used in screenreader_quiztext.js

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

// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);
    } else {
        // Redirect the user to the 'login_student_tvt.html'
        window.location.href = "login_student_tvt.html";
    }
});

// Declare variables to get and set all relevant quizData
let currentQuestionIndex = 0;
let scoreWithoutHints = 0;
let scoreWithHints = 0;
let attempts = [];

const prevQuestionBtn = document.querySelector('.prev-question-btn');
const nextQuestionBtn = document.querySelector('.next-question-btn');

function handleUserAnswer(selectedOption) {
    if (currentQuestionIndex === 0) {
        // First question
    } else {
        // For subsequent questions
        if (!selectedOption) {
            console.error("selectedOption is undefined");
            return;
        }

        const correctOptionLetter = quizData.Questions[currentQuestionIndex].CorrectOptionLetter;

        if (selectedOption.id === correctOptionLetter) {
            if (currentQuestionIndex === quizData.Questions.length - 1) {
                displayQuizSubmissionOverlay();
            } else {
                nextQuestion();
            }
        } else {
            if (!attempts[currentQuestionIndex]) {
                attempts[currentQuestionIndex] = {
                    attemptCount: 0,
                    userAnswer: null,
                    hintShown: false,
                    options: []
                };
            }

            if (attempts[currentQuestionIndex].attemptCount === 1) {
                scoreWithoutHints++;
                scoreWithHints++;
            } else if (attempts[currentQuestionIndex].attemptCount === 2) {
                scoreWithHints++;
            }

            attempts[currentQuestionIndex].attemptCount++;
            attempts[currentQuestionIndex].userAnswer = selectedOption.id;
            attempts[currentQuestionIndex].options.forEach(option => {
                if (option.id === selectedOption.id) {
                    option.isSelected = true;
                }
            });

            if (attempts[currentQuestionIndex].attemptCount === 1) {
                attempts[currentQuestionIndex].hintShown = true;
                showHint(quizData.Questions[currentQuestionIndex].Hint);
            } else if (attempts[currentQuestionIndex].attemptCount === 2) {
                attempts[currentQuestionIndex].options.forEach(option => {
                    if (option.isCorrect) {
                        option.isHinted = true;
                    } else {
                        option.isDisabled = true;
                    }
                });
                showCorrectAnswer(correctOptionLetter);
            }
            nextQuestionBtn.disabled = true;
            document.querySelectorAll('.option').forEach((option) => {
                option.addEventListener('click', () => {
                    nextQuestionBtn.disabled = false;
                });
            });
        }

        if (currentQuestionIndex !== answeredQuestions - 1) {
            const hintContainer = document.querySelector('.hint-container');
            const correctAnswerContainer = document.querySelector('.correct-answer-container');
            hintContainer.innerHTML = '';
            correctAnswerContainer.innerHTML = '';
        }
    }
}

function showHint(hint) {
    const hintContainer = document.querySelector('.hint-container');
    hintContainer.innerHTML = '';
    const hintTitle = document.createElement('h4');
    hintTitle.innerText = 'Hint:';
    hintContainer.appendChild(hintTitle);
    const hintParagraph = document.createElement('p');
    hintParagraph.innerText = hint;
    hintContainer.appendChild(hintParagraph);
    hintContainer.style.display = 'block';
}

function showCorrectAnswer(correctOptionLetter) {
    const correctAnswerContainer = document.querySelector('.correct-answer-container');
    correctAnswerContainer.innerHTML = '';
    const correctAnswerElement = document.createElement('div');
    correctAnswerElement.classList.add('correct-answer');
    const answerTitle = document.createElement('h4');
    answerTitle.innerText = 'Answer:';
    correctAnswerElement.appendChild(answerTitle);
    correctAnswerElement.innerHTML += `<p>Correct answer: ${correctOptionLetter}</p>`;
    correctAnswerContainer.appendChild(correctAnswerElement);
    correctAnswerContainer.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function () {
    const contentWrapper = document.getElementById('content-wrapper');

    setTimeout(function () {
        const loader = document.querySelector('.loading-indicator');
        if (loader) {
            loader.style.display = 'none';
        }
    }, 500);
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

            initializeQuiz();

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

            const plainText = textSections.join(' ');  // Combine all text sections into a single plain text string
            hiddenTextContainer.textContent = plainText;

            document.querySelector('.embedded-text').innerHTML = '';
            document.querySelector('.embedded-text').appendChild(container);
            document.querySelector('.embedded-text').appendChild(hiddenTextContainer);

            initScreenReader();
        } else {
            console.log('quizData is null or undefined');
        }

        const quizWindow = document.querySelector('.quiz-window');
        const questionContainer = quizWindow.querySelector('.question-container');
        const quizWindowContainer = document.querySelector('.quiz-window-container');
        const startQuizButton = document.getElementById("start-quiz-button");

        startQuizButton.addEventListener('click', () => {
            quizWindow.style.display = 'block';
            quizWindowContainer.classList.remove('hidden');
            quizWindowContainer.style.display = 'block';
            startQuizButton.style.display = 'none';

            generateQuizWindow();
        });

        const generateQuestionWindow = () => {
            if (!quizWindow) {
                console.log('quizWindow is null');
                return;
            }

            const question = quizData.Questions[currentQuestionIndex];
            const questionText = document.createElement('div');
            questionText.classList.add('question-text');
            questionText.innerText = question.Text;

            const hintContainer = document.createElement('div');
            hintContainer.classList.add('quiz-window-hint');

            const answerContainer = document.createElement('div');
            answerContainer.classList.add('quiz-window-answer');

            prevQuestionBtn.classList.add('prev-question-btn');
            prevQuestionBtn.innerText = 'Previous';
            prevQuestionBtn.disabled = currentQuestionIndex === 0;
            nextQuestionBtn.classList.add('next-question-btn');
            nextQuestionBtn.innerText = 'Next';
            nextQuestionBtn.disabled = currentQuestionIndex === quizData.Questions.length - 1;

            const hint = document.createElement('div');
            hint.classList.add('hint');
            hint.innerText = question.Hint;
            hint.style.display = 'none';

            questionText.innerText = question.Text

            questionContainer.innerHTML = '';
            hintContainer.innerHTML = '';
            answerContainer.innerHTML = '';

            let selectedOption = null;

            question.Options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.classList.add('option');

                const optionLetter = String.fromCharCode(65 + index) + '.';
                optionElement.innerText = optionLetter + ' ' + option;

                const radioButton = document.createElement('input');
                radioButton.type = 'radio';
                radioButton.name = `option-${currentQuestionIndex}`;
                radioButton.value = index.toString();

                optionElement.appendChild(radioButton);

                answerContainer.appendChild(optionElement);
            });

            answerContainer.addEventListener('click', (event) => {
                if (event.target.tagName === 'DIV' && event.target.classList.contains('option')) {
                    const radioButtons = event.target.querySelectorAll('input[type="radio"]');
                    radioButtons.forEach((radioButton) => {
                        radioButton.checked = !radioButton.checked;
                    });
                    if (selectedOption) {
                        selectedOption.classList.remove('selected');
                    }
                    selectedOption = event.target;
                    selectedOption.classList.add('selected');
                }
            });

            const correctOptionDescription = quizData.Questions[currentQuestionIndex].CorrectOptionDescription;

            const correctOptionDescriptionElement = document.createElement('div');
            correctOptionDescriptionElement.classList.add('correct-option-description');
            correctOptionDescriptionElement.innerText = correctOptionDescription;

            questionContainer.appendChild(questionText);
            questionContainer.appendChild(hintContainer);
            questionContainer.appendChild(answerContainer);
        };

        const generateTimer = () => {
            const quizTimerContainer = document.createElement('div');
            quizTimerContainer.classList.add('quiz-timer-container', 'hidden');
            quizWindow.querySelector('.quiz-window-header').appendChild(quizTimerContainer);

            const quizTimer = document.createElement('div');
            quizTimer.classList.add('quiz-timer');
            quizTimerContainer.appendChild(quizTimer);

            const questionTimerContainer = document.createElement('div');
            questionTimerContainer.classList.add('question-timer-container', 'hidden');
            quizWindow.querySelector('.quiz-window-controls').appendChild(questionTimerContainer);

            const questionTimer = document.createElement('div');
            questionTimer.classList.add('question-timer');
            questionTimerContainer.appendChild(questionTimer);

            let quizStartTime = null;
            let questionStartTime = null;

            const updateQuizTimer = () => {
                if (!quizStartTime) {
                    quizStartTime = new Date();
                }
                const now = new Date();
                const elapsedTime = (now - quizStartTime) / 1000;
                const minutes = Math.floor(elapsedTime / 60);
                const seconds = Math.floor(elapsedTime % 60);
                const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                quizTimer.innerText = formattedTime;
            };

            const updateQuestionTimer = () => {
                if (!questionStartTime) {
                    questionStartTime = new Date();
                }
                const now = new Date();
                const elapsedTime = (now - questionStartTime) / 1000;
                const minutes = Math.floor(elapsedTime / 60);
                const seconds = Math.floor(elapsedTime % 60);
                const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                questionTimer.innerText = formattedTime;
            };

            setInterval(updateQuizTimer, 1000);

            const updateQuestion = () => {
                questionStartTime = new Date();
                updateQuestionTimer();
            };

            updateQuestion();
        };

        const generateQuizWindow = () => {
            if (!quizWindow) {
                console.log('quizWindow is null');
                return;
            }

            quizWindow.style.display = 'block';
            quizWindowContainer.style.display = 'block';

            generateTimer();
            generateQuestionWindow();
        };

        const quizWindowClose = document.querySelector('.quiz-window-close');
        quizWindowClose.addEventListener('click', () => {
            quizWindow.classList.remove('open');
            quizWindowContainer.classList.add('hidden');
            startQuizButton.style.display = 'block';
        });

        function prevQuestion() {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                updateQuestionWindow();
                const correctAnswerContainer = document.querySelector('.correct-answer-container');
                correctAnswerContainer.innerHTML = `<p>${question.CorrectOptionLetter} - ${question.CorrectOptionText}</p><p>${question.CorrectOptionDescription}</p>`;
                correctAnswerContainer.style.display = 'block';
            }
        }

        function nextQuestion() {
            currentQuestionIndex++;
            updateQuestionWindow();
            const correctAnswerContainer = document.querySelector('.correct-answer-container');
            correctAnswerContainer.innerHTML = '';
            correctAnswerContainer.style.display = 'none';
        }

        function checkSubmitButton() {
            const quizWindow = document.querySelector('.quiz-window');
            const submitQuizBtn = quizWindow.querySelector('.submit-quiz-btn');
            return submitQuizBtn;
        }

        async function initializeQuiz() {
            if (!quizData) {
                console.error('quizData not found');
                return;
            }

            const quizWindow = document.querySelector('.quiz-window');
            const prevQuestionBtn = quizWindow.querySelector('.prev-question-btn');
            const nextQuestionBtn = quizWindow.querySelector('.next-question-btn');
            const submitQuizBtn = quizWindow.querySelector('.submit-quiz-btn');

            const questionContainer = document.querySelector('.question-container');
            const questionText = document.createElement('div');
            questionText.classList.add('question-text');
            questionText.innerText = quizData.Questions[currentQuestionIndex].Question;

            const answerContainer = document.createElement('div');
            answerContainer.classList.add('answer-container');

            const hintContainer = document.createElement('div');
            hintContainer.classList.add('hint-container');

            quizWindow.querySelector('.quiz-window-header .question-number').innerText = `Vraag ${currentQuestionIndex + 1} van de ${quizData.Questions.length}`;

            quizData.Questions[currentQuestionIndex].Options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.classList.add('option');
                optionElement.innerText = option;
                answerContainer.appendChild(optionElement);
            });

            questionContainer.appendChild(questionText);
            questionContainer.appendChild(answerContainer);
            quizWindow.querySelector('.quiz-window-controls').appendChild(prevQuestionBtn);
            quizWindow.querySelector('.quiz-window-controls').appendChild(nextQuestionBtn);

            const options = document.querySelectorAll('.option');
            options.forEach((option) => {
                option.addEventListener('click', () => {
                    answeredQuestions++;
                    checkSubmitButton();
                });
            });

            function submitQuiz() {
                const totalQuestions = quizData.Questions.length;
                const scoreWithoutHintsPercentage = (scoreWithoutHints / totalQuestions) * 100;
                const scoreWithHintsPercentage = (scoreWithHints / totalQuestions) * 100;

                const overlay = document.createElement('div');
                overlay.classList.add('overlay', 'quiz-submission-overlay');
                overlay.innerHTML = `
                    <div class="overlay-content">
                    <h2>Quiz Results</h2>
                    <p>Score without hints: ${scoreWithoutHints}%</p>
                    <p>Score with hints: ${scoreWithHints}%</p>
                    <p>Click anywhere to go to the dashboard</p>
                    </div>
                `;
                document.body.appendChild(overlay);

                const quizTimerContainer = document.querySelector('.quiz-timer-container');
                const questionTimerContainer = document.querySelector('.question-timer-container');
                quizTimerContainer.classList.remove('hidden');
                questionTimerContainer.classList.remove('hidden');

                overlay.addEventListener('click', () => {
                    window.location.href = "dashboard.html";
                });
            }

            if (submitQuizBtn) {
                submitQuizBtn.addEventListener('click', async () => {
                    const selectedOption = document.querySelector('input[name="option"]:checked');
                    if (!selectedOption) {
                        alert('Please select an option.');
                        return;
                    }

                    const correctOption = quizData.Questions[currentQuestionIndex].Correct;
                    const result = selectedOption.value === correctOption ? 'correct' : 'incorrect';

                    await setDoc(doc(collection(db, "quizResults")), {
                        userId: auth.currentUser.uid,
                        quizId: quizData.id,
                        result: result,
                        timestamp: new Date()
                    });

                    alert('Quiz submitted.');
                    window.location.href = "index.html";
                });
            } else {
                console.error('submitQuizBtn not found');
            }

            prevQuestionBtn.addEventListener('click', () => {
                if (currentQuestionIndex > 0) {
                    prevQuestion();
                    updateQuestionWindow();
                    if (currentQuestionIndex === 0) {
                        prevQuestionBtn.disabled = true;
                    }
                    handleUserAnswer();
                }
            });

            nextQuestionBtn.addEventListener('click', () => {
                if (currentQuestionIndex < quizData.Questions.length - 1) {
                    nextQuestion();
                    updateQuestionWindow();
                    prevQuestionBtn.disabled = false;
                    handleUserAnswer();
                }
            });
        }

        const updateQuestionWindow = () => {
            const quizWindow = document.querySelector('.quiz-window');
            const questionText = quizWindow.querySelector('.question-text');
            const answerContainer = quizWindow.querySelector('.quiz-window-answer');
            const hintContainer = quizWindow.querySelector('.hint-container');
            const correctAnswerContainer = quizWindow.querySelector('.correct-answer-container');
            const questionNumber = quizWindow.querySelector('.question-number');

            if (!quizWindow || !questionText || !answerContainer || !hintContainer || !correctAnswerContainer || !questionNumber) {
                console.log('quizWindow, questionText, answerContainer, hintContainer, or correctAnswerContainer is null');
                return;
            }

            answerContainer.innerHTML = '';
            hintContainer.innerHTML = '';
            correctAnswerContainer.innerHTML = '';

            hintContainer.style.display = 'none';
            correctAnswerContainer.style.display = 'none';

            questionNumber.innerText = `Vraag ${currentQuestionIndex + 1} van de ${quizData.Questions.length}`;

            const questionData = quizData.Questions[currentQuestionIndex];

            questionText.innerText = questionData.Text;

            questionData.Options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.classList.add('option');
                optionElement.innerText = `${String.fromCharCode(65 + index) + '. '} ${option}`;
                optionElement.dataset.index = index;

                optionElement.addEventListener('click', () => {
                    const correctOptionIndex = quizData.Questions[currentQuestionIndex].CorrectOption;
                    const correctOptionLetter = String.fromCharCode(65 + correctOptionIndex) + '.';
                    const correctOptionText = quizData.Questions[currentQuestionIndex].Options[correctOptionIndex];
                    const correctOptionDescription = quizData.Questions[currentQuestionIndex].CorrectOptionDescription;

                    handleUserAnswer(optionElement, correctOptionLetter, correctOptionText, correctOptionDescription);

                    nextQuestion();
                    updateQuestionWindow();
                });

                answerContainer.appendChild(optionElement);
            });
        };

        $(document).ready(function () {
            $("#start-quiz-button").on("click", function () {
                $(".quiz-container").toggleClass("layout-changed");
            });
        });

        function showQuizWindow() {
            $('#quiz-window-container').addClass('open');
        }

        function closeQuizWindow() {
            $('#quiz-window-container').removeClass('open');
        }

        $("#start-quiz-button").on("click", function () {
            showQuizWindow();
        });

        $(".close-quiz-window-button").on("click", function () {
            closeQuizWindow();
        });

        $(document).ready(function () {
            const quizWindowContainer = $(".quiz-window-container");
            const quizWindow = $(".quiz-window");
            const embeddedText = $(".embedded-text");
            const hero = $(".hero");

            $("#range-slider").slider({
                min: 0,
                max: 100,
                value: 75,
                range: "min",
                slide: function (event, ui) {
                    const sliderValue = ui.value;
                    const quizWindowWidth = (100 - sliderValue) + "%";
                    const containerWidth = sliderValue + "%";

                    quizWindowContainer.css("width", containerWidth);
                    quizWindow.css("width", quizWindowWidth);
                    embeddedText.css("width", quizWindowWidth);
                    hero.css("width", quizWindowWidth);
                }
            });
        });

        $(".close-quiz-window-button").on("click", function () {
            closeQuizWindow();
        });

        showQuizWindow();
        updateQuestionWindow();

        function showToolbar() {
            $('#toolbar').addClass('open');
            $('#screenreader-button').addClass('hidden');
        }

        function closeToolbar() {
            $('#toolbar').removeClass('open');
            $('#screenreader-button').removeClass('hidden');
        }

        $('#screenreader-button').on('click', function () {
            showToolbar();
        });

        $('#close-toolbar-button').on('click', function () {
            closeToolbar();
        });

        let quizProgress;
        let quizTimerInterval;
        let questionTimerInterval;
        let isPaused = false;

        function updateQuizTimer() {
            quizProgress.timeSpent++;
            updateTimer();
        }

        function updateQuestionTimer() {
            quizProgress.questionStartTime++;
            updateTimer();
        }

        function updateTimer() {
            const quizTimeSpent = Math.floor((Date.now() - quizProgress.quizStartTime) / 1000);
            const questionTimeSpent = Math.floor((Date.now() - quizProgress.questionStartTime) / 1000);

            const quizTimerDisplay = document.querySelector('.quiz-timer');
            quizTimerDisplay.innerText = `Quiz time: ${quizTimeSpent} seconds`;

            const questionTimerDisplay = document.querySelector('.question-timer');
            questionTimerDisplay.innerText = `Question time: ${questionTimeSpent} seconds`;
        }

        function initializePauseResume() {
            const pauseResumeContainer = document.createElement('div');
            pauseResumeContainer.classList.add('pause-resume-container');

            const pauseButton = document.createElement('button');
            pauseButton.classList.add('pause-button');
            pauseButton.innerText = 'Pause';
            pauseResumeContainer.appendChild(pauseButton);

            const resumeButton = document.createElement('button');
            resumeButton.classList.add('resume-button');
            resumeButton.innerText = 'Resume';
            resumeButton.disabled = true;
            pauseResumeContainer.appendChild(resumeButton);

            const pauseTimer = () => {
                isPaused = true;
                pauseButton.innerText = 'Resume';
                resumeButton.disabled = false;
                clearInterval(quizTimerInterval);
                clearInterval(questionTimerInterval);
                saveQuizProgressLocally();
                saveQuizProgressTemporarilyInDatabase();
            };

            const resumeTimer = () => {
                isPaused = false;
                pauseButton.innerText = 'Pause';
                resumeButton.disabled = true;
                quizTimerInterval = setInterval(updateQuizTimer, 1000);
                questionTimerInterval = setInterval(updateQuestionTimer, 1000);
            };

            pauseButton.addEventListener('click', () => {
                if (!isPaused) {
                    pauseTimer();
                } else {
                    resumeTimer();
                }
            });

            resumeButton.addEventListener('click', () => {
                resumeTimer();
            });

            quizTimerInterval = setInterval(updateQuizTimer, 1000);
            questionTimerInterval = setInterval(updateQuestionTimer, 1000);
        }

        function saveQuizProgressLocally() {
            localStorage.setItem('quizProgress', JSON.stringify(quizProgress));
        }

        async function saveQuizProgressTemporarilyInDatabase() {
            const userId = auth.currentUser.uid;
            const pausedQuizzesRef = doc(db, "pausedQuizzes", userId);
            const pausedQuizzesSnap = await getDoc(pausedQuizzesRef);

            if (!pausedQuizzesSnap.exists()) {
                await setDoc(pausedQuizzesRef, {
                    quizzes: [quizProgress],
                    timestamp: new Date()
                });
            } else {
                const quizzes = pausedQuizzesSnap.data().quizzes;
                if (quizzes.length < 3) {
                    quizzes.push(quizProgress);
                    await setDoc(pausedQuizzesRef, {
                        quizzes: quizzes,
                        timestamp: new Date()
                    });
                } else {
                    alert('You have already paused 3 quizzes. Your progress on the previous quiz will be deleted if you pause another one.');
                }
            }
        }

        async function loadQuizProgress() {
            const userId = auth.currentUser.uid;
            const quizId = 'quiz456';
            const progressRef = doc(db, "pausedQuizzes", userId);
            const snapshot = await getDoc(progressRef);

            if (snapshot.exists()) {
                return snapshot.data().quizzes.find(q => q.quizId === quizId);
            }
            return null;
        }

        (async () => {
            quizProgress = await loadQuizProgress();
            initializePauseResume();
        })();

        async function saveQuizProgress() {
            const userId = auth.currentUser.uid;
            const quizId = 'quiz456';
            await setDoc(doc(db, `users/${userId}/quizzes/${quizId}`), quizProgress);
        }
    }
});
