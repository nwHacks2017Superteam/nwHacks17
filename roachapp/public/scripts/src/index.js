/**
 * Created by jeffreydoyle on 2017-03-18.
 */

//Init sockets
var socket = io();


//Session id for the game.
var session_id;

//Array of all the game objects.
var cockroaches = [];






//Called on cockroch destroyed
function destroyRoach(roach){

    var message = {session_id: session_id, roach_id: roach}
    socket.emit('kill_cockroach', message);
}


function logServerConsoleToScreen(message){

    var div = document.createElement('div');
    input = message.message;
    div.className = 'mdl-list__item scrolling-list-element';
    div.innerHTML = '<span class="mdl-list__item-primary-content"/>' + "$> " +
        input
        + '</span>';
    document.getElementById('console-list').appendChild(div);

}



//Helper Functions//


//Called when the window is loaded.
function onClientLoad(){

    console.log(socket);

    socket.on('give_session', function(msg) {
        console.log(JSON.stringify(msg));
        session_id = msg.id;
    });

}

//When new cockroach is created, create the new cockroach object and add it to the list.
function createRoach(newRoachID){
    var returnRoach = {id: newRoachID}
    cockroaches.push(returnRoach);
}

//Testing round trip to server and back
function requestLog(msg){
    console.log('sending message to server');
    socket.emit('request_message', {message: msg});
}


//Receive cockroach from server.
socket.on('create_roach', function(data) {
    console.log('Creating cockroach with id: ' + data.rid);
    createRoach(data.id);
});

socket.on('console_log', function (data) {
    console.log('Server says: ' + data.message)
    logServerConsoleToScreen(data.message);
});



function setGameWindowDimensions(){

    console.log("RESIZING DIS BITCH");

    var width = document.getElementById("gameCanvasContainer").offsetWidth;
    var height = document.getElementById("gameCanvasContainer").offsetHeight;
    console.log("Width: " + width);
    console.log("Height: " + height);

    var canvas = document.getElementById("gameCanvas");
    canvas.width = width;
    canvas.height = height;

    set_size(width, height);
}

//Handle window resizes by triggering the game window to resize.
window.onresize = function(event) {
    setGameWindowDimensions();
};

setGameWindowDimensions();
