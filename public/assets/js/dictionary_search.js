// const axios = require('axios');

// const apiKey = '';
// const cx = '111c176d9efa64756';
// const query = 'example query';

// const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}`;

// axios.get(url)
//     .then((response) => {
//         console.log(response.data);
//     })
//     .catch((error) => {
//         console.error(error);
//     });



// const searchBox = document.getElementById('search-box');
// const overlay = document.getElementById('overlay');
// const googleSearchResults = document.getElementById('google-search-results');

// searchBox.addEventListener('keydown', (event) => {
//     if (event.key === 'Enter') {
//         const searchTerm = searchBox.value;
//         const url = `https://www.googleapis.com/customsearch/v1?key=YOUR_GOOGLE_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=${searchTerm}`;

//         fetch(url)
//             .then((response) => response.json())
//             .then((data) => {
//                 displaySearchResults(data.items);
//             });
//     }
// });

// overlay.addEventListener('click', (event) => {
//     if (event.target === overlay) {
//         overlay.style.display = 'none';
//     }
// });

// function displaySearchResults(results) {
//     overlay.style.display = 'block';
//     googleSearchResults.innerHTML = '';

//     results.forEach((result) => {
//         const link = document.createElement('a');
//         link.href = result.link;
//         link.textContent = result.title;
//         googleSearchResults.appendChild(link);
//     });
// }