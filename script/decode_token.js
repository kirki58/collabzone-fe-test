import { getCookie } from './cookie.js';

export async function GetDecodedToken(){
    const token = getCookie("token");

    return await fetch("https://localhost:7217/api/users/get-decoded-token", {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + token
        }
    })
    .then(response => {
        if(response.ok){
            return response.json();
        }
        else{
            throw new Error("Failed to validate token");
        }
    })
    .then(data => {
        return data
    })
    .catch(error => {
        console.error(error);
    })
}