'use strict';

const test = require('ava');
const Role = require('./index');

test('constructor - empty permissions map', t => {
  const role = new Role();
  t.truthy(role instanceof Role);
  t.is(role.permissions.size, 0);
});

test('constructor - multi permissions map', t => {
  const role = new Role(['a.b', 'a.b.c', 'b.c']);
  t.truthy(role instanceof Role);
  t.truthy(role.permissions.size === 5);
  [
    ['a', true],
    ['a.b', true],
    ['a.b.c', true],
    ['b', true],
    ['b.c', true],
  ].forEach(permission => t.truthy(role.permissions.has(permission[0])));
});

test('addPermission - add string formatted permission', t => {
  const role = new Role(['a.b', 'b']);
  const permissions = [
    ['a', true],
    ['a.b', true],
    ['b', true],
  ];

  role.addPermission('a.b.c');
  t.is(role.permissions.size, 4);
  permissions.push(['a.b.c']);
  permissions.forEach(permission => t.truthy(role.permissions.has(permission[0])));

  role.addPermission('b.c');
  t.is(role.permissions.size, 5);
  permissions.push(['b.c']);
  permissions.forEach(permission => t.truthy(role.permissions.has(permission[0])));
});

test('addPermission - add array permission', t => {
  const role = new Role(['a.b', 'b']);
  const permissions = [
    ['a', true],
    ['a.b', true],
    ['b', true],
  ];

  role.addPermission(['a', 'b', 'c']);
  t.is(role.permissions.size, 4);
  permissions.push(['a.b.c']);
  permissions.forEach(permission => t.truthy(role.permissions.has(permission[0])));

  role.addPermission(['b', 'c']);
  t.is(role.permissions.size, 5);
  permissions.push(['b.c']);
  permissions.forEach(permission => t.truthy(role.permissions.has(permission[0])));
});

test('addPermission - no change on already added permissions', t => {
  const role = new Role(['a.b.c']);
  const permissions = [
    ['a', true],
    ['a.b', true],
    ['a.b.c', true],
  ];

  role.addPermission('a.b.c');
  t.is(role.permissions.size, 3);
  permissions.forEach(permission => t.truthy(role.permissions.has(permission[0])));

  role.addPermission(['a', 'b']);
  t.is(role.permissions.size, 3);
  permissions.forEach(permission => t.truthy(role.permissions.has(permission[0])));

  role.addPermission(['a']);
  t.is(role.permissions.size, 3);
  permissions.forEach(permission => t.truthy(role.permissions.has(permission[0])));
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
  const role = new Role(['a.b.c']);
  t.true(role.hasPermission('a.b'));
  t.true(role.hasPermission(['a', 'b']));
  t.true(role.hasPermission('a'));
  t.true(role.hasPermission(['a']));
});

test('hasPermission - false if no permission exists', t => {
  const role = new Role(['a.b.c', 'b.c']);
  t.false(role.hasPermission('b.c.d'));
  t.false(role.hasPermission(['b', 'c', 'd']));
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
