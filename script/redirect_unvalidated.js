import { getCookie } from './cookie.js';

export async function redirect_unvalidated(){
    if(getCookie("token") == null){
        window.location.href = "http://localhost:5500/index.html";
    }
    else{
        await fetch("https://localhost:7217/api/users/is-valid-token", {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + getCookie("token")
            }
        })
        .then(response => {
            if(!response.ok){
                throw response;
            }
            return response.text();
        })
        .catch(error => {
            window.location.href = "http://localhost:5500/index.html";
        });
    }
}

// window.addEventListener('load', redirect_unvalidated);