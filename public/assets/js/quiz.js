import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { initScreenReader } from '../js/screenreader_quiztext.js';
import { app, auth, db } from "./firebase_config.js";
import { redirectUserBasedOnRole } from "./roleRedirect.js";

export let quizData;

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

// Function to clear the local storage and reset state
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

            // Clear state and reset local storage after uploading quiz summary
            clearState();
            console.log("Local storage and quiz state cleared for next quiz.");

            // Trigger confetti and show modal
            triggerConfetti();
            showQuizModal(quizSummary.scoreWithHints, quizSummary.scoreWithoutHints, quizSummary.time, quizSummary.correctQuestions, quizSummary.totalQuestions);
        } catch (error) {
            console.error("Error uploading quiz summary:", error);
        }
    } else {
        console.error("No user is currently signed in.");
    }
}

function formatScore(score) {
    return Math.round(score * 10) / 10;
}

function closeQuizModal() {
    document.getElementById('quizOverlay').style.display = 'none';
    window.location.href = "student_dashboard.html";
}

function triggerConfetti() {
    // Placeholder for confetti animation implementation
    // You can use an external library like 'canvas-confetti' for better effects
    console.log("Confetti animation triggered");
    startConfetti();
}

window.addEventListener('message', (event) => {
    if (event.data.type === 'quizSummary') {
        const quizSummary = event.data.quizSummary;
        quizSummary.scoreWithHints = formatScore(quizSummary.scoreWithHints);
        quizSummary.scoreWithoutHints = formatScore(quizSummary.scoreWithoutHints);
        uploadQuizSummary(quizSummary);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const startQuizButton = document.querySelector('.start-quiz-button');
    const quizContainer = document.querySelector('.quiz-container');

    if (startQuizButton) {
        startQuizButton.addEventListener('click', () => {
            quizContainer.classList.add('active');
            startQuizButton.classList.add('hidden');
        });
    }
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
