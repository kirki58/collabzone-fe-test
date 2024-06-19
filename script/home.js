import { redirect_unvalidated } from './redirect_unvalidated.js';
import { getCookie } from './cookie.js';
import { setCookie } from './cookie.js';
import { GetDecodedToken } from './decode_token.js';
import { CustomError } from './custom_error.js';

window.addEventListener('load', redirect_unvalidated);


$(document).ready(function() {
    var modal = $("#modal");
    var opener = $("#profileBtn");
    var closer = $("#closeBtn");

    opener.click(async function() {
        var user = await GetDecodedToken();
        if(user == null){
            return;
        }
        modal.find("#userName").text(user.name);
        modal.css("display", "block");
    })
    closer.click(function() {
        document.getElementById("nameForm").style.display = "none";
        document.getElementById("nameError").innerHTML = "";
        document.getElementById("passwordForm").style.display = "none";
        document.getElementById("passwordError").innerHTML = "";
        document.getElementById("imageForm").style.display = "none";
        modal.css("display", "none");
    })
});

document.getElementById("imgSelectorBtn").addEventListener("click", function() {
    document.getElementById("imageForm").style.display = "block";
    document.getElementById("imgSelectorInput").click();
})

document.getElementById('EditNameBtn').addEventListener('click', function() {
    document.getElementById('nameForm').style.display = 'block';
})
document.getElementById('ChangePasswordBtn').addEventListener('click', function() {
    document.getElementById('passwordForm').style.display = 'block';
})

document.getElementById('nameForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    var name = document.getElementById('newName').value;
    const regex = new RegExp("^[a-zA-Z0-9_-]+$");
    if(name.length < 3 || name.length > 20 || !regex.test(name)){
        document.getElementById('nameError').innerHTML = "- Name input invalid!";
        return;
    }

    var token = getCookie("token");
    if(token == null){
        return;
    }

    try{
        var user = await GetDecodedToken();
        var user_id = user.sub;
    }
    catch{
        throw new Error("Failed to get user id");
    }
    
    await fetch("https://localhost:7217/api/users/" + user_id, {
        method: 'PUT',
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Name: document.getElementById('newName').value,
            Email: null,
            Password_hash: null
        })
    })
    .then(response => {
        if(!response.ok){
            throw new Error("Failed to update user");
        }
        return response.text();
    })
    .then(data => {
        setCookie("token", data, "/");
        window.location.reload();
    })
    .catch(error => {
        document.getElementById("nameError").innerHTML = "- Failed to update name!";
        console.error(error);
    })
})

document.getElementById('passwordForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    var old_password = document.getElementById('old_password').value;
    var new_password = document.getElementById('new_password').value;
    var confirm_password = document.getElementById('confirm_password').value;

    var token = getCookie("token");
    if(token == null){
        window.location.href = "http://localhost:5500/login.html";
        return;
    }

    var user = await GetDecodedToken();
    if(user == null){
        window.location.href = "http://localhost:5500/login.html";
        return;
    }
    var user_id = user.sub;

    if(new_password != confirm_password){
        document.getElementById('passwordError').innerHTML = "- Passwords do not match!";
        return;
    }
    
    await fetch("https://localhost:7217/api/users/update-password/" + user_id, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + getCookie("token"),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Old_password: old_password,
            New_password: new_password
        })
    })
    .then(response => {
        if(response.status === 401){
            throw new CustomError("Incorrect password");
        }
        if(!response.ok){
            throw new CustomError("Failed to update password");
        }
        return response.text();
    })
    .then(data => {
        setCookie("token", data, "/");
        window.location.reload();
    })
    .catch(error => {
        if(error instanceof CustomError){
            document.getElementById('passwordError').innerHTML = "-" + error.message;
        }
        else{
            document.getElementById('passwordError').innerHTML = "- Failed to update password!";
            console.error(error);
        }
    });
})