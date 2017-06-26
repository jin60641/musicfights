window.addEventListener('load', function(){
	var socket = io.connect('/');

	body = document.createElement("div");
	body.id = "body";
	document.body.appendChild(body);

	room_quick = document.createElement("div");
	room_quick.innerHTML = "빠른시작<p>빠른 시작은 현재 존재하는 방들 중 임의의 방에 입장하여<br>빠르게 다양한 사람들과 게임을 즐길 수 있습니다.</p>";
	room_quick.className = "btn";
	room_quick.onclick = function(){
		if( rooms.length >= 1 ){
			location.href = "/chat/" + rooms[ Math.floor(Math.random()*rooms.length) ];
		} else {
			alert("입장 가능한 방이 없습니다.");
		}
	}
	body.appendChild(room_quick);

	room_create = document.createElement("div")
	room_create.innerHTML = "방만들기<p>세부적인 장르와 모드를 선택해 나만의 방을 만들고<br> 다른 사용자와 함께 플레이할 수 있습니다.</p>";
	room_create.className = "btn";
	room_create.onclick = createRoom;
	body.appendChild(room_create);

	var br = document.createElement("div");
	br.id = "br";
	body.appendChild(br);

	room_menu = document.createElement("div");
	room_menu.onkeyup = function(){
		if( event.keyCode == 13 ){
			room_menu_create.onclick();
		}
	}
	room_menu.id = "room_menu";
	room_menu.innerHTML = '<div id="room_menu_head"><img src="/img/room_close.jpg" onclick="createRoom(event, 1)"></div>';
	var room_menu_body = document.createElement("div");
	room_menu_body.id = "room_menu_body";
	room_menu.appendChild(room_menu_body);
	var label_title = document.createElement("div");
	label_title.className = "label";
	label_title.innerText = "방 제목";
	room_menu_body.appendChild( label_title );
	input_title = document.createElement("input");
	input_title.type = "text";
	input_title.id = "room_menu_title";
	if( /(iPhone|iPod|iPad)/i.test( navigator.userAgent ) ){
		input_title.style.width = "calc( 80vw - 170px )";
	}
	room_menu_body.appendChild( input_title );
	var label_genre = document.createElement("div");
	label_genre.className = "label";
	label_genre.innerText = "장르";
	room_menu_body.appendChild( label_genre );
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
		var result = JSON.parse( xhr.responseText );
		genre = document.createElement("select");
		genre.name = "genre";
		for( var i = 0; i < result.length; ++i ){
			var option = document.createElement("option");
			option.innerHTML = result[i];
			option.value = result[i];
			genre.appendChild( option );
		}
		room_menu_body.appendChild( genre );
		room_menu_body.innerHTML += "<br><div class='label' id='room_menu_public'>공개설정</div>";
		open_img = document.createElement("img");
		open_img.src = "/img/room_menu_open_orange.jpg";
		open_img.onclick = function(){
			if( open_img.src.indexOf("room_menu_open_gray.jpg") >= 0 ){
				open_img.src = "/img/room_menu_open_orange.jpg";
				close_img.src = "/img/room_menu_close_gray.jpg";
				room_menu_password.style.display = "none";
				room_menu_password.value = "";
			}
		}
		room_menu_body.appendChild(open_img);

		close_img = document.createElement("img");
		close_img.src = "/img/room_menu_close_gray.jpg";
		close_img.onclick = function(){
			if( close_img.src.indexOf("room_menu_close_gray.jpg") >= 0 ){
				open_img.src = "/img/room_menu_open_gray.jpg";
				close_img.src = "/img/room_menu_close_orange.jpg";
				room_menu_password.style.display = "block";
			}
		}
		room_menu_body.appendChild(close_img);

		room_menu_password = document.createElement("input");
		room_menu_password.placeholder = "비밀번호";
		room_menu_password.id = "room_menu_password";
		room_menu_password.style.display = "none";
		room_menu_password.type = "txet";
		room_menu_body.appendChild(room_menu_password);
	
		room_menu_create = document.createElement("div");
		room_menu_create.id = "room_menu_create";
		room_menu_create.innerHTML = "방 생성";
		room_menu_create.onclick = function(){
			var selected;
			var options = document.getElementsByTagName("option");
			for( var i = 0; i < options.length; ++i ){
				if( options[i].selected ){
					selected = options[i].value;
				}
			}
			if( room_menu_title.value == "" ){
				alert("방 제목을 입력해주세요");
			} else if( room_menu_title.value.length >= 11 ){
				alert("방 제목은 최대 10글자까지입니다.");
			} else if( selected.length == null ){
				alert("장르를 선택해주세요");
			} else {
				socket.emit('room_create', { title : room_menu_title.value, genre : selected, password : room_menu_password.value });
			}
		}
		room_menu_body.appendChild(room_menu_create);
		//room_menu_body.innerHTML += "<img src='/img/room_menu_open.jpg'><img src='/img/room_menu_close.jpg'>";
        }};

	room_menu.style.display = "none";
	document.body.appendChild( room_menu );

	imglayer = document.createElement("div");
	imglayer.id = "imglayer";
	imglayer.style.display = "none";
	body.appendChild( imglayer );

        xhr.open("POST", "/getgenre", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send();
	
	socket.emit( 'room_list' );

	socket.on( 'connect_failed', function(){
		location.href = "/";
	});

	socket.on( 'disconnect', function(){
	//	location.href = "/";
	});

	socket.on('room_create', function( data ){
		 location.href = '/chat/' + data;
	});
	
	socket.on( 'room_list' , function(data){
		var old_list = document.getElementsByClassName("room");
		for( var i = old_list.length - 1; i >= 0; --i ){
			body.removeChild(old_list[i]);
		}
		rooms = Object.keys(data)
		for( var i = 0; i < rooms.length; i++ ){
			var cnt = 0;
			for( var j = 0; j < data[ rooms[i] ].slot.length; ++j ){
				if( data[ rooms[i] ].slot[j] != "close" ){
					++cnt;
				}
			}
			var room = document.createElement("div");
			room.className = "room";

			var title = document.createElement("div");
			title.style.background = "url('/img/room_background?" + rooms[i] + "')";
			title.className = "title";
			title.innerHTML = decodeURI( rooms[i] );
			room.appendChild(title);
	
			var profile = document.createElement("img");
			profile.className = "profile";
			profile.src = "/profileimg/" + data[ rooms[i] ].host;
			room.appendChild(profile);
	
			var genre = document.createElement("div");
			genre.className = "genre";
			genre.innerHTML = data[ rooms[i] ].genre;
			room.appendChild(genre);

			var people = document.createElement("div");
			people.className = "people";
			people.innerHTML = Object.keys( data[ rooms[i] ].users ).length + "/" + cnt;
			room.appendChild(people);
		
			body.appendChild(room);
			if(data[ rooms[i] ].state == "game"){
				room.style.backgroundColor="#ccc";
				rooms.splice(i,1)
				room.onclick = function(){
					alert("진행중인 게임입니다.");
				}
			} else if( people.innerHTML.split('/')[0] == people.innerHTML.split('/')[1] ){
				room.onclick = function(){
					alert("방에 빈 자리가 없습니다.")
				}
			} else if( data[ rooms[i] ].password.length >= 1 ){
				var password = document.createElement("div");
				password.className = "password";
				password.id = data[ rooms[i] ].password ;
				room.appendChild(password);
				room.onclick = function(){
					var pw = prompt("비밀번호를 입력해주세요");
					if( pw ){
						if( pw == this.lastChild.id ){
							location.href = "/chat/" + this.firstChild.innerText;
						} else {
							alert("비밀번호가 틀렸습니다.");
						}
					}
				}
				rooms.splice(i,1)
			} else {
				room.onclick = function(){
					location.href = "/chat/" + this.firstChild.innerText;
				}
			}
			
		}
	});
});

function createRoom( event, viewing ){
	if( viewing == 1 ){
		room_menu.style.display = "none";
		imglayer.style.display = "none";
		open_img.onclick();
		room_menu_title.value = "";
		room_menu_password.value = "";
	} else {
		room_menu.style.display = "block";
		imglayer.style.display = "block";
	}

}

