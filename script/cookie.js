export function setCookie(name, value, minutes, path = "/", domain, secure, sameSite = "Lax") {
    let expires = "";
    if (minutes) {
        const date = new Date();
        date.setTime(date.getTime() + (minutes * 60  * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    let cookie = name + "=" + (value || "") + expires + "; path=" + path;
    if (domain) {
        cookie += "; domain=" + domain;
    }
    if (secure) {
        cookie += "; Secure";
    }
    if (sameSite) {
        cookie += "; SameSite=" + sameSite;
    }
    document.cookie = cookie;
}

export function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}