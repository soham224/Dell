export const defaultSorted = [{ dataField: "id", order: "asc" }];
export const sizePerPageList = [
  { text: "3", value: 3 },
  { text: "5", value: 5 },
  { text: "10", value: 10 },
];
export const initialFilter = {
  sortOrder: "asc", // asc||desc
  sortField: "id",
  pageNumber: 1,
  pageSize: 10,
};

// Define outside the component or with useCallback if needed
export const customSelectTheme = (theme) => ({
  ...theme,
  borderRadius: 0,
  colors: {
    ...theme.colors,
    primary25: "#5DBFC4",
    primary: "#147b82"
  }
});


export const boundBoxOptions = {
    colors: {
        normal: "red",
        selected: "red",
        unselected: "red"
    },
    style: {
        maxWidth: "100%",
        maxHeight: "90vh",
        margin: "auto"
    }
};