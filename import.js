try{
    var csvlib = require("csv");
}catch(E){
    console.log("error - csv lib not found");
    console.log("download from here - https://github.com/wdavidw/node-csv-parser");
    process.exit(1);
}

var fs = require("fs"),
    tools = require("./tools"),
    db = require('./db');

/**
 * CSVImport
 * 
 * Sisaldab importimiseks vajalikku loogikat
 **/
var CSVImport = {
    
    /**
     * CSVImport.dbcount -> number
     * 
     * Peab arvestust mitu rida on andmebaasi saadetud, aga pole veel kirjutatud
     **/
    dbcount: 0,
    
    /**
     * CSVImport.fready -> Boolean
     * 
     * Indikeerib, kas failist lugemine on juba lõppenud
     **/
    fready: false,
    
    /**
     * CSVImport.rowcount -> Number
     * 
     * Loeb kokku sisestatud read
     **/
    rowcount:0,
    
    /**
     * CSVImport.importCSV(filename) -> undefined
     * - filename (String): CSV fail, kus asuvad postiindeksid
     * 
     * Põhifunktsioon, käivitab indeksite importimise CSV failist.
     * NB! andmebaas peab selleks hetkek olema juba avatud ja tabel loodud,
     * vastasel korral tekib race condition
     **/
    importCSV: function(filename){
        
        var parser = csvlib();
        parser.fromPath(filename);

        // teisenda väljad, viiakse iga reaga läbi
        parser.transform(this.transform.bind(this));

        // CSV onend sündmus, kui read on failist loetud
        parser.on('end',(function(count){
            console.log('Number of lines loaded from CSV: '+this.rowcount);
            console.log("Proceeding with adding rows to DB...");
            this.fready = true;
        }).bind(this));

        // onerror, kui failist lugemisel või teisendamisel ilmneb viga
        parser.on('error',this.onerror.bind(this));
        
        // saabus terviklik andmerida, esimene rida (pealkirjad) jäetakse vahele
        parser.on('data',this.ondata.bind(this));
    },
    
    /**
     * CSVImport.ondata(data, index) -> undefined
     * - data (Array): massiiv rea andmetega
     * - index (Number): 0 põhine rea number
     * 
     * Võtab vastu rea andmed ning kutsub välja nende sisestamise baasi
     * juhul kui rea number on suurem kui 0 (pealkirjarida)
     **/
    ondata: function(data, index){
        if(!index)return;
        this.insert(data);        
    },
    
    /**
     * CSVImport.onerror(error) -> undefined
     * - error (Error): veaobjekt
     * 
     * Kutsutakse välja, kui faili lugemisel tekib viga. Programmi töö
     * katkestatakse
     **/
    onerror: function(error){
        console.log(error.message);
        process.exit(1);
    },
    
    /**
     * CSVImport.transform(data) -> Array
     * - data (Array): massiiv rea andmetega
     * 
     * Funktsioon võtab sisse rea andmed originaalkujul (kõik on stringid jne)
     * ning teisendab need välja haaval soovitud kujule. Näiteks majanumbrid
     * muudetakse murdarvudeks jne. Kutsutakse ellu iga rea kohta enne ondata't
     **/
    transform: function(data){
        // maakond
        data[0] = data[0].toLowerCase();
        // vald
        data[1] = data[1].toLowerCase();
        // asula
        data[2] = data[2].toLowerCase();
        // tänav, eemalda "Kõik"
        data[3] = data[3]!="Kõik"?data[3].toLowerCase():"";
        // tüüp
        data[4] = data[4].toLowerCase();
        // Algus - muuda murdarvuks
        data[5] = tools.normalize(data[5]);
        // Lõpp - muuda murdarvuks
        data[6] = tools.normalize(data[6]) || 9999;
        // Index - muuda stringist numbriks
        data[7] = Number(data[7]);
        return data;
    },
    
    /**
     * CSVImport.insert(data) -> undefined
     * - data (Array): massiiv rea andmetega
     * 
     * Koostab rea andmetest andmebaasi rea objekti ning sisestab selle baasi.
     * Samas peab arvet palju kirjeid on saadetud ja paljud neist on läbi
     * läinud. Kui kõik on tehtud, kutsutakse välja lõpetamine
     **/
    insert: function(data){
        var name = "", street = data[3], side = 0, doc;
        
        // 1: paaritud numbrid, -1: paaris numbrid, 0: mõlemad
        if(data[5] && data[5] != data[6]){
            side = Math.floor(data[5] || data[6]) % 2 ? -1:1;
        }
        
        // juhul kui tänav on kujul "Lossi plats (Riigikantselei)",
        // siis võta sulgudes olev nimi tekstist välja eraldi väljana
        street = street.replace(/\((.*)\)/, function(o,n){
            name = n && n.trim() || "";
            return "";
        }).trim();
        
        // objekt andmebaasi lisamiseks 
        doc = {
            "state":   data[0],
            "commune": data[1],
            "city":    data[2],
            "street":  street,
            "name":    name,
            "type":    data[4],
            "start":   data[5],
            "end":     data[6],
            "side":    side,
            "zip":     data[7]
        }
        
        this.dbcount++;
        this.rowcount++;
        db.save(doc, (function(){
            this.dbcount--;
            
            // juhul kui failist enam ei loeta ning dbcount on tagasi nullis,
            // siis on järelikult kõik read salvestatud
            if(!this.dbcount && this.fready){
                this.setIndexes(this.finish.bind(this));
            }
        }).bind(this));
    },
    
    /**
     * CSVImport.setIndexes(callback) -> undefined
     * - callback (Function): tagasikutsefunktsioon kui indeksid on valmis
     * 
     * Seab ükshaaval indeksid kõikidele olulistele väljadele.
     **/
    setIndexes: function(callback){
        console.log("All rows inserted, creating indexes...");
        db.getCollection(function(error, collection){
            collection.createIndex([['street', 1]], function(){
                collection.createIndex([['city',1]], function(){
                    collection.createIndex([['state',1]], function(){
                        collection.createIndex([['commune',1]], function(){
                            collection.createIndex([['building',1]], function(){
                                callback();
                            });
                        });
                    });
                });    
            });
        });
    },
    
    /**
     * CSVImport.finish() -> undefined
     * 
     * Lõpetab programmi töö
     **/
    finish: function(){
        console.log("All Ready");
        db.db_connection.close();
    }
} 
 
// MAIN
// Tagab, et baas on avatud ja õige tabel loodud
db.initCollection(function(error, collection){
    if(error)throw error;
    console.log("Hello!")
    console.log("Importing rows from CSV...");
    CSVImport.importCSV(__dirname+'/base.csv');
});
