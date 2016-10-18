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
			if(users[req.body.nickname]){
				res.redirect('/signin');
			} else {
				//use username + password for `user`
				if(req.body.nickname.length > 15 || req.body.nickname.length <= 0 || req.body.nickname.trim() == "所有人" || req.body.nickname.trim() == "all") {
					res.redirect('/signin');
				}
				res.cookie('user', req.body.nickname.trim(), {maxAge: 1000*60*60*24*10});
				res.cookie('key', md5(req.body.password+"shenlvmeng"), {maxAge: 1000*60*60*24*10});
				users[req.body.nickname.trim()] = md5(req.body.password+"shenlvmeng");
				console.log(users);
				res.redirect('/');
			}
		});
}