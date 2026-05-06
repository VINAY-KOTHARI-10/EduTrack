// Authentication check
(function() {
    const token = localStorage.getItem('token');
    const path = window.location.pathname;
    const isAuthPage = path.includes('login.html') || path.includes('register.html');

    if (!token && !isAuthPage) {
        window.location.href = 'login.html';
        return;
    }

    if (token && isAuthPage) {
        window.location.href = 'index.html';
        return;
    }

    // Update UI if logged in
    document.addEventListener('DOMContentLoaded', () => {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            
            // Update Sidebar user info if elements exist
            const userNameEl = document.querySelector('.user-name');
            const userRoleEl = document.querySelector('.user-role');
            const userAvatarEl = document.querySelector('.user-avatar');
            
            if (userNameEl) userNameEl.textContent = user.username;
            if (userRoleEl) userRoleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            if (userAvatarEl) userAvatarEl.textContent = user.username.charAt(0).toUpperCase();

            // Add Logout Button to Sidebar Footer
            const sidebarFooter = document.querySelector('.sidebar-footer');
            if (sidebarFooter && !document.getElementById('logoutBtn')) {
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'logoutBtn';
                logoutBtn.className = 'btn-ghost';
                logoutBtn.style.marginTop = '12px';
                logoutBtn.style.width = '100%';
                logoutBtn.style.textAlign = 'left';
                logoutBtn.innerHTML = '<span>Logout</span>';
                logoutBtn.onclick = () => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                };
                sidebarFooter.appendChild(logoutBtn);
            }
        }
    });
})();

// Helper for API calls with Auth
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }

    return response;
}
