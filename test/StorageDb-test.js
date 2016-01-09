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
}



var expect = require( 'expect.js' ) ;



describe( "..." , function() {
	
	
	it( "..." , function() {
		var db , pref ;
		
		return ;
		db = StorageDb.create( localStorage , 'zenparc' ) ;
		
		/*
		pref = db.createCollection( 'pref' ) ;
		pref.set( 'theme' , { header: 'red' , background: 'cyan' } ) ;
		//*/
		
		pref = db.collections.pref ;
		console.log( 'pref:' , pref.get( 'theme' ) ) ;
		
	} ) ;
} ) ;


