var stage;

var player = new createjs.Container();
var player_hurt_radius = 25;

var roaches = [];
var roach_layer = new createjs.Container();

var roach_trails = [];
var trail_layer = new createjs.Container();

var trail_accumulator = 0;
var trail_interval = 0.2;
var trail_duration = 3;

var attacks = [];
var attack_layer = new createjs.Container();
var hit_radius = 80;
var attack_duration = 2;




let width, height;

function set_size(w, h) {
    width = w;
    height = h;
}

function set_size_from_canvas(){
    set_size(stage.canvas.width, stage.canvas.height);
}

function init() {
    stage = new createjs.Stage("gameCanvas");
    stage.canvas.style.cursor = "none";
    set_size_from_canvas();

    //initialize player
    let circle1 = new createjs.Shape();
    circle1.graphics.beginFill("White").drawCircle(0, 0, 14);

    let circle2 = new createjs.Shape();
    circle2.graphics.beginFill("Blue").drawCircle(0, 0, 12);

    let circle3 = new createjs.Shape();
    circle3.graphics.beginFill("White").drawCircle(0, 0, 8);

    let circle4 = new createjs.Shape();
    circle4.graphics.beginFill("Green").drawCircle(0, 0, 6);

    //REMOVE THESE IN FINAL
    let hit_circle = new createjs.Shape();
    hit_circle.graphics.beginFill("White").drawCircle(0, 0, hit_radius);
    hit_circle.alpha = 0.2;

    let hurt_circle = new createjs.Shape();
    hurt_circle.graphics.beginFill("Red").drawCircle(0, 0, player_hurt_radius);
    hurt_circle.alpha = 0.2;


    player.addChild(hit_circle);
    player.addChild(hurt_circle);
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
    stage.addChild(trail_layer);
    stage.addChild(attack_layer);
    stage.addChild(player);
    stage.addChild(roach_layer);

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
        //check for player death
        if (within_circle(
            roaches[i].display_object.x,
            roaches[i].display_object.y,
            player.x,
            player.y,
            player_hurt_radius
        )) {
            //kill player
            console.log("player hit!");
        }
        if(within_circle(
            roaches[i].display_object.x,
            roaches[i].display_object.y,
            player.x,
            player.y,
            hit_radius
        )) {
            //add new attack
            let attack_exists = false;
            for (i in attacks) {
                if(attacks[i].roach === roaches[i]) {
                    attack_exists = true;
                    break;
                }
            }

            if(!attack_exists) {
                add_attack(roaches[i]);
            }
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

    //update attacks
    for (i = attacks.length - 1; i >= 0; i--) {
        attacks[i].line_display_object.x = attacks[i].roach.display_object.x;
        attacks[i].line_display_object.y = attacks[i].roach.display_object.y;
        if(within_circle(
            attacks[i].roach.display_object.x,
            attacks[i].roach.display_object.y,
            player.x,
            player.y,
            hit_radius
        )) {
            attacks[i].lifetime += delta_time;
            if(attacks[i].lifetime >= attack_duration) {
                attack_layer.removeChild(attacks[i].line_display_object);
                attacks.splice(i,1);
                console.log("killed roach!");
                continue;
            }
            attacks[i].line_display_object.alpha = attacks[i].lifetime / attack_duration * 0.8 + 0.2;
            aim_attack(attacks[i]);
        }
        else {
            attacks[i].lifetime -= delta_time / 4;
            if(attacks[i].lifetime < 0) {
                attack_layer.removeChild(attacks[i].line_display_object);
                attacks.splice(i,1);
                continue;
            }
            attacks[i].line_display_object.alpha = 0;
        }
        

    }


    stage.update();
}

function spawn_roach(roach) {
    //assumes the roach has been constructed

    //TODO: assign the roach a random spawn position
    roach.display_object.x = 20;
    roach.display_object.y = 45;

    roach_layer.addChild(roach.display_object);

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

function aim_attack(attack) {
    var dx = player.x - attack.line_display_object.x;
    var dy = player.y - attack.line_display_object.y;
    var length = Math.sqrt(dx * dx + dy * dy);
    var angle = Math.atan(dy / dx) * 180 / Math.PI;
    if(dx < 0) {
        angle = 180 + angle;
    }

    attack.line_display_object.scaleX = length;
    attack.line_display_object.rotation = angle;

}

function add_attack(roach) {
    var line = new createjs.Shape();
    line.graphics.beginFill("White").drawRect(0, -4, 1, 8);
    var dx = player.x - roach.display_object.x;
    var dy = player.y - roach.display_object.y;
    var angle = Math.atan(dy / dx) * 180 / Math.PI;
    if(dx < 0) {
        angle = 180 + angle;
    }

    attack_layer.addChild(line);

    attacks.push({
        line_display_object: line,
        roach: roach,
        lifetime: 0
    });
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

    trail_layer.addChild(shape);
    roach_trails.push({
        display_object: shape,
        lifetime: 0
    });
}

function within_circle(x, y, circle_x, circle_y, radius) {
    let dx = circle_x - x;
    let dx2 = dx * dx;
    let dy = circle_y - y;
    let dy2 = dy * dy;

    return radius * radius >= dx2 + dy2;
}



