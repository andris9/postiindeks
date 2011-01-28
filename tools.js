

exports.normalize = function(nr){
    var jrts = "abcdefghijklmonpqrstuvwxyz";
    return parseFloat(nr && String(nr).trim().replace(/\D.*/, function(c){
        var str = c.replace(/\D/g, function(d){
                return jrts.indexOf(d.toLowerCase())+1 || "";
            });
        return str && "."+str || "";
    }) || 0);
}

exports.firstCase = function(str){
    return str.replace(/^\s*\w|[\-\s]\w/g,function(c){
        return c.toUpperCase()
    });
}

exports.parseStreet = function(sStreetRaw){
    var patternBuilding = /([0-9]{1,3}[A-Z]?)(-([0-9]{1,4}))?$/;
    var patternNumeric = /[0-9]/;
        if (sStreetRaw != ''){
            var ixSplit = sStreetRaw.search(patternNumeric);
        if (ixSplit != -1){
            var rsStreetRaw = [sStreetRaw.substring(0,ixSplit), sStreetRaw.substring(ixSplit)];
            var sStreet = sStreetRaw.substring(0,ixSplit);
    
            var rsBuilding = sStreetRaw.substring(ixSplit).split('-', 2);
            var sBuilding = rsBuilding[0];
            if (rsBuilding.length == 2){
                var sRoom = rsBuilding[1];
            }
            else{
                var sRoom = '';
            }
        }
    }
    else{
        var sStreet = "";
        var sBuilding = "";
        var sRoom = "";
    }
    return {sStreet: sStreet, sBuilding: sBuilding, sRoom: sRoom};
}

exports.parseAddress = function (sAddress){
    var patternZip = /^[0-9]{5}$/,
        strip = function(str){
            if(str)
                return str.trim();
            else
                return '';
        }
    
    sAddress = sAddress && sAddress.replace(/,+/,',') || "";
    
    var rsAddress = sAddress.split(',');
    if (strip(rsAddress[rsAddress.length-1]).search(patternZip) == -1)
    {
            rsAddress.push("");
    }
    
    if (rsAddress.length > 2){
            var sZip = rsAddress[rsAddress.length-1];
        var sStreetRaw = strip(rsAddress[0]);

        if (rsAddress.length == 3){
            var sCity = strip(rsAddress[1]);
            var sState = "";
            var sMunicipality = "";
        }
        else{

                if (rsAddress.length == 4)
            {
                var sCity = '';
            }
            else
            {
                var sCity = strip(rsAddress[rsAddress.length-4]);
            }
            var sState = rsAddress[rsAddress.length-2];
            var sMunicipality = rsAddress[rsAddress.length-3];
        }
        sStreetRaw = sStreetRaw.replace('- ', '-');
        var oParsedStreet = exports.parseStreet(sStreetRaw);
        sStreet = oParsedStreet.sStreet;
        sBuilding = oParsedStreet.sBuilding;
        sRoom = oParsedStreet.sRoom;
    }
    else{
        sStreet = rsAddress[0];
        sBuilding = "";
        sRoom = "";
        sCity = "";
        sState = "";
        sMunicipality = "";
        sZip = "";
    }
    
    return {
        street: strip(sStreet),
        building: strip(sBuilding),
        room: strip(sRoom),
        city: strip(sCity),
        commune: strip(sMunicipality),
        state: strip(sState),
        zip: strip(sZip)
    }
}

exports.normalizeAddress = function(address){
    
    if(!address.city && address.commune){
        address.city = address.commune;
        address.commune = "";
    }
    
    if(!address.commune && address.state.match(/vald$/i)){
        address.commune = address.state;
        address.state = "";
    }
    
    var output = {
        street: exports.stemStreet(address.street.toLowerCase()),
        building: address.building.toUpperCase(),
        room: address.room.toUpperCase(),
        city: exports.stemCity(address.city.toLowerCase()),
        commune: exports.stemCommune(address.commune.toLowerCase()),
        state: exports.stemState(address.state.toLowerCase()),
        zip: address.zip.toLowerCase()
    };
    
    output.building_normalized = exports.normalize(output.building);
    if(!output.building_normalized)
        output.street_side = 0;
    else
        output.street_side = Math.floor(output.building_normalized) % 2 ? -1:1;
    return output;
    
}

exports.stemStreet = function(street){
    street = street.replace(/\smaantee|\smnt\./," mnt");
    street = street.replace(/\spuiestee|\spst\./," pst");
    street = street.replace(/\stee\./," tee");
    street = street.replace(/\stn\./," ");
    street = street.replace(/\stänav\.?/," ");
    street = street.replace(/\svon\s/," v. ");
    street = street.replace(/^(\w)\s/,"$1. ");
    street = street.replace(/\s(\w)\s/," $1. ");
    street = street.replace(/\.(\w)/g,". $1");
    street = street.replace(/\s+/g," ");
    return street.trim();
}

exports.stemState = function(state){
    state = state.replace(/maa\s*$/,"");
    
    state = state.replace(/^l[\s\.\-]+/,"lääne-");
    state = state.replace(/^i[\s\.\-]+/,"ida-");
    
    return state.trim();
}

exports.formatAddress = function(address){
    var rida, read = [];
    
    if(!address)return "";
    
    rida = "";
    if(address.street)
        rida += address.street;
    if(address.building)
        rida += (rida.length?' ':'')+address.building;
    if(address.room)
        rida += (rida.length?(address.building?' - ':' '):'')+address.room; 
    if(rida.length)
        read.push(rida)

    // Küla ja valla rida
    if(address.commune){
        rida = [];
        if(address.city){
            rida.push(address.city);
        }
        rida.push(address.commune);
        read.push(rida.join(', '));
    }

    // ZIP, linn ja maakond
    rida = [];
    if(address.zip)
        rida.push(address.zip);
    if(address.city && !address.commune)
        rida.push(address.city);
    if(address.state && address.type!="linn")
        rida.push(address.state);
    if(rida.length)
        read.push(rida.join(' '));

    return read.length?read.join("\n"):'';
}

exports.stemCity = function(city){
    city = city.replace(/ küla\s*$/,"");
    city = city.replace(/ linn\s*$/,"");
    city = city.replace(/ alev\s*$/,"");
    city = city.replace(/ alevik\s*$/,"");
    
    return city.trim();
}

exports.stemCommune = function(commune){
    commune = commune.replace(/ vald\s*$/,"");
    
    return commune.trim();
}