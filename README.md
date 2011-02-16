Postiindeksid
=============

Antud teek võimaldab node.js abil leida Eesti postiindekseid.

Eeldused
--------

Vaja on 

  * [node.js](http://nodejs.org/), vähemalt versioon 0.3
  * [MongoDB](http://www.mongodb.org/) andmebaasi
  * [MongoDB draiverit](https://github.com/christkv/node-mongodb-native) node.js jaoks
  * [CSV teeki](https://github.com/wdavidw/node-csv-parser) importimise jaoks 

Lähteandmed
-----------

Lähteandmed saab näiteks [Eesti Posti lehelt](http://www.post.ee/ariklient_sihtnumbrid_allalaadimiseks). Tutvu kindlasti ka andmete [kasutamise tingimustega](http://www.post.ee/?id=4676). 

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

Teegi abil indeksite leidmine käib meetoditega `getZip` ning `findZipByAddressStr` - esimene võtab sisendiks struktureeritud aadressiobjekti nign teine aadressi vabatekstina.

    var aadress = "Lossi plats 1, Tallinn";
    ziplib.findZipByAddressStr(aadress, function(error, data){
        // error sisaldab veaobjekti, kui ilmnes viga
        // data sisaldab vastusobjekti
    });
    
Litsents
--------

Hetkel lahtine, peab mõtlema veel