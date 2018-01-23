import * as path from 'path';

export class IpAddress {
  public static get() {
    return IpAddress.getAll()[0];
  }

  public static getAll() {
    var os = require('os');
    var ifaces = os.networkInterfaces();

    var interfaces = os.networkInterfaces();
    var addresses: string[] = [];
    for (var k in interfaces) {
      if (!interfaces.hasOwnProperty(k)) continue;
      for (var k2 in interfaces[k]) {
        if (!interfaces[k].hasOwnProperty(k2)) continue;
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
          addresses.push('http://' + address.address);
        }
      }
    };
    return addresses;
  }
}

export class StringUtils {
  public static getFilenameWithoutExtension(filename: string) {
    let basename = path.basename(filename);
    let ext = path.extname(basename);
    return basename.substr(0, basename.length - ext.length);
  }

  /**
   * Simple hash function, converting a string to a number.
   * 
   * See also: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
   * 
   * @static
   * @param {string} str
   * @returns
   * 
   * @memberOf StringUtils
   */
  public static hash(str: string) {
    let hash = 0;
    if (str.length == 0) return hash;
    for (let i = 0; i < str.length; i++) {
      let char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

