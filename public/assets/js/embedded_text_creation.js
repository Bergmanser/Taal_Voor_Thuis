$(document).ready(function() {
    let lastUsedBorderColor = '#ddd';
    let lastUsedTextColor = '#000';

    function createBackgroundToolbar() {
        let toolbar = $('<div class="background-toolbar"></div>');
        let removeButton = $('<button class="remove-btn">&times;</button>');
        let zIndexDropdown = $('<select class="btn btn-sm btn-secondary z-index-dropdown" title="Set image layer"><option value="background">Background</option><option value="foreground">Foreground</option></select>');
        let containmentDropdown = $('<select class="btn btn-sm btn-secondary containment-dropdown" title="Set image containment"><option value="contained">Contained</option><option value="uncontained">Uncontained</option></select>');

        toolbar.append(removeButton);
        toolbar.append(zIndexDropdown);
        toolbar.append(containmentDropdown);

        zIndexDropdown.change(function() {
            let zIndex = $(this).val() === 'foreground' ? 9999 : 1;
            let img = $(this).closest('.background-section').find('img');
            if ($(this).closest('.background-section').find('.containment-dropdown').val() === 'uncontained') {
                img.css('z-index', zIndex);
            }
        });

        removeButton.click(function() {
            $(this).closest('.background-section').find('.background-inner').empty().html('Click to add an image...');
            toolbar.css('visibility', 'hidden');
        });

        containmentDropdown.change(function() {
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

      // Ensure background section height matches main section height
      function adjustBackgroundHeight(sectionContent, toolbar, backgroundDiv, backgroundDiv1, backgroundDiv2) {
        if (backgroundDiv) {
            backgroundDiv.css('min-height', sectionContent.outerHeight() + toolbar.outerHeight());
        }
        if (backgroundDiv1) {
            backgroundDiv1.css('min-height', sectionContent.outerHeight() + toolbar.outerHeight());
        }
        if (backgroundDiv2) {
            backgroundDiv2.css('min-height', sectionContent.outerHeight() + toolbar.outerHeight());
        }
    }

    function addSection(type, placeholder = 'Edit this text...', background = null) {
        let container = $('<div class="section-container"></div>');
        let section = $('<div class="section"></div>');
        let toolbar = $('<div class="section-toolbar"></div>');
        let sectionContent = $('<div class="section-content" contenteditable="true"></div>');
        let backgroundDiv, backgroundDiv1, backgroundDiv2;

        // Common toolbar buttons
        if (type !== 'full') {
            toolbar.append('<button class="btn btn-sm btn-secondary bold-btn" title="Bold the selected text">Bold</button>');
            toolbar.append('<button class="btn btn-sm btn-secondary color-btn" title="Change the color of the selected text">Color</button>');
            toolbar.append('<button class="btn btn-sm btn-secondary color-picker" title="Change the border color">Border Color</button>');
            toolbar.append('<button class="btn btn-sm btn-secondary text-color-picker" title="Change the text color">Text Color</button>');
            toolbar.append('<button class="btn btn-sm btn-danger remove-section" title="Remove this section">Remove</button>');
        } else {
            toolbar.append('<button class="btn btn-sm btn-danger remove-section" title="Remove this section">Remove</button>');
        }

        // Dropdown for changing position
        if (type !== 'full') {
            let dropdown = $('<select class="position-dropdown btn btn-sm btn-secondary" title="Change the section position"></select>');
            dropdown.append('<option value="left">Left</option>');
            dropdown.append('<option value="middle">Middle</option>');
            dropdown.append('<option value="right">Right</option>');
            dropdown.val(type); // Set the initial value to match the type
            toolbar.append(dropdown);
        }

        if (type === 'full') {
            sectionContent.html('Click to add an image...');
            sectionContent.addClass('full-cover-img');
            sectionContent.click(function() {
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function(e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function(event) {
                            sectionContent.html('<img src="'+event.target.result+'" alt="Image" style="width: 100%;">');
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
            section.find('.remove-section').click(function() {
                console.log("Remove button clicked for full-cover image section");
                container.remove();
            });
            console.log('Full cover image section added');
        } else {
            if (type === 'left') {
                section.addClass('left-section');
                backgroundDiv = $('<div class="background-left background-section"><div class="background-inner">Click to add an image...</div></div>');
                backgroundDiv.prepend(createBackgroundToolbar());
                if (background) {
                    backgroundDiv.find('.background-inner').html('<img src="'+background+'" alt="Image" style="width: 100%;">');
                    backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
                }
            } else if (type === 'right') {
                section.addClass('right-section');
                backgroundDiv = $('<div class="background-right background-section"><div class="background-inner">Click to add an image...</div></div>');
                backgroundDiv.prepend(createBackgroundToolbar());
                if (background) {
                    backgroundDiv.find('.background-inner').html('<img src="'+background+'" alt="Image" style="width: 100%;">');
                    backgroundDiv.find('.background-toolbar').css('visibility', 'visible');
                }
            } else if (type === 'middle') {
                section.addClass('middle-section');
                toolbar.append('<button class="btn btn-sm btn-primary swap-button" title="Swap the content of the two background sections">Swap</button>'); // Add Swap button to main toolbar
                backgroundDiv1 = $('<div class="background-middle-1 background-section"><div class="background-inner">Click to add an image...</div></div>');
                backgroundDiv2 = $('<div class="background-middle-2 background-section"><div class="background-inner">Click to add an image...</div></div>');
                backgroundDiv1.prepend(createBackgroundToolbar());
                backgroundDiv2.prepend(createBackgroundToolbar());
                if (background) {
                    backgroundDiv1.find('.background-inner').html('<img src="'+background+'" alt="Image" style="width: 100%;">');
                    backgroundDiv2.find('.background-inner').html('<img src="'+background+'" alt="Image" style="width: 100%;">');
                    backgroundDiv1.find('.background-toolbar').css('visibility', 'visible');
                    backgroundDiv2.find('.background-toolbar').css('visibility', 'visible');
                }
                section.append(toolbar); // Add toolbar
                section.append(sectionContent); // Add content
                container.append(backgroundDiv1);
                container.append(section);
                container.append(backgroundDiv2);
                console.log('Middle section added');

                backgroundDiv1.find('.background-inner').click(function() {
                    let input = $('<input type="file" accept="image/*">');
                    input.click();
                    input.change(function(e) {
                        let file = e.target.files[0];
                        if (file) {
                            let reader = new FileReader();
                            reader.onload = function(event) {
                                backgroundDiv1.find('.background-inner').html('<img src="'+event.target.result+'" alt="Image" style="width: 100%;">');
                                backgroundDiv1.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
                            }
                            reader.readAsDataURL(file);
                        }
                    });
                });

                backgroundDiv2.find('.background-inner').click(function() {
                    let input = $('<input type="file" accept="image/*">');
                    input.click();
                    input.change(function(e) {
                        let file = e.target.files[0];
                        if (file) {
                            let reader = new FileReader();
                            reader.onload = function(event) {
                                backgroundDiv2.find('.background-inner').html('<img src="'+event.target.result+'" alt="Image" style="width: 100%;">');
                                backgroundDiv2.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
                            }
                            reader.readAsDataURL(file);
                        }
                    });
                });
            }

            backgroundDiv && backgroundDiv.find('.background-inner').click(function() {
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function(e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function(event) {
                            backgroundDiv.find('.background-inner').html('<img src="'+event.target.result+'" alt="Image" style="width: 100%;">');
                            backgroundDiv.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
                        }
                        reader.readAsDataURL(file);
                    }
                });
            });

            section.append(toolbar);
            section.append(sectionContent);

            if (type === 'left') {
                container.append(section); // Ensure the section is appended first
                container.append(backgroundDiv); // Then append the background section
            } else if (type === 'right') {
                container.append(backgroundDiv); // Append the background section first
                container.append(section); // Then append the section
            } else {
                container.append(backgroundDiv1);
                container.append(section);
                container.append(backgroundDiv2);
            }

            // Placeholder logic
            sectionContent.attr('data-placeholder', placeholder);

            sectionContent.on('focus', function() {
                if ($(this).text() === placeholder) {
                    $(this).text('');
                    $(this).removeClass('placeholder');
                }
            });

            sectionContent.on('blur', function() {
                if ($(this).text() === '') {
                    $(this).text(placeholder);
                    $(this).addClass('placeholder');
                }
            });

            sectionContent.blur();

            // Event handlers for toolbar buttons
            section.find('.bold-btn').click(function() {
                if (window.getSelection().toString()) {
                    document.execCommand('bold');
                } else {
                    alert('Please select text to bold.');
                }
            });
            section.find('.color-btn').click(function() {
                if (window.getSelection().toString()) {
                    document.execCommand('foreColor', false, 'red');
                } else {
                    alert('Please select text to change color.');
                }
            });

            // Border Color Picker
            section.find('.color-picker').click(function() {
                const pickr = Pickr.create({
                    el: this,
                    theme: 'nano',
                    default: lastUsedBorderColor,
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
                    lastUsedBorderColor = colorStr;
                    sectionContent.css('border-color', colorStr);
                    pickr.hide();
                });

                pickr.show();
            });

            // Text Color Picker
            section.find('.text-color-picker').click(function() {
                const pickr = Pickr.create({
                    el: this,
                    theme: 'nano',
                    default: lastUsedTextColor,
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
                    lastUsedTextColor = colorStr;
                    sectionContent.css('color', colorStr);
                    pickr.hide();
                });

                pickr.show();
            });

            section.find('.remove-section').click(function() {
                container.remove();
            });

            // Change position logic
            if (type !== 'full') {
                toolbar.find('.position-dropdown').change(function() {
                    let newType = $(this).val();
                    changePosition(container, section, sectionContent, newType, backgroundDiv, backgroundDiv1, backgroundDiv2);
                    toolbar.find('.position-dropdown').val(newType); // Update dropdown to reflect new position
                });
            }

            // // Ensure background section height matches main section height
            // function adjustBackgroundHeight() {
            //     if (backgroundDiv) {
            //         backgroundDiv.css('min-height', sectionContent.outerHeight() + toolbar.outerHeight());
            //     }
            //     if (backgroundDiv1) {
            //         backgroundDiv1.css('min-height', sectionContent.outerHeight() + toolbar.outerHeight());
            //     }
            //     if (backgroundDiv2) {
            //         backgroundDiv2.css('min-height', sectionContent.outerHeight() + toolbar.outerHeight());
            //     }
            // }
            sectionContent.on('input', function() {
                adjustBackgroundHeight($(this), toolbar, backgroundDiv, backgroundDiv1, backgroundDiv2);
            });
            adjustBackgroundHeight(sectionContent, toolbar, backgroundDiv, backgroundDiv1, backgroundDiv2);
        }

        $('#preview').append(container);
        return container; // Return the container instead of section
    }

    function changePosition(container, section, sectionContent, newType, backgroundDiv, backgroundDiv1, backgroundDiv2 ) {
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
                if (backgroundDiv1.find('img').length > 0 && backgroundDiv2.find('img').length > 0) {
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
                backgroundDiv.find('.background-inner').html('<img src="'+backgroundImage1+'" alt="Image" style="width: 100%;">');
                backgroundDiv.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
            }
            container.append(backgroundDiv);
        } else if (newType === 'middle') {
            section.addClass('middle-section');
            backgroundDiv1 = $('<div class="background-middle-1 background-section"><div class="background-inner">Click to add an image...</div></div>');
            backgroundDiv2 = $('<div class="background-middle-2 background-section"><div class="background-inner">Click to add an image...</div></div>');
            backgroundDiv1.prepend(createBackgroundToolbar());
            backgroundDiv2.prepend(createBackgroundToolbar());
            if (backgroundImage1) {
                backgroundDiv1.find('.background-inner').html('<img src="'+backgroundImage1+'" alt="Image" style="width: 100%;">');
                backgroundDiv1.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
            }
            if (backgroundImage2) {
                backgroundDiv2.find('.background-inner').html('<img src="'+backgroundImage2+'" alt="Image" style="width: 100%;">');
                backgroundDiv2.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
            }
            container.append(backgroundDiv1, backgroundDiv2);
        } else if (newType === 'right') {
            section.addClass('right-section');
            backgroundDiv = $('<div class="background-right background-section"><div class="background-inner">Click to add an image...</div></div>');
            backgroundDiv.prepend(createBackgroundToolbar());
            if (backgroundImage1) {
                backgroundDiv.find('.background-inner').html('<img src="'+backgroundImage1+'" alt="Image" style="width: 100%;">');
                backgroundDiv.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
            }
            container.append(backgroundDiv);
        }

        container.append(section);

        // Adjust height to match the section content
        adjustBackgroundHeight( sectionContent, backgroundDiv, backgroundDiv1, backgroundDiv2);

        // Reattach file input click handlers for new background sections
        if (backgroundDiv) {
            backgroundDiv.find('.background-inner').click(function() {
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function(e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function(event) {
                            backgroundDiv.find('.background-inner').html('<img src="'+event.target.result+'" alt="Image" style="width: 100%;">');
                            backgroundDiv.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
                        }
                        reader.readAsDataURL(file);
                    }
                });
            });
        }
        if (backgroundDiv1) {
            backgroundDiv1.find('.background-inner').click(function() {
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function(e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function(event) {
                            backgroundDiv1.find('.background-inner').html('<img src="'+event.target.result+'" alt="Image" style="width: 100%;">');
                            backgroundDiv1.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
                        }
                        reader.readAsDataURL(file);
                    }
                });
            });
        }
        if (backgroundDiv2) {
            backgroundDiv2.find('.background-inner').click(function() {
                let input = $('<input type="file" accept="image/*">');
                input.click();
                input.change(function(e) {
                    let file = e.target.files[0];
                    if (file) {
                        let reader = new FileReader();
                        reader.onload = function(event) {
                            backgroundDiv2.find('.background-inner').html('<img src="'+event.target.result+'" alt="Image" style="width: 100%;">');
                            backgroundDiv2.find('.background-toolbar').css('visibility', 'visible'); // Show toolbar
                        }
                        reader.readAsDataURL(file);
                    }
                });
            });
        }

        $('#preview').append(container);

        // Ensure sections are reordered to maintain the original order
        reorderSections();
    }

    function reorderSections() {
        let sections = $('#preview .section-container').get();
        sections.sort((a, b) => $(a).data('index') - $(b).data('index'));
        $('#preview').append(sections);
    }

    $('#addLeft').click(function() {
        let index = $('#preview .section-container').length;
        let container = addSection('left');
        container.data('index', index); // Setting index on container
    });
    $('#addRight').click(function() {
        let index = $('#preview .section-container').length;
        let container = addSection('right');
        container.data('index', index); // Setting index on container
    });
    $('#addMiddle').click(function() {
        let index = $('#preview .section-container').length;
        let container = addSection('middle');
        container.data('index', index); // Setting index on container
    });
    $('#addFull').click(function() {
        let index = $('#preview .section-container').length;
        let container = addSection('full');
        container.data('index', index); // Setting index on container
    });

    // Attach click event handler for swap buttons
    $(document).on('click', '.swap-button', function() {
        let container = $(this).closest('.section-container');
        let backgroundDiv1Inner = container.find('.background-middle-1 .background-inner');
        let backgroundDiv2Inner = container.find('.background-middle-2 .background-inner');
        let temp = backgroundDiv1Inner.html();
        backgroundDiv1Inner.html(backgroundDiv2Inner.html());
        backgroundDiv2Inner.html(temp);
    });

    // Add hover texts and feedback messages
    $('[title]').tooltip({
        show: {
            effect: "slideDown",
            delay: 1300
        }
    });

});