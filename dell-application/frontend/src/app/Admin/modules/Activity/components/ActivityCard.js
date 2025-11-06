import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import Select from "react-select";
import { Col, Form, Row } from "react-bootstrap";
import moment from "moment";
import { CardHeader, IconButton, InputBase, Paper } from "@mui/material";
import { getCurrentEndDate, getCurrentStartDate } from "../../../../../utils/TimeZone";
import FormDateRangePicker from "../../../../../utils/dateRangePicker/FormDateRangePicker";
import getSelectedDateTimeDefaultValue from "../../../../../utils/dateRangePicker/dateFunctions";
import getSelectedDateTimeDefaultValueForRange from "../../../../../utils/dateRangePicker/dateRangeFunctions";
import SearchIcon from '@mui/icons-material/Search';
import { ActivityTable } from "./activity-table/ActivityTable";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import FetchViolationModal from "../../../../../utils/FetchViolationModal";
import * as action from "../../Locations/_redux/LocationAction";
import { warningToast } from "../../../../../utils/ToastMessage";
import {getActivityType} from "../../DashboardGraph/_redux";
import { getActivityLogs } from "../_redux/ActivityApi";
import { Button } from "reactstrap";
import { customSelectTheme } from "../../../../../utils/UIHelpers";

const labelMap = {
    CAMERA_STATUS: "Camera Status",
    SYSTEM_HEALTH_CHECK: "System Health Check",
    TELEGRAM_API_STATUS: "Telegram API Status",
    TELEGRAM_NOTIFICATION: "Telegram Notification",
    FRAME_DROPS: "Frame Drops",
    USER_LOGIN: "User Login"
};


export function ActivityCard() {
    const dispatch = useDispatch();
    const [showBarTable, setShowBarTable] = useState(false);
    const [activityType, setActivityType] = useState([{ label: "All Activity Type", value: "-1" }]);
    const [activityTypeLoading, setActivityTypeLoading] = useState(false);
    const [activityTypeOptions, setActivityTypeOptions] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(12);
    const [startDate, setStartDate] = useState(moment.utc(getCurrentStartDate()).format());
    const [endDate, setEndDate] = useState(moment.utc(getCurrentEndDate()).format());
    const [minDate, setMinDate] = useState(new Date());
    const [maxDate, setMaxDate] = useState();
    const searchInput = useRef("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [listLoading, setListLoading] = useState(false);

    const { userRole, popupData } = useSelector(
        ({ auth, location }) => ({
            userRole: auth.user?.roles?.length && auth.user.roles[0]?.role,
            popupData: location?.popupData,
        }),
        shallowEqual
    );

    useEffect(() => {
        getActivityType().then(response => {
            if (response && response.isSuccess) {
                const cameraOptions = response.data.map(c => ({
                    label: labelMap[c] || c,
                    value: c
                }));
                cameraOptions.push({ label: "All Activity Type", value: "-1" });
                setActivityTypeOptions(cameraOptions);
                setActivityTypeLoading(false);
            } else throw new Error();
        });
    }, [userRole]);


    // // Memoized callback to fetch activity logs
    const getActivityLogsData = useCallback(
        ({
             startDate,
             endDate,
             activityTypeIdList,
             pageSize,
             pageNo,
             searchTerm,
             userRole
         }) => {
            setListLoading(true);
            if (startDate && endDate) {
                getActivityLogs({
                    startDate,
                    endDate,
                    activityTypeIdList,
                    pageSize,
                    pageNo,
                    searchKey: searchTerm,
                    userRole
                })
                    .then((response) => {
                        if (response && response.isSuccess) {
                            const logs = response?.data?.data || [];
                            setFilteredActivities(logs);
                            setTotalCount(response.data?.total_count)
                            setListLoading(false);
                        } else {
                            throw new Error();
                        }
                    })
                    .catch((error) => {
                        setListLoading(false);
                        console.error("Activity logs fetch error:", error);
                        if (error.detail) {
                            console.log(error.detail);
                        }
                    });
            }
        },
        []
    );

    // Effects to fetch data on page or rowsPerPage change
    useEffect(() => {
        if (activityType?.length > 0) {
            const activityTypeIdList = activityType && activityType.map((loc) => loc.value.toString());

            getActivityLogsData({
                startDate,
                endDate,
                activityTypeIdList,
                pageSize: rowsPerPage,
                pageNo: page + 1,
                searchTerm,
                userRole,
            });
        }
    }, [page, rowsPerPage, userRole]);

    const handleActivityTypeChange = useCallback((selected) => {
        setActivityType([selected]);
    }, []);


    const filterActivity = useCallback((e) => {
        const keyword = e.target.value;
        setSearchTerm(keyword);
    }, []);

    const dateTimeRangeIndexChangeHandler = useCallback((rangeIndex, value) => {
        let dateVal = getSelectedDateTimeDefaultValue(value);
        let index = getSelectedDateTimeDefaultValueForRange(parseInt(dateVal, 10));
        let min = startDate;
        let max = endDate;
        let minDateNew = minDate;
        let maxDateNew = maxDate;
        if (parseInt(dateVal) === 12) {
            min = parseInt("defaultMin", 0);
            max = parseInt("defaultMax", 0);
            minDateNew = ["min"];
            maxDateNew = ["max"];
        }
        setSelectedIndex(index);
        setStartDate(min);
        setEndDate(max);
        setMinDate(minDateNew);
        setMaxDate(maxDateNew);
    }, [startDate, endDate, minDate, maxDate]);

    const dateTimeRangeChangeHandler = useCallback((startDate, endDate) => {
        setStartDate(moment.utc(startDate).format());
        setEndDate(moment.utc(endDate).format());
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    const handleChangePage = useCallback((event, newPage) => {
        setPage(newPage - 1);
    }, []);



    const handleCloseModal = useCallback(() => {
        dispatch(action.clearPopupDataAction());
        setShowBarTable(false);
    }, [dispatch]);

    useEffect(() => {
        setShowBarTable(popupData.length > 0);
    }, [popupData]);

    const applyFilter = useCallback(() => {
        setPage(0); // Reset page to first

        const activityTypeIdList = activityType && activityType.map((loc) => loc.value.toString());

        const keyword = searchTerm.trim();
        if (keyword.length > 0 && keyword.length < 3) {
            warningToast("Please enter at least 3 characters to search");
            return;
        }

        const search = keyword.length >= 3 ? keyword : "";

        getActivityLogsData({
            startDate,
            endDate,
            activityTypeIdList,
            pageSize: rowsPerPage,
            pageNo: 1,
            searchTerm: search,
            userRole
        });

    }, [startDate, endDate, activityType, rowsPerPage, searchTerm, userRole, getActivityLogsData]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault(); // prevent page reload
    }, []);

    return (
        <>
            <Card className="example example-compact" style={{ minHeight: "230px" }}>
                <CardBody style={{ padding: "10px 10px" }}>
                    <Row>
                        <Col xl={8} xs={12} md={7}>
                            <CardHeader title="Activity Details" />
                        </Col>
                    </Row>
                    <hr />

                    <Row className="space mb-3">
                        <Col xl={2} xs={12} md={6} sm={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="mb-4">Select Activity Type</Form.Label>
                                <Select
                                    theme={customSelectTheme}
                                    name="activityType"
                                    isLoading={activityTypeLoading}
                                    isSearchable={false}
                                    className="select-react-dropdown"
                                    isMulti={false}
                                    placeholder="Select Activity Type"
                                    options={activityTypeOptions}
                                    onChange={handleActivityTypeChange}
                                    value={activityType}
                                />
                            </Form.Group>
                        </Col>
                        <Col xl={3} xs={12} md={6} sm={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="mb-4">Select Date Range</Form.Label>
                                <FormDateRangePicker
                                    rangeIndex={selectedIndex}
                                    minDate={minDate}
                                    maxDate={maxDate}
                                    startDate={startDate}
                                    endDate={endDate}
                                    changeDateTimeRange={dateTimeRangeChangeHandler}
                                    changeDateTimeRangeIndex={dateTimeRangeIndexChangeHandler}
                                />
                            </Form.Group>
                        </Col>
                        <Col xl={3} xs={12} md={6} sm={12} >
                            <Form.Group className="mb-3 mt-4">
                                <Form.Label className="mb-4"></Form.Label>
                                <Paper
                                    variant="outlined"
                                    component="form"
                                    onSubmit={handleSubmit}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        p: '2px 8px'
                                    }}
                                >
                                    <InputBase
                                        sx={{ ml: 1, flex: 1 }}
                                        placeholder="Serach For Title"
                                        inputProps={{ 'aria-label': 'search activity' }}
                                        onChange={filterActivity}
                                        value={searchTerm}
                                        ref={searchInput}
                                        autoFocus={true}
                                        style={{ width: "100%" }}
                                    />
                                    <IconButton type="submit" sx={{ p: '6px' }} aria-label="search">
                                        <SearchIcon />
                                    </IconButton>
                                </Paper>
                            </Form.Group>
                        </Col>
                        <Col xl={2} xs={12} md={6} sm={12}>
                            <div className={"d-flex mr-2 mt-5"}>
                                <Button
                                    className={'mt-5 mr-3'}
                                    color={'primary'}
                                    onClick={applyFilter}
                                >
                                    Apply Filter
                                </Button>
                            </div>
                        </Col>
                    </Row>
                    <ActivityTable
                        rowsPerPage={rowsPerPage}
                        handleChangeRowsPerPage={handleChangeRowsPerPage}
                        page={page}
                        handleChangePage={handleChangePage}
                        paginatedActivities={filteredActivities}
                        totalCount={totalCount}
                        listLoading={listLoading}
                    />
                </CardBody>
            </Card>
            {showBarTable &&
                <FetchViolationModal
                    showBarTableData={showBarTable}
                    tableDatas={popupData}
                    handleCloseModal={handleCloseModal}
                />}
        </>
    );
}
