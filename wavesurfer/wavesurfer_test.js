var wavesurfer = Object.create(WaveSurfer);

wavesurfer.init({
	container : document.getElementById("wave1"),
	waveColor : 'violet',
	progressColor : 'purple'
});

wavesurfer.on('ready', function () {
	var timeline = Object.create(WaveSurfer.Timeline);

	timeline.init({
		wavesurfer: wavesurfer,
		container: "#wave-timeline"
	});
	audio.style.display="block";
	wavesurfer.setVolume(0)
//	wavesurfer.play();
});

wavesurfer.load('./test.mp3');
