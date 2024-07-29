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

                    // document.getElementById('start-quiz-button').addEventListener('click', () => {
                    //     swapButton.style.display = 'block';
                    //     document.querySelector('.text-section-container').classList.add('hidden');
                    //     document.querySelector('.quiz-window-container').classList.remove('hidden');
                    //     document.getElementById('start-quiz-button').classList.add('hidden');
                    //     console.log('Start quiz button clicked, switched to top layer');
                    // });

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

    // Add button for swapping between layers
    const swapButton = document.createElement('button');
    swapButton.id = 'swap-layers-button';
    swapButton.textContent = 'Swap Layers';
    swapButton.style.display = 'none';
    swapButton.addEventListener('click', () => {

        const quizContainer = document.querySelector('.quiz-container');
        const quizWindow = document.querySelector('.quiz-window-container');

        if (quizWindow.classList.contains('hidden')) {
            quizWindow.classList.remove('hidden');
            quizContainer.classList.add('active');
            console.log('Reapplied active class to quiz container and removed hidden class from quiz window');
        } else {
            quizWindow.classList.add('hidden');
            quizContainer.classList.remove('active');
            console.log('Added hidden class to quiz window and removed active class from quiz container');
        }
        logLayerVisibility();
    });
    document.body.appendChild(swapButton);
};

// document.addEventListener('DOMContentLoaded', () => {
//     const swapLayersButton = document.getElementById('swap-layers-button');

//     if (swapLayersButton) {
//         swapLayersButton.addEventListener('click', () => {
//             const quizContainer = document.querySelector('.quiz-container');
//             const quizWindow = document.querySelector('.quiz-window-container');

//             if (quizWindow.classList.contains('hidden')) {
//                 quizWindow.classList.remove('hidden');
//                 quizContainer.classList.add('active');
//                 console.log('Reapplied active class to quiz container and removed hidden class from quiz window');
//             } else {
//                 quizWindow.classList.add('hidden');
//                 quizContainer.classList.remove('active');
//                 console.log('Added hidden class to quiz window and removed active class from quiz container');
//             }
//         });
//     }
// });


const logLayerVisibility = () => {
    console.log('Content Layer Visible:', !document.querySelector('.text-section-container').classList.contains('hidden'));
    console.log('Quiz Layer Visible:', !document.querySelector('.quiz-window-container').classList.contains('hidden'));
};

logLayerVisibility();

document.getElementById('start-quiz-button').addEventListener('click', () => {
    const quizContainer = document.getElementById('quiz-window-container');
    const textContainer = document.querySelector('.text-section-container');
    quizContainer.classList.remove('hidden');
    quizContainer.style.position = 'absolute';
    quizContainer.style.top = `${textContainer.offsetTop}px`;
    quizContainer.style.right = '0';
    // textContainer.style.maxWidth = '65%';
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

// // Function to clear the local storage and reset state
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
            // triggerConfetti();
            // showQuizModal(quizSummary.scoreWithHints, quizSummary.scoreWithoutHints, quizSummary.time, quizSummary.correctQuestions, quizSummary.totalQuestions);
        } catch (error) {
            console.error("Error uploading quiz summary:", error);
        }
    } else {
        console.error("No user is currently signed in.");
    }
}

// function formatScore(score) {
//     return Math.round(score * 10) / 10;
// }

// function closeQuizModal() {
//     document.getElementById('quizOverlay').style.display = 'none';
//     window.location.href = "student_dashboard.html";
// }

// function triggerConfetti() {
//     // Placeholder for confetti animation implementation
//     // You can use an external library like 'canvas-confetti' for better effects
//     console.log("Confetti animation triggered");
//     startConfetti();
// }

// window.addEventListener('message', (event) => {
//     if (event.data.type === 'quizSummary') {
//         const quizSummary = event.data.quizSummary;
//         quizSummary.scoreWithHints = formatScore(quizSummary.scoreWithHints);
//         quizSummary.scoreWithoutHints = formatScore(quizSummary.scoreWithoutHints);
//         uploadQuizSummary(quizSummary);
//     }
// });

document.addEventListener('DOMContentLoaded', () => {
    const startQuizButton = document.querySelector('.start-quiz-button');
    const quizContainer = document.querySelector('.quiz-container');

    if (startQuizButton) {
        startQuizButton.addEventListener('click', () => {
            quizContainer.classList.add('active');
            startQuizButton.classList.add('hidden');

            // Scroll to the top of the page
            window.scrollTo({
                top: 0,
                behavior: 'smooth' // Optional: Adds a smooth scrolling animation
            });

            // Load the quiz window container
            const quizWindowContainer = document.getElementById('quiz-window-container');
            quizWindowContainer.classList.remove('hidden');

            // Display the swap button
            const swapButton = document.getElementById('swap-layers-button');
            if (swapButton) {
                swapButton.style.display = 'block';
            }
        });
    }

});

// function showQuizModal(scoreWithHints, scoreWithoutHints, totalTime, correctQuestions, totalQuestions) {
//     $('#scoreWithHints').text(scoreWithHints);
//     $('#scoreWithoutHints').text(scoreWithoutHints);
//     $('#totalTime').text(totalTime);
//     $('#correctQuestions').text(correctQuestions);
//     $('#totalQuestions').text(totalQuestions);

//     // Apply styles based on score values
//     setCircleColor('#scoreWithHintsCircle', scoreWithHints);
//     setCircleColor('#scoreWithoutHintsCircle', scoreWithoutHints);

//     // Set summary color
//     setSummaryColor(correctQuestions, totalQuestions);

//     // $('#quizOverlay').show();
//     // console.log("Confetti started and overlay displayed");
// }

// function setCircleColor(circleId, score) {
//     const circle = $(circleId);
//     const coloredRing = circle.find('.colored-ring');
//     circle.removeClass('gold-ring pulsating-glow');
//     circle.find('.olive-crown').remove();
//     coloredRing.css('border-color', 'transparent');

//     if (score === 10) {
//         circle.addClass('gold-ring pulsating-glow');
//         circle.append('<img src="../public/assets/images/olive_crown.png" class="olive-crown" alt="Olive Crown">');
//         coloredRing.css('border-color', 'gold');
//     } else if (score >= 5.5 && score <= 9.9) {
//         coloredRing.css('border-color', 'green');
//     } else {
//         coloredRing.css('border-color', 'crimson');
//     }
// }

// function setSummaryColor(correctQuestions, totalQuestions) {
//     const summary = $('#correctQuestions');
//     if (correctQuestions >= totalQuestions / 2) {
//         summary.css('color', 'green');
//     } else {
//         summary.css('color', 'crimson');
//     }
// }

// Confetti code
// var maxParticleCount = 150; // set max confetti count
// var particleSpeed = 2; // set the particle animation speed
// var startConfetti; // call to start confetti animation
// var stopConfetti; // call to stop adding confetti
// var toggleConfetti; // call to start or stop the confetti animation depending on whether it's already running
// var removeConfetti; // call to stop the confetti animation and remove all confetti immediately

// (function () {
//     startConfetti = startConfettiInner;
//     stopConfetti = stopConfettiInner;
//     toggleConfetti = toggleConfettiInner;
//     removeConfetti = removeConfettiInner;
//     var colors = ["DodgerBlue", "OliveDrab", "Gold", "Pink", "SlateBlue", "LightBlue", "Violet", "PaleGreen", "SteelBlue", "SandyBrown", "Chocolate", "Crimson"];
//     var streamingConfetti = false;
//     var animationTimer = null;
//     var particles = [];
//     var waveAngle = 0;

//     function resetParticle(particle, width, height) {
//         particle.color = colors[(Math.random() * colors.length) | 0];
//         particle.x = Math.random() * width;
//         particle.y = Math.random() * height - height;
//         particle.diameter = Math.random() * 10 + 5;
//         particle.tilt = Math.random() * 10 - 10;
//         particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
//         particle.tiltAngle = 0;
//         return particle;
//     }

//     function startConfettiInner() {
//         console.log("Starting confetti animation");
//         var width = window.innerWidth;
//         var height = window.innerHeight;
//         window.requestAnimFrame = (function () {
//             return window.requestAnimationFrame ||
//                 window.webkitRequestAnimationFrame ||
//                 window.mozRequestAnimationFrame ||
//                 window.oRequestAnimationFrame ||
//                 window.msRequestAnimationFrame ||
//                 function (callback) {
//                     return window.setTimeout(callback, 16.6666667);
//                 };
//         })();
//         var canvas = document.getElementById("confetti-canvas");
//         if (canvas === null) {
//             canvas = document.createElement("canvas");
//             canvas.setAttribute("id", "confetti-canvas");
//             canvas.setAttribute("style", "display:block;z-index:999999;pointer-events:none");
//             document.body.appendChild(canvas);
//             canvas.width = width;
//             canvas.height = height;
//             window.addEventListener("resize", function () {
//                 canvas.width = window.innerWidth;
//                 canvas.height = window.innerHeight;
//             }, true);
//         }
//         var context = canvas.getContext("2d");
//         while (particles.length < maxParticleCount)
//             particles.push(resetParticle({}, width, height));
//         streamingConfetti = true;
//         if (animationTimer === null) {
//             (function runAnimation() {
//                 context.clearRect(0, 0, window.innerWidth, window.innerHeight);
//                 if (particles.length === 0)
//                     animationTimer = null;
//                 else {
//                     updateParticles();
//                     drawParticles(context);
//                     animationTimer = requestAnimFrame(runAnimation);
//                 }
//             })();
//         }
//     }

//     function stopConfettiInner() {
//         console.log("Stopping confetti animation");
//         streamingConfetti = false;
//     }

//     function removeConfettiInner() {
//         stopConfetti();
//         particles = [];
//         console.log("Confetti removed");
//     }

//     function toggleConfettiInner() {
//         if (streamingConfetti)
//             stopConfettiInner();
//         else
//             startConfettiInner();
//     }

//     function drawParticles(context) {
//         var particle;
//         var x;
//         for (var i = 0; i < particles.length; i++) {
//             particle = particles[i];
//             context.beginPath();
//             context.lineWidth = particle.diameter;
//             context.strokeStyle = particle.color;
//             x = particle.x + particle.tilt;
//             context.moveTo(x + particle.diameter / 2, particle.y);
//             context.lineTo(x, particle.y + particle.tilt + particle.diameter / 2);
//             context.stroke();
//         }
//     }

//     function updateParticles() {
//         var width = window.innerWidth;
//         var height = window.innerHeight;
//         var particle;
//         waveAngle += 0.01;
//         for (var i = 0; i < particles.length; i++) {
//             particle = particles[i];
//             if (!streamingConfetti && particle.y < -15)
//                 particle.y = height + 100;
//             else {
//                 particle.tiltAngle += particle.tiltAngleIncrement;
//                 particle.x += Math.sin(waveAngle);
//                 particle.y += (Math.cos(waveAngle) + particle.diameter + particleSpeed) * 0.5;
//                 particle.tilt = Math.sin(particle.tiltAngle) * 15;
//             }
//             if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
//                 if (streamingConfetti && particles.length <= maxParticleCount)
//                     resetParticle(particle, width, height);
//                 else {
//                     particles.splice(i, 1);
//                     i--;
//                 }
//             }
//         }
//     }
// })();
