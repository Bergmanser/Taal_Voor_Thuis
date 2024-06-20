import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { availableFonts } from './fonts.js';

// Main Config for Project Plato
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

// Initialize Firebase app and storage
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

let storedRange = null;

// Function to initialize embedded text creation
export function initializeEmbeddedTextCreation(uploadImage) {
    // Create sortable for the preview area
    const sortable = Sortable.create(document.getElementById('preview'), {
        delay: 1500,
        delayOnTouchOnly: true,
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: saveOrder
    });

    // Function to save the order of sections
    function saveOrder() {
        const order = $("#preview .section-container").map(function () {
            return $(this).data('index');
        }).get();

        const content = $("#preview .section-container").map(function () {
            const section = $(this).find('.section');
            const sectionType = section.hasClass('left-section') ? 'left' :
                section.hasClass('right-section') ? 'right' :
                    section.hasClass('middle-section') ? 'middle' : 'full';
            const sectionContent = section.find('.section-content').html();
            const borderColor = section.find('.section-content').css('border-color');
            const textColor = section.find('.section-content').css('color');
            const isBold = section.find('.section-content').css('font-weight') === '700';
            const backgroundImages = {
                background1: $(this).find('.background-middle-1 .background-inner img').attr('src') ||
                    $(this).find('.background-left .background-inner img').attr('src') ||
                    $(this).find('.background-right .background-inner img').attr('src') || '',
                background2: $(this).find('.background-middle-2 .background-inner img').attr('src') || ''
            };
            return {
                type: sectionType,
                content: sectionContent,
                borderColor,
                textColor,
                isBold,
                backgroundImages
            };
        }).get();

        // Save order and content to localStorage
        localStorage.setItem('sectionOrder', JSON.stringify(order));
        localStorage.setItem('sectionContent', JSON.stringify(content));
    }

    // Function to load the order of sections from localStorage
    function loadOrder() {
        const order = JSON.parse(localStorage.getItem('sectionOrder'));
        const content = JSON.parse(localStorage.getItem('sectionContent'));
        if (order && content) {
            $('#preview').empty();
            order.forEach((index, i) => {
                const sectionData = content[i];
                if (sectionData && typeof sectionData === 'object') {
                    const { type, content, borderColor, textColor, isBold, backgroundImages } = sectionData;
                    const container = addSection(type, content, backgroundImages, borderColor, textColor, isBold);
                    container.data('index', index);
                    $('#preview').append(container);
                }
            });
            reattachEventHandlers();
        }
    }

    // Function to create the background toolbar
    function createBackgroundToolbar() {
        const toolbar = $('<div class="background-toolbar"></div>');
        const removeButton = $('<button class="remove-btn">&times;</button>');
        const zIndexDropdown = $('<select class="btn btn-sm btn-secondary z-index-dropdown" title="Set image layer"><option value="background">Background</option><option value="foreground">Foreground</option></select>');
        const containmentDropdown = $('<select class="btn btn-sm btn-secondary containment-dropdown" title="Set image containment"><option value="contained">Contained</option><option value="uncontained">Uncontained</option></select>');

        toolbar.append(removeButton, zIndexDropdown, containmentDropdown);

        // Change z-index based on dropdown value
        zIndexDropdown.change(function () {
            const zIndex = $(this).val() === 'foreground' ? 9999 : 1;
            const img = $(this).closest('.background-section').find('img');
            if ($(this).closest('.background-section').find('.containment-dropdown').val() === 'uncontained') {
                img.css('z-index', zIndex);
            }
        });

        // Remove background image on button click
        removeButton.click(function () {
            $(this).closest('.background-section').find('.background-inner').empty().html('Click to add an image...');
            toolbar.css('visibility', 'hidden');
        });

        // Change containment based on dropdown value
        containmentDropdown.change(function () {
            const container = $(this).closest('.background-section');
            const img = container.find('img');
            const zIndex = container.find('.z-index-dropdown').val() === 'foreground' ? 9999 : 1;
            if ($(this).val() === 'uncontained') {
                img.css({
                    'position': 'absolute',
                    'max-width': 'none',
                    'max-height': 'none',
                    'z-index': zIndex
                }).resizable().draggable();
            } else {
                img.css({
                    'position': 'relative',
                    'max-width': '100%',
                    'max-height': '100%',
                    'z-index': zIndex
                }).resizable('destroy').draggable('destroy');
            }
        });

        return toolbar;
    }

    // Function to adjust the background height based on section content
    function adjustBackgroundHeight(sectionContent, toolbar, backgroundDiv, backgroundDiv1, backgroundDiv2) {
        if (toolbar && toolbar.length) {
            const toolbarHeight = toolbar.outerHeight();
            if (backgroundDiv) {
                backgroundDiv.css('min-height', sectionContent.outerHeight() + toolbarHeight);
            }
            if (backgroundDiv1) {
                backgroundDiv1.css('min-height', sectionContent.outerHeight() + toolbarHeight);
            }
            if (backgroundDiv2) {
                backgroundDiv2.css('min-height', sectionContent.outerHeight() + toolbarHeight);
            }
        }
    }

    // Function to add a new section
    function addSection(type, content = 'Edit this text...', background = null, borderColor = '#ddd', textColor = '#000', isBold = false) {
        const container = $('<div class="section-container"></div>');
        const section = $('<div class="section"></div>');
        const toolbar = $('<div class="section-toolbar"></div>');
        const sectionContent = $('<div class="section-content" contenteditable="true"></div>');
        let backgroundDiv, backgroundDiv1, backgroundDiv2;

        if (type !== 'full') {
            toolbar.append('<button class="btn btn-sm btn-secondary bold-btn" title="Bold the selected text">Bold</button>');
            toolbar.append('<button class="btn btn-sm btn-secondary color-picker" title="Change the border color">Border Color</button>');
            toolbar.append('<button class="btn btn-sm btn-secondary text-color-picker" title="Change the text color">Text Color</button>');
            toolbar.append('<button class="btn btn-sm btn-danger remove-section" title="Remove this section">Remove</button>');
            toolbar.append('<button class="btn btn-sm btn-primary swap-button" title="Swap the content of the two background sections" style="display: none;">Swap</button>');
        } else {
            toolbar.append('<button class="btn btn-sm btn-danger remove-section" title="Remove this section">Remove</button>');
        }

        if (type !== 'full') {
            const dropdown = $('<select class="position-dropdown btn btn-sm btn-secondary" title="Change the section position"></select>');
            dropdown.append('<option value="left">Left</option>');
            dropdown.append('<option value="middle">Middle</option>');
            dropdown.append('<option value="right">Right</option>');
            dropdown.val(type);
            toolbar.append(dropdown);
        }

        if (type === 'full') {
            sectionContent.html('Click to add an image...');
            sectionContent.addClass('full-cover-img');
            sectionContent.click(function () {
                const input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(async function (e) {
                    const file = e.target.files[0];
                    if (file) {
                        const imageURL = await uploadImage(file, `embedded_text/full/${file.name}`);
                        sectionContent.html('<img src="' + imageURL + '" alt="Image" style="width: 100%;">');
                    }
                });
            });
            section.addClass('full-cover-img-section');
            section.append(toolbar);
            section.append(sectionContent);
            container.append(section);
            $('#preview').append(container);
            section.find('.remove-section').click(function () {
                container.remove();
                saveOrder();
            });
        } else {
            if (type === 'left') {
                section.addClass('left-section');
                backgroundDiv = $('<div class="background-left background-section"><div class="background-inner">Click to add an image...</div></div>');
                backgroundDiv.prepend(createBackgroundToolbar());
                if (background && background.background1) {
                    backgroundDiv.find('.background-inner').html('<img src="' + background.background1 + '" alt="Image" style="width: 100%;">');
                    backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
                }
            } else if (type === 'right') {
                section.addClass('right-section');
                backgroundDiv = $('<div class="background-right background-section"><div class="background-inner">Click to add an image...</div></div>');
                backgroundDiv.prepend(createBackgroundToolbar());
                if (background && background.background1) {
                    backgroundDiv.find('.background-inner').html('<img src="' + background.background1 + '" alt="Image" style="width: 100%;">');
                    backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
                }
            } else if (type === 'middle') {
                section.addClass('middle-section');
                toolbar.find('.swap-button').show();
                backgroundDiv1 = $('<div class="background-middle-1 background-section"><div class="background-inner">Click to add an image...</div></div>');
                backgroundDiv2 = $('<div class="background-middle-2 background-section"><div class="background-inner">Click to add an image...</div></div>');
                backgroundDiv1.prepend(createBackgroundToolbar());
                backgroundDiv2.prepend(createBackgroundToolbar());
                if (background && background.background1) {
                    backgroundDiv1.find('.background-inner').html('<img src="' + background.background1 + '" alt="Image" style="width: 100%;">');
                    backgroundDiv1.find('.background-toolbar').css('visibility', 'visible');
                }
                if (background && background.background2) {
                    backgroundDiv2.find('.background-inner').html('<img src="' + background.background2 + '" alt="Image" style="width: 100%;">');
                    backgroundDiv2.find('.background-toolbar').css('visibility', 'visible');
                }
                container.append(backgroundDiv1, section, backgroundDiv2);

                backgroundDiv1.find('.background-inner').click(function () {
                    const input = $('<input type="file" accept="image/*">');
                    input.click();
                    input.change(async function (e) {
                        const file = e.target.files[0];
                        if (file) {
                            const imageURL = await uploadImage(file, `embedded_text/middle_1/${file.name}`);
                            backgroundDiv1.find('.background-inner').html('<img src="' + imageURL + '" alt="Image" style="width: 100%;">');
                            backgroundDiv1.find('.background-toolbar').css('visibility', 'visible');
                        }
                    });
                });

                backgroundDiv2.find('.background-inner').click(function () {
                    const input = $('<input type="file" accept="image/*">');
                    input.click();
                    input.change(async function (e) {
                        const file = e.target.files[0];
                        if (file) {
                            const imageURL = await uploadImage(file, `embedded_text/middle_2/${file.name}`);
                            backgroundDiv2.find('.background-inner').html('<img src="' + imageURL + '" alt="Image" style="width: 100%;">');
                            backgroundDiv2.find('.background-toolbar').css('visibility', 'visible');
                        }
                    });
                });

                toolbar.find('.swap-button').click(function () {
                    const background1Content = backgroundDiv1.find('.background-inner').html();
                    const background2Content = backgroundDiv2.find('.background-inner').html();
                    backgroundDiv1.find('.background-inner').html(background2Content);
                    backgroundDiv2.find('.background-inner').html(background1Content);
                });
            }

            backgroundDiv && backgroundDiv.find('.background-inner').click(function () {
                const input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(async function (e) {
                    const file = e.target.files[0];
                    if (file) {
                        const imageURL = await uploadImage(file, `embedded_text/${type}/${file.name}`);
                        backgroundDiv.find('.background-inner').html('<img src="' + imageURL + '" alt="Image" style="width: 100%;">');
                        backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
                    }
                });
            });

            section.append(toolbar);
            section.append(sectionContent);

            if (type === 'left') {
                container.append(section);
                container.append(backgroundDiv);
            } else if (type === 'right') {
                container.append(backgroundDiv);
                container.append(section);
            } else {
                container.append(backgroundDiv1);
                container.append(section);
                container.append(backgroundDiv2);
            }

            sectionContent.attr('data-placeholder', 'Edit this text...');
            sectionContent.html(content);

            if (borderColor) {
                sectionContent.css('border-color', borderColor);
            }
            if (textColor) {
                sectionContent.css('color', textColor);
            }
            if (isBold) {
                sectionContent.css('font-weight', 'bold');
            }

            sectionContent.on('focus', function () {
                if ($(this).text() === 'Edit this text...') {
                    $(this).text('');
                    $(this).removeClass('placeholder');
                }
            });

            sectionContent.on('blur', function () {
                if ($(this).text() === '') {
                    $(this).text('Edit this text...');
                    $(this).addClass('placeholder');
                }
            });

            section.find('.section-content').on('focus', function () {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    storedRange = selection.getRangeAt(0);
                }
            });

            section.find('.section-content').on('mouseup', function () {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    storedRange = selection.getRangeAt(0);
                }
            });

            section.find('.bold-btn').click(function () {
                setTimeout(function () {
                    if (storedRange !== null) {
                        const selectedText = storedRange.toString();
                        if (selectedText !== '') {
                            if (sectionContent[0].contains(storedRange.commonAncestorContainer)) {
                                let isBold = false;

                                const rangeClone = storedRange.cloneRange();
                                const startContainer = rangeClone.startContainer;
                                const endContainer = rangeClone.endContainer;

                                if (startContainer.nodeType === Node.TEXT_NODE) {
                                    isBold = checkIfBold(startContainer);
                                }
                                if (endContainer.nodeType === Node.TEXT_NODE) {
                                    isBold = isBold || checkIfBold(endContainer);
                                }

                                if (isBold) {
                                    removeBoldFormatting(storedRange);
                                } else {
                                    const wrapBold = document.createElement('b');
                                    storedRange.surroundContents(wrapBold);
                                }
                            }
                        }
                    }
                }, 0);
            });

            function checkIfBold(node) {
                let parentNode = node.parentNode;
                while (parentNode && parentNode !== sectionContent[0]) {
                    const fontWeight = window.getComputedStyle(parentNode).fontWeight;
                    const nodeName = parentNode.nodeName;
                    if (fontWeight === 'bold' || nodeName === 'B') {
                        return true;
                    }
                    parentNode = parentNode.parentNode;
                }
                return false;
            }

            function removeBoldFormatting(range) {
                const startContainer = range.startContainer;
                const endContainer = range.endContainer;

                range.splitBoundaries();

                const boldElements = Array.from(document.querySelectorAll('b'));
                boldElements.forEach(b => {
                    if (range.intersectsNode(b)) {
                        const parent = b.parentNode;
                        while (b.firstChild) {
                            parent.insertBefore(b.firstChild, b);
                        }
                        parent.removeChild(b);
                    }
                });
            }

            Range.prototype.splitBoundaries = function () {
                const startContainer = this.startContainer;
                const startOffset = this.startOffset;
                const endContainer = this.endContainer;
                const endOffset = this.endOffset;

                if (startContainer.nodeType === Node.TEXT_NODE) {
                    const startNode = startContainer;
                    const endNode = endContainer;
                    if (startNode === endNode) {
                        const text = startNode.textContent;
                        const beforeText = text.substring(0, startOffset);
                        const afterText = text.substring(endOffset);

                        const middleText = text.substring(startOffset, endOffset);
                        const middleNode = document.createTextNode(middleText);

                        if (beforeText.length > 0) {
                            const beforeNode = document.createTextNode(beforeText);
                            startNode.parentNode.insertBefore(beforeNode, startNode);
                        }
                        startNode.parentNode.insertBefore(middleNode, startNode);

                        if (afterText.length > 0) {
                            const afterNode = document.createTextNode(afterText);
                            startNode.parentNode.insertBefore(afterNode, startNode.nextSibling);
                        }
                        startNode.parentNode.removeChild(startNode);
                    }
                }
            };

            section.find('.color-picker').click(function () {
                const pickr = Pickr.create({
                    el: this,
                    theme: 'nano',
                    default: borderColor,
                    components: {
                        preview: false,
                        opacity: true,
                        hue: true,
                        interaction: {
                            hex: true,
                            rgba: true,
                            hsla: true,
                            hsva: true,
                            cmyk: true,
                            input: true,
                            clear: true,
                            save: true
                        }
                    }
                });

                pickr.on('save', (color) => {
                    const colorStr = color.toHEXA().toString();
                    sectionContent.css('border-color', colorStr);
                    pickr.hide();
                    $(this).css('background-color', colorStr);
                });

                pickr.show();
            });

            section.find('.text-color-picker').click(function () {
                const pickr = Pickr.create({
                    el: this,
                    theme: 'nano',
                    default: textColor,
                    components: {
                        preview: false,
                        opacity: true,
                        hue: true,
                        interaction: {
                            hex: true,
                            rgba: true,
                            hsla: true,
                            hsva: true,
                            cmyk: true,
                            input: true,
                            clear: true,
                            save: true
                        }
                    }
                });

                pickr.on('save', (color) => {
                    const colorStr = color.toHEXA().toString();
                    sectionContent.css('color', colorStr);
                    pickr.hide();
                    $(this).css('background-color', colorStr);
                });

                pickr.show();
            });
            section.find('.remove-section').click(function () {
                container.remove();
                saveOrder();
            });

            if (type !== 'full') {
                toolbar.find('.position-dropdown').change(function () {
                    const newType = $(this).val();
                    changePosition(container, section, sectionContent, newType, backgroundDiv, backgroundDiv1, backgroundDiv2);
                    toolbar.find('.position-dropdown').val(newType);
                });
            }

            sectionContent.on('input', function () {
                adjustBackgroundHeight($(this), toolbar, backgroundDiv, backgroundDiv1, backgroundDiv2);
            });
            adjustBackgroundHeight(sectionContent, toolbar, backgroundDiv, backgroundDiv1, backgroundDiv2);
        }

        $('#preview').append(container);
        return container;
    }

    // Function to change the position of a section
    function changePosition(container, section, sectionContent, newType, backgroundDiv, backgroundDiv1, backgroundDiv2) {
        section.removeClass('left-section right-section middle-section');
        let backgroundImage1 = null;
        let backgroundImage2 = null;

        if (backgroundDiv) {
            backgroundImage1 = backgroundDiv.find('img').attr('src');
            backgroundDiv.remove();
        }
        if (backgroundDiv1) {
            backgroundImage1 = backgroundDiv1.find('img').attr('src');
            backgroundDiv1.remove();
        }
        if (backgroundDiv2) {
            backgroundImage2 = backgroundDiv2.find('img').attr('src');
            backgroundDiv2.remove();
        }

        if (newType === 'left' || newType === 'right') {
            if (section.hasClass('middle-section')) {
                if (backgroundDiv1 && backgroundDiv2 && backgroundDiv1.find('img').length > 0 && backgroundDiv2.find('img').length > 0) {
                    if (confirm("Are you sure you want to remove both images?")) {
                        backgroundDiv1.remove();
                        backgroundDiv2.remove();
                    } else {
                        return;
                    }
                }
            }
        }

        container.empty();

        if (newType === 'left') {
            section.addClass('left-section');
            backgroundDiv = $('<div class="background-left background-section"><div class="background-inner">Click to add an image...</div></div>');
            backgroundDiv.prepend(createBackgroundToolbar());
            if (backgroundImage1) {
                backgroundDiv.find('.background-inner').html('<img src="' + backgroundImage1 + '" alt="Image" style="width: 100%;">');
                backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
            }
            container.append(section);
            container.append(backgroundDiv);
            section.find('.swap-button').hide();
        } else if (newType === 'middle') {
            section.addClass('middle-section');
            const toolbar = $('<div class="section-toolbar"></div>');
            toolbar.append('<button class="btn btn-sm btn-primary swap-button" title="Swap the content of the two background sections">Swap</button>');
            backgroundDiv1 = $('<div class="background-middle-1 background-section"><div class="background-inner">Click to add an image...</div></div>');
            backgroundDiv2 = $('<div class="background-middle-2 background-section"><div class="background-inner">Click to add an image...</div></div>');
            backgroundDiv1.prepend(createBackgroundToolbar());
            backgroundDiv2.prepend(createBackgroundToolbar());
            if (backgroundImage1) {
                backgroundDiv1.find('.background-inner').html('<img src="' + backgroundImage1 + '" alt="Image" style="width: 100%;">');
                backgroundDiv1.find('.background-toolbar').css('visibility', 'visible');
            }
            if (backgroundImage2) {
                backgroundDiv2.find('.background-inner').html('<img src="' + backgroundImage2 + '" alt="Image" style="width: 100%;">');
                backgroundDiv2.find('.background-toolbar').css('visibility', 'visible');
            }
            container.append(backgroundDiv1, section, backgroundDiv2);
            section.find('.swap-button').show();
        } else if (newType === 'right') {
            section.addClass('right-section');
            backgroundDiv = $('<div class="background-right background-section"><div class="background-inner">Click to add an image...</div></div>');
            backgroundDiv.prepend(createBackgroundToolbar());
            if (backgroundImage1) {
                backgroundDiv.find('.background-inner').html('<img src="' + backgroundImage1 + '" alt="Image" style="width: 100%;">');
                backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
            }
            container.append(backgroundDiv);
            container.append(section);
            section.find('.swap-button').hide();
        }

        const newToolbar = section.find('.section-toolbar');
        reattachEventHandlers(section, sectionContent, newToolbar);
        adjustBackgroundHeight(sectionContent, newToolbar, backgroundDiv, backgroundDiv1, backgroundDiv2);

        if (backgroundDiv) {
            backgroundDiv.find('.background-inner').click(function () {
                const input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(async function (e) {
                    const file = e.target.files[0];
                    if (file) {
                        const imageURL = await uploadImage(file, `embedded_text/${newType}/${file.name}`);
                        backgroundDiv.find('.background-inner').html('<img src="' + imageURL + '" alt="Image" style="width: 100%;">');
                        backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
                    }
                });
            });
        }
        if (backgroundDiv1) {
            backgroundDiv1.find('.background-inner').click(function () {
                const input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(async function (e) {
                    const file = e.target.files[0];
                    if (file) {
                        const imageURL = await uploadImage(file, `embedded_text/middle_1/${file.name}`);
                        backgroundDiv1.find('.background-inner').html('<img src="' + imageURL + '" alt="Image" style="width: 100%;">');
                        backgroundDiv1.find('.background-toolbar').css('visibility', 'visible');
                    }
                });
            });
        }
        if (backgroundDiv2) {
            backgroundDiv2.find('.background-inner').click(function () {
                const input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(async function (e) {
                    const file = e.target.files[0];
                    if (file) {
                        const imageURL = await uploadImage(file, `embedded_text/middle_2/${file.name}`);
                        backgroundDiv2.find('.background-inner').html('<img src="' + imageURL + '" alt="Image" style="width: 100%;">');
                        backgroundDiv2.find('.background-toolbar').css('visibility', 'visible');
                    }
                });
            });
        }

        $('#preview').append(container);
        reorderSections();
    }

    // Function to reattach event handlers to elements
    function reattachEventHandlers(section, sectionContent, toolbar) {
        if (sectionContent) {
            sectionContent.off('focus blur input');
            sectionContent.on('focus', function () {
                if ($(this).text() === sectionContent.attr('data-placeholder')) {
                    $(this).text('');
                    $(this).removeClass('placeholder');
                }
            });

            sectionContent.on('blur', function () {
                if ($(this).text() === '') {
                    $(this).text(sectionContent.attr('data-placeholder'));
                    $(this).addClass('placeholder');
                }
            });

            sectionContent.on('input', function () {
                adjustBackgroundHeight($(this), toolbar, section.closest('.background-left'), section.closest('.background-middle-1'), section.closest('.background-middle-2'));
            });
        }

        toolbar.find('.bold-btn').off('click').click(function () {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (sectionContent[0].contains(range.commonAncestorContainer)) {
                    const isBold = window.getComputedStyle(range.startContainer.parentNode).fontWeight === 'bold' || range.startContainer.parentNode.nodeName === 'B';

                    if (isBold) {
                        document.execCommand('removeFormat', false, null);
                    } else {
                        document.execCommand('bold', false, null);
                    }
                }
            }
        });

        toolbar.find('.color-picker').off('click').click(function () {
            const pickr = Pickr.create({
                el: this,
                theme: 'nano',
                default: sectionContent.css('border-color'),
                components: {
                    preview: false,
                    opacity: true,
                    hue: true,
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: true,
                        hsva: true,
                        cmyk: true,
                        input: true,
                        clear: true,
                        save: true
                    }
                }
            });

            pickr.on('save', (color) => {
                const colorStr = color.toHEXA().toString();
                sectionContent.css('border-color', colorStr);
                pickr.hide();
            });

            pickr.show();
        });

        toolbar.find('.text-color-picker').off('click').click(function () {
            const pickr = Pickr.create({
                el: this,
                theme: 'nano',
                default: sectionContent.css('color'),
                components: {
                    preview: false,
                    opacity: true,
                    hue: true,
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: true,
                        hsva: true,
                        cmyk: true,
                        input: true,
                        clear: true,
                        save: true
                    }
                }
            });

            pickr.on('save', (color) => {
                const colorStr = color.toHEXA().toString();
                sectionContent.css('color', colorStr);
                pickr.hide();
            });

            pickr.show();
        });

        toolbar.find('.remove-section').off('click').click(function () {
            section.closest('.section-container').remove();
            saveOrder();
        });

        toolbar.find('.swap-button').off('click').click(function () {
            const container = $(this).closest('.section-container');
            const backgroundDiv1Inner = container.find('.background-middle-1 .background-inner');
            const backgroundDiv2Inner = container.find('.background-middle-2 .background-inner');
            const temp = backgroundDiv1Inner.html();
            backgroundDiv1Inner.html(backgroundDiv2Inner.html());
            backgroundDiv2Inner.html(temp);
        });

        toolbar.find('.position-dropdown').off('change').change(function () {
            const newType = $(this).val();
            changePosition(section.closest('.section-container'), section, sectionContent, newType, section.closest('.background-left'), section.closest('.background-middle-1'), section.closest('.background-middle-2'));
        });
    }

    // Function to reorder sections based on index
    function reorderSections() {
        const sections = $('#preview .section-container').get();
        sections.sort((a, b) => $(a).data('index') - $(b).data('index'));
        $('#preview').append(sections);
    }

    // Add new left section on button click
    $('#addLeft').click(function () {
        const index = $('#preview .section-container').length;
        const container = addSection('left');
        container.data('index', index);
        saveOrder();
    });

    // Add new right section on button click
    $('#addRight').click(function () {
        const index = $('#preview .section-container').length;
        const container = addSection('right');
        container.data('index', index);
        saveOrder();
    });

    // Add new middle section on button click
    $('#addMiddle').click(function () {
        const index = $('#preview .section-container').length;
        const container = addSection('middle');
        container.data('index', index);
        saveOrder();
    });

    // Add new full section on button click
    $('#addFull').click(function () {
        const index = $('#preview .section-container').length;
        const container = addSection('full');
        container.data('index', index);
        saveOrder();
    });

    // Log the preview content to the console
    $('#logContent').click(function () {
        const content = $("#preview").html();
        console.log('Preview Content:', content);
    });

    // Initialize tooltips for elements with title attribute
    $('[title]').tooltip({
        show: {
            effect: "slideDown",
            delay: 1300
        }
    });

    // Add font search bar to toolbar
    const fontSearchBar = document.createElement('input');
    fontSearchBar.setAttribute('list', 'fonts');
    fontSearchBar.setAttribute('placeholder', 'Search for fonts...');
    fontSearchBar.className = 'form-control mb-2';

    const fontDataList = document.createElement('datalist');
    fontDataList.id = 'fonts';

    // Populate font data list
    availableFonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        fontDataList.appendChild(option);
    });

    const embeddedTextToolbar = document.getElementById('embedded-text-toolbar');
    embeddedTextToolbar.appendChild(fontSearchBar);
    embeddedTextToolbar.appendChild(fontDataList);

    // Event listener for font selection
    fontSearchBar.addEventListener('input', (event) => {
        const selectedFont = event.target.value;
        if (availableFonts.includes(selectedFont)) {
            document.getElementById('preview').style.fontFamily = selectedFont;
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css?family=${selectedFont}&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            saveOrder();
        }
    });

    // Load saved order and set interval to save order periodically
    loadOrder();
    setInterval(saveOrder, 5000);
}

// Function to get the embedded text content
export function getEmbeddedText() {
    return document.getElementById('preview').innerHTML;
}
