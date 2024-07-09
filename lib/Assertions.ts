import { validateCreditorID } from "./CreditorID";
import { validateIBAN } from "./IBAN";
import { PainFormat } from "./pain/PainFormat";

export class SepaAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SepaAssertionError";
  }
}

/** Assert that |cond| is true, otherwise throw an error with |msg| */
export function assert(cond: boolean, msg: string): void {
  if (!cond) {
    throw new SepaAssertionError(msg);
  }
}

/** Assert that |val| is one of |choices| */
export function assert_fixed<T>(val: T, choices: T[], member: string): void {
  if (choices.indexOf(val) < 0) {
    throw new SepaAssertionError(
      member +
        " must have any value of: " +
        choices.join(" ") +
        "(found: " +
        val +
        ")"
    );
  }
}

/** assert that |str| has a length between min and max (either may be null) */
export function assert_length(
  str: string | unknown[] |undefined,
  min: number | undefined,
  max: number | undefined,
  member: string
): void {
  if (
    (min !== undefined && str && str.length < min) ||
    (max !== undefined && str && str.length > max)
  ) {
    throw new SepaAssertionError(
      member +
        " has invalid string length, expected " +
        min +
        " < " +
        str +
        " < " +
        max
    );
  }
}

/** assert that |num| is in the range between |min| and |max| */
export function assert_range(
  num: number,
  min: number,
  max: number,
  member: string
): void {
  if (num < min || num > max) {
    throw new SepaAssertionError(
      member + " does not match range " + min + " < " + num + " < " + max
    );
  }
}

/** assert that |str| is an IBAN */
export function assert_iban(str: string, member: string): void {
  if (!validateIBAN(str)) {
    throw new SepaAssertionError(member + ' has invalid IBAN "' + str + '"');
  }
}

/** assert that |str| is a creditor id */
export function assert_cid(str: string, member: string): void {
  if (!validateCreditorID(str)) {
    throw new SepaAssertionError(member + ' is invalid "' + str + '"');
  }
}

/** assert an iso date */
export function assert_date(dt: Date | undefined, member: string): void {
  if (!dt || isNaN(dt.getTime())) {
    throw new SepaAssertionError(member + " has invalid date " + dt);
  }
}

/**
 * Checks whether the given string is a valid SEPA id.
 *
 * @param {string} str - The id to check
 * @param {number} maxLength - The maximum length of the id
 * @param {string} member - The name of the field that is validated
 * @param {boolean} disableCharsetValidation - If the character set should be validated
 */
export function assert_valid_sepa_id(
  str: string,
  maxLength: number,
  member: string,
  disableCharsetValidation: boolean = false
): void {
  assert_length(str, undefined, maxLength, member);

  if (!disableCharsetValidation) {
    if (str && !str.match(/([A-Za-z0-9]|[+|?|/|\-|:|(|)|.|,|' ]){1,35}/)) {
      throw new SepaAssertionError(
        `${member} contains characters which are not in the SEPA character set (found: "${str}")`
      );
    }
  }

  if (str && str.length > 1 && str.charAt(0) === "/") {
    throw new SepaAssertionError(
      `${member} is an id and hence must not start with a "/". (found "${str}"`
    );
  }

  if (str && str.match(/\/\//)) {
    throw new SepaAssertionError(
      `${member} is an id and hence must not contain "//". (found "${str}"`
    );
  }
}

export function assert_feature_if_defined(
  value: any,
  feature: keyof PainFormat,
  versionInformation: PainFormat
) {
  if (value !== undefined) {
    assert(
      !!versionInformation[feature],
      `Feature ${feature} is not supported by the current pain version`
    );
  }
}
