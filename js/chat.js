window.addEventListener('click',function(){
	if( event.target != slot_menu_name ){
		slot_menu.style.display = "none";
	}
});

function showmenu(){
	if( slot_menu.style.display == "none" ){
		event.stopPropagation();
	}
	var slot_id = this.id.split('_')[1];
	if( this.className == "close" || this.className == "open" ){
		socket.emit( 'room_setting', { slot : slot_id } );
	} else {
		if( me.slot + 1 == slot_id ){
			return;
		}
		slot_menu_name.innerHTML = this.innerText;
		slot_menu_friend.id = slot_id;
		if( me.slot + 1 == document.getElementsByClassName("host")[0].id.split('_')[1] ){ // 방장일경우
			slot_menu_host.id = slot_id;
			slot_menu_kick.id = slot_id;
			slot_menu_host.style.display = "block";
			slot_menu_kick.style.display = "block";
		} else {
			slot_menu_host.style.display = "none";
			slot_menu_kick.style.display = "none";
		}
		slot_menu.style.display = "block";
	}
}

window.addEventListener('load', function(){

	body = document.createElement("div")
	body.id = "body";
	document.body.appendChild( body );

	title = document.createElement("div");
	title.innerHTML = decodeURI(document.URL.split('/')[4]);
	title.id = "title";
	body.appendChild( title );

	exit = document.createElement("div");
	exit.id = "exit_btn";
	exit.onclick = function(){
		location.href="/room";
	}
	exit.innerHTML = "방 나가기";
	title.appendChild( exit );

	userlist = document.createElement("div");
	userlist.id = "userlist";
	body.appendChild( userlist );
	
	socket = io.connect('/');

	start = document.createElement("div");
	start.className = "btn";
	start.id = "start_btn";
	body.appendChild( start );


	chat = document.createElement("div");
	chat.id = "chat_box";
	/*
	//모바일키패드 ㅂㄷㅂㄷ
	chat.onclick = function(){
		if( this.style.height != "" ){
			this.style.height = "";
			this.style.top = "";
		} else {
			this.style.top = "42px";
			this.style.height = "calc( 95vh - 70px )";
		}
	}
	*/
	if( /(iPhone|iPod|iPad)/i.test( navigator.userAgent ) ){
		chat.style.height = "calc( 70vh - 300px )";
	}
	body.appendChild( chat );
	chat_input = document.createElement("input");
	chat_input.type = "text";
	chat_input.id = "chat_input";
	chat_input.onkeydown = capturekey;
	body.appendChild( chat_input );
	
	slot_menu = document.createElement("div");
	slot_menu.style.display = "none";
	slot_menu.id = "slot_menu";

	slot_menu_name = document.createElement("div");
	slot_menu_name.id = "slot_menu_name";
	slot_menu.appendChild( slot_menu_name );

	slot_menu_friend = document.createElement("div");
	slot_menu_friend.innerHTML = "친구추가";
	slot_menu_friend.onclick = function(){
		var slot = document.getElementById("slot_" + this.id);
		friendAdd( slot.firstElementChild.src.split('/').splice(-1)[0],slot.innerText );
	}
	slot_menu.appendChild( slot_menu_friend );

	slot_menu_host = document.createElement("div");
	slot_menu_host.innerHTML = "방장위임";
	slot_menu_host.onclick = function(){
		var slot = document.getElementById("slot_" + this.id);
		start.innerHTML = "준비하기";
		socket.emit( 'room_setting', { host : this.id });
	}
	slot_menu.appendChild( slot_menu_host );
	
	slot_menu_kick = document.createElement("div");
	slot_menu_kick.innerHTML = "강퇴하기";
	slot_menu_kick.onclick = function(){
		var slot = document.getElementById("slot_" + this.id);
		socket.emit( 'room_setting', { slot : this.id } );
	}
	slot_menu.appendChild( slot_menu_kick );
	body.appendChild( slot_menu );

	socket.emit('chat_join');

	socket.on( 'game_toast', function( data ){
		if( data ){
		//	make_toast("정답입니다.");
		} else {
		//	make_toast("오답입니다.");
		}
	});

	socket.on( 'game_answer', function( data ){
		var user = document.getElementById("user_score_"+data.id);
		if( user ){
			user.innerText = data.score;
		}
	});

	socket.on( 'room_ready', function( data ){
		var slot = userlist.childNodes[ data ];
		if( slot.style.backgroundColor == ""){
			slot.style.backgroundColor = "#fcafa0";
		} else {
			slot.style.backgroundColor = "";
		}
	}); 

	socket.on( 'game_start', function(){
		game = document.createElement("div");
		game.id = "game";
		document.body.appendChild( game );

		body.style.display = "none";
		timegraph = document.createElement("div");
		timegraph.id = "timegraph";
		play_btn = document.createElement("div");
		play_btn.innerHTML = "<img src='/img/play.jpg'>"
		play_btn.id = "play_btn";
		var gameusers = document.createElement("div");
		gameusers.id = "gameusers";
		var gamescores = document.createElement("div");
		gamescores.id = "gamescores";
		for( var i = 0; i < userlist.childNodes.length; ++i ){
			var user = userlist.childNodes[i];
			if( user.className == "open" || user.className == "close" ){
//				user.style.display = "none";
			} else {
				--i;
				user.style.backgroundColor = "";
				gameusers.appendChild(user);
				var userscore = document.createElement("div");
				userscore.className = "user_score";
				userscore.innerText = "0";
				userscore.id = "user_score_" + user.firstChild.src.split('/').slice(-1)[0];
				gamescores.appendChild(userscore);
			}
		}

		game.appendChild(gameusers);
		game.appendChild(gamescores);

		waveform = document.createElement("canvas");
		
		window.onresize = function(){
			for( var i = 0; i < gameusers.childNodes.length; ++i ){
				gameusers.childNodes[i].style.width = window.innerWidth / gameusers.childNodes.length + "px";
				gamescores.childNodes[i].style.width = window.innerWidth / gameusers.childNodes.length + "px";
			}
			waveform.width = window.innerWidth;
			waveform.height = window.innerHeight / 4;
		}
		window.onresize();


		function moveWaveform(spot){
			if( spot != null && mousestart != null && audio != null && audio.duration >= 0 && play_btn.onclick != null ){
				listenstart += spot - mousestart;
				if( listenstart < -( audio.duration * 5 - window.innerWidth / 2 - 10 ) ){
					listenstart = -( audio.duration * 5  - window.innerWidth / 2 - 10 );
				} else if( listenstart > window.innerWidth / 2 ){
					listenstart = window.innerWidth / 2;
				}
				mousestart = spot;
			}	
		}

		if( 'ontouchstart' in window ){
			waveform.addEventListener('touchstart', function(){
				mousestart = event.touches[0].pageX;
			});

			waveform.addEventListener('touchmove', function(){
				moveWaveform( event.touches[0].pageX )
			});

			waveform.addEventListener('touchend', function(){
				mousestart = null;
			});
		}

		waveform.addEventListener('mousedown', function(){
			mousestart = event.clientX;
		});

		waveform.addEventListener('mousemove', function(){
			moveWaveform( event.clientX )
		});

		waveform.addEventListener('mouseup', function(){
			mousestart = null;
		});

		if( waveformRenderId == null ){
			waveformRenderId = setInterval( waveformRender, 1000 / FPS );
		}

		waveformCtx = waveform.getContext('2d');
		game.appendChild(waveform);
		game.appendChild(timegraph);
		game.appendChild(play_btn);
	});

	socket.on( 'game_end', function(){
		audio.pause();
		clearInterval(audioPlayId);
		audio = null;
		waveformArray = [];
		for ( var i = game.childNodes.length - 1; i >= 2; --i ){
			game.removeChild(game.childNodes[i]);
		}
		game_wait = document.createElement("div");
		game_wait.id = "game_wait";
		game_wait.innerHTML = "<img src='/img/game_wait.jpg'><div>모든 문제를 푸셨습니다.<br>다른 플레이어들이 끝마칠 때까지 기다립니다.</div>";
		game.appendChild(game_wait);
		socket.emit( 'game_end' );
	});

	socket.on('get_result', function( data ){
		clearInterval(waveformRenderId);
	//	for( var i = gameusers.childNodes.length - 1; i >= 0; --i ){
	//		gameusers.childNodes[i].style.width = "";
	//		userlist.insertBefore(gameusers.childNodes[i],userlist.firstChild);
	//	}
		game.innerHTML = "";
		game_result = document.createElement("div");
		game_result.id = "game_result";
		game_result.innerHTML ="<div id='game_result_title'>게임결과</div>";
		game.appendChild(game_result);
		var users = data;
		
		var keys = Object.keys(users).sort( function(a,b){
			if(users[a].score > users[b].score){
				return -1;
			} else {
				return 1;
			}
		});
		for( var i = 0; i < 3; ++i ){
			var user = users[keys[i]];
			if( user == undefined ){
				break;
			}
			var list = document.createElement("div");
			list.className = "winner";
			list.id = "winner" + (i + 1);
			list.innerHTML += "<img src='/profileimg/" + user.id_num + "'> " + user.name + '  <br>' + user.score;
			game_result.appendChild(list);
		}
		back_btn = document.createElement("div");
		back_btn.id = "back_btn";
		back_btn.innerHTML="돌아가기";
		back_btn.onclick = function(){
			document.body.removeChild(game);
			body.style.display = "block";
		}	
		game_result.appendChild(back_btn);
	});

	socket.on('get_music', function( data ){
		waveformArray = null;
		waveformCtx.clearRect(0,0,waveform.width,waveform.height);
		makeExam(data.examples);
		var xhr = new XMLHttpRequest();
		xhr.open("GET","/getmusic/" + data.music ); xhr.responseType = "blob";
		xhr.addEventListener('load', function(e) {
			getMusic(this.response, data.music );
		});
		xhr.send();
	});

	socket.on( 'getuser', function( data ){
		me = data;
	});

	socket.on( 'connect_failed', function(){
		location.href = "/";
	});

	socket.on( 'disconnect', function(){
	//	location.href = "/room";
	});

	socket.on( 'room_setting', function( data ){
		if( data.slot ){
			var user = userlist.childNodes[ data.slot - 1];
			if( user.className == "open" ){
				user.innerHTML = "<img src='/img/close.jpg'>";
				user.className = "close";
				user.id = "slot_" + data.slot;
			} else {
		//	} else if( user.className == "close" ){
				if( user.className != "close" ){
					slot_menu.style.display = "none";
				}
				user.innerHTML = "<img src='/img/open.jpg'>";
				user.className = "open";
				user.id = "slot_" + data.slot;
				user.innerHTML += "열림";
			}
			user.style.backgroundColor="";
		} else if( data.host ){
			var host = document.getElementsByClassName("host")[0];
			if( host ){
				host.className = "user";
			}
			var user = userlist.childNodes[ data.host - 1 ];
			if( me.slot == data.host - 1) {
				start.innerHTML = "게임시작";
			}
			user.className = "host";
		}
	});

	socket.on( 'chat_list', function( data ){
		for( var i = userlist.childNodes.length - 1; i >= 0; --i ){
			userlist.removeChild(userlist.childNodes[i]);
		}
		for( var i = 0; i < data.slot.length; ++i ){
			var user = document.createElement("div");
			user.id = "slot_" + (i + 1);
			user.onclick = showmenu;
			if( data.slot[i] == "open" ){
				user.innerHTML = "<img src='/img/open.jpg'>";
				user.className = "open";
				user.innerHTML += "열림";
			} else if( data.slot[i] == "close" ){
				user.innerHTML = "<img src='/img/close.jpg'>";
				user.className = "close";
			} else {
				user.innerHTML = "<img src='/profileimg/" + data.slot[i] + "' >"
				if( data.slot[i] == data.host ){
					host = i + 1;
					user.className = "host";
				} else {
					user.className = "user";
				}
				user.innerHTML += data.users[ data.slot[i] ].name;
			}
			userlist.appendChild(user);
		}
		if( me.id_num != data.host ){
			start.onclick = function(){
				socket.emit( 'room_ready' );
			}
			start.innerHTML = "준비하기";
		} else {
			start.onclick = function(){
				socket.emit( 'room_ready' );
			}
			start.innerHTML = "게임시작";
		}
	});
	socket.on( 'chat_join', function( data ){
		var user = document.getElementById("slot_" + ( data.slot + 1 ));
		user.id = "slot_" + ( data.slot + 1 );
		user.className = "user";
		user.innerHTML = "<img src='/profileimg/" + data.id_num + "' >"
		user.innerHTML += data.name;
	});
	socket.on( 'chat_exit', function( data ){
		if( data.slot == me.slot ){
			socket.disconnect();
			location.href = "/room";
		}
	        chat.innerHTML += data.name + "님이 방에서 나갔습니다.<br>";
		var user = document.getElementById("slot_" + ( data.slot + 1 ));
		user.innerHTML = "<img src='/img/open.jpg'>";
		user.className = "open";
		user.innerHTML += "열림";
		user.style.backgroundColor = "";
	});
	socket.on( 'chat_alert',function( data ){
	        if( data == "비정상적인 접근입니다." || data == "이미 존재합니다." || data == "방에 빈 자리가 없습니다." || data == "게임 진행중입니다."){
	                location.href="/room";
	        }
	        alert(data);
	});
	socket.on( 'chat_broadcast',function(data){
		var msg = document.createElement("div");
		if( data.id_num ){
			var img = document.createElement("img");
			img.src = "/profileimg/" + data.id_num;
			if( data.id_num == me.id_num ){
				msg.className = "me";
				msg.innerText = data.chat;
				msg.appendChild(img);
			} else {
				msg.appendChild(img);
				msg.innerHTML += data.chat;
			}
		}
		chat.appendChild(msg);
	        chat.scrollTop = chat.scrollHeight;
	        scrolldiv();
	});
	socket.on('chat_private',function(data){
		var msg = document.createElement("div");
		if( data.id_num ){
			var img = document.createElement("img");
			img.src = "/profileimg/" + data.id_num;
			if( data.id_num == me.id_num ){
				msg.className = "me";
				msg.innerHTML += "<span class='private'>" + data.chat + "</span>";
				msg.appendChild(img);
			} else {
				msg.appendChild(img);
				msg.innerHTML += "<span class='private'>" + data.chat + "</span>";
			}
		}
		chat.appendChild(msg);

	        chat.scrollTop = chat.scrollHeight;
	        scrolldiv();
	});
});

function capturekey(){
        if( event.keyCode == 13 ){
		sendChat();
	}
}

function sendChat(){
        var msg = chat_input.value;
        if( msg == '' ){
		alert("메세지를 입력해 주세요.");
	} else {
		if( msg.substr(0, 3) == "/w " ){
			msg = msg.substr(3);
			to = msg.substr( 0, msg.indexOf(" ") );
			msg = msg.substr( msg.indexOf(" ") + 1 )
		} else {
			to = "ALL";
		}
		if( to ){
			socket.emit( 'chat_send' , {to : to, chat : msg });
			if( to != 'ALL' ){
				if( to == me.slot + 1 ){
					alert("자신에게 귓속말을 보낼 수 없습니다.");
				} else {
					chat.innerHTML += "<div class='me'><span class='private'>" + msg + "</span><img src='/profileimg/" + me.id_num + "'></div>";
				}
			}
		}
		chat_input.value="";
		chat.scrollTop = chat.scrollHeight;
	}
}

function scrolldiv(){
        if(chat.scrollTop == chat.scrollHeight - chat.clientHeight){
                chat.scrollTop = chat.scrollHeight;
        }
}

