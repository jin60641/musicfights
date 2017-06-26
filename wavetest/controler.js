
var audioVisual = document.getElementById('controler');
controler.style.display="block";

//var audio_name_span = document.createElement("span");
//audio_name_span.innerHTML="현재 재생중인 곡 : ";
//controler.appendChild(audio_name_span);

controler.innerHTML+=" 볼륨 : "
var volume_input = document.createElement("input");
volume_input.type = "range";
volume_input.min = "0";
volume_input.max = "100";
volume_input.value = "100";
volume_input.onmousemove = function(){
	if( audio ){
		audio.volume = volume_input.value/100;
	}
}
controler.appendChild(volume_input);

var next_btn = document.createElement("input");
next_btn.type = "button";
next_btn.value = "다른노래";
next_btn.onclick = function(){
	stop_btn.onclick();
	openMusic();
}
controler.appendChild(next_btn);

var upload_btn = document.createElement("input");
upload_btn.accept = "audio/*";
upload_btn.type = "file";
upload_btn.onchange = function(){
	if(this.files.item(0)){
		openMusic(this.files.item(0));
	}
}
controler.appendChild(upload_btn);

controler.appendChild(document.createTextNode(" 바 높이 : "));
var bar_height_input = document.createElement("input");
bar_height_input.type = "range";
bar_height_input.min = "0";
bar_height_input.max = "800";
bar_height_input.value = "256";
controler.appendChild(bar_height_input);

controler.appendChild(document.createTextNode(" 바 간격 : "));
var bar_gap_input = document.createElement("input");
bar_gap_input.type = "range";
bar_gap_input.min = "1";
bar_gap_input.max = "5";
bar_gap_input.value = "1";
controler.appendChild(bar_gap_input);

controler.appendChild(document.createTextNode(" 바 개수 : "));
var num_bars_input = document.createElement("input");
num_bars_input.type = "range";
num_bars_input.min = "60";
num_bars_input.max = "480";
num_bars_input.value = "240";
num_bars_input.onchange = function(){
	bar_gap_input.max = Math.floor( wave.width / num_bars_input.value ) - 1;
	if( bar_gap_input.value > bar_gap_input.max ){
		bar_gap_input.value = bar_gap_input.max;
	}
}
controler.appendChild(num_bars_input);



var play_btn = document.createElement("input");
play_btn.type = "button";
play_btn.value = "재생";
play_btn.style.display="none";
play_btn.onclick = function(){
	audio.play();
}
controler.appendChild(play_btn);

var pause_btn = document.createElement("input");
pause_btn.type = "button";
pause_btn.value = "일시정지";
pause_btn.style.display="none";
pause_btn.onclick = function(){
	audio.pause();
}
controler.appendChild(pause_btn);

var stop_btn = document.createElement("input");
stop_btn.type = "button";
stop_btn.value = "정지";
stop_btn.onclick = function(){
	if( audio ){
		waveCtx.clearRect(0,0,waveCtx.width,waveCtx.height);
		audio.pause();
		audio.currentTime = 0;
	}
}
controler.appendChild(stop_btn);

var color_btn = document.createElement("input");
color_btn.type = "color";
color_btn.value = "#FF357C";
controler.appendChild(color_btn);

