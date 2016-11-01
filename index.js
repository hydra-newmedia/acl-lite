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
    this.traversPermission(permission, this.permissions);
  }

  traversPermission(path, permissionObject) {
    if (permissionObject === true) {
      console.log(path);
      return;
    }
    let key = path[0];
    if (path.length === 1)
      permissionObject[key] = true;
    else
      permissionObject[key] = permissionObject[key] || {};
    this.traversPermission(path.slice(1), permissionObject[key]);
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

}

// alias Role.can() for Role.hasPermission()
Role.prototype['can'] = Role.prototype.hasPermission;

module.exports = Role;
