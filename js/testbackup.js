window.onresize = function(){
	wave.width = window.innerWidth * 1.5;
}

var audioVisual = document.getElementById('audio-visual');

var wave = document.getElementById("wave");
var waveCtx = wave.getContext('2d');
var waveform = document.getElementById("waveform");
var waveformCtx = waveform.getContext('2d');
waveform.width = screen.availWidth;
window.onresize();

var FPS = 30;
var audio;
var buffer;
var vals;

var audio_time_input = document.createElement("input");
audio_time_input.type = "range";
audio_time_input.min = "0";
audio_time_input.max = "1000";
audio_time_input.value = "0";
audio_time_input.onmouseup = function(){
	audio.currentTime = audio_time_input.value/1000 * audio.duration;
}
audioVisual.appendChild(audio_time_input);

var audio_time_span = document.createElement("span");
audio_time_span.style.display="inline-block";
audio_time_span.style.textAlign="center";
audio_time_span.style.width="70px";
audioVisual.appendChild(audio_time_span);

var play_btn = document.createElement("input");
play_btn.type = "button";
play_btn.value = "재생";
play_btn.style.display="none";
play_btn.onclick = function(){
	audio.play();
}
audioVisual.appendChild(play_btn);

var pause_btn = document.createElement("input");
pause_btn.type = "button";
pause_btn.value = "일시정지";
pause_btn.onclick = function(){
	audio.pause();
}
audioVisual.appendChild(pause_btn);

var stop_btn = document.createElement("input");
stop_btn.type = "button";
stop_btn.value = "정지";
stop_btn.onclick = function(){
	audio.load();
}
audioVisual.appendChild(stop_btn);

var next_btn = document.createElement("input");
next_btn.type = "button";
next_btn.value = "다른노래";
next_btn.onclick = function(){
	getMusic();
}
audioVisual.appendChild(next_btn);

var upload_btn = document.createElement("input");
upload_btn.type = "file";
upload_btn.value = "내가가진노래로듣기";
upload_btn.onchange = function(){
	getMusic();
}
audioVisual.appendChild(upload_btn);

var volume_input = document.createElement("input");
volume_input.type = "range";
volume_input.min = "0";
volume_input.max = "100";
volume_input.value = "100";
volume_input.onmousemove = function(){
audio.volume = volume_input.value/100;
}
audioVisual.appendChild(volume_input);

var bar_gap_input = document.createElement("input");
bar_gap_input.type = "range";
bar_gap_input.min = "1";
bar_gap_input.max = "5";
bar_gap_input.value = "1";
audioVisual.appendChild(bar_gap_input);

var num_bars_input = document.createElement("input");
num_bars_input.type = "range";
num_bars_input.min = "60";
num_bars_input.max = "240";
num_bars_input.value = "120";
audioVisual.appendChild(num_bars_input);

var context;
var analyser;


function waveRender() {
	var sum;
	var average;
	var num_bars = Math.floor( ( wave.width / 1920 ) * num_bars_input.value );
	var bar_width = wave.width / num_bars;
	var bar_gap = bar_gap_input.value;
	var bar_color = Math.floor();
	var scaled_average;
	var data = new Uint8Array(bufferLength);
	analyser.getByteFrequencyData(data);

	waveCtx.clearRect(0, 0, wave.width, wave.height);
	var bin_size = Math.floor( data.length / num_bars );
	for (var i = num_bars - 1; i >= 0; --i ) {
		sum = 0;
		for ( var j = bin_size - 1; j >= 0; --j ) {
			sum += data[( i * bin_size ) + j];
		}
		average = sum / bin_size;
		bar_width = wave.width / num_bars;
		scaled_average = ( average / 256 ) * wave.height;
		waveCtx.fillRect(i * bar_width + 1, (wave.height-scaled_average)/2, bar_width - bar_gap, scaled_average + 10);
	}
}

function waveformRender() {
	if( buffer != undefined && vals != undefined ){
		var sections = waveform.width;
		var len = Math.floor( buffer.length / sections );
		var bar_width = 5;
		var bar_gap = 0.5;
		var w = bar_width * Math.abs( 1 - bar_gap );
		var maxHeight = waveform.height;
		var scale = maxHeight / vals.max();
		for (var j = sections - 1; j >= 0 ; j -= bar_width) {
			var sum = 0.0;
			for( var i = j * len; i <= j * len + len; ++i ) {
			//for( var i = j * len, ref = (j*len + len) - 1; j*len <= ref ? i <= ref : i >= ref; j*len <= ref ? i++ : i--) {
				sum += Math.pow( buffer[i], 2 );
			}
			var val = Math.sqrt( sum / buffer.length ) * 10000 * scale + 2;
		        var x = j + ( w / 2 );
		        var y = maxHeight / 2 - val / 2;
			if( x / sections < audio.currentTime / audio.duration ){
				waveformCtx.fillStyle="#000000";
			} else {
				waveformCtx.fillStyle="#FF357C";
			}
		        waveformCtx.fillRect(x, y, w, val);
		}
	}
}
function getMusic(){
	if( audio ){
		audio.parentNode.removeChild(audio);
		waveformCtx.clearRect(0,0,waveform.width,waveform.height);
	}
	buffer = null;
	vals = null;
	var xhr = new XMLHttpRequest;
	xhr.onprogress = function(e){
		if( e.lengthComputable ){
			var percentLoaded = Math.round((e.loaded / e.total)*100);
			if(percentLoaded < 100){
				console.log(percentLoaded);
			}
		}
	}
	xhr.open("GET","/getmusic"); xhr.responseType = "blob";
	xhr.addEventListener('load', function(e) {
		audio = new Audio();
		audio.controls = false;
		audio.autoplay = false;
		audio.loop = false;
	        audio.src = URL.createObjectURL(new Blob([this.response]));
		audioVisual.appendChild(audio);
		var tmp = audio.src;
		audio.onplay = function(){
			play_btn.style.display="none";
			pause_btn.style.display="inline";
		}
		audio.onpause = function(){
			play_btn.style.display="inline";
			pause_btn.style.display="none";
		}
		audio.onload = function(){
			play_btn.style.display = "inline";
			pause_btn.style.display = "none";
			audio_time_input.value = "0";
			audio_time_span.innerHTML = "0:00/" + Math.floor(audio.duration/60) + ':' + ( audio.duration%60 < 10 ? "0" : "" ) + Math.floor(audio.duration%60);
		}
		audio.onloadeddata = function(){
			context = new webkitAudioContext();
			analyser = context.createAnalyser();
			analyser.fftSize = 4096;
			var source = context.createMediaElementSource(audio);
			source.connect(analyser);
			analyser.connect(context.destination);
			bufferLength = analyser.frequencyBinCount;
			audio.play();
			waveRenderId = setInterval( waveRender, 1000 / FPS );
		}
		audio.onended = function(){
			getMusic();
		}
		audio.ontimeupdate = function(){
			audio_time_input.value = audio.currentTime / audio.duration * 1000;
			audio_time_span.innerHTML= Math.floor( audio.currentTime / 60 ) + ':' + ( audio.currentTime%60 < 10 ? "0" : "" ) + Math.floor(audio.currentTime%60) + '/' + Math.floor(audio.duration/60) + ':' + ( audio.duration%60 < 10 ? "0" : "" ) + Math.floor(audio.duration%60);
		}
	        Waveform.generate( new Blob([this.response], {type: 'image/png'}), waveform, function(result){
			buffer = result.buffer;
			vals = result.vals;
			waveformRenderId = setInterval( waveformRender, 300 );
			waveform.style.cursor="pointer";
			waveform.onclick = function(e){
				audio.currentTime = e.clientX/waveform.width * audio.duration;
			}
			/*
			if( tmp == audio.src ){
		                //var png = waveform;
		                //png.src = '';
		                //png.alt = 'Loading waveform...';
			}
			*/
	        });
	}, false );
	xhr.send();
}

getMusic();
