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



// Load modules
var StorageDb = require( './StorageDb.js' ) ;



function Collection() { throw new Error( 'Use Collection.create() instead.' ) ; }



Collection.create = function create( storageDb , collectionName )
{
	if ( ! StorageDb.checkKey( collectionName ) ) { throw new Error( 'Invalid collection name: ' + collectionName ) ; }
	
	var collection = Object.create( Collection.prototype , {
		storageDb: { value: storageDb , enumerable: true } ,
		storage: { value: storageDb.storage , enumerable: true } ,
		name: { value: collectionName , enumerable: true } ,
		prefix: { value: storageDb.prefix + StorageDb.keyDelimiter + collectionName , enumerable: true } ,
		documents: { value: {} , enumerable: true }
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
		console.log( 'Get: unexistant document' ) ;
		return undefined ;
	}
	
	// The document exist and is loaded/cached
	if ( this.documents[ id ] !== undefined )
	{
		console.log( 'Get: document cached' ) ;
		return this.documents[ id ] ;
	}
	
	// The document exist but is not loaded/cached
	console.log( 'Get: document not cached' ) ;
	
	realKey = this.prefix + StorageDb.keyDelimiter + id ;
	
	doc = this.storage.getItem( realKey ) ;
	
	if ( ! doc ) { return undefined ; }
	
	try {
		doc = JSON.parse( doc ) ;
	}
	catch ( error ) {
		// Bad format, drop it
		this.storage.removeItem( realKey ) ;
		return undefined ;
	}
	
	return doc ;
} ;



Collection.prototype.set = function set( id , doc , dontSaveMeta )
{
	var realKey ;
	
	realKey = this.prefix + StorageDb.keyDelimiter + id ;
	
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
		console.log( 'Delete: unexistant document' ) ;
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



