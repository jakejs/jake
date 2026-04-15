'use strict'; /*jslint node:true*//*global jake:false*/
var util = require('util');
var E = module.exports = function(level, args){
    if (!E.is(level))
        return;
    if (!E.is(L.DEBUG))
        console[level<=L.WARN ? 'error' : 'log'].apply(console, args);
    else {
        // console is hardly buffered, write to stdio directly in debug mode
        var output = '';
        for (var i=0; i<args.length; i++){
            output += (i ? ' ' : '')+(typeof args[i]=='string' ?
                args[i] : util.inspect(args[i]));
        }
        process[level<=L.WARN ? 'stderr' : 'stdout'].write(output+'\n');
    }
};
E.set_level = function(l){
    var opts = jake && jake.program ? jake.program.opts : {};
    E.level = l!==undefined ? l : opts.quiet ? 0 :
        'verbose' in opts ? parseInt(opts.verbose) : L.LOG;
};
E.is = function(level){
    if (E.level===undefined)
        E.set_level();
    return level<=E.level;
};
var L = E.L = {ERR: 1, ERROR: 1, WARN: 2, LOG: 3, INFO: 4, DEBUG: 5, TRACE: 6};
Object.keys(L).forEach(function(l){
    var level = L[l];
    E[l.toLowerCase()] = function(){ return E(level, arguments); };
});