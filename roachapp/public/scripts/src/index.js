/**
 * Created by jeffreydoyle on 2017-03-18.
 */

//Init sockets
var socket = io();
//Session id for the game.
var session_id;
//url for the admin interface
var admin_url;

//Array of all the game objects.
var cockroaches = [];

//Array of staging cockroaches
var stageroaches = [];

var createdCount = 0;
var destroyedCount = 0;



function updateCreatedCounter() {
    document.getElementById("created-counter").innerHTML = "Created: " + createdCount;
}

function updateDestroyedCounter() {
    document.getElementById("destroyed-counter").innerHTML = "Destroyed: " + destroyedCount;
}

function updateStatistics(){
    updateCreatedCounter();
    updateDestroyedCounter();
}



//Called on cockroch destroyed
function destroyRoach(roachID){
    var message = {'pid': roachID}
    socket.emit('kill_cockroach', message);

    cockroaches.filter(function(item){
        return item.id !== roachID;
    });

    destroyedCount++;
    updateStatistics();
}


function logServerConsoleToScreen(message){
    var div = document.createElement('div');
    input = JSON.stringify(message);
    div.className = 'mdl-list__item scrolling-list-element';

    div.innerHTML = '<div class="mdl-list__item-primary-content">' +
                        '<img src="images/roach.png"></div>';

    document.getElementById('console-list').appendChild(div);
}


//Helper Functions//

//Called when the window is loaded.
function onClientLoad(){
    //console.log(socket);

    var roachIDs = []
    socket.on('give_session', function(msg) {
        //console.log(JSON.stringify(msg));
        session_id = msg.id;
        admin_url = msg.admin_interface_url;
        setiframecontent();
        roachIDs = msg.roach_ids;

        roachIDs.forEach(function(id){
            createRoach(id);
        });
    });
}

//When new cockroach is created, create the new cockroach object and add it to the list.
function createRoach(newRoachID){
    var returnRoach = {id: newRoachID}
    cockroaches.push(returnRoach);

    //Create cockroach in game.
    createCockroach(returnRoach.id);
    updateStatistics();
}



//SOCKET ONs

//Receive cockroach from server.
socket.on('new_roach', function(data) {

   // console.log('Creating cockroach with id: ' + data.roach_id);
    createRoach(data.roach_id);
    createdCount++;
});

socket.on('console_log', function (data) {
    //console.log('Server says: ' + data.message)
    logServerConsoleToScreen(data.message);
});


socket.on('liveness_update', function (data) {
    //console.log('Server says: ' + data.body)
    //logServerConsoleToScreen(data.body);
})



//Setting game window sizes.
function setGameWindowDimensions(){

   // console.log("RESIZING DIS BITCH");

    var width = document.getElementById("gameCanvasContainer").offsetWidth;
    var height = document.getElementById("gameCanvasContainer").offsetHeight;
    //console.log("Width: " + width);
    //console.log("Height: " + height);

    var canvas = document.getElementById("gameCanvas");
    canvas.width = width;
    canvas.height = height;

    set_size(width, height);
}

//Handle window resizes by triggering the game window to resize.
window.onresize = function(event) {
    setGameWindowDimensions();
};

function setiframecontent(){
    var canvas = document.getElementById("admin-window");
    canvas.src = admin_url;
    canvas.contentWindow.location.reload();
}

setiframecontent();
setGameWindowDimensions();







