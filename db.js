try{
    var mongo = require('mongodb');
}catch(E){
    console.log("error - mongodb not found");
    console.log("download from here - https://github.com/christkv/node-mongodb-native")
    process.exit(1);
}

var config = require("./config");

/**
 * zipdb
 * 
 * Sisaldab avalikke meetodeid andmete salvestamiseks baasi
 **/

/**
 * zipdb.db_connection -> Object
 * 
 * Hoiab endas viidet andmebaasiühenduse juurde. Saab tekitada
 * funktsiooniga open_db
 **/
exports.db_connection = false;

/*
 * Määrab ära ühenduse seaded ja salvestab need muutujasse db
 */
var db = new mongo.Db(
    config.db.name, // db name 
    new mongo.Server(
        config.db.host, // server 
        config.db.port || mongo.Connection.DEFAULT_PORT, //port
        {auto_reconnect: true}
    ));

// Ava andmebaas
var db_open_queue = [];
open_db(function(){}, function(){});

/**
 * open_db(callback, error_callback) -> undefined
 * - callback (Function): funktsioon mis käivitada peale andmebaasi avamist
 * - error_callback (Function): käivita kui avamine ei õnnestunud
 * 
 * Avab andmebaasi toiminguteks ja salvestab pointeri muutujasse
 * exports.db_connection
 **/
function open_db(callback, error_callback){
    // console.log("OPEN DB");
    if(db_open_queue.length){
        db_open_queue.unshift([callback, error_callback]);
        return;
    }
    db_open_queue.unshift([callback, error_callback]);
    db.open(function(error, db){
        if(error){
            // console.log("DB ERROR");
            // console.log(error);
            while(db_open_queue.length){
                db_open_queue.pop()[1](error, null);
            }
            error_callback(error, null);
        }
        // console.log("DB OPEN OK");
        exports.db_connection = db;
        while(db_open_queue.length){
            db_open_queue.pop()[0]();
        }
    });
}

/**
 * zipdb.createCollection(callback) -> undefined
 * - callback (Function): tagasikutsefunktsioon
 * 
 * Loob andmebaasi tabeli
 **/
exports.createCollection = function(callback){
    if(!exports.db_connection){
        return open_db(exports.createCollection.bind(exports, callback), callback);
    }
    db.createCollection(config.db.table, callback);
}

/**
 * zipdb.initCollection(callback) -> undefined
 * - callback (Function): tagasikutsefunktsioon
 * 
 * Tagab et andmebaas on avatud ning tabel on olemas
 **/
exports.initCollection = function(callback){
    if(!exports.db_connection){
        return open_db(exports.initCollection.bind(exports, callback), callback);
    }
    
    db.dropCollection(config.db.table, function(error){
        if(error)return callback && callback(error, null);
        exports.createCollection(callback)
        // console.log("COLLECTION DROPPED")
    });
}

/**
 * zipdb.save(doc, callback) -> undefined
 * - doc (Object): Salvestatavad andmed
 * - callback (Function): käivitatakse kui on error või salvestamine õnnestub
 *   parameetriteks error, success
 *   
 * Salvestab andmed baasi
 **/
exports.save = function(doc, callback){
    if(!exports.db_connection){
        return open_db(exports.save.bind(exports, data, callback), callback);
    }
    
    db.createCollection(config.db.table, function(error, collection){
        if(error){
            // console.log("COLLECTION ERROR")
            // console.log(error);
            return callback(error, null);
        }
        // console.log("COLLECTION SELECT OK");
        
        // console.log("INSERT")
        collection.insert(doc, function(error, docs){
            if(error){
                // console.log("INSERT ERROR")
                // console.log(error);
                return callback && callback(error, null);
            }
            // console.log("INSERT DOCUMENT OK")
            callback && callback(null, true);
        });
    });
}

exports.getCollection = function(callback){
    exports.createCollection(callback);
}
