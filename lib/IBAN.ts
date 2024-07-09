import { _replaceChars, _txtMod97 } from "./SepaChecksum";

/**
 * Checks whether the given ascii code corresponds to an uppercase letter
 *
 * @param {number} charCode
 */
function isUppercaseLetter(charCode: number) {
  return charCode >= 65 && charCode <= 90;
}

/**
 * Checks whether the given ascii code corresponds to a digit
 *
 * @param {number} charCode
 */
function isDigit(charCode: number) {
  return charCode >= 48 && charCode <= 57;
}

/**
 * Checks if an IBAN is valid (no country specific checks are done).
 *
 * @param iban        The IBAN to check.
 * @return            True, if the IBAN is valid.
 */
export function validateIBAN(iban: string) {
  // the first two positions are used for the country code and must be letters
  if (
    !isUppercaseLetter(iban.charCodeAt(0)) ||
    !isUppercaseLetter(iban.charCodeAt(1))
  ) {
    return false;
  }
  // positions three and four are used for the checksum and must be digits
  if (!isDigit(iban.charCodeAt(2)) || !isDigit(iban.charCodeAt(3))) {
    return false;
  }
  var ibrev = iban.substring(4) + iban.substring(0, 4);
  return _txtMod97(_replaceChars(ibrev)) === 1;
}

/**
 * Calculates the checksum for the given IBAN. The input IBAN should pass 00
 * as the checksum digits, a full iban with the corrected checksum will be
 * returned.
 *
 * Example: DE00123456781234567890 -> DE87123456781234567890
 *
 * @param iban        The IBAN to calculate the checksum for.
 * @return            The corrected IBAN.
 */
export function checksumIBAN(iban: string) {
  var ibrev = iban.substring(4) + iban.substring(0, 2) + "00";
  var mod = _txtMod97(_replaceChars(ibrev));
  return (
    iban.substring(0, 2) +
    ("0" + (98 - mod)).substring(-2, 2) +
    iban.substring(4)
  );
}
