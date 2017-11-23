'use strict'

//importar el framework(informacion) de express
var express = require('express');

//importar la libreria mongoose
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var multer = require("multer");
var cloudinary = require("cloudinary");
var app_user = "adminKennedy";
var app_password = "pa55w0rd";
var method_override = require('method-override');
var bcrypt = require ('bcrypt-nodejs')
var Schema = mongoose.Schema;

//heroku salvita484marquez@gmail.com
//marquezz1234 or salvador123
//nodemon para que actualice los cambios que se hacen en el servidor automaticamente

//credenciales de cuenta en cloudinary
cloudinary.config({
 cloud_name: "salvita", //12345678
 api_key: "642818835136612",
 api_secret: "e0Up2BG4PfPF-xpfKuBH23wxp68"
});


//creando un servidor para responder las peticiones del usuario, ejecutando express
var app = express();
const port = process.env.PORT || 8080;

//conectando la base de datos creada en mongodb
mongoose.connect("mongodb://127.0.0.1:27017/dbEscuela");
//mongoose.connect("mongodb://<Salvador Marquez>:<olomega200>@ds115396.mlab.com:15396/dbescuela");

//motor de las vistas-->jade
app.set("view engine", "jade");

app.use(express.static("public"));

//utilizar bodyParser para parsear los parametros que vengan de post
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//con methodOverride sobreescribimos el metodo 'post'
// basado en un parametro _method
app.use(method_override("_method"));

//almacenar temporalmente las imagenes en la carpeta uploads
//estas se guardaran en cloudinary
var uploader = multer({dest: "./uploads"});

//definir el esquema(schema) de nuestroS eventos
var eventosSchema = {
  actividad: String,
  fecha: Date
};

//definir el esquema(schema) de nuestro personal
var personalSchemaJSON = {
  titulo: String,
  imageUrl: String,
  otros: String
};

var personalSchema = new Schema(personalSchemaJSON);
personalSchema.virtual("image.url").get(function(){
  if(this.imageUrl === "" || this.imageUrl === "data.png") {
    //si el usuario no elige una imagen se cargara por defecto Teachers.png
    return "Teachers.png";
  }
  return this.imageUrl;
});

//generar el modelo del esquema 'eventos'
var Eventos = mongoose.model("Eventos", eventosSchema);
//generar el modelo del esquema 'personal'
var Personal = mongoose.model("Personal", personalSchema);

//****************agregando nuevo personal********************
//************************************************************
var middleware_upload = uploader.single('imagen');
app.post("/personal",middleware_upload, function(solicitud,respuesta){

  if(solicitud.body.password == app_password){
    //creando un nuevo 'personal'
    //data=objeto JASON
    var data = {
        titulo: solicitud.body.titulo,
        imageUrl: "data.png",
        otros: solicitud.body.otros
        }
      var personal = new Personal(data);
      if (solicitud.file) {

      //subiendo imagen a cloudinary
      cloudinary.uploader.upload(solicitud.file.path, function(result) {
      //result es donde se encuentra nuestra imagen
      personal.imageUrl = result.url;
      //queries 'save' para guardar un nuevo personal
      personal.save(function(err) {
      console.log(personal);
      respuesta.redirect("/personal");
    });
  });
} else{
  //queries 'save' para guardar un nuevo personal aunque no tenga imagen
  personal.save(function(err) {
  console.log(personal);
  respuesta.redirect("/personal");
});
}
} else{
    respuesta.redirect("/personal/new")
  }
});

//****************Iniciando como administrador********************
//************************************************************
app.post("/admin/adminPers", function(solicitud,respuesta){
  if(solicitud.body.password == app_password && solicitud.body.usuario == app_user){
    //'documento' seria la 'tabla' de la db
    Personal.find(function(error,documento){
      if (error){ console.log(error); }
      respuesta.render("admin/adminPers",{ tablaPersonal: documento})
    });
  }else{
    respuesta.redirect("/admin/iniciar");
  }
});
//********llamando todos los datos de la BD para que lo vea el usuario final***********
//************************************************************
app.get("/personal", function(solicitud, respuesta) {
 //Buscar los datos(personal) que esta en la base de datos
 //con la queries 'find' buscamos todo lo que esta en el modelo 'Personal'
 //la variable documento recibe todos los datos de la consulta
 Personal.find(function(error,documento){
   if (error){ console.log(error); }
   respuesta.render("personal/mostrarPers",{ listaPersonal: documento})

 });
});

//*********mostrar el formulario para editar el personal***********
//************************************************************
app.get("/personal/editar/:id", function(solicitud,respuesta){
  //rescatamos de la solicitud el parametro id
  var id_personal = solicitud.params.id;

  //haciendo la queries respectiva a la base de datos dbEscuela
  Personal.findOne({_id: id_personal},function(error,documento){
    console.log(documento);
    //con JASON({personal: documento}) mostramos los datos
    //que queremos que se envien a la vista editar
   respuesta.render("personal/editar",{personal: documento});

  });
});

  //****************actualizando el personal********************
  //************************************************************
//function(req,res)<-parametros, es un colback
var middleware_upload = uploader.single('imagen');
app.put('/personal/:id', middleware_upload, function(solicitud,respuesta){

  if(solicitud.body.password == app_password){
    //actualizando un 'personal'
    //data=objeto JASON
    var data = {
        titulo: solicitud.body.titulo,
        otros: solicitud.body.otros
      };
      if (solicitud.file) {
        //subiendo imagen a cloudinary
        cloudinary.uploader.upload(solicitud.file.path, function(result) {
        //result es donde se encuentra nuestra imagen
        data.imageUrl = result.url;
        //queries 'update' para actualizar un nuevo personal
        Personal.update({"_id": solicitud.params.id},data,function(){
          respuesta.redirect("/personal");
          });
    });
    }else{
      Personal.update({"_id": solicitud.params.id},data,function(){
        respuesta.redirect("/personal");
      });
    }

    }else{
      respuesta.redirect("/admin/iniciar");
    }
});

//***********mostrar el formulario para eliminar los productos*************
//************************************************************
app.get("/personal/eliminar/:id", function(solicitud, respuesta){
  var id = solicitud.params.id;

  Personal.findOne({"_id": id}, function(error, documento){
    respuesta.render("personal/eliminar", { personal: documento });
  });
});

//****************eliminando productos********************
//************************************************************
var middleware_upload = uploader.single('imagen');
app.delete("/personal/:id", middleware_upload, function(solicitud,respuesta){
  var id = solicitud.params.id;
  if(solicitud.body.password == app_password){
    //eliminando un 'personal'
    //data=objeto JASON
    Personal.remove({"_id": id},function(error){
      if(error){console.log(error); }
      respuesta.redirect("/personal")
    });
    }else{
      respuesta.redirect("/personal");
    }
});

//****************BLOQUE DE CODIGO PARA ADMINISTRAR LOS EVENTOS********************
//************************************************************
//****************Panel de administracion eventos********************
//************************************************************
app.post("/eventos/adminEvent", function(solicitud,respuesta){
  if(solicitud.body.password == app_password){
    Eventos.find(function(error,documento){
      if (error){ console.log(error); }
      respuesta.render("eventos/adminEvent",{ tablaEventos: documento})
    });
  }else{
    respuesta.redirect("/admin/iniciar");
  }
});
//********llamando todos los datos de la BD para que lo vea el usuario final***********
//************************************************************
app.get("/eventos", function(solicitud, respuesta) {
 //Buscar los datos(personal) que esta en la base de datos
 //con la queries 'find' buscamos todo lo que esta en el modelo 'Personal'
 //la variable documento recibe todos los datos de la consulta
 Eventos.find(function(error,documento){
   if (error){ console.log(error); }
   respuesta.render("eventos/mostrarEvent",{ listaEventos: documento})

 });
});

//****************agregando nuevo EVENTO********************
//************************************************************
var middleware_upload = uploader.single('imagen');
app.post("/eventos",middleware_upload, function(solicitud,respuesta){

  if(solicitud.body.password == app_password){
    //creando un nuevo 'evento'
    //data=objeto JASON
    var data2 = {
        actividad: solicitud.body.actividad,
        fecha: solicitud.body.fecha

        }
      var eventos = new Eventos(data2);
      //queries 'save' para guardar un nuevo personal
      eventos.save(function(err) {
      console.log(eventos);
      respuesta.redirect("/eventos");
    });
  } else{
    respuesta.redirect("/eventos/nuevoEvent")
  }
});

//*********mostrar el formulario para editar los eventos***********
//************************************************************
app.get("/eventos/editEvent/:id", function(solicitud,respuesta){
  //rescatamos de la solicitud el parametro id
  var id_eventos = solicitud.params.id;

  //haciendo la queries respectiva a la base de datos dbEscuela
  Eventos.findOne({_id: id_eventos},function(error,documento){
    console.log(documento);
    //con JASON({personal: documento}) mostramos los datos
    //que queremos que se envien a la vista editar
   respuesta.render("eventos/editEvent",{eventos: documento});


  });
});

  //****************actualizando los eventos********************
  //************************************************************
//function(req,res)<-parametros, es un colback
var middleware_upload = uploader.single('imagen');
app.put('/eventos/:id', middleware_upload, function(solicitud,respuesta){

  if(solicitud.body.password == app_password){
    //actualizando un 'personal'
    //data=objeto JASON
    var data2 = {
        actividad: solicitud.body.actividad,
        fecha: solicitud.body.fecha
      };
      //queries 'update' para actualizar un nuevo personal
        Eventos.update({"_id": solicitud.params.id},data2,function(){
          respuesta.redirect("/eventos");
          });

    }else{
      respuesta.redirect("/admin/iniciar");
    }
});
//***********mostrar el formulario para eliminar los eventos*************
//************************************************************
app.get("/eventos/elimEvent/:id", function(solicitud, respuesta){
  var id = solicitud.params.id;

  Eventos.findOne({"_id": id}, function(error, documento){
    respuesta.render("eventos/elimEvent", { eventos: documento });
  });
});

//****************eliminando productos********************
//************************************************************
var middleware_upload = uploader.single('imagen');
app.delete("/eventos/:id", middleware_upload, function(solicitud,respuesta){
  var id = solicitud.params.id;
  if(solicitud.body.password == app_password){
    //eliminando un 'personal'
    //data=objeto JASON
    Eventos.remove({"_id": id},function(error){
      if(error){console.log(error); }
      respuesta.redirect("/eventos")
    });
    }else{
      respuesta.redirect("/eventos");
    }
});

app.get("/", function(solicitud, respuesta) {
 //renderisando la vista 'index'
  respuesta.render("index");
});
app.get("/admin/opciones", function(solicitud,respuesta){
  respuesta.render("admin/opciones");
});

app.get("/admin/adminPers", function(solicitud,respuesta){
  respuesta.render("admin/adminPers");
});

app.get("/admin/iniciar", function(solicitud,respuesta){
  respuesta.render("admin/iniciar");
});

app.get("/institucional", function(solicitud,respuesta){
  respuesta.render("institucional");
});
app.get("/eventos/mostrarEvent", function(solicitud,respuesta){
  respuesta.render("eventos/mostrarEvent");
});

app.get("/contacto", function(solicitud, respuesta) {
 //renderisando la vista 'contacto'
respuesta.render("contacto")
});

app.get("/multimedia", function(solicitud, respuesta) {
 //renderisando la vista 'contacto'
respuesta.render("multimedia")
});

app.get("/inicio", function(solicitud, respuesta) {
 //renderisando la vista 'inicio'
respuesta.render("inicio")
});

//Recibiendo peticiones desde '/' con el metodo get //***  *****//
app.get("/index", function(solicitud, respuesta) {
 //renderisando la vista 'index'
  respuesta.render("index");
});

//definir ruta a traves de la cual se van a administra el personal
app.get("/personal/new",function(solicitud, respuesta){
  respuesta.render("personal/new")
  });

app.get("/personal/mostrarPers",function(solicitud, respuesta){
  respuesta.render("personal/mostrarPers")
  });

///*******para eventos***
app.get("/eventos/nuevoEvent",function(solicitud, respuesta){
  respuesta.render("eventos/nuevoEvent")
  });

//especificar la llamada al puerto
app.listen(port, function() {
  console.log(`pagWebDinamica corriendo en http://127.0.0.1:${port}`);
});
