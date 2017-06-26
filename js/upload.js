var audio;
var waveformArray = []
var context = new window.AudioContext();
var realfile;

Array.prototype.max = function() {
	return Math.max.apply(null, this);
};

function getMusic( file ){
	audio = new Audio();
	audio.src = URL.createObjectURL(file);
	audio.controls = false;
	waveformCreate( file, function( result ){
		var audioCurrentTime = audio.currentTime;
		var buffer = result.buffer;
		var vals = result.vals;
		var sections = Math.floor( audio.duration * 5 );
		var len = Math.floor( buffer.length / sections );
		var max = vals.max();  
		waveformArray = [];
		for( var j = 0; j < sections; j += 5 ){
			var sum = 0.0;
			var ref = j * len;
			for( var i = ref; i <= ref + len; ++i ) {
				sum += buffer[i] * buffer[i];
			}
		 	var val = Math.sqrt( sum / buffer.length ) * 10000 / max;
			var x = j + 2;
			waveformArray.push({ "x" : x, "w" : 4, "val" : val });
		}
		waveformArray = JSON.stringify(waveformArray);
		label.style.display="";
		send.style.backgroundColor = "";
		send.style.cursor = "";
	});
	var reader = new FileReader();
	reader.onload = function(e){
		var result = reader.result;
		var ID3Size = 0;
		for( var i = 6; i <= 9; ++i ){
			ID3Size += result.charCodeAt( i ) * Math.pow( 256 , Math.abs( i - 9 ) );
		}
		result = result.substr( 0, ID3Size );
		var tit2Index = result.indexOf("TIT2");
		var tpe1Index = result.indexOf("TPE1");
		var apicIndex = result.indexOf("APIC");
		/*
		var lyricIndex = result.indexOf("USLT");
		if( lyricIndex >= 0 ){
			var lyricSize = 0;
			for( var i = 0; i <= 3; ++i ){
				lyricSize += result.charCodeAt( i + lyricIndex + 4 ) * Math.pow( 256 , Math.abs( i - 3 ) );
			}
			var lyric_str = result.substr( lyricIndex, lyricSize + 10 );

			var lyrics = "";
			var isUTF16 = 0;
			if( lyric_str.charCodeAt( 10 ) == 1 ){
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
			var lyric = document.createElement("lyric");
			lyric.innerHTML = lyrics.replace(/\r\n/g,"\n").replace(/\n|\r/g,"<br>");
		}
		*/
		if( tit2Index >= 0 ){
			var tit2Size = 0;
			for( var i = 0; i<= 3; ++i ){
				tit2Size += result.charCodeAt( i + tit2Index + 4 ) * Math.pow( 256, Math.abs( i - 3 ) );
			}
			var tit2_str = result.substr( tit2Index, tit2Size + 10);
			var tit2 = "";
			var isUTF16 = 0;
			if( tit2_str.charCodeAt( 10 ) == 1 ){
				isUTF16 = 1;
			}
			for( var i = 13; i < tit2Size + 10; i += 1 + isUTF16 ){
				tit2 += String.fromCharCode(tit2_str.charCodeAt(i) + tit2_str.charCodeAt(i + 1) * 256 * isUTF16 );
			}
			title.value = tit2;
		}
		if( apicIndex >= 0 ){
			var apicSize = 0;
			for( var i = 0; i<= 3; ++i ){
				apicSize += result.charCodeAt( i + apicIndex + 4 ) * Math.pow( 256, Math.abs( i - 3 ) );
			}
			var apic_str = result.substr( apicIndex + 10, apicSize );
			var mimeType = apic_str.substring(1,apic_str.indexOf(String.fromCharCode(0),1));
			var imageStart;
			if( mimeType == 'image/jpeg' ){
				imageStart = apic_str.indexOf('\xFF\xD8\xFF', 1 + mimeType.length + 1);
				img.src = "data:image/jpeg;base64," + btoa(apic_str.substr(imageStart));
			} else if( mimeType == 'image/png' ){
				imageStart = apic_str.indexOf('\x89\x50\x4E\x47\x0D\x0A\x1A\x0A', 1 + mimeType.length + 1 );
				img.src = "data:image/png;base64," + btoa(apic_str.substr(imageStart));
			}
		} else {
			img.src = "/img/apicnone.png";
		}
		if( tpe1Index >= 0 ){
			var tpe1Size = 0;
			for( var i = 0; i<= 3; ++i ){
				tpe1Size += result.charCodeAt( i + tpe1Index + 4 ) * Math.pow( 256, Math.abs( i - 3 ) );
			}
			var tpe1_str = result.substr( tpe1Index, tpe1Size + 10);
			var tpe1 = "";
			var isUTF16 = 0;
			if( tpe1_str.charCodeAt( 10 ) == 1 ){
				isUTF16 = 1;
			}
			for( var i = 13; i < tpe1Size + 10; i += 1 + isUTF16 ){
				tpe1 += String.fromCharCode(tpe1_str.charCodeAt(i) + tpe1_str.charCodeAt(i + 1) * 256 * isUTF16 );
			}
			artist.value = tpe1;
		}
	}
	reader.readAsBinaryString(file);

}

function waveformCreate( file, callback ) {
	var reader = new FileReader();
	reader.onload = function(e) {
		context.decodeAudioData( e.target.result, function( buffer ) {
			var channel = buffer.getChannelData(0);
			var sections = Math.floor( audio.duration * 5 );
			var len = Math.floor( channel.length / sections );
			var vals = [];
			for( var i = 0; i < sections; i += 10 ){
				var sum = 0.0;
				for( var j = i * len, ref = i * len + len - 1; j <= ref; ++j ){
					sum += channel[j] * channel[j];
				}
				vals.push( Math.sqrt( sum / channel.length ) * 10000);
			}
			if (i >= sections) {
				callback({ "buffer" : channel, "vals" : vals });
			}
		});
	}
	reader.readAsArrayBuffer( file );
}

function DragOver(evt){
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
}

function openMusic(evt){
	evt.stopPropagation();
	evt.preventDefault();
	if( event.dataTransfer ){
		event.dataTransfer.dropEffect = 'copy';
	}
	var input = event.target;
	var file;
	if( input.files ){
		file = input.files[0];
	} else {
		file = event.dataTransfer.files[0];
	}
	realfile = file;
	var reader = new FileReader();
	reader.onload = function(e){
		getMusic(new Blob([reader.result]));
	}
	reader.readAsArrayBuffer( file );
	label.src="";
}

window.addEventListener('load',function(){
	var name = document.createElement("div");
	name.innerText = "업로드";
	name.id = "name";
	document.body.appendChild(name);
	var body = document.createElement("div");
	body.id = "body";
	document.body.appendChild(body);
	var helper = document.createElement("div");
	helper.id = "helper";
	body.appendChild(helper);
	form = document.createElement("form");
	music = document.createElement("input")
	music.type = "file";
	music.accept = ".mp3"
	music.id = "music";
	music.onchange = openMusic;
	music.style.display = "none";
	form.appendChild(music);
	label = document.createElement("label");
	label.htmlFor = "music";
	label.addEventListener('dragover', DragOver, false);
	label.addEventListener('drop', openMusic, false);
	form.appendChild(label);
	img = document.createElement("img");
	img.src = "/img/upload.png";
	label.appendChild(img);
	title = document.createElement("input")
	title.placeholder = "제목";
	title.type = "text";
	form.appendChild(title);
	artist = document.createElement("input")
	artist.placeholder = "가수";
	artist.type = "text";
	form.appendChild(artist);
	genre = document.createElement("input")
	genre.placeholder = "장르";
	genre.type = "text";
	form.appendChild(genre);
	send = document.createElement("div")
	send.innerHTML = "전송하기";
	send.id = "send";
	send.style.backgroundColor = "gray";
	send.style.cursor = "initial";
	send.onclick = function(){
		if( music.files[0] != null && waveformArray != null && title.value != null && artist.value != null && genre.value != null ){
			send.style.backgroundColor = "gray";
			send.style.cursor = "initial";
			var formdata = new FormData();
			formdata.append("title",title.value);
			formdata.append("artist",artist.value);
			formdata.append("genre",genre.value);
			formdata.append("arr",waveformArray);
			formdata.append("file",music.files[0]);
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
				form.reset();
				realfile = null;
				img.src = "/img/upload.png";
				waveformArray = null;
				alert(xhr.responseText);
			}};
			xhr.open("POST","/uploadmusic", false); xhr.send(formdata);
		}
	}
	form.appendChild(send);
	body.appendChild(form);
});
