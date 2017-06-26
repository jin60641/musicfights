var express = require('express')
var cookieParser = require('cookie-parser')
var cookie = require('cookie')
var mongoose = require('mongoose')
var serveStatic = require('serve-static');
var fs = require('fs-extra')
var path = require('path');
var busboy = require('connect-busboy');
var nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport( require('./settings.js').mailConfig );
var app = express()
var crypto = require('crypto');
var rimraf = require('rimraf');
var request = require('request');
app.use(require('body-parser').urlencoded());
app.use(busboy());

app.use(cookieParser())
var session = require('express-session')
var sessionstore = require('sessionstore');
store = sessionstore.createSessionStore();
app.use(session({ store: store, secret: require('./settings.js').sessionSecret, cookie: { path: '/', domain: 'iori.kr', expires : false }}))
function checkSession( req, res, next ){
	if( req.session && req.session.id_num ){
		next();	
	} else {
		res.redirect('/');
	}
}

app.get( '/', function( req, res ){
	if( req.session && req.session.id_num ){
		res.redirect('/newsfeed');
	} else {
		res.sendfile(__dirname + '/index.html');
	}
});

app.use(serveStatic(__dirname))

var dbconfig = require('./dbconfig.js');
var regex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;

var Users = dbconfig.Users;
var Relations = dbconfig.Relations;
var Posts = dbconfig.Posts;
var Replys = dbconfig.Replys;
var Favorites = dbconfig.Favorites;
var Dontsees = dbconfig.Dontsees;
var Groups = dbconfig.Groups;
var Notices = dbconfig.Notices;
var Links = dbconfig.Links;
var Musics = dbconfig.Musics;

var async = require("async")
var server = require('http').Server(app);
var io = require('socket.io').listen(server)

server.listen(3000);

var rooms = new Object();
var room_max = 8;
var chatMax = 6;
var chatInterval = 500;
var blocktime = 30000;	

function trim( data ){
	if( data && data.replace ){
		return data.replace(/(^[\r|\n]*)|([\r|\n]*$)/g, '');
	} else {
		return null;
	}
}

function xssFilter( data ){
	return data.replace( /</g , "&lt" ).replace( />/g , "&gt" );
}

function sendSignUpMail(email, link) {
	var string = "http://iori.kr/signup/mail/" + email + "/" + link;
	smtpTransport.sendMail({
		from: 'iori <nagase.iori.kr@gmail.com>',
		to: email,
		subject: 'iori.kr 인증 메일',
		'html': '<img src="http://iori.kr/img/email.jpg"><p>iori.kr 이메일 인증을 끝마치시려면 아래 링크를 클릭해주십시오</p><br/><a href=' + string + '/>인증하기</a>'
	}, function(err,response){
		if( err ){
			throw err;
		} else {
		}
	});
}

function signUpMail( req, res ){
	var email = req.params.email;
	var link = req.params.link;
	if( email != null, link != null ){
		Users.findOne({ 'email' : email }, function( err, result ){
			if( result ){
				var shasum = crypto.createHash('sha1');
				shasum.update(result.email);
				var s = shasum.digest('hex');
				if( s == link ){
					if( !result.signUp ){
						Users.update({ 'email' : email } , { 'signUp' : 1 } , function(){
							res.redirect("/?success");
						});
					} else {
						res.redirect("/?fail");
					}
				} else {
					res.redirect('/');
				}
			} else {
				res.redirect('/');
			}
		});
	}
}

function todayQuiz(){
	Users.find( function ( error, users ){
		if( error ){
			throw error;
		}
		Posts.findOne().sort({id:-1}).exec( function( err, result ){
			
			var current = new Posts({
				id : result.id + 1,
				user_id : 1,
				user_name : "admin",
				html : "<span style='color:red;'>오늘의 퀴즈에 도전하세요!</span>",
				file : 0
			});
			current.save( function( err2 ){
				if( err2 ){
					throw err2;
				}
				io.sockets.emit( 'post_new' );
				for( var j = 0; j < users.length; ++j ){
					( function(i){
						smtpTransport.sendMail({
							from: 'iori <nagase.iori.kr@gmail.com>',
							to: users[i].email,
							subject: 'iori.kr 오늘의 퀴즈',
							'html': '<img src="http://iori.kr/img/email.jpg" ><p>오늘의 퀴즈에 도전하세요</p>'
						}, function( err3, response ){
							if( err3 ){
								throw err3;
							} else {
							}
						});
					}(j));
				}
			});
		});
	});
}	

// 0 0 * * *
//setInterval(todayQuiz, 60 * 1000 * 24 )

function notice_broadcast( socket, type, obj_id ){
	Relations.find({ to_id : socket.session.id_num, status : "friend" }, function( err, friends ){
		if( err ){
			throw err;
		} else if( friends.length >= 1 ){
			for( var i = friends.length - 1; i >= 0; --i ){
				var current = new Notices({
					to_id : friends[i].from_id,
					to_name : friends[i].from_name,
					from_id : friends[i].to_id,
					from_name : friends[i].to_name,
					notice_type : type,
					obj_id : obj_id
				})
				current.save( function( error ){
					if( error ){
						throw error;
					}
					for( var j = io.sockets.sockets.length - 1; j >= 0; --j ){
						if( current.to_id == io.sockets.sockets[j].session.id_num ){
							io.sockets.sockets[j].emit( 'notice_new' );
						}
					}
				});
			}
		}
	});
}
io.on( 'connection', function( socket ){
	console.log("socket connected");
	store.get( cookie.parse( socket.request.headers.cookie )[ 'connect.sid' ].split('.')[0].substring(2) , function( err, session ){
		if( session && session.id_num ){
			socket.session = session;
		} else {
			socket.disconnect();
		}
	});

	socket.on( 'game_end', function(){
		var room = rooms[ socket.room ];
		room.users[ socket.id_num ].end = true;
		var keys = Object.keys( room.users );
		for( var i = keys.length - 1; i >= 0; --i ){
			if( room.users[ keys[i] ].end == false ){
				break;
			} else if ( i == 0 ){
				room.state = "chat";
				room.question = new Array(4);
				io.sockets.in( socket.room ).emit( 'chat_list' , { users : room.users, slot : room.slot, host : room.host });
				io.sockets.in( socket.room ).emit( 'get_result', room.users );
				for( var j = keys.length - 1; j >= 0; --j ){
					( function(jtmp){
						var rank = 1;
						for( var k = keys.length - 1; k >= 0; -- k ){
							( function( ktmp ){
								if( room.users[ keys[ktmp] ].score < room.users[ keys[jtmp] ].score ){
									++rank;
								}
								if( ktmp == 0 ){
									Users.findOne({ id : keys[jtmp] },function( err, user ){
										if( err ){
											throw err;
										}
										var exp = rank * 50;
										if( user.exp + exp > user.level * 500 ){
											Users.update({ id : user.id },{ level : user.level + 1, exp : user.exp + exp - ( user.level * 500 ) }, function( error, cnt ){
												if( error ){
													throw error;
												}
											});
										} else {
											Users.update({ id : user.id },{ exp : user.exp + exp }, function( error, cnt ){
												if( error ){
													throw error;
												}
											});
										}
										if( keys.length == 2 ){
											if( keys.length == 2 ){
												var first = room.users[ keys[0] ];
												var second = room.users[ keys[1] ];
												if( first.id_num == room.users[ keys[jtmp] ].id_num ){
													if( first.score > second.score ){
														win = "승리";
													} else if( first.score < second.score ){
														win = "패배";
													} else {
														win = "무승부";
													}
													var html = "<div class='game_result'><img src='/profileimg/" + first.id_num + "' ><div><span>" + second.name +"</span>님과의 대결에서 <span>" + win  +"</span><br><span>" + first.score + "</span>VS<span>" + second.score + "</span></div><img src='/profileimg/" + second.id_num + "' ></div>";
												} else {
													if( first.score > second.score ){
														win = "패배";
													} else if( first.score < second.score ){
														win = "승리";
													} else {
														win = "무승부";
													}
													var html = "<div class='game_result'><img src='/profileimg/" + second.id_num + "' ><div><span>" + first.name +"</span>님과의 대결에서 <span>" + win  + "</span><br><span>" + second.score + "</span>VS<span>" + first.score + "</span></div><img src='/profileimg/" + first.id_num + "' ></div>";
												}
											} else {
												var html = "<div class='game_result'><div class='game_result_score'>" + room.users[ keys[jtmp] ].score + "</div><img src='/profileimg/" + rooms.users[ keys[jtmp] ].id_num + "' ><span>" +  room.genre +"</span>장르의 대결에서 " + keys.length + "명 중 <span>" + rank  + "등</span></div>";

											}
											Posts.findOne().sort({id:-1}).exec( function( error, post ){
												if( error ){
													throw error;
												}
												var postid;
												if(post.id == null ){
													postid = 1 + jtmp;
												} else {
													postid = post.id + 1 + jtmp;
												}
												var current = new Posts({
													id : postid,
													user_id : room.users[ keys[jtmp] ].id_num,
													user_name : room.users[ keys[jtmp] ].name,
													html : html,
													file : 0
												});
												current.save( function( err2 ){
													if( err2 ){
														throw err2;
													}
													if( jtmp == 0 ){
														for( var ltmp = 0; ltmp < keys.length; ++ltmp ){
															( function(l){
																room.users[ keys[l] ].stage = 0;
																room.users[ keys[l] ].score = 0;
																room.users[ keys[l] ].end = false;
															}(ltmp))
														}
													}
													Relations.find({ to_id : current.user_id, status : "friend" }, function( err3, friends ){
														if( err3 ){
															throw err3;
														} else if( friends.length >= 1 ){
															for( var i = friends.length - 1; i >= 0; --i ){
																for( var j = io.sockets.sockets.length - 1; j >= 0; --j ){
																	if( io.sockets.sockets[j].session.id_num ){
																		if( friends[i].from_id == io.sockets.sockets[j].session.id_num ){
																			io.sockets.sockets[j].emit( 'post_new' );
																		}
																	}
																}
															}
														}
													});
												});
											})
										} else {
											room.users[ user.id ].stage = 0;
											room.users[ user.id ].score = 0;
											room.users[ user.id ].end = false;
										}
									});
								}
							}(k));
						}
					}(j));
				}
				io.sockets.emit( 'room_list' , rooms );
			}
		}
	});

	socket.on( 'game_loaded', function(){
		var room = rooms[ socket.room ];
		var me = room.users[ socket.id_num ];
		me.answerd = false;
		me.startTime = new Date().getTime();
		me.timeManager = setTimeout( function(){
			if( me.stage == room.question.length - 1 ){
				io.sockets.to( me.socket_id ).emit( 'game_end' );
			} else {
				io.sockets.to( me.socket_id ).emit( 'get_music', room.question[ ++me.stage ]);
			}
		}, 10000 )
	});

	socket.on( 'game_answer', function( data ){
		var room = rooms[ socket.room ];
		var me = room.users[ socket.id_num ];
		if( me.answerd != null && me.answerd == false ){
			var gap = ((new Date().getTime()) - me.startTime);
			if( gap < 10000 && room.users[ socket.id_num ].answerd == false ){
				Musics.findOne({ id : room.question[ me.stage ].music },function( err, music ){
					me.answerd = true;
					if( music.title == data ){
						me.score += Math.floor( 100 - (gap/100) );
						socket.emit( 'game_toast', true );
					} else {
						me.score -= 25;
						socket.emit( 'game_toast', false );
					}
					clearTimeout( me.timeManager );
					if( me.stage == room.question.length - 1 ){
						io.sockets.to( me.socket_id ).emit( 'game_end' );
					} else {
						io.sockets.to( me.socket_id ).emit( 'get_music', room.question[ ++me.stage ]);
					}
					io.sockets.in( socket.room ).emit( 'game_answer', { id : socket.id_num, score : me.score } );
				});
			}
		}
	});

	socket.on( 'room_list' , function(){
		socket.emit( 'room_list' , rooms );
	});

	socket.on( 'room_ready' , function(){
		var room = rooms[ socket.room ];
		if( room.host != socket.id_num ){
			if( room.users[ socket.id_num ].ready == false ){
				room.users[ socket.id_num ].ready = true;
				io.sockets.in( socket.room ).emit( 'room_ready', room.users[ socket.id_num ].slot );
			} else {
				room.users[ socket.id_num ].ready = false;
				io.sockets.in( socket.room ).emit( 'room_ready', room.users[ socket.id_num ].slot );
			}
		} else if( room.host == socket.id_num ){
			var keys = Object.keys( room.users );
			if( keys.length <= 0 ){
	//			socket.emit( 'chat_alert', "최소 두명의 플레이어가 필요합니다." );
			} else if( room.genre != null ){
				for( var i = keys.length - 1; i >= 0; --i ){
					if( room.users[ keys[i] ].ready == false ){
						socket.emit( 'chat_alert', "모든 플레이어가 준비되지 않았습니다." );
						break;
					} else if( i == 0 ){
						for( var l = keys.length - 1; l >= 0; --l){
							if( room.users[ keys[l] ].id_num != room.host ){
								room.users[ keys[l] ].ready = false;
							}
						}
						var files = fs.readdirSync(__dirname + '/music/');
						async.waterfall([
							function(callback) { 
								var music_id = new Array(room.question.length);
								Musics.find({ genre : room.genre }, function( err, musics ){
									if( err ){
										throw err;
									}
									for( var jtmp = 0; jtmp < musics.length; ++jtmp ){
										( function( j ){
											var music_index = Math.floor(Math.random()*musics.length );
											music_id[j] = musics[ music_index ].id;
											musics = musics.slice( 0, music_index ).concat( musics.slice( music_index + 1));
											if( j == room.question.length - 1 ){
												 callback( null , music_id )
											}
										}(jtmp))
									}
								});
								/*
								for( var j = 0; j < room.question.length; ++j ){
									var music_index = Math.floor(Math.random()*files.length );
									music_id[j] = parseInt(files[ music_index ].split('.')[0]);
									files = files.slice( 0, music_index ).concat( files.slice( music_index + 1)); 
									if( j == room.question.length - 1 ){
										 callback( null , music_id )
									}
								}
								*/
							}
						],function ( error, music_id ) {
							if( error ){
								throw error;
							}
							Musics.find({ id : { $in : music_id } }, function( err, musics ){
								if( err ){
									throw err;
								}
								room.state = "game";
								for( var j = 0; j < musics.length; ++j ){
									var tmp = j;
									room.question[tmp] = new Object;
									room.question[tmp].music = musics[tmp].id;
									room.question[tmp].examples = new Array(4);
									var answer_index = Math.floor(Math.random()*room.question[tmp].examples.length);
									room.question[tmp].examples[answer_index] = musics[tmp].title;
									( function( jtmp, answerindex ){
										Musics.find({ id : { $nin : music_id }, genre : room.genre }, function( err, examples ){
											for( var k = 0; k < room.question[jtmp].examples.length; ++k ){
												var tmp2 = k;
												if( tmp2 != answerindex ){
													var example_index = Math.floor(Math.random()*examples.length );
													room.question[jtmp].examples[tmp2] = examples[ example_index ].title;
													examples = examples.slice( 0, example_index ).concat( examples.slice( example_index + 1));
												}
												if( jtmp == musics.length - 1 && tmp2 == room.question[jtmp].examples.length - 1 ){
													io.sockets.in( socket.room ).emit( 'game_start' );
													io.sockets.in( socket.room ).emit( 'get_music', room.question[0] );
													return;
												}
											}
										});
									}(tmp, answer_index ));
								}
							});
						});
					}
				}
			} else {
				socket.emit( 'chat_alert', "장르를 선택하세요" );
			}
		}
	});

	socket.on( 'room_create', function( data ){
		var url = encodeURI(data.title);
		var room = rooms[ url ];
		if( room == undefined && socket.session.id_num ){
			rooms[ url ] = new Object();
			room = rooms[ url ];
			room.genre = data.genre;
			room.password = data.password;
			room.host = socket.session.id_num;
			room.slot = new Array( room_max );
			room.listen = 2;
			room.time = 10;
			room.state = "chat";
			room.question = new Array(4);
			for( var i = 0; i < room_max; ++i ){
				if( i < room_max/2 ){
					room.slot[i] = "open";
				} else {
					room.slot[i] = "close";
				}
			}
			room.getopen = function( id ){
				for( var i = 0; i <= room_max; ++i ){
					if( room.slot[i] == id ){
						room.slot[ room.users[ id ].slot ] = "open";
						io.sockets.in( url ).emit( 'chat_exit' , room.users[ id ] );
						if( room.users != undefined && room.users[ id ] != undefined ) {
							//socket.leave( socket.room );
							delete room.users[ id ];
						}
					} else if( i == room_max ){
						return -1;
					} else if( room.slot[i] == "open" ){
						return i;
					}
				}
				
			}
			room.users = new Object();
			socket.emit( 'room_create', url );
			io.sockets.emit( 'room_list' , rooms );
		} 
	});

	socket.on( 'chat_join' , function(){
		var url = xssFilter( socket.handshake.headers.referer.split('/').slice(-1)[0] ).replace(" ","%20");
		var room = rooms[ url ];
		if( room == undefined ){
			delete rooms[ url ];
			socket.emit('chat_alert', "비정상적인 접근입니다.");
		} else if( room.state == "chat" ){
			var slot = room.getopen( socket.session.id_num );
			if( slot >= 0 ){
				socket.room = url;
				socket.id_num = socket.session.id_num;
				room.slot[ slot ] = socket.id_num;
				socket.name = socket.session.name;
				var name = socket.name;
				room.users[ socket.id_num ] = new Object();
				var me = room.users[ socket.id_num ];
				me.name = name;
				me.stage = 0;
				me.score = 0;
				me.end = false;
				me.id_num = socket.id_num;
				me.socket_id = socket.id;
				me.slot = slot;
				if( room.host == socket.id_num ){
					me.ready = true; 
				} else {
					me.ready = false;
				}
				socket.emit( 'getuser', me );
				socket.join( url );
				socket.broadcast.to( socket.room ).emit( 'chat_join' , me );
				socket.emit( 'chat_list' , { users : room.users, slot : room.slot, host : room.host });
				io.sockets.emit( 'room_list' , rooms );
			} else {
				socket.emit('chat_alert' , "방에 빈 자리가 없습니다.");
			}
		} else {
			socket.emit('chat_alert', "게임 진행중입니다.");
		}
	});

	socket.on( 'room_setting' , function( data ){
		room = rooms[ socket.room ];
		if( room.host && ( socket.id_num == room.host ) ){
			if( data.slot - 1 >= 0 ){
				if( room.slot[ data.slot - 1 ] != room.host ){
					if( room.slot[ data.slot - 1 ] == "open" ){
						for( var i = room.slot.length - 1; i >= 0; --i ){
					//		if( i != ( data.slot - 1 ) && ( room.slot[i] == "open" || ( room.slot[i] != "close" && room.slot[i] != socket.id_num ) ) ){
								room.slot[ data.slot - 1 ] = "close";
								io.sockets.emit( 'room_list' , rooms );
								io.sockets.in( socket.room ).emit( 'room_setting', data );
								break;
					//		} else if( i == 0 ){
					//			socket.emit( 'chat_alert', "최소 한 칸은 열려있어야 합니다.");
					//		}
						}
					} else if( room.slot[ data.slot - 1 ] == "close" ){
						room.slot[ data.slot - 1] = "open";
						io.sockets.emit( 'room_list' , rooms );
						io.sockets.in( socket.room ).emit( 'room_setting', data );
					} else {
						//io.sockets.to( room.users[ room.slot[ data.slot - 1] ].socket_id ).emit( 'disconnect' );
						io.sockets.to( room.users[ room.slot[ data.slot - 1] ].socket_id ).emit( 'chat_exit', room.users[ room.slot[ data.slot - 1 ] ] );
						io.sockets.emit( 'room_list' , rooms );
						io.sockets.in( socket.room ).emit( 'room_setting', data );
					}
				}
			} else if( data.host && room.host != data.host ){
				room.users[ socket.id_num ].ready = false;
				room.host = room.users[ room.slot[ data.host - 1 ] ].id_num;
				room.users[ room.host ].ready = true;
				io.sockets.emit( 'room_list' , rooms );
				io.sockets.in( socket.room ).emit( 'room_setting', { host : data.host });
			}
		}
	});
	
	socket.on( 'disconnect' , function(){	
		if( socket.room != undefined && rooms[ socket.room ] != undefined){
			if( socket.id_num != undefined && rooms[ socket.room ].users[ socket.id_num ] != undefined ){
				if( rooms[ socket.room ].state == "chat" ){
					rooms[ socket.room ].slot[ rooms[ socket.room ].users[ socket.id_num ].slot ] = "open";
					io.sockets.in( socket.room ).emit( 'chat_exit', rooms[ socket.room ].users[ socket.id_num ] );
					if( rooms[ socket.room ].host == socket.id_num ){
						for( var i = 0; i < rooms[ socket.room ].slot.length; ++i ){
							if( typeof(rooms[ socket.room ].slot[i]) == "number" ){
								rooms[ socket.room ].host = rooms[ socket.room ].slot[i];
								rooms[ socket.room ].users[ rooms[ socket.room ].host ].ready = true;
								io.sockets.in( socket.room ).emit( 'room_setting', { host : rooms[ socket.room ].users[ rooms[ socket.room ].host ].slot + 1 });
							}
						}
					}
					if( rooms[ socket.room ].users != undefined && rooms[ socket.room ].users[ socket.id_num ] != undefined ) {
						//socket.leave( socket.room );
						delete rooms[ socket.room ].users[ socket.id_num ];
					}
					if( rooms[ socket.room ].users != undefined && !Object.keys( rooms[ socket.room ].users ).length ){
						delete rooms[ socket.room ];
					}
					io.sockets.emit( 'room_list' , rooms );
				} else {
					rooms[ socket.room ].slot[ rooms[ socket.room ].users[ socket.id_num ].slot ] = "open";
					if( rooms[ socket.room ].host == socket.id_num ){
						for( var i = 0; i < rooms[ socket.room ].slot.length; ++i ){
							if( rooms[ socket.room ].slot[i] != "open" && rooms[ socket.room ].slot[i] != "close" ){
								rooms[ socket.room ].host = rooms[ socket.room ].slot[i];
								rooms[ socket.room ].users[ rooms[ socket.room ].host ].ready = true;
							}
						}
					}
					if( rooms[ socket.room ].users != null && rooms[ socket.room ].users[ socket.id_num ] != undefined ){
						delete rooms[ socket.room ].users[ socket.id_num ];
					}
					if( rooms[ socket.room ].users != null && Object.keys( rooms[ socket.room ].users ).length == 0 ){
						delete rooms[ socket.room ];
					}
				}
			}
		}
	});

	socket.on( 'chat_send' , function( data ){
		if( !socket.chatBlocked ){
			if( socket.chatCount > chatMax ){
				blockChat();
				socket.emit( 'chat_alert' , "도배성 채팅으로 인하여 채팅이 제한되었습니다.\n" + blocktime/1000 + "초 후에 채팅이 가능합니다." );
			} else {
				if( !socket.chatCount ){
					socket.chatCount=0;
				}
				socket.chatCount++;
				if( socket.countTimer ){
					clearTimeout( socket.countTimer );
				}
				socket.countTimer = setTimeout( countChat , chatInterval );
				if( data.chat == '' ){
					 socket.emit( 'chat_alert' , "메세지를 입력해 주세요." ); 
				} else {
					data.chat = xssFilter( data.chat );
					var room = socket.room;
					var name = socket.name;
					data.id_num = socket.id_num
					data.chat = data.chat;
					if ( data.to == 'ALL' ) {
						io.sockets.in( room ).emit( 'chat_broadcast' , data );
					} else {
						if( rooms[ room ].users[ rooms[ room ].slot[ data.to - 1 ] ] ){
							socket_id = rooms[ room ].users[ rooms[ room ].slot[ data.to - 1 ] ].socket_id;
							if( socket_id != undefined && socket_id != socket.id ){
								io.sockets.to( socket_id ).emit( 'chat_private' , data );
							}
						}
					}
				}
			}
		} else {
			clearTimeout( socket.blockTimer );
			blockChat();
			socket.emit( 'chat_alert' , "도배성 채팅으로 인하여 채팅이 제한되었습니다.\n" + blocktime/1000 + "초 후에 채팅이 가능합니다." );
		}
	});

	function blockChat(){
		socket.chatBlocked = true;
		socket.blockTimer = setTimeout( function(){
			socket.chatBlocked = false;
			socket.chatCount =0;
		}, blocktime );
	}

	function countChat(){
		if ( socket.chatCount >= 1 ){
			socket.chatCount-=1;
		} else {
			socket.chatCount=0;
		}
	}

	socket.on( 'reply_remove' , function( data ){
		if( socket.session.id_num ){
			var reply_id = data;
			Replys.findOne( { id : reply_id, user_id : socket.session.id_num }, function( err, reply ){
				if( err ){
					throw err;
				}
				var post_id = reply.post_id
				Replys.remove( { id : reply_id }, function( err, result ){
					if( result ){
						Relations.find({ to_id : socket.session.id_num, status : "friend" }, function( err, friends ){
							if ( err ){
								throw err;
							}
							if( friends.length >= 1){
								for( var i = friends.length - 1; i >= 0; --i ){
									for( var j = io.sockets.sockets.length - 1; j >= 0; --j ){
										if( friends[i].from_id == io.sockets.sockets[j].session.id_num ){
											io.sockets[j].emit( 'reply_removed' , 'reply_'+post_id +'_'+ data );
										}
									}
								}
							}
						});
						fs.exists( __dirname + '/files/postimg/' + post_id + '/reply/' + reply_id , function( exists ){
							if( exists ){
								fs.unlink( __dirname + '/files/postimg/' + post_id + '/reply/' + reply_id , function( err ){
								});
							}
						});
					}
				});
			});
		}
	});
	socket.on( 'post_remove' , function( data ){
		if( socket.session.id_num ){
			Posts.findOne( { id : data , user_id : socket.session.id_num }, function( err, post ){
				Posts.remove( { id : data }, function( err, result ){
					Replys.remove( { post_id : data }, function( err ){
						rimraf( __dirname + '/files/postimg/' + data , function(){
							Relations.find({ to_id : socket.session.id_num, status : "friend" }, function( err, friends ){
								if ( err ){
									throw err;
								}
								else if( friends.length >= 1){
									for( var i = friends.length - 1; i >= 0; --i ){
										for( var j = io.sockets.sockets.length - 1; j >= 0; --j ){
											if( friends[i].from_id == io.sockets.sockets[j].session.id_num ){
												io.sockets.sockets[j].emit( 'post_removed' , data );
											}
										}
									}
								}
							});
						});
					});
				});
			});
		}
	});

	socket.on( 'post_write' , function( data ){
		if( socket.session.id_num ){
			//notice_broadcast( socket, 1, data );
			Relations.find({ to_id : socket.session.id_num, status : "friend" }, function( err, friends ){
				if( err ){
					throw err;
				} else if( friends.length >= 1 ){
					for( var i = friends.length - 1; i >= 0; --i ){
						for( var j = io.sockets.sockets.length - 1; j >= 0; --j ){
							if( io.sockets.sockets[j].session.id_num ){
								if( friends[i].from_id == io.sockets.sockets[j].session.id_num ){
									io.sockets.sockets[j].emit( 'post_new' );
								}
							}
						}
					}
				}
			});
		}
	});
	socket.on( 'reply_write' , function( data ){
		Relations.find({ to_id : socket.session.id_num, status : "friend" }, function( err, friends ){
			if( err ){
				throw err;
			}
			if( friends.length >= 1 ){
				for( var i = friends.length - 1; i >= 0; --i ){
					for( var j = io.sockets.sockets.length - 1; j >= 0; --j ){
						if( friends[i].from_id == io.sockets.sockets[j].session.id_num ){
							io.sockets.sockets[j].emit( 'reply_new' , data );
						}
					}
				}
			}
		});
	});
});

app.post( '/getranking', function( req, res ){
	var skip = req.body['skip'];
	Users.find({ signUp : 1 },{ _id : 0, id : 1, name : 1, exp : 1, level : 1, user_id : 1 }).sort({ level : -1, exp : -1 }).limit( 10 ).exec( function( err, result ){
		if( err ){
			throw err;
		} else {
			res.send( result );
		}
	});
});


app.get( '/upload', checkSession, function( req, res ){
	if( req.session.id_num == 1 ){
		res.sendfile(__dirname + '/upload.html');
	} else {
		res.redirect('/');
	}
});

app.post( '/uploadmusic', function( req, res ){
	var fstream;
	var title, artist, genre;
	var mid;
	Musics.findOne().sort({id:-1}).exec( function( err, result ){
		if( err ){
			throw err;
		} else {
			if( result == null ){
				mid = 1;
			} else {
				mid = result.id + 1;
			}
			req.pipe( req.busboy );
			req.busboy.on( 'file' , function( fieldname, file, filename ){
				console.log("file");
				var uploadedFile = __dirname + '/music/' + mid + ".mp3";
				console.log(uploadedFile);
				fstream = fs.createWriteStream( uploadedFile );
				file.pipe( fstream );
				fstream.on( 'close' , function(){
				});
			});
			req.busboy.on( 'field', function( fieldname, val ){
				console.log(fieldname);
				if( fieldname == "genre" ){
					genre = val;
				} else if( fieldname == "artist" ){
					artist = val;
				} else if( fieldname == "title" ){
					title = val;
				} else if( fieldname == "arr" ){
					arr = val;
				}
			});
			req.busboy.on( 'finish', function(){
				if( title != null && artist != null && genre != null ){
					var current = new Musics({
						id : mid,
						title : title,
						artist : artist,
						genre : genre,
						vals : arr
					});
					current.save( function( error ){
						if( error ){
							throw error;
						} else {
							res.send("전송이 완료되었습니다.");
						}
					});
				}
			});
		}
	});
});

app.get( '/ranking', checkSession, function( req, res ){
	res.sendfile(__dirname + '/ranking.html');
});

app.get( '/img/room_background', checkSession, function( req, res ){
	var files = fs.readdirSync(__dirname + '/img/roomimg/');
	var filename = files[ Math.floor( Math.random() * files.length ) ];
	res.sendfile(__dirname + '/img/roomimg/' + filename );
});

app.post( '/getmusicarray', checkSession, function( req, res ){
	var filename = req.body['music_id'];
	Musics.findOne({ id : filename },function( err, result ){
		if( err ){
			throw err;
		}
		if( result ){
			res.send(result.vals.toString());
		}
	});
});

app.get( '/getmusic', checkSession, function( req, res ){
	var files = fs.readdirSync(__dirname + '/music/');
	var filename = files[ Math.floor( Math.random() * files.length ) ];
	res.sendfile(__dirname + '/music/' + filename );
});
app.get( '/getmusic/:filename', checkSession, function( req, res ){
	var filename = req.params['filename'] + ".mp3";
	res.sendfile(__dirname + '/music/' + filename );
});

app.get( '/room', checkSession, function( req, res ){
	res.sendfile(__dirname + '/room.html');
});

app.get( '/profileimg/:userid', checkSession, function( req, res ){
	var userid = parseInt(req.params['userid']);
	fs.exists( __dirname + '/files/profileimg/' + userid + '.jpg', function( exists ){
		if( exists ){
			res.sendfile(__dirname + '/files/profileimg/' + userid + '.jpg' );
		} else {
			res.sendfile(__dirname + '/img/profile.jpg' );
		}
	});
});

app.get( '/profile/:userid', checkSession, function( req, res ){
	var userid = parseInt(req.params['userid']);
	res.sendfile(__dirname + '/profile.html');
});

app.get( '/chat/:roomid', checkSession, function( req, res ){
	res.sendfile(__dirname + '/chat.html');
});

app.get( '/newsfeed', checkSession, function( req, res ){
	res.sendfile(__dirname + '/newsfeed.html');
});

app.get( '/myinfo', checkSession, function( req, res ){
	res.sendfile(__dirname + '/myinfo.html');
});

function getMeta(body){
	var head = body.substring( body.indexOf("<head>") + 6, body.indexOf("</head>") - 1);
	var metas = {};
	while( head.indexOf('property="') ){
		var meta = head.substr( 0, head.indexOf(">") );
		var head = head.substr( meta.length + 1 );
		if( meta == "" ){
			break;
		}
		if( meta.indexOf('property="') >= 0 ){
			var property = meta.substr( meta.indexOf('property="og:') + 13 );
			property = property.substr( 0, property.indexOf('"') );
		} else {
			continue;
		}
		if( meta.indexOf('content="') >= 0 ){
			var content = meta.substr( meta.indexOf('content="') + 9 );
			content = content.substr( 0, content.indexOf('"') );
		} else {
			continue;
		}
		metas[ property ] = content;
	}
	return metas;
}

app.post( '/linkpreview', checkSession, function( req, res ){
	var url = req.body['link'];
	Links.findOne({ url : url },function( error, result ){
		if( error ){
			throw error;
		}
		if( result ){
			res.send(result);
		} else {
			request( url, function( err, response, body ){
				if( err ){
					throw err;
				}
				if( response.statusCode !== 200 ){
					res.end();
				}
				var metas = getMeta(body);
				if( metas.title ){
					var current = new Links({
						url : url,
						title : metas.title,
						description : metas.description,
						image : metas.image
					});
					current.save( function( err2 ){
						if( err2 ){
							throw err2;
							res.end();
						} else {
							res.send(metas);
						}
					});
				} else {
					res.end();
				}
			});
		}
	});
});

app.post( '/getgenre', checkSession, function( req, res ){
	var genres = [];
	Musics.find( function( err, result ){
		for( var i = result.length - 1; i >= 0; --i ){
			( function(j){
				if( genres.indexOf( result[j].genre ) == -1 ){
					genres.push( result[j].genre );
				}
				if( j == 0 ){
					res.send( genres );
				}
			}(i));
		}
	});
});

app.post( '/dontsee', checkSession, function( req, res ){
	var postid = parseInt(req.body['postid']);
	if( postid ){
		Dontsees.remove({ post_id : postid, user_id : req.session.id_num }, function( err, dontsee ){
			if( dontsee == 1 ){
				res.end();
			} else {
				Dontsees.findOne().sort({id:-1}).exec(
					function( err, result ){
						if( !result ){
							dontseeid = 1;
						} else {
							dontseeid = result.id + 1;
						}
						var current = new Dontsees({
							id : dontseeid,
							user_id : req.session.id_num,
							post_id : postid
						});
						current.save( function( err ){
							if( err ){
								throw err;
							}
							res.end();
						});
					}
				);
			}
		});
	} else {
		res.end();
	}
});

app.post( '/favorite', checkSession, function( req, res){
	var postid = parseInt(req.body['postid']);
	if( postid ){
		Favorites.remove({ post_id : postid, user_id : req.session.id_num }, function( err, favorite ){
			if( favorite == 1 ){
				res.end();
			} else {
				Favorites.findOne().sort({id:-1}).exec(
					function( err, result ){
						if( !result ){
							favoriteid = 1;
						} else {
							favoriteid = result.id + 1;
						}
						var current = new Favorites({
							id : favoriteid,
							user_id : req.session.id_num,
							post_id : postid
						});
						current.save( function( err ){
							if( err ){
								throw err;
							}
							res.end();
						});
					}
				);
			}
		});
	} else {
		res.end();
	}
});

app.post( '/profileimg', checkSession, function( req, res ){
	var fstream;
	req.pipe( req.busboy );
	req.busboy.on( 'file' , function( fieldname, file, filename ){
		var uploadedFile = __dirname + '/files/profileimg/' + req.session.id_num+ ".jpg";
		fstream = fs.createWriteStream( uploadedFile );
		file.pipe( fstream );
		fstream.on( 'close' , function(){
			res.redirect(req.get('referer'));
		});
	});
});

app.get( '/signup/mail/:email/:link' , signUpMail);

app.post( '/isfriend' , checkSession, function( req, res){
	if( req.session.id_num == req.body['id'] ){
		res.send("me");
	} else {
		Users.findOne({ id : req.body['id'], signUp : 1 } , function( err, user ){
			if( user ){
				Relations.findOne({ from_id : req.session.id_num, to_id : user.id }, function(err, result){
					if( result ){
						res.send(result.status);
					} else {
						res.send("no");
					}
				});
			} else {
				res.end();
			}
		});
	}
});

app.post( '/frienddel' , checkSession, function( req, res){
	var from_id = req.session.id_num;
	var to_id = req.body['id'];
	if( to_id == from_id ){
		res.send("본인을 대상으로 할 수 없습니다.");
	} else {
		Relations.remove({ $or : [ { from_id : from_id, to_id : to_id }, { from_id : to_id , toid : from_id } ] }, function( err, result ){
			if( result ){
				res.send("친구 끊기가 완료되었습니다.");
			} else {
				res.send("대상과 친구가 아닙니다.");
			}
		});	
	}
});

app.post( '/friendadd' , checkSession, function( req, res){
	var from_id = req.session.id_num;
	var to_id = req.body['id'];
	var to_name = req.body['name'];
	if( to_id == from_id ){
		res.send("본인은 친구로 등록할 수 없습니다.");
	} else if ( to_id == null || to_name == null ){
		res.send("error");
	} else {
		Relations.findOne({ from_id : from_id, to_id : to_id, to_name : to_name }, function( err, friend ){
			if( err ){
				throw err;
			} else if( !friend ){
				Relations.update({ from_id : to_id, to_id : from_id, status : "request" } , { status : "friend" }, function( err, request ){
					if(request){
						var current = new Relations({
							from_id : from_id,
							from_name : req.session.name,
							to_id : to_id,
							to_name : to_name,
							status : "friend"
						});
						current.save( function( error ){
									if( error ){ 
								throw error;
							} else {
								res.send("친구 추가가 완료되었습니다.");
							}
						});
					} else {
						var current = new Relations({
							from_id : from_id,
							from_name : req.session.name,
							to_id : to_id,
							to_name : to_name,
							status : "request"
						});
						current.save( function( error ){
									if( error ){ 
								throw error;
							} else {
								res.send("친구 요청이 완료되었습니다.");
							}
						});		
					}
				});
			} else {
				res.send("이미 추가된 사용자입니다");
			}
		});		
	}
});

app.post( '/search' , checkSession, function( req, res){
	query = req.body['query'];
	if(query){
		Users.findOne({ user_id : query, signUp : 1 },{ "user_id" : 1, "name" : 1, _id : 0 }, function( err, result ){
			if( result ){
				res.send(result);
			} else {
				Users.find({ name : { $regex : query }, signUp : 1 },{ "id" : 1, "user_id" : 1 , "name" : 1, _id : 0 }, function( err, results ){
					if( results ){
						res.send( results );
					} else {
						res.end();
					}
				});
			}
		});
	} else {
		res.send("검색어를 입력하여 주십시오.");
	}
});

app.post( '/getreplys' , checkSession, function( req, res){
	var postid = parseInt(req.body['postid']);
	var skip = parseInt(req.body['skip']);
	var limit = parseInt(req.body['limit']);
	Replys.find({ post_id : postid }).skip( skip ).sort({ id : -1 }).exec( function( err, reply ){ 
		if( limit > 4 && reply.length > 4 ){
			replys = reply.slice(0,4)
			replys.push("더있어요");
			res.send( replys )
		} else if( reply.length >= 1 ) {
			replys = reply.slice(0,limit);
			res.send( replys )
		} else {
			res.end();
		}
	});
});

app.post( '/getposts' , checkSession, function( req, res ){
	Dontsees.find({ user_id : req.session.id_num }, function( err, dontsees ){
		var donts = [];
		if( dontsees && dontsees.length ){
			for( var i = dontsees.length - 1 ; i >= 0 ; --i ){
				donts.push( dontsees[i].post_id );
			}
		}
		Relations.find({ from_id : req.session.id_num, status : "friend" }, function( err, friends ){
			var results = [];
			var skip = parseInt(req.body['skip']);
			var limit = parseInt(req.body['limit']);
			var userid = parseInt(req.body['userid']);
			var tos = new Array();
			if( req.headers.referer && req.headers.referer.indexOf("iori.kr/profile/") >= 0 ){
				tos.push( req.headers.referer.split('/').splice(-1)[0] );
		 	} else if( userid ){
				tos.push( userid );
			} else {
				if( friends && friends.length ){
					for( var i = friends.length - 1 ; i >= 0 ; --i ){
						tos.push( friends[i].to_id );
					}
				}
				tos.push( req.session.id_num );
				tos.push( 1 );
			}
			Posts.find( { id : { $nin : donts }, user_id : { $in : tos } } ).sort({ id : -1 }).limit( limit ).skip( skip ).exec( function( err, posts ){
				if( err ){
					throw err;
				} else if( posts.length <= 0 ){
					res.send("[]")
				} else {
					async.forEach( posts , function( post, key, callback ){
						Replys.find({ post_id : post.id }).sort({ id : -1 }).exec( function( err, reply ){ 
							var replys;
							if( reply.length > 4 ){
								replys = reply.slice(0,4)
								replys.push("더있어요");
							} else {
								replys = reply;
							}
							Favorites.findOne({ post_id : post.id, user_id : req.session.id_num }, function( err, favorite ){
								var isfavorite = false;
								if( favorite ){
									isfavorite = true;
								}
								var result = {
									id : post.id,
									user_id : post.user_id,
									user_name : post.user_name,
									text : post.text,
									html : post.html,
									file : post.file,
									date : post.date,
									reply : replys,
									isfavorite : isfavorite
								};
								results.push( result );
								if( results.length == posts.length ){
									res.send({ post : results, user : req.session.id_num });
								}
							});
						});
					});
				}
			});
		});
	});
});


app.post( '/removereply' , checkSession, function( req, res){
	var reply_id = req.body['reply_id'];
	Replys.findOne( { id : reply_id }, function( err, reply ){
		if( reply ){
			if( req.session.id_num == reply.user_id ){
				var post_id = reply.post_id
				Replys.find( { id : reply_id }, function( err, result ){
					if( result ){
						fs.exists( __dirname + '/files/postimg/' + post_id + '/reply/' + reply_id , function( exists ){
							if( exists ){
								res.send("댓글이 삭제되었습니다.")
							} else {
								res.send("댓글이 삭제되었습니다.");
							}
						});
					} else {
						res.send("존재하지 않는 댓글입니다.");
					}
				});
			} else {
				res.send("본인의 댓글만 지울 수 있습니다.");
			}
		} else {
			res.send("존재하지 않는 댓글입니다.");
		}
	});
});

app.post( '/removepost' , checkSession, function( req, res){
	post_id = req.body['post_id'];
	Posts.findOne( { id : post_id }, function( err, post ){
		if( post ){
			if( req.session.id_num == post.user_id ){
				res.send("게시글이 삭제되었습니다.");
			} else {
				res.send("본인의 게시글만 지울 수 있습니다.");
			}
		} else {
			res.send("존재하지 않는 게시글입니다.");
		}
	});
});

app.post( '/writereply/:postid' , checkSession, function( req, res ){
	if( req.session.userid ){
		var postid = parseInt(req.params['postid']);
		var filecount = 0;
		var saved = 0;
		var text = "";
		req.pipe( req.busboy );
		req.busboy.on( 'file', function( fieldname, file, filename ){
			filecount = 1;
			var fstream;
			Replys.findOne().sort({id:-1}).exec(
				function( err, result ){
					var replyid;
					if( !result ){
						replyid = 1;
					} else {
						replyid = result.id;
					}

					if( saved ){
						Replys.update({ id : replyd },{ file : 1});
					} else {
						var current = new Replys({
							id : replyid + 1,
							user_id : req.session.id_num,
							user_name : req.session.name,
							post_id : postid,
							text : text,
							file : 1,
						});
						current.save( function( error ){
							if( error ){
								throw error;
							}
							saved = 1;
							var uploadedFile = __dirname + '/files/postimg/' + postid  + '/reply' ;
							fstream = fs.createWriteStream( uploadedFile + '/' + ( replyid + 1 ) + ".jpg" );
							file.pipe( fstream );
							fstream.on( 'close' , function(){
								res.end();
							});	
						});
					}
				}
			);
		});
		req.busboy.on( 'field', function( fieldname, val ){
			if( fieldname == "text" ){
				text = trim( xssFilter( val ) );
				if( !text.length ){
					res.end()
				} else {
					Replys.findOne().sort({id:-1}).exec(
						function( err, result ){
							var replyid;
							if( !result ){
								replyid = 1;
							} else {
								replyid = result.id + 1 - saved;
							}
							if( saved ){
								Replys.update({ id : replyid },{ text : text },function(err,result){});
								//	res.send({ id : req.session.userid, name : req.session.name, reply_id:replyid });
							} else {
								var current = new Replys({
									id : replyid,
									user_id : req.session.id_num,
									user_name : req.session.name,
									post_id : postid,
									text : text,
									file : 0,
								});
								current.save( function( error ){
									saved = 1;
											if( error ) { 
										throw error;
									} else { 
										res.send({ id : req.session.userid, name : req.session.name, reply_id:replyid });
									}
								});
							}
						}
					);
				}
			}
		})
	} else {
		res.end();
	}
});

app.post( '/changereply/:replyid' , checkSession, function( req, res ){
	if( req.session.userid && req.session.name ){
		var replyid = parseInt( req.params['replyid'] );
		var date = new Date();
		var ended = 0;
		var filecount = 0;
		Replys.findOne({ id : replyid, user_id : req.session.id_num }, function( err, reply ){
			if( err ){
				throw err;
			} else if( reply ){
				req.pipe( req.busboy );
				req.busboy.on( 'file', function( fieldname, file, filename ){
					++filecount;
					var uploadedFile = __dirname + '/files/postimg/' + reply.post_id + '/reply/' + replyid + '.jpg'
					var fstream;
					fstream = fs.createWriteStream( uploadedFile );
					file.pipe( fstream );
					fstream.on( 'close' , function(){
						Replys.update({ id : replyid, user_id : req.session.id_num },{ file : 1 },function(){
							if(!ended){
								ended = 1;
								res.end();
							}
						});
					});
				});
				req.busboy.on( 'field', function( fieldname, val ){
					if( fieldname == "text" ){
						var text = trim( xssFilter( val ) );
						Replys.update({ id : replyid, user_id : req.session.id_num },{ text : text, file : filecount},function(){
							if(!ended){
								ended = 1;
								res.end();
							}
						});
					}
				});
			} else {
				res.end();
			}
		});
	}
});

app.post( '/changepost/:postid/:change' , checkSession, function( req, res ){
	if( req.session.userid && req.session.name ){
		var postid = parseInt( req.params['postid'] );
		var change = req.params['change'];
		var date = new Date();
		if( change == "0" ){
			change = [];
		} else {
			change = change.split(',');
		}
		Posts.findOne({ id : postid, user_id : req.session.id_num }, function( err, post ){
			if( err ){
				throw err;
			} else if( post ){
				if( change.length == 0 && post.file >= 1 ){
					for( var i = 1 ; i <= post.file ; ++i ){
						var uploadedFile = __dirname + '/files/postimg/' + postid +'/' + i + ".jpg";
						fs.unlink( uploadedFile , function( err ){
							if ( err ){
								throw err;
							}
						});
					}
				}
				var newfile = 0;
				for( var i = 0 ; i < change.length ; ++i ){
					if( change[i] > post.file ){
						newfile = change.length - i;
						if( i != post.file ){	
							for( var j = 0 ; j < i ; ++j ){
								for( var k = 1 ; k <= post.file ; ++k ){
									if( change[j] != k ){
										var uploadedFile = __dirname + '/files/postimg/' + postid +'/';
										fs.unlink( uploadedFile + k + ".jpg" , function( err ){
											if ( err ){
												throw err;
											}
										});
									} else if( j + 1 == i ){
										for( var l = k + 1 ; l <= post.file ; ++l ){
											var uploadedFile = __dirname + '/files/postimg/' + postid +'/' + l + ".jpg";
											fs.unlink( uploadedFile , function( err ){
												if ( err ){
													throw err;
												}
											});
											if( l + 1 > post.file ){
												var uploadedFile = __dirname + '/files/postimg/' + postid +'/';
												fs.rename( uploadedFile + k + ".jpg" , uploadedFile + ( j + 1 ) + ".jpg" );
												break;
											}
										}
										break;
									} else {
										var uploadedFile = __dirname + '/files/postimg/' + postid +'/';
										fs.rename( uploadedFile + k + ".jpg" , uploadedFile + ( j + 1 ) + ".jpg" );
										break;
									}
								}
							}
						}
						break;
					}
				}
				var filecount = 0;
				var fileuploaded = 0;
				var ended = 0;
				req.pipe( req.busboy );
				req.busboy.on( 'file', function( fieldname, file, filename ){
					var uploadedFile = __dirname + '/files/postimg/' + postid + '/' + ( change.length - newfile + ( ++filecount ) ) + '.jpg'
					var fstream;
					fstream = fs.createWriteStream( uploadedFile );
					file.pipe( fstream );
					fstream.on( 'close' , function(){
						if( ++fileuploaded == newfile ){
							if( !ended ){
								ended = 1;
								if( change.length >= 1){
									res.send({ file : change.length, date : date });
								}
							}
						}
					});
				});
				req.busboy.on( 'field', function( fieldname, val ){
					if( fieldname == "text" ){
						var text = trim( xssFilter( val ) );
						Posts.update({ id : postid },{ text : text, file : change.length, change : date }, function( err, result ){
							if( !ended && newfile == 0 ){
								ended = 1;
								res.send({ file : change.length, date : date });
							}
						});
					} else {
						if( !ended ){
							ended = 1;
							res.end();
						}
					}
				});
			} else {
				res.end();
			}
		});
	} else {
		res.end();
	}
});

app.post( '/writepost' , checkSession, function( req, res ){
	var filecount = 0;
	var fileuploaded = 0;
	var savepost = 0;
	req.pipe( req.busboy );
	req.busboy.on( 'file', function( fieldname, file, filename ){
		if( ++filecount == 1 ){
			var fstream;
			Posts.findOne().sort({id:-1}).exec( function( err, result ){
				var postid;
				if( !result ){
					postid = 0;
				} else {
					postid = result.id;
				}
				var current = new Posts({
					id : postid + 1,
					user_id : req.session.id_num,
					user_name : req.session.name,
					text : "",
					file : filecount
				});
				if( !savepost ){
					savepost = 1;
					current.save( function( error ) {
						if( error ) {
							throw error;
						} else {
							var uploadedFile = __dirname + '/files/postimg/' + ( postid + 1 );
							fs.mkdir( uploadedFile, 0755, function( err ){ 
								if( err ){
									throw err;
								}
								fstream = fs.createWriteStream( uploadedFile + '/1.jpg' );
								file.pipe( fstream );
								fstream.on( 'close' , function(){
									fs.exists( uploadedFile + '/reply' , function( exists ){
										if( !exists ){
											fs.mkdir( uploadedFile + '/reply' , 0755, function( err2 ){
												if( err2 ){
													throw err2;
												}
												++fileuploaded;
											});
										}
									});
								});	
							});
						}
					});
				} else {
					Posts.update({ id : postid },{ file : filecount }, function( err, result ){
						if( err ) {
							throw err;
						} else {
							var uploadedFile = __dirname + '/files/postimg/' + ( postid + savepost );
							fs.exists( uploadedFile, function( exist ){
								if( exist ){
									fs.mkdir( uploadedFile, 0755, function( error ){ 
										if( error ){
											throw error;
										}
										fstream = fs.createWriteStream( uploadedFile + '/1.jpg' );
										file.pipe( fstream );
										fstream.on( 'close' , function(){
											fs.exists( uploadedFile + '/reply' , function( exists ){
												if( !exists ){
													fs.mkdir( uploadedFile + '/reply' , 0755, function( err2 ){
														if( err2 ){
															throw err2;
														}
														++fileuploaded;
													});
												}
											});
										});	
									});
								}
							});
						}
					});
				}
			});
		} else {
			var fileid = filecount;
			var a = savepost;
			Posts.findOne().sort({id:-1}).exec( function( err, result ){
				var postid;
				if( !result ){
					postid = 1;
					fileid = 2;
				} else if( result.id ){
					if( a ){
						postid = result.id;
					} else if( fileuploaded ){
						postid = result.id - 1;
					} else {
						postid = result.id + 1 ;	
					}
				}
				Posts.update({ id : postid },{ file : fileid }, function( err, cnt ){
					var uploadedFile = __dirname + '/files/postimg/' + postid;
					fstream = fs.createWriteStream( uploadedFile + '/' + fileid + ".jpg");
					file.pipe( fstream );
					fstream.on( 'close' , function(){
						++fileuploaded;
					});
				});
			});
		}
	});

	req.busboy.on( 'field', function( fieldname, val ){
		if( fieldname == "text" ){
			text = trim( xssFilter( val ) );
			if( text ){
				Posts.findOne().sort({id:-1}).exec( function( err, result ){
					var postid;
					if( !result ){
						postid = 0 + savepost;
					} else {
						postid = parseInt( result.id ) + savepost;
					}
					if( filecount && savepost ){
						Posts.update({ id : postid - fileuploaded },{ text : text }, function(){
							res.send( postid.toString() );
						});
					} else {
						var current = new Posts({
							id : postid + 1,
							user_id : req.session.id_num,
							user_name : req.session.name,
							text : text,
							file : 0
						});
						savepost = 1;
						current.save( function( error ){
							if( error ){
								throw error;
							}
							var uploadedFile = __dirname + '/files/postimg/' + ( postid + 1 );
							fs.mkdir( uploadedFile, 0755, function(){
								fs.exists( uploadedFile + '/reply' , function( exists ){
									if( !exists ){
										fs.mkdir( uploadedFile + '/reply' , 0755, function( err ){
											if( err ){
												throw err;
											}
											res.send( current.id.toString() );
										});
									} else {
										res.send( current.id.toString() );
									}
								});
							});
						});
					}
				});
			} else {
				res.end();
			}
		}
	});
});


app.post( '/getfriends' , checkSession, function( req, res){
	if( req.body['userid'] ){
		userid = req.body['userid'];
	} else {
		userid = req.session.id_num
	}
	Relations.find({ to_id : userid }, function( err, friends ){
		if( err ){
			throw err;
		}
		if( friends.length >= 1 ){
			var users = [];
			for ( var i = friends.length - 1; i >= 0; --i ){
				( function (j) {
					Users.findOne({ id : friends[j].from_id },{ _id : 0, id : 1, level : 1, name : 1 }, function( error, result ){
						if( error ){
							throw error;
						} else {
							users.push(result);
						}
						if( j == 0 ){
							res.send( users );
						}
					});
				}(i))
			}
		} else {
			res.end();
		}
	});
});

app.post( '/getnotice' , checkSession, function( req, res ){
	var cnt = parseInt(req.body['cnt']);
	if( cnt >= 1 ){
		Notices.find({ to_id : req.session.id_num, readed : false }).sort({ id : -1 }).limit(cnt).exec( function( err, result ){
			res.send(result);
		});
	} else {
		Notices.find({ to_id : req.session.id_num }, function( err, result ){
			res.send(result.length.toString());
		});
	}
});
app.post( '/getuser' , checkSession, function( req, res ){
	if( req.body['userid'] ){
		Users.findOne({ id : req.body['userid'] },{ _id : 0, id : 1, level : 1, exp : 1, user_id : 1, name : 1 }, function( err, result ){
			res.send(result);
		});
	} else {
		res.send( req.session );
	}
});

app.post( '/getid' , function( req, res){
	Users.findOne({ name : req.body['name'], signUp : 1 }, function(err, result){
		if( result ){
			res.send( result.name );
		} else {
			res.send("존재하지 않는 사용자입니다.");
		}
		res.send( result.id );
	});
});

app.post( '/getname' , function( req, res){
	Users.findOne({ id : req.body['id'], signUp : 1 }, function(err, result){
		if( result ){
			res.send( result.name );
		} else {
			res.end()
		}
	});
});

app.post( '/findid', function( req, res ){
	var name = trim( req.body['name'] );
	var email = trim( req.body['email'] );
	if( name == undefined ){
		res.send("이름을 입력해주세요.");
	} else if ( email == undefined ){
		res.send("이메일을 입력해주세요.");
	} else {
		Users.findOne({ name : name, email : email }, function( err, result ){
			if( err ){
				throw err;
			}
			if( result ){
				smtpTransport.sendMail({
					from: 'iori <nagase.iori.kr@gmail.com>',
					to: email,
					subject: 'iori.kr 아이디 찾기',
					'html': '<img src="http://iori.kr/img/email.jpg" ><p>당신의 아이디는 ' + result.user_id + '입니다.</p>'
				}, function(err,response){
					if( err ){
						throw err;
					} else {
						res.send(email + "으로 메일이 발송되었습니다.\n메일을 확인해주세요.");
					}
				});
			} else {
				res.send("입력하신 정보에 해당되는 계정을 찾을 수 없습니다.");
			}
		});
	}
});

app.post( '/findpw', function( req, res ){
	var name = trim( req.body['name'] );
	var userid = trim( req.body['id'] )
	var email = trim( req.body['email'] );
	if( name == undefined ){
		res.send("이름을 입력해주세요.");
	} else if( email == undefined ){
		res.send("이메일을 입력해주세요.");
	} else if( userid == undefined ){
		res.send("아이디를 입력해주세요.");
	} else {
		Users.findOne({ name : name, user_id : userid, email : email }, function( err, result ){
			if( err ){
				throw err;
			}
			if( result ){
				smtpTransport.sendMail({
					from: 'iori <nagase.iori.kr@gmail.com>',
					to: email,
					subject: 'iori.kr 비밀번호 찾기',
					'html': '<img src="http://iori.kr/img/email.jpg ><p>당신의 아이디는 ' + result.password + '입니다.</p>'
				}, function(err,response){
					if( err ){
						throw err;
					} else {
						res.send(email + "으로 메일이 발송되었습니다.\n메일을 확인해주세요.");
					}
				});
			} else {
				res.send("입력하신 정보에 해당되는 계정을 찾을 수 없습니다.");
			}
		});
	}
});

app.post( '/userupdate' , checkSession, function( req, res ){
	var id = trim( req.body['id'] );
	var name = trim( req.body['name'] );
	if( id ==null && name == null ) {
		res.redirect('/');
	} else if( registFilter( id ) || registFilter( name ) ){
		res.send( "특수문자는 사용하실 수 없습니다." );
	} else if( id != null ){
		Users.findOne({ user_id : id }, function( err, result){
			if( !result ){
				Users.update({ id : req.sessipn.id_num },{ user_id : id }, function( err, cnt ){
					if( cnt ){
						req.session.destroy();
						res.send('회원 정보가 수정되었습니다. 다시 로그인 해주십시오.')
					} else {
						res.redirect('/');
					}
				});
			} else {
				res.send("이미 사용중인 아이디입니다.");
			}
		});	
	} else if( name != null ){
		Users.update({ id : req.session.id_num },{ name : name }, function( err, cnt ){
			if( cnt ){
				req.session.destroy();
				res.send('회원 정보가 수정되었습니다. 다시 로그인 해주십시오.')
			} else {
				res.redirect('/');
			}
		});
	} else {
		res.redirect('/')
	}
});

app.post( '/userdrop' , checkSession, function( req, res ){
	id = req.session.id_num;
	password = req.body['password'];
	if( id ){
		if( password ){
			Users.findOne({ id : id, password : password, signUp : 1 }, function( err, result ){
				if( result ){
					async.parallel([
						function( callback ){ 
							Users.remove({ id : id, password : password, signUp : 1 }, function( err ){
								if( err ){
									throw err;
								} else {
							 		callback( null , 'user' );
								}
							});
						},
						function( callback ){ 
							Relations.remove({ $or : [ { from_id : id }, { to_id : id } ] }, function( err ){
								if( err ){
									throw err;
								} else {
							 		callback( null , 'relation' );
								}
							});
						},
						function( callback ){
							Replys.find({ user_id : id }, function( err, replys ){
								if( replys != null && replys.length >= 1 ){
									for( var i = replys.length - 1; i >= 0; --i ){
										rimraf( __dirname + '/files/postimg/' + replys[i].post_id + '/' + replys[i].id , function(){
											if( i == replys.length ){
												callback( null, 'reply_file' );
											}
										});
									}
								} else {
									callback( null, 'reply_file' );
								}
							});
						},
						function( callback ){
							Replys.remove({ user_id : id }, function( err ){
								if( err ){
									throw err;
								} else {
							 		callback( null , 'reply' );
								}
							});
						},
						function( callback ){
							Posts.find({ user_id : id }, function( err, posts ){
								if( posts != null && posts.length >= 1 ){
									for( var i = posts.length - 1; i >= 0; --i ){
										rimraf( __dirname + '/files/postimg/' + posts[i].id , function(){
											if( i == posts.length ){
												callback( null, 'post_file' );
											}
										});
									}
								} else {
									callback( null, 'post_file' );
								}
							});
						},
						function( callback ){
							Posts.remove({ user_id : id }, function( err ){
								if( err ){
									throw err;
								} else {
							 		callback( null , 'post' );
								}
							});
						},
						function( callback ){
							Dontsees.remove({ user_id : id }, function( err ){
								if( err ){
									throw err;
								} else {
							 		callback( null , 'dontsee' );
								}
							});
						},
						function( callback ){
							Favorites.remove({ user_id : id }, function( err ){
								if( err ){
									throw err;
								} else {
							 		callback( null , 'favorite' );
								}
							});
						},
						function( callback ){
							Notices.remove({ $or : [ { from_id : id }, { to_id : id } ] }, function( err ){
								if( err ){
									throw err;
								} else {
							 		callback( null , 'notice' );
								}
							});
						}
					],function ( error, asyncresult ) {
						fs.exists('/files/profileimg/' + id + ".jpg");
						req.session.destroy( function(){
							res.redirect('/');
						});
					});
				} else {
					res.send("비밀번호가 맞지 않습니다.");
				}
			});
		} else {
			res.send("비밀번호를 입력해주십시오.")
		}
	} else {
		res.redirect('/')
	}
});

function registFilter(data){
	if( data && data.sesarch ){
		return data.search(/\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\_|\-|\=|\+|\<|\>|\{|\}|\[|\]|\?|\/|\\/) + 1;
	} else {
		return null;
	}
}

app.post( '/register' , function( req, res ){
	id = trim( req.body['id'] );
	password = trim( req.body['password'] );
	name = trim( req.body['name'] );
	email = req.body['email'];
	var shasum = crypto.createHash('sha1');
	shasum.update(email);
	var s = shasum.digest('hex');
	if( !id ) {
		res.send( "아이디를 입력해 주십시오." );
	} else if( !password ){
		res.send( "비밀번호를 입력해 주십시오." ); 
	} else if( !name ){
		res.send( "이름을 입력해 주십시오." );
	} else if( registFilter(id) ){
		res.send( "특수문자는 사용하실 수 없습니다." );
	} else if( registFilter(password) ){
		res.send( "특수문자는 사용하실 수 없습니다." );
	} else if( registFilter(name) ){
		res.send( "특수문자는 사용하실 수 없습니다." );
	} else if( regex.test(email) == false ){
		res.send( "잘못된 이메일 형식입니다" );
	} else {
		Users.findOne( { user_id : id } , function( err, result ){
			if( result ){
				res.send("이미 사용중인 아이디입니다.");
			} else {
				Users.findOne( { email : email } , function( err, result2 ){
					if( result2 ){
						res.send("이미 사용중인 이메일입니다.");	
					} else {
						Users.find().sort({ id : -1 }).limit( 1 ).exec( function( err, result ){
							var id_number;
							if( result.length ){
								id_number = result[0].id + 1;
							} else {
								id_number = 1;
							}
								var current = new Users({
								id : id_number,
								name : name,
								email : email,
									user_id : id,
										password: password,
								signUp : 0
								});

							current.save(function(error){
										if( error ){
									throw error;
								} else {
									sendSignUpMail( email, s );
									res.send(email + "으로 인증메일이 발송되었습니다.\n인증메일을 확인해주세요.");
								}
							});
						});
					}
				});
			}
		});	
	}
});

app.post( '/logout' , checkSession, function( req, res ){
	req.session.destroy( function( err, result ){ 
		res.redirect('/');
	});
});

app.post( '/login' , function( req, res ){
	id = trim( xssFilter( req.body['id'] ) );
	password = trim( xssFilter( req.body['password'] ) );
	if( !id ) { 
		res.send("아이디를 입력해 주십시오."); 
	} else {
		if( !password ) {
			 res.send("비밀번호를 입력해 주십시오."); 
		} else {
			async.waterfall([
				function(callback) { 
					Users.findOne({	user_id : id, password: password },function( err ,result ){
						 callback( null , result )
					})
				}
			],function ( error, result ) {
				if( error ) {
					throw error;
				} else if( !result ) { 
					res.send( "Id 또는 Password가 잘못되었습니다." );
				} else if( !result.signUp ){
					res.send( "이메일 인증이 완료되지 않은 계정입니다.");
				} else {
					req.session.userid = result.user_id; 
					req.session.name = result.name;
					req.session.id_num = result.id;
					res.send('good');
				}
			});
		}
	}
});

