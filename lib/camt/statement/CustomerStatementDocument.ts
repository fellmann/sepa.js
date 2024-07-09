import { XMLParser } from "fast-xml-parser";
import { assert } from "../../Assertions";
import { getXmlText } from "../../XmlTextNode";
import {
  Camt_053_001_08_Document,
  MaybeArray,
} from "./CustomerStatementDocumentType";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  parseTagValue: false,
  textNodeName: "#text",
  alwaysCreateTextNode: true,
});

function ensureArray<T>(x: MaybeArray<T>): T[] {
  if (Array.isArray(x)) return x;
  if (x === undefined) return [];
  return [x];
}

/**
 * Parses a customer statement document in the camt.053.001.08 format
 * 
 * @experimental
 */
export class CustomerStatementDocument {
  constructor(private xml: string) {}

  parse() {
    const data: Camt_053_001_08_Document = parser.parse(this.xml);

    console.log(data);

    assert(
      data.Document["@xmlns"] ===
        "urn:iso:std:iso:20022:tech:xsd:camt.053.001.08",
      "Invalid file format"
    );

    const entries = data.Document.BkToCstmrStmt.Stmt.Ntry;

    return {
      messageId: getXmlText(data.Document.BkToCstmrStmt.GrpHdr.MsgId),
      paginationNumber: getXmlText(
        data.Document.BkToCstmrStmt.Stmt.StmtPgntn.PgNb
      ),
      entries: ensureArray(entries).map((e) => ({
        type: getXmlText(e.CdtDbtInd) === "DBIT" ? "Debit" : "Credit",
        amount: getXmlText(e.Amt),
        currency: e.Amt?.["@Ccy"],
        bookingDate: getXmlText(e.BookgDt.Dt),
        valueDate: getXmlText(e.ValDt.Dt),
        transactions: ensureArray(e.NtryDtls.TxDtls).map((t) => ({
          end2endId: getXmlText(t.Refs?.EndToEndId),
          mandantId: getXmlText(t.Refs?.MndtId),
          remittanceInfo: getXmlText(t.RmtInf?.Ustrd),
          debitorName: getXmlText(t.RltdPties?.Dbtr?.Pty?.Nm),
          debitorIBAN: getXmlText(t.RltdPties?.DbtrAcct?.Id?.IBAN),
          debitorBIC: getXmlText(t.RltdAgts?.DbtrAgt?.FinInstnId?.BICFI),
          creditorName: getXmlText(t.RltdPties?.Cdtr?.Pty?.Nm),
          creditorIBAN: getXmlText(t.RltdPties?.CdtrAcct?.Id?.IBAN),
          creditorBIC: getXmlText(t.RltdAgts?.CdtrAgnt?.FinInstnId?.BICFI),
          additionalInformation: getXmlText(t.RtrInf?.AddtlInf),
        })),
        additionalInformation: getXmlText(e.AddtlNtryInf),
      })),
    };
  }
}
