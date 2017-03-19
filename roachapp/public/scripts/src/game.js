var stage;

var score = new createjs.Text("0", "20px Arial", "#ff7700");

var player = new createjs.Container();
var player_hurt_radius = 22;

var roaches = [];
var roach_layer = new createjs.Container();

var roach_trails = [];
var trail_layer = new createjs.Container();

var trail_accumulator = 0;
var trail_interval = 0.2;
var trail_duration = 3;

var attacks = [];
var attack_layer = new createjs.Container();
var hit_radius = 120;
var attack_duration = 1.8;

var spawns = [];
var spawn_layer = new createjs.Container();
var spawn_duration = 1;
var spawn_radius = 20;

var shards = [];
var shard_layer = new createjs.Container();
var shard_short_duration = 1.5;
var shard_duration = 3;
var shard_velocity = 20;
var shard_omega = 720;

let available_ids = [];

let white_roaches = [];


let image_root = "images/";

let wave_count = 0;
let initial_wave = true;

let top_bar_height = 40;
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


    //player.addChild(hit_circle);
    //player.addChild(hurt_circle);
    player.addChild(circle1);
    player.addChild(circle2);
    player.addChild(circle3);
    player.addChild(circle4);

    player.x = width/2;
    player.y = height/2;

    //initialize background 

    let background = new createjs.Shape();
    background.graphics.beginFill("#4e1e10").drawRect(0, top_bar_height, width, height);

    let topbar = new createjs.Shape();
    topbar.graphics.beginFill("Black").drawRect(0, 0, width, top_bar_height);

    score.scaleX = 30;
    score.scaleY = 30;
    score.x = width/2;
    score.y = height/2 - 300;
    score.color = ("#400e05");
    score.textAlign = "center";

    stage.addChild(background);
    stage.addChild(score);
    stage.addChild(shard_layer);
    stage.addChild(trail_layer);
    stage.addChild(spawn_layer);
    stage.addChild(attack_layer);
    stage.addChild(roach_layer);
    stage.addChild(topbar);
    stage.addChild(player);

    stage.addEventListener("stagemousemove", update_mouse, false); 


    createjs.Ticker.addEventListener("tick", update);
    createjs.Ticker.setFPS(60);
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
        for (i in white_roaches) {
            stage.removeChild(white_roaches[i]);
        }
        white_roaches = [];
        //spawn_roach_wave('abcde'.split(''));
        if(initial_wave) {
            initial_wave = false;
        }
        else {
            score.text = (++wave_count).toString();
        }
    }
    else {
        console.log(available_ids.length);
        if(white_roaches.length < available_ids.length) {
            for(i = white_roaches.length; i <= available_ids.length; i++) {
                let wr = new createjs.Bitmap(image_root + "white_roach.png");
                wr.x = i * 30;
                wr.y = 10;
                white_roaches.push(wr);
                stage.addChild(wr);
            }
        }
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
    //update shards
    for(i = shards.length - 1; i >= 0; i--) {
        shards[i].lifetime += delta_time;
        if(shards[i].lifetime >= shard_duration) {
            shard_layer.removeChild(shards[i].display_object);
            shards.splice(i,1);
            continue;
        }
        shards[i].display_object.x += shards[i].velocity * Math.cos(shards[i].angle / 180 * Math.PI) * delta_time;
        shards[i].display_object.y += shards[i].velocity * Math.sin(shards[i].angle / 180 * Math.PI) * delta_time;
        shards[i].display_object.rotation += shards[i].omega * delta_time;

        let short_tween = Math.max(0, 1 - Math.pow(shards[i].lifetime / shard_short_duration, 1/2));
        let long_tween = 1 - Math.pow(shards[i].lifetime / shard_duration, 2);

        shards[i].omega = Math.sign(shards[i].omega) * shard_omega * short_tween;
        shards[i].display_object.alpha = long_tween;
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
                create_shards(attacks[i].line_display_object.x, attacks[i].line_display_object.y, attacks[i].roach.color);
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
        let y = margin + Math.random() * (height - top_bar_height - margin * 2);
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
            roach = construct_red_roach(ids[i]);
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
            break;
        case "red":
            color = "#ff8080";
            break;
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

function killall() {
    for (i = roaches.length; i >= 0; i--) {
        kill_roach(roach[i]);
    }
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

function create_shards(x, y, color) {
    let count = 30 + Math.round(Math.random() * 15);
    let true_color = "White";
    switch (color) {
        case "blue":
            true_color = "#0000ff";
            break;
        case "green":
            true_color = "#00ff00";
            break;
        case "red":
            true_color = "#ff0000";
            break;
    }
    for (i = 0; i < count; i++) {
        let shard_shape = new createjs.Shape();
        shard_shape.graphics.beginFill(true_color).drawRect(-3,-3,6,6);
        shard_shape.x = x;
        shard_shape.y = y;
        shards.push({
            display_object: shard_shape,
            velocity: shard_velocity * Math.random(),
            omega: shard_omega * (Math.random() < 0.5 ? -1 : 1),
            angle: Math.random() * 360,
            lifetime: 0
        });
        shard_layer.addChild(shard_shape);
    }
}

function construct_blue_roach(id) {
    let roach_display = new createjs.Bitmap(image_root + "blue_roach.png");
    roach_display.regX = 15;
    roach_display.regY = 15;
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
    let roach_display = new createjs.Bitmap(image_root + "green_roach.png");
    roach_display.regX = 15;
    roach_display.regY = 15;
    let angle = Math.random() * 2 * Math.PI;
    let omega = (Math.random() - 0.5) * 2;
    return {
        id: id,
        color: "green",
        display_object: roach_display,
        direction: {
            x: 1,
            y: 0
        },
        theta: angle,
        omega: omega,
        alpha: 0,
        alpha_sign: Math.sign(Math.random() - 0.5)
    };
}

function construct_red_roach(id) {
    let roach_display = new createjs.Bitmap(image_root + "red_roach.png");
    roach_display.regX = 15;
    roach_display.regY = 15;
    return {
        id: id,
        color: "red",
        display_object: roach_display,
        turned_iterator: -1,
        direction: {
            x: Math.random() < 0.5 ? -1 : 1,
            y: Math.random() < 0.5 ? -1 : 1
        }
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
        case "red":
            update_red_roach(roach, delta_time);
            break;
        default:
            console.log("DEFAULTED!");
    }
}

function update_blue_roach(roach, delta_time) {
    let blue_roach_speed = 150;


    roach.display_object.x += delta_time * blue_roach_speed * roach.direction.x;
    roach.display_object.y += delta_time * blue_roach_speed * roach.direction.y;


    if(roach.display_object.x > width || roach.display_object.x < 0) {
        roach.direction.x *= -1;
    }

    if(roach.display_object.y > height || roach.display_object.y < top_bar_height) {
        roach.direction.y *= -1;
    }

    let angle = Math.atan(roach.direction.y/roach.direction.x) * 180 / Math.PI;
    if(roach.direction.x < 0) {
        angle = 180 + angle;
    }
    roach.display_object.rotation = angle;

}

function update_green_roach(roach, delta_time) {
    let green_roach_speed = 150;

    roach.alpha = Math.max(Math.random(), 0.2) * 2 * roach.alpha_sign;

    let omega_max = 3;

    roach.omega += roach.alpha * delta_time;
    if(roach.omega <= -omega_max) {
        roach.alpha_sign *= -1;
        roach.omega = -omega_max;
    }
    if(roach.omega >= omega_max) {
        roach.alpha_sign *= -1;
        roach.omega = omega_max;
    }

    roach.theta += roach.omega * delta_time;

    roach.direction.x = Math.cos(roach.theta);
    roach.direction.y = Math.sin(roach.theta);

    roach.display_object.rotation = roach.theta * 180 / Math.PI;

    roach.display_object.x += delta_time * green_roach_speed * roach.direction.x;
    roach.display_object.y += delta_time * green_roach_speed * roach.direction.y;


    if(roach.display_object.x > width || roach.display_object.x < 0) {
        roach.display_object.x += width;
        roach.display_object.x %= width;
    }

    if(roach.display_object.y > height) {
        roach.display_object.y -= (height - top_bar_height);
    }
    if(roach.display_object.y < top_bar_height) {
        roach.display_object.y += (height - top_bar_height);
    }
}

function update_red_roach(roach, delta_time) {
    let red_roach_bounce_speed = 100;
    let red_roach_run_speed = 250;
    let turn_duration = 1.5;

    if(roach.display_object.x > width || roach.display_object.x < 0) {
        roach.direction.x *= -1;
        roach.display_object.x = roach.display_object.x > width ? width : 0;
        roach.turned_iterator = 0;
    }

    if(roach.display_object.y > height || roach.display_object.y < top_bar_height) {
        roach.direction.y *= -1;
        roach.display_object.y = roach.display_object.y > height ? height : top_bar_height;
        roach.turned_iterator = 0;
    }

    
    let dx = roach.display_object.x - player.x;
    let dy = roach.display_object.y - player.y;

    let length = Math.sqrt(dx * dx + dy * dy);

    let speed = roach.turned_iterator < 0 ? red_roach_run_speed : red_roach_bounce_speed;

    if(roach.turned_iterator >= 0) {
        roach.turned_iterator += delta_time;
        if(roach.turned_iterator >= turn_duration) {
            roach.turned_iterator = -1;
        }
    }
    else {
        roach.direction.x = dx / length;
        roach.direction.y = dy / length;
        let angle = Math.atan(roach.direction.y/roach.direction.x) * 180 / Math.PI;
        if(roach.direction.x < 0) {
            angle = 180 + angle;
        }
        roach.display_object.rotation = angle;
    }


    roach.display_object.x += delta_time * speed * roach.direction.x;
    roach.display_object.y += delta_time * speed * roach.direction.y;
    
    
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
            break;
        case "red":
            color = "#ff0000";
            break;
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




