var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var child_process = require('child_process');

var index = require('./routes/index');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var uuidV4 = require('uuid/v4');

sessions = {};
sessions.asdf = 'asdf';

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
            'pids': [] // populate with pids
        };
    }

    var childproc = child_process.spawn('bash-scripts/start-cluster.sh', ['-n', '20']);

    childproc.stdout.on('data', (data) => {
        sessions[socket]['pids'].push(`${parseInt(data)}`);
        console.log(JSON.stringify(sessions[socket]['pids']));
    });

    io.emit('give_session', { 'id': uuid });

    socket.on('kill_cockroach', function(msg) {
        // TODO -- call script to violently murder a cockroachDB instance
    });

    socket.on('disconnect', function() {
        childproc.kill();
        for (i in sessions[socket]['pids']) {
            process.kill(sessions[socket]['pids'][i], 'SIGKILL');
        }
    });
});

module.exports = app;

console.log(JSON.stringify(sessions));
server.listen(3000);
