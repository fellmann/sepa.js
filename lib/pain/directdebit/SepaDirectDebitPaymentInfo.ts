import {
  assert,
  assert_fixed,
  assert_iban,
  assert_length,
} from "../../Assertions";
import { PainFormat } from "../PainFormat";
import { PainXmlConfiguration, PainXmlSerializable } from "../PainXmlFile";
import { SepaPostalAddress } from "../shared/SepaPostalAddress";
import { SepaDirectDebitTransaction } from "./SepaDirectDebitTransaction";

export class SepaDirectDebitPaymentInfo implements PainXmlSerializable {
  constructor(
    public data: {
      paymentId: string;
      collectionDate: Date;
      grouping?: "SNGL" | "GRPD" | "MIXD";
      batchBooking?: boolean;
      /* Instrumentation code:
       * 'CORE' - Standard Transfer
       * 'B2B'  - Business Transfer
       */
      localInstrumentation?: "CORE" | "B2B";

      // /**
      //  * 'FRST' - First transfer
      //  * 'RCUR' - Subsequent transfer
      //  * 'OOFF' - One Off transfer
      //  * 'FNAL' - Final transfer
      //  */
      sequenceType?: "FRST" | "RCUR" | "OOFF" | "FNAL";

      debitorName: string;
      debitorId: string;
      debitorAddress?: SepaPostalAddress;
      debitorIBAN: string;
      debitorBIC?: string;

      transactions: SepaDirectDebitTransaction[];
    }
  ) {}

  toXmlStructure(
    configuration: PainXmlConfiguration,
    format: PainFormat
  ): object {
    if (!configuration.disableValidation) {
      assert_fixed(
        this.data.localInstrumentation,
        [undefined, "CORE", "COR1", "B2B"],
        "localInstrumentation"
      );
      assert_fixed(
        this.data.sequenceType,
        [undefined, "FRST", "RCUR", "OOFF", "FNAL"],
        "sequenceType"
      );

      assert_length(this.data.debitorName, undefined, 70, "debitorName");
      assert_iban(this.data.debitorIBAN, "debitorIBAN");
      assert_fixed(this.data.debitorBIC?.length || 0, [0, 8, 11], "debitorBIC");

      var countryMatches =
        !this.data.debitorBIC ||
        this.data.debitorBIC.substr(4, 2) ===
          this.data.debitorIBAN.substr(0, 2);
      assert(countryMatches, "country mismatch in BIC/IBAN");

      assert_length(this.data.transactions, 1, undefined, "_payments");
    }

    return {
      PmtInfId: this.data.paymentId,
      PmtMtd: "DD",
      BtchBookg: this.data.batchBooking?.toString() ?? "true",
      NbOfTxs: this.data.transactions.length,
      CtrlSum: this.data.transactions.reduce(
        (acc, t) => acc + t.data.amount,
        0
      ),
      PmtTpInf: {
        SvcLvl: {
          Cd: "SEPA",
        },
        LclInstrm: {
          Cd: this.data.localInstrumentation || "CORE",
        },
        SeqTp: this.data.sequenceType || "FRST",
      },
      ReqdColltnDt: this.data.collectionDate.toISOString().substring(0, 10),
      Cdtr: {
        Nm: this.data.debitorName,
        PstlAdr: this.data.debitorAddress?.toXmlStructure(configuration),
      },
      CdtrAcct: {
        Id: {
          IBAN: this.data.debitorIBAN,
        },
      },
      CdtrAgt: {
        FinInstnId: {
          BIC: this.data.debitorBIC,
        },
      },
      ChrgBr: "SLEV",
      CdtrSchmeId: {
        Id: {
          PrvtId: {
            Othr: {
              Id: this.data.debitorId,
            },
          },
        },
      },
      DrctDbtTxInf: this.data.transactions.map((t) =>
        t.toXmlStructure(configuration, format)
      ),
    };
  }
}
