import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCHFj9oABXSxiWm7u1yPOvyhXQw_FRp5Lw",
    authDomain: "project-plato-eb365.firebaseapp.com",
    databaseURL: "https://project-plato-eb365-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-plato-eb365",
    storageBucket: "project-plato-eb365.appspot.com",
    messagingSenderId: "753582080609",
    appId: "1:753582080609:web:98b2db93e63a500a56e020",
    measurementId: "G-KHJXGLJM4Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);
const quizzesCollection = collection(db, "quizzes");

// An image class still needs to be added 
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

// Check if the user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Current User Email:', user.email);

    } else {
        // Redirect the user to the 'login_student_tvt.html'
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
        const quizData = quizDocSnap.data();

        if (quizData) {
            console.log("Document data:", quizData);
            document.querySelector('.title').innerText = quizData.Title;

            // Parse the HTML content
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(quizData.embedded_text, 'text/html');

            // Extract the text and HTML elements
            const textElements = htmlDoc.body.childNodes;
            const textSections = [];

            textElements.forEach((element) => {
                if (element.nodeType === Node.TEXT_NODE) {
                    const text = element.textContent;
                    textSections.push(text);
                } else if (element.tagName) {
                    const tagName = element.tagName.toLowerCase();
                    const text = element.textContent;
                    textSections.push(`<${tagName}>${text}</${tagName}>`);
                }
            });

            console.log('Text sections before processing:', textSections);

            // Process the text sections and add CSS classes 

            // Add suport for images! DO IT!
            const processedTextSections = textSections.map((text) => {
                const textWithoutTags = text.replace(/<[^>]+>/g, '');
                const cssClass = getCssClassForTag(text);
                if (cssClass) {
                    return `<div class="${cssClass}">${textWithoutTags}</div>`;
                } else {
                    return `<div>${textWithoutTags}</div>`;
                }
            });

            console.log('Processed text sections:', processedTextSections);

            // Create containers for each text section and add the special white space class
            const container = document.createElement('div');
            container.className = 'text-section-container';

            processedTextSections.forEach((textSection) => {
                const sectionContainer = document.createElement('div');
                sectionContainer.className = 'text-section';
                sectionContainer.innerHTML = textSection;
                container.appendChild(sectionContainer);
                container.appendChild(document.createElement('div')); // add a special white space class here
            });

            console.log('Container:', container);

            document.querySelector('.embedded-text').innerHTML = '';
            document.querySelector('.embedded-text').appendChild(container);
        } else {
            console.log('quizData is null or undefined');
        }

        // Generate the quiz question and answers by clicking on the startQuizButton

        // Declare the quizWindow variable outside of the event listener
        const quizWindow = document.querySelector('.quiz-window');
        const quizWindowTitle = document.getElementById('question-window-title');
        const questionContainer = quizWindow.querySelector('.question-container');
        const answerContainer = quizWindow.querySelector('.answer-container');
        const questionNumber = quizWindow.querySelector('.question-number');
        const quizWindowContainer = document.querySelector('.quiz-window-container');
        const startQuizButton = document.getElementById("start-quiz-button");
        let currentQuestionIndex = 0; // Initialize currentQuestionIndex here
        const prevQuestionBtn = document.createElement('button');
        const nextQuestionBtn = document.createElement('button');

        startQuizButton.addEventListener('click', () => {
            quizWindow.style.display = 'block';
            quizWindowContainer.classList.remove('hidden'); // Removes the hidden class
            quizWindowContainer.style.display = 'block';
            startQuizButton.style.display = 'none';

            generateQuizWindow();
            showQuizWindow()
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

            const answerContainer = document.createElement('div');
            answerContainer.classList.add('answer-container');

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

            const quizWindowHint = quizWindow.querySelector('.quiz-window-hint');
            if (quizWindowHint) {
                quizWindowHint.innerText = hint.innerText;
            } else {
                console.log('quizWindowHint is null or undefined');
            }

            quizWindowTitle.innerText = question.Text;
            quizWindowHint.innerText = hint.innerText;

            questionContainer.innerHTML = '';
            quizWindowHint.innerHTML = '';
            answerContainer.innerHTML = '';

            console.log(quizWindow)
            console.log('quizWindowTitle:', quizWindowTitle);
            console.log('question:', question);
            console.log('hint:', hint);
            console.log('quizWindowHint:', quizWindowHint);

            question.Options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.classList.add('option');
                optionElement.innerText = option;
                optionElement.addEventListener('click', () => {
                    if (option === question.Correct) {
                        alert('Correct answer!');
                    } else {
                        alert('Incorrect answer.');
                        hint.style.display = 'block';
                    }
                    nextQuestion();
                });
                answerContainer.appendChild(optionElement);
            });

            questionContainer.appendChild(questionText);
            questionContainer.appendChild(answerContainer);
            quizWindow.querySelector('.quiz-window-controls').appendChild(prevQuestionBtn);
            quizWindow.querySelector('.quiz-window-controls').appendChild(nextQuestionBtn);
            quizWindow.querySelector('.quiz-window-hint').appendChild(hint);

            console.log('Question text:', quizWindowTitle.innerText);
            console.log('Question hint:', quizWindowHint.innerText);
            console.log('Question options:', Array.from(answerContainer.children).map(child => child.innerText));
        };

        const generateNavigationButtons = () => {
            const prevQuestionBtn = document.querySelector('.prev-question-btn');
            const nextQuestionBtn = document.querySelector('.next-question-btn');

            if (!prevQuestionBtn || !nextQuestionBtn) {
                console.log('prevQuestionBtn or nextQuestionBtn is null');
                return;
            }

            prevQuestionBtn.addEventListener('click', () => {
                prevQuestion();
            });

            nextQuestionBtn.addEventListener('click', () => {
                nextQuestion();
            });
        };

        const generateTimer = () => {
            const timer = document.createElement('div');
            timer.classList.add('timer');
            timer.innerText = '00:00';

            quizWindow.querySelector('.quiz-window-controls').appendChild(timer);

            let startTime = new Date();
            let elapsedTime = 0;

            const updateTimer = () => {
                const now = new Date();
                elapsedTime = (now - startTime) / 1000;
                const minutes = Math.floor(elapsedTime / 60);
                const seconds = Math.floor(elapsedTime % 60);
                const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                timer.innerText = formattedTime;
            };

            setInterval(updateTimer, 1000);
        };

        const generateQuizWindow = () => {
            if (!quizWindow) {
                console.log('quizWindow is null');
                return;
            }

            quizWindow.style.display = 'block';
            quizWindowContainer.style.display = 'block';

            // Initialize the question window, navigation buttons, and timer
            generateNavigationButtons();
            generateTimer();
            generateQuestionWindow();
        };

        const answerOptions = quizWindow.querySelectorAll('.option');
        answerOptions.forEach((option, index) => {
            console.log(`Option ${index + 1}: ${option.innerText}`);
        });

        // console.log(quizWindow.querySelector('.prev-question-btn').innerText);
        // console.log(quizWindow.querySelector('.next-question-btn').innerText);
        // console.log(quizWindow.querySelector('.timer').innerText);
    };

    const quizWindowClose = document.querySelector('.quiz-window-close');
    quizWindowClose.addEventListener('click', () => {
        const quizWindow = document.querySelector('.quiz-window');
        quizWindow.classList.remove('open');
        quizWindowContainer.classList.add('hidden'); // Add the hidden class
        startQuizButton.style.display = 'block';
    });


    let currentQuestionIndex = 0;

    async function initializeQuiz() {
        // const user = firebase.auth().currentUser;
        // if (!user) {

        // }
        // else {
        //     // Redirect the user to the 'login_student_tvt.html'
        //     window.location.href = "login_student_tvt.html";
        // }


        const quizWindow = document.querySelector('.quiz-window');
        quizWindow.querySelector('.quiz-window-title').innerText = quizData.Title;

        const prevQuestionBtn = document.createElement('button');
        prevQuestionBtn.classList.add('prev-question-btn');
        prevQuestionBtn.innerText = 'Previous';
        prevQuestionBtn.disabled = true;

        const nextQuestionBtn = document.createElement('button');
        nextQuestionBtn.classList.add('next-question-btn');
        nextQuestionBtn.innerText = 'Next';
        nextQuestionBtn.disabled = currentQuestionIndex === quizData.Questions.length - 1;

        const questionContainer = document.querySelector('.question-container');
        const questionText = document.createElement('div');
        questionText.classList.add('question-text');
        questionText.innerText = quizData.Questions[currentQuestionIndex].Question;

        const answerContainer = document.createElement('div');
        answerContainer.classList.add('answer-container');

        quizWindow.querySelector('.quiz-window-header .question-number').innerText = `${currentQuestionIndex + 1} / ${quizData.Questions.length}`;

        quizData.Questions[currentQuestionIndex].Options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('option');
            optionElement.innerText = option;
            optionElement.addEventListener('click', () => {
                if (option === quizData.Questions[currentQuestionIndex].Correct) {
                    alert('Correct answer!');
                } else {
                    alert('Incorrect answer.');
                }
                nextQuestion();
            });
            answerContainer.appendChild(optionElement);
        });

        questionContainer.appendChild(questionText);
        questionContainer.appendChild(answerContainer);
        quizWindow.querySelector('.quiz-window-controls').appendChild(prevQuestionBtn);
        quizWindow.querySelector('.quiz-window-controls').appendChild(nextQuestionBtn);

        let answeredQuestions = 0;

        const options = document.querySelectorAll('.option');
        options.forEach((option) => {
            option.addEventListener('click', () => {
                answeredQuestions++;
                checkSubmitButton();
            });
        });

        function checkSubmitButton() {
            if (answeredQuestions === quizData.Questions.length) {
                const submitQuizBtn = document.querySelector('.submit-quiz-btn');
                if (submitQuizBtn) {
                    submitQuizBtn.style.display = 'block';
                } else {
                    console.error('submitQuizBtn not found');
                }
            }
        }

        checkSubmitButton();

        const submitQuizBtn = document.querySelector('.submit-quiz-btn');
        if (submitQuizBtn) {
            submitQuizBtn.addEventListener('click', async () => {
                const selectedOption = document.querySelector('input[name="option"]:checked');
                if (!selectedOption) {
                    alert('Please select an option.');
                    return;
                }

                const correctOption = quizData.Questions[currentQuestionIndex].Correct;
                const result = selectedOption.value === correctOption ? 'correct' : 'incorrect';

                await firebase.firestore().collection('quizResults').add({
                    userId: user.uid,
                    quizId: quizId,
                    result: result,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
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
            }
        });

        nextQuestionBtn.addEventListener('click', () => {
            if (currentQuestionIndex < quizData.Questions.length - 1) {
                nextQuestion();
            }
        });
    }

    function prevQuestion() {
        currentQuestionIndex--;
        updateQuestion();
    }

    function nextQuestion() {
        currentQuestionIndex++;
        updateQuestion();
    }

    function updateQuestion() {
        const quizWindow = document.querySelector('.quiz-window');
        const questionText = quizWindow.querySelector('.question-text');
        const answerContainer = quizWindow.querySelector('.answer-container');
        const prevQuestionBtn = quizWindow.querySelector('.prev-question-btn');
        const nextQuestionBtn = quizWindow.querySelector('.next-question-btn');

        questionText.innerText = quizData.Questions[currentQuestionIndex].Question;
        answerContainer.innerHTML = '';

        quizData.Questions[currentQuestionIndex].Options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('option');
            optionElement.innerText = option;
            optionElement.addEventListener('click', () => {
                if (option === quizData.Questions[currentQuestionIndex].Correct) {
                    alert('Correct answer!');
                } else {
                    alert('Incorrect answer.');
                }
                nextQuestion();
            });
            answerContainer.appendChild(optionElement);
        });

        prevQuestionBtn.disabled = currentQuestionIndex === 0;
        nextQuestionBtn.disabled = currentQuestionIndex === quizData.Questions.length - 1;

        quizWindow.querySelector('.quiz-window-header .question-number').innerText = `${currentQuestionIndex + 1} / ${quizData.Questions.length}`;
    }

    initializeQuiz();


    // the following code is reponsible for managaging the size of the quiz-window
    $(document).ready(function () {
        $("#start-quiz-button").on("click", function () {
            $(".quiz-container").toggleClass("layout-changed");
        });
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

    // Add a CSS class to the container when the quiz window is generated
    function showQuizWindow() {
        // ...
        document.getElementById('quiz-window-container').classList.add('open');
    }

    // Remove the CSS class from the container when the quiz window is closed
    function closeQuizWindow() {
        // ...
        document.getElementById('quiz-window-container').classList.remove('open');
    }
});


// Get the embedded text data from Firestore
// const embeddedTextDoc = await embeddedTextCollection.doc(embeddedTextId).get();
// const embeddedTextJson = embeddedTextDoc.data().data;

// // Parse the JSON object
// const embeddedTextData = JSON.parse(embeddedTextJson);

// // Generate the HTML for the embedded text
// const embeddedTextHtml = Handlebars.compile(embeddedTextData.html);

// // Insert the HTML into the page
// const embeddedTextContainer = document.querySelector("#embedded-text-container");
// embeddedTextContainer.innerHTML = embeddedTextHtml;

// // Apply the CSS preferences
// const embeddedTextCss = embeddedTextData.css;
// for (const key in embeddedTextCss) {
//   embeddedTextContainer.style[key] = embeddedTextCss[key];
// }

