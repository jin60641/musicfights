function sendData(){
	password = prompt("확인을 위해 현재 비밀번호를 입력해주십시오.");
	if(!password) return;
        name=document.getElementsByName("name")[0].value;
        id=document.getElementsByName("id")[0].value;
        new_password=document.getElementsByName("new_password")[0].value;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
                if(xhr.responseText){
                        alert( xhr.responseText )
                        if(xhr.responseText=="회원정보가 수정되었습니다. 다시 로그인 해주십시오."){
                                location.href = '/login.html';
                        } else if(xhr.responseText=="이미 사용중인 아이디입니다.") {
                                document.getElementById("id").value = "";
                        } else if(xhr.responseText=="비밀번호가 맞지 않습니다.") {
                                document.getElementById("password").value = "";
			} else if(xhr.responseText=="로그인 해주십시오.") {
				location.href = '/login.html';
			}
                }
        }}
        xhr.open("POST", "userupdate", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('password='+password+'&id='+id+'&new_password='+new_password+'&name='+name);
}

function capturekey(e){
        if(e.keyCode==13)
        sendData()
}

