import { XmlTextNode } from "../../XmlTextNode";

export type MaybeArray<T> = T | T[] | undefined;
export interface Camt_053_001_08_Document {
  Document: {
    "@xmlns": string;
    BkToCstmrStmt: {
      GrpHdr: {
        MsgId?: XmlTextNode;
        CreDtTm?: XmlTextNode;
      };
      Stmt: {
        StmtPgntn: {
          PgNb?: XmlTextNode;
          LastPgInd?: XmlTextNode;
        };
        Ntry?: MaybeArray<{
          CdtDbtInd?: XmlTextNode;
          AddtlNtryInf?: XmlTextNode;
          Amt?: XmlTextNode & {
            "@Ccy": string;
          };
          BookgDt: {
            Dt?: XmlTextNode;
          };
          ValDt: {
            Dt?: XmlTextNode;
          };
          NtryDtls: {
            TxDtls: MaybeArray<{
              Refs: {
                EndToEndId?: XmlTextNode;
                MndtId?: XmlTextNode;
              };
              Amt?: XmlTextNode & {
                "@Ccy": string;
              };
              RmtInf?: {
                Ustrd?: MaybeArray<XmlTextNode>;
              };
              RltdPties?: {
                Cdtr?: {
                  Pty?: {
                    Nm?: XmlTextNode;
                  };
                };
                CdtrAcct?: {
                  Id?: {
                    IBAN?: XmlTextNode;
                  };
                };
                Dbtr?: {
                  Pty?: {
                    Nm?: XmlTextNode;
                  };
                };
                DbtrAcct?: {
                  Id?: {
                    IBAN?: XmlTextNode;
                  };
                };
              };
              RltdAgts: {
                DbtrAgt?: {
                  FinInstnId?: {
                    BICFI?: XmlTextNode;
                  };
                };
                CdtrAgnt?: {
                  FinInstnId?: {
                    BICFI?: XmlTextNode;
                  };
                };
              };
              RtrInf?: {
                AddtlInf?: XmlTextNode;
              };
            }>;
          };
          BkTxCd: {
            SttlmMtd?: XmlTextNode;
          };
          Nm?: XmlTextNode;
        }>;
      };
    };
  };
}
