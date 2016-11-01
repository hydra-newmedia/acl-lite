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
   */
  addPermission(permission) {
    if (typeof(permission) === 'string')
      permission = permission.split('.');
    else if (!(permission instanceof Array))
      throw new TypeError('permission must be of type array or string');

    // set permission object as tree
    this.deepAddPermission(permission);
  }

  /**
   * Recursive method to add object tree of permission to this.permissions
   * @param {Array.<string>} path - path to be added to the permissions
   * @param {Object} [permissions=this.permissions] - permissions object new permissions should be added to
   */
  deepAddPermission(path, permissions = this.permissions) {
    if (permissions === true) return;
    let key = path[0];
    if (path.length === 1)
      permissions[key] = true;
    else
      permissions[key] = permissions[key] || {};
    this.deepAddPermission(path.slice(1), permissions[key]);
  }

  /**
   * Check whether the {Role} has permissions for a specific node (eg. object property)
   * @param {string|Array.<string>} permission - the path to be checked against
   * @returns {boolean} - whether the {Role} is granted permissions to the node or not
   */
  hasPermission(permission) {
    if (typeof(permission) === 'string')
      permission = permission.split('.');
    else if (!(permission instanceof Array))
      throw new TypeError('permission must be of type array or string');

    return this.deepHasPermission(permission);
  }

  /**
   * Recursive method for finding whether a permission exists.
   * @param {Array.<string>} path - permission to search for
   * @param {Object} [permissions=this.permissions] - permissions object to search in
   * @returns {boolean} - true if subobject with value true exists on traversing the `path`
   */
  deepHasPermission(path, permissions = this.permissions) {
    if (path.length === 0) return false;
    let key = path[0];
    if (permissions[key] === true) return true;
    else return this.deepHasPermission(path.slice(1), permissions[key]);
  }

  /**
   * Check whether an object matches the permissions (or a sub-permission) of the role.
   * @param {Object} object - object to be checked
   * @param {string|Array.<string>} [path] - path of a sub-permission the object should be checked against (instead of root permission)
   * @returns {boolean|string} - true if object satisfies permissions, false if it's no object or
   * a path {string} of the first property, which is not permitted
   */
  checkObject(object, path = null) {
    if (path && typeof path === 'string')
      path = path.split('.');
    else if (path && !(path instanceof Array))
      throw new TypeError('path must be of type array or string');

    if (path) {
      let permissions = this.permissions;
      for (let i = 0; i < path.length; i++) {
        permissions = permissions[path[i]];
      }
      return this.deepCheckObject(object, permissions);
    } else {
      return this.deepCheckObject(object, this.permissions);
    }
  }

  /**
   * Recursive method for checking permissions on an object, aborts if no permissions or not an object
   * @param {Object|*} object
   * @param {Object|boolean|*} permissions
   * @param {string} [path='']
   * @returns {boolean|string} - path when aborting, false if non-object, true if completely permitted
   */
  deepCheckObject(object, permissions, path = '') {
    if (!permissions) return path;
    if (object.constructor === {}.constructor) {
      for (let key in object) {
        const subCheck = this.deepCheckObject(object[key], permissions[key], path + (path === '' ? key : '.' + key));
        if (subCheck !== true) return subCheck;
      }
    } else if (path === '') {
      return false;
    }
    return true;
  }

}

// alias Role.can() for Role.hasPermission()
Role.prototype['can'] = Role.prototype.hasPermission;

module.exports = Role;
