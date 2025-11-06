import moment from "moment-timezone";

export const getCurrentUserTimeZone = () => {
  return moment.tz.guess();
};

export const getGmtOffset = () => {
  const offset = new Date().getTimezoneOffset();
  const absOffset = Math.abs(offset);
  return (
      (offset < 0 ? "+" : "-") +
      String(Math.floor(absOffset / 60)).padStart(2, "0") +
      ":" +
      String(absOffset % 60).padStart(2, "0")
  );
};

export const getCurrentDateAndTimeInUtc = () => {
  return moment.utc(getCurrentDateAndTimeInLocal()).format();
};

export const getCurrentDateAndTimeInLocal = () => {
  return new Date();
};

export const getCurrentDateAndTimeInIsoFormat = () => {
  return new Date().toISOString();
};

export const getCurrentDayStartDateWithTimeInUtc = () => {
  const start = moment.tz(moment.tz.guess()).startOf("day").utc();
  return start.toISOString();
};

export const getCurrentDayEndDateWithTimeInUtc = () => {
  const end = moment.tz(moment.tz.guess()).endOf("day").utc();
  return end.toISOString();
};

export const getAnyDayStartDateWithTimeInUtc = (date) => {
  const m = moment.tz(date, "YYYY-MM-DD", getCurrentUserTimeZone());
  const start = m.clone().startOf("day").utc();
  return start.toISOString();
};

export const getAnyDayEndDateWithTimeInUtc = (date) => {
  const m = moment.tz(date, "YYYY-MM-DD", getCurrentUserTimeZone());
  const end = m.clone().endOf("day").utc();
  return end.toISOString();
};

export const getUtcDateAndTimeFromCalendar = (date_GMT) => {
  const dateObj = new Date(date_GMT);
  const utcEnd = moment(dateObj, "YYYY-MM-DDTHH:mm").utc().format();
  return utcEnd;
};

export const getIsoObjInZeroFormat = () => {
  const localDate = new Date();
  const timestamp = localDate.getTime() - localDate.getTimezoneOffset() * 60000;
  const correctDate = new Date(timestamp);
  correctDate.setUTCHours(0, 0, 0, 0);
  return correctDate.toISOString();
};

export const getCurrentStartDate = () => {
  const now = new Date();
  return moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
};

export const getCurrentEndDate = () => {
  return moment(getCurrentStartDate()).add(1, "days").subtract(1, "seconds");
};
