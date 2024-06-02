$(document).ready(function () {
    var sortable = Sortable.create(document.getElementById('preview'), {
        delay: 1500,
        delayOnTouchOnly: true,
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function (evt) {
            saveOrder();
        }
    });

    function saveOrder() {
        console.log('Saving order');
        let order = $("#preview .section-container").map(function () {
            return $(this).data('index');
        }).get();
        console.log('Order:', order);

        let content = $("#preview .section-container").map(function () {
            let section = $(this).find('.section');
            let sectionType = section.hasClass('left-section') ? 'left' : (section.hasClass('right-section') ? 'right' : (section.hasClass('middle-section') ? 'middle' : 'full'));
            let sectionContent = section.find('.section-content').html();
            let borderColor = section.find('.section-content').css('border-color');
            let textColor = section.find('.section-content').css('color');
            let isBold = section.find('.section-content').css('font-weight') === '700';
            let backgroundImages = {
                background1: $(this).find('.background-middle-1 .background-inner img').attr('src') || $(this).find('.background-left .background-inner img').attr('src') || $(this).find('.background-right .background-inner img').attr('src') || '',
                background2: $(this).find('.background-middle-2 .background-inner img').attr('src') || ''
            };
            return {
                type: sectionType,
                content: sectionContent,
                borderColor: borderColor,
                textColor: textColor,
                isBold: isBold,
                backgroundImages: backgroundImages
            };
        }).get();
        console.log('Content:', content);

        localStorage.setItem('sectionOrder', JSON.stringify(order));
        localStorage.setItem('sectionContent', JSON.stringify(content));
    }

    function loadOrder() {
        console.log('Loading order');
        let order = JSON.parse(localStorage.getItem('sectionOrder'));
        let content = JSON.parse(localStorage.getItem('sectionContent'));
        if (order && content) {
            console.log('Loaded order:', order);
            console.log('Loaded content:', content);
            $('#preview').empty();  // Clear existing content
            order.forEach(function (index, i) {
                let sectionData = content[i];
                console.log('Section Data:', sectionData);
                if (sectionData && typeof sectionData === 'object') {
                    let sectionType = sectionData.type;
                    let sectionContent = sectionData.content;
                    let borderColor = sectionData.borderColor;
                    let textColor = sectionData.textColor;
                    let isBold = sectionData.isBold;
                    let backgroundImages = sectionData.backgroundImages;
                    let container = addSection(sectionType, sectionContent, backgroundImages, borderColor, textColor, isBold);
                    container.data('index', index);
                    $('#preview').append(container);
                } else {
                    console.error('Invalid section data:', sectionData);
                }
            });
        }
    }

    loadOrder();

    function createBackgroundToolbar() {
        let toolbar = $('<div class="background-toolbar"></div>');
        let removeButton = $('<button class="remove-btn">&times;</button>');
        let zIndexDropdown = $('<select class="btn btn-sm btn-secondary z-index-dropdown" title="Set image layer"><option value="background">Background</option><option value="foreground">Foreground</option></select>');
        let containmentDropdown = $('<select class="btn btn-sm btn-secondary containment-dropdown" title="Set image containment"><option value="contained">Contained</option><option value="uncontained">Uncontained</option></select>');

        toolbar.append(removeButton);
        toolbar.append(zIndexDropdown);
        toolbar.append(containmentDropdown);

        zIndexDropdown.change(function () {
            let zIndex = $(this).val() === 'foreground' ? 9999 : 1;
            let img = $(this).closest('.background-section').find('img');
            if ($(this).closest('.background-section').find('.containment-dropdown').val() === 'uncontained') {
                img.css('z-index', zIndex);
            }
        });

        removeButton.click(function () {
            $(this).closest('.background-section').find('.background-inner').empty().html('Click to add an image...');
            toolbar.css('visibility', 'hidden');
        });

        containmentDropdown.change(function () {
            let container = $(this).closest('.background-section');
            let img = container.find('img');
            let zIndex = container.find('.z-index-dropdown').val() === 'foreground' ? 9999 : 1;
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

    function adjustBackgroundHeight(sectionContent, toolbar, backgroundDiv, backgroundDiv1, backgroundDiv2) {
        console.log('Adjusting background height');
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
        } else {
            console.error('toolbar is not properly defined or selected');
        }
    }

    let storedRange = null;

    function addSection(type, content = 'Edit this text...', background = null, borderColor = '#ddd', textColor = '#000', isBold = false) {
        console.log(`Adding section: ${type}`);
        if (!type) {
            console.error('Section type is undefined');
            return;
        }
        let container = $('<div class="section-container"></div>');
        let section = $('<div class="section"></div>');
        let toolbar = $('<div class="section-toolbar"></div>');
        let sectionContent = $('<div class="section-content" contenteditable="true"></div>');
        let backgroundDiv, backgroundDiv1, backgroundDiv2;

        if (type !== 'full') {
            toolbar.append('<button class="btn btn-sm btn-secondary bold-btn" title="Bold the selected text">Bold</button>');
            toolbar.append('<button class="btn btn-sm btn-secondary color-picker" title="Change the border color">Border Color</button>');
            toolbar.append('<button class="btn btn-sm btn-secondary text-color-picker" title="Change the text color">Text Color</button>');
            toolbar.append('<button class="btn btn-sm btn-danger remove-section" title="Remove this section">Remove</button>');
            toolbar.append('<button class="btn btn-sm btn-primary swap-button" title="Swap the content of the two background sections" style="display: none;">Swap</button>'); // Add swap button with display none
        } else {
            toolbar.append('<button class="btn btn-sm btn-danger remove-section" title="Remove this section">Remove</button>');
        }

        if (type !== 'full') {
            let dropdown = $('<select class="position-dropdown btn btn-sm btn-secondary" title="Change the section position"></select>');
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
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function (e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            sectionContent.html('<img src="' + event.target.result + '" alt="Image" style="width: 100%;">');
                        }
                        reader.readAsDataURL(file);
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
                toolbar.find('.swap-button').show();  // Show swap button for middle sections
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
                container.append(backgroundDiv1, section, backgroundDiv2);  // Ensure proper order of elements

                backgroundDiv1.find('.background-inner').click(function () {
                    let input = $('<input type="file" accept="image/*">');
                    input.click();
                    input.change(function (e) {
                        let file = e.target.files[0];
                        if (file) {
                            let reader = new FileReader();
                            reader.onload = function (event) {
                                backgroundDiv1.find('.background-inner').html('<img src="' + event.target.result + '" alt="Image" style="width: 100%;">');
                                backgroundDiv1.find('.background-toolbar').css('visibility', 'visible');
                            }
                            reader.readAsDataURL(file);
                        }
                    });
                });

                backgroundDiv2.find('.background-inner').click(function () {
                    let input = $('<input type="file" accept="image/*">');
                    input.click();
                    input.change(function (e) {
                        let file = e.target.files[0];
                        if (file) {
                            let reader = new FileReader();
                            reader.onload = function (event) {
                                backgroundDiv2.find('.background-inner').html('<img src="' + event.target.result + '" alt="Image" style="width: 100%;">');
                                backgroundDiv2.find('.background-toolbar').css('visibility', 'visible');
                            }
                            reader.readAsDataURL(file);
                        }
                    });
                });

                toolbar.find('.swap-button').click(function () {
                    let background1Content = backgroundDiv1.find('.background-inner').html();
                    let background2Content = backgroundDiv2.find('.background-inner').html();
                    backgroundDiv1.find('.background-inner').html(background2Content);
                    backgroundDiv2.find('.background-inner').html(background1Content);
                });
            }

            backgroundDiv && backgroundDiv.find('.background-inner').click(function () {
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function (e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            backgroundDiv.find('.background-inner').html('<img src="' + event.target.result + '" alt="Image" style="width: 100%;">');
                            backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
                        }
                        reader.readAsDataURL(file);
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
            sectionContent.html(content);  // Apply the content

            if (borderColor) {
                sectionContent.css('border-color', borderColor);  // Apply border color
            }
            if (textColor) {
                sectionContent.css('color', textColor);  // Apply text color
            }
            if (isBold) {
                sectionContent.css('font-weight', 'bold');  // Apply bold text
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


            // Handle focus event on section content
            section.find('.section-content').on('focus', function () {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    storedRange = selection.getRangeAt(0);
                }
            });

            // Handle mouseup event on section content
            section.find('.section-content').on('mouseup', function () {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    storedRange = selection.getRangeAt(0);
                    console.log('Selection stored:', storedRange);
                }
            });

            // Handle click event on bold button
            section.find('.bold-btn').click(function () {
                console.log('Bold button clicked.');

                setTimeout(function () {
                    if (storedRange !== null) {
                        let selectedText = storedRange.toString();

                        if (selectedText !== '') {
                            if (sectionContent[0].contains(storedRange.commonAncestorContainer)) {
                                let isBold = false;

                                // Check if any part of the range is bold
                                const rangeClone = storedRange.cloneRange();
                                const startContainer = rangeClone.startContainer;
                                const endContainer = rangeClone.endContainer;

                                if (startContainer.nodeType === Node.TEXT_NODE) {
                                    isBold = checkIfBold(startContainer);
                                }
                                if (endContainer.nodeType === Node.TEXT_NODE) {
                                    isBold = isBold || checkIfBold(endContainer);
                                }

                                console.log('Is text bold?', isBold);

                                if (isBold) {
                                    // Remove bold formatting by replacing <b> elements with their child nodes
                                    removeBoldFormatting(storedRange);
                                    console.log('Removing bold formatting.');
                                } else {
                                    // Apply bold formatting
                                    let wrapBold = document.createElement('b');
                                    storedRange.surroundContents(wrapBold);
                                    console.log('Applying bold formatting.');
                                }
                            } else {
                                console.log('Selection is outside the contenteditable area.');
                            }
                        } else {
                            console.log('No text selected.');
                        }
                    } else {
                        console.log('No range stored.');
                    }
                }, 0);
            });

            // Function to check if a text node is within a bold element
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

            // Function to remove bold formatting from the selected range
            function removeBoldFormatting(range) {
                const startContainer = range.startContainer;
                const endContainer = range.endContainer;

                // Split the start and end containers to ensure we only affect the selection
                range.splitBoundaries();

                // Get all <b> elements within the range
                const boldElements = Array.from(document.querySelectorAll('b'));
                boldElements.forEach(b => {
                    // Check if the <b> element is within the range
                    if (range.intersectsNode(b)) {
                        // Replace <b> with its child nodes
                        const parent = b.parentNode;
                        while (b.firstChild) {
                            parent.insertBefore(b.firstChild, b);
                        }
                        parent.removeChild(b);
                    }
                });
            }

            // Utility function to split range boundaries to ensure accurate formatting changes
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
                    // Update the button's background color
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
                    // Update the button's background color
                    $(this).css('background-color', colorStr);
                });

                pickr.show();
            });
            section.find('.remove-section').click(function () {
                container.remove();
            });

            if (type !== 'full') {
                toolbar.find('.position-dropdown').change(function () {
                    console.log('Position dropdown changed');
                    let newType = $(this).val();
                    console.log('New type:', newType);
                    changePosition(container, section, sectionContent, newType, backgroundDiv, backgroundDiv1, backgroundDiv2);
                    toolbar.find('.position-dropdown').val(newType); // Update dropdown to reflect new position
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

    function changePosition(container, section, sectionContent, newType, backgroundDiv, backgroundDiv1, backgroundDiv2) {
        console.log('Changing position');
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
            section.find('.swap-button').hide();  // Hide swap button for non-middle sections
        } else if (newType === 'middle') {
            section.addClass('middle-section');
            let toolbar = $('<div class="section-toolbar"></div>');  // Ensure toolbar is initialized
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
            section.find('.swap-button').show();  // Show swap button for middle sections
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
            section.find('.swap-button').hide();  // Hide swap button for non-middle sections
        }

        const newToolbar = section.find('.section-toolbar');
        reattachEventHandlers(section, sectionContent, newToolbar);
        adjustBackgroundHeight(sectionContent, newToolbar, backgroundDiv, backgroundDiv1, backgroundDiv2);

        if (backgroundDiv) {
            backgroundDiv.find('.background-inner').click(function () {
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function (e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            backgroundDiv.find('.background-inner').html('<img src="' + event.target.result + '" alt="Image" style="width: 100%;">');
                            backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
                        }
                        reader.readAsDataURL(file);
                    }
                });
            });
        }
        if (backgroundDiv1) {
            backgroundDiv1.find('.background-inner').click(function () {
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function (e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            backgroundDiv1.find('.background-inner').html('<img src="' + event.target.result + '" alt="Image" style="width: 100%;">');
                            backgroundDiv1.find('.background-toolbar').css('visibility', 'visible');
                        }
                        reader.readAsDataURL(file);
                    }
                });
            });
        }
        if (backgroundDiv2) {
            backgroundDiv2.find('.background-inner').click(function () {
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function (e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            backgroundDiv2.find('.background-inner').html('<img src="' + event.target.result + '" alt="Image" style="width: 100%;">');
                            backgroundDiv2.find('.background-toolbar').css('visibility', 'visible');
                        }
                        reader.readAsDataURL(file);
                    }
                });
            });
        }

        $('#preview').append(container);

        reorderSections();
    }

    function reattachEventHandlers(section, sectionContent, toolbar) {
        console.log('Reattaching event handlers');
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

        toolbar.find('.bold-btn').off('click').click(function () {
            let selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let range = selection.getRangeAt(0);
                if (sectionContent[0].contains(range.commonAncestorContainer)) {
                    let isBold = window.getComputedStyle(range.startContainer.parentNode).fontWeight === 'bold' || range.startContainer.parentNode.nodeName === 'B';

                    if (isBold) {
                        // Remove bold formatting
                        document.execCommand('removeFormat', false, null);
                        console.log('Bold removed from selected text:', selection.toString());
                    } else {
                        // Apply bold formatting
                        document.execCommand('bold', false, null);
                        console.log('Bold applied to selected text:', selection.toString());
                    }
                } else {
                    console.log('Selection is outside the contenteditable area.');
                }
            } else {
                console.log('No text selected.');
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
        });

        toolbar.find('.swap-button').off('click').click(function () {
            let container = $(this).closest('.section-container');
            let backgroundDiv1Inner = container.find('.background-middle-1 .background-inner');
            let backgroundDiv2Inner = container.find('.background-middle-2 .background-inner');
            let temp = backgroundDiv1Inner.html();
            backgroundDiv1Inner.html(backgroundDiv2Inner.html());
            backgroundDiv2Inner.html(temp);
        });

        toolbar.find('.position-dropdown').off('change').change(function () {
            console.log('Position dropdown changed');
            let newType = $(this).val();
            console.log('New type:', newType);
            changePosition(section.closest('.section-container'), section, sectionContent, newType, section.closest('.background-left'), section.closest('.background-middle-1'), section.closest('.background-middle-2'));
        });
    }

    function reorderSections() {
        let sections = $('#preview .section-container').get();
        sections.sort((a, b) => $(a).data('index') - $(b).data('index'));
        $('#preview').append(sections);
    }

    $('#addLeft').click(function () {
        let index = $('#preview .section-container').length;
        let container = addSection('left');
        container.data('index', index);
        saveOrder();  // Save order and content when a new section is added
    });
    $('#addRight').click(function () {
        let index = $('#preview .section-container').length;
        let container = addSection('right');
        container.data('index', index);
        saveOrder();  // Save order and content when a new section is added
    });
    $('#addMiddle').click(function () {
        let index = $('#preview .section-container').length;
        let container = addSection('middle');
        container.data('index', index);
        saveOrder();  // Save order and content when a new section is added
    });
    $('#addFull').click(function () {
        let index = $('#preview .section-container').length;
        let container = addSection('full');
        container.data('index', index);
        saveOrder();  // Save order and content when a new section is added
    });

    $('#logContent').click(function () {
        let content = $("#preview").html();
        console.log('Preview Content:', content);
    });

    $('[title]').tooltip({
        show: {
            effect: "slideDown",
            delay: 1300
        }
    });
});
