var md5 = require('./md5');

module.exports = function(app, users){
	app.route('/')
		.get(function(req, res){
			if(req.cookies.user == null || !users[req.cookies.user] || users[req.cookies.user] != req.cookies.key){
				res.redirect('/signin');
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
				res.cookie('user', req.body.nickname.trim(), {maxAge: 1000*60*60*24*10});
				res.cookie('key', md5(req.body.password+"shenlvmeng"), {maxAge: 1000*60*60*24*10});
				users[req.body.nickname.trim()] = md5(req.body.password+"shenlvmeng");
				console.log(users);
				res.redirect('/');
			}
		});
}