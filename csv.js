var fs = require('fs'),
    sys = require('util'),
    EventEmitter = require('events').EventEmitter;

function CSVReadStream(filename, options){
    EventEmitter.call(this);
    
    options = options || {};
    
    this.filename = filename;
    this.delimiter = options.delimiter && options.delimiter.trim() || ",";
    this.enclosure = options.enclosure && options.enclosure.trim() || '"';
    this.escape = options.escape && options.escape.trim() || "\\\\";
    
    this.remainder = "";
    this.init();
}
sys.inherits(CSVReadStream, EventEmitter);

CSVReadStream.prototype.init = function(){
    this.fileReader = fs.createReadStream(this.filename);
    this.fileReader.on("error", this.onError.bind(this));
    this.fileReader.on("data", this.onData.bind(this));
    this.fileReader.on("end", this.onEnd.bind(this));
}

CSVReadStream.prototype.onError = function(error){
    this.emit("error", error);
}

CSVReadStream.prototype.onData = function(data){
    this.remainder += data.toString("utf-8"); //this.iconv.convert(data);    
    this.analyzeCSVText();
}

CSVReadStream.prototype.onEnd = function(data){
    this.onData(new Buffer(0));
    this.emit("end");
}

CSVReadStream.prototype.analyzeCSVText = function(){
    var rows = this.remainder.split("\n"), row, validLen, rowArr=[];
    
    if(rows.length == 1){ // probably last line
        row = this.parseRow(rows[0]);
        if(row)
            rowArr.push(row);
        this.remainder = "";
    }else{
        for(var i=0, len = rows.length; i<len-1; i++){
            row = this.parseRow(rows[i]);
            if(!row)continue;
            rowArr.push(row);
        }
        this.remainder = rows[len-1];
    }
    if(rowArr.length)
        this.emit("data", rowArr);
}

CSVReadStream.prototype.parseRow = function(row){
    if(!row || !row.trim())
        return false;
    
    var replace_escaped_chars = new RegExp(this.escape+"(.)","g"),
        replace_between_enclosures = new RegExp(this.enclosure+"[^"+this.enclosure+"]*?"+this.enclosure,"g"),
        replace_delimiters = new RegExp(this.delimiter,"g"),
        replace_enclosures = new RegExp("^[\\s"+this.enclosure+"]+|[\\s"+this.enclosure+"]+$","g"),
        replace_encoded = new RegExp("\u0000([0-9A-Z]{2})","g");
    
    row = row.replace(replace_escaped_chars, function(all, chr){
        return "\u0000"+chr.charCodeAt(0).toString(16).toUpperCase();
    });
    
    row = row.
        replace(/"[^"]*"/g,function(text){
            return text.replace(replace_delimiters, function(delimiter){
                return "\u0000"+delimiter.charCodeAt(0).toString(16).toUpperCase();
            });
    });
    
    var parts = row.split(this.delimiter),
        result = [],
        part;
    
    for(var i=0, len = parts.length; i<len; i++){
        part = parts[i].replace(replace_enclosures,"");
        part = part.replace(replace_encoded, function(all, chr){
            return String.fromCharCode(parseInt(chr,16));
        });
        result.push(part);
    }
    return result;
}

this.CSVReadStream = CSVReadStream;