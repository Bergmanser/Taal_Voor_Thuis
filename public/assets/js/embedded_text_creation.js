



























// const EmbeddedTextContainer = function () {
//     const container = document.createElement('div');
//     container.classList.add('embedded-text-container');

//     const toolbar = document.createElement('div');
//     toolbar.classList.add('embedded-text-toolbar');
//     container.appendChild(toolbar);

//     const colorBtn = document.createElement('button');
//     colorBtn.classList.add('embedded-text-color-btn');
//     colorBtn.textContent = 'Color';
//     toolbar.appendChild(colorBtn);

//     const bgBtn = document.createElement('button');
//     bgBtn.classList.add('embedded-text-bg-btn');
//     bgBtn.textContent = 'Background';
//     toolbar.appendChild(bgBtn);

//     const leftBtn = document.createElement('button');
//     leftBtn.classList.add('embedded-text-left-btn');
//     leftBtn.textContent = 'Left';
//     toolbar.appendChild(leftBtn);

//     const rightBtn = document.createElement('button');
//     rightBtn.classList.add('embedded-text-right-btn');
//     rightBtn.textContent = 'Right';
//     toolbar.appendChild(rightBtn);

//     const middleBtn = document.createElement('button');
//     middleBtn.classList.add('embedded-text-middle-btn');
//     middleBtn.textContent = 'Middle';
//     toolbar.appendChild(middleBtn);

//     const fullBtn = document.createElement('button');
//     fullBtn.classList.add('embedded-text-full-btn');
//     fullBtn.textContent = 'Full';
//     toolbar.appendChild(fullBtn);

//     const editorContainer = document.createElement('div');
//     editorContainer.classList.add('embedded-text-editor');
//     container.appendChild(editorContainer);

//     const quillContainer = document.createElement('div');
//     quillContainer.classList.add('quill-container');
//     editorContainer.appendChild(quillContainer);

//     const previewContainer = document.createElement('div');
//     previewContainer.classList.add('embedded-text-preview');
//     container.appendChild(previewContainer);

//     const saveButton = document.createElement('button');
//     saveButton.classList.add('embedded-text-save');
//     saveButton.textContent = 'Save';
//     container.appendChild(saveButton);

//     const deleteButton = document.createElement('button');
//     deleteButton.classList.add('embedded-text-delete');
//     deleteButton.textContent = 'Delete';
//     container.appendChild(deleteButton);

//     const bgContainer = document.createElement('div');
//     bgContainer.classList.add('embedded-text-bg-container');
//     container.appendChild(bgContainer);

//     const bgInput = document.createElement('input');
//     bgInput.classList.add('embedded-text-bg-input');
//     bgInput.type = 'file';
//     bgInput.accept = 'image/*';
//     bgContainer.appendChild(bgInput);

//     const bgPreview = document.createElement('div');
//     bgPreview.classList.add('embedded-text-bg-preview');
//     bgContainer.appendChild(bgPreview);

//     // Initialize the Quill editor
//     const quill = new Quill(quillContainer, {
//         theme: 'snow'
//     });

//     // Update the preview container when the user types
//     quill.on('text-change', () => {
//         const html = quill.root.innerHTML;
//         const canvas = document.createElement('canvas');
//         const context = canvas.getContext('2d');
//         const image = new Image();
//         canvas.width = 300;
//         canvas.height = 100;
//         context.font = '24px sans-serif';
//         context.fillStyle = '#000';
//         context.fillText(html, 0, 30);
//         image.src = canvas.toDataURL();
//         previewContainer.innerHTML = '';
//         previewContainer.appendChild(image);
//     });

//     // Add event listener for color button
//     colorBtn.addEventListener('click', () => {
//         // Implement color picker popup
//     });

//     // Add event listener for background button
//     bgBtn.addEventListener('click', () => {
//         // Implement background image picker popup
//     });

//     // Add event listener for left button
//     leftBtn.addEventListener('click', () => {
//         // Implement left image alignment
//     });

//     // Add event listener for right button
//     rightBtn.addEventListener('click', () => {
//         // Implement right image alignment
//     });

//     // Add event listener for middle button
//     middleBtn.addEventListener('click', () => {
//         // Implement middle image alignment
//     });

//     // Add event listener for full button
//     fullBtn.addEventListener('click', () => {
//         // Implement full image alignment
//     });

//     // Add event listener for save button
//     saveButton.addEventListener('click', () => {
//         // Implement image generation logic
//     });

//     // Add event listener for delete button
//     deleteButton.addEventListener('click', () => {
//         container.remove();
//     });

//     // Add event listener for background image input
//     bgInput.addEventListener('change', (event) => {
//         const file = event.target.files[0];
//         const reader = new FileReader();
//         reader.onload = (event) => {
//             const img = new Image();
//             img.src = event.target.result;
//             img.onload = () => {
//                 bgPreview.style.backgroundImage = `url(${img.src})`;
//             };
//         };
//         reader.readAsDataURL(file);
//     });

//     return container;
// };

// const updatePreview = () => {
//     const html = quill.root.innerHTML;
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');
//     const image = new Image();
//     canvas.width = 300;
//     canvas.height = 100;
//     context.font = '24px sans-serif';
//     context.fillStyle = '#000';
//     context.fillText(html, 0, 30);
//     image.src = canvas.toDataURL();
//     previewContainer.innerHTML = '';
//     const bgImage = bgPreview.style.backgroundImage;
//     if (bgImage) {
//         const bgCanvas = document.createElement('canvas');
//         const bgContext = bgCanvas.getContext('2d');
//         const bgImageObj = new Image();
//         bgImageObj.src = bgImage.slice(5, -2);
//         bgCanvas.width = bgImageObj.width;
//         bgCanvas.height = bgImageObj.height;
//         bgContext.drawImage(bgImageObj, 0, 0);
//         const bgImageData = bgContext.getImageData(0, 0, bgCanvas.width, bgCanvas.height);
//         const previewImage = new Image();
//         previewImage.src = image.src;
//         const previewImageData = context.getImageData(0, 0, canvas.width, canvas.height);
//         const leftCanvas = document.createElement('canvas');
//         const leftContext = leftCanvas.getContext('2d');
//         const leftImage = new Image();
//         leftImage.src = image.src;
//         leftCanvas.width = canvas.width;
//         leftCanvas.height = canvas.height;
//         leftContext.drawImage(leftImage, 0, 0);
//         const leftImageData = leftContext.getImageData(0, 0, leftCanvas.width, leftCanvas.height);
//         const rightCanvas = document.createElement('canvas');
//         const rightContext = rightCanvas.getContext('2d');
//         const rightImage = new Image();
//         rightImage.src = image.src;
//         rightCanvas.width = canvas.width;
//         rightCanvas.height = canvas.height;
//         rightContext.drawImage(rightImage, canvas.width - leftCanvas.width, 0);
//         const rightImageData = rightContext.getImageData(0, 0, rightCanvas.width, rightCanvas.height);
//         const middleCanvas = document.createElement('canvas');
//         const middleContext = middleCanvas.getContext('2d');
//         const middleImage = new Image();
//         middleImage.src = image.src;
//         middleCanvas.width = canvas.width;
//         middleCanvas.height = canvas.height;
//         middleContext.drawImage(middleImage, (bgCanvas.width - canvas.width) / 2, 0);
//         const middleImageData = middleContext.getImageData(0, 0, middleCanvas.width, middleCanvas.height);
//         const fullCanvas = document.createElement('canvas');
//         const fullContext = fullCanvas.getContext('2d');
//         const fullImage = new Image();
//         fullImage.src = bgImage.slice(5, -2);
//         fullCanvas.width = bgCanvas.width;
//         fullCanvas.height = bgCanvas.height;
//         fullContext.drawImage(bgImageObj, 0, 0);
//         fullContext.drawImage(leftImage, 0, 0);
//         const fullImageData = fullContext.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
//         if (leftBtn.classList.contains('active')) {
//             leftContext.putImageData(bgImageData, 0, 0);
//             leftContext.putImageData(leftImageData, canvas.width, 0);
//             previewContainer.appendChild(leftCanvas);
//         } else if (rightBtn.classList.contains('active')) {
//             rightContext.putImageData(bgImageData, 0, 0);
//             rightContext.putImageData(rightImageData, 0, 0);
//             previewContainer.appendChild(rightCanvas);
//         } else if (middleBtn.classList.contains('active')) {
//             middleContext.putImageData(bgImageData, 0, 0);
//             middleContext.putImageData(middleImageData, 0, 0);
//             previewContainer.appendChild(middleCanvas);
//         } else if (fullBtn.classList.contains('active')) {
//             fullContext.putImageData(bgImageData, 0, 0);
//             fullContext.putImageData(leftImageData, 0, 0);
//             previewContainer.appendChild(fullCanvas);
//         } else {
//             context.putImageData(bgImageData, 0, 0);
//             context.putImageData(previewImageData, 0, 0);
//             previewContainer.appendChild(canvas);
//         }
//     } else {
//         previewContainer.appendChild(canvas);
//     }
// };

// const showBgPicker = () => {
//     const picker = document.createElement('div');
//     picker.classList.add('embedded-text-bg-picker');
//     const container = document.createElement('div');
//     container.classList.add('embedded-text-bg-picker-container');
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = 'image/*';
//     input.addEventListener('change', (event) => {
//         const file = event.target.files[0];
//         const reader = new FileReader();
//         reader.onload = (event) => {
//             const img = new Image();
//             img.src = event.target.result;
//             img.onload = () => {
//                 bgPreview.style.backgroundImage = `url(${img.src})`;
//                 picker.remove();
//             };
//         };
//         reader.readAsDataURL(file);
//     });
//     const close = document.createElement('button');
//     close.textContent = 'Close';
//     close.addEventListener('click', () => {
//         picker.remove();
//     });
//     container.appendChild(input);
//     container.appendChild(close);
//     picker.appendChild(container);
//     document.body.appendChild(picker);
// };

// bgBtn.addEventListener('click', showBgPicker);