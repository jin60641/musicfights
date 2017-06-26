//브라우저가 무엇인지 판단
function getBrowser(){
	if( /webkit/i.test( navigator.userAgent ) ){
		return "webkit";
	} else if( /Trident||msie||\.net/i.test( navigator.userAgent ) ){
		return "ms";
	} else if( /moz/i.test( navigator.userAgent ) ){
		return "moz";
	} else {
		return "webkit";
	}
}

//로그아웃
function sessionLogOut(){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function( event ){
		location.href = "/";
	};
	xhr.open("POST", "/logout", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send();
}

//친구추가
function friendAdd(id,name){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){
		if (xhr.readyState == 4 && xhr.status == 200){
			alert(xhr.responseText);
		}
	};
	xhr.open("POST","/friendadd", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('id='+id+'&name='+name);
}


function friendDel(id){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){
		if (xhr.readyState == 4 && xhr.status == 200){
			alert(xhr.responseText);
		}
	};
	xhr.open("POST","/frienddel", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('id='+id);
}

var search_result_view=0;
function search_result_none(){
	if(search_result_view){
		return 0;
	} else {
		document.getElementById("search_result").style.display="none";
	}
}

function fade(obj, start, end, time ) {
	var speed = Math.round( time / 100 );
	var timer = 0;
	if( start > end ){
		for( i = start; i >= end; --i ){
			( function( tmp ){
				setTimeout(function(){
					obj.style.opacity = (tmp / 100);
					if( (tmp/100) <= 0 ){
						document.body.removeChild(toast);
					}
				}, (timer * speed));
				timer++;
			}(i));
		}
	} else if( start < end ){
		for( i = start; i <= end; ++i ){
			( function( tmp ){
				setTimeout(function(){
					obj.style.opacity = (tmp / 100);	
				}, (timer * speed));
				timer++;
			}(i));
		}
	}
}


make_toast = function(text){
	toast = document.createElement("div");
	toast.id = "toast";
	document.body.appendChild(toast);
	toast.innerHTML = text;
	fade( toast, 0, 70, 500 );
	setTimeout( function(){
		fade( toast, 70, 0, 500 );
	}, 500 );
}

make_gamebtn = function(){
	game_btn = document.createElement("div");
	game_btn.innerHTML = "GAME START";
	game_btn.onclick = function(){
		location.href = "/room";
	}
	game_btn.id = "game_btn";
	game_btn.style.bottom = "0px";
	document.body.appendChild(game_btn);
	
	tmp_scrollY = 0;
	window.addEventListener('scroll',function(){
		var bottom = parseInt(game_btn.style.bottom.split('px')[0]);
		bottom -= window.scrollY - tmp_scrollY;
		if( bottom > 0 ){
			game_btn.style.bottom = "0px";
		} else if( bottom < -40 ){
			game_btn.style.bottom = "-40px";
		} else {
			game_btn.style.bottom = bottom + "px";
		}
		tmp_scrollY = window.scrollY; 
	});
}



window.addEventListener('load', function(){
	document.body.ondragstart = function(){
		return false;
	}
});
