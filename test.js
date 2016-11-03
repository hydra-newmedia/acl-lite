'use strict';

const test = require('ava');
const Role = require('./index');

test('constructor - empty permissions object', t => {
  const role = new Role();
  t.truthy(role instanceof Role);
  t.deepEqual(role.permissions, {});
});

test('constructor - multi permissions object', t => {
  const role = new Role(['a.b', 'a.b.c', 'b.c']);
  t.truthy(role instanceof Role);
  t.deepEqual(role.permissions, { a: { b: true }, b: { c: true }});
});

test('addPermission - add string formatted permission', t => {
  const role = new Role(['a.b', 'b']);
  const permissions = {
    a: {
      b: true,
    },
    b: true,
  };

  role.addPermission('a.b.c');
  t.deepEqual(role.permissions, permissions);

  role.addPermission('b.c');
  t.deepEqual(role.permissions, permissions);

  role.addPermission('c.d');
  permissions['c'] = { d: true };
  t.deepEqual(role.permissions, permissions);

  role.addPermission('a.b');
  permissions.a.b = true ;
  t.deepEqual(role.permissions, permissions);

  role.addPermission('a');
  permissions.a = true;
  t.deepEqual(role.permissions, permissions);
});

test('addPermission - add array permission', t => {
  const role = new Role([['a', 'b'], ['b']]);
  const permissions = {
    a: {
      b: true,
    },
    b: true,
  };

  role.addPermission(['a', 'b', 'c']);
  t.deepEqual(role.permissions, permissions);

  role.addPermission(['b', 'c']);
  t.deepEqual(role.permissions, permissions);

  role.addPermission(['c', 'd']);
  permissions['c'] = { d: true };
  t.deepEqual(role.permissions, permissions);

  role.addPermission(['a', 'b']);
  permissions.a.b = true ;
  t.deepEqual(role.permissions, permissions);

  role.addPermission(['a']);
  permissions.a = true;
  t.deepEqual(role.permissions, permissions);
});

test('addPermission - error if not string or array', t => {
  const role = new Role();
  t.throws(() => role.addPermission(new Date()), TypeError);
  t.throws(() => role.addPermission(new Date()), 'permission must be of type array or string');
});

test('hasPermission - true if permission exists', t => {
  const role = new Role(['a.b.c']);
  t.true(role.hasPermission('a.b.c'));
  t.true(role.hasPermission(['a', 'b', 'c']));
});

test('hasPermission - true if sup-permission exists', t => {
  const role = new Role(['a.b.c', 'b.c', 'c']);
  t.true(role.hasPermission('a.b.c.d'));
  t.true(role.hasPermission(['a', 'b', 'c', 'd']));
  t.true(role.hasPermission('b.c.d'));
  t.true(role.hasPermission(['b', 'c', 'd']));
  t.true(role.hasPermission('c.d'));
  t.true(role.hasPermission(['c', 'd']));
});

test('hasPermission - false if no permission exists', t => {
  const role = new Role(['a.b.c', 'b.c']);
  t.false(role.hasPermission('a.b.f'));
  t.false(role.hasPermission(['a', 'b', 'f']));
  t.false(role.hasPermission('x.y.z'));
  t.false(role.hasPermission(['x', 'y', 'z']));
  t.false(role.hasPermission('x'));
  t.false(role.hasPermission(['x']));
});

test('hasPermission - error if not string or array provided', t => {
  const role = new Role();
  t.throws(() => role.hasPermission(new Date()), TypeError);
  t.throws(() => role.hasPermission(new Date()), 'permission must be of type array or string');
});

test('checkObject - true if object satisfies permissions', t => {
  const role = new Role(['a.b.c', 'b.c']);

  t.true(role.checkObject({
    a: {
      b: {
        c: 'test',
      }
    },
    b: {
      c: 'test',
    },
  }));

  t.true(role.checkObject({
    a: {
      b: 'test',
    },
    b: 'test',
  }));
});

test('checkObject - false if object does not satisfiy permissions', t => {
  const role = new Role(['a.b.c', 'b.c']);

  t.is('a.b.d', role.checkObject({
    a: {
      b: {
        c: 'test',
        d: 'test',
      },
    },
    b: {
      c: 'test',
    },
  }));

  t.is('a.b.c.d', role.checkObject({
    a: {
      b: {
        c: {
          d: 'test',
        },
      },
    },
  }));

  t.is('x', role.checkObject({
    a: {
      b: {
        c: 'test',
      },
    },
    x: 'test',
  }));
});

test('checkObject - false if no object', t => {
  const role = new Role(['a.b.c', 'b.c']);

  t.false(role.checkObject('test'));
});


test('checkObject - correct return if for sub-permissions', t => {
  const role = new Role(['obj.w.a.b.c', 'obj.w.b.c']);

  t.true(role.checkObject({
    a: {
      b: {
        c: 'test',
      }
    },
    b: {
      c: 'test',
    },
  }, 'obj.w'));

  t.true(role.checkObject({
    a: {
      b: 'test',
    },
    b: 'test',
  }, ['obj', 'w']));

  t.is('a.b.d', role.checkObject({
    a: {
      b: {
        c: 'test',
        d: 'test',
      },
    },
    b: {
      c: 'test',
    },
  }, 'obj.w'));

  t.is('a.b.c.d', role.checkObject({
    a: {
      b: {
        c: {
          d: 'test',
        },
      },
    },
  }, ['obj', 'w']));

  t.is('x', role.checkObject({
    a: {
      b: {
        c: 'test',
      },
    },
    x: 'test',
  }, 'obj.w'));

  t.false(role.checkObject('test', 'obj.w'));
  t.false(role.checkObject('test', ['obj', 'w']));
});

test('checkObject - error if no string or array path provided', t => {
  const role = new Role();
  t.throws(() => role.checkObject({}, new Date()), TypeError);
  t.throws(() => role.checkObject({}, new Date()), 'path must be of type array or string');
});

test('checkObject - error if invalid path provided', t => {
  const role = new Role(['obj.w.a.b.c', 'obj.w.b.c']);
  t.throws(() => role.checkObject({}, 'a.b'), Error);
  t.throws(() => role.checkObject({}, 'a.b'), 'invalid path to sub-permission');
});

test('getFlatPermissions - return flatted permissions', t => {
  const role = new Role(['a.b.c', 'b.c']);
  t.deepEqual(role.getFlatPermissions(), {
    'a.b.c': true,
    'b.c': true,
  });
});

test('getFlatPermissions - return flatted sub-permissions', t => {
  const role = new Role(['obj.w.a.b.c', 'obj.w.b.c']);
  t.deepEqual(role.getFlatPermissions('obj.w'), {
    'a.b.c': true,
    'b.c': true,
  });
  t.deepEqual(role.getFlatPermissions(['obj', 'w']), {
    'a.b.c': true,
    'b.c': true,
  });
});

test('getFlatPermissions - error if no string or array path provided', t => {
  const role = new Role();
  t.throws(() => role.getFlatPermissions(new Date()), TypeError);
  t.throws(() => role.getFlatPermissions(new Date()), 'path must be of type array or string');
});

test('getFlatPermissions - error if invalid path provided', t => {
  const role = new Role(['obj.w.a.b.c', 'obj.w.b.c']);
  t.throws(() => role.getFlatPermissions('a.b'), Error);
  t.throws(() => role.getFlatPermissions('a.b'), 'invalid path to sub-permission');
});

test('getFlatPermissions - return flatted sub-permissions with specified value', t => {
  const role = new Role(['obj.w.a.b.c', 'obj.w.b.c']);
  t.deepEqual(role.getFlatPermissions('obj.w', 'test'), {
    'a.b.c': 'test',
    'b.c': 'test',
  });
  t.deepEqual(role.getFlatPermissions(['obj', 'w'], 1), {
    'a.b.c': 1,
    'b.c': 1,
  });
  t.deepEqual(role.getFlatPermissions(null, false), {
    'obj.w.a.b.c': false,
    'obj.w.b.c': false,
  });
});
