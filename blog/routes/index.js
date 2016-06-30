var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    multer  = require('multer');


var storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, './public/images')
    },
    filename: function (req, file, cb){
        cb(null, file.originalname)
    }
});
var upload = multer({
    storage: storage
});

module.exports = function(app){
  app.get('/', function(req, res, next) {
    Post.get(null, function (err, posts) {
    if (err) {
      posts = [];
    } 
    res.render('index', {
      title: 'Home Page',
      user: req.session.user,
      posts: posts,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  });

  app.get('/reg', checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', {
    title: 'Sign up',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function (req, res) {
    var name = req.body.name,
      password = req.body.password,
      password_re = req.body['password-repeat'];
  //检验用户两次输入的密码是否一致
  if (password_re != password) {
    req.flash('error', 'The password are different!'); 
    return res.redirect('/reg');//返回注册页
  }
  //生成密码的 md5 值
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
  });
  //检查用户名是否已经存在 
  User.get(newUser.name, function (err, user) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    if (user) {
      req.flash('error', 'User exists already!');
      return res.redirect('/reg');//返回注册页
    }
    //如果不存在则新增用户
    newUser.save(function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/reg');//注册失败返回主册页
      }
      req.session.user = newUser;//用户信息存入 session
      req.flash('success', 'Sign up successfully!');
      res.redirect('/');//注册成功后返回主页
    });
  });
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login', {
        title: 'Login',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()});
  });

  app.get('/login', checkNotLogin);
  app.post('/login', function (req, res) {
    //生成密码的 md5 值
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  //检查用户是否存在
  User.get(req.body.name, function (err, user) {
    if (!user) {
      req.flash('error', 'User does not exist!'); 
      return res.redirect('/login');//用户不存在则跳转到登录页
    }
    //检查密码是否一致
    if (user.password != password) {
      req.flash('error', 'Wrong password!'); 
      return res.redirect('/login');//密码错误则跳转到登录页
    }
    //用户名密码都匹配后，将用户信息存入 session
    req.session.user = user;
    req.flash('success', 'Login successfully!');
    res.redirect('/');//登陆成功后跳转到主页
  });
  });

  app.get('/post', checkLogin);
  app.get('/post', function (req, res) {
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
    var currentUser = req.session.user,
    post = new Post(currentUser.name, req.body.title, req.body.post);
    post.save(function (err) {
    if (err) {
      req.flash('error', err); 
      return res.redirect('/');
    }
    req.flash('success', '发布成功!');
    res.redirect('/');//发表成功跳转到主页
  });
  });

  app.get('/logout', function (req, res) {
    req.session.user = null;
  req.flash('success', 'Logout successfully');
  res.redirect('/');//登出成功后跳转到主页
  });

  app.get('/upload', checkLogin);
  app.get('/upload', function (req, res) {
    res.render('upload', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload', checkLogin);
    app.post('/upload', upload.array('field1', 5), function (req, res) {
      req.flash('success', 'Upload successfully!');
      res.redirect('/upload');
  });

   function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', 'Need to login first!'); 
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', 'Login already!'); 
      res.redirect('back');
    }
    next();
  }
};
