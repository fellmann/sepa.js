import { describe, expect, test } from "@jest/globals";

import * as SEPA from "./index";
var xpath = require("xpath");

// The following debtor id is provided by German Bundesbank for testing purposes.
const A_VALID_CREDITOR_ID = "DE98ZZZ09999999999";

const A_VALID_IBAN = "DE43500105178994141576";

describe("IBAN tests", () => {
  test("Detects valid random IBANs", () => {
    // some random IBANs from randomiban.com
    var validIbans = [
      "NL30ABNA8727958558",
      "DE64500105171488962235",
      "CH6389144234422115817",
      "FR0617569000706665685358G36",
    ];

    validIbans.forEach((iban) => expect(SEPA.validateIBAN(iban)).toBe(true));
  });

  test("Detects IBAN with bad checksum", () => {
    expect(SEPA.validateIBAN("DE54500105171488962235")).toBe(false);
  });

  test("Detects IBAN which starts with lowercase letters", () => {
    // This IBAN would be valid if it started with 'NL'
    expect(SEPA.validateIBAN("nl30ABNA8727958558")).toBe(false);
  });

  test("santander is not a valid IBAN (issue #18)", () => {
    expect(SEPA.validateIBAN("santander")).toBe(false);
  });

  test("Detects IBANs which do not start with two letters and two digits", () => {
    expect(SEPA.validateIBAN("0E11santander")).toBe(false);
    expect(SEPA.validateIBAN("D911santander")).toBe(false);
    expect(SEPA.validateIBAN("DEA1santander")).toBe(false);
    expect(SEPA.validateIBAN("DE1Zsantander")).toBe(false);
  });
});

describe("xml generation for transfer documents", () => {
  const PAIN_FOR_TRANSFERS = "pain.001.001.09";

  function validTransferDocument({
    debtorId= A_VALID_CREDITOR_ID,
    debtorName = "default-debtor-name",
    debtorCity = "",
    debtorCountry= "",
    debtorStreet= "",
    creditorCity= "",
    creditorCountry= "",
    creditorStreet= ""
  }
  ) {
    return new SEPA.SepaTransferDocument({
      created: new Date(),
      messageId: "message-id",
      initiatorName: "initiator-name",

      payments: [
        new SEPA.SepaTransferPaymentInfo({
          batchBooking: true,
          debitorIBAN: A_VALID_IBAN,
          debitorName: debtorName,
          paymentId: "payment-id",
          requestedExecutionDate: new Date(),
          debitorAddress:
            debtorCity && debtorCountry
              ? new SEPA.SepaPostalAddress({
                  street: debtorStreet,
                  city: debtorCity,
                  country: debtorCountry,
                })
              : undefined,

          transactions: [
            new SEPA.SepaTransferTransaction({
              currency: "EUR",
              id: "transaction-id",
              amount: 50.23,
              creditorIBAN: A_VALID_IBAN,
              creditorName: "Example Customer",
              creditorPostalAddress:
                creditorCity && creditorCountry
                  ? new SEPA.SepaPostalAddress({
                      street: creditorStreet,
                      city: creditorCity,
                      country: creditorCountry,
                    })
                  : undefined,

              end2endId: "end2end-id",
              remittanceInfo: new SEPA.SepaRemittanceInfo("INVOICE 54"),
            }),
          ],
        }),
      ],
    });
  }

  test("debtor name is included in transfer documents when it is set", () => {
    // GIVEN
    const doc = validTransferDocument({
      debtorId: "FR72ZZZ123456",
      debtorName: "debtor-name",
    });

    // WHEN
    const dom = doc.toXmlString(PAIN_FOR_TRANSFERS);

    // THEN
    const select = xpath.useNamespaces({
      p: `urn:iso:std:iso:20022:tech:xsd:${PAIN_FOR_TRANSFERS}`,
    });

    const debtorName = select(
      "/p:Document/p:CstmrCdtTrfInitn/p:PmtInf/p:Dbtr/p:Nm",
      dom,
      true
    );
    expect(debtorName).not.toBeUndefined();
    expect(debtorName.textContent).toBe("debtor-name");
  });

  test("detects invalid characters for end2endId", () => {
    // GIVEN
    const doc = validTransferDocument({});
    addTransaction(doc, "Ö");

    // WHEN THEN
    expect(() => doc.toXmlString(PAIN_FOR_TRANSFERS)).toThrow(Error);
  });

  test("accepts valid end2endId", () => {
    // GIVEN
    const doc = validTransferDocument({});
    addTransaction(doc, "ascii only end-2-end-id");

    // WHEN
    const xml = doc.toXmlString(PAIN_FOR_TRANSFERS);

    // THEN
    expect(xml).not.toBeUndefined();
  });

  test("accepts all valid punctuation signs for end2endId", () => {
    // GIVEN
    const doc = validTransferDocument({});
    addTransaction(doc, "-");
    addTransaction(doc, "?");
    addTransaction(doc, ":");
    addTransaction(doc, "(");
    addTransaction(doc, ")");
    addTransaction(doc, ".");
    addTransaction(doc, ",");
    addTransaction(doc, "'");
    addTransaction(doc, "+");

    // WHEN
    const xml = doc.toXmlString(PAIN_FOR_TRANSFERS);

    // THEN
    expect(xml).not.toBeUndefined();
  });

  test("Disabling charset validation works", () => {
    try {
      // GIVEN
      const doc = validTransferDocument({});
      const greekText = "Κείμενο με ελληνικά γράμματα";
      addTransaction(doc, greekText);
      SEPA.enableValidations(true, false);

      // WHEN
      const xml = doc.toXmlString(PAIN_FOR_TRANSFERS);

      // THEN
      expect(xml).not.toBeUndefined();
    } finally {
      SEPA.enableValidations(true, true);
    }
  });

  test("Rejects identifiers which are too long", () => {
    // GIVEN
    const doc = validTransferDocument({});
    const longIdentifier = "one-more-than-thirty-five-characters";
    addTransaction(doc, { endToEndId: longIdentifier });

    // WHEN THEN
    expect(() => doc.toXmlString(PAIN_FOR_TRANSFERS)).toThrow(Error);
  });

  test("Rejects ids which start with a /", () => {
    // GIVEN
    const doc = validTransferDocument({});
    const invalidIdentifier = "/id-starts-with-slash";
    addTransaction(doc, { endToEndId: invalidIdentifier });

    // WHEN THEN
    expect(() => doc.toXmlString(PAIN_FOR_TRANSFERS)).toThrow(Error);
  });

  test('Rejects ids which contain "//"', () => {
    // GIVEN
    const doc = validTransferDocument({});
    const invalidIdentifier = "an/id/with//double/slash";
    addTransaction(doc, { endToEndId: invalidIdentifier });

    // WHEN THEN
    expect(() => doc.toXmlString(PAIN_FOR_TRANSFERS)).toThrow(Error);
  });

  test("ctry and address field not null", () => {
    // GIVEN
    const doc = validTransferDocument({
      debtorCountry: "FR",
      debtorStreet: "Rue du debtor",
      debtorCity: "DebtorCity",
      creditorCountry: "FR",
      creditorStreet: "Rue du creditor",
      creditorCity: "CreditorCity",
    });

    // WHEN
    const dom = doc.toXmlString(PAIN_FOR_TRANSFERS);

    // THEN
    const select = xpath.useNamespaces({
      p: `urn:iso:std:iso:20022:tech:xsd:${PAIN_FOR_TRANSFERS}`,
    });

    const debtorCtry = select(
      "/p:Document/p:CstmrCdtTrfInitn/p:PmtInf/p:Dbtr/p:PstlAdr/p:Ctry",
      dom,
      true
    );
    const debtorStreet = select(
      "/p:Document/p:CstmrCdtTrfInitn/p:PmtInf/p:Dbtr/p:PstlAdr/p:AdrLine[1]",
      dom,
      true
    );
    const debtorCity = select(
      "/p:Document/p:CstmrCdtTrfInitn/p:PmtInf/p:Dbtr/p:PstlAdr/p:AdrLine[2]",
      dom,
      true
    );
    expect(debtorCtry.textContent).toBe("FR");
    expect(debtorStreet.textContent).toBe("Rue du debtor");
    expect(debtorCity.textContent).toBe("DebtorCity");

    const creditorCtry = select(
      "/p:Document/p:CstmrCdtTrfInitn/p:PmtInf/p:CdtTrfTxInf[1]/p:Cdtr/p:PstlAdr/p:Ctry",
      dom,
      true
    );
    const creditorStreet = select(
      "/p:Document/p:CstmrCdtTrfInitn/p:PmtInf/p:CdtTrfTxInf[1]/p:Cdtr/p:PstlAdr/p:AdrLine[1]",
      dom,
      true
    );
    const creditorCity = select(
      "/p:Document/p:CstmrCdtTrfInitn/p:PmtInf/p:CdtTrfTxInf[1]/p:Cdtr/p:PstlAdr/p:AdrLine[2]",
      dom,
      true
    );

    expect(creditorCtry.textContent).toBe("FR");
    expect(creditorStreet.textContent).toBe("Rue du creditor");
    expect(creditorCity.textContent).toBe("CreditorCity");
  });
});

describe("xml generation for direct debit documents", () => {
  const PAIN_FOR_DIRECT_DEBIT = "pain.008.001.08";
  function validDirectDebitDocument({ creditorId = A_VALID_CREDITOR_ID } 
  ) {
    return new SEPA.SepaDirectDebitDocument({
      created: new Date(),
      messageId: "message-id",
      initiatorName: "initiator-name",
    
      payments: [tsc
        new SEPA.SepaDirectDebitPaymentInfo({
          paymentId: "payment-id",
          batchBooking: true,
          collectionDate: new Date(),
          debitorIBAN: A_VALID_IBAN,
          debitorName: "creditor-name",
          debitorId: creditorId,
          transactions: [
            new SEPA.SepaDirectDebitTransaction({
              id: "transaction-id",
              amount: 50.23,
              currency: "EUR",
              creditorIBAN: A_VALID_IBAN,
              creditorName: "Example Customer",
              end2endId: "end2end-id",
              mandateId: "mandate-id",
              mandateSignatureDate: new Date(),
              remittanceInfo: new SEPA.SepaRemittanceInfo("INVOICE 54"
            })
          ],
        }),
      ]
    });
  }

  test("includes creditor id when set", () => {
    // GIVEN
    const doc = validDirectDebitDocument({
      creditorId: "IT66ZZZA1B2C3D4E5F6G7H8",
    });

    // WHEN
    const dom = doc.toXmlString(PAIN_FOR_DIRECT_DEBIT);

    // THEN
    const select = xpath.useNamespaces({
      p: `urn:iso:std:iso:20022:tech:xsd:${PAIN_FOR_DIRECT_DEBIT}`,
    });

    const creditorId = select(
      "/p:Document/p:CstmrDrctDbtInitn/p:PmtInf/p:CdtrSchmeId/p:Id/p:PrvtId/p:Othr/p:Id",
      dom,
      true
    );
    expect(creditorId).not.toBeUndefined();
    expect(creditorId.textContent).toBe("IT66ZZZA1B2C3D4E5F6G7H8");
  });

  test("Works without setting creditor id", () => {
    // GIVEN
    const doc = validDirectDebitDocument({ creditorId: null });

    // WHEN
    const dom = doc.toXmlString(PAIN_FOR_DIRECT_DEBIT);

    // THEN
    const select = xpath.useNamespaces({
      p: `urn:iso:std:iso:20022:tech:xsd:${PAIN_FOR_DIRECT_DEBIT}`,
    });

    const creditorId = select(
      "/p:Document/p:CstmrDrctDbtInitn/p:PmtInf/p:Cdtr/p:Id",
      dom,
      true
    );
    expect(creditorId).toBeUndefined();
  });

  test("serialized document starts with proper xml declaration", () => {
    // GIVEN
    const doc = validDirectDebitDocument({});
    // WHEN
    const xmlString = doc.toString();
    // THEN
    expect(xmlString).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
  });
});
