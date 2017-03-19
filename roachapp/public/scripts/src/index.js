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
function destroyRoach(roachID){
    var message = {'pid': roachID}
    socket.emit('kill_cockroach', message);

    cockroaches.filter(function(item){
        return item.id !== roachID;
    });
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

    //Create cockroach in game.
    createCockroach(returnRoach.id);
}

//Testing round trip to server and back
function requestLog(msg){
    console.log('sending message to server');
    socket.emit('request_message', {'message': msg});
}




//SOCKET ONs

//Receive cockroach from server.
socket.on('new_roach', function(data) {

    console.log('Creating cockroach with id: ' + data.roach_id);
    createRoach(data.roach_id);
});

socket.on('console_log', function (data) {
    console.log('Server says: ' + data.message)
    logServerConsoleToScreen(data.message);
});


socket.on('liveness_update', function (data) {
    console.log('Server says: ' + data.body)
    logServerConsoleToScreen(data.body);
})



//Setting game window sizes.
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


















