(function () {
    var cookieNotice = document.getElementById('cookieNotice');
    if (!cookieNotice) return;

    function updateCookieNoticeSpacing() {
        if (cookieNotice.classList.contains('hidden')) {
            document.body.style.paddingBottom = '';
        } else {
            document.body.style.paddingBottom = cookieNotice.offsetHeight + 'px';
        }
    }

    if (localStorage.getItem('fs-cookie-ack')) {
        cookieNotice.classList.add('hidden');
    } else {
        updateCookieNoticeSpacing();
        window.addEventListener('resize', updateCookieNoticeSpacing);
    }

    document.getElementById('cookieAck').addEventListener('click', function () {
        cookieNotice.classList.add('hidden');
        localStorage.setItem('fs-cookie-ack', '1');
        updateCookieNoticeSpacing();
        window.removeEventListener('resize', updateCookieNoticeSpacing);
    });
})();
