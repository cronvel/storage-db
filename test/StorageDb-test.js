/*
	The Cedric's Swiss Knife (CSK) - CSK Storage API abstraction

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

/* jshint unused:false */
/* global describe, it, before, after */



var StorageDb ;

if ( process.argv.length )   
{
	// We are running in Node.js
	StorageDb = require( '../lib/StorageDb.js' ) ;
	var localStorage = StorageDb.LocalStorageEmu.create( __dirname + '/localStorage' ) ;
}
else
{
	// We are running in a browser
	//console.log( 'Running browser version' ) ;
	StorageDb = require( '../lib/browser.js' ) ;
	
	// Browser's test need this...
	var localStorage = window.localStorage ;
}



var expect = require( 'expect.js' ) ;



function clearStorage()
{
	localStorage.clear() ;
}



describe( "Basic localStorage/localStorageEmu features" , function() {
	
	beforeEach( clearStorage ) ;
	
	it( "at the begining, 'length' should be 0" , function() {
		expect( localStorage.length ).to.be( 0 ) ;
	} ) ;
	
	it( "'getItem' on an unexistant key should return null" , function() {
		expect( localStorage.getItem( 'unexistant' ) ).to.be( null ) ;
	} ) ;
	
	it( "'setItem' and 'getItem' on the same key should retrieve the value" , function() {
		localStorage.setItem( 'key' , 'value' ) ;
		expect( localStorage.getItem( 'key' ) ).to.be( 'value' ) ;
		expect( localStorage.length ).to.be( 1 ) ;
	} ) ;
	
	it( "'setItem' and 'getItem' on the same key with bad value type" , function() {
		localStorage.setItem( 'key1' , [ 'bob' ] ) ;
		expect( localStorage.getItem( 'key1' ) ).to.be( 'bob' ) ;
		
		localStorage.setItem( 'key2' , 5 ) ;
		expect( localStorage.getItem( 'key2' ) ).to.be( '5' ) ;
		
		localStorage.setItem( 'key3' , null ) ;
		expect( localStorage.getItem( 'key3' ) ).to.be( 'null' ) ;
		
		localStorage.setItem( 'key3' , null ) ;
		expect( localStorage.getItem( 'key3' ) ).to.be( 'null' ) ;
		
		localStorage.setItem( 'key4' , undefined ) ;
		expect( localStorage.getItem( 'key4' ) ).to.be( 'undefined' ) ;
		
		localStorage.setItem( 'key5' , true ) ;
		expect( localStorage.getItem( 'key5' ) ).to.be( 'true' ) ;
		
		localStorage.setItem( 'key6' , { a: 5 } ) ;
		expect( localStorage.getItem( 'key6' ) ).to.be( '[object Object]' ) ;
		
		expect( localStorage.length ).to.be( 6 ) ;
	} ) ;
	
	it( "'removeItem' on an unexisting key" , function() {
		localStorage.removeItem( 'unexistant' ) ;
	} ) ;
	
	it( "'removeItem' on an existing key should delete the key" , function() {
		localStorage.setItem( 'key' , 'value' ) ;
		expect( localStorage.getItem( 'key' ) ).to.be( 'value' ) ;
		expect( localStorage.length ).to.be( 1 ) ;
		
		localStorage.removeItem( 'key' ) ;
		expect( localStorage.getItem( 'key' ) ).to.be( null ) ;
		expect( localStorage.length ).to.be( 0 ) ;
	} ) ;
	
	it( "'clear' should delete all keys" , function() {
		localStorage.setItem( 'key' , 'value' ) ;
		localStorage.setItem( 'key2' , 'value2' ) ;
		expect( localStorage.getItem( 'key' ) ).to.be( 'value' ) ;
		expect( localStorage.getItem( 'key2' ) ).to.be( 'value2' ) ;
		expect( localStorage.length ).to.be( 2 ) ;
		
		localStorage.clear() ;
		expect( localStorage.getItem( 'key' ) ).to.be( null ) ;
		expect( localStorage.getItem( 'key2' ) ).to.be( null ) ;
		expect( localStorage.length ).to.be( 0 ) ;
	} ) ;
	
	it( "'key' should return the Nth key" , function() {
		localStorage.setItem( 'some' , 'key' ) ;
		localStorage.setItem( 'someOther' , 'key' ) ;
		localStorage.setItem( 'a' , 'key' ) ;
		expect( localStorage.key( 0 ) ).to.be( 'a' ) ;
		expect( localStorage.key( 1 ) ).to.be( 'some' ) ;
		expect( localStorage.key( 2 ) ).to.be( 'someOther' ) ;
	} ) ;
	
} ) ;



describe( "Basic StorageDb features" , function() {
	
	beforeEach( clearStorage ) ;
	
	it( "Create a new database, a collection, and use it" , function() {
		var db , pref ;
		
		db = StorageDb.create( localStorage , 'my-app' ) ;
		pref = db.createCollection( 'pref' ) ;
		pref.set( 'theme' , { header: 'red' , background: 'cyan' } ) ;
		pref.set( 'bindings' , { delete: 'CTRL-D' , new: 'CTRL-N' } ) ;
		
		expect( pref.get( 'unexistant' ) ).to.eql( undefined ) ;
		expect( pref.get( 'theme' ) ).to.eql( { header: 'red' , background: 'cyan' } ) ;
		expect( pref.get( 'bindings' ) ).to.eql( { delete: 'CTRL-D' , new: 'CTRL-N' } ) ;
		
		pref.delete( 'bindings' ) ;
		expect( pref.get( 'bindings' ) ).to.eql( undefined ) ;
	} ) ;
	
	it( "Should be able to retrieve from another session" , function() {
		var db ;
		
		db = StorageDb.create( localStorage , 'my-app' ) ;
		db.createCollection( 'pref' ) ;
		db.createCollection( 'login' ) ;
		db.collections.pref.set( 'theme' , { header: 'red' , background: 'cyan' } ) ;
		db.collections.pref.set( 'bindings' , { delete: 'CTRL-D' , new: 'CTRL-N' } ) ;
		db.collections.login.set( 'bob' , { login: 'bob' , password: 'god' } ) ;
		
		// Restart a new session...
		
		db = StorageDb.create( localStorage , 'my-app' ) ;
		
		// Should retrieve existing collections
		expect( db.collections ).to.only.have.keys( 'pref' , 'login' ) ;
		
		expect( db.collections.pref.get( 'unexistant' ) ).to.eql( undefined ) ;
		expect( db.collections.pref.get( 'theme' ) ).to.eql( { header: 'red' , background: 'cyan' } ) ;
		expect( db.collections.pref.get( 'bindings' ) ).to.eql( { delete: 'CTRL-D' , new: 'CTRL-N' } ) ;
		expect( db.collections.login.get( 'bob' ) ).to.eql( { login: 'bob' , password: 'god' } ) ;
		
		// Should be cached
		expect( db.collections.pref.get( 'bindings' ) ).to.eql( { delete: 'CTRL-D' , new: 'CTRL-N' } ) ;
	} ) ;
} ) ;


