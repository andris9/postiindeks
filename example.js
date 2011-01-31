var zip = require("./zip"),
    tools = require("./tools");

function findZip(addr_str) {
    
    var resp_obj = {
        "status":"NOT FOUND"
    },
        address = {
            street: "",
            building: "",
            room: "",
            city: "",
            commune: "",
            state: "",
            zip: ""
        },
        jsonp = false;
    
    address = tools.parseAddress(addr_str);
    resp_obj.request = addr_str;
    
    if(!address.street){
        resp_obj.status = "INVALID ADDRESS";
        go(resp_obj, jsonp);
        return;
    }
    
    zip.getZip(address, function(error, zip, address){
        if(error){
            console.log("ERROR");
            resp_obj.status = "ERROR";
            resp_obj.message = error.message;
            go(resp_obj, jsonp);
            return;
        }
        if(!zip){
            resp_obj.status = "NOT FOUND";
            go(resp_obj, jsonp);
            return;
        }
        resp_obj.status = "FOUND";
        resp_obj.zip = zip;
        resp_obj.address = address;
        resp_obj.formatted = tools.formatAddress(address);
        go(resp_obj, jsonp, 200);
        return;
    });
};

function go(data, jsonp, code){
    var output = JSON.stringify(data, null, "    ");
    if(jsonp)
        output = jsonp+"("+output+")";
    console.log(output);
    process.exit();
}

findZip("Estonia puiestee 13, Tallinn");