import {getCookie} from './cookie.js';
import {GetDecodedToken} from './decode_token.js';
import {getProjectId} from './project.js';
import { getUserName } from './project.js';

class SentMessage{
    constructor(_user_name, _user_image, _message, _timestamp){
        this.user_name = _user_name;
        this.user_image = _user_image;
        this.message = _message;
        this.timestamp = _timestamp;
    }
}

// Establish a connection to the SignalR hub
let token = getCookie("token");
if(token == null){
    window.location.href = "http://localhost:5500/index.html";
}

const connection = new signalR.HubConnectionBuilder()
.withUrl("https://localhost:7217/projectChatHub")
.build();

const projectGuid = new URLSearchParams(window.location.search).get("guid");
const projectId = await getProjectId(projectGuid);
// Start the connection
connection.start().then(function () {
    joinProject();
}).catch(function (err) {
    return console.error("Error connecting to SignalR hub: ",err.toString());
});

//ReceiveMessage webhook
connection.on("ReceiveMessage", async function (id, message) {
    saveMessage(projectId, id, message);

    var name = await getUserName(id);
    getPictureByUserId(id).then(blob => {
        if(blob == null){
            addMessage(name, "res/image.png", message);
            return;
        }
        var img = URL.createObjectURL(blob);
        addMessage(name, img, message);
    });
});

//Join project
function joinProject(){
    connection.invoke("JoinProject", projectGuid)
    .then(() => {
        const messages = loadMessages(projectId);
        messages.forEach(message => {
            console.log(message);
        });
    })
    .catch(err => console.error(err.toString()));
}

//Leave project
function leaveProject(){
    connection.invoke("LeaveProject", projectGuid).catch(err => console.error(err.toString()));
}

//Send message
function sendMessage(id, message){
    connection.invoke("SendMessage", projectGuid, id, message)
    .catch(err => console.error(err.toString()));
}

connection.on("refreshGuid", function(newGuid){
    window.location.href = "http://localhost:5500/project.html?guid=" + newGuid;
})

export function refreshGuid(oldGuid, newGuid){
    connection.invoke("RefreshGuid", oldGuid ,newGuid).catch(err => console.error(err.toString()));
}

document.getElementById("messageForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    var token = getCookie("token");
    if(token == null){
        window.location.href = "http://localhost:5500/index.html";
        return;
    }
    var decodedToken = await GetDecodedToken(token);
    var text = document.getElementById("messageInput").value;

    let user_id = decodedToken.sub;
    user_id = parseInt(user_id);
    sendMessage(user_id, text);
    document.getElementById("messageInput").value = "";
})

connection.onclose(leaveProject);

//function to menage local storage for project chat

function saveMessage(projectId, userId, message){
    const key = projectId + "_messages";
    var messages = JSON.parse(localStorage.getItem(key));
    if(messages == null){
        messages = [];
    }
    var newMessage = {userId, message, timestamp: new Date().toISOString()};
    messages.push(newMessage);
    localStorage.setItem(key, JSON.stringify(messages)); 
}

function loadMessages(projectId){
    const key = projectId + "_messages";
    console.log(key);
    var messages = JSON.parse(localStorage.getItem(key));
    if(messages == null){
        return [];
    }
    return messages;
}

function addMessage(_user_name, _user_image, _message){
    const messagesDiv = document.getElementById("messages");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.innerHTML = 
    `
        <img src="${_user_image}" alt="">
        <span>${_user_name}</span>
        <p>${_message}</p>
    `
    messagesDiv.appendChild(messageDiv);
}

async function getPictureByUserId(_user_id){
    var token = getCookie("token");
    if (token == null) {
        window.location.href = "http://localhost:5500/index.html";
    }
    return await fetch("https://localhost:7217/api/images/" + _user_id, {
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

// save every user name and user image in local storage
window.addEventListener("load", async function(){
    var token = getCookie("token");
    if(token == null){
        window.location.href = "http://localhost:5500/index.html";
        return;
    }
    
});




