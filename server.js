var connectedCount = 0;
var roomList = {};

var express = require('express');
var app = express();
var server = app.listen(2301, function(){
	console.log("starting server on port 2301");
});
var io = require('socket.io')(server);
app.use(express.static('public'));
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

var PeerServer = require('peer').PeerServer({port: 2302, path: '/'});

PeerServer.on('connection', function (id) {
	/*console.log(id);*/
});
function leaveRoom(socket)
{
	if(socket.roomName !== undefined && Object.keys(roomList).indexOf(socket.roomName) != -1)
	{
		roomList[socket.roomName]--;
		if(roomList[socket.roomName] == 0)
		{
			delete roomList[socket.roomName];
			console.log('room : '+socket.roomName+'deleted');
		}
		socket.to('/index').emit('rooms', roomList);
	}
}
// Chargement de socket.io
// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
	console.log('Un client s\'est connecté depuis l\'adresse : ' + socket.client.conn.remoteAddress);
	connectedCount++;
	socket.emit('message', 'Vous êtes bien connecté !');
	socket.emit('rooms', roomList);
	socket.join('/index');
	socket.on('disconnect', function () {
		connectedCount--;
		leaveRoom(socket);
		console.log('Un client s\'est déconnecté depuis l\'adresse : ' + this.client.conn.remoteAddress);
	});
	socket.on('createRoom', function (roomName, id, callback) {
		if(Object.keys(roomList).indexOf(roomName) == -1)
		{
			socket.leave('/index');
			socket.join('/'+roomName);
			roomList[roomName] = 1;
			socket.roomName = roomName;
			socket.peerID = id;
			socket.to('/index').emit('rooms', roomList);
			console.log('création d\'une room ' + roomName);
			callback({'status':1, 'roomName':roomName});
		}
		else
		{
			console.log("room "+roomName+" already exist");
			callback({'status':0, 'roomName':roomName});
		}
	});
	socket.on('joinRoom', function (roomName, id, callback) {
		if(Object.keys(roomList).indexOf(roomName) != -1)
		{
			socket.leave('/index');
			socket.join('/'+roomName);
			roomList[roomName]++;
			socket.roomName = roomName;
			socket.peerID = id;
			socket.to('/'+roomName).emit('peerJoin', id);
			socket.to('/index').emit('rooms', roomList);
			callback({'status':1, 'roomName':roomName});
		}
		else
		{
			console.log("room "+roomName+" doesn't exist");
			callback({'status':0, 'roomName':roomName});
		}
	});
	socket.on('leaveRoom', function (callback) {
		console.log(socket.peerID+' leave room');
		if(socket.roomName !== undefined && Object.keys(roomList).indexOf(socket.roomName) != -1)
		{
			socket.join('/index');
			socket.leave('/'+socket.roomName);
			leaveRoom(socket);
			socket.to('/'+socket.roomName).emit('peerLeave', socket.peerID);
			delete socket.roomName;
			delete socket.peerID;
			callback({'status':1});
		}
		else
		{
			console.log("client not in a room");
			callback({'status':0});
		}
	});
});