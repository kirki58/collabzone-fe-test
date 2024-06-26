import {GetDecodedToken} from '../script/decode_token.js';
import {CustomError} from '../script/custom_error.js';
import { getCookie } from '../script/cookie.js';
 
document.getElementById('giveTaskForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    var given_to = new URLSearchParams(window.location.search).get('user_id');
    var given_at = new URLSearchParams(window.location.search).get('project_id');
    var given_by = (await GetDecodedToken()).sub;

    var due_at = new Date();
    due_at.setDate(due_at.getDate() + (parseInt(document.getElementById('days').value) || 1));

    var header = document.getElementById('header').value;
    var description = document.getElementById('desc').value;

    var token = getCookie('token');
    if(token == null){
        window.location.href = 'http://localhost:5500/index.html'
        return;
    }

    await fetch('https://localhost:7217/api/tasks', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            given_to: given_to,
            given_at: given_at,
            given_by: given_by,
            due_at: due_at,
            header: header,
            description: description
        })
    })
    .then(response => {
        if(response.ok){
            window.history.back();
            return response;
        }
        if(response.status == 401){
            throw new CustomError('You are not authorized to perform this action');
        }
        throw new CustomError('An error occurred while giving task');
    })
    .catch(error => {
        if(error instanceof CustomError){
            alert(error.message);
        }
        else{
            alert('An error occurred while giving task');
        }
    });
});