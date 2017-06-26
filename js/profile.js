
function friendDel(){
	xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
		alert(xhr.responseText); 
	}}
	xhr.open("POST","/frienddel", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('id='+userid);
}

var userid = document.URL.split('/')[4];
window.addEventListener('load', function(){
	xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
		if(!xhr.responseText){
			alert("존재하지 않는 사용자입니다.");
			location.href="/index.html";
		} else {
			user = JSON.parse(xhr.responseText);
			console.log(user);
			body = document.createElement("div");
			body.id = "body";
			document.body.appendChild(body);
			
			container = document.createElement("div");
			container.id = "container";
			body.appendChild(container);

			user_img = document.createElement("img");
			user_img.id = "user_img";
			user_img.src = "/profileimg/" + user.id;
			container.appendChild(user_img);			
	
			user_name = document.createElement("div");
			user_name.id = "user_name";
			user_name.innerHTML = user.name;
			container.appendChild(user_name);
		
			user_level = document.createElement("div");
			user_level.id = "user_level";
			user_level.innerHTML = user.level + "레벨";
			container.appendChild(user_level);
			
			friend_box = document.createElement("div");
			friend_box.id = "friend_box";
	
			var friend_title = document.createElement("div");
			friend_title.innerHTML = "친구목록"
			friend_title.className = "profile_title";
			body.appendChild(friend_title);

			friend_obj = document.createElement("div");
			body.appendChild(friend_obj);
			makeFriendList(friend_obj,user.id);
			
			var x = new XMLHttpRequest();
			x.onreadystatechange = function (event){ 
				if (x.readyState == 4 && x.status == 200){ 
					if(x.responseText.length >= 1 ){
						friend_box.innerText = x.responseText;
						friend_box.onclick = function(){
							if( friend_box.innerText == "no" ){
								friendAdd(userid,user_name.innerHTML);
								this.innerText = "request";
							} else if( friend_box.innerText == "request" || friend_box.innerText == "friend" ){
								friendDel(userid); 
								friend_box.innerText = "no";
							} else if( friend_box.innerText == "me" ){
								location.href="/myinfo";
							}
							friend_box.style.backgroundImage =" url('/img/friend_" + friend_box.innerText + ".jpg')";
						}
						friend_box.style.backgroundImage =" url('/img/friend_" + friend_box.innerText + ".jpg')";
					}
				}
				container.appendChild(friend_box);
			}
			x.open("POST","/isfriend", false); x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); x.send('id='+userid);
		}
	}}
	xhr.open("POST","/getuser", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('userid='+userid);
});

