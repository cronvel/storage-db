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



/*
	This emulate the browser 'localStorage': https://developer.mozilla.org/en-US/docs/Web/API/Storage
	Useful for testing things in Node.js.
	
	The Storage API:
	Storage.length: an integer representing the number of data items stored in the Storage object.
	Storage.key( N ): When passed a number N, this method will return the name of the Nth key in the storage.
	Storage.getItem( key ): When passed a key name, will return that key's value.
	Storage.setItem( key , value ): When passed a key name and value, will add/update that key to the storage
	Storage.removeItem( key ): When passed a key name, will remove that key from the storage.
	Storage.clear(): When invoked, will empty all keys out of the storage. 
*/



// Load modules
var fs = require( 'fs' ) ;
var fsKit = require( 'fs-kit' ) ;



function LocalStorageEmu() { throw new Error( 'Use LocalStorageEmu.create() instead.' ) ; }
module.exports = LocalStorageEmu ;



LocalStorageEmu.create = function create( path )
{
	if ( path[ path.length - 1 ] !== '/' ) { path += '/' ; }
	
	var storage = Object.create( LocalStorageEmu.prototype , {
		path: { value: path , enumerable: true , writable: true } ,
	} ) ;
	
	fsKit.ensurePathSync( this.path , 0777 ) ;
	
	return storage ;
} ;



LocalStorageEmu.prototype.key = function key()
{
	throw new Error( 'Not coded ATM' ) ;
} ;



LocalStorageEmu.prototype.getItem = function getItem( key )
{
	try {
		return fs.readFileSync( this.path + key , 'utf8' ) ;
	}
	catch ( error ) {
		return null ;
	}
} ;



LocalStorageEmu.prototype.setItem = function setItem( key , value )
{
	fs.writeFileSync( this.path + key , value , 'utf8' ) ;
} ;



LocalStorageEmu.prototype.removeItem = function removeItem( key )
{
	try {
		fs.unlinkSync( this.path + key ) ;
	}
	catch ( error ) {
	}
} ;



LocalStorageEmu.prototype.clear = function clear()
{
	try {
		fsKit.deltreeSync( this.path ) ;
		fsKit.ensurePathSync( this.path , 0777 ) ;
	}
	catch ( error ) {
	}
} ;



