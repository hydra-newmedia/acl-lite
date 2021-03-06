'use strict';

class Role {

  /**
   * Constructor for an acl-lite {Role}
   * @param {Array.<string|Array.<string>>|Object} [permissions] - an array of
   * permissions to initially grant permissions to the newly created {Role}
   */
  constructor(permissions) {
    this.permissions = {};

    if (permissions) {
      if (permissions.constructor === {}.constructor || permissions.constructor === Boolean)
        this.setPermissions(permissions);
      else if (permissions.constructor === Array)
        permissions.map(permission => this.addPermission(permission));
      else
        throw new TypeError('permissions must be Object or Array.<string|Array.<string>>');
    }
  }

  /**
   * Merge other {Role}'s permissions into this {Role}
   * @param {Array.<Role>|Role} roles - other roles to be merged into this one
   * @return {Role} this
   * @throws {TypeError} if roles is not of type {Role} or {Array.<Role>}
   */
  merge(roles) {
    if (roles instanceof Role)
      roles = [roles];
    else if (!(roles instanceof Array))
      throw new TypeError('roles must be of type array or Role');

    for (let role of roles) {
      if (!(role instanceof Role))
        throw new TypeError('roles must be of type Array.<Role>');
      if (role.permissions === true) this.permissions = true;
      else {
        for (let permission of Object.keys(role.getFlatPermissions())) {
          this.addPermission(permission);
        }
      }
    }
    return this;
  }

  /**
   * Set preformatted permissions object (NOT array of string permissions)
   * @param {Object} permissions - permissions object to be set
   * @throws {Error} if the permissions object is of invalid format
   */
  setPermissions(permissions) {
    const invalid = new Error('invalid permissions object', 'InvalidPermissionsObjectError');
    const recursiveCheckValid = (permissions) => {
      let count = 0;
      if (permissions.constructor === {}.constructor) {
        for (let key in permissions) {
          recursiveCheckValid(permissions[key]);
          count++;
        }
        if (!count) throw invalid;
      } else if (permissions !== true) {
        throw invalid;
      }
    };
    recursiveCheckValid(permissions);
    this.permissions = permissions;
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
      else return recursiveHasPermission(path.slice(1), permissions[key] || {});
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
      if (permissions === true) return true;
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
   * @param {Array.<string|Array.<string>>} [paths] - paths to sub-permissions the object should be filtered by
   * @returns {Object} - stripped input object
   */
  filterObject(object, paths = undefined) {
    // get all permissions of all paths
    let permissions = this.permissions;
    if (paths && !(paths instanceof Array))
      throw new TypeError('paths must be of type array');
    if (paths && paths.length > 0) {
      const helper = new Role();
      for (let path of paths) {
        const pathHelper = new Role(this.hasPermission(path) ? this.getSubPermissions(path) : null);
        helper.merge(pathHelper);
      }
      if (helper.isEmpty()) return {};
      permissions = helper.permissions;
    }

    // delete all object properties no permissions ar granted for
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

  /**
   * Check whether the role or a sub-permission has any permissions
   * @param {string|Array.<string>} [path] - path to a sub-permission to be checked
   * @return {boolean}
   */
  isEmpty(path = null) {
    let permissions = this.getSubPermissions(path);
    if (permissions === true) return false;
    for (let permission in permissions) {
      return false;
    }
    return true;
  }

}

// alias Role.can() for Role.hasPermission()
Role.prototype['can'] = Role.prototype.hasPermission;

module.exports = Role;
