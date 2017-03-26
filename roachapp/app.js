var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var child_process = require('child_process');
var request = require('request');

var index = require('./routes/index');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var uuidV4 = require('uuid/v4');

sessions = {};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

io.on('connection', function(socket) {
    var uuid = uuidV4();
    console.log(`a user connected, with ${uuid}`);

    if (!sessions[socket]) {
        sessions[socket] = {
            'uuid': uuid,
            'pids': [],
            'dead':  0,
            'spawned': 0,
        };
    }

    var childproc = child_process.spawn('bash-scripts/start-cluster.sh', ['-n', '5', '-u', uuid]);

    childproc.stdout.on('data', (data) => {
        console.log(`${data}`);

        var fields = `${data}`.trim().split(',');


        if (fields.length == 3) {
            sessions[socket]['special_pid'] = fields[0];
            sessions[socket]['pg_port'] = fields[1];
            sessions[socket]['http_port'] = fields[2];
            //checkAPI(sessions[socket]['http_port']);
            //console.log(`http://localhost:${sessions[socket]['http_port']}/#/cluster/nodes`);
            io.emit('give_session', { 'id': uuid, 'roach_ids': sessions[socket]['pids'], 'admin_interface_url': `http://localhost:${sessions[socket]['http_port']}/#/cluster/nodes` });
        } else if (fields.length == 1) {

            if (!(`${parseInt(data)}` == "NaN")) {
                sessions[socket]['pids'].push(`${parseInt(data)}`);
                io.emit('new_roach', {'roach_id' : `${parseInt(data)}`});
                sessions[socket]['spawned'] += 1;
                console.log(JSON.stringify(sessions[socket]['pids']));
            }
        }
    });

    //var checkAPITimeout = null;

    /*function checkAPI(port) {
        //console.log(`localhost:${port}/_admin/v1/liveness`);
        request(`http://localhost:${port}/_admin/v1/liveness`, function (error, response, body) {
            var JSONbody = JSON.parse(body);
            //console.log(JSON.stringify(JSONbody));

            var draining = JSONbody['livenesses'].filter(instance => instance['draining']).length;

            if (draining == 0) {
                //console.log('no draining!');
                var new_instance_proc = child_process.spawn('bash-scripts/start-instance.sh', ['-p', sessions[socket]['pg_port']]);

                new_instance_proc.stdout.on('data', function(data) {
                    var newPid = `${data}`.trim()
                    sessions[socket]['pids'].push(newPid);
                    console.log(JSON.stringify(sessions[socket]['pids']));
                    sessions[socket]['spawned'] += 1;
                    io.emit('new_roach', {'roach_id' : newPid});
                });
            }

<<<<<<< HEAD
            io.emit('liveness_update', {'draining': draining});
            checkAPITimeout = setTimeout(function() { checkAPI(port) }, 2000);
=======
            io.emit('liveness_update', {'body': body, 'draining': draining});
            checkAPITimeout = setTimeout(function() { checkAPI(port) }, parseInt(2000 * (sessions[socket].spawned - sessions[socket].dead)) );
>>>>>>> stable3
        });
    }*/



    socket.on('kill_cockroach', function(msg) {
        try {
            process.kill(msg['pid'], 'SIGKILL');
            sessions[socket]['dead'] += 1;
            if (sessions[socket].dead / sessions[socket].spawned >= 0.1) {
                //console.log('no draining!');
                var new_instance_proc = child_process.spawn('bash-scripts/start-instance.sh', ['-p', sessions[socket]['pg_port']]);

                new_instance_proc.stdout.on('data', function(data) {
                    var newPid = `${data}`.trim()
                    sessions[socket]['pids'].push(newPid);
                    console.log(JSON.stringify(sessions[socket]['pids']));
                    sessions[socket]['spawned'] += 1;
                    io.emit('new_roach', {'roach_id' : newPid});
                });
            }
        } catch(e) {}
    });

    socket.on('disconnect', function() {
        childproc.kill();

        /*if (checkAPITimeout != null) {
            clearTimeout(checkAPITimeout);
        }*/

        for (i in sessions[socket]['pids']) {
            try {
                process.kill(sessions[socket]['pids'][i], 'SIGKILL');
            } catch (e) {
                console.log("Could not kill pid " + sessions[socket]['pids'][i]);
            }
        }
        process.kill(sessions[socket]['special_pid'], 'SIGKILL');
        sessions[socket] = undefined;
    });
});

function sendConsoleLogs(msg){
    console.log('Sending message to client');
    io.emit('console_log', {message: msg});
}

module.exports = app;

console.log(JSON.stringify(sessions));
server.listen(3000);
