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
var hit_radius = 100;
var attack_duration = 2;

var spawns = [];
var spawn_layer = new createjs.Container();
var spawn_duration = 2;
var spawn_radius = 20;

let available_ids = ['d','e','f'];

let width = 0;
let height = 0;

function createCockroach(id) {
    available_ids.push(id);
}

function set_size(w, h) {
    width = w;
    height = h;

    console.log("SIZE SET");
}

function set_size_from_canvas(){
    set_size(stage.canvas.width, stage.canvas.height);
    console.log("SIZE SET IMPLICITLY");
}

function init() {
    stage = new createjs.Stage("gameCanvas");
    stage.canvas.style.cursor = "none";
    if(width == 0 || height == 0) {
        set_size_from_canvas();
    }

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
    stage.addChild(spawn_layer);
    stage.addChild(attack_layer);
    stage.addChild(player);
    stage.addChild(roach_layer);

    stage.addEventListener("stagemousemove", update_mouse, false); 

    //spawn_roach(construct_blue_roach());
    spawn_roach_wave(['a','b','c']);

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

    if(roaches.length + spawns.length == 0 && available_ids.length != 0) {
        spawn_roach_wave(available_ids.splice(0, available_ids.length));
    }

    //update spawns
    for (let i = spawns.length-1; i >= 0; i--) {
        spawns[i].lifetime += delta_time;
        if(spawns[i].lifetime >= spawn_duration) {
            spawn_roach(spawns[i]);
            spawns.splice(i,1);
            continue;
        }
        spawns[i].inner_display_object.scaleX = spawns[i].lifetime / spawn_duration * spawn_radius;
        spawns[i].inner_display_object.scaleY = spawns[i].lifetime / spawn_duration * spawn_radius;
    }

    //update roaches
    for (let i = 0; i < roaches.length; i++ ) {
        update_roach(roaches[i], delta_time);
        if(trail_accumulator > trail_interval) {
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
            for (let j = 0; j < attacks.length; j++) {
                if(attacks[j].roach.id == roaches[i].id) {
                    attack_exists = true;
                    continue;
                }
            }

            if(!attack_exists) {
                add_attack(roaches[i]);
            }
        }

    }

    if(trail_accumulator > trail_interval){
            trail_accumulator -= trail_interval;
    }

    //update roach trails
    for (let i = roach_trails.length - 1; i >= 0; i--) {
        roach_trails[i].lifetime += delta_time;
        roach_trails[i].display_object.alpha = 1 - roach_trails[i].lifetime / trail_duration;
        if(roach_trails[i].lifetime > trail_duration) {
            roach_trails.splice(i,1);
        }
    }

    //update attacks
    for (let i = attacks.length - 1; i >= 0; i--) {
        attacks[i].line_display_object.x = attacks[i].roach.display_object.x;
        attacks[i].line_display_object.y = attacks[i].roach.display_object.y;
        if(within_circle(
            attacks[i].line_display_object.x,
            attacks[i].line_display_object.y,
            player.x,
            player.y,
            hit_radius
        )) {
            attacks[i].lifetime += delta_time;
            if(attacks[i].lifetime >= attack_duration) {
                attack_layer.removeChild(attacks[i].line_display_object);
                kill_roach(attacks[i].roach);
                attacks.splice(i,1);
                continue;
            }

            let alpha_factor = attacks[i].lifetime / attack_duration;
            attacks[i].line_display_object.alpha = Math.pow(alpha_factor, 3) * 0.8 + 0.2;
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


function spawn_roach_wave(ids) {
    let margin = 30;

    for (i = 0; i < ids.length; i++) {
        let x = margin + Math.random() * (width - margin * 2);
        let y = margin + Math.random() * (height - margin * 2);
        let roach;
        let color_rand = Math.random() * 3;
        //TODO: spawn different color roaches
        if(color_rand < 1) {
            roach = construct_blue_roach(ids[i]);
        }
        else if(color_rand < 2) {
            roach = construct_green_roach(ids[i]);
        }
        else if(color_rand < 3) {
            roach = construct_green_roach(ids[i]);
        }
        roach.display_object.x = x;
        roach.display_object.y = y;
        create_spawn_point(roach);
    }
}

function create_spawn_point(roach) {
    let color = "#ffffff";
    switch (roach.color) {
        case "blue":
            color = "#8080ff";
            break;
        case "green":
            color = "#80ff80";
    }
    let circle1 = new createjs.Shape();
    circle1.graphics.setStrokeStyle(2).beginStroke(color).drawCircle(0,0,spawn_radius);
    circle1.x = roach.display_object.x;
    circle1.y = roach.display_object.y;
    let circle2 = new createjs.Shape();
    circle2.graphics.beginFill(color).drawCircle(0,0,1);
    circle2.x = roach.display_object.x;
    circle2.y = roach.display_object.y;

    let spawn = {
        outer_display_object: circle1,
        inner_display_object: circle2,
        new_roach: roach,
        lifetime: 0
    }
    spawn_layer.addChild(circle2);
    spawn_layer.addChild(circle1);
    spawns.push(spawn);
}

function spawn_roach(spawn) {

    roach_layer.addChild(spawn.new_roach.display_object);
    roaches.push(spawn.new_roach);

    spawn_layer.removeChild(spawn.inner_display_object);
    spawn_layer.removeChild(spawn.outer_display_object);
}

function kill_roach(roach) {
    //TODO: add gibbing
    destroyRoach(roach.id);
    roach_layer.removeChild(roach.display_object);
    for(i = 0; i < roaches.length; i++) {
        if(roaches[i] === roach) {
            roaches.splice(i, 1);
            break;
        }
    }



}

function construct_blue_roach(id) {
    let roach_display = new createjs.Shape();
    roach_display.graphics.beginStroke("Black").beginFill("Blue").drawRect(-10, -10, 20, 20);
    roach_display.rotation = 90;
    return {
        id: id,
        color: "blue",
        display_object: roach_display,
        direction: {
            x: Math.random() < 0.5 ? -1 : 1,
            y: Math.random() < 0.5 ? -1 : 1
        }
    };
}

function construct_green_roach(id) {
    let roach_display = new createjs.Shape();
    roach_display.graphics.beginStroke("Black").beginFill("Green").drawRect(-10, -10, 20, 20);
    let angle = Math.random() * 2 * Math.PI;
    return {
        id: id,
        color: "green",
        display_object: roach_display,
        direction: {
            x: Math.cos(angle),
            y: Math.sin(angle)
        },
        theta: angle,
        omega: 0,
        alpha: 0
    };
}

function update_roach(roach, delta_time) {
    switch(roach.color) {
        case "blue": 
            update_blue_roach(roach, delta_time);
            break;
        case "green": 
            update_green_roach(roach, delta_time);
            break;
        default:
            console.log("DEFAULTED!");
    }
}

function update_blue_roach(roach, delta_time) {
    let blue_roach_speed = 100;

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
    let green_roach_speed = 100;

    if(roach.display_object.x > width || roach.display_object.x < 0) {
        roach.display_object.x += width;
        roach.display_object.x %= width;
    }

    if(roach.display_object.y > height || roach.display_object.y < 0) {
        roach.display_object.y += height;
        roach.display_object.y %= height; 
    }

    roach.display_object.x += delta_time * green_roach_speed * roach.direction.x
    roach.display_object.y += delta_time * green_roach_speed * roach.direction.y
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




