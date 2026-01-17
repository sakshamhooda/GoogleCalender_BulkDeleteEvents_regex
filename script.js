(() => {
  const ADVANCED_MODE = false;

  const logger = {
    info: (message, data = null) => {
      const timestamp = new Date().toISOString();
      console.log(`[INFO ${timestamp}] ${message}`, data || '');
    },
    warn: (message, data = null) => {
      const timestamp = new Date().toISOString();
      console.warn(`[WARN ${timestamp}] ${message}`, data || '');
    },
    error: (message, error = null) => {
      const timestamp = new Date().toISOString();
      console.error(`[ERROR ${timestamp}] ${message}`, error || '');
    },
    success: (message, data = null) => {
      const timestamp = new Date().toISOString();
      console.log(`[SUCCESS ${timestamp}] ${message}`, data || '');
    }
  };

  const getAndValidateInput = (key, message, defaultValue, advancedMode) => {
    if (advancedMode !== true) {
      return defaultValue;
    }
    const result = prompt(message, defaultValue);

    if (!result) {
      logger.warn('User cancelled input dialog or provided null value');
      alert(`No value for ${key} provided. Operation cancelled.`);
      return null;
    }

    if (result.trim() === '') {
      logger.warn('User provided empty string after trimming');
      alert(`Value for ${key} cannot be empty. Operation cancelled.`);
      return null;
    }

    const trimmedSearch = result.trim();
    logger.info(`Value for ${key} collected`, { string: result, length: result.length });

    return result;
  };

  const reoccurringDialogSelector = 'span.uW2Fw-k2Wrsb-fmcmS[jsname="MdSI6d"]';
  const reoccurringDialogOkButtonSelector = '[data-mdc-dialog-action="ok"]';

  let nextPageLabel, deleteEventButtonLabel, deleteTaskButtonLabel, deleteReoccurringEventLabel,
    deleteReoccurringTaskLabel, maxPages;

  // Validate regex pattern
  const validateRegex = (pattern, flags) => {
    try {
      new RegExp(pattern, flags);
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  };

  const getUserInput = () => {
    logger.info('Starting user input collection');

    try {
      nextPageLabel = getAndValidateInput('nextPageLabel', "Next page label", 'Next month', ADVANCED_MODE);
      deleteEventButtonLabel = getAndValidateInput('deleteEventButtonLabel', "Delete event label", 'Delete event', ADVANCED_MODE);
      deleteTaskButtonLabel = getAndValidateInput('deleteTaskButtonLabel', "Delete task label", 'Delete task', ADVANCED_MODE);
      deleteReoccurringEventLabel = getAndValidateInput('deleteReoccurringEventLabel', "Delete reoccurring event label", 'Delete repeating event', ADVANCED_MODE);
      deleteReoccurringTaskLabel = getAndValidateInput('deleteReoccurringTaskLabel', "Delete reoccurring task label", 'Delete recurring task', ADVANCED_MODE);
      maxPages = getAndValidateInput('maxPages', "Max months to process", 12, true);

      // Get regex pattern
      const regexPattern = getAndValidateInput(
        'regexPattern',
        "Enter the regex pattern to match calendar events (e.g., 'Meeting.*2024' or 'Standup|Sync')",
        "",
        true
      );

      if (!regexPattern) {
        return null;
      }

      // Get regex flags
      const regexFlags = getAndValidateInput(
        'regexFlags',
        "Enter regex flags (i = case-insensitive, g = global, m = multiline). Leave empty for default.",
        "i",
        true
      );

      if (regexFlags === null) {
        return null;
      }

      // Validate the regex
      const validation = validateRegex(regexPattern, regexFlags || '');
      if (!validation.valid) {
        logger.error('Invalid regex pattern', { pattern: regexPattern, flags: regexFlags, error: validation.error });
        alert(`Invalid regex pattern: ${validation.error}\n\nPlease try again with a valid pattern.`);
        return null;
      }

      const regex = new RegExp(regexPattern, regexFlags || '');
      logger.info('Regex compiled successfully', { pattern: regexPattern, flags: regexFlags });

      // Show example matches for confirmation
      const exampleMatches = [];
      const allSpans = document.querySelectorAll('span');
      let sampleCount = 0;
      for (const span of allSpans) {
        if (span.textContent && regex.test(span.textContent) && span.textContent.trim().length > 0) {
          exampleMatches.push(span.textContent.trim().substring(0, 50));
          sampleCount++;
          if (sampleCount >= 5) break;
        }
      }

      let confirmMessage = `Are you sure you want to delete ALL events matching the regex:\n\n` +
        `Pattern: /${regexPattern}/${regexFlags || ''}\n\n`;

      if (exampleMatches.length > 0) {
        confirmMessage += `Sample matches found on current page:\n${exampleMatches.map(m => `  - "${m}"`).join('\n')}\n\n`;
      } else {
        confirmMessage += `(No matches found on current page - they may exist on other pages)\n\n`;
      }

      confirmMessage += "This action cannot be undone. The script will:\n" +
        `1. Search through up to ${maxPages} pages of your calendar\n` +
        "2. Delete every event that matches the pattern\n" +
        "3. Continue until all matching events are removed\n\n" +
        "Click OK to proceed or Cancel to abort.";

      const confirmation = confirm(confirmMessage);

      if (!confirmation) {
        logger.info('User declined confirmation dialog');
        return null;
      }

      logger.success('User input validated and confirmed', { pattern: regexPattern, flags: regexFlags });
      return { pattern: regexPattern, flags: regexFlags || '', regex };

    } catch (error) {
      logger.error('Error during user input collection', error);
      alert('An error occurred while collecting input. Please try again.');
      return null;
    }
  };

  const waitForElement = (selector, timeout = 5000, retryInterval = 100) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkElement = () => {
        try {
          const element = document.querySelector(selector);
          if (element) {
            logger.info('Element found', { selector, timeWaited: Date.now() - startTime });
            resolve(element);
            return;
          }

          if (Date.now() - startTime >= timeout) {
            logger.warn('Element not found within timeout', { selector, timeout });
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            return;
          }

          setTimeout(checkElement, retryInterval);
        } catch (error) {
          logger.error('Error while waiting for element', { selector, error });
          reject(error);
        }
      };

      checkElement();
    });
  };

  // Modified to use regex matching instead of XPath contains
  const findMatchingEvents = (regexConfig) => {
    try {
      logger.info('Searching for matching events using regex', { pattern: regexConfig.pattern, flags: regexConfig.flags });

      const regex = regexConfig.regex;
      const allSpans = document.querySelectorAll('span');
      const matchingElements = [];

      for (const span of allSpans) {
        const text = span.textContent;
        if (text && regex.test(text)) {
          // Check if this span is likely a calendar event (has some content and is visible)
          const rect = span.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            matchingElements.push(span);
          }
        }
      }

      // Return an object that mimics the XPath snapshot interface
      const result = {
        snapshotLength: matchingElements.length,
        snapshotItem: (index) => matchingElements[index] || null,
        _elements: matchingElements
      };

      logger.info('Regex search completed', {
        pattern: regexConfig.pattern,
        matchCount: result.snapshotLength
      });

      return result;
    } catch (error) {
      logger.error('Error during regex search', { pattern: regexConfig.pattern, error });
      throw new Error(`Failed to search for events: ${error.message}`);
    }
  };

  const deleteEvent = async (eventElement, eventIndex, totalFound) => {
    try {
      const eventText = eventElement.textContent || 'Unknown event';
      logger.info('Attempting to delete event', {
        eventIndex: eventIndex + 1,
        totalFound,
        eventText: eventText.substring(0, 100) + (eventText.length > 100 ? '...' : '')
      });

      eventElement.click();
      logger.info('Event clicked, waiting for delete button');

      const deleteButton = await waitForElement(
        'button[aria-label="' + deleteEventButtonLabel + '"], button[aria-label="' + deleteTaskButtonLabel + '"]',
        3000
      );

      deleteButton.click();
      logger.info('Delete button clicked, checking for recurring event dialog');

      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const recurringDialog = document.querySelector(reoccurringDialogSelector);

            if (recurringDialog &&
              (recurringDialog.textContent.includes(deleteReoccurringEventLabel) ||
                recurringDialog.textContent.includes(deleteReoccurringTaskLabel))) {

              logger.info('Recurring event dialog detected');

              const okButton = await waitForElement(reoccurringDialogOkButtonSelector, 2000);
              okButton.click();

              logger.success('Recurring event deleted', { eventText });
              resolve(true);
            } else {
              logger.success('Regular event deleted', { eventText });
              resolve(true);
            }
          } catch (dialogError) {
            logger.error('Error handling deletion dialog', { eventText, error: dialogError });
            resolve(true);
          }
        }, 500);
      });

    } catch (error) {
      logger.error('Error deleting event', {
        eventIndex: eventIndex + 1,
        eventText: eventElement?.textContent || 'Unknown',
        error
      });
      throw error;
    }
  };

  const navigateToNextPage = async (currentPage) => {
    try {
      logger.info('Navigating to next page', { currentPage, nextPage: currentPage + 1 });

      const nextButton = await waitForElement('button[aria-label="' + nextPageLabel + '"]', 3000);
      nextButton.click();

      logger.info('Next button clicked, waiting for page load');

      await new Promise(resolve => setTimeout(resolve, 2000));

      logger.success('Navigation completed', { newPage: currentPage + 1 });
      return true;
    } catch (error) {
      logger.error('Error navigating to next page', { currentPage, error });
      return false;
    }
  };

  const processCalendarDeletion = async (regexConfig) => {
    let currentPage = 1;
    let totalDeleted = 0;
    let totalErrors = 0;
    const errors = [];

    logger.info('Starting calendar deletion process', {
      pattern: regexConfig.pattern,
      flags: regexConfig.flags,
      maxPages,
      startTime: new Date().toISOString()
    });

    const processPage = async () => {
      try {
        if (currentPage > maxPages) {
          logger.success('All pages processed', {
            totalPages: maxPages,
            totalDeleted,
            totalErrors,
            completionTime: new Date().toISOString()
          });

          let message = `Deletion complete!\nTotal events deleted: ${totalDeleted}`;
          if (totalErrors > 0) {
            message += `\nErrors encountered: ${totalErrors} (check console for details)`;
          }
          alert(message);
          return;
        }

        logger.info('Processing page', { currentPage, maxPages });

        const matchingSpans = findMatchingEvents(regexConfig);
        const matchCount = matchingSpans.snapshotLength;

        if (matchCount > 0) {
          logger.info('Found matching events on page', { currentPage, matchCount });

          try {
            const firstMatch = matchingSpans.snapshotItem(0);
            await deleteEvent(firstMatch, 0, matchCount);
            totalDeleted++;

            logger.success('Event deleted successfully', {
              currentPage,
              totalDeleted,
              remainingOnPage: matchCount - 1
            });

            setTimeout(() => processPage(), 800);

          } catch (deleteError) {
            totalErrors++;
            errors.push({
              page: currentPage,
              error: deleteError.message,
              timestamp: new Date().toISOString()
            });

            logger.error('Failed to delete event, continuing', {
              currentPage,
              totalErrors,
              error: deleteError
            });

            setTimeout(() => processPage(), 1500);
          }

        } else {
          logger.info('No matching events found on page', { currentPage });

          if (currentPage < maxPages) {
            const navigationSuccess = await navigateToNextPage(currentPage);

            if (navigationSuccess) {
              currentPage++;
              setTimeout(() => processPage(), 2000);
            } else {
              logger.error('Failed to navigate to next page, ending process', { currentPage });
              alert(`Process stopped due to navigation error on page ${currentPage}.\nTotal events deleted: ${totalDeleted}`);
            }
          } else {
            logger.success('Reached maximum pages', { maxPages, totalDeleted, totalErrors });

            let message = `Process complete! Processed ${maxPages} pages.\nTotal events deleted: ${totalDeleted}`;
            if (totalErrors > 0) {
              message += `\nErrors encountered: ${totalErrors} (check console for details)`;
            }
            alert(message);
          }
        }

      } catch (pageError) {
        totalErrors++;
        errors.push({
          page: currentPage,
          error: pageError.message,
          timestamp: new Date().toISOString()
        });

        logger.error('Error processing page', { currentPage, error: pageError });

        if (currentPage < maxPages) {
          logger.warn('Attempting to continue with next page after error');
          try {
            const navigationSuccess = await navigateToNextPage(currentPage);
            if (navigationSuccess) {
              currentPage++;
              setTimeout(() => processPage(), 3000);
            } else {
              logger.error('Cannot continue - navigation failed');
              alert(`Process stopped due to critical error on page ${currentPage}.\nTotal events deleted: ${totalDeleted}\nCheck console for error details.`);
            }
          } catch (navError) {
            logger.error('Critical error - cannot continue', navError);
            alert(`Critical error occurred. Process stopped.\nTotal events deleted: ${totalDeleted}\nCheck console for details.`);
          }
        } else {
          logger.error('Error on final page, ending process', { totalDeleted, totalErrors });
          alert(`Process completed with errors.\nTotal events deleted: ${totalDeleted}\nErrors: ${totalErrors}\nCheck console for details.`);
        }
      }
    };

    await processPage();
  };

  const main = async () => {
    try {
      logger.info('Calendar deletion script started (regex mode)');

      if (!window.location.hostname.includes('calendar.google.com')) {
        const warning = 'This script is designed for Google Calendar. Current page may not be supported.';
        logger.warn(warning);
        if (!confirm(warning + '\n\nDo you want to continue anyway?')) {
          logger.info('User chose not to continue on non-calendar page');
          return;
        }
      }

      const regexConfig = getUserInput();
      if (!regexConfig) {
        logger.info('Operation cancelled by user during input phase');
        return;
      }

      await processCalendarDeletion(regexConfig);

    } catch (error) {
      logger.error('Critical error in main execution', error);
      alert('A critical error occurred. Check the browser console for details.');
    }
  };

  main();
})();
