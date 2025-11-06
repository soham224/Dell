import React, { useEffect, useRef, useState, useCallback } from "react";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory, {
  PaginationProvider
} from "react-bootstrap-table2-paginator";
import {
  entitiesSorter,
  getHandlerTableChange,
  getPaginationOptions,
  headerSortingClasses,
  NoRecordsFoundMessage,
  PleaseWaitMessage,
  sortCaret
} from "../../../../../../../../_metronic/_helpers";
import * as uiHelpers from "../../../../../../../../utils/UIHelpers";
import { Pagination } from "../../../../../../../../_metronic/_partials/controls";
import { matchSorter } from "match-sorter";
import { getResultMetadata, getResults } from "../../../../_redux/MyResultApi";
import { warningToast } from "../../../../../../../../utils/ToastMessage";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import * as actions from "../../../../_redux/MyResultAction";
import { Col, Row } from "reactstrap";
import * as moment from "moment";
import  BlockUi  from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import {Button} from "react-bootstrap";
import {
  getResultForResultExcel
} from "../../../../../Subscriptions/_redux/DeployedRTSPJobs/DeployedRTSPJobsApi";
import {convertToReadableString} from "../../../../../../../../utils/stringConvert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {MyResultViewDialog} from "../my-result-view-dialog/MyResultViewDialog";

let currentPage;

const actionFormatter = (openDialog, cameraName) => (cell, row) => (
  <a
    title="Information"
    className="btn btn-icon btn-light btn-sm mx-3"
    onClick={() => openDialog(row._id.$oid, row, cameraName)}
    style={{ cursor: "pointer" }}
  >
    <VisibilityIcon color="action" style={{ fontSize: "2rem", color: "#147b82" }} />
  </a>
);

export function MyResultTable({
  jobId,
  cameraName,
  selectedLabel,
  startDate,
  endDate,
  selctedCameraId,
  locationIdList,userRole
}) {
  const dispatch = useDispatch();
  const [pageParams, setPageParams] = useState({
    pageSize: 0,
    totalPages: 0,
    totalCounts: 0
  });

  const [queryParams, setQueryParams] = useState({
    pageNumber: 1,
    pageSize: 10,
    sortField: null,
    sortOrder: null
  });
  const [currentItems, setCurrentItems] = useState([]);
  const [row, setRow] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [tableData, setTableData] = useState(false);
  const [show, setShow] = useState(false);
  const { currentState } = useSelector(
    state => ({ currentState: state.myResult }),
    shallowEqual
  );
  const { refreshResult } = currentState;
  function getMyResultMetadata(
    startDate,
    endDate,
    selectedLabel,
    selctedCameraId,
    pageSize
  ) {
    setListLoading(true);
    currentPage = 0;
    if (startDate && endDate) {
      getResultMetadata(
        startDate,
        endDate,
        selectedLabel,
        selctedCameraId,
        locationIdList,
        pageSize,userRole
      )
        .then(response => {
          if (response && response.isSuccess) {
            setPageParams({
              pageSize: response.data.page_size,
              totalPages: response.data.total_pages,
              totalCounts: response.data.total_count
            });
          } else throw new Error();
        })
        .catch(error => {
          if (error.detail) {
            setListLoading(false);
            console.log(error.detail);
          }
        });
    }
  }

  function getMyResults(pageNo, pageSize) {
    setListLoading(true);
    const params = {
      pageSize,
      pageNo,
      jobId,
      startDate,
      endDate,
      selctedCameraId,
      selectedLabel,
      locationIdList,userRole
    };
    getResults(
        params
    )
      .then(response => {
        if (response && response.isSuccess) {
          setCurrentItems(response.data);
          dispatch(actions.setMyResults(response.data));
          currentPage = pageNo;
          setListLoading(false);
          if (response.data.length > 0) {
            setTableData(true);
          } else {
            setTableData(false);
          }
        } else throw new Error();
      })
      .catch(err => {
        if (err.detail) {
          setListLoading(false);
          console.log(err.detail);
        }
      });
  }

  useEffect(() => {
    filterMyResult();
    // eslint-disable-next-line
  }, [currentItems])

  const openViewMyResultDialog = (id,rowdata,cameraname) =>{
    setShow(true)
    setRow(rowdata)

  }  // Table columns

  const columns = [
    {
      dataField: "idx",
      text: "Index",
      sort: true,
    },
    {
      dataField: "camera_name",
      text: "Camera Name",
      sort: true,
      formatter: (_, row) => cameraName[parseInt(row?.camera_id)],
      headerSortingClasses,
    },
    {
      dataField: "count",
      text: "Count",
      sort: true,
      formatter: (_, row) => row?.result?.detection?.length || 0
    },
    {
      dataField: "created_date.$date",
      text: "Created Date",
      sort: true,
      sortCaret: sortCaret,
      headerSortingClasses,
      formatter: (_, row) =>
        moment
          .utc(row?.created_date.$date)
          .local()
          .format("MMMM DD YYYY, h:mm:ss a"),

    },
    {
      dataField: "labels",
      text: "labels",
      sort: true,
      formatter: (_, row) => {
        const labelKeys = Object.keys(row?.counts || {});
        const readableLabels = labelKeys.map(label => convertToReadableString(label));
        return readableLabels.join(", ");
      }
    },
    {
      dataField: "action",
      text: "Actions",
      formatter: actionFormatter(openViewMyResultDialog, cameraName),
    }
  ];


  const [filterEntities, setFilterEntities] = useState(currentItems);
  const searchInput = useRef("");
  
  // Pagination options with size per page dropdown
  const paginationOptions = {
    custom: true,
    totalSize: pageParams.totalCounts,
    page: queryParams.pageNumber,
    sizePerPage: queryParams.pageSize,
    sizePerPageList: [
      { text: '10', value: 10 },
      { text: '50', value: 50 },
      { text: '100', value: 100 }
    ],
    showTotal: true,
    pageStartIndex: 1,
    firstPageText: 'First',
    prePageText: 'Previous',
    nextPageText: 'Next',
    lastPageText: 'Last',
    nextPageTitle: 'Next page',
    prePageTitle: 'Previous page',
    firstPageTitle: 'First page',
    lastPageTitle: 'Last page',
    showSizePerPage: true,
    alwaysShowAllBtns: true,
    onPageChange: (page, sizePerPage) => {
      setQueryParams(prev => ({
        ...prev,
        pageNumber: page,
        pageSize: sizePerPage
      }));
    },
    onSizePerPageChange: (sizePerPage, page) => {
      setQueryParams(prev => ({
        ...prev,
        pageNumber: page,
        pageSize: sizePerPage
      }));
    }
  };
  const filterMyResult = e => {
    const searchStr = (e?.target?.value || searchInput.current.value || "").trim();
    let items = currentItems || [];
    if (searchStr) {
      items = matchSorter(currentItems, searchStr, {
        keys: [
          "_id.$oid",
          "camera_id",
          "created_date.$date",
          "updated_date.$date",
          "status"
        ]
      });
    }
    setFilterEntities(
      items.slice().sort(entitiesSorter(queryParams))
    );
  };
  useEffect(() => {
    if (startDate && endDate) {
      let queryparams = queryParams;
      queryparams.pageNumber = 1;
      queryparams.pageSize = 10;
      setQueryParams(queryparams);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const { pageSize } = queryParams;

    if ((startDate && endDate) || selectedLabel || selctedCameraId) {
      getMyResultMetadata(
        startDate,
        endDate,
        selectedLabel,
        selctedCameraId,
        pageSize
      );
    }
    // eslint-disable-next-line
  }, [queryParams.pageSize]);

  useEffect(() => {
    const { pageNumber, pageSize } = queryParams;
    if (startDate && endDate) {
      getMyResults(pageNumber, pageSize);
    }
    // eslint-disable-next-line
  }, [queryParams, refreshResult]);


// Function to convert base64 string to Blob (with UTF-8 support)
  function base64ToBlobUTF8(base64, mimeType) {
    // Decode base64 string into a byte array
    const byteCharacters = atob(base64); // This will decode a Latin1 base64 string
    const byteNumbers = new Array(byteCharacters.length);

    // Convert the byte characters to a byte array
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    // Create and return a Blob object from the byte array
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  }

// Function to handle file download from Blob
  function downloadExcelFromBlob(blob, fileName = "file.xlsx") {
    try {
      if (!(blob instanceof Blob)) {
        throw new Error("Invalid Blob object. Check API response.");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName; // Set the download file name

      // Trigger the download by simulating a click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the Blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error during file download:", error);
    }
  }

// Usage in handleSubmit:
  const handleSubmit = useCallback(() => {
    if (!filterEntities || filterEntities.length === 0) return;
    
    setIsDownloading(true);
    
    // Extract the 'oids' from filterEntities
    const oids = filterEntities.map(item => item._id?.$oid);

    getResultForResultExcel(oids, userRole)
      .then(response => {
        if (response && response.data) {
          // If it's a base64 string, convert it to a Blob
          if (typeof response.data === "string") {
            const blob = base64ToBlobUTF8(response.data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            downloadExcelFromBlob(blob, "Results.xlsx");
          } else if (response.data instanceof Blob) {
            // If it's already a Blob, download directly
            downloadExcelFromBlob(response.data, "Results.xlsx");
          } else {
            console.error("Invalid response format: not a Blob or base64 string.");
          }
        } else {
          console.error("No data received from server");
        }
      })
      .catch(error => {
        console.error("Error downloading Excel:", error);
      })
      .finally(() => {
        setIsDownloading(false);
      });
  }, [filterEntities, userRole]);

  const handleHide = useCallback(() => {
    setShow(false);
  }, []);

  return (
    <>
      <div className="separator separator-dashed mt-5 mb-5" />
      <BlockUi tag="div" blocking={listLoading} color="#147b82">
        {tableData ? (
          <PaginationProvider
            pagination={paginationFactory(paginationOptions)}
          >
            {({ paginationProps, paginationTableProps }) => {
              return (
                <Pagination
                  isLoading={listLoading}
                  paginationProps={paginationProps}
                >
                  <>
                    <div className="row mb-5 mr-5 d-flex  justify-content-end">

                      {filterEntities && filterEntities.length > 0 && (
                          <Button
                              type="submit"
                              onClick={handleSubmit}
                              className="bt btn-primary btn-elevate d-flex align-items-center"
                              disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <>
                                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <i className="ki ki-download mr-2"></i>
                                Download Excel For Results
                              </>
                            )}
                          </Button>
                      )}

                    </div>
                    <Row>
                      <Col
                        xl={12}
                        style={{
                          padding: "10px 40px 10px 40px",
                          minWidth: "300px"
                        }}
                      >
                        <div style={{ flex: 1, height: "calc(100vh - 531px)", overflowX:"auto" }}>
                        <BootstrapTable
                          wrapperClasses="table-responsive"
                          bordered={false}
                          classes="table employeeTable table-head-custom table-vertical-center table-horizontal-center overflow-hidden"
                          bootstrap4
                          remote
                          keyField="_id.$oid"
                          data={
                            filterEntities?.map((i, idx) => ({
                              ...i,
                              idx:
                                (paginationTableProps?.pagination?.options
                                  ?.page -
                                  1) *
                                  paginationTableProps?.pagination?.options
                                    ?.sizePerPage +
                                1 +
                                idx
                            })) || []
                          }
                          columns={columns}
                          defaultSorted={uiHelpers.defaultSorted}
                          onTableChange={getHandlerTableChange(
                            setQueryParams
                          )}
                          {...paginationTableProps}
                        >
                          <PleaseWaitMessage entities={null} />
                          <NoRecordsFoundMessage entities={null} />
                        </BootstrapTable>
                        </div>
                      </Col>
                    </Row>
                  </>
                </Pagination>
              );
            }}
          </PaginationProvider>
        ) : (
            <div
                style={{
                  minHeight: "calc(100vh - 405px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
            >
              <h3 className="text-center mb-0">No Data Found</h3>
            </div>
        )}
      </BlockUi>

      {show && (
          <MyResultViewDialog
              row={row}
              show={show}
              id={row._id.$oid}
              onHide={handleHide}
              cameraName={cameraName}
          />
      )}
    </>
  );
}
