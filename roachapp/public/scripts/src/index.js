/**
 * Created by jeffreydoyle on 2017-03-18.
 */

//Init sockets
var socket = io();




//Session id for the game.
var session_id;

//Array of all the game objects.
var cockroaches = [];


//API//

//Called when the window is loaded.
function onClientLoad(){

    console.log(socket);

    socket.on('give_session', function(msg) {
        console.log(JSON.stringify(msg));
        session_id = msg.id;
    });

}



//Called on cockroch destroyed
function onObjectDestroy(roach){

    var message = {session_id: session_id, roach_id: roach.id}
    socket.emit('destroy_cockroach', message);
}



function logServerConsoleToScreen(message){

    var div = document.createElement('li');
    input = message.message;
    div.className = 'mdl-list__item';
    div.innerHTML = '<span class="mdl-list__item-primary-content"/>' +
        input
        + '</span>';
    document.getElementById('console-list').appendChild(div);

}


//Helper Functions//

//When new cockroach is created, create the new cockroach object and add it to the list.
function createRoach(newRoachID){

    var returnRoach = {id: newRoachID}
    cockroaches.push(returnRoach);
}



//Receive cockroach from server.
socket.on('roach_to_client', function(data) {
    console.log('Creating cockroach with id: ' + data.id);
    createRoach(data.id);
});

socket.on('console_log', function (data) {
    console.log('Server says: ' + data.message)
    logServerConsoleToScreen(data.message);
});