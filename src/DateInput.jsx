import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { polyfill } from 'react-lifecycles-compat';
import { getYear, getMonthHuman, getDate } from '@wojtekmaj/date-utils';

import Divider from './Divider';
import DayInput from './DateInput/DayInput';
import MonthInput from './DateInput/MonthInput';
import MonthSelect from './DateInput/MonthSelect';
import YearInput from './DateInput/YearInput';
import NativeInput from './DateInput/NativeInput';

import { getFormatter } from './shared/dateFormatter';
import {
  getBegin,
  getEnd,
} from './shared/dates';
import { isMaxDate, isMinDate } from './shared/propTypes';
import { between } from './shared/utils';

const defaultMinDate = new Date(-8.64e15);
const defaultMaxDate = new Date(8.64e15);
const allViews = ['century', 'decade', 'year', 'month'];
const allValueTypes = [...allViews.slice(1), 'day'];

function datesAreDifferent(date1, date2) {
  return (
    (date1 && !date2)
    || (!date1 && date2)
    || (date1 && date2 && date1.getTime() !== date2.getTime())
  );
}

/**
 * Returns value type that can be returned with currently applied settings.
 */
function getValueType(maxDetail) {
  return allValueTypes[allViews.indexOf(maxDetail)];
}

function getValueFromRange(valueOrArrayOfValues, index) {
  if (Array.isArray(valueOrArrayOfValues)) {
    return valueOrArrayOfValues[index];
  }

  return valueOrArrayOfValues;
}

function parseAndValidateDate(rawValue) {
  if (!rawValue) {
    return null;
  }

  const valueDate = new Date(rawValue);

  if (isNaN(valueDate.getTime())) {
    throw new Error(`Invalid date: ${rawValue}`);
  }

  return valueDate;
}

function getValueFrom(value) {
  const valueFrom = getValueFromRange(value, 0);

  return parseAndValidateDate(valueFrom);
}

function getDetailValueFrom(value, minDate, maxDate, maxDetail) {
  const valueFrom = getValueFrom(value);

  if (!valueFrom) {
    return null;
  }

  const detailValueFrom = getBegin(getValueType(maxDetail), valueFrom);

  return between(detailValueFrom, minDate, maxDate);
}

function getValueTo(value) {
  const valueTo = getValueFromRange(value, 1);

  return parseAndValidateDate(valueTo);
}

function getDetailValueTo(value, minDate, maxDate, maxDetail) {
  const valueTo = getValueTo(value);

  if (!valueTo) {
    return null;
  }

  const detailValueTo = getEnd(getValueType(maxDetail), valueTo);

  return between(detailValueTo, minDate, maxDate);
}

function getDetailValueArray(value, minDate, maxDate, maxDetail) {
  if (value instanceof Array) {
    return value;
  }

  return [
    getDetailValueFrom(value, minDate, maxDate, maxDetail),
    getDetailValueTo(value, minDate, maxDate, maxDetail),
  ];
}

function isValidInput(element) {
  return element.tagName === 'INPUT' && element.type === 'number';
}

function findInput(element, property) {
  let nextElement = element;
  do {
    nextElement = nextElement[property];
  } while (nextElement && !isValidInput(nextElement));
  return nextElement;
}

function focus(element) {
  if (element) {
    element.focus();
  }
}

function renderCustomInputs(placeholder, elementFunctions, allowMultipleInstances) {
  const usedFunctions = [];
  const pattern = new RegExp(
    Object.keys(elementFunctions).map(el => `${el}+`).join('|'), 'g',
  );
  const matches = placeholder.match(pattern);

  return placeholder.split(pattern)
    .reduce((arr, element, index) => {
      const divider = element && (
        // eslint-disable-next-line react/no-array-index-key
        <Divider key={`separator_${index}`}>
          {element}
        </Divider>
      );
      const res = [...arr, divider];
      const currentMatch = matches && matches[index];

      if (currentMatch) {
        const renderFunction = (
          elementFunctions[currentMatch]
          || elementFunctions[
            Object.keys(elementFunctions)
              .find(elementFunction => currentMatch.match(elementFunction))
          ]
        );

        if (!allowMultipleInstances && usedFunctions.includes(renderFunction)) {
          res.push(currentMatch);
        } else {
          res.push(renderFunction(currentMatch, index));
          usedFunctions.push(renderFunction);
        }
      }
      return res;
    }, []);
}

export default class DateInput extends PureComponent {
  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      minDate, maxDate, maxDetail,
    } = nextProps;

    const nextState = {};

    /**
     * If isCalendarOpen flag has changed, we have to update it.
     * It's saved in state purely for use in getDerivedStateFromProps.
     */
    if (nextProps.isCalendarOpen !== prevState.isCalendarOpen) {
      nextState.isCalendarOpen = nextProps.isCalendarOpen;
    }

    /**
     * If the next value is different from the current one  (with an exception of situation in
     * which values provided are limited by minDate and maxDate so that the dates are the same),
     * get a new one.
     */
    const nextValue = getDetailValueFrom(nextProps.value, minDate, maxDate, maxDetail);
    const values = [nextValue, prevState.value];
    if (
      // Toggling calendar visibility resets values
      nextState.isCalendarOpen // Flag was toggled
      || datesAreDifferent(
        ...values.map(value => getDetailValueFrom(value, minDate, maxDate, maxDetail)),
      )
      || datesAreDifferent(
        ...values.map(value => getDetailValueTo(value, minDate, maxDate, maxDetail)),
      )
    ) {
      if (nextValue) {
        nextState.year = getYear(nextValue);
        nextState.month = getMonthHuman(nextValue);
        nextState.day = getDate(nextValue);
      } else {
        nextState.year = null;
        nextState.month = null;
        nextState.day = null;
      }
      nextState.value = nextValue;
    }

    return nextState;
  }

  state = {
    year: null,
    month: null,
    day: null,
  };

  get formatDate() {
    const { maxDetail } = this.props;

    const options = { year: 'numeric' };
    const level = allViews.indexOf(maxDetail);
    if (level >= 2) {
      options.month = 'numeric';
    }
    if (level >= 3) {
      options.day = 'numeric';
    }

    return getFormatter(options);
  }

  // eslint-disable-next-line class-methods-use-this
  get formatNumber() {
    const options = { useGrouping: false };

    return getFormatter(options);
  }

  /**
   * Gets current value in a desired format.
   */
  getProcessedValue(value) {
    const {
      minDate, maxDate, maxDetail, returnValue,
    } = this.props;

    switch (returnValue) {
      case 'start':
        return getDetailValueFrom(value, minDate, maxDate, maxDetail);
      case 'end':
        return getDetailValueTo(value, minDate, maxDate, maxDetail);
      case 'range':
        return getDetailValueArray(value, minDate, maxDate, maxDetail);
      default:
        throw new Error('Invalid returnValue.');
    }
  }

  get divider() {
    return this.placeholder.match(/[^0-9a-z]/i)[0];
  }

  get placeholder() {
    const { format, locale } = this.props;

    if (format) {
      return format;
    }

    const year = 2017;
    const monthIndex = 11;
    const day = 11;

    const date = new Date(year, monthIndex, day);

    return (
      this.formatDate(locale, date)
        .replace(this.formatNumber(locale, year), 'y')
        .replace(this.formatNumber(locale, monthIndex + 1), 'M')
        .replace(this.formatNumber(locale, day), 'd')
    );
  }

  get commonInputProps() {
    const {
      className,
      disabled,
      isCalendarOpen,
      maxDate,
      minDate,
      required,
    } = this.props;

    return {
      className,
      disabled,
      maxDate: maxDate || defaultMaxDate,
      minDate: minDate || defaultMinDate,
      onChange: this.onChange,
      onKeyDown: this.onKeyDown,
      onKeyUp: this.onKeyUp,
      // This is only for showing validity when editing
      required: required || isCalendarOpen,
      itemRef: (ref, name) => {
        // Save a reference to each input field
        this[`${name}Input`] = ref;
      },
    };
  }

  get valueType() {
    const { maxDetail } = this.props;

    return getValueType(maxDetail);
  }

  onClick = (event) => {
    if (event.target === event.currentTarget) {
      // Wrapper was directly clicked
      const firstInput = event.target.children[1];
      focus(firstInput);
    }
  }

  onKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case this.divider: {
        event.preventDefault();

        const { target: input } = event;
        const property = event.key === 'ArrowLeft' ? 'previousElementSibling' : 'nextElementSibling';
        const nextInput = findInput(input, property);
        focus(nextInput);
        break;
      }
      default:
    }
  }

  onKeyUp = (event) => {
    const { key, target: input } = event;

    const isNumberKey = !isNaN(parseInt(key, 10));

    if (!isNumberKey) {
      return;
    }

    const { value } = input;
    const max = parseInt(input.getAttribute('max'), 10);

    /**
     * Given 1, the smallest possible number the user could type by adding another digit is 10.
     * 10 would be a valid value given max = 12, so we won't jump to the next input.
     * However, given 2, smallers possible number would be 20, and thus keeping the focus in
     * this field doesn't make sense.
     */
    if (value * 10 > max) {
      const property = 'nextElementSibling';
      const nextInput = findInput(input, property);
      focus(nextInput);
    }
  }

  /**
   * Called when non-native date input is changed.
   */
  onChange = (event) => {
    const { name, value } = event.target;

    this.setState(
      { [name]: value ? parseInt(value, 10) : null },
      this.onChangeExternal,
    );
  }

  /**
   * Called when native date input is changed.
   */
  onChangeNative = (event) => {
    const { onChange } = this.props;
    const { value } = event.target;

    if (!onChange) {
      return;
    }

    const processedValue = (() => {
      if (!value) {
        return null;
      }

      const [yearString, monthString, dayString] = value.split('-');
      const year = parseInt(yearString, 10);
      const monthIndex = parseInt(monthString, 10) - 1 || 0;
      const date = parseInt(dayString, 10) || 1;

      return new Date(year, monthIndex, date);
    })();

    onChange(processedValue, false);
  }

  /**
   * Called after internal onChange. Checks input validity. If all fields are valid,
   * calls props.onChange.
   */
  onChangeExternal = () => {
    const { onChange } = this.props;

    if (!onChange) {
      return;
    }

    const formElements = [this.dayInput, this.monthInput, this.yearInput].filter(Boolean);

    const values = {};
    formElements.forEach((formElement) => {
      values[formElement.name] = formElement.value;
    });

    if (formElements.every(formElement => !formElement.value)) {
      onChange(null, false);
    } else if (
      formElements.every(formElement => formElement.value && formElement.checkValidity())
    ) {
      const year = parseInt(values.year, 10);
      const month = parseInt(values.month || 1, 10);
      const day = parseInt(values.day || 1, 10);

      const proposedValue = new Date(year, month - 1, day);
      const processedValue = this.getProcessedValue(proposedValue);
      onChange(processedValue, false);
    }
  }

  renderDay = (currentMatch, index) => {
    const {
      autoFocus,
      dayAriaLabel,
      dayPlaceholder,
      showLeadingZeros,
    } = this.props;
    const { day, month, year } = this.state;

    if (currentMatch && currentMatch.length > 2) {
      throw new Error(`Unsupported token: ${currentMatch}`);
    }

    const showLeadingZerosFromFormat = currentMatch && currentMatch.length === 2;

    return (
      <DayInput
        key="day"
        {...this.commonInputProps}
        ariaLabel={dayAriaLabel}
        autoFocus={index === 0 && autoFocus}
        month={month}
        placeholder={dayPlaceholder}
        showLeadingZeros={showLeadingZerosFromFormat || showLeadingZeros}
        value={day}
        year={year}
      />
    );
  }

  renderMonth = (currentMatch, index) => {
    const {
      autoFocus,
      locale,
      monthAriaLabel,
      monthPlaceholder,
      showLeadingZeros,
    } = this.props;
    const { month, year } = this.state;

    if (currentMatch && currentMatch.length > 4) {
      throw new Error(`Unsupported token: ${currentMatch}`);
    }

    if (currentMatch.length > 2) {
      return (
        <MonthSelect
          key="month"
          {...this.commonInputProps}
          ariaLabel={monthAriaLabel}
          autoFocus={index === 0 && autoFocus}
          locale={locale}
          placeholder={monthPlaceholder}
          short={currentMatch.length === 3}
          value={month}
          year={year}
        />
      );
    }

    const showLeadingZerosFromFormat = currentMatch && currentMatch.length === 2;

    return (
      <MonthInput
        key="month"
        {...this.commonInputProps}
        ariaLabel={monthAriaLabel}
        autoFocus={index === 0 && autoFocus}
        placeholder={monthPlaceholder}
        showLeadingZeros={showLeadingZerosFromFormat || showLeadingZeros}
        value={month}
        year={year}
      />
    );
  }

  renderYear = (currentMatch, index) => {
    const { autoFocus, yearAriaLabel, yearPlaceholder } = this.props;
    const { year } = this.state;

    return (
      <YearInput
        key="year"
        {...this.commonInputProps}
        ariaLabel={yearAriaLabel}
        autoFocus={index === 0 && autoFocus}
        placeholder={yearPlaceholder}
        value={year}
        valueType={this.valueType}
      />
    );
  }

  renderCustomInputs() {
    const { placeholder } = this;
    const { format } = this.props;

    const elementFunctions = {
      d: this.renderDay,
      M: this.renderMonth,
      y: this.renderYear,
    };

    const allowMultipleInstances = typeof format !== 'undefined';
    return renderCustomInputs(placeholder, elementFunctions, allowMultipleInstances);
  }

  renderNativeInput() {
    const {
      disabled,
      maxDate,
      minDate,
      name,
      nativeInputAriaLabel,
      required,
    } = this.props;
    const { value } = this.state;

    return (
      <NativeInput
        key="date"
        ariaLabel={nativeInputAriaLabel}
        disabled={disabled}
        maxDate={maxDate || defaultMaxDate}
        minDate={minDate || defaultMinDate}
        name={name}
        onChange={this.onChangeNative}
        required={required}
        value={value}
        valueType={this.valueType}
      />
    );
  }

  render() {
    const { className } = this.props;

    /* eslint-disable jsx-a11y/click-events-have-key-events */
    /* eslint-disable jsx-a11y/no-static-element-interactions */
    return (
      <div
        className={className}
        onClick={this.onClick}
      >
        {this.renderNativeInput()}
        {this.renderCustomInputs()}
      </div>
    );
  }
}

DateInput.defaultProps = {
  maxDetail: 'month',
  name: 'date',
  returnValue: 'start',
};

const isValue = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.instanceOf(Date),
]);

DateInput.propTypes = {
  autoFocus: PropTypes.bool,
  className: PropTypes.string.isRequired,
  dayAriaLabel: PropTypes.string,
  dayPlaceholder: PropTypes.string,
  disabled: PropTypes.bool,
  format: PropTypes.string,
  isCalendarOpen: PropTypes.bool,
  locale: PropTypes.string,
  maxDate: isMaxDate,
  maxDetail: PropTypes.oneOf(allViews),
  minDate: isMinDate,
  monthAriaLabel: PropTypes.string,
  monthPlaceholder: PropTypes.string,
  name: PropTypes.string,
  nativeInputAriaLabel: PropTypes.string,
  onChange: PropTypes.func,
  required: PropTypes.bool,
  returnValue: PropTypes.oneOf(['start', 'end', 'range']),
  showLeadingZeros: PropTypes.bool,
  value: PropTypes.oneOfType([
    isValue,
    PropTypes.arrayOf(isValue),
  ]),
  yearAriaLabel: PropTypes.string,
  yearPlaceholder: PropTypes.string,
};

polyfill(DateInput);
