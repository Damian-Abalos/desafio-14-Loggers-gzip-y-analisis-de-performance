const socket = io.connect();
console.log('ENTRE A MAIN.JS')
// const normalizr = require("normalizr");
const normalize = normalizr.normalize;
const denormalize = normalizr.denormalize;
const schema = normalizr.schema;
const time = Date(Date.now()).toString()

const schemaAuthor = new schema.Entity('author', {}, {
    idAttribute: 'mail'
})
// Mensaje
const schemaMensaje = new schema.Entity('mensaje', {
    author: schemaAuthor
})
// Mensajes
const schemaMensajes = new schema.Entity('mensajes', {
    mensajes: [schemaMensaje]
})


function addProduct(e) {
    const producto = {
        nombre: document.getElementById('nombre').value,
        precio: document.getElementById('precio').value,
        imagen: document.getElementById('imagen').value
    };
    socket.emit('productoDesdeElCliente', producto);
    return false;
}

function SendMesage() {
    if (document.getElementById('mail').value == "" ||
        document.getElementById('nombre').value == "" ||
        document.getElementById('apellido').value == "" ||
        document.getElementById('edad').value == "" ||
        document.getElementById('alias').value == "" ||
        document.getElementById('avatar').value == "" ||
        document.getElementById('mensaje').value == "") {
        alert("Campos Incompletos")
        return false
    }
    const time = Date(Date.now()).toString()
    const mensaje = {
        author: {
            id: document.getElementById('mail').value,
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            edad: document.getElementById('edad').value,
            alias: document.getElementById('alias').value,
            avatar: document.getElementById('avatar').value
        },
        text: document.getElementById('mensaje').value,
        date: time,
    }
    // console.log(mensaje);
    socket.emit('mensajeDesdeElCliente', mensaje);
    document.getElementById('mensaje').value = "";
    return false;
}

socket.on('mensajeDesdeElServidor', messages => {
    console.log(messages);
    const denormalizedData = denormalize(messages.result, schemaMensajes, messages.entities)
    // console.log(denormalizedData);


    const ultimoIndiceDeMensaje = denormalizedData.messages.length
    const ultimoMensajeNormalizado = denormalizedData.messages[ultimoIndiceDeMensaje -1]

    // for (const messages of denormalizedData.messages) {
    //     console.log(messages);
    //     document.getElementById('tableMessages').innerHTML = `
    //     <div class="d-flex">
    //         <p style="color: blue;">${messages.author.nombre}</p>
    //         <p style="color: brown;">[${messages.date}]:</p>            
    //         <p style="color: green;">${messages.text}</p>
    //     </div>`
        
    const mensajes = []
    mensajes.push(ultimoMensajeNormalizado)
    const mensajesHTML = mensajes.map(newMessages => `
        <div class="d-flex">
            <p style="color: blue;">${newMessages.author.nombre}</p>
            <p style="color: brown;">[${time}]:</p>            
            <p style="color: green;">${newMessages.text}</p>
        </div>
        `)
        .join('')
    document.getElementById('tableMessages').innerHTML = mensajesHTML
})

socket.on('productoDesdeElServidor', listaProductos => {
    // console.log(`productos faker: ${listaProductos}`);
    const productosHTML = listaProductos.map(listaProductos => `
        <div class="row w-90 d-flex m-0">
            <p class="col-4 text-light">${listaProductos.nombre}</p>             
            <p class="col-4 text-center text-light">$${listaProductos.precio}</p>             
            <div class="col-4 text-center"><img style="max-width: 50px;" src="${listaProductos.imagen}" alt=""></div>             
        </div>`)
        .join('')
    document.getElementById('misProductos').innerHTML = productosHTML
})

// socket.on('loginUsuario' , usuario => {
//     document.getElementById('usuario').innerHTML = `Bienvenido ${usuario}`
// })