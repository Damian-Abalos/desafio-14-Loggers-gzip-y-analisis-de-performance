const express = require("express");
const session = require('express-session');

const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local').Strategy;

const cookieParser = require('cookie-parser');
const path = require('path');

const exphbs = require('express-handlebars');

const normalizr = require('normalizr');
const bCrypt = require('bCrypt');

const { Server: IOServer } = require("socket.io");
const { Server: HttpServer } = require("http");

const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { model } = require('mongoose');

const { faker } = require('@faker-js/faker');

const minimist = require('minimist')
const cluster = require('cluster');

const dotenv = require('dotenv');
dotenv.config()

const normalize = normalizr.normalize;
const denormalize = normalizr.denormalize;
const schema = normalizr.schema;
const { fork } = require('child_process')
// const {getRoot, getLogin, postLogin, getsignup, postsignup, getFaillogin, getFailsignup, getLogout, failRoute} = require('./routes')
const DataBase = require('./DataBase.js');
const mensajesDB = new DataBase('mensajes');

const URLDB = process.env.URLDB
const compression = require('compression')
// const infoYrandoms = require('./src/routes/info&randoms')
// const isAuth = require('./src/middlewares/isAuth')

// const numeros = Object.values(args)[0]
const options = {
    alias: {
        p: 'port',
        m: 'modo'
    },
    default: {
        port: '8080',
        modo: 'FORK'
    }
}
const args = minimist(process.argv.slice(2), options)
const port = parseInt(args.port) || 8080
const modo = (args.modo).toUpperCase()
const numCPUs = require('os').cpus().length

console.log(modo);

/*------------- [app]-------------*/
const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
const logger = require('./src/loggers/logger')


app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(bodyParser());
app.use(compression())
app.use(session({
    store: MongoStore.create({
        mongoUrl: URLDB
    }),
    secret: 'shh',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: false,
        secure: false,
        maxAge: 600000
    }
}))
app.use(passport.initialize());
app.use(passport.session());

//Middleware a nivel app para capturar todas las request con loggers.info
app.use((req,res, next) => {
	logger.info(`Ruta: ${req.path}, Método: ${req.method}`)
	next()
})

/*------------- [MongoDB para user]-------------*/
const userSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
})
const User = model('usuarios', userSchema)
mongoose.connect('mongodb://localhost:27017/usuarios')

/*------------- [Motor de plantilla]-------------*/



app.set('views', path.join(path.dirname(''), 'src/views'))
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'index',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    extname: '.hbs'
}))
app.set('view engine', '.hbs')

/*------------- [Productos faker]-------------*/
function generarCombinacion() {
    return {
        nombre: faker.commerce.product(),
        precio: faker.commerce.price(),
        imagen: faker.image.imageUrl()
    }
}
function generarData(cantidad) {
    const productos = []
    for (let i = 0; i < cantidad; i++) {
        productos.push(generarCombinacion())
    }
    return productos
}
const productosFaker = generarData(5)

/*---------------- [Socket] ---------------*/
io.on('connection', async socket => {

    console.log("¡Nuevo cliente conectado!");

    const getMessages = async () => {
        return await mensajesDB.getMessages();
    };

    const listaProductos = await productosFaker
    socket.emit("productoDesdeElServidor", listaProductos) //nombre del evento + data

    const mensajes = await getMessages()
    socket.emit('mensajeDesdeElServidor', mensajes)

    console.log(usuario);
    socket.emit('loginUsuario', usuario)

    socket.on("mensajeDesdeElCliente", async (data) => {
        await mensajesDB.saveMessages(data)
        const mensajes = await getMessages()
        io.sockets.emit("mensajeDesdeElServidor", mensajes);
    });
});

/*------------- [LocalStrategy - Login]-------------*/
passport.use('login', new LocalStrategy(
    (username, password, done) => {
        User.findOne({ username }, (err, user) => {
            if (err)
                return done(err);

            if (!user) {
                console.log('User Not Found with username ' + username);
                return done(null, false);
            }

            if (!isValidPassword(user, password)) {
                console.log('Invalid Password');
                return done(null, false);
            }

            return done(null, user);
        });
    })
);

function isValidPassword(user, password) {
    return bCrypt.compareSync(password, user.password);
}
/*------------- [LocalStrategy - Signup]-------------*/
passport.use('signup', new LocalStrategy({
    passReqToCallback: true
},
    (req, username, password, done) => {
        User.findOne({ 'username': username }, function (err, user) {
            console.log(user);
            console.log(username);
            if (err) {
                console.log('Error in SignUp: ' + err);
                return done(err);
            }
            if (user) {
                console.log('User already exists');
                return done(null, false)
            }
            const newUser = {
                username: username,
                password: createHash(password)
            }
            User.create(newUser, (err, userWithId) => {
                if (err) {
                    console.log('Error in Saving user: ' + err);
                    return done(err);
                }
                console.log(user)
                console.log('User Registration succesful');
                return done(null, userWithId);
            });
        });
    })
)
function createHash(password) {
    return bCrypt.hashSync(
        password,
        bCrypt.genSaltSync(10),
        null);
}

/*------------- [Serializar y deserializar]-------------*/
passport.serializeUser((user, done) => {
    done(null, user._id);
});
passport.deserializeUser((id, done) => {
    User.findById(id, done);
});

/*---------------- [Rutas] ---------------*/

app.get('/info-log', (req, res) => {
    const info = {
        argumentos: args,
        directorio: process.cwd(),
        idProceso: process.pid,
        versionNode: process.version,
        sistemaOperativo: process.platform,
        memoria: process.memoryUsage().heapTotal,
        path: process.execPath,
        numProcesadores: numCPUs
    }
    console.log(info)

    res.render('info', {
        argumentos: args,
        directorio: process.cwd(),
        idProceso: process.pid,
        versionNode: process.version,
        sistemaOperativo: process.platform,
        memoria: process.memoryUsage().heapTotal,
        path: process.execPath,
        numProcesadores: numCPUs
    })
})

app.get('/info', (req, res) => {
    res.render('info', {
        argumentos: args,
        directorio: process.cwd(),
        idProceso: process.pid,
        versionNode: process.version,
        sistemaOperativo: process.platform,
        memoria: process.memoryUsage().heapTotal,
        path: process.execPath,
        numProcesadores: numCPUs
    })
})

app.get('/infoZip', compression(), (req, res) => {
    res.render('info', {
        argumentos: args,
        directorio: process.cwd(),
        idProceso: process.pid,
        versionNode: process.version,
        sistemaOperativo: process.platform,
        memoria: process.memoryUsage().heapTotal,
        path: process.execPath,
        numProcesadores: numCPUs
    })
})


app.get('/api/randoms', (req, res) => {

    let cant = req.query.cant

    if (!cant) cant = 100000000

    //proceso fork
    // const forked = fork(path.join(path.dirname(''), '/api/randoms.js'))
    // forked.on('message', msg => {
    //     if (msg == `listo, puerto:${port}`) {
    //         forked.send(cant)
    //     } else {
    //         res.send(msg)
    //     }
    // })
})


// Index
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        let user = req.user;
        let userMail = user.username
        res.render('profileUser', { userMail })

    } else {
        res.redirect('/login')
        // res.sendFile("/index.html", { root: __dirname });
    }
})
// Login
app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        let user = req.user;
        console.log('user logueado');
        res.render('profileUser', { user })
    } else {
        console.log('user NO logueado');
        res.render('login')
    }
})
app.post('/login', passport.authenticate('login', { failureRedirect: '/login-error', successRedirect: '/' }))
app.get('/login-error', (req, res) => {
    console.log('error en login');
    res.render('login-error', {})
})
// signup
app.get('/signup', (req, res) => {
    res.render('signup')
})
app.post('/signup', passport.authenticate('signup', { failureRedirect: '/signup-error', successRedirect: '/' }))
app.get('/signup-error', (req, res) => {
    console.log('error en signup');
    res.render('signup-error', {})
})
// Logout
app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})
// Fail route
app.get('*', (req, res) => {
    const {url, method} = req
    logger.warn(`Ruta ${method} ${url} no implementada`)
    res.send(`Ruta ${method} ${url} no está implementada`)
    res.status(404).render('routing-error', {})
})

/*---------------- [Autorizar rutas protegidas] ---------------*/
function checkAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.redirect("/login")
    }
}
app.get('/ruta-protegida', checkAuthentication, (req, res) => {
    let user = req.user
    console.log(user);
    res.send('<h1>Ruta OK!</h1>')
})

/*----------------------------------------------*/
app.use("/static", express.static("public"));
/*---------------- [Server] ---------------*/
if (modo === 'CLUSTER') {
    //modo CLUSTER
    if (cluster.isMaster) {
        console.log(`Número de CPU: ${numCPUs}`)
        console.log(`PID MASTER ${process.pid}`)

        for (let i = 0; i < numCPUs; i++) {
            cluster.fork()
        }

        cluster.on('exit', worker => {
            console.log('Worker', worker.process.pid, 'died', new Date().toLocaleString())
            cluster.fork()
        })
    } else {
        const connectedServer = httpServer.listen(port, function () {
            console.log(`Servidor HTTP con Websockets escuchando en el puerto ${connectedServer.address().port}, modo: ${modo} - PID: ${process.pid}`)
        })
        connectedServer.on('error', error => console.log(`Error en servidor: ${error}`))
    }
} else {
    //modo FORK por defecto
    const connectedServer = httpServer.listen(port, function () {
        console.log(`Servidor HTTP con Websockets escuchando en el puerto ${connectedServer.address().port}, modo: ${modo} - PID: ${process.pid}`)
    })
    connectedServer.on('error', error => console.log(`Error en servidor: ${error}`))
    process.on('exit', (code) => {
        console.log('Exit code -> ', code)
    })
}


// const PORT = 8080
// const connectedServer = httpServer.listen(PORT, () => {
//     console.log(`Servidor Http con Websockets escuchando en el puerto ${connectedServer.address().port}`)
// })
// connectedServer.on('error', error => console.log(`Error en el servidor ${error}`))