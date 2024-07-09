/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2014-2015 */

/**
 * This is sepa.js. Its module exports the following functions:
 *
 * SEPA.Document               -- class for creating SEPA XML Documents
 * SEPA.PaymentInfo            -- class for SEPA payment information blocks
 * SEPA.Transaction            -- class for generic transactions
 * SEPA.validateIBAN           -- function to validate an IBAN
 * SEPA.checksumIBAN           -- function to calculate the IBAN checksum
 * SEPA.validateCreditorID     -- function to validate a creditor id
 * SEPA.checksumCreditorID     -- function to calculate the creditor id checksum
 * SEPA.setIDSeparator         -- function to customize the ID separator when needed (defaults to '.')
 * SEPA.enableValidations      -- function to enable/disable fields validation
 */

  var XSI_NAMESPACE = 'http://www.w3.org/2001/XMLSchema-instance';
  var XSI_NS        = 'urn:iso:std:iso:20022:tech:xsd:';
  var DEFAULT_XML_VERSION   = '1.0';
  var DEFAULT_XML_ENCODING  = 'UTF-8';
  var DEFAULT_PAIN_FORMAT   = 'pain.008.001.02';

  var ID_SEPARATOR = '.';
  function setIDSeparator(seperator) {
    ID_SEPARATOR = seperator;
  }

  var VALIDATIONS_ENABLED = true;
  var CHARSET_VALIDATION_ENABLED = true;
  /**
   * Controls the validation that is conducted when SepaDocuments are serialized.
   *
   * @param {boolean} enabled - Whether the validation should be conducted
   * @param {boolean} [charsetValidationsEnabled=true] - If validation is enabled, whether fields
   *    should be checked for the limited SEPA character set. You want to set this to false, e.g.,
   *    if you are using this library to handle communication within Greece or Finnland, where
   *    more characters are allowed.
   */
  function enableValidations(enabled, charsetValidationsEnabled = true) {
    VALIDATIONS_ENABLED = !!enabled;
    CHARSET_VALIDATION_ENABLED = !!charsetValidationsEnabled;
  }

  const SEPATypes = {
    'pain.001.001.02': 'pain.001.001.02',
    'pain.001.001.03': 'CstmrCdtTrfInitn',
    'pain.001.001.08': 'CstmrCdtTrfInitn',
    'pain.001.001.09': 'CstmrCdtTrfInitn',
    'pain.008.001.02': 'CstmrDrctDbtInitn',
    'pain.008.001.08': 'CstmrDrctDbtInitn',
  };

  function getPainXMLVersion(painFormat) {
    const inc = painFormat.indexOf('pain.008') === 0 ?  1 : 0;
    return parseInt(painFormat.substr(-2), 10) + inc;
  }

  class SepaDocument {
    static Types = SEPATypes;

    private _painFormat: any;
    private _type: any;
    private _paymentInfo: any[];
    private _xmlVersion: any;
    private _xmlEncoding: any;
    public grpHdr: any;

    constructor(painFormat: any) {
        this._painFormat = painFormat || DEFAULT_PAIN_FORMAT;
        this._type = SepaDocument.Types[this._painFormat];
        this._paymentInfo = [];
        this._xmlVersion = DEFAULT_XML_VERSION;
        this._xmlEncoding = DEFAULT_XML_ENCODING;
        this.grpHdr = new SepaGroupHeader(this._painFormat);
    }

    addPaymentInfo(pi: SepaPaymentInfo) {
        if (!(pi instanceof SepaPaymentInfo)) {
            throw new Error('Given payment is not member of the PaymentInfo class');
        }

        if (pi.id) {
            pi.id = this.grpHdr.id + ID_SEPARATOR + pi.id;
        } else {
            pi.id = this.grpHdr.id + ID_SEPARATOR + this._paymentInfo.length;
        }
        this._paymentInfo.push(pi);
    }

    createPaymentInfo() {
        return new SepaPaymentInfo(this._painFormat);
    }

    normalize() {
        let controlSum = 0;
        let txCount = 0;
        for (let i = 0, l = this._paymentInfo.length; i < l; ++i) {
            this._paymentInfo[i].normalize();
            controlSum += this._paymentInfo[i].controlSum;
            txCount += this._paymentInfo[i].transactionCount;
        }
        this.grpHdr.controlSum = controlSum;
        this.grpHdr.transactionCount = txCount;
    }

    toXML() {
        this.normalize();

        const docNS = XSI_NS + this._painFormat;
        const doc = createDocument(docNS, 'Document');
        const body = doc.documentElement;

        body.setAttribute('xmlns:xsi', XSI_NAMESPACE);
        body.setAttribute('xsi:schemaLocation', XSI_NS + this._painFormat + ' ' + this._painFormat + '.xsd');
        const rootElement = doc.createElementNS(docNS, this._type);
        rootElement.appendChild(this.grpHdr.toXML(doc));
        for (let i = 0, l = this._paymentInfo.length; i < l; ++i) {
            rootElement.appendChild(this._paymentInfo[i].toXML(doc));
        }

        doc.documentElement.appendChild(rootElement);
        return doc;
    }

    toString() {
        const doc = this.toXML();
        const docDeclaration = '<?xml version="' + this._xmlVersion + '" encoding="' + this._xmlEncoding + '"?>';
        return docDeclaration + serializeToString(doc);
    }
}

  var PaymentInfoTypes = {
    DirectDebit: 'DD',
    Transfer:    'TRF'
  };

  /**
   * Wrapper class for the SEPA <PmtInf> Element
   */
  function SepaPaymentInfo(painFormat) {
    this._painFormat = painFormat;
    this.method = painFormat.indexOf('pain.001') === 0 ? PaymentInfoTypes.Transfer : PaymentInfoTypes.DirectDebit;
    this._payments = [];
  }

  SepaPaymentInfo.PaymentInfoTypes = PaymentInfoTypes;

  SepaPaymentInfo.prototype = {
    _painFormat: null,

    /** Transaction array */
    _payments: null,

    id: '',

    /** SEPA payment method. */
    method: null,

    /** If true, booking will appear as one entry on your statement */
    batchBooking: false,

    /** Grouping, defines structure handling for XML file */
    grouping: 'MIXD',

    /** Sum of all payments, will be automatically set */
    controlSum: 0,

    /* Instrumentation code:
     * 'CORE' - Standard Transfer
     * 'COR1' - Expedited Transfer
     * 'B2B'  - Business Transfer
     */
    localInstrumentation: 'CORE',

    /**
     * 'FRST' - First transfer
     * 'RCUR' - Subsequent transfer
     * 'OOFF' - One Off transfer
     * 'FNAL' - Final transfer
     */
    sequenceType: 'FRST',

    /** Requested collection date */
    collectionDate: null,

    /** Execution date of the SEPA order */
    requestedExecutionDate: null,

    /** Id assigned to the creditor */
    creditorId: '',

    /** Name, Address, IBAN and BIC of the creditor */
    creditorName: '',
    creditorStreet: null,
    creditorCity: null,
    creditorCountry: null,
    creditorIBAN: '',
    creditorBIC: '',

    /** Id assigned to the debtor for Transfer payments */
    debtorId: '',

    /** Name, Address, IBAN and BIC of the debtor */
    debtorName: '',
    debtorStreet: null,
    debtorCity: null,
    debtorCountry: null,
    debtorIBAN: '',
    debtorBIC: '',

    /** SEPA order priority, can be HIGH or NORM */
    instructionPriority: 'NORM',

    /** Number of transactions in this payment info block */
    get transactionCount() {
      return this._payments.length;
    },

    /**
     * Normalize fields like the control sum or transaction count. This will
     * _NOT_ be called when serialized to XML and must be called manually.
     */
    normalize: function() {
      var controlSum = 0;
      for (var i = 0, l = this._payments.length; i < l; ++i) {
        controlSum += this._payments[i].amount;
      }
      this.controlSum = controlSum;
    },

    /**
     * Adds a transaction to this payment. The transaction id will be prefixed
     * by the payment info id.
     *
     * @param pmt       The Transacation to add.
     */
    addTransaction: function(pmt) {
      if (!(pmt instanceof SepaTransaction)) {
        throw new Error('Given Transaction is not member of the SepaTransaction class');
      }

      if (pmt.id) {
        pmt.id = this.id + ID_SEPARATOR + pmt.id;
      } else {
        pmt.id = this.id + ID_SEPARATOR + this._payments.length;
      }
      this._payments.push(pmt);
    },

    createTransaction: function() {
      return new SepaTransaction(this._painFormat);
    },

    validate: function() {
      // TODO consider using getters/setters instead
      var pullFrom = this.method === PaymentInfoTypes.DirectDebit ? 'creditor' : 'debtor';

      assert_fixed(this.localInstrumentation, ['CORE', 'COR1', 'B2B'], 'localInstrumentation');
      assert_fixed(this.sequenceType, ['FRST', 'RCUR', 'OOFF', 'FNAL'], 'sequenceType');

      if (this.method === PaymentInfoTypes.DirectDebit) {
        assert_date(this.collectionDate, 'collectionDate');
      }
      else {
        assert_date(this.requestedExecutionDate, 'requestedExecutionDate');
      }

      if (this[pullFrom + 'Id']) {
        assert_cid(this[pullFrom + 'Id'], pullFrom + 'Id');
      }

      assert_length(this[pullFrom + 'Name'], null, 70, pullFrom + 'Name');
      assert_length(this[pullFrom + 'Street'], null, 70, pullFrom + 'Street');
      assert_length(this[pullFrom + 'City'], null, 70, pullFrom + 'City');
      assert_length(this[pullFrom + 'Country'], null, 2, pullFrom + 'Country');
      assert_iban(this[pullFrom + 'IBAN'], pullFrom + 'IBAN');
      assert_length(this[pullFrom + 'BIC'], [0,8,11], pullFrom + 'BIC');
      var countryMatches = (this[pullFrom + 'BIC'].length === 0 || this[pullFrom + 'BIC'].substr(4, 2) === this[pullFrom + 'IBAN'].substr(0, 2));
      assert(countryMatches, 'country mismatch in BIC/IBAN');

      assert_length(this._payments.length, 1, null, '_payments');
    },

    /*
     * Serialize this document to a DOM Element.
     *
     * @return      The DOM <PmtInf> Element.
     */
    toXML: function(doc) {
      if (VALIDATIONS_ENABLED) {
        this.validate();
      }

      var n = createXMLHelper(doc, true, false);
      //var o = createXMLHelper(doc, false, true);
      var r = createXMLHelper(doc, true, true);
      var pmtInf = doc.createElementNS(doc.documentElement.namespaceURI, 'PmtInf');

      r(pmtInf, 'PmtInfId', this.id);
      r(pmtInf, 'PmtMtd', this.method);
      // XML v3 formats, add grouping + batch booking nodes
      if (getPainXMLVersion(this._painFormat) >= 3) {
        r(pmtInf, 'BtchBookg', this.batchBooking.toString());
        r(pmtInf, 'NbOfTxs', this.transactionCount);
        r(pmtInf, 'CtrlSum', this.controlSum.toFixed(2));
      }

      var pmtTpInf = n(pmtInf, 'PmtTpInf');
      r(pmtTpInf, 'SvcLvl', 'Cd', 'SEPA');

      if (this.method === PaymentInfoTypes.DirectDebit) {
        r(pmtTpInf, 'LclInstrm', 'Cd', this.localInstrumentation);
        r(pmtTpInf, 'SeqTp', this.sequenceType);
        r(pmtInf, 'ReqdColltnDt', this.collectionDate.toISOString().substr(0, 10));
      }
      else {
        if (getPainXMLVersion(this._painFormat) >= 8) {
          var reqdExctnDt = n(pmtInf, 'ReqdExctnDt');
          r(reqdExctnDt, 'Dt', this.requestedExecutionDate.toISOString().substr(0, 10));
        } else {
          r(pmtInf, 'ReqdExctnDt', this.requestedExecutionDate.toISOString().substr(0, 10));
        }
      }

      var pullFrom = this.method === PaymentInfoTypes.DirectDebit ? 'creditor' : 'debtor';
      var emitterNodeName = this.method === PaymentInfoTypes.DirectDebit ? 'Cdtr' : 'Dbtr';
      var emitter = n(pmtInf, emitterNodeName);

      r(emitter, 'Nm', this[pullFrom + 'Name']);

      if (this[pullFrom + 'Street'] && this[pullFrom + 'City'] && this[pullFrom + 'Country']) {
        var pstl = n(emitter, 'PstlAdr');
        r(pstl, 'Ctry', this[pullFrom + 'Country']);
        r(pstl, 'AdrLine', this[pullFrom + 'Street']);
        r(pstl, 'AdrLine', this[pullFrom + 'City']);
      }

      r(pmtInf, emitterNodeName + 'Acct', 'Id', 'IBAN', this[pullFrom + 'IBAN']);
      if (this[pullFrom + 'BIC']) {
        r(pmtInf, emitterNodeName + 'Agt', 'FinInstnId', getPainXMLVersion(this._painFormat) >= 8 ? 'BICFI' : 'BIC', this[pullFrom + 'BIC']);
      } else {
        r(pmtInf, emitterNodeName + 'Agt', 'FinInstnId', 'Othr', 'Id', 'NOTPROVIDED');
      }

      r(pmtInf, 'ChrgBr', 'SLEV');

      if (this.method === PaymentInfoTypes.DirectDebit) {
        var creditorScheme = n(pmtInf, 'CdtrSchmeId', 'Id', 'PrvtId', 'Othr');
        r(creditorScheme, 'Id', this.creditorId);
        r(creditorScheme, 'SchmeNm', 'Prtry', 'SEPA');
      }

      for (var i = 0, l = this._payments.length; i < l; ++i) {
        pmtInf.appendChild(this._payments[i].toXML(doc));
      }

      return pmtInf;
    },

    /**
     * Serialize this element to an XML string.
     *
     * @return      The XML string of this element.
     */
    toString: function() {
      return serializeToString(this.toXML());
    }
  };

  /**
   * Generic Transaction class
   */
  var TransactionTypes = {
    DirectDebit: 'DrctDbtTxInf',
    Transfer:    'CdtTrfTxInf'
  };



  // --- Various private functions follow --- //

  /** Assert that |cond| is true, otherwise throw an error with |msg| */
  function assert(cond, msg) {
    if (!cond) {
      throw new Error(msg);
    }
  }

  /** Assert that |val| is one of |choices| */
  function assert_fixed(val, choices, member) {
    if (choices.indexOf(val) < 0) {
      throw new Error(member + ' must have any value of: ' + choices.join(' ') + '(found: ' + val + ')');
    }
  }

  /** assert that |str| has a length between min and max (either may be null) */
  function assert_length(str, min, max, member) {
    if ((min !== null && str && str.length < min) ||
        (max !== null && str && str.length > max)) {
      throw new Error(member + ' has invalid string length, expected ' + min + ' < ' + str + ' < ' + max);
    }
  }

  /** assert that |num| is in the range between |min| and |max| */
  function assert_range(num, min, max, member) {
    if (num < min || num > max) {
      throw new Error(member + ' does not match range ' + min + ' < ' + num + ' < ' + max);
    }
  }

  /** assert that |str| is an IBAN */
  function assert_iban(str,  member) {
    if (!validateIBAN(str)) {
      throw new Error(member + ' has invalid IBAN "' + str + '"');
    }
  }

  /** assert that |str| is a creditor id */
  function assert_cid(str, member) {
    if (!validateCreditorID(str)) {
      throw new Error(member + ' is invalid "' + str + '"');
    }
  }

  /** assert an iso date */
  function assert_date(dt, member) {
    if (!dt || isNaN(dt.getTime())) {
      throw new Error(member + ' has invalid date ' + dt);
    }
  }

  /**
   * Checks whether the given string is a valid SEPA id.
   *
   * @param {string} str - The id to check
   * @param {number} maxLength - The maximum length of the id
   * @param {string} member - The name of the field that is validated
   * @param {boolean} validateCharset - If the character set should be validated
   */
  function assert_valid_sepa_id(str, maxLength, member, validateCharset) {
    assert_length(str, null, maxLength, member);

    if (validateCharset) {
      if (str && !str.match(/([A-Za-z0-9]|[+|?|/|\-|:|(|)|.|,|' ]){1,35}/)) {
        throw new Error(`${member} contains characters which are not in the SEPA character set (found: "${str}")`);
      }
    }

    if (str && str.length > 1 && str.charAt(0) === '/') {
      throw new Error(`${member} is an id and hence must not start with a "/". (found "${str}"`);
    }

    if (str && str.match(/\/\//)) {
      throw new Error(`${member} is an id and hence must not contain "//". (found "${str}"`);
    }
  }


  // --- Module Exports follow --- //

  export validateIBAN           ;
  export checksumIBAN          
  export validateCreditorID     
  export checksumCreditorID     
  export setIDSeparator         
  export enableValidations     


