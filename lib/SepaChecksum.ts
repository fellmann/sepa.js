/**
 * Replace letters with numbers using the SEPA scheme A=10, B=11, ...
 * Non-alphanumerical characters are dropped.
 *
 * @param str     The alphanumerical input string
 * @return        The input string with letters replaced
 */
export function _replaceChars(str: string) {
  var res = "";
  for (var i = 0, l = str.length; i < l; ++i) {
    var cc = str.charCodeAt(i);
    if (cc >= 65 && cc <= 90) {
      res += (cc - 55).toString();
    } else if (cc >= 97 && cc <= 122) {
      res += (cc - 87).toString();
    } else if (cc >= 48 && cc <= 57) {
      res += str[i];
    }
  }
  return res;
}

/**
 * mod97 function for large numbers
 *
 * @param str     The number as a string.
 * @return        The number mod 97.
 */
export function _txtMod97(str: string) {
  var res = 0;
  for (var i = 0, l = str.length; i < l; ++i) {
    res = (res * 10 + parseInt(str[i], 10)) % 97;
  }
  return res;
}
