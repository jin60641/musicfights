window.addEventListener('load', function(){
	socket = io.connect('/');

	//socket.emit('chat_join');

	socket.on( 'game_start', function(){
		game = document.createElement("div");
		game.id = "game";
		document.body.appendChild( game );

		timegraph = document.createElement("div");
		timegraph.id = "timegraph";
		play_btn = document.createElement("div");
		play_btn.innerHTML = "<img src='/img/play.jpg'>"
		play_btn.id = "play_btn";

		waveform = document.createElement("canvas");
		
		window.onresize = function(){
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
		waveformArray = [];
		socket.emit( 'game_end' );
	});

	socket.on('get_result', function( data ){
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
		var xhr = new XMLHttpRequest();
		makeExam(data.examples);
		xhr.open("GET","/getmusic/" + data.music ); xhr.responseType = "blob";
		xhr.addEventListener('load', function(e) {
			getMusic(this.response);
		});
		xhr.send();
	});

	socket.on( 'connect_failed', function(){
		location.href = "/";
	});

	socket.on( 'disconnect', function(){
	//	location.href = "/room";
	});
});


