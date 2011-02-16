

var zip = require("./zip");

zip.findZipByAddressStr("Estonia puiestee 13, Tallinn", function(error, data){
    if(error || !data){
        // error occured
        console.log("Error: " + (error && error.message || "?"));
    }else{
        // match received
        console.log(data);
    }
    // db connection is still up, force close
    process.exit();
});