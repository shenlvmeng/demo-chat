$().ready(function(){
	//redesign scrollbar
	$('html').perfectScrollbar();
	$("#user_list").perfectScrollbar();
	$("#chat_content").perfectScrollbar();
	$("#say_something textarea").perfectScrollbar();
	var socket = io();
	var name = Cookies.get('user');
	var to = "all";
	socket.emit('online', {name: name});
	$("#user_id").html(name);
	$("#status").html("在线").attr("class","online");
	socket.on('online', function(data){
		console.log(data.name+" is online.");
		if(data.name != name){
			var text = '<div style="color:#f00">SYSTEM(' + now() + '): ' + '用户 ' + data.name + ' 上线了</div>';
		} else {
			var text = '<div style="color:#f00">SYSTEM(' + now() + '): 你进入了聊天室！</div>';
		}
		if("all" == to){
			$("#chat_content").append(text);
		}
		refreshUsers(data.users);
	});
	socket.on('chat', function(data){
		if(data.to == "all" && to == "all"){
			$("#chat_content").append('<div>' + data.from + '(' + now() + ')对 所有人 说：<br/>' + data.msg + '</div><br />');
		} else if(data.to == name) {
			//TODO:some notification
			$("#chat_content").append('<div style="color:#00f" >' + data.msg + '</div>');
		}
	});
	socket.on('offline', function(data){
		console.log(data.name+" is offline.");
		var text = '<div style="color:#f00">SYSTEM(' + now() + '): ' + '用户 ' + data.name + ' 下线了！</div>';
		refreshUsers(data.users);
		if("all" == to){
			$("#chat_content").append(text);
		} else if(data.name == to) {
			to = "all";
			$("#user_list li:first-child").trigger("click");
		}
	});
	socket.on('disconnect', function(){
		var text = '<div class="screen">连接服务器失败!</div>';
		$('body').empty().css("background-color","#111").append(text);
	});
	socket.on('reconnect', function(){
		location.reload();
	});

	//refrensh online user
	function refreshUsers(users){
		$('#user_list ul').empty();
		var len = 0;
		$("#user_info img").attr("src", "pic/pic"+(parseInt(users[name], 16)+1)+".jpg");
		$('#user_list ul').append('<li title="all" class="active"><img src="pic/room.jpg" /><div class="user_name">所有人</div></li>')
		for(var i in users){
			$('#user_list ul').append("<li title='"+i+"'><img src='pic/pic"+(parseInt(users[i], 16)+1)+".jpg' /><div class='user_name'>"+i+"</div></li>");
			len++;
		}
		if("all" == to){
			$("#title").html("大厅 ("+len+")");
		}
		$("#user_list ul > li").click(function(){
			if($(this).attr('title') != name){
				to = $(this).attr('title');
				$("#user_list ul > li").removeClass('active');
				$(this).addClass('active');
				retarget(len);
			}
		});
	}

	//refresh chat target
	function retarget(len){
		$("#title").html(to == "all" ? "大厅 ("+len+")" : to+" (2)");
		$("#chat_content").empty();
	}

	//get current time
	function now(){
		var date = new Date();
		var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ":" + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
		return time;
	}

	$("#action").click(function(){
		var msg = $("#say_something textarea").val();
		if(msg.trim() == "") return false;
		//append message in chat field
		$("#chat_content").append("<div>"+msg+"</div>");
		socket.emit('chat', {from: name, to: to, msg: msg});
		//clear input field
		$("#say_something textarea").val("").focus();
	});

	$(window).keydown(function (e) {
		if (e.keyCode == 116) {
			if (!confirm("刷新将会清除所有聊天记录，确定要刷新么？")) {
				e.preventDefault();
			}
		}
	});
});