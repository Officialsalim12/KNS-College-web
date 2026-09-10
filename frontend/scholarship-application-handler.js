document.addEventListener('DOMContentLoaded', function () {
    console.log('Scholarship application handler loaded');

    const form = document.getElementById('scholarshipApplicationForm');
    const personalStatement = document.getElementById('personal_statement');
    const wordCountElement = document.getElementById('word_count');
    const previousApplication = document.getElementById('previous_application');
    const previousApplicationDetailsGroup = document.getElementById('previous_application_details_group');
    const previousApplicationDetails = document.getElementById('previous_application_details');

    console.log('Form element:', form);
    console.log('Personal statement:', personalStatement);

    if (!form) {
        console.error('Scholarship application form not found');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const scholarshipId = urlParams.get('scholarship_id') || urlParams.get('id');
    if (scholarshipId) {
        const scholarshipIdField = document.getElementById('scholarship_id');
        if (scholarshipIdField) {
            scholarshipIdField.value = scholarshipId;
        }
    }

    if (personalStatement && wordCountElement) {
        function updateWordCount() {
            const text = personalStatement.value.trim();
            const words = text ? text.split(/\s+/).filter((word) => word.length > 0) : [];
            const wordCount = words.length;
            wordCountElement.textContent = wordCount;

            if (wordCount < 300) {
                wordCountElement.style.color = 'var(--error-color)';
                personalStatement.setCustomValidity(
                    `Personal statement must be at least 300 words. Currently: ${wordCount} words.`
                );
            } else {
                wordCountElement.style.color = 'var(--success-color)';
                personalStatement.setCustomValidity('');
            }
        }

        personalStatement.addEventListener('input', updateWordCount);
        personalStatement.addEventListener('paste', function () {
            setTimeout(updateWordCount, 10);
        });
        updateWordCount();
    }

    if (previousApplication && previousApplicationDetailsGroup) {
        previousApplication.addEventListener('change', function () {
            if (this.value === 'Yes') {
                previousApplicationDetailsGroup.style.display = 'block';
                previousApplicationDetails.required = true;
            } else {
                previousApplicationDetailsGroup.style.display = 'none';
                previousApplicationDetails.required = false;
                previousApplicationDetails.value = '';
            }
        });
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('Form submission started');

        if (!personalStatement) {
            showFormMessage('error', 'Personal statement field not found. Please refresh the page and try again.');
            return;
        }

        const words = personalStatement.value.trim()
            ? personalStatement.value.trim().split(/\s+/).filter((word) => word.length > 0)
            : [];

        console.log('Word count:', words.length);

        if (words.length < 300) {
            showFormMessage('error', `Personal statement must be at least 300 words. Currently: ${words.length} words.`);
            personalStatement.focus();
            return;
        }

        const declaration = document.getElementById('declaration');
        if (!declaration || !declaration.checked) {
            showFormMessage('error', 'You must accept the declaration to submit your application.');
            if (declaration) declaration.focus();
            return;
        }

        const submitBtn = form.querySelector('.submit-btn');
        if (!submitBtn) {
            showFormMessage('error', 'Submit button not found. Please refresh the page and try again.');
            return;
        }

        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            // Use localhost when on localhost, otherwise use production API
            let apiBaseUrl;
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                apiBaseUrl = 'http://localhost:3000';
            } else {
                apiBaseUrl =
                    typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL
                        ? CONFIG.API_BASE_URL
                        : 'http://localhost:3000';
            }

            const endpoint =
                typeof CONFIG !== 'undefined' && CONFIG.ENDPOINTS && CONFIG.ENDPOINTS.SCHOLARSHIP_APPLICATIONS
                    ? CONFIG.ENDPOINTS.SCHOLARSHIP_APPLICATIONS
                    : '/api/scholarship-applications';

            console.log('API Base URL:', apiBaseUrl);
            console.log('Endpoint:', endpoint);

            const nationalIdValue = document.getElementById('national_id').value.trim();
            if (!nationalIdValue) {
                showFormMessage('error', 'National ID Number is required.');
                return;
            }

            // multipart/form-data so the optional document fields ride along with
            // the text fields in one request — do NOT set a Content-Type header
            // manually, the browser sets the multipart boundary for us.
            const formData = new FormData();
            const setField = (name, value) => formData.set(name, value == null ? '' : value);

            setField('scholarship_id', document.getElementById('scholarship_id').value || '');
            setField('surname', document.getElementById('surname').value);
            setField('first_name', document.getElementById('first_name').value);
            setField('other_names', document.getElementById('other_names').value || '');
            setField('gender', document.getElementById('gender').value);
            setField('date_of_birth', document.getElementById('date_of_birth').value);
            setField('nationality', document.getElementById('nationality').value);
            setField('national_id', nationalIdValue);
            setField('address', document.getElementById('address').value);
            setField('city', document.getElementById('city').value);
            setField('phone', document.getElementById('phone').value);
            setField('email', document.getElementById('email').value);
            setField('highest_qualification', document.getElementById('highest_qualification').value);
            setField('school_institution', document.getElementById('school_institution').value);
            setField('year_of_completion', document.getElementById('year_of_completion').value);
            setField('credits', document.getElementById('credits').value || '');
            setField('programme', document.getElementById('programme').value);
            setField('scholarship_type', document.getElementById('scholarship_type').value);
            setField('previous_application', document.getElementById('previous_application').value);
            setField(
                'previous_application_details',
                document.getElementById('previous_application_details').value || ''
            );
            setField('personal_statement', document.getElementById('personal_statement').value);
            setField('declaration', document.getElementById('declaration').checked ? 'on' : '');

            // Log all field values for debugging
            console.log('Form field values:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}: ${value}`);
            }

            ['id_document', 'academic_certificate', 'cv'].forEach((fieldName) => {
                const input = document.getElementById(fieldName);
                if (input && input.files && input.files[0]) {
                    formData.set(fieldName, input.files[0]);
                    console.log(`  ${fieldName}: file attached`);
                }
            });

            const fullUrl = `${apiBaseUrl}${endpoint}`;
            console.log('Submitting to:', fullUrl);

            const response = await fetch(fullUrl, {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                let errorText = 'Failed to submit application';
                try {
                    const errorData = await response.json();
                    errorText = errorData.error || errorData.message || errorText;
                    if (errorData.details) {
                        errorText += `. ${errorData.details}`;
                    }
                } catch (ignore) {
                    errorText = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorText);
            }

            const result = await response.json();
            console.log('API result:', result);

            if (result.success) {
                const docErrors = result.documents && result.documents.errors;
                const successMsg =
                    docErrors && docErrors.length
                        ? 'Thank you for your scholarship application! It was submitted successfully, but one or more documents could not be uploaded — you can bring those to the office instead.'
                        : 'Thank you for your scholarship application! Your application has been submitted successfully. We will review your application and contact you soon.';
                showFormMessage('success', successMsg);
                form.reset();
                if (wordCountElement) wordCountElement.textContent = '0';
                if (previousApplicationDetailsGroup) previousApplicationDetailsGroup.style.display = 'none';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error(result.error || result.message || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            const errorMessage = error.message || String(error);
            const isNetwork =
                error.name === 'TypeError' ||
                /Failed to fetch|NetworkError|ECONNREFUSED|ERR_CONNECTION_REFUSED/i.test(errorMessage);

            if (errorMessage.includes('Backend API not configured')) {
                showFormMessage(
                    'error',
                    errorMessage + ' For now, contact admissions@kns.edu.sl or +232 79 422 442.'
                );
            } else if (isNetwork) {
                showFormMessage(
                    'error',
                    'Cannot reach the server right now. Try again later or call +232 79 422 442.'
                );
            } else if (errorMessage.includes('404')) {
                showFormMessage('error', 'Application endpoint not found (404). Contact +232 79 422 442.');
            } else if (errorMessage.trim()) {
                showFormMessage('error', errorMessage);
            } else {
                showFormMessage(
                    'error',
                    'Something went wrong submitting your application. Call +232 79 422 442 if it keeps happening.'
                );
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    function showFormMessage(type, message) {
        const existingMessage = document.querySelector('.scholarship-form-message');
        if (existingMessage) existingMessage.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `scholarship-form-message scholarship-form-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.padding = '15px';
        messageDiv.style.marginBottom = '20px';
        messageDiv.style.borderRadius = '4px';
        messageDiv.style.fontWeight = '500';

        if (type === 'error') {
            messageDiv.style.backgroundColor = '#fee';
            messageDiv.style.color = '#c33';
            messageDiv.style.border = '1px solid #fcc';
        } else if (type === 'success') {
            messageDiv.style.backgroundColor = '#efe';
            messageDiv.style.color = '#3c3';
            messageDiv.style.border = '1px solid #cfc';
        }

        const targetForm = document.getElementById('scholarshipApplicationForm');
        if (targetForm && targetForm.parentElement) {
            targetForm.parentElement.insertBefore(messageDiv, targetForm);
        } else {
            const container = document.querySelector('.content-section .container');
            if (container) {
                container.insertBefore(messageDiv, container.firstChild);
            } else {
                document.body.insertBefore(messageDiv, document.body.firstChild);
            }
        }

        setTimeout(() => {
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.opacity = '0';
                messageDiv.style.transition = 'opacity 0.3s';
                setTimeout(() => messageDiv.remove(), 300);
            }, 10000);
        }
    }
});
