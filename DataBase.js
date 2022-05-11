const normalizr = require("normalizr");
const normalize = normalizr.normalize;
const denormalize = normalizr.denormalize;
const schema = normalizr.schema;

const schemaAuthor = new schema.Entity('author', 
    {}, 
    {idAttribute: 'mail'}
)
// Mensaje
const schemaMensaje = new schema.Entity('mensaje', {
	author: schemaAuthor
}
)
// Mensajes
const schemaMensajes = new schema.Entity('mensajes', {
	mensajes: [schemaMensaje]
}
)

const normalizeMessages = (mensajes) => {
    return normalize(mensajes, schemaMensajes)
}

class DataBase {

    constructor(collection) {
        this.collection = collection
        this.arrayMensajes = [{
            author: {
                id: "damianabalos@hotmail.com",
                nombre: "damian",
                apellido: "abalos",
                edad: "27",
                alias: "jarkor",
                avatar: "xxx"
            }, text: "hola"
        }]
    }

    async getMessages() {
        try {
            const messages = await this.arrayMensajes
            // console.log(messages);
            return normalizeMessages({id:'mensajes', messages})
        } catch (error) {
            throw new Error(`Error al buscar: ${error}`)
        }
    }

    saveMessages = async (datos) => {
        await this.arrayMensajes.push(datos)
        return 'mensaje enviado 🆗'   
    };

}


module.exports = DataBase