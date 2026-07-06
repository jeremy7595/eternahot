(function(Drupal, drupalSettings, $) {
  var categorySelect, seriesSelect, productSelect;
  var $toggleFilters = $('.toggle-filters');

  Drupal.behaviors.rinnaiDocumentLibrary = {
    attach: function (context) {
      if ($('.document-library-v2', context).length && context === document) {
        initDocumentLibraryV2();
        return;
      }

      if (context === document) {
        categorySelect = document.querySelector("select[name='category']");
        seriesSelect = document.querySelector("select[name='series']");
        productSelect = document.querySelector("select[name='model']");

        $('.model-selects select').on('change', function(e) {
          if (e.target == categorySelect) {
            $(seriesSelect).val('');
          }
          if (e.target == categorySelect || e.target == seriesSelect) {
            $(productSelect).val('');
          }
          queryAndUpdate();
          // explainCategoriesWithNoResults();
        });

        $('input[name=filter_language]').on('change', function() {
          applyLanguageFilters();
          //explainCategoriesWithNoResults();
        });

        $('.library-filter__filter-checkboxes input[type=checkbox]').on('change', function() {
          applyDocumentTypeFilters();
          // explainCategoriesWithNoResults();
        });
      }
    }
  }

  /**
   * Update the select element with the passed-in items.
   */
  function updateSelectElement(element, items, selected) {
    // Remove existing options, if any.
    var $options = $('option:not([data-placeholder])', element);
    if ($options.length > 0) {
      $options.remove();
    }

    // Append new options.
    for (var i = 0; i < items.length; i++) {
      $(element).append('<option value="' + items[i] + '"' +
        (selected === items[i] ? ' selected' : '') +
        '>' + items[i] + '</option>');
    }

    // Enable it.
    $(element).removeAttr('disabled');

    // Rebuild easy dropdown.
    easydropdown(element).refresh();
  }

  /**
   * Display the number of visible documents.
   */
  function updateDocumentCount() {
    // Update grand total of documents
    var visibleCount = $('.file-card.shown-card').length;
    $('.results-count').text(Drupal.formatPlural(visibleCount, '1 DOCUMENT', '@count DOCUMENTS'));

    // Update document category counts
    var certificationListings = $('.file-row__files[data-document-type="certification-listings"]');
    var componentReplacement = $('.file-row__files[data-document-type="component-replacement"]');
    var conversionManuals = $('.file-row__files[data-document-type="conversion-manuals"]');
    var energyGuideLabels = $('.file-row__files[data-document-type="energy-guide-labels"]');
    var installationOwnerManuals = $('.file-row__files[data-document-type="installation-owner-manuals"]');
    var specificationSheet = $('.file-row__files[data-document-type="specification-sheets"]');
    var systemDesignDrawings = $('.file-row__files[data-document-type="system-design-drawings"]');
    var technicalBulletins = $('.file-row__files[data-document-type="technical-bulletins"]');
    var technicalDataSheets = $('.file-row__files[data-document-type="technical-data-sheets"]');
    var warranties = $('.file-row__files[data-document-type="warranties"]');

    var certificationListingsCount = certificationListings.find('.file-card.shown-card').length;
    var componentReplacementCount = componentReplacement.find('.file-card.shown-card').length;
    var conversionManualsCount = conversionManuals.find('.file-card.shown-card').length;
    var energyGuideLabelsCount = $(energyGuideLabels).find('.file-card.shown-card').length;
    var installationOwnerManualsCount = $(installationOwnerManuals).find('.file-card.shown-card').length;
    var specificationSheetCount = $(specificationSheet).find('.file-card.shown-card').length;
    var systemDesignDrawingsCount = $(systemDesignDrawings).find('.file-card.shown-card').length;
    var technicalBulletinsCount = $(technicalBulletins).find('.file-card.shown-card').length;
    var technicalDataSheetsCount = $(technicalDataSheets).find('.file-card.shown-card').length;
    var warrantiesCount = $(warranties).find('.file-card.shown-card').length;

    documentCountText(certificationListingsCount, 'certification-listings');
    documentCountText(componentReplacementCount, 'component-replacement');
    documentCountText(conversionManualsCount, 'conversion-manuals');
    documentCountText(energyGuideLabelsCount, 'energy-guide-labels');
    documentCountText(installationOwnerManualsCount, 'installation-owner-manuals');
    documentCountText(specificationSheetCount, 'specification-sheets');
    documentCountText(systemDesignDrawingsCount, 'system-design-drawings');
    documentCountText(technicalBulletinsCount, 'technical-bulletins');
    documentCountText(technicalDataSheetsCount, 'technical-data-sheets');
    documentCountText(warrantiesCount, 'warranties');
  }

  function documentCountText(documentCount, dataAttribute) {
    var documentCountText =  (documentCount == 1) ? '(1 document)' : '(' + documentCount + ' documents)';
    var documentCountTag = $('small[data-document-type="' + dataAttribute + '"]')
    var small = documentCountTag.parent().find('small');

    documentCountTag.text(documentCountText);
    $(small).removeClass('highlighted');
    if (documentCount > 0) {
      $(small).addClass('highlighted');
    }
  }

  /**
   * Apply document type filters to the current document list.
   */
  function applyDocumentTypeFilters() {
    var $checked = $('.library-filter__filter-checkboxes input[type=checkbox]:checked');
    if ($checked.length > 0) {
      $('.library-filter__filter-checkboxes input[type=checkbox]').each(function() {
        var documentType = $(this).attr('data-document-type');
        var $row = $('.document-row[data-document-type="' + documentType + '"]');

        if ($(this).is(':checked')) {
          $row.show();
        } else {
          $row.hide();
        }
      })
    }
    else {
      // All document types.
      $('.document-row').show();
    }

    updateDocumentCount();
  }

  /**
   * Apply document type filters to the current document list.
   */
  function applyLanguageFilters() {
    var selectedLanguage = $('input[name="filter_language"]:checked').attr('id');
    selectedLanguage = selectedLanguage.replace('language_', '');
    var firstLetter = selectedLanguage.charAt(0);
    var remainingLetters = selectedLanguage.substring(1);
    selectedLanguage = firstLetter.toUpperCase() + remainingLetters;

    var certificationListings = $('.file-row__files[data-document-type="certification-listings"]');
    var componentReplacement = $('.file-row__files[data-document-type="component-replacement"]');
    var energyGuideLabels = $('.file-row__files[data-document-type="energy-guide-labels"]');
    var installationOwnerManuals = $('.file-row__files[data-document-type="installation-owner-manuals"]');
    var specificationSheet = $('.file-row__files[data-document-type="specification-sheets"]');
    var systemDesignDrawings = $('.file-row__files[data-document-type="system-design-drawings"]');
    var technicalBulletins = $('.file-row__files[data-document-type="technical-bulletins"]');
    var technicalDataSheets = $('.file-row__files[data-document-type="technical-data-sheets"]');
    var warranties = $('.file-row__files[data-document-type="warranties"]');

    var i;
    var $fileRow = $('.file-row__files');
    var $allCards = $('.file-row__files .file-card');

    $('.no-documents-filter-message').hide();

    var dataResult, textResult;
    for (i = 0; i <= $allCards.length; i++) {
      var $card = $($allCards[i]);
      dataResult = $card.is('[data-language*="' + selectedLanguage + '"]') > 0;
      textResult = false;

      if (selectedLanguage == 'English') {
        dataResult = true;
        textResult = true;
      } else if ($card.attr('data-language')) {
        textResult = $card.attr('data-language').search(new RegExp(selectedLanguage, 'i')) > 0;
      }

      $card.addClass('hidden-card').removeClass('shown-card');
      if (dataResult || textResult) {
        $card.addClass('shown-card').removeClass('hidden-card');
      }
    }

    // Display of no results message for each category
    var card;
    var certificationListingsShown = 0;
    for (i = 0; i < certificationListings.find('.file-card').length; i++) {
      card = $(certificationListings.find('.file-card')[i]);
      if (card.hasClass('shown-card')) {
        certificationListingsShown++;
      }
    }

    if (certificationListingsShown == 0) {
      certificationListings.parent().parent().find('.no-documents-filter-message').show();
    }

    var componentReplacementShown = 0;
    for (i = 0; i < componentReplacement.find('.file-card').length; i++) {
      card = $(componentReplacement.find('.file-card')[i]);
      if (card.hasClass('shown-card')) {
        componentReplacementShown++;
      }
    }

    if (componentReplacementShown == 0) {
      componentReplacement.parent().parent().find('.no-documents-filter-message').show();
    }

    var energyGuideLabelsShown = 0;
    for (i = 0; i < energyGuideLabels.find('.file-card').length; i++) {
      card = $(energyGuideLabels.find('.file-card')[i]);
      if (card.hasClass('shown-card')) {
        energyGuideLabelsShown++;
      }
    }

    if (energyGuideLabelsShown == 0) {
      energyGuideLabels.parent().parent().find('.no-documents-filter-message').show();
    }

    var installationOwnerManualsShown = 0;
    for (i = 0; i < installationOwnerManuals.find('.file-card').length; i++) {
      card = $(installationOwnerManuals.find('.file-card')[i]);
      if (card.hasClass('shown-card')) {
        installationOwnerManualsShown++;
      }
    }

    if (installationOwnerManualsShown == 0) {
      installationOwnerManuals.parent().parent().find('.no-documents-filter-message').show();
    }

    var specificationSheetShown = 0;
    for (i = 0; i < specificationSheet.find('.file-card').length; i++) {
      card = $(specificationSheet.find('.file-card')[i]);
      if (card.hasClass('shown-card')) {
        specificationSheetShown++;
      }
    }

    if (specificationSheetShown == 0) {
      specificationSheet.parent().parent().find('.no-documents-filter-message').show();
    }

    var systemDesignDrawingsShown = 0;
    for (i = 0; i < systemDesignDrawings.find('.file-card').length; i++) {
      card = $(systemDesignDrawings.find('.file-card')[i]);
      if (card.hasClass('shown-card')) {
        systemDesignDrawingsShown++;
      }
    }

    if (systemDesignDrawingsShown == 0) {
      systemDesignDrawings.parent().parent().find('.no-documents-filter-message').show();
    }

    var technicalBulletinsShown = 0;
    for (i = 0; i < technicalBulletins.find('.file-card').length; i++) {
      card = $(technicalBulletins.find('.file-card')[i]);
      if (card.hasClass('shown-card')) {
        technicalBulletinsShown++;
      }
    }

    if (technicalBulletinsShown == 0) {
      technicalBulletins.parent().parent().find('.no-documents-filter-message').show();
    }

    var technicalDataSheetsShown = 0;
    for (i = 0; i < technicalDataSheets.find('.file-card').length; i++) {
      card = $(technicalDataSheets.find('.file-card')[i]);
      if (card.hasClass('shown-card')) {
        technicalDataSheetsShown++;
      }
    }

    if (technicalDataSheetsShown == 0) {
      technicalDataSheets.parent().parent().find('.no-documents-filter-message').show();
    }

    var warrantiesShown = 0;
    for (i = 0; i < warranties.find('.file-card').length; i++) {
      card = $(warranties.find('.file-card')[i]);
      if (card.hasClass('shown-card')) {
        warrantiesShown++;
      }
    }

    if (warrantiesShown == 0) {
      warranties.parent().parent().find('.no-documents-filter-message').show();
    }

    // hideEmptyLists();
    updateDocumentCount();
  }

  // /**
  //  * If a category has no items, hide the ul tag which takes up space in display so there aren't large blank areas.
  //  */
  // function hideEmptyLists() {
  //   var ul = $('ul.document-library__filter-results');
  //   ul.each(function(index, list) {
  //     if ($(list).children(':visible').length == 0) {
  //       $(list).css('display', 'none');
  //     }
  //   });
  // }

  // /**
  //  * Add text noting that this category has no results.
  //  */
  // function explainCategoriesWithNoResults() {
  //   $('.document-row').each(function(index, div) {
  //     var counter = 0;
  //     $(div).find('p.no-documents').remove();
  //
  //     $(div).find('.document-library__filter-results li').each(function(index, li) {
  //       if ($(li).is(':visible')) {
  //         counter++;
  //       }
  //     });
  //
  //     if (counter == 0) {
  //       $(div).append('<p class="no-documents">No documents found for this document type.</p>')
  //     }
  //   });
  // }

  function sanitizeDocumentType(docType) {
    var sanitizedDocumentType = docType.toLowerCase().replace(/\s+/g, '-');
    sanitizedDocumentType = sanitizedDocumentType.replace(/\//g, '-');
    sanitizedDocumentType = sanitizedDocumentType.replace('<sup-class="color-red">i<-sup>', '');
    sanitizedDocumentType = sanitizedDocumentType.replace('<sup-class="color-red">ii<-sup>', '');
    sanitizedDocumentType = sanitizedDocumentType.replace('<sup-class="color-red">iii<-sup>', '');

    return sanitizedDocumentType;
  }

  /**
   * Update documents section from retrieved results.
   */
  function updateDocuments(documents) {
    var $docResults = $('.document-library__results');
    $docResults.html('');

    var docCount = 0;
    var docRows = [];
    var i, docType, sanitizedDocumentType;

    // Sort document types alphabetically as a backup, even they're sorted properly in the back end (just in case)
    var keys = Object.keys(documents);
    keys.sort();
    let sortedDocuments = [];
    for (i = 0; i < keys.length; i++) {
      sortedDocuments[keys[i]] = documents[keys[i]]
    }

    for (docType in sortedDocuments) {
      // if (sortedDocuments.hasOwnProperty(docType)) {
        // if (sortedDocuments[docType].length > 0) {
          docCount++;
          sanitizedDocumentType = sanitizeDocumentType(docType);

          // Convert associative array to numeric array for proper iteration
          // The backend returns documents as {doc_id: {...}, doc_id2: {...}}
          // but we need [ {...}, {...} ] for array iteration
          var docArray = Object.values(sortedDocuments[docType] || {});
          var documentCount = docArray.length;
          var documentCountText = (documentCount == 1) ? '(1 Document)' : '(' + documentCount + ' documents)';
          var documentCountClass =  (documentCount > 0) ? 'highlighted' : '';
          // var showArrows = (documentCount > 8);

          var accordion = '<dl class="accordion__dl"><div class="accordion pagefx-accordion">';
          accordion += '<div class="document-row accordion pagefx-accordion" data-document-type="' + sanitizedDocumentType + '">';
          accordion +=
            '<dt>' +
            '  <button type="button" class="accordion__header pagefx-asccordion__trigger" id="pagefx_accordion_trigger_0" aria-controls="pagefx_accordion_section_0" aria-expanded="true">' +
            '    <span class="accordion__label">' + docType + ' <small class="' + documentCountClass + '" data-document-type="' + sanitizedDocumentType + '">' + documentCountText + '</small></span>' +
            '    <span class="accordion__expander"></span>' +
            '  </button>' +
            '</dt>' +
            '<dd class="accordion__section pagefx-accordion__target">' +
            '  <p class="no-documents-filter-message">No documents found for this document type.</p>' +
            '  <div class="file-row">';

          // if (showArrows) {
          //   accordion +=
          //     '    <button class="file-row__previous file-viewer">' +
          //     '      <span class="visually-hidden">' +
          //     '        Previous batch of files' +
          //     '      </span>' +
          //     '    </button>';
          // }

          accordion += '<div class="file-row__files" data-document-type="' + sanitizedDocumentType + '">';

          if (documentCount > 0) {
            for (i = 0; i < docArray.length; i++) {
              docCount++;

              var docData = docArray[i];
              var rendered = '';

              if (docData) {
                var placeholderIcon = drupalSettings.rinnai.placeholderFileIcon;
                if (docData.format === 'PDF') {
                  placeholderIcon = drupalSettings.rinnai.placeholderPDFIcon;
                } else if (docData.format === 'DWG') {
                  placeholderIcon = drupalSettings.rinnai.placeholderDWGIcon;
                }

                var languages = docData.language;
                if (languages !== null && languages !== undefined && languages.constructor === Array) {
                  languages = languages.join('|');
                }
                if (languages === null || languages === undefined) {
                  languages = '';
                }

                // Hidden and shown classes get set in language filter
                var firstCard = (i == 0) ? ' first-card' : '';
                var lastCard = (i == 7) ? ' last-card' : '';

                // Use thumbnail URL if available (matching product detail page behavior)
                // The getThumbnailUrl() method should return a valid thumbnail URL or empty string
                var thumbnailSrc = docData.thumbnail_url;
                if (thumbnailSrc && thumbnailSrc !== '') {
                  // Thumbnail URL is available, use it and mark as having image
                  rendered = 'file-card__thumbnail';
                } else {
                  // No thumbnail URL, use placeholder icon
                  thumbnailSrc = placeholderIcon;
                  rendered = '';
                }

                // Determine if we should use the proxy for external PDFs (like file-card template)
                var assetUrl = docData.asset_url || docData.url || '';
                var useProxy = false;
                var finalUrl = assetUrl;
                var docFormat = docData.format || (assetUrl.toLowerCase().indexOf('.dwg') !== -1 ? 'DWG' : 'PDF');

                // Check if it's an external PDF URL (starts with http:// or https://)
                if (docFormat === 'PDF' && assetUrl &&
                    (assetUrl.toLowerCase().startsWith('http://') || assetUrl.toLowerCase().startsWith('https://'))) {
                  useProxy = true;
                }

                if (useProxy) {
                  // Build proxy URL like the file-card template does
                  var encodedPath = encodeURIComponent(assetUrl);
                  var downloadName = docData.name;
                  // Ensure PDF files have .pdf extension
                  if (docFormat === 'PDF' && !downloadName.toLowerCase().endsWith('.pdf')) {
                    downloadName = downloadName + '.pdf';
                  }
                  var encodedFilename = encodeURIComponent(downloadName);
                  var legacyBasePath = (typeof drupalSettings !== 'undefined' && drupalSettings.path && drupalSettings.path.baseUrl) ? drupalSettings.path.baseUrl : '';
                  finalUrl = legacyBasePath + 'download/download?path=' + encodedPath + '&filename=' + encodedFilename;
                }

                var fileCard = '<div class="file-card' + firstCard + lastCard + '" data-language="' + languages + '" data-card-number="' + (i + 1) + '" data-document-type="' + sanitizedDocumentType + '">' +
                  '  <a class="file-card__button file-card__button--has-image'+ rendered + '" ' +
                  '     href="' + finalUrl + '" aria-describedby="file-details-' + i + '" target="_blank">' +
                  '    <img ' + ' class="' + rendered + '" src="' + thumbnailSrc + '" alt="' + docData.name + '" ' +
                  '       onerror="this.onerror = null; this.src=\'' + placeholderIcon + '\'; this.id = \'notRendered\'; this.className = \'\';"' +
                  '    />' +
                  '  </a>' +
                  '  <div class="file-card__details" id="file-details-' + i + '">' +
                  '    <div class="file-card__name">' + docData.name + '</div>' +
                  '    <div class="file-card__attributes">' + docData.format + '<span aria-hidden="true"> | </span>' + docData.size + ' ' + docData.format + '</div>' +
                  '  </div>' +
                  '</div>';

                var $fileCard = $(fileCard);
                if (i >= 5) {
                  $fileCard.addClass('filtered');
                }

                accordion += fileCard;
              }
            }
          } else {
            // accordion += '<p class="no-documents">There are no documents available based on your search criteria. If you have question please chat with us or <a class="color-red" target="_blank" href="http://rinnai.localhost/support/contact">contact Rinnai Customer Care</a>.</p>';
          }

        // if (showArrows) {
          // accordion += '</div>';
            // '</div><button class="file-row__next file-viewer"">' +
            // '  <span class="visually-hidden">' +
            // '     Next batch of files' +
            // '  </span>' +
            // '</button>';
        // }

        accordion += '</dd></div></dl>';
      // }

      docRows.push(accordion);
    }

    $docResults.append('<p class="results-count"></p>');
    for (i = 0; i < docRows.length; i++) {
      $docResults.append(docRows[i]);
    }

    // for (docType in sortedDocuments) {
    //   sanitizedDocumentType = sanitizeDocumentType(docType);
    //   var lastShownCard = 8;
    //   if (lastShownCard < 8) {
    //     lastShownCard = sortedDocuments[docType].length;
    //   }
    //
    //   $('.file-row__files[data-document-type="' + sanitizedDocumentType + '"]').attr('data-last-shown-card', lastShownCard);
    // }

    applyDocumentTypeFilters();
    applyLanguageFilters();
  }

  $(document).on('click', '.accordion__header', function(e) {
    e.preventDefault();

    var files = $(this).parent().parent().find('dd');
    var expander = $(this).find('.accordion__expander');

    if (files.css('display') == 'block') {
      files.slideUp();
      expander.addClass('down').removeClass('up');
    } else {
      files.slideDown();
      expander.addClass('up').removeClass('down');
    }
  });

  $toggleFilters.on('click', function(e) {
    e.preventDefault();

    var $libraryFilter = $('.library-filter');
    if ($libraryFilter.css('display') == 'block') {
      $libraryFilter.slideUp();
    } else {
      $libraryFilter.slideDown();
    }
  });

  /**
   * Document Library V2: sidebar filters, search, sort, card grid.
   */
  function initDocumentLibraryV2() {
    var $container = $('.document-library-v2');
    var allDocuments = [];
    var currentSort = 'recent';
    var currentSearchTerm = '';
    var nextOffset = 0;
    var PAGE_SIZE = 24;
    var matchingTotal = 0;
    var basePath = (typeof drupalSettings !== 'undefined' && drupalSettings.path && drupalSettings.path.baseUrl) ? drupalSettings.path.baseUrl : '';
    var lastFilterHierarchy = null;

    function mapDocTypeToSlug(label) {
      var map = {
        'Accessory Installation': 'accessory-installation',
        'Certification Listings<sup class="color-red">i</sup>': 'certification-listings',
        'Component Replacement': 'component-replacement',
        'Conversion Manuals': 'conversion-manuals',
        'Energy Guide Labels<sup class="color-red">ii</sup>': 'energy-guide-labels',
        'Installation/Owner Manuals': 'installation-owner-manuals',
        'Specification Sheets': 'specification-sheets',
        'System Design Drawings': 'system-design-drawings',
        'Technical Bulletins': 'technical-bulletins',
        'Technical Data Sheets': 'technical-data-sheets',
        'Warranties<sup class="color-red">iii</sup>': 'warranties'
      };
      return map[label] || label.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
    }

    function inferFormat(docData) {
      if (docData.format) {
        return docData.format;
      }
      var url = (docData.asset_url || docData.url || '').toLowerCase();
      if (url.indexOf('.dwg') !== -1) {
        return 'DWG';
      }
      if (url.indexOf('.pdf') !== -1) {
        return 'PDF';
      }
      return 'PDF';
    }

    function formatDisplaySize(docData) {
      if (docData.size) {
        return docData.size;
      }
      var bytes = parseInt(docData.size_bytes, 10);
      if (!bytes) {
        return '';
      }
      var units = ['B', 'KB', 'MB', 'GB', 'TB'];
      var factor = Math.floor((String(bytes).length - 1) / 3);
      factor = Math.min(factor, units.length - 1);
      return Math.floor(bytes / Math.pow(1024, factor)) + ' ' + units[factor];
    }

    function buildCardMetaText(docData) {
      var format = inferFormat(docData);
      var size = formatDisplaySize(docData);
      if (format && size) {
        return format + ' | ' + size;
      }
      return format || size || '';
    }

    function escapeHref(url) {
      return (url || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    }

    function getDownloadUrl(docData) {
      var assetUrl = docData.asset_url || docData.url || '';
      var format = inferFormat(docData);
      if (format === 'PDF' && assetUrl &&
          (assetUrl.toLowerCase().startsWith('http://') || assetUrl.toLowerCase().startsWith('https://'))) {
        var downloadName = docData.name || 'document';
        if (!downloadName.toLowerCase().endsWith('.pdf')) {
          downloadName = downloadName + '.pdf';
        }
        return basePath + 'download/download?path=' + encodeURIComponent(assetUrl) + '&filename=' + encodeURIComponent(downloadName);
      }
      return assetUrl;
    }

    function buildCard(docData, docTypeSlug) {
      var placeholderIcon = (drupalSettings.rinnai && drupalSettings.rinnai.placeholderFileIcon) ? drupalSettings.rinnai.placeholderFileIcon : '';
      if (drupalSettings.rinnai) {
        var docFormat = inferFormat(docData);
        if (docFormat === 'PDF') {
          placeholderIcon = drupalSettings.rinnai.placeholderPDFIcon || placeholderIcon;
        } else if (docFormat === 'DWG') {
          placeholderIcon = drupalSettings.rinnai.placeholderDWGIcon || placeholderIcon;
        }
      }
      var hasThumb = !!(docData.thumbnail_url && docData.thumbnail_url !== '');
      var thumbSrc = hasThumb ? docData.thumbnail_url : placeholderIcon;
      var downloadUrl = getDownloadUrl(docData);
      var downloadHref = escapeHref(downloadUrl);
      var lang = docData.language;
      if (lang !== null && lang.constructor === Array) {
        lang = lang.join('|');
      }
      var name = (docData.name || '').replace(/<[^>]+>/g, '');
      // var shareUrlAttr = escapeHref(downloadUrl);
      var category = (docData.category || '').replace(/"/g, '&quot;');
      var created = (docData.created != null && docData.created !== '') ? parseInt(docData.created, 10) : 0;
      var dataAttrs = 'data-document-type="' + docTypeSlug + '" data-language="' + (lang || '') + '" data-category="' + category + '" data-created="' + created + '"';
      var metaText = buildCardMetaText(docData);

      var sep = ' - ';
      var titleHtml;
      if (name.indexOf(sep) >= 0) {
        var line1 = name.substring(0, name.indexOf(sep)).trim();
        var line2 = name.substring(name.indexOf(sep) + sep.length).trim();
        titleHtml = '<p class="document-library-v2__card-title">' + line1 + '</p><p class="document-library-v2__card-title-line2">' + line2 + '</p>';
      } else {
        titleHtml = '<p class="document-library-v2__card-title">' + name + '</p>';
      }

      var listItemAttr = ' role="listitem"';
      var ariaName = name.replace(/"/g, '&quot;');
      var downloadAria = ' aria-label="Download ' + ariaName + '"';
      // var shareAria = ' aria-label="Share link for ' + ariaName + '"';
      if (!hasThumb) {
        return '<div class="document-library-v2__card document-library-v2__card--text-only"' + listItemAttr + ' ' + dataAttrs + '>' +
          '<div class="document-library-v2__card-body">' +
          titleHtml +
          '<p class="document-library-v2__card-meta">' + metaText + '</p>' +
          '<div class="document-library-v2__card-actions">' +
          '<a href="' + downloadHref + '" class="document-library-v2__card-action" target="_blank" rel="noopener"' + downloadAria + '>Download</a>' +
          // '<button type="button" class="document-library-v2__card-action document-library-v2__share-link" data-url="' + shareUrlAttr + '"' + shareAria + '>Share Link</button>' +
          '</div></div></div>';
      }

      return '<div class="document-library-v2__card"' + listItemAttr + ' ' + dataAttrs + '>' +
        '<a class="document-library-v2__card-link" href="' + downloadHref + '" target="_blank" rel="noopener"' + downloadAria + '>' +
        '<img class="document-library-v2__card-thumb" src="' + thumbSrc + '" alt="" onerror="this.onerror=null;this.src=\'' + (placeholderIcon || '') + '\'">' +
        '</a>' +
        '<div class="document-library-v2__card-body">' +
        titleHtml +
        '<p class="document-library-v2__card-meta">' + metaText + '</p>' +
        '<div class="document-library-v2__card-actions">' +
        '<a href="' + downloadHref + '" class="document-library-v2__card-action" target="_blank" rel="noopener"' + downloadAria + '>Download</a>' +
        // '<button type="button" class="document-library-v2__card-action document-library-v2__share-link" data-url="' + shareUrlAttr + '"' + shareAria + '>Share Link</button>' +
        '</div></div></div>';
    }

    function flattenDocuments(documents) {
      // API may return flat array (each item has doc_type_slug) or nested object by doc type.
      if (Array.isArray(documents)) {
        if (documents.length === 0) {
          return [];
        }
      }
      if (Array.isArray(documents) && documents.length > 0 && documents[0].doc_type_slug !== undefined) {
        return documents.map(function(item) {
          var doc = {};
          var skipKeys = { document_id: 1, doc_type: 1, doc_type_slug: 1, id: 1 };
          Object.keys(item).forEach(function(k) {
            if (!skipKeys[k]) { doc[k] = item[k]; }
          });
          if (doc.url && !doc.asset_url) {
            doc.asset_url = doc.url;
          }
          return { doc: doc, docTypeSlug: item.doc_type_slug, category: item.category || '' };
        });
      }
      var list = [];
      var keys = Object.keys(documents || {}).sort();
      keys.forEach(function(docType) {
        var slug = mapDocTypeToSlug(docType);
        var arr = Object.values(documents[docType] || {});
        arr.forEach(function(doc) {
          list.push({ doc: doc, docType: docType, docTypeSlug: slug, category: doc.category || '' });
        });
      });
      return list;
    }

    function renderCards(docs, append) {
      var $results = $container.find('.document-library-v2__results');
      var $instructions = $container.find('.document-library-v2__instructions');
      var $noResults = $container.find('.document-library-v2__no-results');
      var $loadMoreWrap = $container.find('.document-library-v2__load-more-wrap');
      if (!append) {
        $results.empty();
        $loadMoreWrap.find('.document-library-v2__load-more').remove();
      }
      if (docs.length === 0 && !append) {
        $instructions.addClass('hidden');
        $noResults.removeClass('hidden');
        updateResultsCount(0);
        return;
      }
      $instructions.addClass('hidden');
      $noResults.addClass('hidden');
      var startIndex = append ? allDocuments.length - docs.length : 0;
      docs.forEach(function(item, index) {
        var $card = $(buildCard(item.doc, item.docTypeSlug));
        $card.attr('data-index', append ? startIndex + index : index);
        $results.append($card);
      });
      if (!append) {
        showOrHideLoadMore(false);
      }
      // bindShareLinks();
      applyV2Filters();
    }

    function showOrHideLoadMore(hasMore) {
      var $loadMoreWrap = $container.find('.document-library-v2__load-more-wrap');
      $loadMoreWrap.find('.document-library-v2__load-more').remove();
      if (hasMore) {
        $loadMoreWrap.append('<button type="button" class="document-library-v2__load-more">' + (typeof Drupal !== 'undefined' && Drupal.t ? Drupal.t('Load More') : 'Load More') + '</button>');
        $container.find('.document-library-v2__load-more').on('click', function() {
          fetchAndShow(nextOffset);
        });
      }
    }

    // function bindShareLinks() {
    //   $container.find('.document-library-v2__share-link').on('click', function() {
    //     var url = $(this).data('url');
    //     if (navigator.clipboard && navigator.clipboard.writeText) {
    //       navigator.clipboard.writeText(url).then(function() {
    //         if (typeof Drupal !== 'undefined' && Drupal.Message) {
    //           var messages = new Drupal.Message();
    //           messages.clear();
    //           messages.add(Drupal.t('Link copied to clipboard.'), { type: 'status' });
    //         } else {
    //           alert(Drupal.t('Link copied to clipboard.'));
    //         }
    //       });
    //     } else {
    //       prompt(Drupal.t('Copy this link:'), url);
    //     }
    //   });
    // }

    function getSelectedProductTypes() {
      var selected = [];
      $container.find('input[name="product_type"]:checked').each(function() {
        selected.push($(this).val());
      });
      return selected;
    }

    function getSelectedBuildingTypes() {
      var selected = [];
      $container.find('input[name="building_type"]:checked').each(function() {
        selected.push($(this).val());
      });
      return selected;
    }

    function getSelectedDocumentTypes() {
      var selected = [];
      $container.find('input[name="document_type"]:checked').each(function() {
        selected.push($(this).val());
      });
      return selected;
    }

    function getSelectedLanguage() {
      var radio = $container.find('input[name="filter_language"]:checked');
      return radio.length ? radio.val() : 'English';
    }

    // Apply server-provided facet availability to the sidebar UI.
    function applyServerFacets(facets) {
      facets = facets || {};
      var btFacet = facets.building_type || {};
      var ptFacet = facets.product_type || {};
      var dtFacet = facets.document_type || {};
      var langFacet = facets.language || {};

      // Building Type (top level).
      $container.find('input[name="building_type"]').each(function() {
        var val = $(this).val();
        var count = btFacet[val] || 0;
        var $label = $(this).closest('.document-library-v2__checkbox-label');
        if (count > 0) {
          $(this).prop('disabled', false);
          $label.removeClass('document-library-v2__filter-option--disabled document-library-v2__filter-option--hidden');
        } else {
          $(this).prop('disabled', true).prop('checked', false);
          $label.addClass('document-library-v2__filter-option--disabled document-library-v2__filter-option--hidden');
        }
      });

      // Product Type.
      $container.find('input[name="product_type"]').each(function() {
        var val = $(this).val();
        var count = ptFacet[val] || 0;
        var $label = $(this).closest('.document-library-v2__checkbox-label');
        if (count > 0) {
          $(this).prop('disabled', false);
          $label.removeClass('document-library-v2__filter-option--disabled document-library-v2__filter-option--hidden');
        } else {
          $(this).prop('disabled', true).prop('checked', false);
          $label.addClass('document-library-v2__filter-option--disabled document-library-v2__filter-option--hidden');
        }
      });

      // Document Type (uses doc_type_slug).
      $container.find('input[name="document_type"]').each(function() {
        var val = $(this).val(); // same slug used in facets.document_type keys
        var count = dtFacet[val] || 0;
        var $label = $(this).closest('.document-library-v2__checkbox-label');
        if (count > 0) {
          $(this).prop('disabled', false);
          $label.removeClass('document-library-v2__filter-option--disabled document-library-v2__filter-option--hidden');
        } else {
          $(this).prop('disabled', true).prop('checked', false);
          $label.addClass('document-library-v2__filter-option--disabled document-library-v2__filter-option--hidden');
        }
      });

      // Language radios: always keep enabled so users can switch language.
      $container.find('input[name="filter_language"]').each(function() {
        var $label = $(this).closest('.document-library-v2__checkbox-label');
        $(this).prop('disabled', false);
        $label.removeClass('document-library-v2__filter-option--disabled document-library-v2__filter-option--hidden');
      });
    }

    function commitSearch() {
      currentSearchTerm = ($container.find('#document-library-search').val() || '').trim();
      nextOffset = 0;
      fetchAndShow(0);
    }

    function applyV2Filters() {
      $container.find('.document-library-v2__card').removeClass('hidden-card document-library-v2__card--hidden').show();
      var visible = $container.find('.document-library-v2__card').length;
      $container.find('.document-library-v2__no-results').toggleClass('hidden', visible > 0);
      updateResultsCount(visible);
    }

    function updateResultsCount(visibleCount) {
      var $countEl = $container.find('.document-library-v2__results-count');
      if (!$countEl.length) {
        return;
      }
      var displayed = (visibleCount !== undefined && visibleCount !== null)
        ? visibleCount
        : $container.find('.document-library-v2__card:visible').length;
      var total = matchingTotal;
      var text;

      if (total === 0) {
        text = (typeof Drupal !== 'undefined' && Drupal.formatPlural)
          ? Drupal.formatPlural(0, '0 documents', '@count documents')
          : '0 documents';
      }
      else if (displayed < total) {
        text = (typeof Drupal !== 'undefined' && Drupal.t)
          ? Drupal.t('Showing @displayed of @total documents', { '@displayed': displayed, '@total': total })
          : ('Showing ' + displayed + ' of ' + total + ' documents');
      }
      else {
        text = (typeof Drupal !== 'undefined' && Drupal.formatPlural)
          ? Drupal.formatPlural(total, '1 document', '@count documents')
          : (total === 1 ? '1 document' : total + ' documents');
      }
      $countEl.text(text);
    }

    function sortDocuments() {
      var $results = $container.find('.document-library-v2__results');
      var $cards = $results.find('.document-library-v2__card').get();
      if (currentSort === 'alphabetical') {
        $cards.sort(function(a, b) {
          var nameA = ($(a).data('name') || '').toLowerCase();
          var nameB = ($(b).data('name') || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      } else if (currentSort === 'recent') {
        $cards.sort(function(a, b) {
          var tsA = parseInt($(a).attr('data-created'), 10) || 0;
          var tsB = parseInt($(b).attr('data-created'), 10) || 0;
          return tsB - tsA;
        });
      }
      $cards.forEach(function(el) {
        $results.append(el);
      });
    }

    function buildQueryParams(offset) {
      var params = {
        limit: PAGE_SIZE,
        offset: offset || 0,
        sort: currentSort
      };
      var buildingTypes = getSelectedBuildingTypes();
      var productTypes = getSelectedProductTypes();
      var documentTypes = getSelectedDocumentTypes();
      if (buildingTypes.length) {
        params.building_type = buildingTypes;
      }
      if (productTypes.length) {
        params.product_type = productTypes;
      }
      if (documentTypes.length) {
        params.document_type = documentTypes;
      }
      if (currentSearchTerm) {
        params.search = currentSearchTerm;
      }
      params.language = getSelectedLanguage();
      return params;
    }

    function fetchAndShow(offset) {
      offset = offset !== undefined ? offset : 0;
      var append = offset > 0;
      $container.find('.document-library-v2__instructions').removeClass('hidden').text(typeof Drupal !== 'undefined' && Drupal.t ? Drupal.t('Loading documentsâ¦') : 'Loading documentsâ¦');
      $container.find('.document-library-v2__no-results').addClass('hidden');
      var queryUrl = (basePath || '') + (basePath ? '' : '/') + 'document-query';
      var params = buildQueryParams(offset);
      $.get(queryUrl, params, function(data) {
        if (data.documents && Array.isArray(data.documents)) {
          var normalized = flattenDocuments(data.documents);
          var pagination = data.pagination || {};
          matchingTotal = parseInt(pagination.total, 10) || 0;
          if (append) {
            allDocuments = allDocuments.concat(normalized);
            renderCards(normalized, true);
          } else {
            allDocuments = normalized;
            renderCards(allDocuments, false);
          }
          nextOffset = (pagination.offset || 0) + (normalized.length);
          showOrHideLoadMore(!!pagination.has_more);
          if (data.facets) {
            applyServerFacets(data.facets);
          }
          updateResultsCount();
        } else {
          if (!append) {
            allDocuments = [];
            matchingTotal = 0;
            renderCards([], false);
          }
          showOrHideLoadMore(false);
        }
      }).fail(function() {
        if (!append) {
          allDocuments = [];
          matchingTotal = 0;
          renderCards([], false);
        }
        showOrHideLoadMore(false);
        if (typeof Drupal !== 'undefined' && Drupal.Message) {
          var messages = new Drupal.Message();
          messages.add(Drupal.t('Sorry, something went wrong.'), { type: 'error' });
        } else {
          alert(Drupal.t('Sorry, something went wrong.'));
        }
      });
    }

    $container.find('.document-library-v2__filter-group-toggle').on('click', function() {
      var $group = $(this).closest('.document-library-v2__filter-group');
      $group.toggleClass('is-collapsed');
      $(this).attr('aria-expanded', $group.hasClass('is-collapsed') ? 'false' : 'true');
    }).on('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $(this).click();
      }
    });

    $container.find('.document-library-v2__clear-filters').on('click', function() {
      $container.find('input[name="building_type"], input[name="product_type"], input[name="document_type"]').prop('checked', false);
      $container.find('input[name="filter_language"]').first().prop('checked', true);
      $container.find('#document-library-search').val('');
      currentSearchTerm = '';
      $container.find('.document-library-v2__sort-option').removeClass('is-active');
      $container.find('.document-library-v2__sort-option[data-sort="recent"]').addClass('is-active');
      currentSort = 'recent';
      nextOffset = 0;
      allDocuments = [];
      $container.find('.document-library-v2__results').empty();
      $container.find('.document-library-v2__load-more-wrap').empty();
      $container.find('.document-library-v2__instructions').removeClass('hidden').text(typeof Drupal !== 'undefined' && Drupal.t ? Drupal.t('Loading documentsâ¦') : 'Loading documentsâ¦');
      $container.find('.document-library-v2__no-results').addClass('hidden');
      fetchAndShow(0);
    });

    $container.find('input[name="building_type"]').on('change', function() {
      nextOffset = 0;
      fetchAndShow(0);
    });

    $container.find('input[name="product_type"]').on('change', function() {
      nextOffset = 0;
      fetchAndShow(0);
    });

    $container.find('input[name="document_type"]').on('change', function() {
      nextOffset = 0;
      fetchAndShow(0);
    });

    $container.find('input[name="filter_language"]').on('change', function() {
      nextOffset = 0;
      fetchAndShow(0);
    });

    $container.find('#document-library-search').on('keydown', function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        commitSearch();
      }
    });
    $container.find('.document-library-v2__search-submit').on('click', function() {
      commitSearch();
    });

    $container.find('.document-library-v2__sort-option').on('click', function() {
      var sort = $(this).data('sort');
      currentSort = sort;
      $container.find('.document-library-v2__sort-option').removeClass('is-active');
      $(this).addClass('is-active');
      nextOffset = 0;
      fetchAndShow(0);
    });

    fetchAndShow();

    // Hide only the innermost element(s) containing the old intro text, so we don't hide a parent that also contains the document library.
    var $oldIntro = $('body').find('p, div').filter(function() {
      var $el = $(this);
      if ($el.closest('.document-library-v2').length) return false;
      var text = $el.text().replace(/\s+/g, ' ').trim();
      return text.indexOf('Search below for product documents') >= 0 ||
             (text.indexOf("can't find what you need") >= 0 && text.indexOf('contact Rinnai') >= 0);
    });
    var $innermost = $oldIntro.filter(function() {
      var $descendants = $(this).find('*');
      var hasMatchDescendant = $descendants.filter(function() { return $oldIntro.is(this); }).length > 0;
      return !hasMatchDescendant;
    });
    $innermost.hide();
  }

  /**
   * Query the possible filter choices and document results and update the page.
   */
  function queryAndUpdate() {
    $('.progress-element').removeClass('hidden');
    $('.grey-box__instructions').addClass('hidden');
    $('.warranty-note').show();
    $toggleFilters.removeClass('hidden');

    var category = categorySelect.value;
    var series = seriesSelect.value;
    var model = productSelect.value;
    var url = '/document-query';

    if (category !== '') {
      url += '?category=' + category;

      if (series !== '') {
        url += '&series=' + series;
      }

      if (model !== '') {
        url += '&model=' + model;
      }
    }

    $.ajax({
      url: url,
      type: 'GET',
      contentType: 'application/json',
      async: true,
      success: function (data) {
        if (data.hasOwnProperty('series_options')) {
          updateSelectElement(seriesSelect, data.series_options, data.selected.series);
        }
        if (data.hasOwnProperty('model_options')) {
          updateSelectElement(productSelect, data.model_options, data.selected.model);
        }
        if (data.hasOwnProperty('documents')) {
          $('.library-filter').removeClass('hidden');

          updateDocuments(data.documents);
        }
      },
      error: function (data) {
        alert(Drupal.t('Sorry, something went wrong.'));
      },
      complete: function (data) {
        $('.progress-element').addClass('hidden');
      }
    });
  }
})(Drupal, drupalSettings, jQuery);
