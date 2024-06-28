import { redirect_unvalidated } from "./redirect_unvalidated.js";
import { getCookie } from "./cookie.js";
import { CustomError } from "./custom_error.js";
import { GetDecodedToken } from "./decode_token.js";
import { refreshGuid } from "./project_chat.js";

window.addEventListener("load", redirect_unvalidated)

window.addEventListener('load', async function(){
    var token = getCookie("token");
    var project_id = await getProjectId(new URLSearchParams(window.location.search).get('guid'));
    if(token == null){
        window.location.href = 'http://localhost:5500/index.html'
        return;
    }
    if(project_id == null){
        return;
    }

    await this.fetch('https://localhost:7217/api/tasks/project/' + project_id, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if(response.ok){
            return response.json();
        }
        else{
            throw new CustomError('An error occurred while fetching tasks');
        }
    })
    .then(data => {
        data.forEach(task => {
            var remaining_days = Math.floor((new Date(task.due_at) - new Date()) / (1000 * 60 * 60 * 24)) + 1;
            addTask(task.id, task.header, task.given_to, remaining_days);
        })
    })
    .catch(error => {
        if(error instanceof CustomError){
            console.log(error.message);
        }
        else{
            console.log('An error occurred while fetching tasks');
        }
    })
});

export async function getUserName(user_id){
    var token = getCookie('token');
    if(token == null){
        window.location.href = 'http://localhost:5500/index.html'
        return;
    }
    return await fetch("https://localhost:7217/api/users/" + user_id, {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if(!response.ok){
            return null;
        }
        return response.json();
    })
    .then(data => {
        return data.name;
    })
}

async function addTask(task_id ,header, given_to, remaining_days){
    var task = document.createElement('div');
    task.className = 'task';
    task.innerHTML = 
    `
        <span style="display: none;">${task_id}</span>
        <p><strong>Task: </strong> <span id="header">${header}</span></p>
        <p><strong>Given to: </strong> <span id="givenTo">${await getUserName(given_to)}</span></p>
        <p><strong>Remaining time: </strong> <span id="remaining">${remaining_days}</span> days</p>
        <i class="extendTime fa-solid fa-calendar-plus"></i>
        <i class="deleteTask fa-solid fa-trash"></i>
        <form action="" class="extendTimeForm" style="display: none;">
            <input type="number" min="1" required>
            <input class="taskExtendSubmitBtn" type="submit" value="Submit">
        </form>
    `
    document.getElementById('tasks').appendChild(task);
}

window.addEventListener("load", async function() {
    var token = getCookie("token");
    if (token == null) {
        window.location.href = "http://localhost:5500/index.html";
    }

    var guid = new URLSearchParams(window.location.search).get("guid");
    var projectGuid = document.getElementById("guid").innerHTML;
    
    await fetch("https://localhost:7217/api/projects/am-i-in/" + guid, {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if(!response.ok){
            throw new CustomError("You are not a member of this project.");
        }
    })
    .catch(error => {
        window.location.href = "http://localhost:5500/home.html";
    });
})

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
    newUserDiv.id = "userDiv" + userId;
    newUserDiv.innerHTML = `
    <span style="display: none;">${userId}</span>
    <img src="${imageUrl}" alt="">
    <span>${userName}</span>
    <div class="administration">
        <a class="banBtn" href="#">Ban</a>
        <a class="changeAuthBtn" href="#">Change Auth</a>
        <a class="giveTaskBtn" href="#">Give Task</a>
    </div>
    `;
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
                if(blob == null){
                    var img = "res/image.png";
                    addUser(user.id, user.name, img, true);
                    return;
                }
                var img = URL.createObjectURL(blob);
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

$(document).ready(function() {
    var modal = $("#tasksModal");
    var opener = $("#tasksBtn");
    var closer = $("#closeBtn3");

    opener.click(async function() {
        modal.css("display", "block");
    })
    closer.click(function() {
        document.querySelectorAll(".extendTimeForm").forEach(form => {
            form.style.display = "none";
        })
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
        refreshGuid(guid, data.guid);
        // window.location.href = "http://localhost:5500/project.html?guid=" + data.guid;
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

function debounce(func, delay) {
    let timeoutId;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

document.getElementById("tasks").addEventListener("click", async function(event){
    if(event.target && event.target.classList.contains("extendTime")){
        var form = event.target.parentElement.children[6];
        form.style.display = "block";
    }
    if(event.target && event.target.classList.contains("deleteTask")){
        var id = event.target.parentElement.children[0].innerHTML;
        var token = getCookie("token");
        if (token == null) {
            window.location.href = "http://localhost:5500/index.html";
            return;
        }

        var project_id = await getProjectId(new URLSearchParams(window.location.search).get('guid'));
        if(project_id == null){
            return;
        }
        await fetch("https://localhost:7217/api/tasks/" + id, {
            method: "DELETE",
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                project_id: project_id
            })
        })
        .then(response => {
            if(response.ok){
                alert('Task deleted successfully');
                window.location.reload();
                return response;
            }
            if(response.status == 401){
                throw new CustomError('You are not authorized to perform this action');
            }
            throw new CustomError('An error occurred while deleting task');
        })
        .catch(error => {
            if(error instanceof CustomError){
                alert(error.message);
            }
            else{
                alert('An error occurred while deleting task');
            }
        });
    }
})
document.getElementById("tasks").addEventListener("submit", async function(event){
    if(event.target && event.target.classList.contains("extendTimeForm")){
        event.preventDefault();

        var token = getCookie("token");
        if (token == null) {
            window.location.href = "http://localhost:5500/index.html";
            return;
        }
        var project_id = await getProjectId(new URLSearchParams(window.location.search).get('guid'));
        if(project_id == null){
            return;
        }

        var id = event.target.parentElement.children[0].innerHTML;

        var days = event.target.children[0].value;

        var new_due_at = new Date();
        new_due_at.setDate(new_due_at.getDate() + (parseInt(days) || 1));

        var project_id = await getProjectId(new URLSearchParams(window.location.search).get('guid'));
        if(project_id == null){
            return;
        }
        
        await fetch("https://localhost:7217/api/tasks/" + id, {
            method: "PUT",
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                due_at: new_due_at,
                project_id: project_id
            })
        })
        .then(response => {
            if(response.ok){
                alert('Task extended successfully');
                window.location.reload();
                return response;
            }
            if(response.status == 401){
                throw new CustomError('You are not authorized to perform this action');
            }
            throw new CustomError('An error occurred while extending task');
        })
        .catch(error => {
            if(error instanceof CustomError){
                alert(error.message);
            }
            else{
                alert('An error occurred while extending task');
            }
        });
    }
})

document.querySelector(".users").addEventListener("click", async function(event){
    const guid = new URLSearchParams(window.location.search).get("guid");
    const token = getCookie("token");
    if (token == null) {
        window.location.href = "http://localhost:5500/index.html";
    }

    if(event.target && event.target.classList.contains("banBtn")){
        let id = event.target.parentElement.parentElement.children[0].innerHTML;

        await fetch("https://localhost:7217/api/projects/ban-user", {
            method: "DELETE",
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "user_id": id,
                "project_guid": guid
            })
        })
        .then(response => {
            switch(response.status){
                case 401:
                    throw new CustomError("You are not authorized to perform this action.");
                case 400:
                    throw new CustomError("An error occurred while banning the user.");
                case 200:
                    window.location.reload();
            }
        })
        .catch(error => {
            if(error instanceof CustomError){
                alert(error.message);
            }
            else{
                alert("An error occurred while banning the user.");
            }
        });
    }

    if(event.target && event.target.classList.contains("changeAuthBtn")){
        let id = event.target.parentElement.parentElement.children[0].innerHTML;
        console.log(id);
        await fetch("https://localhost:7217/api/projects/change-admin", {
            method: "PUT",
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "user_id": id,
                "project_guid": guid
            })
        })
        .then(response => {
            switch(response.status){
                case 401:
                    throw new CustomError("You are not authorized to perform this action.");
                case 400:
                    throw new CustomError("An error occurred while banning the user.");
                case 200:
                    window.location.reload();
            }
        })
        .catch(error => {
            if(error instanceof CustomError){
                alert(error.message);
            }
            else{
                alert("An error occurred while banning the user.");
            }
        });
    }

    if(event.target && event.target.classList.contains("giveTaskBtn")){
        let admin_id = (await GetDecodedToken()).sub;
        let user_id = event.target.parentElement.parentElement.children[0].innerHTML;
        let project_id = await getProjectId(guid);

        window.location.href = "http://localhost:5500/admin/give_task.html?user_id=" + user_id + "&project_id=" + project_id;
    }


    if(event.target && event.target.classList.contains("userDiv")){
        if(event.target.children[3].style.display == 'none'){
            event.target.children[3].style.display = 'flex'
            event.target.children[3].style.justifyContent = 'space-around'
        }
        else{
            event.target.children[3].style.display = 'none'
        }
    }
})

export async function getProjectId (guid){
    var token = getCookie("token");
    if (token == null) {
        window.location.href = "http://localhost:5500/index.html";
    }
    return await fetch("https://localhost:7217/api/projects/" + guid, {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if(!response.ok){
            return null;
        }
        return response.json();
    })
    .then(data => {
        return data.id;
    })
}