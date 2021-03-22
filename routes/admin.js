var express = require('express')
var users = require('./../inc/users')
var admin = require('./../inc/admin')
var menus = require('./../inc/menus')
var contacts = require('./../inc/contacts')
var reservations = require('.././inc/reservations')
var email = require('.././inc/emails')
var moment = require('moment')


var router = express.Router()



module.exports = function(io){
    moment.locale("pt-BR")

router.use(function(req, res, next) {
    if(['/login'].indexOf(req.url) === -1 && !req.session.user){
        res.redirect('/admin/login')
    }
    else{
        next()
    }
})

router.use(function(req, res, next){
    req.menus = admin.getMenus(req)
    next()
})

router.get("/logout", function(req, res, next) {
    delete req.session.user

    res.redirect('/admin/login')
})

router.get("/", (req, res, next) => {
    admin.dashboard().then(data => {
        res.render("admin/index", admin.getParams(req, {
            data
        }))
    }).catch(err => {
        admin.render(req, res, err.message || err)
    })
})

router.get("/dashboard", (req, res, next) => {
    reservations.dashboard().then(data => {
        res.send(data)
    })
})




router.post("/login", (req, res, next) => {
    if(!req.body.email){
        users.render(req, res, "Preencha o campo de email")
    }
    else if(!req.body.password){
        users.render(req, res, "Preencha o campo de senha")
    }
    else{
        users.login(req.body.email, req.body.password).then(user => {
            req.session.user = user
            res.redirect("/admin")
        }).catch(err => {
            users.render(req, res, err.message || err)
        })
    }
})

router.get("/login", (req, res, next) => {
    users.render(req, res, null)
})

router.get("/contacts", (req, res, next) => {
    contacts.getContacts().then(data => {
        res.render("admin/contacts", admin.getParams(req, {
            data
        }))
    })   
})

router.delete("/contacts/:id", (req, res, next) => {
    contacts.delete(req.params.id).then(results => {
        res.send(results);
        io.emit('dashboard update');
    }).catch(err => {
        res.send(err)
    })
})



router.get("/emails", (req, res, next) => {
    email.getEmails().then(data => {
        res.render("admin/emails", admin.getParams(req, {
            data
        }))
    })
})


router.delete("/emails/:id", (req, res, next) => {
    email.delete(req.params.id).then(results => {
        res.send(results);
        io.emit('dashboard update');
    }).catch(err => {
        res.send(err)
    })
})

router.get("/menus", (req, res, next) => {
    menus.getMenus().then(data => {
        res.render("admin/menus", admin.getParams(req, {
            data
        }))
    })
})

router.post("/menus", (req, res, next) => {
    menus.save(req.fields, req.files).then(results => {
        io.emit('dashboard update');
        res.send(results)
    }).catch(err=> {
        res.send(err)
    })
})

router.delete("/menus/:id", (req, res, next) => {
    menus.delete(req.params.id).then(results => {
        io.emit('dashboard update');
        res.send(results)
    }).catch(err=> {
        res.send(err)
    })
})

router.get('/reservations/chart', (req, res, next) => {
    req.query.start = (req.query.start) ? req.query.start : moment().subtract(1, "year").format("YYYY-MM-DD")
    req.query.end = (req.query.end) ? req.query.end : moment().format("YYYY-MM-DD")

    reservations.chart(req).then(chartData => {
        res.send(chartData)
    }).catch(err => {
        res.send(err)
    })
})

router.get("/reservations", (req, res, next) => {
    let start = (req.query.start) ? req.query.start : moment().subtract(1, "year").format("YYYY-MM-DD")
    let end = (req.query.end) ? req.query.end : moment().format("YYYY-MM-DD")
    reservations.getReservations(req).then(pag => {
        res.render("admin/reservations", admin.getParams(req, {
            date: {
                start,
                end
            },
            data: pag.data,
            moment,
            links: pag.links
        }))
    })
})

router.post("/reservations", (req, res, next) => {
    reservations.save(req.fields, req.files).then(results => {
        io.emit('dashboard update');
        res.send(results)
    }).catch(err=> {
        res.send(err)
    })
})

router.delete("/reservations/:id", (req, res, next) => {
    reservations.delete(req.params.id).then(results => {
        io.emit('dashboard update');
        res.send(results);
    }).catch(err=> {
        res.send(err)
    })
})

router.get("/users", (req, res, next) => {
    users.getUsers().then(data => {
    res.render("admin/users", admin.getParams(req, {
        data
    }))
})
})

router.post("/users", (req, res, next) => {
    users.save(req.fields).then(results => {
        io.emit('dashboard update');
        res.send(results);
    }).catch(err => {
        res.send(err)
    })
})


router.post("/users/password-change", function(req, res, next) {
    users.changePassword(req).then(results => {
        res.send(results);
    }).catch(err => {
        res.send({
            error: err
        });
    })
})



router.delete("/users/:id", (req, res, next) => {
    users.delete(req.params.id).then(results => {
        io.emit('dashboard update');
        res.send(results);
    }).catch(err => {
        res.send(err)
    })
})

    return router;
}