Array.prototype.max = function() {
return Math.max.apply(null, this);
};

var WaveformCreate = function( file, canvas, barwidth, callback ) {
this.callback = callback;
this.audioContext = new AudioContext();
var reader = new FileReader();
reader.onload = function(e) {
Waveform.audioContext.decodeAudioData( e.target.result, function( buffer ) {
console.log("decodeAudioData Start");
var channel = buffer.getChannelData(0);
var sections = canvas.width;
var len = Math.floor( channel.length / sections );
var vals = [];
for( var i = 0; i < sections; i += barwidth ){
console.log("Extract Buffer : " + Math.floor( i / sections * 100 ) + "%");
var sum = 0.0;
for( var j = i * len, ref = i * len + len - 1; j <= ref; ++j ){
sum += channel[j] * channel[j];
}
vals.push( Math.sqrt( sum / channel.length ) * 10000);
}
if (i >= sections) {
console.log("Extract Buffer : Finish");
console.log("decodeAudioData : Finish");
Waveform.callback({ "buffer" : channel, "vals" : vals });
}
});
}
reader.onprogress = function(e){
var percentLoaded = Math.round( ( e.loaded / e.total ) * 100 );
if( percentLoaded < 100 ){
console.log("Waveform : " + percentLoaded);
} else {
console.log("Waveform Complete");
}
};
reader.readAsArrayBuffer( file );
}

