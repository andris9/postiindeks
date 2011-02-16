var tools = require("./tools"),
    db = require('./db');

exports.findZipByAddressStr = function(addr_str, callback) {
    
    var resp_obj = {}, address = {};
    
    address = tools.parseAddress(addr_str);
    resp_obj.request = addr_str;
    resp_obj.address = address;
    
    if(!address.street){
        resp_obj.status = "INVALID ADDRESS";
        return callback(new Error(resp_obj.status), resp_obj);
        return;
    }
    
    exports.getZip(address, function(error, zip, address){
        if(error){
            resp_obj.status = "ERROR";
            resp_obj.message = error.message;
            return callback(new Error(resp_obj.status), resp_obj);
        }
        if(!zip){
            resp_obj.status = "NOT FOUND";
            return callback(new Error(resp_obj.status), resp_obj);
        }
        resp_obj.status = "FOUND";
        resp_obj.zip = zip;
        resp_obj.formatted = tools.formatAddress(address);
        return callback(null, resp_obj);
    });
    
};

exports.getZip = function(addr_obj, callback){
    var //addr_obj = tools.parseAddress(addr_str), 
        address = tools.normalizeAddress(addr_obj),
        request = {};
    
    if(address.commune){
        request.commune = address.commune;
    }

    if(address.city){
        request.city = address.city;
    }

    if(address.street && address.city){
        request["$or"] = [{street: address.street}, {street:""}];
    }
    
    if(address.state){
        request.state = address.state;
    }

    if(address.building){
        request.start = {$lte: address.building_normalized};
        request.end = {$gte: address.building_normalized};
    }
    
    if(!address.city){
        sent = true;
        return callback(null, null);
    }
    
    db.getCollection(function(error, collection){
        if(error)throw error;
        collection.find(request, {limit: 5, sort:'street'}, function(error, cursor){
            var sent = false, ret_addr, last, doc;
            cursor.each(function(error, doc) {
                if(sent)return;
                
                if(error){
                    sent = true;
                    return callback(error, null);
                }
                
                if(!doc && last){
                    setup();
                }
                
                // esimene peaks olema street="" kui tegu "kõik aadressid" kohaga
                
                if(!doc || (doc.street && doc.street!=address.street)){
                    sent = true;
                    return callback(null, null);
                }
                
                if(!doc.side || doc.side == address.street_side){
                    last = doc;
                    setup();
                }else{
                    last = doc;
                }
            });
            
            function setup(){
                sent = true;
                
                ret_addr = {
                        street: tools.firstCase(last.street || address.street || "").replace(/\s(\w\.|Mnt|Pst|Tee|Väljak|Plats)\s*/g,function(o){
                        return o.toLowerCase();
                    }),
                    building: tools.firstCase(address.building),
                    room: tools.firstCase(address.room),
                    city: tools.firstCase(last.city).replace(/\s(Küla|Vald)\s*/g,function(o){
                        return o.toLowerCase();
                    }),
                    commune: (last.commune?tools.firstCase(last.commune)+" vald":""),
                    state: last.state?tools.firstCase(last.state+"maa"):"",
                    zip: last.zip,
                    type: last.type
                }
                
                if(last.name){
                    ret_addr.name = last.name;
                }
                
                callback(null, last.zip, ret_addr);
            }
        });
    });
}