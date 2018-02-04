"use strict";

// Routes, with inline controllers for each route.
var express = require('express');
var router = express.Router();
var Token = require('./models').Token;
var User = require('./models').User;
var Post = require('./models').Post;
var strftime = require('strftime');
// var body = require('express-validator/check').body;

// Example endpoint
router.get('/create-test-project', function (req, res) {
    var token = new Token({
        userId: 'I am a test project'
    });
    token.save(function (err) {
        if (err) {
            res.status(500).json(err);
        } else {
            res.send('Success: created a Project object in MongoDb');
        }
    });
});

router.post('/api/users/register'/*, [
    body('email')
        .isEmail()
        .withMessage('EmailInvalid')
        .trim()
        .normalizeEmail()
] */, function(req, res) {
   /* if (err) {
        res.status(400).json(err);
        return;
    }*/
    var user = new User({
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        password: req.body.password
    });

    console.log(user);

    user.save(function (err1) {
        if(err1) {
            //Error 400 for Incomplete, EmailRegistered, or EmailInvalid
            if (!req.body.fname || !req.body.lname || !req.body.password) {
                console.log('missing info');
                res.status(400).json(err1);
                return;
            }

            //check database for existing email
            User.find({email: req.body.email}, function(err2, res2) {
                if(res2) {
                    console.log('EmailRegistered');

                    res.status(400).json('EmailRegistered');
                    return;
                }

                else {
                    console.log('weird error');
                    res.status(500).json(err2);
                    return;
                }
            });

        }

        else {
            res.status(200);
            res.send(`Success: created a User: ${user.fname} ${user.lname}`);
        }
    });

});

router.post('/api/users/login', function (req, res) {
    User.findOne({ email: req.body.email }, function (err2, res2) {
        if (res2 === null) {
            console.log('Missing User');
            res.status(301).json('User not Found');
            return;
        }

        else {

            //check pws match
            if (req.body.password !== res2.password) {
                console.log('Wrong PW');
                res.status(301).json('Password not matching');
                return;
            }

            else {
                console.log('generating new token')
                let token = new Token({
                    userId: res2._id,
                    token: res2.email + new Date(),
                    createdAt: new Date()
                });

                // localStorage.setItem('token', token.token);
                
                token.save(function (err) {
                    if (err) {
                        res.status(500).json(err);
                    }
                    else {
                        res.status(200);
                        res.send(`Successful login!`);
                    }
                });

            }

        }
    });

    //search token compare if time is valid
});

router.get('/api/users/logout', function (req, res) {
    Token.findOneAndRemove({ /*token: localStorage.token*/token:req.query.token}, function (err, result) {
        if(err) {
            console.log("Can't find this rosterid");
            res.send(err);
        }

        else {
            console.log(`deletion of token successful`);

            res.send('delete successful');
        }
    });
});

router.get('/api/posts/', function (req, res) {
    Post.find(function (err, result) {
        if (err) {
            res.send('no projects found');
        }

        else {
            let posts = Array.from(result);
            let postPage = [];

            for (let i = 0; i < posts.length || i < 10; ++i) {
                postPage.push(posts[i]);
            }

            //check if specific page requested
            res.send(postPage);
        }

    });
});

router.get('/api/posts/:page', function (req, res) {
    Post.find(function (err, result) {
        if (err) {
            res.send('no projects found');
        }

        else {
            let posts = Array.from(result);
            let postPage = [];

            let start = 0;

            if (req.params.page) start = 10 * (Number(req.params.page) - 1);

            console.log(start);

            for (let i = start; i < posts.length || i < start + 10; ++i) {
                postPage.push(posts[i]);
            }

            //check if specific page requested
            res.send(postPage);
        }

    });
});

router.post('/api/posts', function (req, res) {
    //check if user is logged in
    Token.findOne({ token: req.query.token }, function (err, result) {
        // console.log(result);

        if (!result) {
            res.send('cannot find token')
        }

        //once logged in, find corresponding route 
        else {
            User.findOne({ _id: result.userId }, function (err1, result1) {
                if (err1) res.send('cannot find matching user')
                else {
                    let name = result1.fname + ' ' + result1.lname;

                    var post = new Post({
                        poster: {
                            name: name,
                            id: result1._id
                        },
                        content: req.body.content,
                        likes: 0,
                        comments: [],
                        createdAt: new Date()
                    });

                    post.save(function (err) {
                        if (err) {
                            res.status(500).json(err);
                        }

                        else {
                            res.send('success!');
                        }
                    });
                }
            });
        }
    });

});

router.get('/api/posts/comments/:postid', function (req, res) {
    let id = req.params.postid;
    console.log('well then');

    Token.findOne({ token: req.query.token }, function (err, result) {
        console.log(result, 'hi');
        //check if user is logged in
        if (!result) {
            res.send('cannot find token')
        }

        //once logged in, find corresponding post 
        else {
            Post.findOne({_id: id}, function (err1, result1) {
                if(!result1) res.send('cannot find post');

                else {
                    console.log(result1);
                    res.send(result1.comments);
                }
            });
        }
    });
});

router.post('/api/posts/comments/:postid', function (req, res) {
    let id = req.params.postid;
    let content = req.body.content;
    console.log('well then');

    Token.findOne({ token: req.query.token }, function (err1, result1) {
        //check if user is logged in
        if (!result1) {
            res.send('cannot find token')
        }

        //once logged in, find corresponding post 
        else {
            User.findOne({ _id: result1.userId}, function(err2, result2) {
                if (!result2) res.send('cannot find user');

                else {
                    Post.findOne({ _id: id }, function (err3, result3) {
                        if (!result3) res.send('cannot find post');

                        else {
                            result3.comments.push({
                                createdAt: new Date(),
                                content: content,
                                poster: {
                                    name: result2.fname + ' ' + result2.lname,
                                    id: result1.userId
                                }
                            });
                            result3.save(function (err) {
                                if (err) {
                                    res.status(500).json(err);
                                }

                                else {
                                    res.send('successful comment');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/api/posts/likes/:postid', function (req, res) {
    let id = req.params.postid;
    let content = req.body.content;
    console.log('well then');

    Token.findOne({ token: req.query.token }, function (err1, result1) {
        //check if user is logged in
        if (!result1) {
            res.send('cannot find token')
        }

        //once logged in, find corresponding post 
        else {
            User.findOne({ _id: result1.userId }, function (err2, result2) {
                if (!result2) res.send('cannot find user');

                else {
                    Post.findOne({ _id: id }, function (err3, result3) {
                        if (!result3) res.send('cannot find post');

                        else {
                            console.log(result3);
                            res.send(result3.likes);
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
