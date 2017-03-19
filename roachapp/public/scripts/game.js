var stage;

var player = new createjs.Container();

var roaches = [];
var roach_trails = [];
var trail_accumulator = 0;
var trail_interval = 0.2;
var trail_duration = 5;

let width, height;


function init() {
    stage = new createjs.Stage("gameCanvas");
    width = stage.canvas.width;
    height = stage.canvas.height;

    //initialize player
    let circle1 = new createjs.Shape();
    circle1.graphics.beginFill("White").drawCircle(0, 0, 14);

    let circle2 = new createjs.Shape();
    circle2.graphics.beginFill("Blue").drawCircle(0, 0, 12);

    let circle3 = new createjs.Shape();
    circle3.graphics.beginFill("White").drawCircle(0, 0, 8);

    let circle4 = new createjs.Shape();
    circle4.graphics.beginFill("Green").drawCircle(0, 0, 6);

    player.addChild(circle1);
    player.addChild(circle2);
    player.addChild(circle3);
    player.addChild(circle4);

    player.x = width/2;
    player.y = height/2;

    //initialize background 

    let background = new createjs.Shape();
    background.graphics.beginFill("#4e1e10").drawRect(0, 0, width, height);

    stage.addChild(background);

    stage.addChild(player);

    stage.addEventListener("stagemousemove", update_mouse, false); 

    spawn_roach(construct_blue_roach());

    createjs.Ticker.addEventListener("tick", update);
    createjs.Ticker.setFPS(30);
}

function update_mouse(mouse_event) {
    player.x = mouse_event.stageX;
    player.y = mouse_event.stageY;
}

function update(event) {
    //seconds 
    let delta_time = event.delta / 1000;

    trail_accumulator += delta_time;

    //update roaches
    for (i in roaches) {
        update_roach(roaches[i], delta_time);
        while(trail_accumulator > trail_interval) {
            trail_accumulator -= trail_interval;
            add_trail(
                roaches[i].display_object.x,
                roaches[i].display_object.y,
                roaches[i].direction.x,
                roaches[i].direction.y,
                roaches[i].color
            );
        }
    }

    //update roach trails
    for (i = roach_trails.length - 1; i >= 0; i--) {
        roach_trails[i].lifetime += delta_time;
        roach_trails[i].display_object.alpha = 1 - roach_trails[i].lifetime / trail_duration;
        if(roach_trails[i].lifetime > trail_duration) {
            roach_trails.splice(i,1);
        }
    }

    stage.update();
}

function spawn_roach(roach) {
    //assumes the roach has been constructed

    //TODO: assign the roach a random spawn position
    roach.display_object.x = 20;
    roach.display_object.y = 45;

    stage.addChild(roach.display_object);

    roaches.push(roach);
}

function construct_blue_roach() {
    let roach_display = new createjs.Shape();
    roach_display.graphics.beginStroke("Black").beginFill("Blue").drawRect(-10, -10, 20, 20);
    return {
        color: "blue",
        display_object: roach_display,
        direction: {
            x: 1,
            y: 1
        }
    };
}

function construct_green_roach() {
    let roach_display = new createjs.Shape();
    roach_display.graphics.beginStroke("Black").beginFill("Green").drawRect(-10, -10, 20, 20);
    return {
        color: "green",
        display_object: roach_display
    };
}

function update_roach(roach, delta_time) {
    switch(roach.color) {
        case "blue": 
            update_blue_roach(roach, delta_time);
            break;
        case "green": 
            update_blue_roach(roach, delta_time);
            break;
        default:
            console.log("DEFAULTED!");
    }
}

function update_blue_roach(roach, delta_time) {
    let blue_roach_speed = 80;

    if(roach.display_object.x > width || roach.display_object.x < 0) {
        roach.direction.x *= -1;
    }

    if(roach.display_object.y > height || roach.display_object.y < 0) {
        roach.direction.y *= -1;
    }

    roach.display_object.x += delta_time * blue_roach_speed * roach.direction.x;
    roach.display_object.y += delta_time * blue_roach_speed * roach.direction.y;

}

function update_green_roach(roach, delta_time) {

}

function add_trail(x, y, dx, dy, color_str) {
    let shape = new createjs.Shape();
    let color = "#ffffff";
    switch (color_str) {
        case "blue":
            color = "#0000ff";
            break;
        case "green":
            color = "#00ff00";
    }

    shape.graphics.beginFill(color).drawRect(-5, -2, 10, 4);
    let raw_angle = Math.atan(dy/dx) / Math.PI * 180;
    shape.rotation = raw_angle;
    shape.x = x;
    shape.y = y;

    stage.addChild(shape);
    roach_trails.push({
        display_object: shape,
        lifetime: 0
    });
}



