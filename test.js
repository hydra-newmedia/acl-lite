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
