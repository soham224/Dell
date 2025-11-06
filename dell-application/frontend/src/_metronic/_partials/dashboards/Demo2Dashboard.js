import React, {Component} from "react";
import {headerSortingClasses, sortCaret, toAbsoluteUrl} from "../../_helpers";
import {ReactSelectWrapper} from "../controls/forms/Select";
import SVG from "react-inlinesvg";
import {Form, OverlayTrigger, Tooltip} from "react-bootstrap";
import {
    getDiffEventsByCameraId,
    getFilterGraphData,
    getOneTableDataFromBar,
    getTotalCamerasByLocationId,
    getWidgetsDataForAdmin,
    getWidgetsDataForSuperuser,
    getWidgetsDataForSupervisor
} from "../../../app/Admin/modules/DashboardGraph/_redux";
import {connect} from "react-redux";
import * as auth from "../../../app/Admin/modules/Auth";
import BlockUi from "@availity/block-ui";
import {warningToast} from "../../../utils/ToastMessage";
import DashboardTable from "../../../app/Admin/modules/DashboardGraph/dashboardTable";
import {ADMIN_ROLE, SUPER_ADMIN_ROLE, SUPERVISOR_ROLE} from "../../../enums/constant";
import {
    getCurrentDateAndTimeInIsoFormat, getCurrentEndDate, getCurrentStartDate
} from "../../../utils/TimeZone";
import moment from "moment";
import {Button, CardBody, Col, Row} from "reactstrap";
import FormDateRangePicker from "../../../utils/dateRangePicker/FormDateRangePicker";
import getSelectedDateTimeDefaultValue from "../../../utils/dateRangePicker/dateFunctions";
import getSelectedDateTimeDefaultValueForRange from "../../../utils/dateRangePicker/dateRangeFunctions";
import {getEnabledLocationList} from "../../../app/Admin/modules/AddSupervisor/_redux";
import {
    getAllLabelsFromListOfCameraId, getResultForResultExcel
} from "../../../app/Admin/modules/Subscriptions/_redux/DeployedRTSPJobs/DeployedRTSPJobsApi";
import DropDownMatrialUi from "./dropDownMatrialUi";
import {Box, CardHeader, FormControl, Card} from "@mui/material";
import {withStyles} from "@mui/styles";
import DashboardGraph from "../../../app/Admin/modules/DashboardGraph/dashboardGraph";
import {convertToReadableString} from "../../../utils/stringConvert";
import {MyResultTableDashboard} from "./MyResultTableDashboard";
import {getResultMetadata, getResults} from "../../../app/Admin/modules/MyResults/_redux/MyResultApi";
import VisibilityIcon from '@mui/icons-material/Visibility';

const ActionFormatter = ({ row, openViewMyResultDialog }) => (
  <a
    title="Information"
    className="btn btn-icon btn-light btn-sm mx-3"
    onClick={() => openViewMyResultDialog(row._id.$oid, row)}
    style={{ cursor: "pointer" }}
  >
    <VisibilityIcon color="action" style={{ fontSize: "2rem", color: "#147b82" }} />
  </a>
);

function actionFormatter(openViewMyResultDialog) {
  return function(cell, row) {
    return <ActionFormatter row={row} openViewMyResultDialog={openViewMyResultDialog} />;
  };
}

const customStyles = {
    option: (styles, state) => ({
        ...styles, cursor: "pointer"
    }), control: styles => ({
        ...styles, cursor: "pointer"
    })
};

const styles = theme => ({
    root: {
        width: "54px", height: "24px", padding: "0px"
    }, switchBase: {
        color: "#818181", padding: "1px", "&$checked": {
            "& + $track": {
                backgroundColor: "#147b82"
            }
        }
    }, thumb: {
        color: "white", width: "25px", height: "22px", margin: "0px"
    }, track: {
        borderRadius: "20px", backgroundColor: "#147b82", opacity: "1 !important", "&:after, &:before": {
            color: "white", fontSize: "8px", fontWeight: "10px", position: "absolute", top: "7px"
        }, "&:after": {
            content: "'LABEL'", left: "5px"
        }, "&:before": {
            content: "'EVENT'", right: "2px"
        }
    }, checked: {
        color: "#23bf58 !important", transform: "translateX(26px) !important"
    }
});

let now = new Date();
let start = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
let end = moment(start)
    .add(1, "days")
    .subtract(1, "seconds");

const initJob = {label: "Select Model", value: 0};

const assignParams = (params, label, dashboardGraphName) => {
  if (dashboardGraphName === "Label") {
    params.selected_model_labels_list = label;
  } else {
    params.selected_event_list = label;
  }
};

const selectTheme = (theme) => ({
  ...theme,
  borderRadius: 0,
  cursor: "pointer",
  colors: {
    ...theme.colors,
    primary25: "#5DBFC4",
    primary: "#147b82",
  },
});

class Demo2Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            graphType: "column",
            graphDuration: "Monthly",
            modalOpen: false,
            showGraph: false,
            graphMessage: "No Data Found",
            widget: null,
            keys: [],
            title: [],
            widgeTitle: null,
            drilldownFromFun: false,
            startDateEndDateFlag: false,
            blocking: false,
            loadInitialGraphFlag: true,
            showBarTable: false,
            tableData: [],
            getTrue: false,
            cameraData: {},
            dashboardGraphName: "Label",
            currentTabOpenIndex: 0,
            startDate: getCurrentStartDate(),
            endDate: getCurrentEndDate(),
            minDate: "",
            maxDate: "",
            values: [],
            show: true,
            typeValue: 12,
            selectedIndex: 12,
            selectedDataSourceId: null,
            locationLoading: false,
            locationOptions: [],
            selectedLocation: [],
            selectedLocationValue: ['-1'],
            totalCamerasByLocationLoading: false,
            cameraOptions: [],
            camerasIds: [],
            selectedCamera: [],
            selectedCameraValue: ['-1'],
            labelLoading: false,
            labelOptions: [],
            selectedLabel: [],
            selectedLabelValue: '-1',
            loadAlldata: false,
            topspinHighchartData: [],
            mainLoading: false,
            topspinFlag: false,
            jobId: initJob,
            loadalldata: false,
            listLoading: false,
            isDownloading: false,
            pageParams: {pageSize: 10, totalPages: 0, totalCounts: 0},
            queryParams: {pageNumber: 1, pageSize: 10, sortField: null, sortOrder: null},
            currentItems: [],
            filterEntities: [],
            showModalResult: false,
            row: [],
            currentPage: 1,
            columns: [
                {
                dataField: "idx",
                text: "Index",
                sort: true,
                formatter: (cell, row, rowIndex) => rowIndex + 1 + ((this.state.queryParams.pageNumber - 1) * this.state.queryParams.pageSize)
            }, {
                dataField: "camera_name",
                text: "Camera Name",
                sort: true,
                formatter: (_, row) => row.camera_name,
                headerSortingClasses,
            }, {
                dataField: "count",
                text: "Count",
                sort: true,
                formatter: (_, row) => row?.result?.detection?.length || 0
            }, {
                dataField: "created_date.$date",
                text: "Created Date",
                sort: true,
                sortCaret,
                headerSortingClasses,
                formatter: (_, row) => moment.utc(row?.created_date.$date).local().format("MMMM DD YYYY, h:mm:ss a")
            }, {
                dataField: "labels", text: "Labels", sort: true, formatter: (_, row) => {
                    const labelKeys = Object.keys(row?.counts || {});
                    return labelKeys.map(label => convertToReadableString(label)).join(", ");
                }
            }, {
                dataField: "action", text: "Actions", formatter: actionFormatter(this.openViewMyResultDialog)
            }],
            cameraName: {},
            loading: true,
            xAxis: [],
            yAxis: [],

            listLoadingPeople: false,
            tableDataPeople:[],
            pageParamsPeople: {pageSize: 10, totalPages: 0, totalCounts: 0},
            queryParamsPeople: {pageNumber: 1, pageSize: 10, sortField: null, sortOrder: null},
            filterEntitiesPeople: [],
            columnsPeople: [
                {
                    dataField: "idx",
                    text: "Index",
                    sort: true,
                    formatter: (cell, row, rowIndex) => rowIndex + 1 + ((this.state.queryParamsPeople.pageNumber - 1) * this.state.queryParamsPeople.pageSize)
                }, {
                    dataField: "camera_name",
                    text: "Camera Name",
                    sort: true,
                    formatter: (_, row) => row.camera_name,
                    headerSortingClasses,
                }, {
                    dataField: "created_date.$date",
                    text: "Direction",
                    sort: true,
                    sortCaret,
                    headerSortingClasses,
                    formatter: (_, row) => moment.utc(row?.created_date.$date).local().format("MMMM DD YYYY, h:mm:ss a")
                }, {
                    dataField: "count",
                    text: " Count",
                    sort: true,
                    formatter: (_, row) => row?.result?.detection?.length || 0
                }, {
                    dataField: "count",
                    text: "People Total Count",
                    sort: true,
                    formatter: (_, row) => row?.result?.detection?.length || 0
                },
                {
                    dataField: "action", text: "Actions", formatter: actionFormatter(this.openViewMyResultDialog)
                }],
        };
    }

    componentDidMount() {
        this.getAllLocations();
        this.setState({
            allLabelFlag: true
        });
        const WidgetLabalAndValueParam = {
            start_date: this.state.startDate,
            end_date: this.state.endDate,
            current_date: getCurrentDateAndTimeInIsoFormat(),
            duration_type: "day",
            initial_graph: true,
            location_id: this.state.selectedLocationValue,
            camera_id: this.state.selectedCameraValue,
            selected_model_labels_list: this.state.selectedLabelValue,
        };

        this.setWidgetLabelAndValue(WidgetLabalAndValueParam);
        this.loadInitialGraph();
        this.getMyResultMetadata(moment.utc(this.state.startDate).format(), moment.utc(this.state.endDate).format())

    }

    setWidgetLabelAndValue = WidgetLabalAndValueParam => {
        const {user} = this.props;
        let userRole = user.roles[0].role;
        this.setState({
            widgetLoader: true
        });

        if (userRole === ADMIN_ROLE) {
            getWidgetsDataForAdmin(WidgetLabalAndValueParam)
                .then(response => {
                    let widgetData = response.data;
                    let arrayOrg = [];
                    Object.entries(widgetData).map(([key, value]) => {
                        arrayOrg.push(key);
                    });
                    let title = [];
                    let widgetFunData = this.formatWidgetData(arrayOrg, title);
                    this.setState({
                        widget: widgetData,
                        keys: widgetFunData.arrayData,
                        widgeTitle: widgetFunData.titleData,
                        widgetLoader: false
                    });
                })
                .catch(err => {
                    this.setState({
                        widgetLoader: false
                    });
                    console.log(err || "Something went wrong");
                });
        } else if (userRole === SUPERVISOR_ROLE) {
            this.setState({
                widgetLoader: true
            });
            getWidgetsDataForSupervisor(WidgetLabalAndValueParam)
                .then(response => {
                    let widgetData = response.data;
                    let arrayOrg = [];
                    Object.entries(widgetData).map(([key, value]) => {
                        arrayOrg.push(key);
                    });
                    let title = [];
                    let widgetFunData = this.formatWidgetData(arrayOrg, title);
                    this.setState({
                        widget: widgetData,
                        keys: widgetFunData.arrayData,
                        widgeTitle: widgetFunData.titleData,
                        widgetLoader: false
                    });
                })
                .catch(err => {
                    this.setState({
                        widgetLoader: false
                    });
                    console.log(err || "Something went wrong");
                });
        } else if (userRole === SUPER_ADMIN_ROLE) {
            this.setState({
                widgetLoader: true
            });
            getWidgetsDataForSuperuser(WidgetLabalAndValueParam)
                .then(response => {
                    let widgetData = response.data;
                    let arrayOrg = [];
                    Object.entries(widgetData).map(([key, value]) => {
                        arrayOrg.push(key);
                    });
                    let title = [];
                    let widgetFunData = this.formatWidgetData(arrayOrg, title);
                    this.setState({
                        widget: widgetData,
                        keys: widgetFunData.arrayData,
                        widgeTitle: widgetFunData.titleData,
                        widgetLoader: false
                    });
                })
                .catch(err => {
                    this.setState({
                        widgetLoader: false
                    });
                    console.log(err || "Something went wrong");
                });
        }
    };

    formatWidgetData = (arrayOrg, title) => {
        for (const wordOne of arrayOrg) {
            const words = wordOne.split("_");
            for (let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toUpperCase() + words[i].substr(1);
            }
            let joinedWord = words.join(" ");
            title.push(joinedWord);
        }
        return {titleData: title, arrayData: arrayOrg};
    };

    handleGraphChange = (value) => {
        this.setState({graphType: value});
    };

    loadInitialGraph = () => {
        const startDate = getCurrentStartDate();
        const endDate = getCurrentEndDate();

        this.setState({
            setFilterParameters: false,
            loadInitialGraphFlag: true,
            showBarTable: false,
            graphType: "column",
            drilldownFromFun: false,
            parameters: {},
            notice: false,
            pageParams: {pageSize: 10, totalPages: 0, totalCounts: 0},
            queryParams: {pageNumber: 1, pageSize: 10, sortField: null, sortOrder: null},
            startDate: startDate,
            endDate: endDate
        }, () => {
            this.setFilterParameters({
                start_date: startDate,
                end_date: endDate,
                current_date: getCurrentDateAndTimeInIsoFormat(),
                duration_type: "day",
                initial_graph: true,
                location_id: this.state.selectedLocationValue,
                camera_id: this.state.selectedCameraValue,
                selected_model_labels_list: this.state.selectedLabelValue,
            }, "Today's " + this.state.dashboardGraphName + " Data Analysis", false);
            this.getMyResultMetadata(moment.utc(startDate).format(), moment.utc(endDate).format())
        });
    };

    loadAllYearData = () => {
        this.setState({
            loadInitialGraphFlag: false,
            showBarTable: false,
            graphType: "column",
            drilldownFromFun: false,
            notice: false,
            loadAlldata: true,
            pageParams: {pageSize: 10, totalPages: 0, totalCounts: 0},
            queryParams: {pageNumber: 1, pageSize: 10, sortField: null, sortOrder: null},
        }, () => {
            this.handleLocationChange([{label: "All Location", value: '-1'}]);
        });

        this.setState({show: false});
        setTimeout(() => {
            this.setState({show: true});
        }, 100);
        this.getMyResultMetadata()
        this.setFilterParameters({
            camera_id: this.state.selectedCameraValue, duration_type: "month"
        }, this.state.dashboardGraphName + " Data Analysis", false);

        const WidgetLabalAndValueParam = {
            current_date: getCurrentDateAndTimeInIsoFormat(),
            location_id: this.state.selectedLocationValue,
            camera_id: this.state.selectedCameraValue,
            selected_model_labels_list: this.state.selectedLabelValue,
            duration_type: "day",
            initial_graph: true,
        };

        this.setWidgetLabelAndValue(WidgetLabalAndValueParam);
    };

    setFilterParameters = (parameters, title, drillApplied) => {
        this.setState({
            loading: true,
            xAxis: [],
            yAxis: [],
            showGraph: false,
            graphMessage: "Loading..."
        });

        const {user} = this.props;
        let userRole = user.roles[0].role;

        getFilterGraphData(parameters, userRole, this.state.dashboardGraphName)
            .then(response => {
                if (response && response.data.length > 0) {
                    this.handleGraphDataSuccess(response.data, parameters, title, drillApplied);
                } else {
                    this.handleGraphDataEmpty();
                }
            })
            .catch(err => {
                this.handleGraphDataError(err);
            });
    };

    handleGraphDataSuccess = (data, parameters, title, drillApplied) => {
        this.setState({ blocking: false });

        const { xAxis, series } = this.transformGraphData(data);

        let initialGraph = parameters.duration_type === "day";
        this.setState({
            xAxis,
            yAxis: series,
            blocking: false,
            startDateEndDateFlag: false,
            initialGraph,
            showGraph: true,
            title,
            parameters,
            drillApplied,
            loading: false,
            graphMessage: "No Data Found"
        });
    };

    transformGraphData = (data) => {
        let labelObj = data[0];
        let labels = Object.keys(labelObj).filter(key => key !== "_id");
        let series = labels.map(label => ({ name: label, data: [] }));
        let xAxis = data.map(graphObj => graphObj._id);

        labels.forEach(label => {
            data.forEach(obj1 => {
                let dataValue = obj1[label];
                let seriesItem = series.find(s => s.name === label);
                if (seriesItem) {
                    seriesItem.data.push({
                        name: label,
                        y: dataValue,
                        drilldown: true
                    });
                }
            });
        });

        return { labels, xAxis, series };
    };

    handleGraphDataEmpty = () => {
        this.setState({
            showGraph: false,
            graphMessage: "No Data Found",
            xAxis: [],
            yAxis: []
        });
    };

    handleGraphDataError = (err) => {
        console.log(err)
        this.setState({
            showGraph: false,
            graphMessage: "No Data Found",
            xAxis: [],
            yAxis: []
        });
    };

    setXAxisYAxisAfterDrilldown = (xAxis, yAxis, drilldown) => {
        this.setState({
            xAxis: xAxis, yAxis: yAxis, drilldownFromFun: drilldown
        });
    };

    displayDataTableFromBar = (uniqueId, labelName) => {
        if (uniqueId && uniqueId !== "") {
            this.setState({
                showBarTable: false, blocking: true
            });


            getOneTableDataFromBar(uniqueId, null, this.state.dashboardGraphName)
                .then(response => {
                    if (response && response.isSuccess) {
                        this.setState({
                            tableData: response.data
                        }, () => {
                            this.setState({
                                showBarTable: true, blocking: false
                            });
                        });
                    }
                })
                .catch(err => {
                    this.setState({
                        showBarTable: false, blocking: false
                    });
                    console.log(err || "Something went wrong");
                });
        } else {
            this.setState({
                showBarTable: false, blocking: false
            });
        }
    };


    dateTimeRangeChangeHandler = (startDate, endDate) => {
        this.setState({
            startDate: moment.utc(startDate).format(), endDate: moment.utc(endDate).format()
        });
    };

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.selectedIndex !== this.state.selectedIndex) {
            this.setState({
                selectedIndex: nextProps.selectedIndex
            });
        }
    }

    dateTimeRangeIndexChangeHandler = (rangeIndex, value) => {
        let dateVal = getSelectedDateTimeDefaultValue(value);
        let index = getSelectedDateTimeDefaultValueForRange(parseInt(dateVal, 10));
        let min = this.state.startDate;
        let max = this.state.endDate;
        let minDateNew = this.state.minDate;
        let maxDateNew = this.state.maxDate;
        if (parseInt(dateVal) === 12) {
            min = parseInt("defaultMin", 0);
            max = parseInt("defaultMax", 0);

            minDateNew = ["min"];
            maxDateNew = ["max"];
        }
        this.setState({
            typeValue: dateVal,
            selectedIndex: index,
            startDate: min,
            endDate: max,
            minDate: minDateNew,
            maxDate: maxDateNew
        });
    };

    // Helper to validate filter selections
    validateFilterSelections = (location, camera, label) => {
        if (location.length < 1 && camera.length < 1 && label.length < 1) {
            warningToast("Please select all filter");
            return false;
        }
        if (location.length < 1) {
            warningToast("Please select location");
            return false;
        }
        if (camera.length < 1) {
            warningToast("Please select camera");
            return false;
        }
        if (label.length < 1 && camera.length > 0) {
            if (this.state.dashboardGraphName === "Label") {
                warningToast("Please select label");
            } else {
                warningToast("Please select type");
            }
            return false;
        }
        return true;
    };

    // Helper to build params
    buildFilterParams = (location, camera, label, startDate, endDate) => {
        let params = {};
        params.location_id = location;
        params.camera_id = camera;
        if (label.length > 0) {
            if (this.state.dashboardGraphName === "Label") {
                params.selected_model_labels_list = label;
            } else {
                params.selected_event_list = label;
            }
        }
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return params;
    };

    // Helper to set duration_type
    setDurationType = (params, isSameDate) => {
        if (params.hasOwnProperty("start_date") && params.hasOwnProperty("end_date")) {
            let startDate = new Date(params.start_date);
            let endDate = new Date(params.end_date);
            if (params.hasOwnProperty("no_date_selected") || isSameDate) {
                params.duration_type = "day";
            } else if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
                params.duration_type = "month";
            } else {
                params.duration_type = "month";
            }
        } else {
            params.duration_type = "month";
        }
        return params;
    };

    // Helper to handle widget and filter actions
    handleWidgetAndFilter = (params, location, camera, label) => {
        const WidgetLabalAndValueParam = {
            start_date: this.state.startDate,
            end_date: this.state.endDate,
            current_date: getCurrentDateAndTimeInIsoFormat(),
            deployed_rtsp_job_id: 0,
            camera_id: camera,
            selected_model_labels_list: label,
            duration_type: "day",
            initial_graph: true,
            location_id: location
        };
        this.setWidgetLabelAndValue(WidgetLabalAndValueParam);
        this.setFilterParameters(params, this.state.dashboardGraphName + " Data Analysis", false);
        this.getMyResultMetadata(moment.utc(this.state.startDate).format(), moment.utc(this.state.endDate).format());
    };

    applyFilter = (state, callback) => {
        this.setState({
            pageParams: {pageSize: 10, totalPages: 0, totalCounts: 0},
            queryParams: {pageNumber: 1, pageSize: 10, sortField: null, sortOrder: null},
            loadAlldata: false
        });
        let startDate = moment.utc(this.state.startDate).format();
        let endDate = moment.utc(this.state.endDate).format();
        let location = this.state.selectedLocationValue;
        let camera = this.state.selectedCameraValue;
        let label = this.state.selectedLabelValue;

        if (!this.validateFilterSelections(location, camera, label)) {
            return;
        }

        let params = this.buildFilterParams(location, camera, label, startDate, endDate);
        params = this.setDurationType(params, this.state.isSameDate);

        if (location.length > 0 && camera.length > 0 && label.length > 0) {
            this.handleWidgetAndFilter(params, location, camera, label);
        }

        this.setState({show: false});
        setTimeout(() => {
            this.setState({show: true});
        }, 100);
    };

    clearFilter = () => {
        this.setState({
            startDate: getCurrentStartDate(),
            endDate: getCurrentEndDate(),
            selectedLocationValue: ['-1'],
            selectedCameraValue: ['-1'],
            selectedLabelValue: '-1',
            selectedIndex: 0,
            notice: false,
            allLabelFlag: true,
            pageParams: {pageSize: 10, totalPages: 0, totalCounts: 0},
            queryParams: {pageNumber: 1, pageSize: 10, sortField: null, sortOrder: null},
        }, () => {
            this.handleLocationChange([{label: "All Location", value: '-1'}]);
            const WidgetLabalAndValueParam = {
                start_date: getCurrentStartDate(),
                end_date: getCurrentEndDate(),
                current_date: getCurrentDateAndTimeInIsoFormat(),
                deployed_rtsp_job_id: 0,
                location_id: this.state.selectedLocationValue,
                camera_id: this.state.selectedCameraValue,
                selected_model_labels_list: this.state.selectedLabelValue,
                duration_type: "day",
                initial_graph: true,
            };

            this.setWidgetLabelAndValue(WidgetLabalAndValueParam);
            this.loadInitialGraph();
            const startDate = moment.utc(getCurrentStartDate()).format()
            const endDate = moment.utc(getCurrentEndDate()).format()
            this.setState({show: false});
            setTimeout(() => {
                this.setState({show: true});

            }, 100);
            this.getMyResultMetadata(startDate, endDate);

        });
    };

    getAllLocations = () => {
        const {user} = this.props;
        let userRole = user.roles[0].role;
        this.setState({
            locationLoading: true
        });
        getEnabledLocationList(userRole)
            .then(response => {
                if (response && response.data) {
                    let locationOptions = [];
                    response.data.map(obj => locationOptions.push({label: obj.location_name, value: obj.id}));
                    locationOptions.push({label: "All Location", value: '-1'});

                    this.setState({
                        locationOptions: locationOptions, locationLoading: false
                    }, () => {
                        this.handleLocationChange([{label: "All Location", value: '-1'}]);
                    });
                }
            })
            .catch(error => {
                this.setState({locationLoading: false});
                if (error.detail) {
                    console.log(error.detail);
                }
            });
    };

    componentDidUpdate(prevProps) {
        if (prevProps.selectedIndex !== this.props.selectedIndex) {
            this.setState({selectedIndex: this.props.selectedIndex});

        }
        if (prevProps.location.popupData !== this.props.location.popupData) {
            if (this.props.location.popupData && this.props.location.popupData.length > 0) {
                this.setState({
                    showBarTable: false, blocking: true, tableData: this.props.location.popupData
                }, () => {
                    this.setState({
                        showBarTable: true, blocking: false
                    });
                });

            } else {
                this.setState({
                    showBarTable: false
                });
            }
        }
    }

    // Helper to process camera options
    processCameraOptions = (res) => {
        let cameraOptions = [];
        let camerasIds = [];
        res.data.map((item) => {
            cameraOptions.push({label: item.camera_name, value: item.id});
            camerasIds.push(item.camera_name);
            return null;
        });
        cameraOptions.push({label: "All Camera", value: '-1'});
        return { cameraOptions, camerasIds };
    };

    // Helper to handle camera and label reset
    resetCameraAndLabel = () => {
        this.setState({
            selectedLabel: [], selectedLabelValue: [], selectedCamera: [], selectedCameraValue: [],
        });
    };

    // Helper to handle camera and label after camera fetch
    handleCameraAndLabelAfterFetch = (dashboardGraphName) => {
        if (dashboardGraphName === "Label") {
            this.handleCameraChange([{label: "All Camera", value: '-1'}]);
        } else if (dashboardGraphName === "Event") {
            this.handleCameraChangeForEventType([{label: "All Camera", value: '-1'}]);
        }
        this.setState({
            selectedLabel: [], selectedLabelValue: '-1', labelOptions: []
        });
    };

    // Helper to handle camera fetch error
    handleCameraFetchError = (error) => {
        this.setState({blocking: false});
        if (error.detail) {
            console.error(error.detail);
        }
    };

    handleLocationChange = selectedCurrentLocation => {
        if (selectedCurrentLocation === null || selectedCurrentLocation.length === 0) {
            this.resetCameraAndLabel();
        }

        let selectedLocationArray = [];
        if (selectedCurrentLocation) {
            for (const location of selectedCurrentLocation) {
                selectedLocationArray.push(location.value.toString());
            }
        }

        this.setState({
            selectedLocation: selectedCurrentLocation, selectedLocationValue: selectedLocationArray
        }, () => {
            const {user} = this.props;
            let userRole = user.roles[0].role;

            if (this.state.selectedLocationValue && this.state.selectedLocationValue.length > 0) {
                getTotalCamerasByLocationId(this.state.selectedLocationValue, userRole)
                    .then(res => {
                        if (res && res.isSuccess) {
                            const { cameraOptions, camerasIds } = this.processCameraOptions(res);
                            const cameraNameMap = this.createCameraNameMap(cameraOptions);
                            this.setState({
                                cameraOptions: cameraOptions, camerasIds: camerasIds, cameraName: cameraNameMap
                            }, () => {
                                this.handleCameraAndLabelAfterFetch(this.state.dashboardGraphName);
                            });
                        } else {
                            this.handleCameraFetchError({});
                        }
                    })
                    .catch(error => {
                        this.handleCameraFetchError(error);
                    });
            }
        });
    };

    // Helper to process label options for camera change
    processLabelOptionsForCamera = (res) => {
        const allLabels = res.data.flatMap(item => item.labels);
        allLabels.push("All Label");
        const uniqueLabels = Array.from(new Set(allLabels));
        return uniqueLabels.map(label => ({
            label: convertToReadableString(label),
            value: label === "All Label" ? "-1" : label
        }));
    };

    // Helper to create camera name map
    createCameraNameMap = (cameraOptions) => {
        const cameraNameMap = {};
        cameraOptions.forEach(camera => {
            if (camera.value !== '-1') {
                cameraNameMap[camera.value] = camera.label;
            }
        });
        return cameraNameMap;
    };

    // Helper to handle label fetch error
    handleLabelFetchError = (error) => {
        this.setState({labelLoading: false});
        if (error.detail) {
            console.log(error.detail);
        }
    };

    // Helper to process event type label options
    processEventTypeLabelOptions = (res) => {
        const labelOptions = res.data.map(x => x);
        labelOptions.push("All Type");
        let labels = [];
        labelOptions.forEach(item => {
            let arr = item.split(",");
            arr.forEach(x => labels.push(x));
        });
        let uniqueLabels = Array.from(new Set(labels));
        return uniqueLabels.map(x => ({
            label: x,
            value: x === "All Type" ? '-1' : x
        }));
    };

    handleCameraChange = selectedCamera => {
        let selectedCameraArray = [];
        if (selectedCamera) {
            for (const camera of selectedCamera) {
                selectedCameraArray.push(camera.value.toString());
            }
        }
        this.setState({
            selectedCamera: selectedCamera, selectedCameraValue: selectedCameraArray,
        }, () => {
            const {user} = this.props;
            let userRole = user.roles[0].role;

            if (this.state.selectedCameraValue && this.state.selectedCameraValue.length > 0) {
                this.setState({labelLoading: true});

                const body = {
                    camera_id: this.state.selectedCameraValue, location_id: this.state.selectedLocationValue
                };

                getAllLabelsFromListOfCameraId(body, userRole)
                    .then(res => {
                        if (res && res.isSuccess) {
                            const finale_labels = this.processLabelOptionsForCamera(res);
                            const cameraNameMap = this.createCameraNameMap(this.state.cameraOptions);
                            this.setState({
                                labelLoading: false, cameraName: cameraNameMap
                            }, () => {
                                this.setState({
                                    labelOptions: finale_labels
                                }, () => {
                                    this.handleLabelChange([{label: "All Label", value: '-1'}]);
                                    this.setState({
                                        allLabelFlag: false
                                    });
                                });
                            });
                        } else {
                            this.handleLabelFetchError({});
                        }
                    })
                    .catch(error => {
                        this.handleLabelFetchError(error);
                    });
            } else {
                this.setState({
                    selectedLabel: "",
                });
            }
        });
    };

    handleCameraChangeForEventType = selectedCamera => {
        let selectedCameraArray = [];
        if (selectedCamera) {
            for (const camera of selectedCamera) {
                selectedCameraArray.push(camera.value.toString());
            }
        }
        this.setState({
            selectedCamera: selectedCamera, selectedCameraValue: selectedCameraArray,
        }, () => {
            if (this.state.selectedCameraValue && this.state.selectedCameraValue.length > 0) {
                this.setState({labelLoading: true});
                const body = {
                    camera_id_list: this.state.selectedCameraValue, location_id_list: this.state.selectedLocationValue
                };
                getDiffEventsByCameraId(body)
                    .then(res => {
                        if (res && res.isSuccess) {
                            const finale_labels = this.processEventTypeLabelOptions(res);
                            this.setState({
                                labelLoading: false
                            }, () => {
                                this.setState({
                                    labelOptions: finale_labels
                                }, () => {
                                    this.handleTypeChange([{label: "All Type", value: '-1'}]);
                                    this.setState({
                                        allLabelFlag: false
                                    });
                                });
                            });
                        } else {
                            this.handleLabelFetchError({});
                        }
                    })
                    .catch(error => {
                        this.handleLabelFetchError(error);
                    });
            } else {
                this.setState({
                    selectedLabel: "", labelOptions: []
                });
            }
        });
    };

    handleTypeChange = selectedLabel => {
        let selectedLabelArray = "";
        if (selectedLabel) {
            if (selectedLabel.length === 1) {
                selectedLabelArray = `${selectedLabel[0].value}`;
            } else {
                for (let i = 0; i < selectedLabel.length; i++) {
                    selectedLabelArray += `${selectedLabel[i].value}`
                    if (i !== selectedLabel.length - 1) {
                        selectedLabelArray += ","
                    }
                }
            }

        }

        this.setState({
            selectedLabel: selectedLabel, selectedLabelValue: selectedLabelArray,
        });
    };

    handleLabelChange = selectedLabel => {
        let selectedLabelArray = "";
        if (selectedLabel) {
            if (selectedLabel.length === 1) {
                selectedLabelArray = `${selectedLabel[0].value}`;
            } else {
                for (let i = 0; i < selectedLabel.length; i++) {
                    selectedLabelArray += `${selectedLabel[i].value}`
                    if (i !== selectedLabel.length - 1) {
                        selectedLabelArray += ","
                    }
                }
            }

        }

        this.setState({
            selectedLabel: selectedLabel, selectedLabelValue: selectedLabelArray,
        });
    };

    getMyResultMetadata = (startDate, endDate) => {
        const {selectedLabelArray, selectedCameraValue, selectedLocationValue, queryParams} = this.state;
        getResultMetadata(startDate, endDate, selectedLabelArray, selectedCameraValue, selectedLocationValue, queryParams.pageSize, this.props.user?.roles[0]?.role)
            .then(response => {
                if (response && response.isSuccess) {
                    this.setState({
                        pageParams: {
                            pageSize: response.data.page_size,
                            totalPages: response.data.total_pages,
                            totalCounts: response.data.total_count
                        }
                    }, () => {
                        this.getMyResults(startDate, endDate);
                    });
                } else {
                    this.setState({listLoading: false});
                    throw new Error();
                }
            })
            .catch(error => {
                this.setState({listLoading: false});
                console.log(error.detail || "Something went Wrong");
            });
    };

    getMyResults = (startDate, endDate) => {
        const {
            jobId,
            selectedCameraValue,
            selectedLabelArray,
            selectedLocationValue,
            queryParams,
        } = this.state;
        this.setState({
             listLoading: true
        });
        const pageSize = queryParams.pageSize || 10;
        const pageNo = queryParams.pageNumber || 1;
        const userRole = this.props.user?.roles[0]?.role;

        const params = {
            pageSize,
            pageNo,
            jobId: jobId?.value,
            startDate,
            endDate,
            selctedcameraid: selectedCameraValue,
            selectedLabel: selectedLabelArray,
            locationIdList: selectedLocationValue,
            userRole,
        };

        getResults(params)
            .then(response => {
                if (response && response.isSuccess) {
                    const items = response.data;
                    const cameraIds = [...new Set(items.map(item => item.camera_id).filter(Boolean))];

                    if (cameraIds.length > 0) {
                        this.setState(prevState => ({
                            currentItems: items,
                            filterEntities: items,
                            listLoading: false,
                            tableData: items.length > 0
                        }));
                    } else {
                        this.setState({ listLoading: false });
                    }
                } else {
                    this.setState({ listLoading: false });
                    throw new Error();
                }
            })
            .catch(err => {
                this.setState({ listLoading: false });
                console.log(err.detail || "Something went wrong");
            });
    };

    openViewMyResultDialog = (id, rowdata) => {
        this.setState({showBarTable: false});
        setTimeout(() => {
            this.setState({showBarTable: true, tableData: [rowdata]});
        }, 100);
    };

    handleSubmit = async () => {
        try {
            this.setState({ isDownloading: true });
            const { userRole } = this.props;
            const oids = this.state.filterEntities.map(item => item._id?.$oid);
            
            const response = await getResultForResultExcel(oids, userRole);
            
            if (response && response.data) {
                if (typeof response.data === "string") {
                    const blob = this.base64ToBlobUTF8(response.data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                    this.downloadExcelFromBlob(blob, "Results.xlsx");
                } else if (response.data instanceof Blob) {
                    this.downloadExcelFromBlob(response.data, "Results.xlsx");
                } else {
                    console.error("Invalid response format: not a Blob or base64 string.");
                }
            }
        } catch (err) {
            console.error("Error during API call:", err);
        } finally {
            this.setState({ isDownloading: false });
        }
    };

    base64ToBlobUTF8 = (base64, mimeType) => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        return new Blob([new Uint8Array(byteNumbers)], {type: mimeType});
    };

    downloadExcelFromBlob = (blob, fileName) => {
        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Excel:', error);
        } finally {
            this.setState({ isDownloading: false });
        }
    };

    setQueryParams = (params) => {
        const isPageSizeChange = params.pageSize !== this.state.queryParams.pageSize;
        const newParams = {
            ...this.state.queryParams, ...params,
            pageSize: params.pageSize || this.state.queryParams.pageSize || 10,
            pageNumber: isPageSizeChange ? 1 : (params.pageNumber || this.state.queryParams.pageNumber || 1)
        };

        this.setState({
            queryParams: newParams, listLoading: true
        }, () => {
            if(this.state.loadAlldata){
                this.getMyResultMetadata();
            }else {
                this.getMyResultMetadata(moment.utc(this.state.startDate).format(),moment.utc(this.state.endDate).format());
            }

        });
    };

    setQueryParamsPeople = (params) => {
        const isPageSizeChange = params.pageSize !== this.state.queryParamsPeople.pageSize;
        const newParams = {
            ...this.state.queryParamsPeople, ...params,
            pageSize: params.pageSize || this.state.queryParamsPeople.pageSize || 10,
            pageNumber: isPageSizeChange ? 1 : (params.pageNumber || this.state.queryParamsPeople.pageNumber || 1)
        };

        this.setState({
            queryParamsPeople: newParams, listLoadingPeople: true
        }, () => {
            if(this.state.loadAlldata){
                // this.getMyResultMetadata();
            }else {
                // this.getMyResultMetadata(moment.utc(this.state.startDate).format(),moment.utc(this.state.endDate).format());
            }

        });
    };


    render() {
        const {
            locationLoading, locationOptions, selectedLocation,
            totalCamerasByLocationLoading, cameraOptions, selectedCamera,
            labelLoading, labelOptions, selectedLabel,
        } = this.state;


        return (
          <>
            <Card
              className="example example-compact"
              style={{ minHeight: "150px", overflow: "visible" }}
            >
              <CardBody style={{ padding: "10px 10px" }}>
                <Row>
                  <Col xl={8} lg={8} xs={12} md={7} sm={12}>
                    <CardHeader title="Event Information" />
                  </Col>
                  <Col xl={4} lg={4} xs={12} md={5} sm={12}>
                    <div className={"mt-5 d-flex justify-content-lg-end"}>
                      {!this.state.loadInitialGraphFlag && (
                        <Button
                          color="primary"
                          className={"mr-4 btn-apply-filter"}
                          onClick={this.loadInitialGraph}
                        >
                          Load Latest Data
                        </Button>
                      )}
                      {this.state.loadInitialGraphFlag && (
                        <>
                          <Button
                            color="primary"
                            className={"mr-4 btn-apply-filter loadtop"}
                            onClick={this.loadAllYearData}
                          >
                            Load All Data
                          </Button>
                        </>
                      )}
                    </div>
                  </Col>
                </Row>
                <hr />

                <Row className="space">
                  <Col xl={2} xs={12} md={6} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="mb-4">Select Location</Form.Label>
                      <ReactSelectWrapper
                        isLoading={locationLoading}
                        isSearchable={true}
                        isMulti={true}
                        placeholder="Select Location"
                        className="select-react-dropdown"
                        value={selectedLocation}
                        onChange={this.handleLocationChange}
                        options={locationOptions}
                        styles={customStyles}
                      />
                    </Form.Group>
                  </Col>
                  <Col xl={2} xs={12} md={6} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="mb-4">Select Camera</Form.Label>
                      <ReactSelectWrapper
                        isMulti={true}
                        styles={customStyles}
                        isLoading={totalCamerasByLocationLoading}
                        placeholder="Select Camera"
                        value={selectedCamera}
                        onChange={
                          this.state.dashboardGraphName === "Label"
                            ? this.handleCameraChange
                            : this.handleCameraChangeForEventType
                        }
                        options={cameraOptions}
                      />
                    </Form.Group>
                  </Col>
                  <Col xl={2} xs={12} md={6} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="mb-4">
                        {this.state.dashboardGraphName === "Label"
                          ? "Select Label"
                          : "Select Type"}
                      </Form.Label>
                      <ReactSelectWrapper
                        styles={customStyles}
                        isLoading={labelLoading}
                        isMulti={true}
                        placeholder={
                          this.state.dashboardGraphName === "Label"
                            ? "Select Label"
                            : "Select Type"
                        }
                        value={selectedLabel}
                        onChange={
                          this.state.dashboardGraphName === "Label"
                            ? this.handleLabelChange
                            : this.handleTypeChange
                        }
                        options={labelOptions}
                      />
                    </Form.Group>
                  </Col>
                  <Col xl={4} xs={12} md={6} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="mb-4">
                        Select Date Range
                      </Form.Label>
                      <FormDateRangePicker
                        rangeIndex={this.state.selectedIndex}
                        minDate={this.state.minDate}
                        maxDate={this.state.maxDate}
                        startDate={this.state.startDate}
                        endDate={this.state.endDate}
                        changeDateTimeRange={this.dateTimeRangeChangeHandler}
                        changeDateTimeRangeIndex={
                          this.dateTimeRangeIndexChangeHandler
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col xl={2} xs={12} md={12} sm={12}>
                    <div className={"d-flex mr-2 mt-5"}>
                      <Button
                        disabled={this.state.btndisabled}
                        onClick={this.applyFilter}
                        color={"primary"}
                        className={"mt-5 mr-3"}
                      >
                        Apply Filter
                      </Button>

                      <OverlayTrigger
                        placement="bottom"
                        overlay={
                          <Tooltip id="user-notification-tooltip">
                            Show Today Data
                          </Tooltip>
                        }
                      >
                        <Button
                          color={"secondary"}
                          className={"mt-5"}
                          onClick={this.clearFilter}
                        >
                          Reset filter
                        </Button>
                      </OverlayTrigger>
                    </div>
                  </Col>
                </Row>

                <Row className="space">
                  <div className={"col-xl-12 col-md-12 mb-3"}>
                    <div>
                      <span>
                        <b>Note:</b> This dashboard covers
                      </span>
                      <span>
                        {" "}
                        <b>
                          {this.state.notice
                            ? " specific date range data."
                            : "all data. "}
                        </b>
                      </span>
                      <span>
                        Apply below filter for further data analytics.{" "}
                      </span>
                    </div>
                  </div>
                </Row>
              </CardBody>
            </Card>

            <BlockUi tag="div" blocking={this.state.blocking} color="#147b82">
              <div className="row-xl-12 mt-6">
                <div
                  className={`card card-custom col-lg-12 col-xl-12 my-widget3`}
                >
                  <div className="card-body  p-0 position-relative overflow-hidden">
                    <div
                      id="kt_mixed_widget_1_chart"
                      className="card-rounded-bottom "
                      style={{ backgroundColor: "white" }}
                    ></div>

                    <div className="card-spacer">
                      <div className=" m-0 box-customer-grid">
                        <div className=" bg-primary px-6 py-8 rounded-xl ml-3 mr-3 box-customer-widget">
                          <div className={"d-flex"}>
                            <span className="svg-icon svg-icon-3x svg-icon-white d-block my-2">
                              <SVG
                                src={toAbsoluteUrl(
                                  "/media/svg/icons/Layout/Layout-4-blocks.svg"
                                )}
                              ></SVG>
                            </span>
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip id="user-notification-tooltip">
                                  {this.state.widget &&
                                    this.state.widget[
                                      this.state.keys && this.state.keys[0]
                                    ]}
                                </Tooltip>
                              }
                            >
                              <div className="text-white font-weight-bold font-size-h2 mt-3 ml-2 wizard-overFlowView cursor-pointer ">
                                {this.state.widget &&
                                  this.state.widget[
                                    this.state.keys && this.state.keys[0]
                                  ]}
                              </div>
                            </OverlayTrigger>
                          </div>
                          <div
                            className={`text-white font-weight-bold font-size-h6 ml-3`}
                          >
                            {this.state.widgeTitle && this.state.widgeTitle[0]}
                          </div>
                        </div>

                        <div className=" bg-primary px-6 py-8 rounded-xl ml-3 mr-3 box-customer-widget">
                          <div className={"d-flex"}>
                            <span className="svg-icon svg-icon-3x svg-icon-white d-block my-2">
                              <SVG
                                src={toAbsoluteUrl(
                                  "/media/svg/icons/Layout/Layout-4-blocks.svg"
                                )}
                              ></SVG>
                            </span>
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip id="user-notification-tooltip">
                                  {this.state.widget &&
                                    this.state.widget[
                                      this.state.keys && this.state.keys[1]
                                    ]}
                                </Tooltip>
                              }
                            >
                              <div
                                className={`text-white font-weight-bold font-size-h2 mt-3 ml-2 wizard-overFlowView cursor-pointer`}
                              >
                                {this.state.widget &&
                                  this.state.widget[
                                    this.state.keys && this.state.keys[1]
                                  ]}
                              </div>
                            </OverlayTrigger>
                          </div>

                          <div
                            className={`text-white font-weight-bold font-size-h6 ml-3 `}
                          >
                            {this.state.widgeTitle && this.state.widgeTitle[1]}
                          </div>
                        </div>

                        <div className=" bg-primary px-6 py-8 rounded-xl ml-3 mr-3 box-customer-widget">
                          <div className={"d-flex"}>
                            <span className="svg-icon svg-icon-3x svg-icon-white d-block my-2">
                              <SVG
                                src={toAbsoluteUrl(
                                  "/media/svg/icons/Layout/Layout-4-blocks.svg"
                                )}
                              ></SVG>
                            </span>
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip id="user-notification-tooltip">
                                  {this.state.widget &&
                                    this.state.widget[
                                      this.state.keys && this.state.keys[2]
                                    ]}
                                </Tooltip>
                              }
                            >
                              <div
                                className={`text-white font-weight-bold font-size-h2 ml-2 mt-3 wizard-overFlowView cursor-pointer`}
                              >
                                {this.state.widget &&
                                  this.state.widget[
                                    this.state.keys && this.state.keys[2]
                                  ]}
                              </div>
                            </OverlayTrigger>
                          </div>

                          <div
                            className={`text-white font-weight-bold font-size-h6 ml-3`}
                          >
                            {this.state.widgeTitle && this.state.widgeTitle[2]}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={"row mt-6"} id="content">
                <div className="col-xl-6">
                  <div
                    className={
                      "graph-dashboard-card card p-4 card-custom gutter-b bgi-no-repeat bgi-no-repeat bgi-size-cover"
                    }
                    style={{ height: "600px" }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        bgcolor: "background.paper",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h3 className="card-label font-weight-normal text-dark mb-3 mt-2">
                          Result Analysis
                        </h3>
                        {this.state.showGraph === true && (
                          <div className="graph-dropdown-div">
                            <FormControl style={{ width: "20vh" }}>
                              <DropDownMatrialUi
                                graphType={this.state.graphType}
                                handleGraphChange={this.handleGraphChange}
                                drilldownFromFun={this.state.drilldownFromFun}
                              />
                            </FormControl>
                          </div>
                        )}
                      </div>
                      <hr />

                      {this.state.showGraph && (
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column"
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <DashboardGraph
                              displayDataTableFromBar={
                                this.displayDataTableFromBar
                              }
                              parameters={this.state.parameters}
                              startDateEndDateFlag={
                                this.state.startDateEndDateFlag
                              }
                              setXAxisYAxisAfterDrilldown={
                                this.setXAxisYAxisAfterDrilldown
                              }
                              locationId={this.state.selectedLocationValue}
                              cameraId={this.state.selectedCameraValue}
                              selected_model_labels_list={
                                this.state.selectedLabelValue
                              }
                              setFilterParameters={this.setFilterParameters}
                              drillApplied={this.state.drillApplied}
                              title={this.state.title}
                              xAxis={this.state.xAxis}
                              yAxis={this.state.yAxis}
                              graphType={this.state.graphType}
                              dashboardGraphName={this.state.dashboardGraphName}
                            />
                          </div>
                        </div>
                      )}

                      {this.state.showGraph === false && (
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <h4>{this.state.graphMessage}</h4>
                        </div>
                      )}
                    </Box>
                  </div>
                </div>
                <div className={"col-xl-6"}>
                  <div
                    className={
                      "graph-dashboard-card card p-4 card-custom gutter-b bgi-no-repeat bgi-no-repeat bgi-size-cover"
                    }
                    style={{ height: "600px" }}
                  >
                    <div
                      className={`border-0 d-flex justify-content-between align-items-center ${
                        !this.state.filterEntities.length > 0 ? "mb-3" : ""
                      }`}
                    >
                      <h3 className="card-label font-weight-normal text-dark">
                        {/*<span className="card-label font-weight-normal text-dark">*/}
                        Result Table
                        {/*</span>*/}
                      </h3>
                      <div className="card-toolbar">
                        {this.state.filterEntities &&
                          this.state.filterEntities.length > 0 && (
                            <Button
                              color="primary"
                              onClick={this.handleSubmit}
                              disabled={this.state.isDownloading}
                              className="position-relative"
                            >
                              <span className="d-flex align-items-center">
                                {this.state.isDownloading && (
                                  <span
                                    className="spinner-border spinner-border-sm mr-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                )}
                                {this.state.isDownloading ? (
                                  "Downloading..."
                                ) : (
                                  <>
                                    <i className="ki ki-download mr-2"></i>
                                    Download Excel For Results
                                  </>
                                )}
                              </span>
                            </Button>
                          )}
                      </div>
                    </div>
                    <hr className={"mt-5"} />
                    <Box
                      sx={{
                        width: "100%",
                        bgcolor: "background.paper",
                        height: "calc(100% - 80px)",
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <MyResultTableDashboard
                          listLoading={this.state.listLoading}
                          tableData={this.state.tableData}
                          pageParams={this.state.pageParams}
                          queryParams={this.state.queryParams}
                          filterEntities={this.state.filterEntities}
                          columns={this.state.columns}
                          setQueryParams={this.setQueryParams}
                        />
                      </div>
                    </Box>
                  </div>
                </div>


                  <div className={"col-xl-12"}>
                      <div
                          className={
                              "graph-dashboard-card card p-4 card-custom gutter-b bgi-no-repeat bgi-no-repeat bgi-size-cover"
                          }
                          style={{ height: "600px" }}
                      >
                          <div
                              className={`border-0 d-flex justify-content-between align-items-center ${
                                  !this.state.filterEntitiesPeople.length > 0 ? "mb-3" : ""
                              }`}
                          >
                              <h3 className="card-label font-weight-normal text-dark">
                                  {/*<span className="card-label font-weight-normal text-dark">*/}
                                  People Count  Table
                                  {/*</span>*/}
                              </h3>
                              <div className="card-toolbar">
                                  {this.state.filterEntitiesfilterEntitiesPeople &&
                                      this.state.filterEntitiesfilterEntitiesPeople.length > 0 && (
                                          <Button
                                              color="primary"
                                              onClick={this.handleSubmitPeople}
                                              disabled={this.state.isDownloadingPeople}
                                              className="position-relative"
                                          >
                              <span className="d-flex align-items-center">
                                {this.state.isDownloadingPeople && (
                                    <span
                                        className="spinner-border spinner-border-sm mr-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                )}
                                  {/*{this.state.isDownloadingPeople ? (*/}
                                  {/*    "Downloading..."*/}
                                  {/*) : (*/}
                                  {/*    <>*/}
                                  {/*        <i className="ki ki-download mr-2"></i>*/}
                                  {/*        Download Excel For Results*/}
                                  {/*    </>*/}
                                  {/*)}*/}
                              </span>
                                          </Button>
                                      )}
                              </div>
                          </div>
                          <hr className={"mt-5"} />
                          <Box
                              sx={{
                                  width: "100%",
                                  bgcolor: "background.paper",
                                  height: "calc(100% - 80px)",
                                  display: "flex",
                                  flexDirection: "column"
                              }}
                          >
                              <div style={{ flex: 1 }}>
                                  <MyResultTableDashboard
                                      listLoading={this.state.listLoadingPeople}
                                      tableData={this.state.tableDataPeople}
                                      pageParams={this.state.pageParamsPeople}
                                      queryParams={this.state.queryParamsPeople}
                                      filterEntities={this.state.filterEntitiesPeople}
                                      columns={this.state.columnsPeople}
                                      setQueryParams={this.setQueryParamsPeople}
                                  />
                              </div>
                          </Box>
                      </div>
                  </div>
              </div>
              <div>
                {this.state.showBarTable && (
                  <DashboardTable
                    showBarTable={this.state.showBarTable}
                    cameraData={selectedCamera}
                    tableData={this.state.tableData}
                    dashboardGraphName={this.state.dashboardGraphName}
                    user={this.props.user}
                  />
                )}
              </div>
            </BlockUi>
          </>
        );
    }
}

function mapStateToProps(state) {
    const {auth} = state;
    return {user: auth.user, location: state.location};
}

export default connect(mapStateToProps, auth.actions)(withStyles(styles)(Demo2Dashboard));
