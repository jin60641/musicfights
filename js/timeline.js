window.addEventListener("click", hidemenu);
window.addEventListener("keydown",keydown);

//모바일을 위한 터치 이벤트 리스너

	/*
		if( !document.webkitIsFullScreen ){
			console.log(event);
			imglayer.style.opacity="0";
			lefthover.style.display="none";
			righthover.style.display="none";
			imgmenuhover.style.display="none";
			imgviewing=0;
		} else {
		}
	*/

window.addEventListener('scroll',preventDefault);
window.addEventListener('touchmove',preventDefault);
window.addEventListener('mousewheel',preventDefault);

function preventDefault(event) {
	if( imgviewing ){
		event.stopPropagation();
		event.preventDefault();
		event.returnValue = false;
		return false;
	}
}

//크롬전체화면
document.addEventListener('webkitfullscreenchange', function(){
	event.stopPropagation();
	event.preventDefault();
	if(!document.webkitIsFullScreen){
		imgbox.style.width="";
		imgbox.style.height="";
		imgbox.style.top="";
		imgbox.style.left="";
		imgbox.style.position="";
		for( var j=imgbox.childNodes.length - 1 ; j>=1; --j ){
			imgbox.childNodes[j].style.border="";
		}
	}
});

//게시물,덧글 메뉴닫기
function hidemenu(){
	var post_menu = document.getElementsByClassName("post_menu");
	var reply_menu = document.getElementsByClassName("reply_menu");
	for(var i = reply_menu.length-1;i>=0;i--){
		reply_menu[i].style.display="none";
	}
	for(var i = post_menu.length-1;i>=0;i--){
		post_menu[i].style.display="none";
	}
	if( select ){
		select.style.borderColor = "#e5e6e9 #dfe0e4 #d0d1d5";
		select.style.boxShadow = "initial";
	}
}

//보고싶지 않습니다(덧글)
function dontsee_reply(replyid){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
		var reply = document.getElementById(replyid);
	}};
	xhr.open("POST", "/dontsee_reply", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('replyid='+replyid.substr(10));
}

//보고싶지 않습니다(게시물)
function dontsee(postid){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
		var post = document.getElementById("post_"+postid);
		post.style.display="none";
		var dontsee_menu = document.createElement("div");
		dontsee_menu.className = "post";
		dontsee_menu.style.paddingBottom = "8px";
		dontsee_menu.innerHTML = "뉴스피드에 이 게시물이 표시되지 않습니다. <span style='color:#34a798;cursor:pointer;' onclick='dontsee_cancle(" + postid + ")'>취소</span>";
		dontsee_menu.innerHTML += "<img src='/img/remove_reply.jpg' style='width:16px; float:right; cursor:pointer' onclick='this.parentNode.parentNode.removeChild(this.parentNode)'><br>";
		postwrap.insertBefore(dontsee_menu,post);
	}}
	xhr.open("POST", "/dontsee", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('postid='+postid);
}

//보고싶지 않습니다 취소
function dontsee_cancle(postid){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
		var post = document.getElementById("post_"+postid);
		post.style.display="";
		postwrap.removeChild(post.previousElementSibling);
	}}
	xhr.open("POST", "/dontsee", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('postid='+postid);
}

//관심글 등록, 취소
function favorite(postid,add){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
		var menu_favorite = document.getElementById("favorite_"+postid);
		if(add){
			menu_favorite.onclick=function(){
				favorite(this.id.substr(9),0)
			}
			menu_favorite.innerText="관심글해제";
			var span = document.createElement("span")
			span.className="post_favorite";
			span.innerHTML="<img src='/img/star.png'>";
			span.id="post_favorite_"+postid;
			document.getElementById("post_"+postid).insertBefore(span,document.getElementById("post_inside_"+postid));
			imgmenu_favorite.src='/img/favorite_remove.png';
			imgmenu_favorite.onclick = function(){
				event.stopPropagation();
				favorite(postid,0)
			}
		} else {
			menu_favorite.onclick=function(){
				favorite(this.id.substr(9),1)
			}
			menu_favorite.innerText="관심글등록";
			document.getElementById("post_"+postid).removeChild(document.getElementById("post_favorite_"+postid));
			imgmenu_favorite.src='/img/favorite.png';
			imgmenu_favorite.onclick = function(){
				favorite(postid,1)
			}
		}
	}}
	xhr.open("POST", "/favorite", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('postid='+postid);
}

// 게시글 수정
function changePost(postid){
	var cancle = document.createElement("div");
	cancle.id = "changecancle_"+postid;
	cancle.onclick = function(){
		cancleChange(this.id.substr(13));
	}
	cancle.innerText="수정 취소";
	document.getElementById("menu_"+postid).replaceChild(cancle,document.getElementById("changepost_"+postid))
	var inside = document.getElementById("post_inside_"+postid);
	inside.style.paddingBottom="39px";
	var textarea = document.createElement("textarea");
	textarea.value = inside.firstChild.innerText;
	textarea.onkeypress=function(){post_resize(this)};
	textarea.onkeydown=function(){post_resize(this)}; 
	textarea.onkeyup=function(){post_resize(this)};
	textarea.placeholder="글을 입력하세요.";
	if(inside.firstChild.innerText){
		eval("origin_"+postid+"=inside.firstChild.cloneNode(true)");
		inside.replaceChild(textarea,inside.firstChild);
	} else {
		inside.insertBefore(textarea,inside.firstChild);
	}
	var postbtn = document.createElement("div");
	postbtn.className = "post_change_button";
	postbtn.onclick=function(){
		changePost_apply(this.parentNode);
	}
	var label = document.createElement("label");
	label.className = "post_change_label";
	label.htmlFor = "post_file_"+postid;
	inside.insertBefore(label,textarea.nextElementSibling);
	inside.insertBefore(postbtn,textarea.nextElementSibling);
	var input = document.createElement("input");
	input.className = "post_change_file";
	input.id = "post_file_"+postid;
	input.type = "file";
	input.accept = "image/*";
	input.multiple = "multiple";
	input.onchange = function(event){
		openfile_post(event,this.id.substr(10));
	}
	inside.insertBefore(input,postbtn);
	var output = document.createElement("div");
	output.className = "output_change";
	output.id = "changeoutput_"+postid;
	inside.insertBefore(output,postbtn);
	var post_span = inside.parentNode.childNodes[1];
	eval("fileindex_"+postid+"=[]");
	eval("var fileindex = fileindex_"+postid);
	eval("realfiles_"+postid+"=[]");
	if(post_span.className == "post_span"){
		for(var j = inside.childElementCount - 1; j>=0; --j){
			if(inside.childNodes[j].tagName == "IMG"){
				var src = inside.childNodes[j].src;
				for(var i = parseInt(post_span.innerText) - 1; i>=0; --i){
					fileindex[i] = i + 1;
					var imgbox = document.createElement("div");
					imgbox.id = "postimg_" +( output.childElementCount + 1);
					imgbox.className='post_imgbox';
					output.appendChild(imgbox);
					output.style.display="block";
					imgbox.addEventListener("dragstart",function(evt){
						evt.stopPropagation();
						evt.preventDefault();
						return false;
					});
					var dataURL = event.target.result;
					imgbox.style.background="url('" + src + "') center center no-repeat"
					src = src.replace(/(.*\/)(.*)(\.jpg*)/i,"$1"+(i+1)+"$3");
					imgbox.style.backgroundSize="cover";
					imgbox.style.backgroundClip="content-box";
					var deletebtn = document.createElement("div");
					deletebtn.className='delete_postimg';
					deletebtn.onclick= function(){
						eval("var realfiles = realfiles_"+this.parentNode.parentNode.id.substr(13));
						fileindex.splice( parseInt(this.parentNode.id.substr(8)) - 1 , 1);
						output.removeChild(this.parentNode);  
						for( var j=0; j<output.childElementCount;++j){
							output.children[j].id = "postimg_" + (j+1);
						}
					}
					imgbox.appendChild(deletebtn);
				}
				inside.removeChild(inside.childNodes[j]);
			} 
		}
	}
	textarea.focus();
}


//게시글 수정 완료
function changePost_apply(inside){
	if(!confirm("수정된 사항을 저장하시겠습니까?")){
		return false;
	}
	var formdata = new FormData();
	var postid = inside.id.substr(12);
	eval("var realfiles_change = realfiles_"+postid);
	eval("var fileindex = fileindex_"+postid);
	if( fileindex[0] || inside.firstElementChild.value.length>= 1 ){
		for( var i=realfiles_change.length-1; i>=0; --i){
			formdata.append("file",realfiles_change[i]);
		}
		formdata.append("text",inside.firstChild.value);
		var xhr = new XMLHttpRequest();
	} else {
		alert("게시글이 비어 있습니다.");
		return false;
	}
	xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200) {
		inside.style.paddingBottom="3px";
		inside.innerHTML="<span>"+inside.firstChild.value+"</span><br />";
		if(xhr.responseText){ 
			var xhrResult = JSON.parse( xhr.responseText );
			var date = new Date( xhrResult.date ).getTime();
			var post_span = inside.parentNode.childNodes[1];
			if(post_span.className == "post_span"){
				if(xhrResult.file){
					if(post_span.innerText == xhrResult.file ){ 
					} else { 
						post_span.innerText = xhrResult.file;
					}
				} else {
					post_span.parentNode.removeChild(post_span);
				}
			} else {
				if(xhrResult.file){
					var span = document.createElement("span");
					span.className = "post_span";
					span.addEventListener('click', function(e){ 
						document.getElementById("postimg_" +postid).click();
					}, false);
					span.innerHTML = xhrResult.file;
					inside.parentNode.insertBefore(span,inside.parentNode.firstElementChild.nextElementSibling);
				}
			}
			if(xhrResult.file){
				inside.innerHTML+="<img src='/files/postimg/"+postid+"/1.jpg?"+xhrResult.date+"' id='postimg_"+postid+"' class='postimg' onclick='viewimg("+postid+","+xhrResult.file+",\""+ xhrResult.date+"\")' ></img>"
			}
			cancleChange(postid);
			/*
			// 수정됨 삽입기능 ( 모바일이 좁아서 보류 )
			var post_date;
			for( var i = inside.parentNode.childElementCount - 1; i >= 0; --i){
				if( inside.parentNode.childNodes[i].className == "post_changed"){
					break;
				} else if( inside.parentNode.childNodes[i].className == "date" ){
					post_date = inside.parentNode.childNodes[i];
				} else if( i == 0 ){
					var span = document.createElement("span");
					span.className='post_changed';
					span.onclick= function(){
						alert(getDateString(date,false,true));
					}
					span.innerHTML="수정됨";
					inside.parentNode.insertBefore(span,post_date.nextElementSibling)
				}
			}
			*/
			//socket.emit( 'post_change' );
		}
	}}
	if( fileindex[0] ){
		xhr.open("POST","/changepost/" + postid + "/" + fileindex, false); xhr.send(formdata)
	} else {
		xhr.open("POST","/changepost/" + postid + "/0", false); xhr.send(formdata)
	}
}

//게시글 수정 취소
function cancleChange(postid){
	eval("delete realfiles_"+postid);
	eval("delete fileindex_"+postid);
	var div = document.createElement("div")
	div.id = "changepost_"+postid;
	div.onclick = "changePost("+postid+")";
	div.innerText="게시글수정";
	div.onclick=function(){
		changePost(this.id.substr(11));
	}
	var inside = document.getElementById("post_inside_"+postid);
	inside.style.paddingBottom="3px";
	document.getElementById("menu_"+postid).replaceChild(div,document.getElementById("changecancle_"+postid))
	for(var i = inside.childElementCount - 1; i>=0; --i){
		var child = inside.childNodes[i];
		if(child.tagName=="TEXTAREA"){
			var origin;
			try {
				eval("origin = origin_"+postid);
			}
			catch(err){
				inside.removeChild(child);
				continue;
			}
			inside.replaceChild(origin,child);
			eval("delete origin_"+postid);
		} else if(!(child.tagName=="SPAN"||child.tagName=="IMG"||child.tagName=="BR")){
			inside.removeChild(child);
		}
	}
	var post_span = inside.parentNode.childNodes[1];
	if(post_span.className == "post_span"){
		/*
		var imgcount = parseInt(post_span.innerText);
		for( var i = 1; i <= imgcount; ++i ){
		}
		*/
	}
}

//파일열기(writepost) paste
function openfile_paste(event,postid){

}

//파일열기(writepost)
function openfile_post(event,postid){
	event.stopPropagation();
	event.preventDefault();
	if( event.dataTransfer ){
		event.dataTransfer.dropEffect = 'copy';
	}
	if(postid){
		var output = document.getElementById("changeoutput_"+postid);
		eval("var realfiles = realfiles_"+postid);
		eval("var fileindex = fileindex_"+postid);
	} else {
		var output = output_post;
	}
	var input=event.target;
	var files;
	if(input.files){
		input.style.borderTop="1px solid rgb(86,210,199)";
		input.style.borderBottom="1px solid rgb(86,210,199)";
		input.focus();
		files = input.files;
	} else {
		files = event.dataTransfer.files;
	}
	for( var i = 0; i<files.length; ++i){
		if(realfiles.length>=20){
			alert("사진은 최대 20장까지만 업로드 가능합니다.");
			return false;
		}
		realfiles.push(files[i]);
		if(postid){
			var post_span = input.parentNode.parentNode.childNodes[1];
			if(post_span.className == "post_span"){
				if( fileindex[fileindex.length - 1] < parseInt(post_span.innerText) ){
					fileindex.push(parseInt(post_span.innerText)+1);
				} else {
					fileindex.push(fileindex[fileindex.length - 1] + 1);
				}
			} else {
				fileindex.push(1);
			}
		}
		var reader = new FileReader();
		reader.addEventListener("progress",function(evt){ // 진행도 표시
			// Math.round((evt.loaded / evt.total) * 100) 
			if(evt.lengthComputable){
				var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
				if( percentLoaded < 100 ){
					//progress.style.width = percentLoaded + '%';
					//progress.innerHTML = percentLoaded + '%';
				}
			}
		});
		reader.addEventListener("load",function(event){
			var imgbox = document.createElement("div");
			imgbox.id = "postimg_" +( output.childElementCount + 1);
			imgbox.className='post_imgbox';
			output.appendChild(imgbox);
			output.style.display="block";
			imgbox.addEventListener("dragstart",function(evt){
				evt.stopPropagation();
				evt.preventDefault();
				return false;
			});
			var dataURL = event.target.result;
			imgbox.style.background="url('"+dataURL+"') center center no-repeat"
			imgbox.style.backgroundSize="cover";
			imgbox.style.backgroundClip="content-box";
			var deletebtn = document.createElement("div");
			deletebtn.className='delete_postimg';
			if(postid){
				deletebtn.onclick= function(){
					eval("var realfiles = realfiles_"+this.parentNode.parentNode.id.substr(13));
					eval("var fileindex = fileindex_"+this.parentNode.parentNode.id.substr(13));
					var index = parseInt(this.parentNode.id.substr(8)) - 1;
					realfiles.splice( index - output.childElementCount + realfiles.length , 1 );
					fileindex.splice( index , 1);
					output.removeChild(this.parentNode);  
					for( var j=0; j<output.childElementCount;++j){
						output.children[j].id = "postimg_" + (j+1);
					}
				}
			} else {
				deletebtn.onclick= function(){
					realfiles.splice( (parseInt(this.parentNode.id.substr(8)) - 1), 1 );
					output.removeChild(this.parentNode);  
					for( var j=0; j<output.childElementCount;++j){
						output.children[j].id = "postimg_" + (j+1);
					}
				}
			}
			imgbox.appendChild(deletebtn);
			if(input.type=="file"){
				input.value="";
			}
		});
		reader.readAsDataURL(files[i]);
	}
	//input.value="";
}

//파일열기(댓글쓰기)
function openfile_reply(event,change){
	var input=event.target;
	var reader = new FileReader();
	reader.addEventListener("load",function(event){
		var deleteimg = document.createElement("div");
		deleteimg.className = "delete_replyimg";
		if( change ){
			var output = document.getElementById("replyoutput_change_"+input.id.substr(18));
			document.getElementById("replyinput_change_"+input.id.substr(18)).style.display="none";
			deleteimg.onclick= function(){
				input.previousElementSibling.previousElementSibling.style.display="";
				this.parentNode.removeChild(this.previousElementSibling); 
				this.style.display = "none";
				input.value="";
			}
		} else {
			var output = document.getElementById("replyoutput_"+input.id.substr(11));
			document.getElementById("replywrite_"+input.id.substr(11)).lastElementChild.style.display="none";
			deleteimg.onclick= function(){
				input.previousElementSibling.lastElementChild.style.display="";
				this.parentNode.removeChild(this.previousElementSibling);
				this.style.display = "none";
				input.value="";
			}
			deleteimg.onmouseover = function(){
				this.style.display = "block";
			}
		}
		var dataURL = event.target.result;
		output.style.display="block";
		var div = document.createElement("div");
		div.className = "replyoutput_img"
		div.style.background = "url('"+dataURL+"') center center no-repeat"
		div.style.backgroundSize="cover";
		div.style.backgroundClip="content-box";
		div.addEventListener('mouseover', function(){
			this.nextElementSibling.style.display = "block";
		});
		div.addEventListener('mouseout', function(){
			this.nextElementSibling.style.display = "none";
		});
		output.innerHTML = "";
		output.appendChild(div);
		output.appendChild(deleteimg);
	});
	reader.readAsDataURL(input.files[0]);
}

//댓글 수정
function changeReply(post_id,id){
	var reply = document.getElementById("reply_"+post_id+"_"+id);
	reply.onkeydown = function(event){ capturekey_replychange(event,post_id,id)}
	reply.lastElementChild.style.display="none";
	reply.innerHTML += "<textarea type='text' style='margin-left:7px;' id='replychange_" + id + "' class='writereply' onkeyup='reply_resize(this)' onkeydown='reply_resize(this)' onkeypress='reply_resize(this)' placeholder='댓글을 입력하세요...' ></textarea><label for='replyinput_change_" + id + "' class='replyinput_label'></label>";
	var replywrite = document.getElementById('replychange_'+id);
	replywrite.value = reply.childNodes[1].childNodes[2].data;
	reply_resize(replywrite);
	var cancle = document.createElement("div");
	cancle.id = "cancle_change_reply_" + id;
	cancle.style.fontSize = "12px";
	cancle.style.marginLeft = "49px";
	cancle.style.display="inline-block";
	reply.appendChild(cancle);
	replywrite.onfocus = function(){
		cancle.onclick = "";
		cancle.innerText = "수정을 취소하시려면 ESC키를 누르세요";
		cancle.style.color= "#aaaaaa";
		cancle.style.cursor = "";
	}
	replywrite.addEventListener("focusout", function(){
		cancle.onclick = function(){
			cancleChange_reply(post_id,id);
		}
		cancle.innerText = "취소";
		cancle.style.color = "#34a798";
		cancle.style.cursor = "pointer";
	});
	replywrite.focus();
	var reply_upload = document.createElement("input");
	reply_upload.type = "file";
	reply_upload.accept = 'image/*';
	reply_upload.id="replyinput_change_" + id;
	reply_upload.onchange = function(event){ openfile_reply(event,1) }
	reply.appendChild(reply_upload);
	var reply_output = document.createElement("div");
	reply_output.className = "replyoutput";
	reply_output.id = "replyoutput_change_" + id;
	reply.appendChild(reply_output);
	
}

//댓글 수정 취소
function cancleChange_reply(post_id,id){
	var reply = document.getElementById("reply_"+post_id+'_'+id)

	for( var i = reply.childElementCount - 1 ; i >= 2 ; --i ){
		reply.removeChild(reply.childNodes[i]);
	}
	reply.childNodes[1].style.display="";
	reply.childNodes[1].firstElementChild.onclick = function(){
		event.stopPropagation();
		event.preventDefault();
		this.firstElementChild.style.display="block";
	}
}

//박스크기변경(댓글 수정)
function capturekey_replychange(e,post_id,id){
	if( e.keyCode == 13 && !e.shiftKey){
		changeReply_apply(post_id,id)
	} else if( e.keyCode == 27){
		cancleChange_reply(post_id,id);
	}
}

//댓글 수정 완료
function changeReply_apply(post_id,id){
	var tmp = event.target.value.toString();
	event.stopPropagation();
	event.preventDefault();
	document.getElementById('replychange_'+id).value = "";
	var formdata = new FormData();
	var input = document.getElementById("replyinput_change_"+id);
	var reply = event.target.parentNode;
	//document.getElementById("replywrite_"+input.id.substr(11)).lastElementChild.style.display="block";
	if( input.files.length || tmp.length >= 1 ){
		formdata.append("file",input.files[0]);
		formdata.append("text",tmp);
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function (evt){ if(xhr.readyState == 4 && xhr.status == 200){
			reply.childNodes[1].childNodes[2].data = tmp;
			for( var i = reply.childElementCount - 1; i >= 2; --i ){
				reply.removeChild(reply.childNodes[i]);
			}
			reply.childNodes[1].style.display = "inline-block";
			//소켓연동
		}}
		xhr.open("POST", "/changereply/"+ id, false); xhr.send(formdata);
	} else {
		alert("댓글이 비어 있습니다. 글을 입력해주세요");
	}
}

//댓글 삭제
function removeReply(post_id,id){
	if(!confirm("정말로 삭제하시겠습니까?")){
		return false;
	}
	var reply = document.getElementById("reply_"+post_id+"_"+id);
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
		if( xhr.responseText == "댓글이 삭제되었습니다."){
			reply.parentNode.removeChild(reply)
			socket.emit( 'reply_remove', id )
		} else {
			alert(xhr.responseText);
		}
	}}
	xhr.open("POST", "/removereply", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('reply_id='+id);
}

//게시글 삭제
function removePost(post_id){
	if(!confirm("정말로 삭제하시겠습니까?")){
		return false;
	}
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){ if (xhr.readyState == 4 && xhr.status == 200){
		if( xhr.responseText == "게시글이 삭제되었습니다."){			
			var post = document.getElementById("post_"+post_id);
			post.addEventListener('transitionend', function(){
				if(this.style.opacity=="0"){
					postwrap.removeChild(post);
				}
			});
			post.style.opacity="0";
			socket.emit( 'post_remove', post_id )
			getPosts(1);
		} else {
			alert(xhr.responseText);
		}
	}}
	xhr.open("POST", "/removepost", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('post_id='+post_id);
}

//날짜텍스트 구하기
function getDateString(date,reply,change){
	var postdate = new Date(date);
	var now = new Date();
	var postdate_time = Math.floor(postdate.getTime()/1000)
	var now_time = Math.floor(now.getTime()/1000)
	var gap = now_time - postdate_time;
	if( change ){
		a=postdate.toLocaleString()
		if( a.indexOf("GMT") >= 0 ){
			a = a.substr(0,a.length-10); 
		}
		return PointToDate(a);
	}
	if( gap < 3600 ){
		console.log(gap);
		if( gap < 60 ){
			return "방금"; 
		} else {
			return Math.floor(gap/60)+"분";
		}
	} else if( gap < 86400 ){
		return Math.floor(gap/3600)+"시간";
	} else if( gap >= 86400 ){
		if(Math.floor(gap/86400) == 1){
			var a = postdate.toLocaleTimeString();
			if( a.indexOf("GMT") >= 0 ){
				return "어제 " + a.substr(0,a.length-10);
			} else {
				return PointToDate("어제 " + a.substr(0,a.length-3));
			}
		} else {
			var a = postdate.toLocaleString();
			if( a.indexOf("GMT") >= 0 ){
				a = a.substr(0,a.length-10); 
			}
			if( true || /(BB|iPhone|iPod|Android)/i.test( navigator.userAgent ) ){
				a=PointToDate(a);
				if( reply ){
					return a;
				} else {
					//return "<span style='padding-right:25px;'>" + a.substr(0,a.indexOf("일")+1) + "</span><img src='/img/postdate' onclick='toggleDate(this)'>";
					var b = new Date();
					b.setHours(0);
					b.setMinutes(0);
					b.setSeconds(0);
					b.setMilliseconds(0);
					return "<span style='padding-right:25px;'>" + Math.floor((b.getTime()/1000 - postdate_time)/86400) + "일 전</span><img src='/img/postdate' onclick='alert(\"" + a + "\")' style='cursor:pointer'>";
				}
			} else {
			//if( a.indexOf("GMT") >= 0 ){
			//	return a.substr(0,a.length-10); 
			//} else {
				return PointToDate(a.substr(0,a.length-3));
			}
		}
	}
	return date;
}

//날짜텍스트 변경
function PointToDate(date){
	var a = date.replace('.',"년").replace('.',"월").replace('.',"일");
	if(a.indexOf(":") >= 0 ){
		a = a.replace(':',"시 ");
		if(a.indexOf(":")>=0){
			return a.substr(0,a.indexOf(":"))+"분";
		} else {
			return a+"분";
		}
	} else {
		return a;
	}
}

//날짜 업데이트
var dateUpdateId;
function dateUpdate(){
	var dates = document.getElementsByClassName("date");
	var i = dates.length - 1
	for( ; i >= 0; --i ){
		var date = new Date( parseInt(dates[i].id.substr(5)) )
		if(dates[i].childNodes[1]){
			if(dates[i].childNodes[1].className=="viewing"){
				var a = date.toLocaleTimeString().replace(':',"시 ");
				dates[i].firstChild.innerText = a.substr(0,a.indexOf(":"))+"분";
			} else {
				dates[i].innerHTML = getDateString(date);
			}
		} else {
			if(dates[i].parentNode.className == "reply_text"){
				dates[i].innerHTML = getDateString(date,1);
			} else {
				dates[i].innerHTML = getDateString(date);
			}
		}
	}
}

/*
//날짜 토글 (현재안씀)
function toggleDate(obj){
	postdate = new Date(parseInt(obj.parentNode.id.substr(5)));
	if(obj.className=="viewing"){
		obj.previousSibling.innerText = PointToDate(postdate.toLocaleDateString());
		obj.className="";
	} else {
		var a = postdate.toLocaleTimeString().replace(':',"시 ");
		obj.previousSibling.innerText = a.substr(0,a.indexOf(":"))+"분";
		obj.className="viewing";
	}
}
*/


// 게시글전송
function capturekey(e,post){
	if( e.keyCode == 13 && !e.shiftKey){
		replyWrite(post)
	}
}


//게시글쓰기 리사이징
function post_resize(obj){
	if(obj.scrollHeight > 104){
		obj.style.height="1px";
		obj.style.height=obj.scrollHeight+"px";
	}
	if( obj.scrollHeight <= 104 ){	
		obj.style.height="100px";
	}
//	obj.style.borderTop="1px solid rgb(86,210,199)";
//	obj.style.borderBottom="1px solid rgb(86,210,199)";
}

//덧글쓰기 리사이징
function reply_resize(obj){
	obj.style.height="1px";
	obj.style.height=obj.scrollHeight-18+"px";
}

var skip = 0;

//덧글 불러오기
function getReplys(obj,limit){
	var replywrap = obj.parentNode;
	if(obj.id.substr(10,1) == '_'){
		var postid = obj.id.substr(11);
		var skip = 0;
	} else {
		var postid = obj.id.substr(10);
		var skip = replywrap.childElementCount-4;
	}
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){if (xhr.readyState == 4 && xhr.status == 200){
		var xhrResult = JSON.parse(xhr.responseText);
		var Replys = xhrResult.sort(function(a,b){if(a.id < b.reply_id){return -1;} else{ return 1;}});
		for( var i = Replys.length - 1; i>=0;i--){
			var reply = document.createElement("div");
			if( typeof(Replys[i]) == "string" ){
				reply.id = 'replymore_' + postid;
				reply.className = 'reply_more';
				reply.innerHTML += "이전 댓글 보기";
				reply.onclick= function(){
					getReplys(this,8);
				}
				replywrap.insertBefore(reply,replywrap.firstElementChild);
			} else {
				reply.id = 'reply_' + postid + '_' + Replys[i].id;
				reply.className = 'reply';
				var a = document.createElement("a");
				a.href = "/profile/" + Replys[i].user_id;
				reply.appendChild(a);
				a.innerHTML += "<img src='/profileimg/" + Replys[i].user_id + "' class='profileimg_reply'>";
				if( Replys[i].file ){
					reply.innerHTML += '<div class="reply_text"><div class="reply_menu_btn"></div><a href="/profile/' + Replys[i].user_id + '">' +  Replys[i].user_name.toString() + "</a>" + Replys[i].text.toString() + '<br><img src="/files/postimg/' + postid + '/reply/' + Replys[i].id + '.jpg"><br><span id="date_' + new Date(Replys[i].date).getTime() + '" class="date">' + getDateString(Replys[i].date,1) + '</span></div>';
				} else {
					reply.innerHTML += '<div class="reply_text"><div class="reply_menu_btn"></div><a href="/profile/' + Replys[i].user_id + '">' +  Replys[i].user_name.toString() + "</a>" + Replys[i].text.toString() + '<br><span id="date_' + new Date(Replys[i].date).getTime() + '" class="date">' + getDateString(Replys[i].date,1) + '</span></div>';
				}
				reply_menu_btn = reply.lastElementChild.firstChild;
				reply_menu = document.createElement("div");
				reply_menu_btn.appendChild(reply_menu);
				if( obj.id.substr(10,1) == '_'){
					reply_menu.className = "reply_menu";
					reply_menu_btn.style.backgroundImage = "url('/img/change_reply.jpg')";
					reply_menu_btn.onclick = function(event){
						event.stopPropagation();
						event.preventDefault();
						this.firstElementChild.style.display="block";
					}
					reply_menu.innerHTML += "<div onclick='removeReply(" + postid + "," + Replys[i].id + ")' >댓글삭제</div>";
					reply_menu.innerHTML += "<div onclick='changeReply(" + postid + "," + Replys[i].id + ")' >댓글수정</div>";
					replywrap.insertBefore(reply,replywrap.lastElementChild.previousElementSibling.previousElementSibling);
					eval("reply.style." + getBrowser() + "Animation='fade_post .5s linear'");
				} else {
					if( Replys[0] == Replys[i].user_id ){
						reply_menu.className = "reply_menu";
						reply_menu_btn.style.backgroundImage = "url('/img/change_reply.jpg')";
						reply_menu_btn.onclick = function(event){
							event.stopPropagation();
							event.preventDefault();
							this.firstElementChild.style.display="block";
						}
						reply_menu.innerHTML += "<div onclick='removeReply(" + postid + "," + Replys[i].id + ")' >댓글삭제</div>";
						reply_menu.innerHTML += "<div onclick='changeReply(" + postid + "," + Replys[i].id + ")' >댓글수정</div>";
					} else {
						reply_menu_btn.style.backgroundImage = "url('/img/remove_reply.jpg')"
						reply_menu_btn.onclick = function(){
							dontsee_reply( this.parentNode.parentNode.id );
						}
					}
					replywrap.insertBefore(reply,replywrap.firstElementChild);
				}
			}
		}
		if(obj.id.substr(10,1) != '_'){
			replywrap.removeChild(obj);
		}
	}}
	xhr.open("POST","/getreplys", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); xhr.send('postid='+postid+'&skip='+skip+'&limit='+limit);
}

//게시글 불러오기
function getPosts(limit,option){
	if( !dateUpdateId ){
		dateUpdateId = setInterval(dateUpdate,5000)
	} else {
		dateUpdate();
	}
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (event){
		if (xhr.readyState == 4 && xhr.status == 200){
			if(xhr.responseText!='[]'){
				var xhrResult = JSON.parse(xhr.responseText);
				var Posts = xhrResult.post.sort(function(a,b){if(a.id < b.id){return -1;} else{ return 1;}});
				if(Posts.length != limit){
					skip -= limit-Posts.length;
				}
				for(var i = Posts.length-1; i>=0; --i){
					var Replys = [];
					if( Posts[i].reply ){
						for( var j = Posts[i].reply.length - 1; j>=0;j--){
							Replys.push(Posts[i].reply[j]);
						}
						Replys.sort(function(a,b){if(a.id < b.id){return 1;} else{ return -1;}});
					}
					var div = document.createElement("div");
					div.id = 'post_' + Posts[i].id;
					div.className = 'post';
					var a = document.createElement("a");
					a.href = '/profile/'+Posts[i].user_id;
					a.className = 'post_name';
					a.innerHTML += "<img src='/profileimg/" + Posts[i].user_id + "' class='profileimg_post'>";
					a.innerHTML += Posts[i].user_name.toString();
					div.appendChild(a);
					var inside = document.createElement("div");
					inside.id = "post_inside_" + Posts[i].id;
					if( Posts[i].text && Posts[i].text.length >= 1 ){
						//inside.innerHTML+="<span>"+Posts[i].text.toString() +"</span>";
						var textspan = document.createElement("span");
						inside.appendChild(textspan);
						var texts = Posts[i].text.split("\r\n");
						var lncnt = 0;
						for( var k = 0; k < texts.length; ++k ){
							++lncnt;
							if( texts[k].length > postwrap.firstElementChild.clientWidth/12.8 ){
								++lncnt;
							}
							if( lncnt > 5 ){
								var textmore = document.createElement("span");
								textmore.innerHTML = "더보기";
								textmore.style.color="#f15c3e";
								textmore.style.fontWeight="bold";
								textmore.id=Posts[i].text.toString();
								textmore.addEventListener("click",function(){
									this.parentNode.innerHTML=this.id;
								});
								textspan.appendChild(textmore);
								break;
							} else {
								var textindex = 0;
								while(1){
									var link = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi.exec( texts[k].substr( textindex ) );
									if( link != null ){
										var replace_str = "<a target='_blank' href='" + link[0] + "'>" + link[0] + "</a>";
										textindex += link.index + replace_str.length ;
										texts[k] = texts[k].replace( link[0].toString(), replace_str );
										var linkxhr = new XMLHttpRequest();
										linkxhr.onreadystatechange = function (event){ if(linkxhr.readyState == 4 && linkxhr.status == 200) {
											if( linkxhr.responseText != "" ){
												var metas = JSON.parse(linkxhr.responseText);
												var preview = document.createElement("a");
												preview.href = link[0];
												preview.target = "_blank";
												preview.id = "link_preview_" + Posts[i].id;
												preview.className = "link_preview";
												var preview_img = document.createElement("img");
												preview_img.id = link[0];
												preview_img.src = metas.image;
												preview_img.onclick = function(event){
													var vid;
													var vindex;
													vindex = this.id.indexOf("youtu.be/");
													if( vindex >= 0 ){
														vid = this.id.substr( vindex + 9 );
													}
													vindex = this.id.indexOf("youtube.com/watch?v=");
													if( vindex >= 0 ){	
														vid = this.id.substr( vindex + 20 );
													}
													if( vid != "" && vid != null ){
														event.stopPropagation();
														event.preventDefault();
														this.nextElementSibling.className = "link_preview_text_big";
														var iframe = document.createElement("iframe");
														iframe.style.height = this.clientHeight;
														iframe.src = "https://youtube.com/embed/"  + vid; 
														iframe.allowFullscreen = true;
														this.parentNode.replaceChild(iframe,this);
													}
												}
												var preview_title = document.createElement("div");
												preview_title.innerHTML = metas.title;
												preview_title.className = "link_preview_title";
												var preview_description = document.createElement("div");
												preview_description.innerHTML = metas.description;
												preview_description.className = "link_preview_description";
												preview.appendChild( preview_img );
												var preview_text = document.createElement("div");
												preview.appendChild( preview_text );
												preview_text.appendChild( preview_title );
												preview_text.appendChild( preview_description );
												inside.appendChild( preview );
												preview_img.onload = function(){
													if( preview_img.naturalWidth >= preview_img.parentNode.clientWidth ){
														preview_img.className = "link_preview_img_big";
														preview_text.className = "link_preview_text_big";
													} else {
														preview_img.className = "link_preview_img_small";
														preview_text.className = "link_preview_text_small";
													}
												}
											}
										}};
										linkxhr.open("POST", "/linkpreview", false); linkxhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); linkxhr.send('link='+link[0]);
									} else {
										break;
									}
								}
								textspan.innerHTML += texts[k].toString() + '\n';
							}
						}
					}
					if( Posts[i].html ){
						inside.innerHTML = Posts[i].html;	
					}
					if( Posts[i].file ){
						/*
						var span = document.createElement("span");
						span.className = "post_span";
						span.addEventListener('click', function(e){
							document.getElementById("postimg_" + e.target.parentNode.id.substr(5)).click();
						}, false);
						span.innerHTML = Posts[i].file ;
						div.insertBefore(span,div.firstElementChild.nextElementSibling);
						*/

						div.innerHTML+="<span class='post_span' onclick='document.getElementById(\"postimg_" + Posts[i].id + "\").click();'>" + Posts[i].file + "</span>";
						div.innerHTML+="<span id='date_" + new Date(Posts[i].date).getTime() + "' class='date'>" + getDateString(Posts[i].date) + "</span>";

						/*
						//수정됨 표시 ( 모바일화면작아서 일단은 보류 )
						if( Posts[i].change ){
							div.innerHTML+="<span class='post_changed' onclick='alert(\"" + getDateString(Posts[i].change,false,true) + "\")'>수정됨</span>";
							inside.innerHTML+="<img src='/files/postimg/" + Posts[i].id + "/1.jpg" + "?" + Posts[i].change + "' id='postimg_" + Posts[i].id + "' class='postimg' onclick='viewimg(" + Posts[i].id + "," + Posts[i].file + ",\"" + Posts[i].change + "\")' >";
						} else {
						*/

						inside.innerHTML+="<img src='/files/postimg/" + Posts[i].id + "/1.jpg" + "?" + Posts[i].date + "' id='postimg_" + Posts[i].id + "' class='postimg' onclick='viewimg(" + Posts[i].id + "," + Posts[i].file + ",\"" + Posts[i].date + "\")' >";
						//}
					} else {
						div.innerHTML+="<span id='date_" + new Date(Posts[i].date).getTime() + "' class='date'>" + getDateString(Posts[i].date) + "</span>";
						/* 수정됨
						if( Posts[i].change ){
							div.innerHTML+="<span class='post_changed' onclick='alert(\"" + getDateString(Posts[i].change,false,true) + "\")'>수정됨</span>";
						}
						*/
					}
					if( Posts[i].favorite ){
						div.innerHTML+="<span class='post_favorite' id='post_favorite_"+Posts[i].id + "' ><img src='/img/star.png'></span>";
					}
					inside.className="post_inside";
					div.appendChild(inside);
					var btn = document.createElement("div");
					btn.className = 'postmenubtn';
					btn.onclick= function(){ showmenu(this) };
					div.appendChild(btn);
					var menu = document.createElement("div")
					menu.id = 'menu_' + Posts[i].id;
					menu.className = 'post_menu';
					if( xhrResult.user == Posts[i].user_id ){
						menu.innerHTML="<div id='postremove_" + Posts[i].id + "' class='postremove' onclick='removePost(" + Posts[i].id + ")'>게시글삭제</div>";
						menu.innerHTML+="<div id='changepost_" + Posts[i].id + "' onclick='changePost(" + Posts[i].id + ")'>게시글수정</div>";
					} else {
						menu.innerHTML+="<div id='dontsee_" + Posts[i].id + "' onclick='dontsee(" + Posts[i].id + ")'>보고싶지 않습니다</div>";
					}
					if( Posts[i].favorite ){
						menu.innerHTML+="<div id='favorite_" + Posts[i].id + "' onclick='favorite(" + Posts[i].id + ',0' + ")'>관심글해제</div>";
					} else {
						menu.innerHTML+="<div id='favorite_" + Posts[i].id + "' onclick='favorite(" + Posts[i].id + ',1' + ")'>관심글등록</div>";
					}
					div.appendChild(menu);
					var replywrap = document.createElement("div");
					replywrap.className = 'replywrap';
					div.appendChild(replywrap);
					for( var j = Replys.length - 1; j>=0;j--){
						var reply = document.createElement("div");
						if(typeof(Replys[j]) == "string"){
							reply.id = 'replymore_' + Posts[i].id;
							reply.className = 'reply_more';
							reply.innerHTML += "이전 댓글 보기";
							reply.onclick= function(){
								getReplys(this,8);
							}
							replywrap.insertBefore(reply,replywrap.firstElementChild);
						} else {
							reply.id = 'reply_' + Posts[i].id + '_' + Replys[j].id;
							reply.className = 'reply';
							var a = document.createElement("a");
							a.href = "/profile/" + Replys[j].user_id;
							reply.appendChild(a);
							a.innerHTML += "<img src='/profileimg/" + Replys[j].user_id + "'  class='profileimg_reply'>";
							if( Replys[j].file ){
								reply.innerHTML += '<div class="reply_text"><div class="reply_menu_btn"></div><a href="/profile/' + Replys[j].user_id + '">' +  Replys[j].user_name.toString() + "</a>" + Replys[j].text.toString() + '<br><img src="/files/postimg/'+ Posts[i].id + '/reply/' + Replys[j].id + '.jpg">' + "<br><span id='date_" + new Date(Replys[j].date).getTime() + "' class='date'>" + getDateString(Replys[j].date,1) + '</span></div>';
							} else {
								reply.innerHTML += '<div class="reply_text"><div class="reply_menu_btn"></div><a href="/profile/' + Replys[j].user_id + '">' +  Replys[j].user_name.toString() + "</a>" + Replys[j].text.toString() + "<br><span id='date_" + new Date(Replys[j].date).getTime() + "' class='date'>" + getDateString(Replys[j].date,1) + '</span></div>';
							}
							reply_menu_btn = reply.lastElementChild.firstChild;
							reply_menu = document.createElement("div");
							reply_menu_btn.appendChild(reply_menu);
							if( xhrResult.user == Replys[j].user_id ){
								reply_menu.className = "reply_menu";
								reply_menu_btn.style.backgroundImage = "url('/img/change_reply.jpg')";
								reply_menu_btn.onclick = function(event){
									event.stopPropagation();
									event.preventDefault();
									this.firstElementChild.style.display="block" 
								}
								reply_menu.innerHTML += "<div onclick='removeReply(" + Posts[i].id + "," + Replys[j].id + ")' >댓글삭제</div>";
								reply_menu.innerHTML += "<div onclick='changeReply(" + Posts[i].id + "," + Replys[j].id + ")' >댓글수정</div>";
							} else {
								reply_menu_btn.style.backgroundImage = "url('/img/remove_reply.jpg')"
								reply_menu_btn.onclick = function(){
									dontsee_reply( this.parentNode.parentNode.id );
								}
							}
							replywrap.appendChild(reply);
						}
						reply_menu_btn.onmouseleave=function(event){
							event.stopPropagation();
							event.preventDefault();
							this.firstElementChild.style.display="none";
						}
					}
					var reply = document.createElement("div");
					reply.onkeydown = function(event){ capturekey(event,this)}
					reply.id = 'replywrite_' + Posts[i].id;
					reply.className = 'reply';
					reply.innerHTML += "<img src='/profileimg/" + xhrResult.user + "' class='profileimg_reply'>";
					reply.innerHTML += "<textarea type='text' class='writereply' onkeyup='reply_resize(this)' onkeydown='reply_resize(this)' onkeypress='reply_resize(this)' placeholder='댓글을 입력하세요...' ></textarea><label for='replyinput_" + Posts[i].id + "' class='replyinput_label'></label>"
					replywrap.appendChild(reply);
					var reply_upload = document.createElement("input");
					reply_upload.type = "file";
					reply_upload.accept = 'image/*';
					reply_upload.id="replyinput_" + Posts[i].id;
					reply_upload.onchange = function(event){ openfile_reply(event) }
					replywrap.appendChild(reply_upload);
					var reply_output = document.createElement("div");
					reply_output.className = "replyoutput";
					reply_output.id = "replyoutput_" + Posts[i].id;
					replywrap.appendChild(reply_output);
					if( limit ){
						postwrap.appendChild(div);
					} else {
						postwrap.insertBefore(div,postwrap.firstElementChild.nextElementSibling);
						eval("div.style." + getBrowser() + "Animation='fade_post .5s linear'");
					}
				}
			}
		}
	}
	var params = 'skip='+skip;
	xhr.open("POST","/getposts", false); xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
	if( limit ){
		skip += limit;
		params += "&limit=" + limit;
	} else if(limit == 0){
		params = "skip=0&limit=1";
		skip+=1
	}
	if( favorite != null ){
		params += "&favorite=true";
	}
	xhr.send(params);
}

// 이미지 보고있을때 단축키들
var select;
function keydown(e){
	if(imgviewing){
		event.stopPropagation();
	//	event.preventDefault();
		if(e.keyCode==39 || e.keyCode == 40){
			event.preventDefault();
			rightbtn.click();
		} else if(e.keyCode==37 || e.keyCode == 38){
			event.preventDefault();
			leftbtn.click();
		} else if(e.keyCode==27){
			event.preventDefault();
			imglayer.style.opacity="0";
			lefthover.style.display="none";
			righthover.style.display="none";
			imgmenuhover.style.display="none";
			imgviewing=0;
		}
	} else if( document.activeElement == document.body ){
		if((e.shiftKey==false&&e.keyCode==9)||e.keyCode==40||e.keyCode==39){
			event.preventDefault();
			if( select ){
				select.style.borderColor = "#e5e6e9 #dfe0e4 #d0d1d5";
				select.style.boxShadow = "initial";
				if( select.nextSibling ){
					select = select.nextSibling;
					select.scrollIntoViewIfNeeded();
					select.style.borderColor = "#ff5c26";
					select.style.boxShadow = "inset 0px 0px 0px 1px #ff5c26";
				} else {
					return;
				}
			} else {
				select = post_wrap.firstElementChild
				select.style.borderColor = "#ff5c26";
				select.style.boxShadow = "inset 0px 0px 0px 1px #ff5c26";
			}
		}
		if((e.shiftKey==true&&e.keyCode==9)||e.keyCode==38||e.keyCode==37){
			event.preventDefault();
			if( select ){
				select.style.borderColor = "#e5e6e9 #dfe0e4 #d0d1d5";
				select.style.boxShadow = "initial";
				if( select.previousSibling ){
					select = select.previousSibling;
					select.scrollIntoViewIfNeeded();
					select.style.borderColor = "#ff5c26";
					select.style.boxShadow = "inset 0px 0px 0px 1px #ff5c26";
				} else {
					return;
				}
			} else {
				select = post_wrap.firstElementChild
				select.style.borderColor = "rgb(86, 210, 199)";
				select.style.boxShadow = "inset 0px 0px 0px 1px rgb(86, 210, 199)";
			}
		}
	}
}

var socket;


// 파일 업로드시 드래그이벤트

function DragOut(evt){
	evt.stopPropagation();
	evt.preventDefault();
	var obj = evt.target.style;
	obj.margin = "";
	obj.borderTop="";
	obj.borderBottom="";
	obj.borderLeft="";
	obj.borderRight="";
}

function DragOver(evt){
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
	obj = evt.target.style;
	obj.border="2px dashed #bbb";
	obj.margin = "-1px 3px 17px 3px"; 
//	obj.marginLeft="2px";
//	obj.marginTop="-26px";
//	obj.marginBottom="-36px";
}

// 이미지 전체화면
function viewfull(obj){
	if(document.webkitIsFullScreen){
		document.webkitCancelFullScreen();
		obj.src="/img/imgfull.png";
		event.stopPropagation();
		event.preventDefault();
	} else {
		imgbox.style.width="100%";
		imgbox.style.height="100%";
		imgbox.style.top="0";
		imgbox.style.left="0";
		imgbox.style.position="absolute";
		imglayer.webkitRequestFullScreen();
		for( var j=imgbox.childNodes.length - 1 ; j>=1; --j ){
			imgbox.childNodes[j].style.border="0";
		}
		obj.src="/img/imgfull_exit.png";
	}
}

// 이미지 자세히보기
function viewimg(postid,filecount,date){
	imgviewing = 1;
	imglayer.style.zIndex="300";
	imglayer.style.visibility="visible";
	imglayer.style.opacity="1";
	imgbox.innerHTML="<div id='helper'></div>";
	imgmenuhover.style.display="block";
	if(document.getElementById("post_favorite_"+postid)){
		imgmenu_favorite.src = '/img/favorite_remove.png';
		imgmenu_favorite.onclick = function(){
			favorite(postid,0);
		}
	} else {
		imgmenu_favorite.src = '/img/favorite.png';
		imgmenu_favorite.onclick = function(){
			favorite(postid,1);
		}
	}
	if(filecount == 1 || (/(BB|iPad|iPhone|iPod|Android)/i.test( navigator.userAgent )) ){
		lefthover.style.display="none";
		righthover.style.display="none";
	} else if (filecount >= 1){
		lefthover.style.display="block";
		righthover.style.display="block";
	}
	for(var i = 1; i<=filecount; ++i){
		var img = document.createElement("img");
		img.src="/files/postimg/" + postid + "/" + i + ".jpg?" + date;
		imgdownload.href=img.src;
		imgdownload.download=postid+'_'+1+'.jpg';
		img.onclick = function(){
			event.stopPropagation();
			event.preventDefault();
			rightbtn.click();
		}
		/* 이미지 호버시 오른쪽버튼 등장!
		if( !(/(BB|iPad|iPhone|iPod|Android)/i.test( navigator.userAgent )) ){
			img.onmouseover = function(){
				rightbtn.style.right = "0px";
			}
			img.onmouseout = function(){
				rightbtn.style.right = "";
			}
		}
		*/
		imgbox.appendChild(img);
	}
	imgbox.childNodes[1].style.display="inline-block";
}

//이미지 메뉴 리사이징
function imgmenu_resize(){
	if(window.innerWidth < 530 ){
		imgmenu.style.display="none";
	} else {
		imgmenu.style.display="block";
	}
	imgmenu.style.left=(window.innerWidth - imgmenu.clientWidth)/2 + "px";
	//imgmenuhover.style.left=(window.innerWidth - imgmenu.clientWidth)/2 + "px";
}

window.addEventListener('load',function(){
	postwrap = document.createElement("div");
	postwrap.id = 'post_wrap'
	document.body.appendChild(postwrap);

	write = document.createElement("div");
	write.id = "write";
	write.innerHTML+='<div id="output_post"></div>';
	write.innerHTML+='<div id="post_write_button" onclick="postWrite();"></div>';
	write.innerHTML+='<label for="post_file" id="post_file_label"></label>';
	write.innerHTML+='<input type="file" accept="image/*" id="post_file" name="file" multiple="multiple" onchange="openfile_post(event)">';
	write.className = "post";
	postwrap.appendChild(write);

	postwrite = document.createElement("textarea");
	postwrite.id = 'post_write';
	postwrite.placeholder = "글을 입력하세요";
	postwrite.addEventListener('keydown', function(){ post_resize(this) }, false);
	postwrite.addEventListener('keypress', function(){ post_resize(this) }, false);
	postwrite.addEventListener('keyup', function(){ post_resize(this) }, false);
	postwrite.addEventListener('dragover', DragOver, false);
	postwrite.addEventListener('dragleave', DragOut, false);
	postwrite.addEventListener('mouseout', DragOut, false);
	postwrite.addEventListener('drop', openfile_post, false);
	postwrite.addEventListener('paste', openfile_paste, false);
	
	write.insertBefore(postwrite,write.firstElementChild);
	
	imgviewing = 0;
	imglayer = document.createElement("div");
	imglayer.id="imglayer";
	imglayer.addEventListener('transitionend', function(){ if(this.style.opacity=="0"){
		this.style.zIndex="-500";
	} else {
		this.style.visibility="visibile";
	}});
	imglayer.onclick = function(evt){ 
		if(document.webkitIsFullScreen){
			evt.stopPropagation();
			evt.preventDefault();
		} else {
			imglayer.style.zIndex="300";
			imglayer.style.opacity="0"; 
			imgviewing=0;
			lefthover.style.display="none";
			righthover.style.display="none";
			imgmenuhover.style.display="none";
		}
	}
	rightbtn = document.createElement("div");
	rightbtn.onclick = function(e){
		e.stopPropagation();
		e.preventDefault();
		for( var j=imgbox.childNodes.length - 1 ; j>=1; --j ){
			if(imgbox.childNodes[j].style.display == "inline-block" ){
				var postid = imgbox.childNodes[1].src.split("postimg/")[1].split("/")[0];
				imgbox.childNodes[j].style.display = "none";
				if(imgbox.childNodes[j+1]){
					imgbox.childNodes[j+1].style.display = "inline-block";
					imgdownload.download=postid+'_'+ ( j + 1 ) +'.jpg'
					imgdownload.href=imgbox.childNodes[j + 1].src;
					break;
				} else {
					imgbox.childNodes[1].style.display = "inline-block";
					imgdownload.download=postid+'_'+ 1 +'.jpg'
					imgdownload.href=imgbox.childNodes[1].src;
					break;
				}
			}
		}
	}
	righthover = document.createElement("div");
	righthover.onclick = rightbtn.onclick;
	righthover.id = "righthover";
	imglayer.appendChild(righthover);
	rightbtn.id = "rightbtn";
	imglayer.appendChild(rightbtn);
	leftbtn = document.createElement("div");
	leftbtn.onclick = function(e){
		e.stopPropagation();
		e.preventDefault();
		for( var j=1; j<imgbox.childNodes.length; ++j ){
			if(imgbox.childNodes[j].style.display == "inline-block" ){
				var postid = imgbox.childNodes[1].src.split("postimg/")[1].split("/")[0];
				imgbox.childNodes[j].style.display = "none";
				if(j==1){
					imgbox.childNodes[imgbox.childNodes.length-1].style.display = "inline-block";
					imgdownload.download=postid+'_'+ ( imgbox.childNodes.length - 1 ) +'.jpg'
					imgdownload.href=imgbox.childNodes[imgbox.childNodes.length - 1].src;
					break;
				} else {
					imgbox.childNodes[j-1].style.display = "inline-block";
					imgdownload.download=postid+'_'+(j-1)+'.jpg'
					imgdownload.href=imgbox.childNodes[j-1].src;
					break;
				}
			}
		}
	}
	lefthover = document.createElement("div");
	lefthover.onclick = leftbtn.onclick;
	lefthover.id = "lefthover";
	imglayer.appendChild(lefthover);
	leftbtn.id = "leftbtn";
	imglayer.appendChild(leftbtn);
	imgmenuhover = document.createElement("div");
	imgmenuhover.id = "imgmenuhover";
	imgmenuhover.onclick = function(){
		event.stopPropagation();
	}
	imglayer.appendChild(imgmenuhover);
	imgmenu = document.createElement("div");
	imgmenu.id = "imgmenu";
	imgmenu.onclick = function(event){
		event.stopPropagation();
//		event.preventDefault();
	}
	leftbtn.addEventListener('transitionend', function(){
		event.stopPropagation();
		event.preventDefault();
	});
	rightbtn.addEventListener('transitionend', function(){
		event.stopPropagation();
		event.preventDefault();
	});
	imgmenu.addEventListener('transitionend', function(){
		event.stopPropagation();
		event.preventDefault();
	});
	imgmenu.innerHTML="<img id='imgmenu_favorite' src='/img/favorite.png'>";
	imgmenu.innerHTML+="<a id='imgdownload' download><img src='/img/download.png'></a>"; //<img src='/img/share.png'>";
	if( !(/(BB|iPad|iPhone|iPod|Android|\.NET)/i.test( navigator.userAgent )) ){
		imgmenu.innerHTML += "<img src='/img/imgfull.png' onclick='viewfull(this)' >";
	} else {
		imglayer.onclick = function(){ document.body.style.overflowY=""; imglayer.style.opacity="0";imgviewing=0;}
	}
	imglayer.appendChild(imgmenu);
	imgbox = document.createElement("div");
	imgbox.id = "imgbox";
	imglayer.appendChild(imgbox);
	document.body.appendChild(imglayer);
	output_post = document.getElementById("output_post");
	post_file = document.getElementById("post_file");
	window.addEventListener('scroll', function(){
		if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight){
				getPosts(4);
		}
	});
	imgmenu_resize();
	postwrap.style.display="block";
	
	window.addEventListener('resize', function(){
		imgmenu_resize();
	});
	socket = io.connect('/'); 
	socket.on( 'notice_new', function(){
		notice.innerHTML = parseInt(notice.innerHTML)+1;
	})
	getPosts(10);
	socket.on( 'connect_failed', function(){
		location.href = "/";
	});
	socket.onbeforeunload = function(){
		location.href = "/";
	}
	socket.on( 'disconnect', function(){
//		location.href = "/";
	});
	socket.on( 'post_new', function(){
		getPosts(0,1);
	});
	socket.on( 'reply_new', function( postid ){
		getReplys(document.getElementById("replywrite_" + postid),1);
	});
	socket.on( 'post_removed', function( postid ){
		postwrap.removeChild(document.getElementById("post_"+postid));	
		getPosts(1);
	});
	socket.on( 'reply_removed', function( replyid ){
		document.getElementById(replyid).parentNode.removeChild(document.getElementById(replyid));	
	});
	make_gamebtn()
});

//포스트 메뉴 보이기
function showmenu(dom){
	hidemenu();
	document.getElementById("menu_" + dom.parentNode.id.substr(5)).style.display="block"
	event.stopPropagation();
}


// 덧글쓰기
function replyWrite(post){
	var postid = post.id.substr(11);
	var tmp = post.lastElementChild.previousElementSibling.value.toString();
	var formdata = new FormData();
	var input = document.getElementById("replyinput_"+postid);
	document.getElementById("replywrite_"+input.id.substr(11)).lastElementChild.style.display="block";
	if( input.files.length || tmp.length >= 1 ){
		formdata.append("file",input.files[0]);
		formdata.append("text",tmp);
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200){
			getReplys(post,1);
			socket.emit( 'reply_write', postid )
		}}
		xhr.open("POST","/writereply/" + postid, false); xhr.send(formdata)
		input.value="";
		post.lastElementChild.previousElementSibling.value="";
		event.preventDefault(); 
		reply_resize(post.lastElementChild.previousElementSibling);
		document.getElementById("replyoutput_" + postid).style.display="none";
		document.getElementById("replyoutput_" + postid).innerHTML="";
	} else {
		alert("댓글이 비어 있습니다. 글을 입력해주세요");
		post.lastElementChild.previousElementSibling.value="";
	}
}

// 게시글쓰기
realfiles=[];
function postWrite(){
	var tmp = postwrite.value;
	var formdata = new FormData();
	if( realfiles[0] || tmp.length>= 1 ){
		for( var i=0; i<realfiles.length; ++i){
//		for( var i=realfiles.length-1; i>=0; --i){
			formdata.append("file",realfiles[i]);
		}
		formdata.append("text",tmp);
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function (event){ if(xhr.readyState == 4 && xhr.status == 200){
			post_id = parseInt(xhr.responseText);
			getPosts(0);
			socket.emit( 'post_write', post_id );
		}}
		xhr.open("POST","/writepost", false);  xhr.send(formdata);
		realfiles=[];
		post_write.value="";
		post_file.value="";
		output_post.innerHTML="";
		//output_post.style.display="none";
		postwrite.style.borderTop="1px solid rgba(0,0,0,0.2)";
		postwrite.style.borderBottom="1px solid rgba(0,0,0,0.2)";
	} else {
		alert("게시글이 비어 있습니다.");
	}
}

