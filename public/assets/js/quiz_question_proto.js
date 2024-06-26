import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, auth, db } from "./firebase_config.js";

// State Management
let quizData = [];
let currentQuestionIndex = 0;
let userResponses = {};
let attempts = {};
let feedback = {};
let selectedOptionIndex = null;
let startTime;
let questionStartTime;
let quizSummary = {};

// Save state to localStorage
const saveState = () => {
    const state = {
        currentQuestionIndex,
        userResponses,
        attempts,
        feedback,
        selectedOptionIndex,
        startTime: startTime.getTime()
    };
    localStorage.setItem('quizState', JSON.stringify(state));
    console.log("State saved to localStorage:", state);
};

// Load state from localStorage
const loadState = () => {
    const state = JSON.parse(localStorage.getItem('quizState'));
    if (state) {
        currentQuestionIndex = state.currentQuestionIndex;
        userResponses = state.userResponses;
        attempts = state.attempts;
        feedback = state.feedback;
        selectedOptionIndex = state.selectedOptionIndex;
        startTime = new Date(state.startTime);
        console.log("State loaded from localStorage:", state);
    } else {
        startTime = new Date();
        console.log("No previous state found, starting new quiz.");
    }
};

// Clear state from localStorage
const clearState = () => {
    localStorage.removeItem('quizState');
    console.log("State cleared from localStorage.");
};

// Fetch quiz data
const fetchQuizData = async (quizId) => {
    try {
        console.log(`Fetching quiz data for quizId: ${quizId}`);
        const docRef = doc(db, "quizzes", quizId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const quizDoc = docSnap.data();
            console.log("Quiz data retrieved from Firestore:", quizDoc);
            quizData = quizDoc.Questions;
            console.log("Quiz questions:", quizData);
            document.getElementById('quiz-title').innerText = quizDoc.Title;
            // Store metadata in quizData
            quizData.Title = quizDoc.Title;
            quizData.QuizGroupId = quizDoc.QuizGroupId;
            quizData.QuizType = quizDoc.QuizType;
            loadState();
            displayQuestion();
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error fetching document: ", error);
    }
};

// Display current question
const displayQuestion = () => {
    const question = quizData[currentQuestionIndex];
    console.log(`Displaying question ${currentQuestionIndex + 1}:`, question);
    document.getElementById('question-text').innerText = question.Text;
    document.getElementById('question-tracker').innerText = `Question ${currentQuestionIndex + 1} out of ${quizData.length}`;
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    question.Options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.innerText = `${String.fromCharCode(65 + index)}. ${option}`;
        optionElement.onclick = () => selectOption(index);

        // Apply styles if the option was previously selected
        if (feedback[currentQuestionIndex]) {
            console.log(`Applying feedback for question ${currentQuestionIndex + 1}`);
            if (feedback[currentQuestionIndex].includes(index)) {
                optionElement.classList.add(feedback[currentQuestionIndex][0] === index ? 'correct' : 'incorrect');
            }
        }

        // Disable options if the question has been completed
        if (userResponses[currentQuestionIndex] !== undefined) {
            optionElement.style.pointerEvents = 'none';
            optionElement.style.opacity = '0.6';
        }

        optionsContainer.appendChild(optionElement);
    });

    document.getElementById('prev-button').disabled = currentQuestionIndex === 0;
    document.getElementById('next-button').disabled = selectedOptionIndex === null && userResponses[currentQuestionIndex] === undefined;

    document.getElementById('dialogue-hint').classList.add('hidden');
    document.getElementById('dialogue-answer').classList.add('hidden');

    // Show hint and answer if navigating back to a completed question
    if (userResponses[currentQuestionIndex] !== undefined && attempts[currentQuestionIndex]) {
        showHint();
        showAnswer();
    }

    if (currentQuestionIndex === quizData.length - 1) {
        document.getElementById('next-button').innerText = 'Finish Quiz';
    } else {
        document.getElementById('next-button').innerText = 'Next';
    }

    // Ensure the next button has the correct event listener
    document.getElementById('next-button').onclick = handleNextButtonClick;

    questionStartTime = new Date();
};

// Select an option
const selectOption = (index) => {
    if (attempts[currentQuestionIndex] && attempts[currentQuestionIndex].length >= 2) {
        return; // Prevent re-attempting already completed questions
    }

    selectedOptionIndex = index;
    const options = document.getElementsByClassName('option');
    Array.from(options).forEach((option, idx) => {
        if (!option.classList.contains('correct') && !option.classList.contains('incorrect')) {
            option.classList.remove('selected');
        }
        if (idx === index) {
            option.classList.add('selected');
        }
    });

    document.getElementById('next-button').disabled = false;
    saveState();
};

// Handle next button click
const handleNextButtonClick = () => {
    if (userResponses[currentQuestionIndex] === undefined) {
        checkAnswer(selectedOptionIndex);
        clearSelectedClass();
    } else {
        clearSelectedClass();
        moveToNextQuestion();
    }
};

// Check answer
const checkAnswer = (index) => {
    const question = quizData[currentQuestionIndex];
    if (!attempts[currentQuestionIndex]) {
        attempts[currentQuestionIndex] = [];
    }

    if (attempts[currentQuestionIndex].length >= 2) {
        console.log(`Attempts exceeded for question ${currentQuestionIndex + 1}`);
        document.getElementById('next-button').disabled = false; // Ensure next button is enabled
        return (moveToNextQuestion());

    }

    attempts[currentQuestionIndex].push(index);
    console.log(`Checking answer for question ${currentQuestionIndex + 1}: selected option ${index}, correct option ${question.CorrectOption}`);

    const optionElements = document.getElementsByClassName('option');
    const selectedOptionElement = optionElements[index];

    if (question.CorrectOption === index) {
        feedback[currentQuestionIndex] = [index];
        userResponses[currentQuestionIndex] = index;
        selectedOptionElement.classList.add('correct');
        logEvent(`Question ${currentQuestionIndex + 1}: Correct on attempt ${attempts[currentQuestionIndex].length}`);
        logCurrentScore();
        disableOptions(optionElements); // Disable options immediately after a correct answer
        clearSelectedClass(); // Clear selected class before moving to the next question
        saveState();
        moveToNextQuestion();
    } else {
        feedback[currentQuestionIndex] = feedback[currentQuestionIndex] || [];
        feedback[currentQuestionIndex].push(index);
        selectedOptionElement.classList.add('incorrect');
        logEvent(`Question ${currentQuestionIndex + 1}: Incorrect on attempt ${attempts[currentQuestionIndex].length}`);

        if (attempts[currentQuestionIndex].length === 2) {
            const correctOptionIndex = question.CorrectOption;
            const correctOptionElement = optionElements[correctOptionIndex];
            correctOptionElement.classList.add('correct');
            logEvent(`Question ${currentQuestionIndex + 1}: Second attempt result checked`);
            document.getElementById('next-button').disabled = false; // Enable next button after second attempt
        }

        // Show hint and prevent next question navigation on first incorrect attempt
        if (attempts[currentQuestionIndex].length === 1) {
            showHint();
            document.getElementById('next-button').disabled = true;
        } else {
            showAnswer();
            document.getElementById('next-button').disabled = false;
        }

        if (attempts[currentQuestionIndex].length >= 2) {
            disableOptions(optionElements); // Disable options if the question is completed
        }

        saveState();
    }

    // Log question results
    if (attempts[currentQuestionIndex].length === 1) {
        console.log(`Question ${currentQuestionIndex + 1}: Answered ${index === question.CorrectOption ? 'correctly' : 'incorrectly'} on first attempt.`);
    } else if (attempts[currentQuestionIndex].length === 2) {
        console.log(`Question ${currentQuestionIndex + 1}: Answered ${index === question.CorrectOption ? 'correctly' : 'incorrectly'} on second attempt. Previous attempt: ${attempts[currentQuestionIndex][0]}`);
    }
};

// Disable options
const disableOptions = (optionElements) => {
    Array.from(optionElements).forEach((option) => {
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.6';
    });
};

// Clear the selected class from options
const clearSelectedClass = () => {
    const options = document.getElementsByClassName('option');
    Array.from(options).forEach(option => option.classList.remove('selected'));
};

// Log the current score
const logCurrentScore = () => {
    const scoreWithHints = calculateScore(true);
    const scoreWithoutHints = calculateScore(false);
    console.log(`Current score with hints: ${scoreWithHints}`);
    console.log(`Current score without hints: ${scoreWithoutHints}`);
};

// Move to next question
const moveToNextQuestion = () => {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        selectedOptionIndex = null;
        clearSelectedClass(); // Clear selected class before displaying the next question
        displayQuestion();
    } else {
        endQuiz();
    }
};

// Show hint
const showHint = () => {
    console.log(`Showing hint for question ${currentQuestionIndex + 1}`);
    document.getElementById('dialogue-hint').innerText = quizData[currentQuestionIndex].Hint;
    document.getElementById('dialogue-hint').classList.remove('hidden');
};

// Show answer
const showAnswer = () => {
    console.log(`Showing answer for question ${currentQuestionIndex + 1}`);
    document.getElementById('dialogue-answer').innerText = quizData[currentQuestionIndex].CorrectOptionDescription;
    document.getElementById('dialogue-answer').classList.remove('hidden');
    document.getElementById('next-button').disabled = false;
};

// End quiz
const endQuiz = () => {
    const endTime = new Date();
    const totalTime = endTime - startTime;
    const scoreWithHints = calculateScore(true);
    const scoreWithoutHints = calculateScore(false);
    const correctQuestions = Object.values(userResponses).filter(response => response !== undefined).length;

    console.log(`Score with hints: ${scoreWithHints}`);
    console.log(`Score without hints: ${scoreWithoutHints}`);
    console.log(`Total time: ${formatTime(totalTime)}`);

    // Create an object with the required data
    quizSummary = {
        title: quizData.Title,
        groupId: quizData.QuizGroupId,
        type: quizData.QuizType,
        state: 'finished',
        time: formatTime(totalTime),
        scoreWithoutHints: scoreWithoutHints.toFixed(1),
        scoreWithHints: scoreWithHints.toFixed(1),
        correctQuestions,
        totalQuestions: quizData.length,
        dateTime: new Date().toISOString()
    };

    // Log the quiz summary
    console.log('Quiz Summary:', quizSummary);

    showQuizModal(scoreWithHints, scoreWithoutHints, formatTime(totalTime), correctQuestions, quizData.length);

    // Send quiz summary to parent window
    window.parent.postMessage({
        type: 'quizSummary',
        quizSummary
    }, '*');

    logEvent('Quiz Completed');
    clearState(); // Clear state at the end of the quiz
};

// Calculate score
const calculateScore = (withHints) => {
    let correctAnswers = 0;
    let totalQuestions = quizData.length;
    quizData.forEach((question, index) => {
        if (feedback[index] && feedback[index][0] === question.CorrectOption) {
            if (withHints || attempts[index].length === 1) {
                correctAnswers++;
            }
        }
    });
    return ((correctAnswers / totalQuestions) * 9 + 1);
};

// Format time
const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
};

// Log event
const logEvent = (message) => {
    console.log(message);
};

// Event listeners
document.getElementById('prev-button').onclick = () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        selectedOptionIndex = null;
        clearSelectedClass(); // Clear selected class when navigating to the previous question
        displayQuestion();
    }
};

document.getElementById('next-button').onclick = handleNextButtonClick;

// document.getElementById('close-overlay-button').onclick = () => {
//     document.getElementById('quiz-overlay').classList.add('hidden');
//     document.getElementById('quiz-overlay').style.display = 'none'; // Ensure overlay is hidden when closed
//     // Optionally reset quiz or navigate away
// };

// Add event listener to clear local storage button
document.getElementById('clear-button').onclick = () => {
    clearState();
    alert('Local storage cleared.');
    window.location.reload(); // Reload the page to start fresh
};

// Initialize quiz
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id'); // Assuming the URL has a parameter like ?id=0
if (quizId) {
    fetchQuizData(quizId);
}
startTime = new Date();
document.getElementById('quiz-overlay').classList.add('hidden'); // Ensure overlay is hidden when page loads
document.getElementById('quiz-overlay').style.display = 'none'; // Ensure overlay is hidden when page loads

// Ensure the last unanswered question is displayed on page load
window.onload = () => {
    if (quizId) {
        loadState();
        displayQuestion();
    }
};

// Export the quizSummary object
export { quizSummary };

// New Overlay Functions

function closeQuizModal() {
    $('#quizOverlay').hide();
    stopConfetti();
    console.log("Confetti stopped and overlay hidden");
    window.location.href = "student_dashboard.html"; // Redirect to student dashboard
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.quiz-close').addEventListener('click', closeQuizModal);
});

function showQuizModal(scoreWithHints, scoreWithoutHints, totalTime, correctQuestions, totalQuestions) {
    $('#scoreWithHints').text(scoreWithHints);
    $('#scoreWithoutHints').text(scoreWithoutHints);
    $('#totalTime').text(totalTime);
    $('#correctQuestions').text(correctQuestions);
    $('#totalQuestions').text(totalQuestions);

    // Apply styles based on score values
    setCircleColor('#scoreWithHintsCircle', scoreWithHints);
    setCircleColor('#scoreWithoutHintsCircle', scoreWithoutHints);

    // Set summary color
    setSummaryColor(correctQuestions, totalQuestions);

    $('#quizOverlay').show();
    startConfetti(); // Start confetti when modal is shown
    console.log("Confetti started and overlay displayed");
}

function setCircleColor(circleId, score) {
    const circle = $(circleId);
    const coloredRing = circle.find('.colored-ring');
    circle.removeClass('gold-ring pulsating-glow');
    circle.find('.olive-crown').remove();
    coloredRing.css('border-color', 'transparent');

    if (score === 10) {
        circle.addClass('gold-ring pulsating-glow');
        circle.append('<img src="../public/assets/images/olive_crown.png" class="olive-crown" alt="Olive Crown">');
        coloredRing.css('border-color', 'gold');
    } else if (score >= 5.5 && score <= 9.9) {
        coloredRing.css('border-color', 'green');
    } else {
        coloredRing.css('border-color', 'crimson');
    }
}

function setSummaryColor(correctQuestions, totalQuestions) {
    const summary = $('#correctQuestions');
    if (correctQuestions >= totalQuestions / 2) {
        summary.css('color', 'green');
    } else {
        summary.css('color', 'crimson');
    }
}

// Confetti code
var maxParticleCount = 150; // set max confetti count
var particleSpeed = 2; // set the particle animation speed
var startConfetti; // call to start confetti animation
var stopConfetti; // call to stop adding confetti
var toggleConfetti; // call to start or stop the confetti animation depending on whether it's already running
var removeConfetti; // call to stop the confetti animation and remove all confetti immediately

(function () {
    startConfetti = startConfettiInner;
    stopConfetti = stopConfettiInner;
    toggleConfetti = toggleConfettiInner;
    removeConfetti = removeConfettiInner;
    var colors = ["DodgerBlue", "OliveDrab", "Gold", "Pink", "SlateBlue", "LightBlue", "Violet", "PaleGreen", "SteelBlue", "SandyBrown", "Chocolate", "Crimson"];
    var streamingConfetti = false;
    var animationTimer = null;
    var particles = [];
    var waveAngle = 0;

    function resetParticle(particle, width, height) {
        particle.color = colors[(Math.random() * colors.length) | 0];
        particle.x = Math.random() * width;
        particle.y = Math.random() * height - height;
        particle.diameter = Math.random() * 10 + 5;
        particle.tilt = Math.random() * 10 - 10;
        particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
        particle.tiltAngle = 0;
        return particle;
    }

    function startConfettiInner() {
        console.log("Starting confetti animation");
        var width = window.innerWidth;
        var height = window.innerHeight;
        window.requestAnimFrame = (function () {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (callback) {
                    return window.setTimeout(callback, 16.6666667);
                };
        })();
        var canvas = document.getElementById("confetti-canvas");
        if (canvas === null) {
            canvas = document.createElement("canvas");
            canvas.setAttribute("id", "confetti-canvas");
            canvas.setAttribute("style", "display:block;z-index:999999;pointer-events:none");
            document.body.appendChild(canvas);
            canvas.width = width;
            canvas.height = height;
            window.addEventListener("resize", function () {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }, true);
        }
        var context = canvas.getContext("2d");
        while (particles.length < maxParticleCount)
            particles.push(resetParticle({}, width, height));
        streamingConfetti = true;
        if (animationTimer === null) {
            (function runAnimation() {
                context.clearRect(0, 0, window.innerWidth, window.innerHeight);
                if (particles.length === 0)
                    animationTimer = null;
                else {
                    updateParticles();
                    drawParticles(context);
                    animationTimer = requestAnimFrame(runAnimation);
                }
            })();
        }
    }

    function stopConfettiInner() {
        console.log("Stopping confetti animation");
        streamingConfetti = false;
    }

    function removeConfettiInner() {
        stopConfetti();
        particles = [];
        console.log("Confetti removed");
    }

    function toggleConfettiInner() {
        if (streamingConfetti)
            stopConfettiInner();
        else
            startConfettiInner();
    }

    function drawParticles(context) {
        var particle;
        var x;
        for (var i = 0; i < particles.length; i++) {
            particle = particles[i];
            context.beginPath();
            context.lineWidth = particle.diameter;
            context.strokeStyle = particle.color;
            x = particle.x + particle.tilt;
            context.moveTo(x + particle.diameter / 2, particle.y);
            context.lineTo(x, particle.y + particle.tilt + particle.diameter / 2);
            context.stroke();
        }
    }

    function updateParticles() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var particle;
        waveAngle += 0.01;
        for (var i = 0; i < particles.length; i++) {
            particle = particles[i];
            if (!streamingConfetti && particle.y < -15)
                particle.y = height + 100;
            else {
                particle.tiltAngle += particle.tiltAngleIncrement;
                particle.x += Math.sin(waveAngle);
                particle.y += (Math.cos(waveAngle) + particle.diameter + particleSpeed) * 0.5;
                particle.tilt = Math.sin(particle.tiltAngle) * 15;
            }
            if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
                if (streamingConfetti && particles.length <= maxParticleCount)
                    resetParticle(particle, width, height);
                else {
                    particles.splice(i, 1);
                    i--;
                }
            }
        }
    }
})();
