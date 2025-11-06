const getSelectedDateTimeDefaultValue = (selectedOption) => {
    let selectedOptionInDigit = "";
    switch (selectedOption) {
        case "Today":
            selectedOptionInDigit = "0";
            break;
        case "Yesterday":
            selectedOptionInDigit = "1";
            break;
        case "Last 7 Days":
            selectedOptionInDigit = "2";
            break;
        case "Last 30 Days":
            selectedOptionInDigit = "3";
            break;
        case "Current Month":
            selectedOptionInDigit = "4";
            break;
        case "Last Month":
            selectedOptionInDigit = "5";
            break;
        case "Current Quarter":
            selectedOptionInDigit = "6";
            break;
        case "Last Quarter":
            selectedOptionInDigit = "7";
            break;
        case "Current 6 Month":
            selectedOptionInDigit = "8";
            break;
        case "Last 6 Month":
            selectedOptionInDigit = "9";
            break;
        case "Current Year":
            selectedOptionInDigit = "10";
            break;
        case "Last Year":
            selectedOptionInDigit = "11";
            break;
        case "All":
            selectedOptionInDigit = "12";
            break;
        case "Custom Range":
            selectedOptionInDigit = "13";
            break;
        case "Last 12 Month":
                selectedOptionInDigit = "14";
            break;
        default:
            selectedOptionInDigit = "3";
    }
    return selectedOptionInDigit;
}
export default getSelectedDateTimeDefaultValue;