export const dateTimeFormatter = (c) => {
  if (c)
    return new Date(c).toLocaleString("default", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  else return "NA";
};
