(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.StorageDb = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
	Copyright (c) 2016 Cédric Ronvel 
	
	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



// Load modules
var StorageDb = require( './StorageDb.js' ) ;



function Collection() { throw new Error( 'Use Collection.create() instead.' ) ; }
module.exports = Collection ;



Collection.create = function create( storageDb , collectionName )
{
	if ( ! StorageDb.checkKey( collectionName ) ) { throw new Error( 'Invalid collection name: ' + collectionName ) ; }
	
	var collection = Object.create( Collection.prototype , {
		storageDb: { value: storageDb , enumerable: true } ,
		storage: { value: storageDb.storage , enumerable: true } ,
		name: { value: collectionName , enumerable: true } ,
		prefix: { value: storageDb.prefix + StorageDb.keyDelimiter + collectionName , enumerable: true } ,
		documents: { value: {} , enumerable: true } ,
		cacheLoaded: { value: false , writable: true , enumerable: true }
	} ) ;
	
	if ( ! collection.loadMeta() )
	{
		// So save the freshly created db
		collection.saveMeta() ;
	}
	
	return collection ;
} ;



Collection.prototype.loadMeta = function loadMeta()
{
	var collection , i , iMax ;
	
	collection = this.storage.getItem( this.prefix ) ;
	
	if ( ! collection ) { return false ; }
	
	try {
		collection = JSON.parse( collection ) ;
	}
	catch ( error ) {
		return false ;
	}
	
	for ( i = 0 , iMax = collection.documentKeys.length ; i < iMax ; i ++ )
	{
		this.documents[ collection.documentKeys[ i ] ] = undefined ;
	}
	
	if ( this.storageDb.autoCacheCount )
	{
		this.asyncCacheLoad( collection.documentKeys ) ;
	}
	
	return true ;
} ;



Collection.prototype.saveMeta = function saveMeta()
{
	this.storage.setItem( this.prefix , JSON.stringify( {
		documentKeys: Object.keys( this.documents )
	} ) ) ;
} ;



Collection.prototype.get = function get( id )
{
	var realKey , doc ;
	
	// The document DO NOT EXIST
	if ( ! ( id in this.documents ) )
	{
		//console.log( 'Get: unexistant document' ) ;
		return undefined ;
	}
	
	// The document exist and is loaded/cached
	if ( this.documents[ id ] !== undefined )
	{
		//console.log( 'Get: document cached' ) ;
		this.storageDb.cacheHit ++ ;
		return this.documents[ id ] ;
	}
	
	// The document exist but is not loaded/cached
	//console.log( 'Get: document not cached' ) ;
	this.storageDb.cacheMiss ++ ;
	
	realKey = this.prefix + StorageDb.keyDelimiter + id ;
	
	doc = this.storage.getItem( realKey ) ;
	
	if ( doc === null ) { return undefined ; }
	
	try {
		doc = JSON.parse( doc ) ;
	}
	catch ( error ) {
		// Bad format, drop it
		this.storage.removeItem( realKey ) ;
		return undefined ;
	}
	
	// Cache it now!
	this.documents[ id ] = doc ;
	
	return doc ;
} ;



Collection.prototype.set = function set( id , doc , dontSaveMeta )
{
	var realKey ;
	
	realKey = this.prefix + StorageDb.keyDelimiter + id ;
	
	// Cache it now!
	this.documents[ id ] = doc ;
	
	// Do not try/catch, should be try/catched in the caller code
	this.storage.setItem( realKey , JSON.stringify( doc ) ) ;
	
	// Save the collection meta-data
	if ( ! dontSaveMeta ) { this.saveMeta() ; }
} ;



Collection.prototype.delete = function delete_( id , dontSaveMeta )
{
	var realKey ;
	
	// The document DO NOT EXIST: nothing to do
	if ( ! ( id in this.documents ) )
	{
		//console.log( 'Delete: unexistant document' ) ;
		return ;
	}
	
	realKey = this.prefix + StorageDb.keyDelimiter + id ;
	
	delete this.documents[ id ] ;
	
	// Do not try/catch, should be try/catched in the caller code
	this.storage.removeItem( realKey ) ;
	
	// Save the collection meta-data
	if ( ! dontSaveMeta ) { this.saveMeta() ; }
} ;



// Drop a collection
Collection.prototype.drop = function drop( dontSaveMeta )
{
	var keys , i , iMax ;
	
	keys = Object.keys( this.documents ) ;
	
	for ( i = 0 , iMax = keys.length ; i < iMax ; i ++ )
	{
		this.delete( keys[ i ] , true ) ;
	}
	
	this.storage.removeItem( this.prefix ) ;
	delete this.storageDb.collections[ this.name ] ;
	if ( ! dontSaveMeta ) { this.storageDb.saveMeta() ; }
} ;



Collection.prototype.asyncCacheLoad = function asyncCacheLoad( documentKeys )
{
	var i , iMax , id , realKey , doc , count , maxCount = this.storageDb.autoCacheCount ;
	
	//console.log( '>>> asyncCacheLoad' ) ;
	
	
	// Cache at most autoCacheCount doc
	for ( i = 0 , count = 0 , iMax = documentKeys.length ; i < iMax && count < maxCount ; i ++ )
	{
		id = documentKeys[ i ] ;
		if ( this.documents[ id ] !== undefined ) { continue ; }
		
		realKey = this.prefix + StorageDb.keyDelimiter + id ;
		
		doc = this.storage.getItem( realKey ) ;
		
		if ( doc !== null )
		{
			try {
				doc = JSON.parse( doc ) ;
				// Cache it now!
				this.documents[ id ] = doc ;
			}
			catch ( error ) {
				// Bad format, drop it
				this.storage.removeItem( realKey ) ;
			}
		}
		
		count ++ ;
	}
	
	
	documentKeys = documentKeys.slice( i , documentKeys.length ) ;
	
	if ( ! documentKeys.length )
	{
		this.cacheLoaded = true ;
		return ;
	}
	
	// Let breath the event loop
	setTimeout( this.asyncCacheLoad.bind( this , documentKeys ) , 0 ) ;
} ;



},{"./StorageDb.js":2}],2:[function(require,module,exports){
/*
	Copyright (c) 2016 Cédric Ronvel
	
	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



function StorageDb() { throw new Error( 'Use StorageDb.create() instead.' ) ; }
module.exports = StorageDb ;

var Collection = require( './Collection.js' ) ;
StorageDb.Collection = Collection ;

// StorageDb.isBrowser cannot be set at that time, so we use a getter to delay the check
Object.defineProperty( StorageDb , 'LocalStorageEmu' , {
	configurable: true ,
	get: function() {
		if ( StorageDb.isBrowser ) { return null ; }
		Object.defineProperty( StorageDb , 'LocalStorageEmu' , { value: require( './LocalStorageEmu.js' ) } ) ;
		return StorageDb.LocalStorageEmu ;
	}
} ) ;



StorageDb.keyDelimiter = ';' ;	// candidate: :,;/|\^#



StorageDb.create = function create( storage , dbName , autoCacheCount )
{
	if ( ! StorageDb.checkKey( dbName ) ) { throw new Error( 'Invalid DB name: ' + dbName ) ; }
	
	if ( autoCacheCount === true ) { autoCacheCount = 10 ; }
	
	var storageDb = Object.create( StorageDb.prototype , {
		storage: { value: storage , enumerable: true } ,
		name: { value: dbName , enumerable: true } ,
		prefix: { value: StorageDb.keyDelimiter + dbName , enumerable: true } ,
		collections: { value: {} , enumerable: true } ,
		autoCacheCount: { value: autoCacheCount , writable: true , enumerable: true } ,
		cacheHit: { value: 0 , writable: true , enumerable: true } ,
		cacheMiss: { value: 0 , writable: true , enumerable: true }
	} ) ;
	
	if ( ! storageDb.loadMeta() )
	{
		// So save the freshly created db
		storageDb.saveMeta() ;
	}
	
	return storageDb ;
} ;



// Verify a key is legit
StorageDb.checkKey = function checkKey( key )
{
	return key && typeof key === 'string' && key.indexOf( StorageDb.keyDelimiter ) === -1 ;
} ;



/*	Does not works with localStorageEmu, and is not usefull anyway
StorageDb.prototype.keys = function keys()
{
	var prefix = this.prefix ;
	
	return Object.keys( this.storage ).filter( function( e ) {
		e.startWith( prefix ) ;
	} ) ;
} ;
*/



StorageDb.prototype.loadMeta = function loadMeta()
{
	var db , i , iMax ;
	
	db = this.storage.getItem( this.prefix ) ;
	
	if ( ! db ) { return false ; }
	
	try {
		db = JSON.parse( db ) ;
	}
	catch ( error ) {
		return false ;
	}
	
	//console.log( 'db:' , db ) ;
	
	for ( i = 0 , iMax = db.collections.length ; i < iMax ; i ++ )
	{
		this.createCollection( db.collections[ i ] ) ;
	}
	
	return true ;
} ;



StorageDb.prototype.saveMeta = function saveMeta()
{
	// Do not try/catch
	this.storage.setItem( this.prefix , JSON.stringify( {
		collections: Object.keys( this.collections )
	} ) ) ;
} ;



StorageDb.prototype.createCollection = function createCollection( collectionName )
{
	if ( ! StorageDb.checkKey( collectionName ) ) { throw new Error( 'Invalid collection name: ' + collectionName ) ; }
	
	if ( this.collections[ collectionName ] ) { return this.collections[ collectionName ] ; }
	
	this.collections[ collectionName ] = Collection.create( this , collectionName ) ;
	this.saveMeta() ;
	
	return this.collections[ collectionName ] ;
} ;



// Drop a collection
StorageDb.prototype.drop = function drop()
{
	var keys , i , iMax ;
	
	keys = Object.keys( this.collections ) ;
	
	for ( i = 0 , iMax = keys.length ; i < iMax ; i ++ )
	{
		this.collections[ keys[ i ] ].drop( true ) ;
	}
	
	this.storage.removeItem( this.prefix ) ;
	
	// /!\ Should destroy the object furthermore /!\
} ;



},{"./Collection.js":1,"./LocalStorageEmu.js":undefined}],3:[function(require,module,exports){
/*
	Copyright (c) 2016 Cédric Ronvel 
	
	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



module.exports = require( './StorageDb.js' ) ;
module.exports.isBrowser = true ;

},{"./StorageDb.js":2}]},{},[3])(3)
});