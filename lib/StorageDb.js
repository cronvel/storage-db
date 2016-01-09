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



function StorageDb() { throw new Error( 'Use StorageDb.create() instead.' ) ; }
module.exports = StorageDb ;

if ( ! StorageDb.isBrowser ) { StorageDb.LocalStorageEmu = require( './LocalStorageEmu.js' ) ; }
var Collection = require( './Collection.js' ) ;
StorageDb.Collection = Collection ;



StorageDb.keyDelimiter = ';' ;	// candidate: :,;/|\^#



StorageDb.create = function create( storage , dbName )
{
	if ( ! StorageDb.checkKey( dbName ) ) { throw new Error( 'Invalid DB name: ' + dbName ) ; }
	
	var storageDb = Object.create( StorageDb.prototype , {
		storage: { value: storage , enumerable: true } ,
		name: { value: dbName , enumerable: true } ,
		prefix: { value: StorageDb.keyDelimiter + dbName , enumerable: true } ,
		collections: { value: {} , enumerable: true }
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
	
	console.log( 'db:' , db ) ;
	
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
	var realKey , keys , i , iMax ;
	
	keys = Object.keys( this.collections ) ;
	
	for ( i = 0 , iMax = keys.length ; i < iMax ; i ++ )
	{
		this.collections[ keys[ i ] ].drop( true ) ;
	}
	
	this.storage.removeItem( this.prefix ) ;
	
	// /!\ Should destroy the object furthermore /!\
} ;


