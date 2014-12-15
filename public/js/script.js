function joinRoom(answer)
{
	if(answer['status'])
	{
		$("#index").hide();
		$("#chatRoom").show();
		$('#roomName').html("Room : "+answer['roomName']);
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
$(function(){
	$("#chatRoom").hide();
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
	socket.on('connectedCount', function(message){
		console.log('connectedCount : '+message);
	});
	socket.on('peerId', function(peerId){
		console.log('peerId : '+peerId);
		handleConnection(peer.connect(peerId));
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
});