var md5 = require('./md5');

module.exports = function(app, users, ousers){
	app.route('/')
		.get(function(req, res){
			if(req.cookies.user == null || !users[req.cookies.user] || users[req.cookies.user] != req.cookies.key){
				res.redirect('/signin');
			} else if(ousers[req.cookies.user]) {
				res.redirect('http://baidu.com');
			} else {
				res.sendFile('views/chat.html', {root: __dirname});
			}
		});

	app.route('/signin')
		.get(function(req, res){
			res.sendFile('views/login.html', {root: __dirname});
		})
		.post(function(req, res){
			var nickname = req.body.nickname.trim().replace(/[^\u4e00-\u9fa5_a-zA-Z0-9]/g, "");
			if(nickname.length > 15 || nickname.length <= 0 || nickname == "所有人" || nickname == "all" || users[nickname]){
				res.redirect('/signin');
			} else {
				//use username + password for `user`
				res.cookie('user', nickname, {maxAge: 1000*60*60*24*10});
				res.cookie('key', md5(req.body.password+"shenlvmeng"), {maxAge: 1000*60*60*24*10});
				users[nickname] = md5(req.body.password+"shenlvmeng");
				console.log(users);
				res.redirect('/');
			}
		});
}