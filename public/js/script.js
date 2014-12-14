function joinRoom(answer)
{
	if(answer['status'])
	{
		$("#index").hide();
		$("#chatRoom").show();
		$('#roomName').html("Room : "+answer['roomName']);
	}
}
$(function(){
	$("#chatRoom").hide();
	var socket = io.connect('http://localhost:80');
	socket.on('connect', function(){
		console.log("connecter");
	});
	socket.on('message', function(message){
		console.log(message);
	});
	socket.on('connectedCount', function(message){
		console.log('connectedCount : '+message);
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
		var roomName = $("#createRoomName").val();
		if(roomName.length > 3)
		{
			socket.emit('createRoom', roomName, joinRoom);
		}
	});
});