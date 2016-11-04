'use strict';

class Role {

  /**
   * Constructor for an acl-lite {Role}
   * @param {Array.<string|Array.<string>>} [permissions] - an array of
   * permissions to initially grant permissions to the newly created {Role}
   */
  constructor(permissions) {
    this.permissions = {};

    if (permissions)
      permissions.map(permission => this.addPermission(permission));
  }

  /**
   * Add a permission for a node (eg. object property) to the {Role}
   * @param {string|Array.<string>} permission - the path to the node to grant permissions to
   * @throws {TypeError} if the provided permission is neither {string} nor {Array.<string>}
   */
  addPermission(permission) {
    if (typeof(permission) === 'string')
      permission = permission.split('.');
    else if (!(permission instanceof Array))
      throw new TypeError('permission must be of type array or string');

    // set permission object as tree
    const recursiveAddPermission = (path, permissions = this.permissions) => {
      if (permissions === true) return;
      let key = path[0];
      if (path.length === 1)
        permissions[key] = true;
      else
        permissions[key] = permissions[key] || {};
      recursiveAddPermission(path.slice(1), permissions[key]);
    };
    recursiveAddPermission(permission);
  }

  /**
   * Check whether the {Role} has permissions for a specific node (eg. object property)
   * @param {string|Array.<string>} permission - the path to be checked against
   * @returns {boolean} - whether the {Role} is granted permissions to the node or not
   * @throws {TypeError} if the provided permission is neither {string} nor {Array.<string>}
   */
  hasPermission(permission) {
    if (typeof(permission) === 'string')
      permission = permission.split('.');
    else if (!(permission instanceof Array))
      throw new TypeError('permission must be of type array or string');

    const recursiveHasPermission = (path, permissions = this.permissions) => {
      if (path.length === 0) return false;
      let key = path[0];
      if (path.length === 1) return !!permissions[key];
      if (permissions[key] === true) return true;
      else return recursiveHasPermission(path.slice(1), permissions[key]);
    };
    return recursiveHasPermission(permission);
  }

  /**
   * Check whether an object matches the permissions (or a sub-permission) of the role.
   * @param {Object} object - object to be checked
   * @param {string|Array.<string>} [path] - path of a sub-permission the object
   * should be checked against (instead of root permission)
   * @returns {boolean|string} - true if object satisfies permissions, false if it's no object or
   * a path {string} of the first property, which is not permitted
   */
  checkObject(object, path = undefined) {
    const recursiveCheckObject = (object, permissions, path = '') => {
      if (!permissions) return path;
      if (object.constructor === {}.constructor) {
        for (let key in object) {
          const subCheck = recursiveCheckObject(object[key], permissions[key], path + (path === '' ? key : '.' + key));
          if (subCheck !== true) return subCheck;
        }
      } else if (path === '') {
        return false;
      }
      return true;
    };
    return recursiveCheckObject(object, this.getSubPermissions(path));
  }

  /**
   * Filter arbitrary object relating to the permission of this {Role}
   * @param {Object} object - object to be filtered
   * @param {string|Array.<string>} [path] - path to a sub-permission the object should be filtered by
   * @returns {Object} - stripped input object
   */
  filterObject(object, path = undefined) {
    let permissions = this.getSubPermissions(path);

    const recursiveFilterObject = (object, permissions) => {
      if (permissions === true)
        return object;
      if (object.constructor === {}.constructor) {
        for (let key in object) {
          if (permissions[key])
            object[key] = recursiveFilterObject(object[key], permissions[key]);
          else
            delete object[key];
        }
      }
      return object;
    };
    return recursiveFilterObject(object, permissions);
  }

  /**
   * Get (sub-)permissions in a flatted object.
   * @param {string|Array.<string>} [path] - optional sub-permission path to get permissions of
   * @param {*} [value=true] - value the flatted object should hold, eg. 1 for mongoose filtering
   * @returns {Object} - flatted (sub-)permissions object
   */
  getFlatPermissions(path = undefined, value = true) {
    let permissions = this.getSubPermissions(path);

    let flatted = {};
    const deepFlatten = (object, path = '') => {
      for (let key in object) {
        let flatPath = path + (path === '' ? key : '.' + key);
        if (object[key] === true)
          flatted[flatPath] = value;
        else
          deepFlatten(object[key], flatPath);
      }
    };
    deepFlatten(permissions);
    return flatted;
  }

  /**
   * Get sub-permissions of this {Role}
   * @param {string|Array.<string>} [path] - path to the sub-permissions
   * @returns {Object|boolean}
   * @throws {TypeError} if the path is not string or Array.<string>
   * @throws {Error} if the path is invalid (does not exists on this {Role}s permissions member}
   */
  getSubPermissions(path = null) {
    if (!path)
      path = [];
    else if (typeof path === 'string')
      path = path.split('.');
    else if (!(path instanceof Array))
      throw new TypeError('path must be of type array or string');

    let permissions = this.permissions;
    for (let key of path) {
      if (!(key in permissions))
        throw new Error('invalid path to sub-permission', 'InvalidPermissionPathError');
      permissions = permissions[key];
    }
    return permissions;
  }

}

// alias Role.can() for Role.hasPermission()
Role.prototype['can'] = Role.prototype.hasPermission;

module.exports = Role;
