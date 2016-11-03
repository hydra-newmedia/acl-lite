[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][download-url]

# The Permissions logic

This module allows you to grant object permissions to Roles.
You can specify a role with certain permissions by simply requiring 
the module as your `Role` class like
```
var Role = require('acl-lite');
var myRole = new Role();
```
So far this role has no permissions specified.
You can add permissions to specific object property paths by calling
`myRole.addPermission('a.b.c'); myRole.addPermission('x.y');` or by providing the constructor
with these information: `new Role(['a.b.c', 'x.y'])`

Given the above example permissions, the role now can access
the following properties:
```
myRole.hasPermission('a')       // → true
myRole.hasPermission('a.b')     // → true
myRole.hasPermission('a.b.c')   // → true
myRole.hasPermission('a.b.cc')  // → false
myRole.hasPermission('a.bb')    // → false
myRole.hasPermission('aa')      // → false
myRole.hasPermission('x')       // → true
myRole.hasPermission('x.y')     // → true
myRole.hasPermission('x.y.z')   // → true

```
This can easily be applied to an object.
So the role can access all the properties granted permission to
(via constructor or `addPermissions()`) and their parents.

To check, whether a role can all the properties of a given object
you can use the `checkObject()` method:
```
var myRole = Role(['a.b.c', 'x.y']);
var testObj = {
  a: {
    b: {
      c: 'test',
      cc: 'test'
    },
    bb: 'test'
  },
  aa: 'test',
  x: {
    y: {
      z: 'test'
    }
  }
};
myRole.checkObject(testObj);    // → 'a.b.cc' 
```
This returns the path of the first property which the role has no
permissions for. In this example the role also has no permissions
to `a.bb` and `aa`. (Note: `x.y.z` is alright as the role is 
granted permission to its parent `x.y`!)


[npm-url]: https://npmjs.org/package/acl-lite
[download-url]: https://npmjs.org/package/acl-lite
[npm-image]: https://img.shields.io/npm/v/acl-lite.svg?style=flat
[downloads-image]: https://img.shields.io/npm/dm/acl-lite.svg?style=flat
