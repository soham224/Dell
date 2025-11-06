const  getSelectedDateTimeDefaultValueForRange = (selectedOption) => {
    let selectedOptionInDigit = "";
    switch (selectedOption) {
        case 0:
            selectedOptionInDigit = 0;
            break;
        case 1:
            selectedOptionInDigit = 1;
            break;
        case 2:
            selectedOptionInDigit = 5;
            break;
        case 3:
            selectedOptionInDigit = 6;
            break;
        case 4:
            selectedOptionInDigit = 2;
            break;
        case 5:
            selectedOptionInDigit = 7;
            break;
        case 6:
            selectedOptionInDigit = 3;
            break;
        case 7:
            selectedOptionInDigit = 8;
            break;
        case 8:
            selectedOptionInDigit = 8;
            break;
        case 9:
            selectedOptionInDigit = 9;
            break;
        case 10:
            selectedOptionInDigit = 4;
            break;
        case 11:
            selectedOptionInDigit = 10;
            break;
        case 12:
            selectedOptionInDigit = 12;
            break;
        case 13:
            selectedOptionInDigit = 13;
            break;
        case 14:
            selectedOptionInDigit = 11;
            break;
        default:
            selectedOptionInDigit = 3;
    }
    return selectedOptionInDigit;
}

export  default getSelectedDateTimeDefaultValueForRange;