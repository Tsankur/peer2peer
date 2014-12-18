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
var idSet = false;
var inGame = false;
function handleConnection(conn)
{
	peerConnections.push(conn);
	conn.on('open', function() {
		console.log('peer2peer connection opened');
		conn.on('data', receiveDataFromPeer);
		if(!inGame)
		{
			conn.send('Salut!');
		}
		else
		{
			if(ship)
			{
				conn.send(JSON.stringify({'type': 'createShip', 'position': ship.position, 'rotation': ship.rotation.z}));
			}
		}
	});
}
function receiveDataFromPeer(data)
{
	/*console.log("datas received : ");
	console.log(data);*/
	if(!inGame)
	{
		$("#messages").prepend('<p>'+data+'</p>');
	}
	else
	{
		if(scene)
		{
			handleGameMessage(data, this);
		}
	}
}
function handleGameMessage(data, conn)
{
	var message = JSON.parse(data);
	switch(message.type)
	{
		case "createShip":
		{
			var newShip = CreateShip(new BABYLON.Color3(1, 0, 0));
			newShip.position = new BABYLON.Vector3(message.position.x, message.position.y, message.position.z);
			newShip.rotation.z = message.rotation;
			conn.ship = newShip;
			break;
		}
		case "updateShip":
		{
			if(conn.ship !== undefined)
			{
				conn.ship.position = new BABYLON.Vector3(message.position.x, message.position.y, message.position.z);
				conn.ship.rotation.z = message.rotation;
			}
			break;
		}
	}
}

// BABYLON.js affichage
var engine = null;
var ship = null;
var moveForward = false;
var turnLeft = false;
var turnRight = false;
var shipPrefab = null;
var shipID = 0;
var camera = null;
var scene = null;
var frameCount = 0;
function createTriangle(p1, p2, p3, name)
{
	var triangle = new BABYLON.Mesh(name, scene);

	var indices = [0,1,2];
	var positions = [p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z];
	var normals = [0,0,1 ,0,0,1 ,0,0,1];
	triangle.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions, true);
	triangle.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals, true);
	
	triangle.setIndices(indices);

	return triangle;
}
function CreateShipPrefab()
{
	shipPrefab = createTriangle(new BABYLON.Vector3(-20,-10,0), new BABYLON.Vector3(20,0,0), new BABYLON.Vector3(-20,10,0), "shipPrefab", scene);
	var newReactor = createTriangle(new BABYLON.Vector3(-20,-4,0), new BABYLON.Vector3(-10,0,0), new BABYLON.Vector3(-20,4,0), "shipReactorPrefab", scene);
	shipPrefab.material = new BABYLON.StandardMaterial("shipPrefabColor", scene);
	newReactor.material = new BABYLON.StandardMaterial("shipReactorPrefabColor", scene);
	newReactor.material.diffuseColor = new BABYLON.Color3(1.0, 1.0, 0);
	newReactor.position.z = -0.1;
	newReactor.parent = shipPrefab;
	shipPrefab._isEnabled = false;
}
function CreateShip(shipColor)
{
	if(shipPrefab)
	{
		var newShip = shipPrefab.clone("ship"+shipID, null, false);
		shipID++;
		newShip.material = new BABYLON.StandardMaterial("shipColor"+shipID, scene);
		newShip.material.diffuseColor = shipColor;
		newShip._isEnabled = true;
		return newShip;
	}
	return null;
}
function UpdateObjects()
{
	if(ship)
	{
		frameCount++;
		if(moveForward)
		{
			ship.translate(BABYLON.Axis.X, 200/60, BABYLON.Space.LOCAL);
			$("#positionText").html("x : "+parseInt(ship.position.x)+" y : "+parseInt(ship.position.y));
			
		}
		if(turnLeft)
		{	
			ship.rotation.z += 0.05;
		}
		if(turnRight)
		{	
			ship.rotation.z -= 0.05;
		}
		if(frameCount >= 5)
		{
			frameCount = 0;
			for (var i = 0; i < peerConnections.length; i++)
			{
				peerConnections[i].send(JSON.stringify({'type': 'updateShip', 'position': ship.position, 'rotation': ship.rotation.z}));
			}
		}
	}
}
function UpdateCamera()
{
	if(camera)
	{
		var shipPos = new BABYLON.Vector3(ship.position.x, ship.position.y, -500);
		camera.position = camera.position.add(shipPos.subtract(camera.position).scale(0.1));
	}
}

//game lauch and quit
function launchGame(answer)
{
	if(answer['status'])
	{
		inGame = true;
		$("#index").hide();
		$("#game").show();
		var canvas = document.getElementById("babylonRenderer");
		engine = new BABYLON.Engine(canvas, true)
		scene = new BABYLON.Scene(engine);
		scene.clearColor = new BABYLON.Color3(0, 0, 0);
		camera = new BABYLON.FreeCamera("followCam", new BABYLON.Vector3(0,0,-50), scene);
		camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		camera.orthoTop = 300;
		camera.orthoBottom = -300;
		camera.orthoLeft = -400
		camera.orthoRight = 400;

		var background = BABYLON.Mesh.CreatePlane("plane", "10000", scene);
		background.position.z = 50;
	    var materialBackground = new BABYLON.StandardMaterial("texturePlane", scene);
	    materialBackground.emissiveTexture = new BABYLON.Texture("./images/star-space-tile.jpg", scene);
	    materialBackground.emissiveTexture.uScale = 40.0;
	    materialBackground.emissiveTexture.vScale = 40.0;
	    materialBackground.backFaceCulling = false;//Allways show the front and the back of an element
		background.material = materialBackground;

		camera.setTarget(BABYLON.Vector3.Zero());
		CreateShipPrefab();
		//camera.attachControl(canvas, false);
		var light = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(0, 0, -1), scene);
		light.diffuse = new BABYLON.Color3(1, 1, 1);
		ship = CreateShip(new BABYLON.Color3(0, 1, 0));

		engine.runRenderLoop(function () {
			UpdateObjects();
			UpdateCamera();
			scene.render();
		});
		// Watch for browser/canvas resize events
		window.addEventListener("resize", function () {
			engine.resize();
		});
	}
}
function quitGame(answer)
{
	if(answer['status'])
	{
		inGame = false;
		engine.stopRenderLoop();
		engine.dispose();
		$("#index").show();
		$("#game").hide();
	}
}
$(function(){
	$("#chatRoom").hide();
	$("#game").hide();
	var socket = io.connect('http://78.236.192.198:2301');
	var peer = new Peer(null, {host: '78.236.192.198', port: 2302, path: '/'});
	/*var socket = io.connect('http://localhost:2301');
	var peer = new Peer(null, {host: 'localhost', port: 2302, path: '/'});*/
	peer.on('open', function(id){
		myId = id,
		console.log(id);
		socket.emit('setId', id, function(answer){
			if(answer['status'])
			{
				idSet = true;
			}
		});
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
		console.log('peer Join Id : '+peerId);
		handleConnection(peer.connect(peerId));
	});
	socket.on('peerLeave', function(peerId){
		console.log('peer Leave Id : '+peerId);
		for (var i = peerConnections.length - 1; i >= 0; i--)
		{
			if(peerConnections[i].peer == peerId)
			{
				peerConnections[i].close();
				if(peerConnections[i].ship !== undefined)
				{
					peerConnections[i].ship.dispose(false);
				}
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
			socket.emit('joinRoom', $(this).attr('roomName'), joinRoom);
		});
	});
	$("#createRoom").on('click', function(e){
		if(idSet)
		{
			var roomName = $("#createRoomName").val();
			if(roomName.length > 3)
			{
				socket.emit('createRoom', roomName, joinRoom);
			}
		}
	});
	$("#leaveRoom").on('click', function(e){
		if(idSet)
		{
			socket.emit('leaveRoom', leaveRoom);
		}
	});
	$("#newMessage").on('keyup', function(e){

		if(idSet)
		{
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
		}
	});
	$("#launchGame").on('click', function(){
		if(idSet)
		{
			socket.emit('joinGame', launchGame);
		}
	});
	$("#leaveGame").on('click', function(){
		if(idSet)
		{
			socket.emit('leaveGame', quitGame);
		}
	});
	$(document).on('keydown', function(e){

		if(inGame)
		{
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
		}
	});
	$(document).on('keyup', function(e){

		if(inGame)
		{
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
		}
	});
});