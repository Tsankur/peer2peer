function joinRoom(answer)
{
	if(answer['status'])
	{
		$("#index").hide();
		$("#chatRoom").show();
		$('#roomName').html("Room : "+answer['roomName']);
	}
}
function leaveRoom(answer)
{
	if(answer['status'])
	{
		$("#index").show();
		$("#chatRoom").hide();
		for (var i = 0; i < peerConnections.length; i++)
		{
			peerConnections[i].close();
		}
		peerConnections = [];
	}
}
var peerConnections = [];
var myId = 0;
function handleConnection(conn)
{
	peerConnections.push(conn);
	conn.on('open', function() {
		console.log('peer2peer connection opened');
		conn.on('data', receiveDataFromPeer);
		conn.send(myId+' dit : Salut!');
	});
}
function receiveDataFromPeer(data)
{
	console.log("datas received : ");
	console.log(data);
	$("#messages").prepend('<p>'+data+'</p>');
}
// extends three.js matrix4

THREE.Matrix4.prototype.front = function()
{
	var te = this.elements;
	return new THREE.Vector3(te[0], te[1], te[2]);
}
THREE.Matrix4.prototype.left = function()
{
	var te = this.elements;
	return new THREE.Vector3(te[4], te[5], te[6]);
}
THREE.Matrix4.prototype.up = function()
{
	var te = this.elements;
	return new THREE.Vector3(te[8], te[9], te[10]);
}

// tree.js affichage
var renderer = null;
var ship = null;
var moveForward = false;
var turnLeft = false;
var turnRight = false;
function CreateShip()
{
	var shipShape = new THREE.Shape();
	shipShape.moveTo( -10,-5 );
	shipShape.lineTo( 10, 0 );
	shipShape.lineTo( -10, 5 );
	shipShape.lineTo( -10, -5 );
	var shipGeom = new THREE.ShapeGeometry( shipShape );
	return new THREE.Mesh( shipGeom, new THREE.MeshBasicMaterial( { color: 0xff0000 } ) ) ;	scene.add( rectMesh );
}
function UpdateObject()
{
	if(moveForward)
	{
		ship.position.add(ship.matrix.front().multiplyScalar(20/6));
	}
	if(turnLeft)
	{	
		ship.rotation.z += 0.05;
	}
	if(turnRight)
	{	
		ship.rotation.z -= 0.05;
	}
}
function lauchGame()
{
	var scene = new THREE.Scene();
	var camera = new THREE.OrthographicCamera( -400, 400, 300,-300, 1, 1000 );
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( 800, 600 );
	$("#gameHolder").append( renderer.domElement );
	scene.add(camera);
	/*var geometry = new THREE.BoxGeometry( 100, 100, 100 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );*/
	camera.position.z = 500;
	ship = CreateShip();
	scene.add(ship);
	
	function renderGame()
	{
		if(renderer)
		{
			UpdateObject();
			requestAnimationFrame( renderGame );
			renderer.render( scene, camera );
		}
	}
	renderGame();
	$("#index").hide();
	$("#game").show();
}
function quitGame()
{
	renderer = null;
	$("#gameHolder").empty();
	$("#index").show();
	$("#game").hide();
}
$(function(){
	$("#chatRoom").hide();
	$("#game").hide();
	var socket = io.connect('http://78.236.192.198:2301');
	var peer = new Peer(null, {host: '78.236.192.198', port: 2302, path: '/'});
	peer.on('open', function(id){
		myId = id,
		console.log(id);
		peer.on('connection', handleConnection);
		peer.on('error', function(err) {
			console.log('error : '+err.type);
		});
	});
	socket.on('connect', function(){
		console.log("connecter");
	});
	socket.on('message', function(message){
		console.log(message);
	});
	socket.on('peerJoin', function(peerId){
		console.log('peerId : '+peerId);
		handleConnection(peer.connect(peerId));
	});
	socket.on('peerLeave', function(peerId){
		console.log('peerId : '+peerId);
		for (var i = peerConnections.length - 1; i >= 0; i--)
		{
			if(peerConnections[i].peer == peerId)
			{
				peerConnections[i].close();
				var conn = peerConnections.splice(i, 1);
				break;
			}
		};
	});
	socket.on('rooms', function(rooms){
		console.log(rooms);
		var roomElem = $("#rooms");
		roomElem.empty();
		for(var room in rooms)
		{
			roomElem.append('<li roomName="'+room+'">'+room+' ('+rooms[room]+')</li>')
		}
		$("li[roomName]").on('click', function(e){
			socket.emit('joinRoom', $(this).attr('roomName'), myId, joinRoom);
		});
	});
	$("#createRoom").on('click', function(e){
		var roomName = $("#createRoomName").val();
		if(roomName.length > 3)
		{
			socket.emit('createRoom', roomName, myId, joinRoom);
		}
	});
	$("#leaveRoom").on('click', function(e){
		socket.emit('leaveRoom', leaveRoom);
	});
	$("#newMessage").on('keyup', function(e){
		if(e.keyCode == 13)
		{
			var message = $("#newMessage").val();
			if(message.length > 0)
			{
				for (var i = 0; i < peerConnections.length; i++)
				{
					peerConnections[i].send($("#newMessage").val());
				}
				$("#messages").prepend('<p>'+message+'</p>');
				$("#newMessage").val('');
			}
		}
	});
	$("#lauchGame").on('click', lauchGame);
	$("#leaveGame").on('click', quitGame);
	$(document).on('keydown', function(e){
		if(e.keyCode == 38)
		{
			moveForward = true;
		}
		else if(e.keyCode == 37)
		{
			turnLeft = true;
		}
		else if(e.keyCode == 39)
		{
			turnRight = true;
		}
	});
	$(document).on('keyup', function(e){
		if(e.keyCode == 38)
		{
			moveForward = false;
		}
		else if(e.keyCode == 37)
		{
			turnLeft = false;
		}
		else if(e.keyCode == 39)
		{
			turnRight = false;
		}
	});
});