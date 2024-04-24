


// I made another attempt whislt using a quill container but quil has proven non reliable

// // Get the Quill container element from the HTML
// const quillContainer = document.querySelector('#quill-container');

// // Initialize a new Quill editor instance
// const quill = new Quill(quillContainer, {
//     modules: {
//         toolbar: [
//             ['bold', 'italic', 'underline'], // Formatting options
//             ['image', 'video'] // Media options
//         ]
//     },
//     theme: 'snow' // Use the 'snow' theme
// });

// if (typeof $.fn.toolbar !== 'undefined') {
//     // Code to initialize the Quill toolbar
//     // Create the toolbar
//     $("#embedded-text-toolbar").toolbar({
//         content: "#embedded-text-toolbar-content",
//         position: {
//             my: "left top",
//             at: "left bottom",
//             of: "#add-embedded-text-button"
//         }
//     });

//     // Add the buttons
//     $("#embedded-text-toolbar").append(
//         $("<button>").text("Text Area"),
//         $("<button>").text("Image Area")
//     );
// } else {
//     console.error("Quill toolbar is not loaded");
// }

// // Get the add embedded text button element from the HTML
// const addEmbeddedTextButton = document.querySelector('#add-embedded-text-button');
// addEmbeddedTextButton.addEventListener('click', () => {
//     // Create a new div element to serve as the container for the embedded text
//     const embeddedTextContainer = document.createElement('div');
//     embeddedTextContainer.classList.add('embedded-text-container');

//     // Create a new Quill editor instance within the embedded text container
//     const embeddedQuill = new Quill(embeddedTextContainer, {
//         modules: {
//             toolbar: [
//                 ['bold', 'italic', 'underline'], // Formatting options
//                 ['image', 'video'] // Media options
//             ]
//         },
//         theme: 'snow' // Use the 'snow' theme
//     });

//     // Add theembedded text container to the Quill container
//     quillContainer.appendChild(embeddedTextContainer);

//     // Add a click event listener to the toolbar for adding a text area
//     $("#embedded-text-toolbar").on("click", "button:contains('Text Area')", function () {
//         // Add a new text area
//         var textArea = $("<textarea>").addClass("form-control");
//         $("#embedded-text-container").append(textArea);

//         // Initialize a Quill editor for the text area
//         var textAreaQuill = new Quill(textArea[0], {
//             modules: {
//                 toolbar: [
//                     ["bold", "italic", "underline"],
//                     ["link", "image"]
//                 ]
//             }, theme: "snow"
//         });

//         // Extract the HTML content of the text area
//         const textAreaHTML = textAreaQuill.root.innerHTML;

//         // Create the embedded text data object
//         const embeddedTextData = {
//             type: "text",
//             html: textAreaHTML,
//             css: {
//                 // CSS preferences for the text area
//             }
//         };

//         // Convert the embedded text data object to a JSON string
//         const embeddedTextJson = JSON.stringify(embeddedTextData);
//     });

//     // Add a click event listener to the toolbar for adding an image area
//     $("#embedded-text-toolbar").on("click", "button:contains('Image Area')", function () {
//         // Add a new image area
//         var imageArea = $("<div>").addClass("image-area");
//         $("#embedded-text-container").append(imageArea);

//         // Add a file input field to the image area
//         var fileInput = $("<input>").attr("type", "file").addClass("form-control-file");
//         imageArea.append(fileInput);

//         // Extract the HTML content of the image area
//         const imageAreaHTML = quill.root.innerHTML;

//         // Create the embedded text data object
//         const embeddedTextData = {
//             type: "image",
//             src: imageAreaHTML,
//             css: {
//                 // CSS preferences for the image area
//             }
//         };
//         // Convert the embedded text data object to a JSON string
//         const embeddedTextJson = JSON.stringify(embeddedTextData);
//     });
// });