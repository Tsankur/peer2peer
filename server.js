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
			console.log('room : '+socket.roomName+' deleted');
		}
		socket.emit('rooms', roomList);
		socket.to('/index').emit('rooms', roomList);
	}
}

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
	socket.on('setId', function (id, callback)
	{
		socket.peerID = id;
		console.log('Client send his id :' + socket.peerID);
		callback({'status':1});
	});
	socket.on('createRoom', function (roomName, callback) {
		if(Object.keys(roomList).indexOf(roomName) == -1)
		{
			socket.leave('/index');
			socket.join('/room/'+roomName);
			roomList[roomName] = 1;
			socket.roomName = roomName;
			socket.to('/index').emit('rooms', roomList);
			console.log('Création d\'une room ' + roomName + ' par le client : ' + socket.peerID);
			callback({'status':1, 'roomName':roomName});
		}
		else
		{
			console.log("room "+roomName+" already exist");
			callback({'status':0, 'roomName':roomName});
		}
	});
	socket.on('joinRoom', function (roomName, callback) {
		if(Object.keys(roomList).indexOf(roomName) != -1)
		{
			socket.leave('/index');
			socket.join('/room/'+roomName);
			roomList[roomName]++;
			socket.roomName = roomName;
			socket.to('/room/'+roomName).emit('peerJoin', socket.peerID);
			socket.to('/index').emit('rooms', roomList);
			console.log('Le client : ' + socket.peerID +' a rejoin la room ' + roomName);
			callback({'status':1, 'roomName':roomName});
		}
		else
		{
			console.log("room "+roomName+" doesn't exist");
			callback({'status':0, 'roomName':roomName});
		}
	});
	socket.on('leaveRoom', function (callback) {
		if(socket.roomName !== undefined && Object.keys(roomList).indexOf(socket.roomName) != -1)
		{
			socket.join('/index');
			socket.leave('/room/'+socket.roomName);
			console.log('Le client : ' + socket.peerID +' a quitter la room ' + socket.roomName);
			leaveRoom(socket);
			socket.to('/room/'+socket.roomName).emit('peerLeave', socket.peerID);
			delete socket.roomName;
			callback({'status':1});
		}
		else
		{
			console.log("client not in a room");
			callback({'status':0});
		}
	});
	socket.on('joinGame', function (callback) {
		socket.leave('/index');
		socket.join('/game');
		socket.to('/game').emit('peerJoin', socket.peerID);
		console.log('Le client : ' + socket.peerID +' est entrer en jeu');
		callback({'status':1});
	});
	socket.on('leaveGame', function (callback) {
		socket.join('/index');
		socket.leave('/game');
		socket.to('/game').emit('peerLeave', socket.peerID);
		socket.emit('rooms', roomList);
		console.log('Le client : ' + socket.peerID +' a quitté le jeu');
		callback({'status':1});
	});
});