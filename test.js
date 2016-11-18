'use strict';

const test = require('ava');
const Role = require('./index');

test('constructor - empty permissions object', t => {
  const role = new Role();
  t.true(role instanceof Role);
  t.deepEqual(role.permissions, {});
});

test('constructor - multi permissions object', t => {
  const role = new Role(['a.b', 'a.b.c', 'b.c']);
  t.true(role instanceof Role);
  t.deepEqual(role.permissions, { a: { b: true }, b: { c: true }});
});

test('constructor - boolean', t => {
  let role = new Role(true);
  t.true(role instanceof Role);
  t.true(role.permissions);
});

test('constructor - invalid permissions object', t => {
  t.throws(() => new Role(new Date()), TypeError);
});

const mergedResult = {
  a: {
    b: true,
  },
  b: {
    c: true,
  },
  x: {
    y: true,
  },
};

test('merge - return merged role', t => {
  const role = new Role(['a.b.c', 'b.c']);
  const role2 = new Role(['a.b', 'b.c.d', 'x.y']);
  t.deepEqual(role.merge(role2), new Role(mergedResult));
});

test('merge - manipulate role on merge', t => {
  const role = new Role(['a.b.c', 'b.c']);
  const role2 = new Role(['a.b', 'b.c.d', 'x.y']);
  role.merge(role2);
  t.deepEqual(role, new Role(mergedResult));
});

test('merge - multirole', t => {
  const role = new Role(['a.b.c', 'b.c']);
  const role2 = new Role(['a.b', 'b.c.d', 'x.y']);
  const role3 = new Role(['aa.bb', 'bb.cc.dd', 'xx.yy']);
  mergedResult['aa'] = {
    bb: true,
  };
  mergedResult['bb'] = {
    cc: {
      dd: true,
    },
  };
  mergedResult['xx'] = {
    yy: true,
  };
  role.merge([role2, role3]);
  t.deepEqual(role, new Role(mergedResult));
});

test('merge - error on invalid type of roles', t => {
  const role = new Role(['a.b.c', 'b.c']);
  const role2 = new Date();
  t.throws(() => role.merge(role2), TypeError);
  t.throws(() => role.merge(role2), 'roles must be of type array or Role');
});

test('merge - error on invalid type of a role', t => {
  const role = new Role(['a.b.c', 'b.c']);
  const role2 = new Role(['a.b', 'b.c.d', 'x.y']);
  const role3 = new Date();
  t.throws(() => role.merge([role2, role3]), TypeError);
  t.throws(() => role.merge([role2, role3]), 'roles must be of type Array.<Role>');
});

test('setPermissions - set correctly formatted permission', t => {
  const role = new Role();
  const permissions = {
    a: {
      b: {
        c: true,
      },
    },
    b: {
      c: true,
    },
  };
  role.setPermissions(permissions);
  t.deepEqual(role.permissions, permissions);
});

test('setPermissions - error on empty sub-permission object', t => {
  const role = new Role();
  const permissions = {
    a: {
      b: {},
    },
    b: {
      c: true,
    },
  };
  t.throws(() => role.setPermissions(permissions), Error);
  t.throws(() => role.setPermissions(permissions), 'invalid permissions object');
  t.throws(() => role.setPermissions({}), Error);
  t.throws(() => role.setPermissions({}), 'invalid permissions object');
});

test('setPermissions - error on invalid sub-permission', t => {
  const role = new Role();
  const permissions = {
    a: {
      b: false,
    },
    b: {
      c: true,
    },
  };
  t.throws(() => role.setPermissions(permissions), Error);
  t.throws(() => role.setPermissions(permissions), 'invalid permissions object');
  t.throws(() => role.setPermissions(false), Error);
  t.throws(() => role.setPermissions(false), 'invalid permissions object');
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
  t.false(role.hasPermission(''));
  t.false(role.hasPermission([]));
});

test('hasPermission - false even if name duplicate on wrong level', t => {
  const role = new Role(['a.b.c']);
  t.false(role.hasPermission('x.y.a'));
  t.false(role.hasPermission(['x', 'y', 'a']));
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

test('filterObject - return stripped object relating to permission', t => {
  const role = new Role(['a.b.c', 'b.c']);
  const obj = {
    a: {
      b: 'test',
    },
    b: {
      c: 'test',
    },
    x: {
      y: 'test',
    },
  };
  t.deepEqual(role.filterObject(obj), {
    a: {
      b: 'test',
    },
    b: {
      c: 'test',
    },
  });
});

test('filterObject - return stripped object relating to sub-permission', t => {
  const role = new Role(['obj.w.a.b.c', 'obj.w.b.c']);
  const obj = {
    a: {
      b: 'test',
    },
    b: {
      c: 'test',
    },
    x: {
      y: 'test',
    },
  };
  t.deepEqual(role.filterObject(obj, 'obj.w'), {
    a: {
      b: 'test',
    },
    b: {
      c: 'test',
    },
  });
});

test('filterObject - return stripped object relating to leaf sub-permission', t => {
  const role = new Role(['a']);
  const obj = { x: 'test' };
  t.deepEqual(role.filterObject(obj, 'a'), { x: 'test' });
});

test('filterObject - manipulate input object', t => {
  const role = new Role(['a.b.c', 'b.c']);
  const obj = {
    a: {
      b: 'test',
    },
    b: {
      c: 'test',
    },
    x: {
      y: 'test',
    },
  };
  role.filterObject(obj);
  t.deepEqual(obj, {
    a: {
      b: 'test',
    },
    b: {
      c: 'test',
    },
  });
});

test('filterObject - error if no string or array path provided', t => {
  const role = new Role();
  t.throws(() => role.filterObject({}, new Date()), TypeError);
  t.throws(() => role.filterObject({}, new Date()), 'path must be of type array or string');
});

test('filterObject - error if invalid path provided', t => {
  const role = new Role(['obj.w.a.b.c', 'obj.w.b.c']);
  t.throws(() => role.filterObject({}, 'a.b'), Error);
  t.throws(() => role.filterObject({}, 'a.b'), 'invalid path to sub-permission');
});
