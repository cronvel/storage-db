Get: unexistant document
Get: document cached
Get: document cached
Get: unexistant document
db: { collections: [ 'pref', 'login' ] }
Get: unexistant document
Get: document not cached
Get: document not cached
Get: document not cached
Get: document cached
# TOC
   - [Basic localStorage/localStorageEmu features](#basic-localstoragelocalstorageemu-features)
   - [Basic StorageDb features](#basic-storagedb-features)
<a name=""></a>
 
<a name="basic-localstoragelocalstorageemu-features"></a>
# Basic localStorage/localStorageEmu features
at the begining, 'length' should be 0.

```js
expect( localStorage.length ).to.be( 0 ) ;
```

'getItem' on an unexistant key should return null.

```js
expect( localStorage.getItem( 'unexistant' ) ).to.be( null ) ;
```

'setItem' and 'getItem' on the same key should retrieve the value.

```js
localStorage.setItem( 'key' , 'value' ) ;
expect( localStorage.getItem( 'key' ) ).to.be( 'value' ) ;
expect( localStorage.length ).to.be( 1 ) ;
```

'setItem' and 'getItem' on the same key with bad value type.

```js
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
```

'removeItem' on an unexisting key.

```js
localStorage.removeItem( 'unexistant' ) ;
```

'removeItem' on an existing key should delete the key.

```js
localStorage.setItem( 'key' , 'value' ) ;
expect( localStorage.getItem( 'key' ) ).to.be( 'value' ) ;
expect( localStorage.length ).to.be( 1 ) ;

localStorage.removeItem( 'key' ) ;
expect( localStorage.getItem( 'key' ) ).to.be( null ) ;
expect( localStorage.length ).to.be( 0 ) ;
```

'clear' should delete all keys.

```js
localStorage.setItem( 'key' , 'value' ) ;
localStorage.setItem( 'key2' , 'value2' ) ;
expect( localStorage.getItem( 'key' ) ).to.be( 'value' ) ;
expect( localStorage.getItem( 'key2' ) ).to.be( 'value2' ) ;
expect( localStorage.length ).to.be( 2 ) ;

localStorage.clear() ;
expect( localStorage.getItem( 'key' ) ).to.be( null ) ;
expect( localStorage.getItem( 'key2' ) ).to.be( null ) ;
expect( localStorage.length ).to.be( 0 ) ;
```

'key' should return the Nth key.

```js
localStorage.setItem( 'some' , 'key' ) ;
localStorage.setItem( 'someOther' , 'key' ) ;
localStorage.setItem( 'a' , 'key' ) ;
expect( localStorage.key( 0 ) ).to.be( 'a' ) ;
expect( localStorage.key( 1 ) ).to.be( 'some' ) ;
expect( localStorage.key( 2 ) ).to.be( 'someOther' ) ;
```

<a name="basic-storagedb-features"></a>
# Basic StorageDb features
Create a new database, a collection, and use it.

```js
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
```

Should be able to retrieve from another session.

```js
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
```

