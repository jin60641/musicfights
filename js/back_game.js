window.onresize = function(){
	wave.width = window.innerWidth;
}

var isReading = false;

var audioVisual = document.getElementById('audio-visual');

var log = document.getElementById("log");
var lyric = document.getElementById('lyric');
var wave = document.getElementById("wave");
var waveCtx = wave.getContext('2d');
var waveform = document.getElementById("waveform");
//audioVisual.style.display="none";
var waveformCtx = waveform.getContext('2d');

var waveRenderId;
var waveformRenderId;

waveform.width = screen.availWidth;
window.onresize();

var FPS = 30;
var audio;
var waveformArray;
var context = new webkitAudioContext();
var analyser;
analyser = context.createAnalyser();
analyser.fftSize = 4096;
var source;

Array.prototype.max = function() {
	return Math.max.apply(null, this);
};

var waveformCreate = function( file, canvas, barwidth, callback ) {
	var reader = new FileReader();
	reader.onload = function(e) {
		context.decodeAudioData( e.target.result, function( buffer ) {
			log.innerHTML="decodeAudioData Start";
			var channel = buffer.getChannelData(0);
			var sections = waveform.width;
			var len = Math.floor( channel.length / sections );
			var vals = [];
			for( var i = 0; i < sections; i += barwidth ){
				log.innerHTML = "Extract Buffer : " + Math.floor( i / sections * 100 ) + "%";
				var sum = 0.0;
				for( var j = i * len, ref = i * len + len - 1; j <= ref; ++j ){
					sum += channel[j] * channel[j];
				}
				vals.push( Math.sqrt( sum / channel.length ) * 10000);
			}
			if (i >= sections) {
				isReading = false;
				log.innerHTML = "모든 로딩이 완료되었습니다.";
				callback({ "buffer" : channel, "vals" : vals });
			}
		});
	}
	reader.onprogress = function(e){
		var percentLoaded = Math.round( ( e.loaded / e.total ) * 100 );
		if( percentLoaded < 100 ){
			log.innerHTML = "Waveform : " + percentLoaded + "%";
		} else {
			if( /(BB|iPad|iPhone|iPod|Android)/i.test( navigator.userAgent ) ){
				play_btn.style.display="inline";
				log.innerHTML = "노래를 재생할 수 있습니다. ( waveform은 잠시만 기다려주세요.  )";
			}else {
				audio.play();
				log.innerHTML = "노래를 재생합니다. ( waveform은 잠시만 기다려주세요. )";
			}
		}
	};
	reader.readAsArrayBuffer( file );
}



function waveRender() {
	var sum;
	var average;
	var num_bars = num_bars_input.value;
	var bar_width = wave.width / num_bars;
	var bar_gap = bar_gap_input.value;
	var scaled_average;
	var data = new Uint8Array(bufferLength);
	analyser.getByteFrequencyData(data);

	waveCtx.clearRect(0, 0, wave.width, wave.height);
	var bin_size = Math.floor( data.length / num_bars / 2.22 ); 
	for (var i = num_bars - 1; i >= 0; --i ) {
		sum = 0;
		for ( var j = bin_size - 1; j >= 0; --j ) {
			sum += data[( i * bin_size ) + j];
		}
		if( sum > 0){
			average = sum / bin_size;
			bar_width = wave.width / num_bars;
			scaled_average = ( average / ( 1024 - bar_height_input.value ) ) * wave.height;
			waveCtx.fillStyle = color_btn.value;
			//waveCtx.fillRect(i * bar_width + 1, (wave.height-scaled_average)/2, bar_width - bar_gap, scaled_average + 10);
			waveCtx.fillRect( i * bar_width + 1, wave.height - scaled_average, bar_width - bar_gap, scaled_average );
		} 
	}
}

function waveformRender() {
	if( waveformArray != undefined ){
		waveformCtx.clearRect(0, 0, waveform.width, waveform.height);
		var audioCurrentTime = audio.currentTime;
		var audioDuration = audio.duration;
		for( var i = waveformArray.length - 1; i >= 0; --i ){
			if( waveformArray[i].x / waveform.width < audioCurrentTime / audioDuration ){
				waveformCtx.fillStyle = "#FF458C";
			} else {
				waveformCtx.fillStyle="#FF95BC";
			}
			waveformCtx.fillRect(waveformArray[i].x, waveformArray[i].y, waveformArray[i].w, waveformArray[i].val);
		}
	}
}

function openMusic( file ){
	if( isReading == false ){
		stop_btn.onclick();
		isReading = true;
		var file = file;
		if( file == undefined ){
			var xhr = new XMLHttpRequest;
			xhr.onprogress = function(e){
				if( e.lengthComputable ){
					var percentLoaded = Math.round((e.loaded / e.total)*100);
					if(percentLoaded < 100){
						log.innerHTML = "getFile : " + percentLoaded + "%";
					} else {
						log.innerHTML = "getFile : Complete";
					}
				}
			}
			xhr.open("GET","/getmusic"); xhr.responseType = "blob";
			xhr.addEventListener('load', function(e) {
				getMusic(this.response);
			});
			xhr.send();
		} else {
			var reader = new FileReader();
			reader.onload = function(e){
				log.innerHTML = "loaded";
				getMusic(new Blob([reader.result]));
			}
			reader.onprogress = function(e){
				var percentLoaded = Math.round((e.loaded / e.total)*100);
				if(percentLoaded < 100){
					log.innerHTML = "fileupload : " + percentLoaded + "%";
				} else {
					log.innerHTML = "fileupload : Complete";
				}
			}
			reader.readAsArrayBuffer(file);
		}
	}
}

function getMusic(file){
	if( audio ){
		waveCtx.clearRect(0,0,waveform.width,waveform.height);
		waveformCtx.clearRect(0,0,waveform.width,waveform.height);
		audio.parentNode.removeChild(audio);
	}
	waveformArray = null;
	audio = new Audio();
        audio.src = URL.createObjectURL(file);
	audio.controls = false;
	audio.autoplay = false;
	audio.loop = false;
	audioVisual.appendChild(audio);
	var tmp = audio.src;
	var num_bars = Math.floor( ( wave.width / 1920 ) * num_bars_input.value );
	audio.onplay = function(){
		play_btn.style.display="none";
		pause_btn.style.display="inline";
		waveformRenderId = setInterval( waveformRender, 300 );
		waveRenderId = setInterval( waveRender, 1000 / FPS );
	}
	audio.onpause = function(){
		play_btn.style.display="inline";
		pause_btn.style.display="none";
		clearInterval(waveformRenderId);
		clearInterval(waveRenderId);
	}
	audio.addEventListener('loadeddata', function(){
		source = context.createMediaElementSource(audio);
		source.connect(analyser);
		analyser.connect(context.destination);
		bufferLength = analyser.frequencyBinCount;
	});
	audio.onended = function(){
		audio.onpause();
		openMusic();
	}
	waveform.onclick = null;
        waveformCreate( file, waveform, wave.width / num_bars, function( result ){
		var buffer = result.buffer;
		var vals = result.vals;
		var scale = waveform.height / vals.max();
		var sections = waveform.width;
		var len = Math.floor( buffer.length / sections );
		var w = 4;
		waveformArray = [];
		for ( var j = sections - 1; j >= 0 ; j -= 5 ){
			var sum = 0.0;
			//for( var i = j * len, ref = (j*len + len) - 1; j*len <= ref ? i <= ref : i >= ref; j*len <= ref ? i++ : i--) {
			var ref = j * len;
			for( var i = ref; i <= ref + len; ++i ) {
				sum += buffer[i] * buffer[i];
			}
			var val = Math.sqrt( sum / buffer.length ) * 10000 * scale + 2;
			var x = j + ( w / 2 );
			var y = waveform.height / 2 - val / 2;
			waveformArray.push({ "x" : x, "y" : y, "w" : w, "val" : val });
		}
		waveform.style.cursor="pointer";
		waveformRender();
		waveform.onclick = function(e){
			audio.currentTime = e.clientX/waveform.width * audio.duration;
			waveformRender();
		}
        } );
	var reader = new FileReader();
	reader.onload = function(e){
		var result = reader.result;
		var ID3Size = 0;
		for( var i = 6; i <= 9; ++i ){
			ID3Size += result.charCodeAt( i ) * Math.pow( 256 , Math.abs( i - 9 ) );
		}
		result = result.substr( 0, ID3Size );
		var lyricIndex = result.indexOf("USLT");
		//var apicIndex = result.indexOf("APIC");
		if( lyricIndex >= 0 ){
			var lyricSize = 0;
			for( var i = 0; i <= 3; ++i ){
				lyricSize += result.charCodeAt( i + lyricIndex + 4 ) * Math.pow( 256 , Math.abs( i - 3 ) );
			}
			var lyric_str = result.substr( lyricIndex, lyricSize + 10 );

			var lyrics = "";
			isUTF16 = 0;
			if( lyric_str.charCodeAt( 14 ) == 255 && lyric_str.charCodeAt( 15 ) == 254 ){
				isUTF16 = 1;
			}
			for( var i = 14; i < lyricSize + 10; i += 1 + isUTF16 ){
				var charCode = lyric_str.charCodeAt(i) + lyric_str.charCodeAt(i+1)*256
				if( charCode == 12288 ){
					lyrics += "\n";
				} else if( charCode == 13 ){
					lyrics += "\r";
				} else if( charCode == 10 ){
					lyrics += "\n";
				} else {
					lyrics += String.fromCharCode(lyric_str.charCodeAt(i) + lyric_str.charCodeAt(i + 1) * 256 * isUTF16);
				}
			}
			lyric.innerHTML = lyrics.replace(/\r\n/g,"\n").replace(/\n|\r/g,"<br>");
		} else {
			lyric.innerHTML = "가사없음";
		}
		/*
		if( apicIndex ){
			apicSize = 0;
			for( var i = 0; i<= 3; ++i ){
				apicSize += result.charCodeAt( i + apicIndex + 4 ) * Math.pow( 256, Math.abs( i - 3 ) );
			}
			apic = document.createElement("img");
			apic_str = result.substr( apicIndex + 28, apicSize + 10 );
			objurl = URL.createObjectURL(new Blob([apic_str]));
			apic.src = apic_str;
			document.body.appendChild(apic);
		}
		*/
	}
	reader.readAsBinaryString(file);
}

