var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/musicfights')
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function callback() {
});

var FavoriteSchema = new mongoose.Schema({
	id : { type : Number },
	user_id : { type : Number },
	post_id : { type : Number},
	date : { type: Date, default: Date.now }
});

var DontseeSchema = new mongoose.Schema({
	id : { type : Number },
	user_id : { type : Number },
	post_id : { type : Number },
	date : { type : Date, default: Date.now }
});

var PostSchema = new mongoose.Schema({
	id : { type : Number },
	user_id : { type : Number },
	user_name : String,
	text : { type : String, default : "" },
	html : { type : String, default : "" },
	date : { type : Date, default: Date.now },
	change :  { type : Date },
	file :  { type : Number }
});

var ReplySchema = new mongoose.Schema({
	id : { type : Number },
	user_id : { type : Number },
	user_name : String,
	post_id : { type : Number },
	text : String,
	date : { type: Date, default: Date.now },
	change : { type : Date },
	file : { type : Number }
});

var RelationSchema = new mongoose.Schema({
	from_id : { type : Number },
	from_name : String,
	to_id : { type : Number },
	to_name : String,
	status : String,
	date : { type: Date, default: Date.now }
});

var UserSchema = new mongoose.Schema({
	id : { type : Number },
	user_id : String,
	name : String,
	email : String,
	password : String,
	exp : { type : Number, default : 0 },
	level : { type : Number, default : 1 },
	signUp : { type : Number },
	date : { type : Date, default : Date.now }
});

var NoticeSchema = new mongoose.Schema({
	id : { type : Number },
	from_id : { type : Number },
	to_id : { type : Number },
	readed : { type : Boolean, default : false },
	notice_type : { type : Number },
	obj_id : { type : Number },
	date : { type : Date, default : Date.now }
});

var GroupSchema = new mongoose.Schema({
	id : { type : Number },
	members : [{
		id : Number,
		permission : Number, // 0은 일반멤버 1은 관리자멤버
		date : { type : Date, default : Date.now }
	}],
	name : String,
	date : { type : Date, default : Date.now }
});

var LinkSchema = new mongoose.Schema({
	url : { type : String },
	title : { type : String },
	description : { type : String },
	image : { type : String }
});

var MusicSchema = new mongoose.Schema({
	id : { type : Number },
	title : { type : String },
	artist : { type : String },
	genre : { type : String },
	vals : []
});

module.exports = {
	Users : mongoose.model('users',UserSchema),
	Relations : mongoose.model('relations',RelationSchema),
	Posts : mongoose.model('posts',PostSchema),
	Replys : mongoose.model('replys',ReplySchema),
	Favorites : mongoose.model('favorites',FavoriteSchema),
	Dontsees : mongoose.model('dontsees',DontseeSchema),
	Groups : mongoose.model('groups',GroupSchema),
	Notices : mongoose.model('notices',NoticeSchema),
	Links : mongoose.model('links',LinkSchema),
	Musics : mongoose.model('musics',MusicSchema)
}

