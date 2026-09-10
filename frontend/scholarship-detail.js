console.log('scholarship-detail.js script loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing scholarship detail page');

    const urlParams = new URLSearchParams(window.location.search);
    const scholarshipId = urlParams.get('id') || urlParams.get('scholarship_id');

    console.log('Scholarship ID:', scholarshipId);

    // no scholarship id — generic application form
    if (!scholarshipId) {
        console.log('No scholarship ID - showing generic form');
        const eligibilitySection = document.getElementById('eligibilitySection');
        const guideSection = document.getElementById('guideSection');
        const deadlineSection = document.getElementById('deadlineSection');

        if (eligibilitySection) eligibilitySection.style.display = 'none';
        if (guideSection) guideSection.style.display = 'none';
        if (deadlineSection) deadlineSection.style.display = 'none';

        const scholarshipTitle = document.getElementById('scholarshipTitle');
        if (scholarshipTitle) {
            scholarshipTitle.textContent = 'Scholarship Application';
        }
        const scholarshipAward = document.getElementById('scholarshipAward');
        if (scholarshipAward) {
            scholarshipAward.textContent = 'Apply for the KNS College Scholarship Programme 2026';
        }
        return;
    }

    // Load scholarship from API immediately
    console.log('Loading scholarship from API...');
    loadScholarship(scholarshipId);
});

function loadScholarship(scholarshipId) {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/api/scholarships/${scholarshipId}`;

    console.log('Fetching scholarship from:', url);

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'omit'
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(result => {
        console.log('API result:', result);
        if (result.success && result.scholarship) {
            console.log('Calling populateScholarshipDetails with:', result.scholarship);
            populateScholarshipDetails(result.scholarship);
        } else {
            console.warn('Scholarship not found in response');
            showDefaultContent();
        }
    })
    .catch(error => {
        console.error('Error loading scholarship:', error);
        showDefaultContent();
    });
}

function showDefaultContent() {
    console.log('Showing default content (API failed)');
    const scholarshipTitle = document.getElementById('scholarshipTitle');
    if (scholarshipTitle) {
        scholarshipTitle.textContent = 'Scholarship Application';
    }
    const scholarshipAward = document.getElementById('scholarshipAward');
    if (scholarshipAward) {
        scholarshipAward.textContent = 'Apply for the KNS College Scholarship Programme 2026';
    }

    const eligibilitySection = document.getElementById('eligibilitySection');
    const deadlineSection = document.getElementById('deadlineSection');

    if (eligibilitySection) eligibilitySection.style.display = 'none';
    if (deadlineSection) deadlineSection.style.display = 'none';
}

function populateScholarshipDetails(scholarship) {
    console.log('Populating scholarship details:', scholarship);

    const titleElement = document.getElementById('scholarshipTitle');
    if (titleElement) {
        titleElement.textContent = scholarship.title;
    }

    const awardElement = document.getElementById('scholarshipAward');
    if (awardElement) {
        const cleanedAwardSummary = removePercentagesFromText(scholarship.award_summary);
        awardElement.textContent = cleanedAwardSummary;
    }

    document.title = `${scholarship.title} - Scholarships - KNS College`;

    const eligibilityContent = document.getElementById('eligibilityContent');
    if (eligibilityContent && scholarship.eligibility && scholarship.eligibility.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'content-list eligibility-list';
        scholarship.eligibility.forEach(req => {
            const li = document.createElement('li');
            if (typeof req === 'object' && req.requirement) {
                li.textContent = req.requirement;
            } else {
                li.textContent = req;
            }
            ul.appendChild(li);
        });
        eligibilityContent.innerHTML = '';
        eligibilityContent.appendChild(ul);
    }

    const deadlineDate = scholarship.deadline ? new Date(scholarship.deadline) : null;
    const deadlineElement = document.getElementById('deadlineDate');
    const countdownElement = document.getElementById('deadlineCountdown');

    console.log('Deadline date:', deadlineDate, 'isValid:', deadlineDate && !isNaN(deadlineDate.getTime()));

    if (deadlineDate && !isNaN(deadlineDate.getTime())) {
        const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        console.log('Formatted deadline:', formattedDeadline);

        if (deadlineElement) {
            deadlineElement.innerHTML = `<span class="deadline-highlight">${formattedDeadline}</span>`;
            console.log('Set deadline element');
        } else {
            console.error('deadlineDate element not found');
        }

        if (countdownElement) {
            console.log('Starting countdown');
            function formatTimePart(value, label) {
                return `${value} ${label}${value === 1 ? '' : 's'}`;
            }

            function updateCountdown() {
                const now = new Date();
                const diffMs = deadlineDate.getTime() - now.getTime();

                if (diffMs <= 0) {
                    countdownElement.textContent = 'The application deadline has passed.';
                    countdownElement.classList.add('deadline-passed');
                    return;
                }

                const totalSeconds = Math.floor(diffMs / 1000);
                const days = Math.floor(totalSeconds / (24 * 60 * 60));
                const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
                const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
                const seconds = totalSeconds % 60;

                const parts = [];
                if (days > 0) parts.push(formatTimePart(days, 'day'));
                if (hours > 0 || days > 0) parts.push(formatTimePart(hours, 'hour'));
                if (minutes > 0 || hours > 0 || days > 0) parts.push(formatTimePart(minutes, 'minute'));
                parts.push(formatTimePart(seconds, 'second'));

                countdownElement.textContent = `Time remaining: ${parts.join(', ')}`;
            }

            updateCountdown();
            setInterval(updateCountdown, 1000);
        } else {
            console.error('deadlineCountdown element not found');
        }
    } else {
        console.error('Invalid deadline date');
        if (deadlineElement) {
            deadlineElement.textContent = 'Deadline information will be updated soon.';
        }
        if (countdownElement) {
            countdownElement.textContent = '';
        }
    }

    const scholarshipIdInput = document.getElementById('scholarship_id');
    if (scholarshipIdInput) {
        scholarshipIdInput.value = scholarship.id;
    }

    const formDeadlineText = document.getElementById('formDeadlineText');
    if (formDeadlineText && deadlineDate && !isNaN(deadlineDate.getTime())) {
        const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        formDeadlineText.textContent = formattedDeadline;
    }

    // Apply Now scrolls down to the form
    const applyNowButton = document.getElementById('applyNowButton');
    if (applyNowButton) {
        applyNowButton.href = '#applicationFormSection';
        applyNowButton.addEventListener('click', function(e) {
            e.preventDefault();
            const formSection = document.getElementById('applicationFormSection');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
}

function getApiBaseUrl() {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';

    if (isLocalhost) {
        return 'http://localhost:3000';
    }

    return window.location.origin;
}
    
function getFileNameFromUrl(url, fileType) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const fileName = pathname.split('/').pop();
        if (fileName && fileName.includes('.')) {
            return fileName;
        }
    } catch (e) {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.includes('.')) {
            return lastPart;
        }
    }
    return `${fileType.toLowerCase()}-${Date.now()}.pdf`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const mainContent = document.querySelector('.content-main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-message">
                <h2 class="content-heading">Error</h2>
                <p class="content-text">${escapeHtml(message)}</p>
            </div>
        `;
    }
}

function removePercentagesFromText(text) {
    if (!text) return text;
    
    let cleaned = text;
    
    // strip % figures from award copy — client request
    cleaned = cleaned
        .replace(/Fully funded and \d+% discount on tuition fees/gi, 'Fully funded and partial funding on tuition fees')
        .replace(/fully funded and \d+% discount on tuition fees/gi, 'Fully funded and partial funding on tuition fees')
        .replace(/\d+% discount on tuition fees/gi, 'partial funding on tuition fees')
        .replace(/100%\s*(of tuition fees|tuition fee coverage|coverage)/gi, 'fully funded')
        .replace(/(Minimum\s+)?\d+% tuition fee discount/gi, 'partial funding')
        .replace(/Covers \d+% of tuition fees/gi, 'Fully funded')
        .replace(/\d+%\s*discount/gi, 'partial funding')
        .replace(/\d+%\s*coverage/gi, 'fully funded')
        .replace(/\b\d+%\b/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s+and\s+/gi, ' and ')
        .trim();
    
    return cleaned;
}

function getApiBaseUrl() {
    if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.API_BASE_URL) {
        return CONFIG.API_BASE_URL;
    }
    
    // local dev — API on :3000
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
    
    if (isLocalhost) {
        return 'http://localhost:3000';
    }
    
    return window.location.origin;
}
