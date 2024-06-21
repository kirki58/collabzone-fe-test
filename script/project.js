import { redirect_unvalidated } from "./redirect_unvalidated.js";
import { getCookie } from "./cookie.js";
import { CustomError } from "./custom_error.js";

window.addEventListener("load", redirect_unvalidated)

function addUser(userId, userName, imageUrl ,isAdmin){
    var after;
    if(isAdmin){
        after = document.getElementById("adminsAfter");
    }
    else{
        after = document.getElementById("collabsAfter");
    }
    var newUserDiv = document.createElement("div");
    newUserDiv.className = "userDiv";
    newUserDiv.innerHTML = `<span style="display: none;">${userId}</span><img src="${imageUrl}" alt=""><span>${userName}</span>`;
    after.insertAdjacentElement("afterend", newUserDiv);
}

function getUserPicture(user){
    var token = getCookie("token");
    if (token == null) {
        window.location.href = "http://localhost:5500/index.html";
    }
    return fetch("https://localhost:7217/api/images/" + user.id, {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if(!response.ok){
            return null;
        }
        return response.blob();
    
    })

}

window.addEventListener("load", async function() {
    var token = getCookie("token");
    if (token == null) {
        window.location.href = "http://localhost:5500/index.html";
    }
    var guid = new URLSearchParams(window.location.search).get("guid");

    //Get Admins
    await fetch("https://localhost:7217/api/projects/admins/" + guid , {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if(!response.ok){
            throw new CustomError("There was an error getting users!");
        }
        return response.json();
    })
    .then(data => {
        data.forEach(user => {
            getUserPicture(user).then(blob => {
                var img = URL.createObjectURL(blob);
                if(img == null || img == "undefined"){
                    img = "res/image.png";
                }
                addUser(user.id, user.name, img, true);
            })
        });
    })
    .catch(error => {
        if(error instanceof CustomError){
            console.log(error.message);
        }
        else{
            console.log(error.message);
        }
    });

    // Get Collabs
    await fetch("https://localhost:7217/api/projects/collabs/" + guid , {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if(!response.ok){
            throw new CustomError("There was an error getting users!");
        }
        return response.json();
    })
    .then(data => {
        data.forEach(user => {
            getUserPicture(user).then(blob => {
                if(blob == null){
                    var img = "res/image.png";
                    addUser(user.id, user.name, img, false);
                    return;
                }
                var img = URL.createObjectURL(blob);
                addUser(user.id, user.name, img, false);
            })
        });
    })
    .catch(error => {
        if(error instanceof CustomError){
            console.log(error.message);
        }
        else{
            console.log("An error occurred while getting users!");
        }
    });

})

//Load project info
window.addEventListener("load", async function() {
    var token = getCookie("token");
    if (token == null) {
        window.location.href = "http://hocalhost:5500/index.html";
    }

    const guid = new URLSearchParams(window.location.search).get("guid");
    await fetch("https://localhost:7217/api/projects/" + guid, {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("projectName").innerHTML = data.name;
        document.getElementById("projectName2").innerHTML = data.name;
        document.getElementById("guid").innerHTML = data.invite_guid;
    })
    .catch(error => {
        window.location.href = "http://localhost:5500/home.html";
    });
})

$(document).ready(function() {
    var modal = $("#projectModal");
    var opener = $("#projectInfoBtn");
    var closer = $("#closeBtn2");

    opener.click(async function() {
        modal.css("display", "block");
    })
    closer.click(function() {
        document.getElementById("changeProjectNameForm").style.display = "none";
        document.getElementById("projectNameError").innerHTML = "";
        modal.css("display", "none");
    })
});

document.getElementById("ChangeProjectNameBtn").addEventListener("click", function() {
    document.getElementById("changeProjectNameForm").style.display = "block";
})

document.getElementById("changeProjectNameForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    var token = getCookie("token");
    if (token == null) {
        window.location.href = "http://localhost:5500/index.html";
    }

    const guid = new URLSearchParams(window.location.search).get("guid");
    const name = document.getElementById("newProjectName").value;

    var formData = new FormData();
    formData.append("guid", guid);
    formData.append("name", name);
    formData.append("refresh_guid", false);
    await fetch("https://localhost:7217/api/projects/" + guid, {
        method: "PUT",
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    })
    .then(response => {
        if(response.status == 401){
            throw new CustomError("You are not authorized to perform this action.");
        }
        if(!response.ok){
            throw new CustomError("An error occurred while changing the project name.");
        }
    })
    .then(data => {
        alert("Project name changed successfully.");
        window.location.reload();
    })
    .catch(error => {
        if(error instanceof CustomError){
            document.getElementById("projectNameError").innerHTML = error.message;
        }
        else{
            document.getElementById("projectNameError").innerHTML = "An error occurred while changing the project name.";
        }
    });
})

document.getElementById("RefreshGuidBtn").addEventListener("click", async function() {
    var token = getCookie("token");
    if (token == null) {
        window.location.href = "http://localhost:5500/index.html";
    }

    const guid = new URLSearchParams(window.location.search).get("guid");
    var formData = new FormData();
    formData.append("guid", guid);
    formData.append("refresh_guid", true);
    await fetch("https://localhost:7217/api/projects/" + guid, {
        method: "PUT",
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    })
    .then(response => {
        if(response.status == 401){
            throw new CustomError("You are not authorized to perform this action.");
        }
        if(!response.ok){
            throw new CustomError("An error occurred while refreshing the project GUID.");
        }
        return response.json();
    })
    .then(data => {
        alert("Project GUID refreshed successfully.");
        window.location.href = "http://localhost:5500/project.html?guid=" + data.guid;
    })
    .catch(error => {
        if(error instanceof CustomError){
            alert(error.message);
        }
        else{
            alert("An error occurred while refreshing the project GUID!");
        }
    });
})