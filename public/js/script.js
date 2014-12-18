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
/*
THREE.Matrix4.prototype.forward = function()
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
function CreateShip(shipColor)
{
	var shipShape = new THREE.Shape();
	shipShape.moveTo( -20,-10 );
	shipShape.lineTo( 20, 0 );
	shipShape.lineTo( -20, 10 );
	shipShape.lineTo( -20, -10 );
	var shipGeom = new THREE.ShapeGeometry( shipShape );
	var newShip = new THREE.Mesh( shipGeom, new THREE.MeshBasicMaterial( { color: shipColor } ) ) ;

	var reactorShape = new THREE.Shape();
	reactorShape.moveTo( -20,-4 );
	reactorShape.lineTo( -10, 0 );
	reactorShape.lineTo( -20, 4 );
	reactorShape.lineTo( -20, -4 );
	var reactorGeom = new THREE.ShapeGeometry( reactorShape );
	var newReactor = new THREE.Mesh( reactorGeom, new THREE.MeshBasicMaterial( { color: 0xffff00 } ) ) ;
	newShip.add(newReactor);
	newReactor.position.z = 0.1;
	return newShip;
}
function UpdateObject()
{
	if(ship)
	{
		if(moveForward)
		{
			ship.position.add(ship.matrix.forward().multiplyScalar(200/60));
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
	}
}

//game lauch and quit
function launchGame()
{
	var scene = new THREE.Scene();
	var camera = new THREE.OrthographicCamera( -400, 400, 300,-300, 1, 1000 );
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize( 800, 600 );
	$("#gameHolder").append( renderer.domElement );
	$("#gameHolder").append('<p id="positionText">x : 0 y : 0</p>');
	scene.add(camera);
	camera.position.z = 500;
	ship = CreateShip(0x00ff00);
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
}*/
// BABYLON.js affichage
var engine = null;
var ship = null;
var moveForward = false;
var turnLeft = false;
var turnRight = false;
var shipPrefab = null;
var shipID = 0;
var camera = null;
function createTriangle(p1, p2, p3, name, scene)
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
function CreateShipPrefab(scene)
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
function CreateShip(shipColor, scene)
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
function UpdateObject()
{
	if(ship)
	{
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
function launchGame()
{
	$("#index").hide();
	$("#game").show();
	var canvas = document.getElementById("babylonRenderer");
	engine = new BABYLON.Engine(canvas, true)
	var scene = new BABYLON.Scene(engine);
	scene.clearColor = new BABYLON.Color3(0, 0, 0);
	camera = new BABYLON.FreeCamera("followCam", new BABYLON.Vector3(0,0,-50), scene);
	camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
	camera.orthoTop = 300;
	camera.orthoBottom = -300;
	camera.orthoLeft = -400
	camera.orthoRight = 400;

	camera.setTarget(BABYLON.Vector3.Zero());
	CreateShipPrefab(scene);
	GenerateStars(scene);
	//camera.attachControl(canvas, false);
	var light = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(0, 0, -1), scene);
	light.diffuse = new BABYLON.Color3(1, 1, 1);
	ship = CreateShip(new BABYLON.Color3(0, 1, 0), scene);

	engine.runRenderLoop(function () {
		UpdateObject();
		UpdateCamera();
		scene.render();
	});
	// Watch for browser/canvas resize events
	window.addEventListener("resize", function () {
		engine.resize();
	});
}
function quitGame()
{
	renderer = null;
	$("#index").show();
	$("#game").hide();
}
$(function(){
	$("#chatRoom").hide();
	$("#game").hide();
	/*var socket = io.connect('http://78.236.192.198:2301');
	var peer = new Peer(null, {host: '78.236.192.198', port: 2302, path: '/'});*/
	var socket = io.connect('http://localhost:2301');
	var peer = new Peer(null, {host: 'localhost', port: 2302, path: '/'});
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
	$("#launchGame").on('click', launchGame);
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