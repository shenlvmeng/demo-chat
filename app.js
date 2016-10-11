var path = require('path');
var http = require('http');

var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    morgan = require('morgan');

var router = require('./routes');

var app = express();
//online users
var users = {};
var online_users = {};

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

router(app, users);

var server = http.createServer(app);
var io = require('socket.io').listen(server);
io.on('connection', function(socket){
	console.log('A new user comes in.');
	//somebody online
	socket.on('online', function(data){
		//to mark and indentify sockets
		socket.name = data.name;
		//if exist, revise its state and push passkey into {online_users} for avatar.
		if (!online_users[data.name]) {
			online_users[data.name] = users[data.name].substr(-1);
		}
		console.log(online_users);
		//broadcast to all users
		io.emit('online', {users: online_users, name: data.name});
	});
	//chat message
	socket.on('chat', function(data){
		data.imgKey = users[data.from].substr(-1) || "0";
		if(data.to == "all"){
			socket.broadcast.emit('chat', data);
		} else {
			for(var i in io.sockets.sockets){
				if(io.sockets.sockets[i].name == data.to){
					console.log("Send ok!");
					io.sockets.sockets[i].emit('chat', data);
					break;
				}
			}
		}
	});
	//somebody offline
	socket.on('disconnect', function(){
		console.log(socket.name+" comes out.");
		if(online_users[socket.name]){
			delete online_users[socket.name];
			socket.broadcast.emit('offline', {users: online_users, name: socket.name});
		}
	});
})

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});