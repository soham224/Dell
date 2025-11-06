import React, { useCallback } from "react";
import {
    Box,
    MenuItem,
    Select,
    Stack,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from "@mui/material";
import {Table} from "reactstrap";
import { Pagination } from "@mui/lab";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import * as moment from "moment/moment";
import {DesktopWindows, Person, PhotoCamera, Telegram} from "@mui/icons-material";
import  BlockUi  from "@availity/block-ui";
import "@availity/block-ui/dist/index.css";

const getActivityIcon = (type, title) => {
    const iconStyle = { fontSize: "30px" };

    const redTitles = [
        "Health Warning",
        "Login Failed",
        "System Shutdown",
        "Telegram API Error",
        "Alert Failed",
        "Camera OFF"
    ];

    const greenTitles = [
        "Health Check - Normal",
        "Camera ON",
        "System Started",
        "Admin Login Success",
        "Supervisor Login Success"
    ];

    const getColor = () => {
        if (redTitles.includes(title)) return "error";
        if (greenTitles.includes(title)) return "success";
        return "inherit";
    };

    switch (type) {
        case "CAMERA_STATUS":
            return (
                <PhotoCamera
                    color={getColor()}
                    style={iconStyle}
                />
            );
        case "TELEGRAM_API_STATUS":
        case "TELEGRAM_NOTIFICATION":
            return <Telegram color={getColor()} style={iconStyle} />;
        case "SYSTEM_STATUS":
            return <DesktopWindows color={getColor()} style={iconStyle} />;
        case "FRAME_DROPS":
            return <WarningAmberIcon color="error" style={iconStyle} />;
        case "USER_LOGIN":
            return <Person color={getColor()} style={iconStyle} />
        case "SYSTEM_HEALTH_CHECK":
            return <WarningAmberIcon color={getColor()} style={iconStyle} />
        default:
            return <WarningAmberIcon color="error" style={iconStyle} />;
    }
};



export function ActivityTable({
                                  rowsPerPage,
                                  handleChangeRowsPerPage,
                                  page,
                                  handleChangePage,
                                  paginatedActivities,
                                  totalCount,listLoading
                              }) {
    // Wrap select change handler to call prop
    const onRowsPerPageChange = useCallback(
        (event) => {
            handleChangeRowsPerPage(event);
        },
        [handleChangeRowsPerPage]
    );

    // Wrap pagination change handler to call prop
    const onPageChange = useCallback(
        (event, value) => {
            handleChangePage(event, value);
        },
        [handleChangePage]
    );


    return (
        <>
            {paginatedActivities?.length > 0 ? (
                <>
                    <div
                        style={{ flex: 1, height: "calc(100vh - 465px)", overflowX: "auto" }}
                    >
                        <BlockUi blocking={listLoading} tag="div" color="#147b82">
                        <TableContainer>
                            <Table>
                                <TableBody>
                                    {paginatedActivities.map((item) => (
                                        <TableRow key={item?.ActivityLogs?.id}>
                                            <TableCell colSpan={3}>
                                                <Box
                                                    display="flex"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                    py={1.5}
                                                >
                                                    {/* Left: Icon + Text */}
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        {getActivityIcon(item?.activity_type,  item?.title)}
                                                        <Box>
                                                            <Typography fontWeight={600} fontSize={14}>
                                                                {item?.title}
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                fontSize={13}
                                                            >
                                                                {item?.description}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>

                                                    <Stack direction="row" spacing={4} alignItems="center">
                                                        <Box sx={{ width: 180 }}>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                fontSize={13}
                                                            >
                                                                {moment
                                                                    .utc(item?.timestamp)
                                                                    .local()
                                                                    .format("MMMM DD YYYY, h:mm:ss a")}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        </BlockUi>
                    </div>
                    <div className="d-flex align-items-center justify-content-end m-5">
                        <span>Items per page:</span>
                        <div className="tusk_pagination-selection">
                            <Select
                                sx={{ border: "none", outline: "none" }}
                                value={rowsPerPage}
                                onChange={onRowsPerPageChange}
                            >
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={15}>15</MenuItem>
                            </Select>
                        </div>
                        <Pagination
                            color="primary"
                            page={page + 1}
                            count={Math.ceil(totalCount / rowsPerPage)}
                            onChange={onPageChange}
                        />
                    </div>
                </>
            ) : (
                <div
                    style={{
                        minHeight: "calc(100vh - 381px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <h3 className="text-center mb-0">No Data Found</h3>
                </div>
            )}
        </>
    );
}
