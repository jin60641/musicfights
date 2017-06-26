

function postWrite(){
	var upload = file.files[0];
	var formdata = new FormData();
	formdata.append("file",upload);
	formdata.append("text","");
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200){
		socket.emit( 'post_write' );
		form.submit();
	}}
	xhr.open("POST","/writepost", false);  xhr.send(formdata);
}

window.addEventListener('load',function(){
	socket = io.connect('/');

	body = document.createElement("div");
	body.id = "body";
	document.body.appendChild(body);

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200){ 
		if( xhr.responseText.length >= 1 ){
			var xhrResult = JSON.parse(xhr.responseText);

			form = document.createElement("form");
			form.action="/profileimg";
			form.method="post";
			form.enctype="multipart/form-data";
			body.appendChild(form);
			
			label = document.createElement("label")
			label.htmlFor = "file";
			form.appendChild(label);

			my_img = document.createElement("img");
			my_img.id = "my_img";
			my_img.src = '/profileimg/' + xhrResult.id_num;
			label.appendChild(my_img);
			
			file = document.createElement("input");
			file.type = "file";
			file.accept = "image/*";
			file.id="file";
			file.name="file";
			file.onchange = postWrite;
			form.appendChild(file);
			
			my_id = document.createElement("div");
			//my_id.innerHTML = xhrResult.userid;
			my_id.innerHTML = "아이디 수정";
			my_id.onclick = function(){
				var id = prompt("바꾸실 아이디를 입력해주십시오.");
				if( !id ) return;
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
                			if(xhr.responseText){
						alert(xhr.responseText);
						location.reload(true);
					}
				}}
				xhr.open("POST", "/userupdate", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('id='+id);
			}
			body.appendChild(my_id);

			my_name = document.createElement("div");
			//my_name.innerHTML = xhrResult.name;
			my_name.innerHTML = "이름 수정";
			my_name.onclick = function(){
				var name = prompt("바꾸실 이름을 입력해주십시오.");
				if( !name ) return;
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
                			if(xhr.responseText){
						alert(xhr.responseText);
						location.reload(true);
					}
				}}
				xhr.open("POST", "/userupdate", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('name='+name);
			}
			body.appendChild(my_name);


			my_drop = document.createElement("div");
			my_drop.innerHTML = "회원탈퇴";
			my_drop.onclick = userdrop;
			body.appendChild(my_drop)
		}
	}}
        xhr.open("POST", "/getuser", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send();
});

function userdrop(){
	var password = prompt("비밀번호를 입력해주십시오.");
	if(password){
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){ location.href="/"} }
		xhr.open("POST","/userdrop", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('password='+password);
	}
}
