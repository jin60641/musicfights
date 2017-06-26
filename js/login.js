

function sendData_login()
{
        id=document.getElementsByName("id")[0].value;
        password=document.getElementsByName("password")[0].value;
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
	        if(xhr.responseText){
		        alert(xhr.responseText)
		        if(xhr.responseText[0]=="환") { 
				location.href = '/index.html'; 
			}
	        }
        }}
        xhr.open("POST", "/login", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('id='+id+'&password='+password);
}

function capturekey_login(e){
        if(e.keyCode==13)
        sendData()
}

