import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import validateSchema from "xsd-validator";
import { PainFormatName } from "./pain/PainFormat";
import { SepaDirectDebitDocument } from "./pain/directdebit/SepaDirectDebitDocument";
import { SepaDirectDebitPaymentInfo } from "./pain/directdebit/SepaDirectDebitPaymentInfo";
import { SepaDirectDebitTransaction } from "./pain/directdebit/SepaDirectDebitTransaction";
import { SepaTransferDocument } from "./pain/transfer/SepaTransferDocument";
import { SepaTransferPaymentInfo } from "./pain/transfer/SepaTransferPaymentInfo";
import { SepaTransferTransaction } from "./pain/transfer/SepaTransferTransaction";
import { SepaRemittanceInfo } from "./pain/shared/SepaRemittanceInfo";

describe("transfer schema validation tests", () => {
  test.each([
    "pain.001.001.03",
    "pain.001.001.08",
    "pain.001.001.09",
  ] as PainFormatName[])("%p schema matches", (format) => {
    const doc = new SepaTransferDocument({
      messageId: "XMPL.20140201.TR0",
      created: new Date(),
      initiatorName: "Example LLC",
      payments: [
        new SepaTransferPaymentInfo({
          batchBooking: true,
          debitorIBAN: "DE87123456781234567890",
          debitorName: "Example LLC",
          paymentId: "XMPL.20140201.TR0",
          requestedExecutionDate: new Date(),
          transactions: [
            new SepaTransferTransaction({
              currency: "EUR",
              id: "XMPL.CUST487.INVOICE.54",
              amount: 50.23,
              creditorIBAN: "DE40987654329876543210",
              creditorName: "Example Customer",
              end2endId: "XMPL.CUST487.INVOICE.54",
              remittanceInfo: new SepaRemittanceInfo("INVOICE 54"),
            }),
          ],
        }),
      ],
    });

    const validation = validateSchema(
      doc.toXmlString(format),
      readFileSync("schema/" + format + ".xsd")
    );
    expect(validation).toBe(true);
  });
});

describe("direct debit validation tests", () => {
  test.each(["pain.008.001.02", "pain.008.001.08"] as PainFormatName[])(
    "%p schema matches",
    (format) => {
      const doc = new SepaDirectDebitDocument({
        messageId: "XMPL.20140201.TR0",
        created: new Date(),
        initiatorName: "Example LLC",
        payments: [
          new SepaDirectDebitPaymentInfo({
            paymentId: "XMPL.20140201.TR0",
            batchBooking: true,
            collectionDate: new Date(),
            debitorIBAN: "DE87123456781234567890",
            debitorName: "Example LLC",
            debitorId: "DE98ZZZ09999999999",
            transactions: [
              new SepaDirectDebitTransaction({
                id: "XMPL.CUST487.INVOICE.54",
                amount: 50.23,
                currency: "EUR",
                creditorIBAN: "DE40987654329876543210",
                creditorName: "Example Customer",
                end2endId: "XMPL.CUST487.INVOICE.54",
                mandateId: "XMPL.CUST487.2014",
                mandateSignatureDate: new Date("2014-02-01"),
                remittanceInfo: new SepaRemittanceInfo("INVOICE 54"),
              }),
            ],
          }),
        ],
      });

      const validation = validateSchema(
        doc.toXmlString(format),
        readFileSync("schema/" + format + ".xsd")
      );
      expect(validation).toBe(true);
    }
  );
});
