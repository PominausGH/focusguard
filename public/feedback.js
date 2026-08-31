(function () {
    'use strict';

    var WEBHOOK_URL = 'https://n8n.daintytrading.com/webhook/feedback-intake';

    var openBtn = document.getElementById('feedback-open-btn');
    var closeBtn = document.getElementById('feedback-close-btn');
    var overlay = document.getElementById('feedback-overlay');
    var form = document.getElementById('feedback-form');
    var submitBtn = document.getElementById('feedback-submit-btn');
    var statusEl = document.getElementById('feedback-status');
    var messageEl = document.getElementById('feedback-message');
    var emailEl = document.getElementById('feedback-email');
    var websiteEl = document.getElementById('feedback-website');

    if (!openBtn || !overlay || !form) {
        return;
    }

    function setStatus(text, kind) {
        statusEl.textContent = text || '';
        statusEl.classList.remove('is-error', 'is-success');
        if (kind) {
            statusEl.classList.add(kind);
        }
    }

    function openModal() {
        overlay.hidden = false;
        setStatus('');
        messageEl.focus();
        document.addEventListener('keydown', onKeydown);
    }

    function closeModal() {
        overlay.hidden = true;
        document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeModal();
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var message = messageEl.value.trim();
        if (!message) {
            setStatus('Please describe the issue before sending.', 'is-error');
            messageEl.focus();
            return;
        }

        // Honeypot: if this hidden field is filled, silently drop the submission
        // as if it succeeded, without hitting the webhook.
        if (websiteEl.value) {
            setStatus('Thanks for the feedback!', 'is-success');
            form.reset();
            setTimeout(closeModal, 1200);
            return;
        }

        submitBtn.disabled = true;
        setStatus('Sending...');

        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product: 'focusshield',
                message: message,
                email: emailEl.value.trim(),
                website: websiteEl.value,
                page: window.location.href
            })
        })
            .then(function (res) {
                if (!res.ok) {
                    throw new Error('Request failed with status ' + res.status);
                }
                return res.json().catch(function () {
                    return { ok: true };
                });
            })
            .then(function (data) {
                if (data && data.ok === false) {
                    throw new Error(data.error || 'Submission failed');
                }
                setStatus('Thanks! We got your feedback.', 'is-success');
                form.reset();
                setTimeout(closeModal, 1500);
            })
            .catch(function () {
                setStatus('Something went wrong. Please try again later.', 'is-error');
            })
            .finally(function () {
                submitBtn.disabled = false;
            });
    });
})();
