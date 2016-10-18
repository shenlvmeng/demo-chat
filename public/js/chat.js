$().ready(function(){
	var socket = io();
	var name = Cookies.get('user');
	var to = "all";
	var isQuiet = false;
	//for now()
	var timenow = 0;
	var timemark = null;
	//for textarea hotkey
	var isCtrl = false;
	//redesign scrollbar
	var sc = appendScrollbar($("#chat_content"), "c");
	var su = appendScrollbar($("#user_list"), "u");
	var ss = appendScrollbar($("#say_something"), "s");

	sessionStorage.setItem("all", "[]");
	socket.emit('online', {name: name});
	$("#user_id").html(name);
	$("#status").attr("class","online");
	socket.on('online', function(data){
		console.log(data.name+" is online.");
		timemark = now();
		if(timemark){
			$("#chat_content").append("<div class='sys'>"+timemark+"</div>");
		}
		if(data.name != name){
			var text = '<div class="sys">用户 ' + data.name + ' 上线了</div>';
		} else {
			var text = '<div class="sys">你进入了聊天室！</div>';
		}
		if("all" == to){
			$("#chat_content").append(text);
		}
		$("#qu").html(Object.keys(data.q_users).length);
		refreshUsers(data.users);
		quietusersMarker(data.q_users);
	});
	socket.on('chat', function(data){
		timemark = now();
		if(timemark){
			$("#chat_content").append("<div class='sys'>"+timemark+"</div>");
		}
		//set left p height because of float:left
		var k = (parseInt(data.imgKey, 16)+1) || 1;
		var p_q = $("<p/>").html('<img src="pic/pic'+k+'.jpg" class="avatar-l"/><div class="others"><div class="arrow-left"></div><div class="arrow-left-after"></div><pre>' + data.msg + '</pre></div>');

		if((data.to == name && to == data.from) || (data.to == "all" && to == "all")){
			if(to == "all"){
				p_q.find("div.others").before("<div class='avatar-name'>"+data.from+"</div>");
			}
			$("#chat_content").append(p_q);
			updateScrollbar("c");
		} else {
			//use sessionStorage to store unread message
			if(data.to == "all"){
				sessionStorage.setItem("all", JSON.stringify(JSON.parse(sessionStorage.getItem("all")).concat({from: data.from, msg: data.msg, time: now(1), k: k})));
			} else {
				if(sessionStorage.getItem(data.from) !== null){
					sessionStorage.setItem(data.from, JSON.stringify(JSON.parse(sessionStorage.getItem(data.from)).concat({msg: data.msg, time: now(1), k: k})));
				} else {
					sessionStorage.setItem(data.from, JSON.stringify([{msg: data.msg, time: now(1), k: k}]));
				}
			}
		}
		//extra height: name--10px(content) + 5px(margin), div.others--{content height} + 2px(border) + 10px(padding)
		p_q.height(p_q.find("div.others").height() + 27 || 57);
	});
	socket.on('offline', function(data){
		console.log(data.name+" is offline.");
		timemark = now();
		if(timemark){
			$("#chat_content").append("<div class='sys'>"+timemark+"</div>");
		}
		var text = '<div class="sys">用户 ' + data.name + ' 下线了</div>';
		refreshUsers(data.users);
		quietusersMarker(data.q_users);
		$("#qu").html(Object.keys(data.q_users).length);
		if("all" == to){
			$("#chat_content").append(text);
		} else if(data.name == to) {
			to = "all";
			$("#user_list li:first-child").trigger("click");
		}
	});
	socket.on('quiet', function(data){
		$("#qu").html(data.len);
		if(data.name == to){
			$("#user_list li:first-child").trigger("click");
		}
		$("#user_list ul li").filter(function(){
			return $(this).find(".user_name").html() == data.name;
		}).unbind("click").find(".user_name").addClass("quiet");
	});
	socket.on('wakeup', function(data){
		$("#qu").html(data.len);
		$("#user_list ul li").filter(function(){
			return $(this).find(".user_name").html() == data.name;
		}).click(function(){
			if($(this).attr('title') != name){
				to = $(this).attr('title');
				$("#user_list ul > li").removeClass('active');
				$(this).addClass('active');
				retarget(2);
			}
		}).find(".user_name").removeClass("quiet");
	})
	socket.on('disconnect', function(){
		var text = '<div class="screen">连接服务器失败!</div>';
		$('body').empty().css("background-color","#111").append(text);
	});
	socket.on('reconnect', function(){
		location.reload();
	});

	//mark quiet users
	function quietusersMarker(users){
		for(var i in users){
			$("#user_list ul li").filter(function(){
				return $(this).find(".user_name").html() == users[i];
			}).unbind("click").find(".user_name").addClass("quiet");
		}
	}
	//refrensh online user
	function refreshUsers(users){
		$('#user_list ul').empty();
		var len = 0;
		$("#user_info img").attr("src", "pic/pic"+(parseInt(users[name], 16)+1)+".jpg");
		$('#user_list ul').append('<li title="all" class="active"><img src="pic/room.jpg" /><div class="user_name">所有人</div></li>');
		for(var i in users){
			$('#user_list ul').append("<li title='"+i+"'><img src='pic/pic"+(parseInt(users[i], 16)+1)+".jpg' /><div class='user_name'>"+i+"</div></li>");
			len++;
		}
		if("all" == to){
			$("#title").html("大厅 ("+len+")");
		}
		$("#on").html(len);
		$("#user_list ul > li").click(function(){
			if($(this).attr('title') != name){
				to = $(this).attr('title');
				$("#user_list ul > li").removeClass('active');
				$(this).addClass('active');
				retarget(len);
			}
		});
		updateScrollbar("u");
	}

	//refresh chat target
	function retarget(len){
		var q_p, timestring, date;
		$("#title").html(to == "all" ? "大厅 ("+len+")" : to+" (2)");
		$("#chat_content .sys").remove();
		$("#chat_content p").remove();
		timenow = 0;
		if(sessionStorage.getItem(to)){
			var log = JSON.parse(sessionStorage.getItem(to));
			//append each div to #chat_content
			log.forEach(function(l){
				date = new Date();
				if(l.time - timenow >= 60){
					if(timenow == 0){
						timestring = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes());
					} else {
						timestring = date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes());
					}
					$("#chat_content").append("<div class='sys'>"+timestring+"</div>");
				}
				timenow = l.time;
				q_p = $("<p/>").html('<img src="pic/pic'+l.k+'.jpg" class="avatar-l"/><div class="others"><div class="arrow-left"></div><div class="arrow-left-after"></div><pre>' + l.msg + '</pre></div>');
				if(to == "all"){
					q_p.find("div.others").before("<div class='avatar-name'>"+l.from+"</div>");
				}
				$("#chat_content").append(q_p);
				q_p.height(q_p.find("div.others").height() + 27 || 57);
			});
			sessionStorage.setItem(to, "[]");
		}
		updateScrollbar("c");
	}

	//get current time
	function now(force){
		if(force == undefined) force = false;
		var date = new Date();
		var stamp = Math.floor(date.getTime()/1000);
		if(force){
			return stamp;
		}
		if(stamp - timenow < 60){
			timenow = stamp;
			return false;
		}
		if($("#chat_content .sys").length == 0){
			var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes());
		} else {
			var time = date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes());
		}
		timenow = stamp;
		return time;
	}

	//change status
	$("#status").click(function(){
		if(!isQuiet){
			if(confirm("确认切换到免打扰状态（只接收大厅消息和系统消息）")){
				socket.emit("quiet", {name: name});
				isQuiet = true;
				$("#qu").html(parseInt($("#qu").html()) + 1);
				$("#status").html("免打扰 <span>▼</span>").attr({class: "offline", title: "点击可切换为在线状态"});
			}
		} else {
			socket.emit("wakeup", {name: name});
			isQuiet = false;
			$("#qu").html(Math.max(0, parseInt($("#qu").html()) - 1));
			$("#status").html("在线 <span>▼</span>").attr({class: "online", title: "点击可切换为在线状态"});
		}
	});

	$("#action").click(function(){
		var msg = $("#say_something textarea").val();
		if(msg.trim() == "") return false;
		//append message in chat field
		timemark = now();
		if(timemark){
			$("#chat_content").append("<div class='sys'>"+timemark+"</div>");
		}
		//set right p height because of float:right
		var p = $("<p/>").html('<img src="pic/empty.jpg" class="avatar-r" /><div class="self"><div class="arrow-right"></div><pre>' + msg + '</pre></div>');
		$("#chat_content").append(p);
		p.find("img").attr("src", $("#user_info img").attr("src"));
		//extra height: div.self--{content height} + 10px(padding)
		p.height(p.find("div.self").height() + 10 || 40);
		updateScrollbar("c");

		if(!isQuiet){
			socket.emit('chat', {from: name, to: to, msg: msg});
		}
		//clear input field
		$("#say_something textarea").val("").focus();
		updateScrollbar("s");
	});

	//simulate scroll bar
	sc.bind('wheel', function(e){
		if (e.originalEvent.deltaY < 0) {
        	sc.scrollTop(Math.max(sc.scrollTop() + e.originalEvent.deltaY), 0);
	    }
	    else {
	        sc.scrollTop(Math.min(sc.scrollTop() + e.originalEvent.deltaY), sc.prop("scrollHeight") - sc.prop("clientHeight"));
	    }
	    sc.find(".scrollbar").css("margin-top", sc.scrollTop() * 460 / sc.prop("scrollHeight"));
	});
	su.bind('wheel', function(e){
		if (e.originalEvent.deltaY < 0) {
        	su.scrollTop(Math.max(su.scrollTop() + e.originalEvent.deltaY), 0);
	    }
	    else {
	        su.scrollTop(Math.min(su.scrollTop() + e.originalEvent.deltaY), su.prop("scrollHeight") - su.prop("clientHeight"));
	    }
	    su.find(".scrollbar").css("margin-top", su.scrollTop() * 665 / su.prop("scrollHeight"));
	});
	var sst = ss.find("textarea");
	sst.bind('wheel', function(e){
		if (e.originalEvent.deltaY < 0) {
        	sst.scrollTop(Math.max(sst.scrollTop() + e.originalEvent.deltaY / 2), 0);
	    }
	    else {
	        sst.scrollTop(Math.min(sst.scrollTop() + e.originalEvent.deltaY / 2), sst.prop("scrollHeight") - sst.prop("clientHeight"));
	    }
	    ss.find(".scrollbar").css("margin-top", sst.scrollTop() * 132 / sst.prop("scrollHeight"));
	});

	$("#say_something textarea").keydown(function(e){
		if(e.keyCode == 17){
			isCtrl = true;
			e.preventDefault();
		} else if(e.keyCode > 36 && e.keyCode < 41){
			ss.find(".scrollbar").css("margin-top", ss.find("textarea").scrollTop() * 132 / ss.find("textarea").prop('scrollHeight'));
		}
	});

	$("#say_something textarea").keyup(function(e){
		if(e.keyCode == 13){
			if(isCtrl){
				$("#say_something textarea").val(function(i, text) {
    				return text + "\r\n";
				});
				updateScrollbar("s");
			} else {
				$("#action").trigger("click");
				e.preventDefault();
			}
		} else if(e.keyCode == 17){
			isCtrl = false;
		}
	});
	$("#say_something textarea").on('input selectionchange propertychange', function(){
		updateScrollbar("s");
	})

	$(window).keydown(function (e) {
		if (e.keyCode == 116) {
			if (!confirm("刷新将会清除所有聊天记录，确定要刷新么？")) {
				e.preventDefault();
			} else {
				location.reload();
			}
		}
	});

	//update scroll height and position
	function updateScrollbar(id){
		var sh = 0;
		var ch = 0;
		if(id == "c"){
			sh = sc.prop('scrollHeight');
			ch = sc.prop('clientHeight');
			sc.find(".scrollbar").height(460 * ch / sh);
			if(sh > ch){
				sc.find(".scrollbar").css("margin-top", (sh - ch) * 460 / sh);
			} else {
				sc.find(".scrollbar").css("margin-top", sc.scrollTop() * 460 / sh);
			}
		} else if(id == "u"){
			sh = su.prop('scrollHeight');
			ch = su.prop('clientHeight');
			su.find(".scrollbar").height(665 * ch / sh);
		} else if(id == "s"){
			sh = ss.find("textarea").prop('scrollHeight');
			ch = ss.find("textarea").prop('clientHeight');
			ss.find(".scrollbar").height(132 * ch / sh);
			if(sh > ch){
				ss.find(".scrollbar").css("margin-top", (sh - ch) * 132 / sh);
			} else {
				ss.find(".scrollbar").css("margin-top", ss.find("textarea").scrollTop() * 132 / sh);
			}
		}
	}

	function appendScrollbar(container, id){
		//container is a jQuery object
		container.addClass("scrollContainer");
		//height of the field
		var c = container.prop('clientHeight');
		if(id == "c"){
			var cc = c - 20;
		} else if(id == "u") {
			var cc = c - 10;
		} else if(id == "s") {
			var cc = c - 5;
		}
		var barHeight = cc * c / container.prop('scrollHeight');
		
		container.prepend("<div class='scrollfield' style='height: "+cc+"px' data-sid='"+id+"'><div class='scrollbar' style='margin-top: 0px; height: "+Math.min(barHeight, cc)+"px'></div></div>");
		return container;
	}

	//escape string
	// function escapeRegExp(str) {
	// 	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	// }
});