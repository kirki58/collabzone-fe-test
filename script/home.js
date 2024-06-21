import { redirect_unvalidated } from './redirect_unvalidated.js';
import { getCookie } from './cookie.js';
import { setCookie } from './cookie.js';
import { GetDecodedToken } from './decode_token.js';
import { CustomError } from './custom_error.js';
import { deleteCookie } from './cookie.js';

window.addEventListener('load', redirect_unvalidated);
window.addEventListener('load', getProfileImage);


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
        window.location.href = "http://localhost:5500/index.html";
        return;
    }

    var user = await GetDecodedToken();
    if(user == null){
        window.location.href = "http://localhost:5500/index.html";
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

document.getElementById('imageForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    var token = getCookie("token");
    if(token == null){
        window.location.href = "http://localhost:5500/index.html";
        return;
    }

    const fileInput = document.getElementById('imgSelectorInput');

    if(fileInput.files.length == 0){
        alert("Please select an image");
        return;
    }

    const file = fileInput.files[0];
    const user = await GetDecodedToken();
    const user_id = user.sub;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('id', user_id);

    if(await doesImageExist() == false){
        await fetch("https://localhost:7217/api/images", {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        })
        .then(response => {
            if(!response.ok){
                throw new CustomError("Failed to upload image");
            }
            alert("Image uploaded successfully");
            window.location.reload();
        })
        .catch(error => {
            if(error instanceof CustomError){
                console.error(error.message);
            }
            else{
                console.error("Failed to upload image");
            }
        })
    }
    else{
        await fetch("https://localhost:7217/api/images/" + user_id, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        })
        .then(response => {
            if(!response.ok){
                throw new CustomError("Failed to update image");
            }
            alert("Image updated successfully");
            window.location.reload();
        })
        .catch(error => {
            if(error instanceof CustomError){
                console.error(error.message);
            }
            else{
                console.error("Failed to update image");
            }
        })
    }
})

async function getProfileImage(){
    var token = getCookie("token");
    if(token == null){
        window.location.href = "http://localhost:5500/index.html";
        return;
    }

    const user_id = (await GetDecodedToken()).sub;

    return await fetch("https://localhost:7217/api/images/" + user_id, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if(!response.ok){
            throw new CustomError("Failed to get image");
        }
        return response.blob();
    })
    .then(blob => {
        const url = URL.createObjectURL(blob);

        // Set the image sources here
        document.getElementById("profileImg").src = url;
    })
    .catch(error => {
        if(error instanceof CustomError){
            console.error(error.message);
        }
        else{
            console.error("Failed to get image");
        }
    })

}

async function doesImageExist(){
    var token = getCookie("token");
    if(token == null){
        window.location.href = "http://localhost:5500/index.html";
        return;
    }

    const user_id = (await GetDecodedToken()).sub;

    return await fetch("https://localhost:7217/api/images/does-image-exist/" + user_id, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if(!response.ok){
            throw new CustomError("Failed to check for image");
        }
        console.log("Image found");
        return true;
    })
    .catch(error => {
        if(error instanceof CustomError){
            console.warn(error.message);
        }
        else{
            console.warn("Image not found");
        }
        return false;
    })
}


document.getElementById("createForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    var token = getCookie("token");
    if(token == null){
        window.location.href = "http://localhost:5500/index.html";
        return;
    }

    const project_name = document.getElementById("projectName").value;
    const user_id = (await GetDecodedToken()).sub;

    var formData = new FormData();
    formData.append("name", project_name);
    formData.append("user_id", user_id);

    await fetch("https://localhost:7217/api/projects", {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
        },
        body: formData
    })
    .then(response => {
        if(!response.ok){
            throw new CustomError("Failed to create project");
        }
        alert("Project created successfully");
        window.location.reload();
        return response.text();
    })
    .catch(error => {
        if(error instanceof CustomError){
            console.error(error.message);
        }
        else{
            console.error("Failed to create project");
        }
    })

})

document.getElementById("joinForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    var token = getCookie("token");
    if(token == null){
        window.location.href = "http://localhost:5500/index.html";
        return;
    }
    var user_id = (await GetDecodedToken()).sub;

    var project_guid = document.getElementById("projectGuid").value;

    var formData = new FormData();
    formData.append("user_id", user_id);
    formData.append("guid", project_guid);

    await fetch("https://localhost:7217/api/projects/join/", {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
        },
        body: formData
    })
    .then(response => {
        if(!response.ok){
            throw new CustomError("Failed to join project");
        }
        alert("Joined project successfully");
        window.location.reload();
        return response.text();
    })
    .catch(error => {
        alert("Failed to join project");
        if(error instanceof CustomError){
            console.error(error.message);
        }
        else{
            console.error("Failed to join project");
        }
    })
})

async function GetProjects(){
    var token = getCookie("token");
    var user_id = (await GetDecodedToken()).sub;

    return await fetch("https://localhost:7217/api/projects/user/" + user_id, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        switch(response.status){
            case 401:
                throw new CustomError("Unauthorized");
            case 404:
                throw new CustomError("No projects found");
        }
        return response.json();
    })
    .then(data => {
        return data;
    })
    .catch(error => {
        if(error instanceof CustomError){
            console.error(error.message);
        }
        else{
            console.error("Failed to get projects");
        }
    })
}

window.addEventListener('load', async function() {
    var projects = await GetProjects();
    if(projects == null){
        return;
    }
    var projectView = document.querySelector(".projects");
    for(var i = 0; i < projects.length; i++){
        var project = projects[i];
        projectView.innerHTML += `
            <div class="project">
                <a href="project.html?guid=${project.invite_guid}" ><img src="res/group.png" alt=""></a>
                <p>${project.name}</p>
            </div>
        
        `
    }
})

document.getElementById("logoutBtn").addEventListener("click", function() {
    if(getCookie("token") != null){
        deleteCookie("token");
    }
    window.location.href = "http://localhost:5500/index.html";
})