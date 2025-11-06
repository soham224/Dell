export const convertToTitleCase = inputString => {
  return inputString?.split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function convertToReadableString(inputString) {
  // Check if the inputString is indeed a string
  if (typeof inputString !== "string") {
    return ""; // Return an empty string or some default value if input is not as expected
  }
  const words = inputString.split(/[_-]/);

  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

