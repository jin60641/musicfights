

function makeFriendList(obj,userid){
	friend_list = document.createElement("div");
	friend_list.id = "friend_list"
	obj.appendChild(friend_list);
	
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200){
		if( xhr.responseText.length >=1 ){
			var friends = JSON.parse(xhr.responseText);
			console.log(friends);
			for( var i = friends.length - 1; i >= 0; --i ){
				var friend = document.createElement("div")
				friend.id = friends[i].id;
				friend.onclick = function(){
					location.href = "/profile/" + this.id;
				}
				var name = document.createElement("div");
				name.className = "friend_name";
				name.style.background = "url('/img/room_background?" + friends[i].id + "')";
				name.innerHTML = friends[i].name;
				friend.appendChild(name);
				
				var profile = document.createElement("img");
				profile.src = "/profileimg/" + friends[i].id;
				friend.appendChild(profile);
				
				var level = document.createElement("div");
				level.className = "friend_level";
				level.innerHTML = friends[i].level + "레벨";
				friend.appendChild(level);
				friend_list.appendChild(friend);
			}
		} else {
			var none = document.createElement("p");
			none.id = "friend_none";
			none.innerHTML = "등록된 친구가 없습니다.";
			friend_list.appendChild(none);
		}
	}}
	xhr.open("POST", "/getfriends", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send("userid="+userid);
}
