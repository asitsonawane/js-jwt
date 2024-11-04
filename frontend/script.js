function base64UrlDecode(str) {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    try {
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function isTokenExpired(token) {
    const payload = token.split('.')[1];
    const decodedPayload = base64UrlDecode(payload);

    if (decodedPayload && decodedPayload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime > decodedPayload.exp;
    }
    return true; // Consider expired if no exp claim is found
}

document.getElementById('generateToken').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    if (!username) {
        alert('Please enter a username');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await response.json();

        if (data.token) {
            localStorage.setItem('jwtToken', data.token);
            document.getElementById('output').textContent = `Token stored successfully: ${data.token}`;
        } else {
            document.getElementById('output').textContent = 'Failed to generate token';
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById('validateToken').addEventListener('click', () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        document.getElementById('output').textContent = 'No token found in localStorage';
        return;
    }

    if (isTokenExpired(token)) {
        document.getElementById('output').textContent = 'Token has expired';
    } else {
        document.getElementById('output').textContent = 'Token is still valid';
    }
});
