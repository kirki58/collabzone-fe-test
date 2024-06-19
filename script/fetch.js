document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    const name = formData.get('registerName');

    const regex = new RegExp("^[a-zA-Z0-9_-]+$")
    if(name.length < 3 || name.length > 20 || !regex.test(name)){
        document.getElementById('register_error').innerHTML = "- Name must be between 3 and 20 characters long and can only contain letters, numbers, _ and -";
        return;
    }

    fetchRegisterForm(formData);
});

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    fetchLoginForm(formData);
})


function fetchLoginForm(formData){
    var button = document.getElementById('login_button');
    var color = button.style.backgroundColor;
    button.disabled = true;
    button.style.backgroundColor = "grey";
    button.style.cursor = "not-allowed";
    button.innerHTML = "Loading...";
    fetch("https://localhost:7217/api/users/login", {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if(!response.ok){
            throw response;
        }
        return response.text();
    })
    .then(data => {
        setCookie("token", data, 24 * 60, "/")
        window.location.href = "http://localhost:5500/home.html";
    })
    .catch(error => {
        button.disabled = false;
        button.style.backgroundColor = color;
        button.style.cursor = "pointer";
        button.innerHTML = "Sign In";
        
        if(error.status === 401 || error.status === 404){
            document.getElementById('login_error').innerHTML = "- Invalid e-mail or password!";
        }
        else{
            document.getElementById('login_error').innerHTML = "- Something went wrong!";
        }
    });

}

function fetchRegisterForm(formData){
    var button = document.getElementById('register_button');
    var color = button.style.backgroundColor;
    button.disabled = true;
    button.style.backgroundColor = "grey";
    button.style.cursor = "not-allowed";
    button.innerHTML = "Loading...";
    fetch("https://localhost:7217/api/users", {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if(!response.ok){
            return response.json().then(errorData => {
                switch (errorData){
                    case 0:
                        throw new CustomError("- All fields are required!");
                    case 1:
                        throw new CustomError("- Passwords do not match!");
                    case 2:
                        throw new CustomError("- E-mail already in use!");
                    case 3:
                        throw new CustomError("- Name already in use!");
                    default:
                        throw new CustomError("- Something went wrong!");
                }
            })
        }
        return response.json();
    })
    .then(data => {
        setCookie('name', formData.get('registerName'), 5);
        setCookie('email', formData.get('registerEmail'), 5);
        setCookie('password', data.hash , 5);

        document.body.innerHTML = `
        <div class="parent">
                <div class="logo"><p>CollabZone</p></div>
                <div class="text">
                    <p>Almost done, please check your latest mails to verify your e-mail address</p>
                </div>
                <div class="checkmark">
                    <div class="wrapper">
                    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                        viewBox="0 0 98.5 98.5" enable-background="new 0 0 98.5 98.5" xml:space="preserve">
                        <path class="checkmark" fill="none" stroke-width="8" stroke-miterlimit="10" d="M81.7,17.8C73.5,9.3,62,4,49.2,4
                        C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3"/>
                    </svg>
                    </div>
                </div> 
        </div>
        <script src="fetch.js"></script>
        `;
    })
    .catch(error => {
        button.disabled = false;
        button.style.backgroundColor = color;
        button.style.cursor = "pointer";
        button.innerHTML = "Sign Up";
        if(error instanceof CustomError){
            document.getElementById('register_error').innerHTML = error.message;
        }
        else{
            document.getElementById('register_error').innerHTML = "- Something went wrong!";
        }
    });
}

function setCookie(name, value, minutes, path = "/", domain, secure, sameSite = "Lax") {
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

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

class CustomError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

function redirect_validated(){
    if(getCookie("token") != null ){
        fetch("https://localhost:7217/api/users/is-valid-token", {
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + getCookie("token")
            }
        })
        .then(response => {
            if(response.ok){
                window.location.href = "http://localhost:5500/home.html";
            }
            return response.json();
        })
    }
}

window.addEventListener('load', redirect_validated);