"use strict";

let fileUtils = require("././util/fileUtils");
let stringUtils = require("././util/stringUtils");
let jsonUtils = require("././util/jsonUtils");
let moment = require("moment");
const crypto = require('crypto')
const newLine = /\r?\n/;
const defaultFieldDelimiter = ";";

const joinMergeField = (srcObject, configObj) => {
  if (!srcObject || !configObj) {
    //console.log("srcObject or configObj empty");
    return srcObject;
  }
  let jsonObject = JSON.parse(JSON.stringify(srcObject));

  if (typeof configObj != "boolean" && typeof configObj == "object") {
    let { inputsFieldKeys, newField, method, delimiter } = configObj;
    let allowMethodsjoinField = [
      "join",
      "sum",
      "multiply",
      "divide",
    ];
    if (
      inputsFieldKeys &&
      Array.isArray(inputsFieldKeys) &&
      inputsFieldKeys.length >= 2
    ) {
      let choicemethod =
        method && allowMethodsjoinField.includes(allowMethodsjoinField)
          ? method
          : "join";
      let errorJoin = false;
      inputsFieldKeys.forEach((keyjoin) => {
        if (!jsonObject.hasOwnProperty(keyjoin)) {
          //console.log("keyjoin error didnt have key", keyjoin);
          errorJoin = true;
        }
      });
      if (!errorJoin) {
        if (choicemethod == "sum") {
          let resSum = 0;
          inputsFieldKeys.forEach((keyjoin) => {
            let typ = parseFloat(jsonObject[keyjoin]);
            let typr = !Number.isNaN(typ) && Number.isFinite(typ) ? typ : 0;
            resSum = resSum + typr;
          });
          if (newField && typeof newField == "string") {
            jsonObject[newField] = resSum;
          }
        }else if(choicemethod == "multiply"){
          let resSum = 0;
          inputsFieldKeys.forEach((keyjoin) => {
            let typ = parseFloat(jsonObject[keyjoin]);
            let typr = !Number.isNaN(typ) && Number.isFinite(typ) ? typ : 0;
            if(resSum == 0){
              resSum = typr;
            }else{
              resSum = resSum * typr;
            }            
          });
          if (newField && typeof newField == "string") {
            jsonObject[newField] = resSum;
          }
        }else if(choicemethod == "divide"){
          let resSum = 0;
          inputsFieldKeys.forEach((keyjoin) => {
            let typ = parseFloat(jsonObject[keyjoin]);
            let typr = !Number.isNaN(typ) && Number.isFinite(typ) ? typ : 0;
            if(resSum == 0){
              resSum = typr;
            }else{
              resSum = resSum / typr;
            }
          });
          if (newField && typeof newField == "string") {
            jsonObject[newField] = resSum;
          }
        } else {
          delimiter = delimiter ? delimiter : "";
          let dtjoin = [];
          inputsFieldKeys.forEach((keyjoin) => {
            dtjoin.push(jsonObject[keyjoin]);
          });
          if (newField && typeof newField == "string") {
            jsonObject[newField] = dtjoin.join(delimiter);
          }
        }
        return jsonObject;
      }
      //console.log("error join find key");
      return jsonObject;
    }
    //console.log("inputsFieldKeys length under 2");
    return jsonObject;
  }
  //console.log("configObj boolean or not object");
  return jsonObject;
};

const renameFieldProject = (srcObject, configObj) => {
  if (!srcObject || !configObj) {
    //console.log("srcObject or configObj empty");
    return srcObject;
  }
  let jsonObject = JSON.parse(JSON.stringify(srcObject));

  let cfgKeys = Object.keys(configObj);
  let res = {};
  Object.keys(jsonObject).forEach((mn)=>{
    if(cfgKeys.includes(mn)){
      res[configObj[mn]] = jsonObject[mn];
    }else{
      res[mn] = jsonObject[mn];
    }
  })
  //console.log("configObj boolean or not object");
  return res;
};

const removeFieldProject = (srcObject, configObj) => {
  if (!srcObject || !configObj) {
    //console.log("srcObject or configObj empty");
    return srcObject;
  }
  let jsonObject = JSON.parse(JSON.stringify(srcObject));
  let res = {};
  Object.keys(jsonObject).forEach((mn)=>{
    if(!configObj.includes(mn)){
      res[mn] = jsonObject[mn];
    }
  })
  //console.log("configObj boolean or not object");
  return res;
};

const convertMomentMain = (jsonObject, configObj) => {
  if (!jsonObject || !configObj) {
    return jsonObject;
  }
  if (typeof configObj != "boolean" && typeof configObj == "object") {
    let cleanKeys = [];
    Object.keys(configObj).forEach((keyjs) => {
      if (Object.keys(jsonObject).includes(keyjs)) {
        cleanKeys.push(keyjs);
      }
    });
    cleanKeys.forEach((propertyName) => {
      let { targetformat, sourceformat, newfield } = configObj[propertyName];
      if (targetformat) {
        let convmoment = convertMoment({
          value: jsonObject[propertyName],
          targetformat: targetformat,
          sourceformat: sourceformat,
        });
        if (newfield) {
          let newfieldname =
            typeof newfield == "boolean"
              ? `${propertyName}MomentConvert`
              : newfield;
          jsonObject[newfieldname] = convmoment;
        }
        jsonObject[propertyName] = newfield
          ? stringUtils.getValueFormatByType(jsonObject[propertyName])
          : convmoment;
      } else {
        jsonObject[propertyName] = stringUtils.getValueFormatByType(
          jsonObject[propertyName]
        );
      }
    });
    return jsonObject;
  }
  return jsonObject;
};



const convertMoment = ({ value, targetformat, sourceformat = undefined }) => {
  let res;
  if (sourceformat) {
    if (targetformat == "unix") {
      let mdate = moment(value, sourceformat);
      res = Math.floor(mdate.utc().unix());
      //let jsdate = Date.parse(mdate.utc().toString());
      //res = Math.floor(jsdate/1000);
    } else if (targetformat == "seconds") {
      let scnd = moment.duration(value).asSeconds(); // 15
      res = scnd;
    } else {
      res = moment(value, sourceformat).format(targetformat);
    }
  } else {
    if (targetformat == "unix") {
      let mdate = moment(value);
      res = Math.floor(mdate.utc().unix());
      //let jsdate = Date.parse(mdate.utc().toString());
      //res = Math.floor(jsdate/1000);
    } else if (targetformat == "seconds") {
      let scnd = moment.duration(value).asSeconds(); // 15
      res = scnd;
    } else {
      res = moment(value).format(targetformat);
    }
  }
  return res;
};

const convertOthersMain = (jsonObject, configObj) => {
  if (!jsonObject || !configObj) {
    return jsonObject;
  }
  if (typeof configObj != "boolean" && typeof configObj == "object") {
    let cleanKeys = [];
    Object.keys(configObj).forEach((keyjs) => {
      if (Object.keys(jsonObject).includes(keyjs)) {
        cleanKeys.push(keyjs);
      }
    });
    cleanKeys.forEach((propertyName) => {
      let targetformat = configObj[propertyName];
      if (targetformat) {
        let convothers = jsonObject[propertyName];
        if(targetformat=="md5"){
          convothers = crypto.createHash('md5').update(convothers).digest("hex");
        }
        jsonObject[propertyName] = convothers;
      } else {
        jsonObject[propertyName] = stringUtils.getValueFormatByType(
          jsonObject[propertyName]
        );
      }
    });
    return jsonObject;
  }
  return jsonObject;
};

class CsvToJson {
  formatValueByType(active) {
    this.printValueFormatByType = active;
    return this;
  }

  addCustomField(arrayOfKeyValue) {
    this.addCustomFieldActive = arrayOfKeyValue;
    return this;
  }

  removeField(arrayOfKeyValue) {
    this.removeFieldActive = arrayOfKeyValue;
    return this;
  }

  renameField(arrayOfKeyValue) {
    this.renameFieldActive = arrayOfKeyValue;
    return this;
  }

  joinField(active) {
    this.joinFieldActive = active;
    return this;
  }

  formatMoment(active) {
    this.formatMomentFieldActive = active;
    return this;
  }
  formatOthers(active) {
    this.formatOthersFieldActive = active;
    return this;
  }

  supportQuotedField(active) {
    this.isSupportQuotedField = active;
    return this;
  }

  fieldDelimiter(delimiter) {
    this.delimiter = delimiter;
    return this;
  }

  indexHeader(indexHeader) {
    if (isNaN(indexHeader)) {
      throw new Error("The index Header must be a Number!");
    }
    this.indexHeader = indexHeader;
    return this;
  }

  parseSubArray(delimiter = "*", separator = ",") {
    this.parseSubArrayDelimiter = delimiter;
    this.parseSubArraySeparator = separator;
  }

  encoding(encoding) {
    this.encoding = encoding;
    return this;
  }

  generateJsonFileFromCsv(fileInputName, fileOutputName) {
    let jsonStringified = this.getJsonFromCsvStringified(fileInputName);
    fileUtils.writeFile(jsonStringified, fileOutputName);
  }

  getJsonFromCsvStringified(fileInputName) {
    let json = this.getJsonFromCsv(fileInputName);
    let jsonStringified = JSON.stringify(json, undefined, 1);
    jsonUtils.validateJson(jsonStringified);
    return jsonStringified;
  }

  getJsonFromCsv(fileInputName) {
    let parsedCsv = fileUtils.readFile(fileInputName, this.encoding);
    return this.csvToJson(parsedCsv);
  }

  csvStringToJson(csvString) {
    return this.csvToJson(csvString);
  }

  csvToJson(parsedCsv) {
    this.validateInputConfig();
    let lines = parsedCsv.split(newLine);
    let fieldDelimiter = this.getFieldDelimiter();
    let index = this.getIndexHeader();
    let headers;

    if (this.isSupportQuotedField) {
      headers = this.split(lines[index]);
    } else {
      headers = lines[index].split(fieldDelimiter);
    }

    while (!stringUtils.hasContent(headers) && index <= lines.length) {
      index = index + 1;
      headers = lines[index].split(fieldDelimiter);
    }

    let jsonResult = [];
    for (let i = index + 1; i < lines.length; i++) {
      let currentLine;
      if (this.isSupportQuotedField) {
        currentLine = this.split(lines[i]);
      } else {
        currentLine = lines[i].split(fieldDelimiter);
      }
      if (stringUtils.hasContent(currentLine)) {
        let smtData = this.buildJsonResult(headers, currentLine);
        smtData = this.addCustomFieldActive
          ? {
              ...smtData,
              ...this.addCustomFieldActive,
            }
          : smtData;
        let sssjsonObject = joinMergeField(smtData, this.joinFieldActive);
        let xxxjsonObject = convertMomentMain(
          sssjsonObject,
          this.formatMomentFieldActive
        );      
        xxxjsonObject = convertOthersMain(
          xxxjsonObject,
          this.formatOthersFieldActive
        );  
        let resultfix = renameFieldProject(xxxjsonObject,this.renameFieldActive);
        resultfix = removeFieldProject(resultfix,this.removeFieldActive);
        jsonResult.push(resultfix);
      }
    }
    return jsonResult;
  }

  getFieldDelimiter() {
    if (this.delimiter) {
      return this.delimiter;
    }
    return defaultFieldDelimiter;
  }

  getIndexHeader() {
    if (this.indexHeader !== null && !isNaN(this.indexHeader)) {
      return this.indexHeader;
    }
    return 0;
  }

  buildJsonResult(headers, currentLine) {
    let jsonObject = {};
    for (let j = 0; j < headers.length; j++) {
      let propertyName = stringUtils.trimPropertyName(headers[j]);
      let value = currentLine[j];

      if (this.isParseSubArray(value)) {
        value = this.buildJsonSubArray(value);
      }

      if (this.printValueFormatByType && !Array.isArray(value)) {
        value = stringUtils.getValueFormatByType(currentLine[j]);
      }
      jsonObject[propertyName] = value;
    }

    return jsonObject;
  }

  buildJsonSubArray(value) {
    let extractedValues = value.substring(
      value.indexOf(this.parseSubArrayDelimiter) + 1,
      value.lastIndexOf(this.parseSubArrayDelimiter)
    );
    extractedValues.trim();
    value = extractedValues.split(this.parseSubArraySeparator);
    if (this.printValueFormatByType) {
      for (let i = 0; i < value.length; i++) {
        value[i] = stringUtils.getValueFormatByType(value[i]);
      }
    }
    return value;
  }

  isParseSubArray(value) {
    if (this.parseSubArrayDelimiter) {
      if (
        value &&
        value.indexOf(this.parseSubArrayDelimiter) === 0 &&
        value.lastIndexOf(this.parseSubArrayDelimiter) === value.length - 1
      ) {
        return true;
      }
    }
    return false;
  }

  validateInputConfig() {
    if (this.isSupportQuotedField) {
      if (this.getFieldDelimiter() === '"') {
        throw new Error(
          'When SupportQuotedFields is enabled you cannot defined the field delimiter as quote -> ["]'
        );
      }
      if (this.parseSubArraySeparator === '"') {
        throw new Error(
          'When SupportQuotedFields is enabled you cannot defined the field parseSubArraySeparator as quote -> ["]'
        );
      }
      if (this.parseSubArrayDelimiter === '"') {
        throw new Error(
          'When SupportQuotedFields is enabled you cannot defined the field parseSubArrayDelimiter as quote -> ["]'
        );
      }
    }
  }

  hasQuotes(line) {
    return line.includes('"');
  }

  split(line) {
    if (line.length == 0) {
      return [];
    }
    let delim = this.getFieldDelimiter();
    let subSplits = [""];
    if (this.hasQuotes(line)) {
      let chars = line.split("");

      let subIndex = 0;
      let startQuote = false;
      let isDouble = false;
      chars.forEach((c, i, arr) => {
        if (isDouble) {
          //when run into double just pop it into current and move on
          subSplits[subIndex] += c;
          isDouble = false;
          return;
        }

        if (c != '"' && c != delim) {
          subSplits[subIndex] += c;
        } else if (c == delim && startQuote) {
          subSplits[subIndex] += c;
        } else if (c == delim) {
          subIndex++;
          subSplits[subIndex] = "";
          return;
        } else {
          if (arr[i + 1] === '"') {
            //Double quote
            isDouble = true;
            //subSplits[subIndex] += c; //Skip because this is escaped quote
          } else {
            if (!startQuote) {
              startQuote = true;
              //subSplits[subIndex] += c; //Skip because we don't want quotes wrapping value
            } else {
              //end
              startQuote = false;
              //subSplits[subIndex] += c; //Skip because we don't want quotes wrapping value
            }
          }
        }
      });
      if (startQuote) {
        throw new Error("Row contains mismatched quotes!");
      }
      return subSplits;
    } else {
      return line.split(delim);
    }
  }
}

module.exports = new CsvToJson();
