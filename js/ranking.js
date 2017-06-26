function getRank(){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
		var data = JSON.parse(xhr.responseText);
		for( var i = 0; i < data.length; ++i ){
			var name = document.createElement("div");
			name.className = "name";
			name.innerHTML = "<img src='/profileimg/" + data[i].id + "' onclick='location.href=\"/profile/" + data[i].id + "\" '>" + (i+1) + "위 | " + data[i].name;
			ranklist.appendChild(name);

			var score = document.createElement("div");
			score.className = "score";
			score.innerText = data[i].level + "레벨(" + Math.floor( data[i].exp / (data[i].level * 500) * 100 )/100+ "%)";
			ranklist.appendChild(score);
			ranklist.innerHTML += "<br>";
			skip += 10;
		}
	}};
	xhr.open("POST", "/getranking", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('skip='+skip);
}

var skip = 0;
window.addEventListener('load', function(){
	ranklist = document.createElement("div");
	ranklist.id = "ranklist";
	document.body.appendChild(ranklist);
	getRank();
	skip += 10;
	window.addEventListener('scroll', function(){
		if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight){
				getRank()
				skip+=10;
		}
	});

});
