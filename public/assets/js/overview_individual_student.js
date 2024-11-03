// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// import { app, auth, db } from "./firebase_config.js";
// import { redirectUserBasedOnRole } from "./roleRedirect.js";

// let studentId;
// let studentData;
// const subjectColors = {
//     woordenschat: '#1A3A5F',  // Blue
//     samenvatten: '#5C7E9C',   // Muted Blue
//     'verwijswoorden&signaalwoorden': '#D6A664', // Gold
//     grammatica: '#b75ad6',    // Purple
//     anders: '#C23A2b'         // Red
// };

// document.addEventListener('DOMContentLoaded', function () {
//     const urlParams = new URLSearchParams(window.location.search);
//     studentId = urlParams.get('id');

//     document.getElementById('backButton').addEventListener('click', () => {
//         window.location.href = 'parent_overview.html';
//     });

//     onAuthStateChanged(auth, (user) => {
//         if (user) {
//             fetchStudentData(studentId);
//             redirectUserBasedOnRole([1, 2]);
//         } else {
//             console.log("No user logged in");
//             window.location.href = "login_parent_tvt.html";
//         }
//     });

//     document.getElementById('quizSearchBar').addEventListener('input', function () {
//         const searchText = this.value.trim().toLowerCase();
//         displayQuizzes(searchText);
//     });
// });

// async function fetchStudentData(studentId) {
//     const studentDocRef = doc(db, "studentdb", studentId);
//     const studentDoc = await getDoc(studentDocRef);

//     if (studentDoc.exists()) {
//         studentData = studentDoc.data();
//         document.getElementById('studentNameHeader').textContent = `Student: ${studentData.username}`;
//         const scores = [];

//         if (!studentData.quizzes || Object.keys(studentData.quizzes).length === 0) {
//             updateDashboard(scores);
//         } else {
//             for (const [quiz, details] of Object.entries(studentData.quizzes)) {
//                 scores.push({
//                     title: details.title,
//                     subject: details.type.toLowerCase(),
//                     scoreWithHints: parseFloat(details.scoreWithHints),
//                     scoreWithoutHints: parseFloat(details.scoreWithoutHints),
//                     date: new Date(details.dateTime)
//                 });
//             }
//             updateDashboard(scores);
//         }
//     } else {
//         console.log("No such document!");
//     }
// }

// function updateDashboard(scores) {
//     const noDataMessage = document.getElementById('no-data-message');
//     if (scores.length === 0) {
//         document.getElementById('averageScoreChart').classList.add('d-none');
//         noDataMessage.classList.remove('d-none');
//     } else {
//         document.getElementById('averageScoreChart').classList.remove('d-none');
//         noDataMessage.classList.add('d-none');
//         updateChart(scores);
//         updateRecentScores(scores);
//         updateBestWorstScores(scores);
//         displayQuizzes();
//     }
// }

// function updateChart(scores) {
//     const ctx = document.getElementById('averageScoreChart').getContext('2d');
//     const data = calculateAverageScores(scores);

//     const chart = new Chart(ctx, {
//         type: 'doughnut',
//         data: {
//             labels: Object.keys(data.averagesWithoutHints),
//             datasets: [{
//                 data: Object.values(data.averagesWithoutHints),
//                 backgroundColor: Object.keys(data.averagesWithoutHints).map(subject => subjectColors[subject])
//             }]
//         },
//         options: {
//             cutout: '70%',
//             plugins: {
//                 tooltip: {
//                     callbacks: {
//                         label: function (context) {
//                             return `${context.label}: ${context.raw.toFixed(1)}`;
//                         }
//                     }
//                 }
//             },
//             onClick: function (event, elements) {
//                 if (elements.length) {
//                     const index = elements[0].index;
//                     const subject = context.chart.data.labels[index];
//                     showSubjectDetails(subject, data);
//                 }
//             }
//         }
//     });

//     const overallAverageWithHints = calculateOverallAverageWithHints(scores);
//     const overallAverageWithoutHints = calculateOverallAverage(scores);

//     document.getElementById('average-score-title').innerText = 'Total account average';
//     document.getElementById('average-score-text').innerHTML = `
//         <span data-tooltip="With hints">${overallAverageWithHints.toFixed(1)}</span>
//         <div class="divider"></div>
//         <span data-tooltip="Without hints">${overallAverageWithoutHints.toFixed(1)}</span>
//     `;
// }

// function showSubjectDetails(subject, data) {
//     document.getElementById('subject-name').innerText = `Subject: ${subject}`;
//     document.getElementById('average-with-hints').innerText = `Average with hints: ${data.averagesWithHints[subject].toFixed(1)}`;
//     document.getElementById('average-without-hints').innerText = `Average without hints: ${data.averagesWithoutHints[subject].toFixed(1)}`;
//     document.getElementById('subject-details').classList.remove('d-none');
// }

// function calculateAverageScores(scores) {
//     const subjectSumsWithHints = {};
//     const subjectSumsWithoutHints = {};
//     const subjectCounts = {};

//     scores.forEach(score => {
//         const subject = score.subject;
//         if (!subjectSumsWithHints[subject]) {
//             subjectSumsWithHints[subject] = 0;
//             subjectSumsWithoutHints[subject] = 0;
//             subjectCounts[subject] = 0;
//         }
//         subjectSumsWithHints[subject] += score.scoreWithHints;
//         subjectSumsWithoutHints[subject] += score.scoreWithoutHints;
//         subjectCounts[subject] += 1;
//     });

//     const averagesWithHints = {};
//     const averagesWithoutHints = {};
//     for (const subject in subjectSumsWithHints) {
//         averagesWithHints[subject] = subjectSumsWithHints[subject] / subjectCounts[subject];
//         averagesWithoutHints[subject] = subjectSumsWithoutHints[subject] / subjectCounts[subject];
//     }

//     return { averagesWithHints, averagesWithoutHints };
// }

// function calculateOverallAverage(scores) {
//     const totalScore = scores.reduce((sum, score) => sum + score.scoreWithoutHints, 0);
//     return totalScore / scores.length;
// }

// function calculateOverallAverageWithHints(scores) {
//     const totalScore = scores.reduce((sum, score) => sum + score.scoreWithHints, 0);
//     return totalScore / scores.length;
// }

// function updateRecentScores(scores) {
//     const container = document.getElementById('dynamic-recent-exercises');
//     if (scores.length === 0) {
//         container.innerHTML = '';
//         return;
//     }

//     scores.sort((a, b) => b.date - a.date);
//     const recentScores = scores.slice(0, 3);

//     container.innerHTML = '<h5>The most recently finished exercises:</h5>';

//     recentScores.forEach(score => {
//         container.innerHTML += `
//             <div class="score-card" data-subject="${score.subject}">
//                 <div class="score-title" style="background-color: ${subjectColors[score.subject]}">${score.title}</div>
//                 <div class="score-values">
//                     <span class="score with-hints" data-tooltip="Score with hints">${score.scoreWithHints}</span>
//                     <span class="score without-hints" data-tooltip="Score without hints">${score.scoreWithoutHints}</span>
//                 </div>
//             </div>
//         `;
//     });
// }

// function updateBestWorstScores(scores) {
//     if (scores.length === 0) return;

//     const container = document.getElementById('dynamic-best-worst-scores');
//     const averageScores = calculateAverageScores(scores);

//     let bestSubject = null;
//     let worstSubject = null;
//     let highestAverage = -Infinity;
//     let lowestAverage = Infinity;

//     for (const subject in averageScores.averagesWithoutHints) {
//         const average = averageScores.averagesWithoutHints[subject];
//         if (average > highestAverage) {
//             highestAverage = average;
//             bestSubject = subject;
//         }
//         if (average < lowestAverage) {
//             lowestAverage = average;
//             worstSubject = subject;
//         }
//     }

//     if (bestSubject !== null || worstSubject !== null) {
//         container.innerHTML = `
//             <div class="score-card" id="best-subject">
//                 <div class="score-title" style="background-color: ${subjectColors[bestSubject]}">Best Subject: ${bestSubject}</div>
//                 <div class="score-values">
//                     <span class="score with-hints" data-tooltip="Average score with hints">${averageScores.averagesWithHints[bestSubject].toFixed(1)}</span>
//                     <span class="score without-hints" data-tooltip="Average score without hints">${averageScores.averagesWithoutHints[bestSubject].toFixed(1)}</span>
//                 </div>
//             </div>
//             <div class="score-card" id="worst-subject">
//                 <div class="score-title" style="background-color: ${subjectColors[worstSubject]}">Subject with Room for Improvement: ${worstSubject}</div>
//                 <div class="score-values">
//                     <span class="score with-hints" data-tooltip="Average score with hints">${averageScores.averagesWithHints[worstSubject].toFixed(1)}</span>
//                     <span class="score without-hints" data-tooltip="Average score without hints">${averageScores.averagesWithoutHints[worstSubject].toFixed(1)}</span>
//                 </div>
//             </div>
//         `;
//     }
// }

// function displayQuizzes(searchText = '') {
//     const quizContainer = document.getElementById('quizCards');
//     quizContainer.innerHTML = '';

//     if (!studentData.quizzes || Object.keys(studentData.quizzes).length === 0) {
//         quizContainer.innerHTML = '<p>No quizzes available.</p>';
//         return;
//     }

//     const quizzes = Object.entries(studentData.quizzes).filter(([quizId, details]) =>
//         !searchText || details.title.toLowerCase().includes(searchText)
//     );

//     if (quizzes.length === 0) {
//         quizContainer.innerHTML = '<p>No quizzes found.</p>';
//         return;
//     }

//     quizzes.forEach(([quizId, details]) => {
//         const quizCard = document.createElement('div');
//         quizCard.className = 'quiz-card';
//         quizCard.innerHTML = `
//             <h5>${details.title}</h5>
//             <p>${details.description}</p>
//             <button onclick="startQuiz('${quizId}')">Start Quiz</button>
//         `;
//         quizContainer.appendChild(quizCard);
//     });
// }

// function startQuiz(quizId) {
//     // Implement quiz starting logic here
//     console.log(`Starting quiz with ID: ${quizId}`);
// }
