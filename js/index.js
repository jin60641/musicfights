function getMarginLeft(num){
	return "calc( -" + num * 100 + "vw - " + 1.6 * num + "px )";
}

window.addEventListener('load',function(){
	document.body.addEventListener('scroll', function(e){ e.preventDefault(); });
	document.body.addEventListener('touchmove', function(e){ e.preventDefault(); });
	slider = document.getElementById('slider');
	help = document.getElementById('help');
	login_table = document.getElementById('login-table');
	var query =  document.URL.split('/?')[1];
	if ( query != undefined ){
		if( query == "success" ){
			alert("인증에 성공하였습니다. 입력하셨던 정보로 로그인 하십시오.");
		} else if( query == "fail" ){
			alert("인증에 실패하였습니다");
		}
	}
});

function sendData(){
        var name=document.getElementById("name").value;
        var id=document.getElementById("id").value;
        var password=document.getElementById("password").value;
        var email=document.getElementById("email").value;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
                if(xhr.responseText){
                        alert(xhr.responseText )
                        if( xhr.responseText.indexOf("@") + 1 ){
                                location.replace('/');
                        } else if(xhr.responseText[0]=="회" ){
                                location.replace('/');
                        } else if(xhr.responseText=="이미 사용중인 아이디입니다.") {
                                document.getElementById("id").value = "";
                        }
                }
        }}
        xhr.open("POST", "/register", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('id='+id+'&password='+password+'&name='+name+'&email='+email);
}

function capturekey(e){
        if(e.keyCode==13)
        sendData()
}

function sendData_findid(){
	var name=document.getElementById("find_id_name").value;
	var email=document.getElementById("find_id_email").value;
	var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
                if(xhr.responseText){
			alert(xhr.responseText);
		}
	}}
        xhr.open("POST", "/findid", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('name='+name+'&email='+email);
	document.getElementById("find_id").reset();
}

function sendData_findpw(){
	var name=document.getElementById("find_pw_name").value;
	var id=document.getElementById("find_pw_id").value;
	var email=document.getElementById("find_pw_email").value;
	var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
                if(xhr.responseText){
			alert(xhr.responseText);
		}
	}}
        xhr.open("POST", "/findpw", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('name='+name+'&id='+id+'&email='+email);
	document.getElementById("find_pw").reset();
}

function sendData_login(){
	var id=document.getElementsByName("id")[0].value;
	var password=document.getElementsByName("password")[0].value;
	var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
                if(xhr.responseText == "good"){
			location.href="/newsfeed";
		} else {
			alert( xhr.responseText);
		}
	}}
        xhr.open("POST", "/login", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('id='+id+'&password='+password);
}

function capturekey_login(e){
        if(e.keyCode==13)
        sendData_login()
}

