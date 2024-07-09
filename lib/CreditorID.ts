import { _replaceChars, _txtMod97 } from "./SepaChecksum";

/**
 * Checks if a Creditor ID is valid (no country specific checks are done).
 *
 * @param iban        The Creditor ID to check.
 * @return            True, if the Creditor IDis valid.
 */
export function validateCreditorID(cid: string) {
  var cidrev = cid.substring(7) + cid.substring(0, 4);
  return _txtMod97(_replaceChars(cidrev)) === 1;
}

/**
 * Calculates the checksum for the given Creditor ID . The input Creditor ID
 * should pass 00 as the checksum digits, a full Creditor ID with the
 * corrected checksum will be returned.
 *
 * Example: DE00ZZZ09999999999 -> DE98ZZZ09999999999
 *
 * @param iban        The IBAN to calculate the checksum for.
 * @return            The corrected IBAN.
 */
export function checksumCreditorID(cid: string) {
  var cidrev = cid.substring(7) + cid.substring(0, 2) + "00";
  var mod = _txtMod97(_replaceChars(cidrev));
  return (
    cid.substring(0, 2) + ("0" + (98 - mod)).substring(-2, 2) + cid.substring(4)
  );
}
