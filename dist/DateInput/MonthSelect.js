"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = MonthSelect;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _mergeClassNames = _interopRequireDefault(require("merge-class-names"));

var _dateUtils = require("@wojtekmaj/date-utils");

var _dateFormatter = require("../shared/dateFormatter");

var _propTypes2 = require("../shared/propTypes");

var _utils = require("../shared/utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function MonthSelect(_ref) {
  var ariaLabel = _ref.ariaLabel,
      className = _ref.className,
      itemRef = _ref.itemRef,
      locale = _ref.locale,
      maxDate = _ref.maxDate,
      minDate = _ref.minDate,
      _ref$placeholder = _ref.placeholder,
      placeholder = _ref$placeholder === void 0 ? '--' : _ref$placeholder,
      _short = _ref["short"],
      value = _ref.value,
      year = _ref.year,
      otherProps = _objectWithoutProperties(_ref, ["ariaLabel", "className", "itemRef", "locale", "maxDate", "minDate", "placeholder", "short", "value", "year"]);

  var maxMonth = (0, _utils.min)(12, maxDate && year === (0, _dateUtils.getYear)(maxDate) && (0, _dateUtils.getMonthHuman)(maxDate));
  var minMonth = (0, _utils.max)(1, minDate && year === (0, _dateUtils.getYear)(minDate) && (0, _dateUtils.getMonthHuman)(minDate));

  var dates = _toConsumableArray(Array(12)).map(function (el, index) {
    return new Date(2019, index, 1);
  });

  var name = 'month';
  var formatter = _short ? _dateFormatter.formatShortMonth : _dateFormatter.formatMonth;
  return _react["default"].createElement("select", _extends({
    "aria-label": ariaLabel,
    className: (0, _mergeClassNames["default"])("".concat(className, "__input"), "".concat(className, "__").concat(name)),
    name: name,
    ref: function ref(_ref2) {
      if (itemRef) {
        itemRef(_ref2, name);
      }
    },
    value: value !== null ? value : ''
  }, otherProps), !value && _react["default"].createElement("option", {
    value: ""
  }, placeholder), dates.map(function (date) {
    var month = (0, _dateUtils.getMonthHuman)(date);
    var disabled = month < minMonth || month > maxMonth;
    return _react["default"].createElement("option", {
      key: month,
      disabled: disabled,
      value: month
    }, formatter(locale, date));
  }));
}

MonthSelect.propTypes = {
  ariaLabel: _propTypes["default"].string,
  className: _propTypes["default"].string.isRequired,
  disabled: _propTypes["default"].bool,
  itemRef: _propTypes["default"].func,
  locale: _propTypes["default"].string,
  maxDate: _propTypes2.isMaxDate,
  minDate: _propTypes2.isMinDate,
  onChange: _propTypes["default"].func,
  onKeyDown: _propTypes["default"].func,
  onKeyUp: _propTypes["default"].func,
  placeholder: _propTypes["default"].string,
  required: _propTypes["default"].bool,
  "short": _propTypes["default"].bool,
  value: _propTypes["default"].number,
  year: _propTypes["default"].number
};