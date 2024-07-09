import { assert, assert_date, assert_length } from "../../Assertions";
import { PainXmlConfiguration, PainXmlFile } from "../PainXmlFile";
import { PainFormat, PainType } from "../PainFormat";
import { SepaDirectDebitPaymentInfo } from "./SepaDirectDebitPaymentInfo";

export class SepaDirectDebitDocument extends PainXmlFile {
  constructor(
    private data: {
      messageId: string;
      created: Date;
      initiatorName: string;
      grouping?: "SNGL" | "GRPD" | "MIXD";
      payments: SepaDirectDebitPaymentInfo[];
    }
  ) {
    super();
  }

  toXmlStructure(
    configuration: PainXmlConfiguration,
    format: PainFormat
  ): string | number | object {
    if (!configuration.disableValidation) {
      assert(format.type === PainType.DirectDebit, "Invalid pain format type");
      assert_length(this.data.messageId, undefined, 35, "messageId");
      assert_date(this.data.created, "created");
      assert_length(this.data.initiatorName, undefined, 70, "initiatorName");
    }

    return {
      GrpHdr: {
        MsgId: this.data.messageId,
        CreDtTm: this.data.created.toISOString().substring(0, 19) + "Z",
        NbOfTxs: this.data.payments.reduce(
          (acc, p) => acc + p.data.transactions.length,
          0
        ),
        CtrlSum: this.data.payments.reduce(
          (acc, p) =>
            acc +
            p.data.transactions.reduce((acc, t) => acc + t.data.amount, 0),
          0
        ),
        InitgPty: {
          Nm: this.data.initiatorName,
        },
      },
      PmtInf: this.data.payments.map((p) =>
        p.toXmlStructure(configuration, format)
      ),
    };
  }
}
