Postiindeksid
=============

Antud teek võimaldab node.js abil leida Eesti postiindekseid. Antud teek on vabavara (GPLv2) ning ei ole Eesti Postig AS'iga seotud mitte mingil viisil. Samuti ei ole kaasas lähteandmeid - tegu on vaid teegiga, mis lähteandmete olemsolu korral suudab nendest aadressi alusel õige indeksi välja otsida.

Eeldused
--------

Vaja on 

  * [node.js](http://nodejs.org/), vähemalt versioon 0.3
  * [MongoDB](http://www.mongodb.org/) andmebaasi
  * [MongoDB draiverit](https://github.com/christkv/node-mongodb-native) node.js jaoks
  * [CSV teeki](https://github.com/wdavidw/node-csv-parser) importimise jaoks 

Lähteandmed
-----------

Lähteandmed ei ole avalikud ja seega ei saa neid siia välja panna. Kuid need andmed saab alla laadida [Eesti Posti kodulehelt](http://www.post.ee/ariklient_sihtnumbrid_allalaadimiseks). Tutvu kindlasti ka andmete [kasutamise tingimustega](http://www.post.ee/?id=4676). 

Algset CSV faili siiski kohe kasutada ei saa, see tuleb kõigepealt ümber vormistada. 

  1. Ava fail OpenOffice'iga
  2. Veendu, et kõik tundub korras olevat
  3. Salvesta "Save as" ja vali formaadiks CSV ja nimeks "base.csv"
  4. Avanenud valikutes määra märgistikus UTF-8, väljade eraldajaks koma ning teksti eraldajaks jutumärgid
  5. Kopeeri salvestatud CSV fail samasse skriptifailide kausta
  
Lähteandmete importimiseks CSV failist tuleb käivitada impordikäsk

    node import.js
    
Kui see lõpeb teatega "All ready" ning ühtegi viga ei esinenud, ongi asi töövalmis.

Kasutamine
----------

Kui andmed on imporditud, saab kasutada zip teeki indeksite leidmiseks. Näiteskripti alusel saab täpsemalt näha kuidas see käib.

Näiteskripti käivitamiseks

    node example.js
    
Juhul kui tuli ette info tulemusega, on kõik OK

API
---

Postiindeksite leidmiseks tuleb laadida teek "zip"

    var ziplib = require("./zip"); // mitte kataloog, vaid failinimi, ilma .js laiendita!

Teegi abil indeksite leidmine käib meetoditega `getZip` ning `findZipByAddressStr` - esimene võtab sisendiks struktureeritud aadressiobjekti ning teine aadressi vabatekstina.

    var aadress = "Lossi plats 1, Tallinn";
    ziplib.findZipByAddressStr(aadress, function(error, data){
        // error sisaldab veaobjekti, kui ilmnes viga
        // data sisaldab vastusobjekti, data.zip on indeks
        // kui data.status == "FOUND" siis on OK, vastasel korral mitte
    });
    
Aadressiobjekti korral aga

    var aadress = {
        street: "Lossi plats",
        building: "1",
        room: "",
        city: "Tallinn",
        commune: "",
        state:""
    }
    
    ziplib.getZip(aadress, function(error, zip, aadress){
        // error - sisaldab veaobjekti
        // zip - on postiindeks
        // aadress - on töödeldud aadressiobjekt (lisatud maakond kui pole jne)
    });
    
Litsents
--------

GNU General Public License (GPL) Version 2 http://www.gnu.org/licenses/gpl-2.0.html