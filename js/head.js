//친구검색(헤더)
function sendData_search( query ){
	if( query ){
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
			var result = search_result;
			if( xhr.responseText != "[]" ){
				result.innerHTML="";
				var xhrResult = JSON.parse( xhr.responseText );
				if( xhrResult.length ){
					for( var i = xhrResult.length - 1; i>=0; i--){
						result.innerHTML+='<a href="/profile/' + xhrResult[i].id + '"><div><img src="/profileimg/' + xhrResult[i].id + '">' + xhrResult[i].name.toString() + '</div></a>';
					}
				} else {
					result.innerHTML+='<div><img src="/profileimg/' + xhrResult.id + '"><a href="/profile/' + xhrResult.id + '">' + xhrResult.name.toString() + '</a></div>';
				}
			} else {
				result.innerHTML='<div id="search_none">표시할 검색 결과가 없습니다.</div>';
			}
		}}
		xhr.open("POST", "/search", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('query='+query);
	} else {
		search_result.innerHTML='<div id="search_none">표시할 검색 결과가 없습니다.</div>';
	}
}

function getNotices(cnt){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200){
		if( xhr.responseText ){
			notice.innerHTML = xhr.responseText;
		} else {
			notice.innerHTML = 0;
		}
	}}
	xhr.open("POST", "/getnotice", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('cnt='+cnt);
}

window.addEventListener('load',function(){
	head = document.createElement("div");
	document.body.insertBefore(head,document.body.firstChild);
	head.id="head";
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200){
		if( xhr.responseText == "" ){
			location.href="/";
		}
		var xhrResult = JSON.parse(xhr.responseText);
		head.innerHTML = "<a href='/profile/" + xhrResult.id_num + "' class='navi_menu' style='padding-left:35px;'><img src='/profileimg/" + xhrResult.id_num + "' id='profileimg_head' >" + xhrResult.name + "</a>";
	//	head.innerHTML += "<div id='notice' class='navi_menu' style='border-left:1px solid white;'></div>";
		head.innerHTML+="<input type='text' name='query' onkeyup='return sendData_search(this.value);' placeholder='친구 찾기' onfocusout='search_result_none()' onfocus='document.getElementById(\"search_result\").style.display=\"block\";' id='search' onclick='event.stopPropagation();' onsubmit='return false;' autocomplete='off'>";
		head.innerHTML+="<div id='search_result' onmouseover='search_result_view=1;' onmouseout='search_result_view=0';><div id='search_none'>표시할 검색 결과가 없습니다.</div></div>";
		head.innerHTML+="<img src='/img/logo_white.png' id='head_logo' onclick='head_menu_show()'>";
		window.addEventListener('click', function(){
			head_menu.style.display = "none";
			search_result.style.display = "none";
		});
		head_menu = document.createElement("div");
		head_menu.id = "head_menu";
		head_menu.innerHTML += "<a href='/newsfeed'><img src='/img/menu_home.png'>| 홈</a>";
		head_menu.innerHTML += "<a href='/room'><img src='/img/menu_game.png'>| 게임</a>";
		head_menu.innerHTML += "<a href='/ranking'><img src='/img/menu_ranking.png'>| 랭킹</a>";
		head_menu.innerHTML += "<a href='#' onclick='sessionLogOut();'><img src='/img/menu_logout.png'>| 로그아웃</a>";
		
		
		head_menu.style.display = "none";
		head.appendChild(head_menu);
		//<span onclick='sessionLogOut()'>로그아웃</span>";
		search_result = document.getElementById("search_result");

		//getNotices(0);
		/*
		notice.addEventListener('click', function(){
			if( parseInt( this.innerHTML ) >= 1 ){
				var xhr2 = new XMLHttpRequest();
				xhr2.onreadystatechange = function (event){ if(xhr2.readyState == 4 && xhr2.status == 200){
					var notices = JSON.parse( xhr2.responseText );
					console.log(notices);
					for( var i = 0; i < notices.length; ++i ){
						console.log(notices[i]);
						//notice_box.innerHTML = 
					}
				}}
				xhr2.open("POST", "/getnotice", false); xhr2.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr2.send('cnt='+parseInt(notice.innerHTML));
			}
		});
		*/
	}}
	xhr.open("POST", "/getuser", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send();
});

function head_menu_show(){
	event.stopPropagation();
	if( head_menu.style.display == "block" ){
		head_menu.style.display = "none";
	} else {
		head_menu.style.display = "block";
	}
}
