var csvlib = require("csv"),
    fs = require("fs"),
    tools = require("./tools"),
    db = require('./db');

var dbcount = 0, fready =  false;

function parse(filename){
    
    var parser = csvlib();
    parser.fromPath(filename);

    parser.transform(function(data){
        if(data[3]=="Kõik"){
            data[3] = "";
        }
        data[5] = tools.normalize(data[5]);
        data[6] = tools.normalize(data[6]) || 9999;
        data[7] = Number(data[7]);
        
        return data;
    });

    parser.on('end',function(count){
        console.log('Number of lines loaded from CSV: '+c);
        console.log("Proceeding with adding rows to DB...");
        fready = true;
    });

    parser.on('error',function(error){
        console.log(error.message);
        process.exit(1);
    });
    
    
    parser.on('data',function(data,index){
        if(!index)return;
        insert(data);
    });
}

var c = 0;
function insert(data){
    var name = "", street = data[3], side = 0;
    
    // 1: even, -1: odd, 0: both
    if(data[5] && /*data[6]!=9999 &&*/ data[5] != data[6]){
        side = Math.floor(data[5] || data[6]) % 2 ? -1:1;
    }
    
    street = street.replace(/\((.*)\)/, function(o,n){
        name = n && n.trim() || "";
        return "";
    }).trim();
    
    var doc = {
        "state":   data[0].toLowerCase(),
        "commune": data[1].toLowerCase(),
        "city":    data[2].toLowerCase(),
        "street":  street.toLowerCase(),
        "name":   name,
        "type": data[4].toLowerCase(),
        "start": data[5],
        "end": data[6],
        "side": side,
        "zip": data[7]
    }
    dbcount++;
    db.save(doc, function(){
        dbcount--;
        if(!dbcount && fready){
            console.log("All rows inserted, creating indexes...");
            db.getCollection(function(error, collection){
                collection.createIndex([['street', 1]], function(){
                    collection.createIndex([['city',1]], function(){
                        collection.createIndex([['state',1]], function(){
                            collection.createIndex([['commune',1]], function(){
                                collection.createIndex([['building',1]], function(){
                                    console.log("All Ready");
                                    process.exit();
                                });
                            });
                        });
                    });    
                });
            });
            
        }
    });
    c++;
    //console.log(++c + " -> " +JSON.stringify(doc));
    
}

db.initCollection(function(error, collection){
    if(error)throw error;
    console.log("Importing rows from CSV...");
    parse(__dirname+'/base.csv');
    //db.save({test:true})
});

//parse(__dirname+'/base.csv');   