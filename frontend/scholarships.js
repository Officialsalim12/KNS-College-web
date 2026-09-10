// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing scholarships page');

    const scholarshipsGrid = document.getElementById('scholarshipsGrid');
    if (!scholarshipsGrid) {
        console.error('Scholarships grid element not found');
        return;
    }

    loadScholarships(scholarshipsGrid);
});

function loadScholarships(scholarshipsGrid) {
    console.log('Loading scholarships...');

    const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://kns-college-web.onrender.com';

    const fullUrl = `${apiBaseUrl}/api/scholarships`;
    console.log('Fetching from:', fullUrl);

    fetch(fullUrl, {
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
        if (!result.success) {
            throw new Error(result.error || 'API returned success: false');
        }

        if (!result.scholarships || result.scholarships.length === 0) {
            scholarshipsGrid.innerHTML = '<p class="content-text">No scholarships are currently available. Please check back later.</p>';
            return;
        }

        scholarshipsGrid.innerHTML = '';
        result.scholarships.forEach(scholarship => {
            scholarshipsGrid.appendChild(createScholarshipCard(scholarship));
        });
    })
    .catch(error => {
        console.error('Error loading scholarships:', error);
        scholarshipsGrid.innerHTML = `
            <div class="error-message">
                <p>Unable to load scholarships. Please try again later.</p>
                <p style="font-size: 0.9em; color: #666; margin-top: 0.5em;">Error: ${escapeHtml(error.message)}</p>
            </div>
        `;
    });
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

function createScholarshipCard(scholarship) {
    const card = document.createElement('div');
    card.className = 'scholarship-card';
    
    // Use deadline from database
    const deadlineDate = scholarship.deadline ? new Date(scholarship.deadline) : null;
    let formattedDeadline = 'Not specified';
    
    if (deadlineDate && !isNaN(deadlineDate.getTime())) {
        formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    const cleanedAwardSummary = removePercentagesFromText(scholarship.award_summary);
    
    card.innerHTML = `
        <div class="scholarship-card-header">
            <h3 class="scholarship-card-title">${escapeHtml(scholarship.title)}</h3>
        </div>
        <div class="scholarship-card-body">
            <div class="scholarship-award-summary">
                <p class="award-amount">${escapeHtml(cleanedAwardSummary)}</p>
            </div>
            <div class="scholarship-deadline">
                <strong>Deadline:</strong> ${formattedDeadline}
            </div>
        </div>
        <div class="scholarship-card-footer">
            <a href="scholarship-detail.html?id=${scholarship.id}" class="btn btn-primary btn-view-details">
                View Details
            </a>
        </div>
    `;
    
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

