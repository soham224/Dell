import React, { useCallback } from "react";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory, {
  PaginationProvider
} from "react-bootstrap-table2-paginator";
import { Col, Row } from "reactstrap";
import BlockUi from "@availity/block-ui";
import PropTypes from 'prop-types';
import {Pagination} from "../controls";
import * as uiHelpers from "../../../utils/UIHelpers";
import {getPaginationOptions, NoRecordsFoundMessage, PleaseWaitMessage} from "../../_helpers";

// Move sizePerPageRenderer function outside of render
const sizePerPageRenderer = ({ options, currSizePerPage, onSizePerPageChange }) => (
  <div className="btn-group">
    {options.map(option => (
      <button
        key={option.text}
        type="button"
        onClick={() => onSizePerPageChange(option.value)}
        className={`btn ${currSizePerPage === option.value ? 'btn-primary' : 'btn-secondary'}`}
      >
        {option.text}
      </button>
    ))}
  </div>
);

export function MyResultTableDashboard({
  listLoading,
  tableData,
  pageParams,
  queryParams,
  filterEntities,
  columns,
  setQueryParams,
}) {
  // Memoize the handler
  const handleTableChange = useCallback(
    (type, { page, sizePerPage, sortField, sortOrder }) => {
      const newParams = {
        pageNumber: type === 'sizePerPage' ? 1 : page,
        pageSize: sizePerPage || queryParams.pageSize || 10,
        sortField: sortField,
        sortOrder: sortOrder
      };
      setQueryParams(newParams);
    },
    [setQueryParams, queryParams.pageSize]
  );

  return (
    <>
      <div className="mt-3 mb-5" />
      <BlockUi tag="div" blocking={listLoading} color="#147b82">
        {tableData && filterEntities && filterEntities.length > 0 ? (
          <PaginationProvider
            pagination={paginationFactory({
              ...getPaginationOptions(pageParams.totalCounts, queryParams),
              page: queryParams.pageNumber,
              sizePerPage: queryParams.pageSize,
              totalSize: pageParams.totalCounts,
              custom: true,
              sizePerPageList: [
                { text: '10', value: 10 },
                { text: '50', value: 50 },
                { text: '100', value: 100 },
              ],
              sizePerPageRenderer: sizePerPageRenderer
            })}
          >
            {({ paginationProps, paginationTableProps }) => {
              return (
                <Pagination
                  isLoading={listLoading}
                  paginationProps={paginationProps}
                >
                  <>
                    <Row>
                      <Col
                        xl={12}
                        style={{
                          padding: "10px 40px 10px 40px",
                          minWidth: "300px"
                        }}
                      >
                        <div style={{ 
                          height: "400px", 
                          overflowY: "auto",
                          overflowX: "hidden"
                        }}>
                          <BootstrapTable
                            wrapperClasses="table-responsive"
                            bordered={false}
                            classes="table employeeTable table-head-custom table-vertical-center table-horizontal-center overflow-hidden"
                            bootstrap4
                            remote
                            keyField="_id.$oid"
                            data={filterEntities || []}
                            columns={columns}
                            defaultSorted={uiHelpers.defaultSorted}
                            onTableChange={handleTableChange}
                            {...paginationTableProps}
                          >
                            <PleaseWaitMessage entities={filterEntities} />
                            <NoRecordsFoundMessage entities={filterEntities} />
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
            <h4 className="text-center mb-0">No Data Found</h4>
          </div>
        )}
      </BlockUi>

    </>
  );
}

MyResultTableDashboard.propTypes = {
  listLoading: PropTypes.bool.isRequired,
  tableData: PropTypes.bool,
  pageParams: PropTypes.shape({
    totalCounts: PropTypes.number.isRequired
  }).isRequired,
  queryParams: PropTypes.object.isRequired,
  filterEntities: PropTypes.array,
  columns: PropTypes.array.isRequired,
  setQueryParams: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  show: PropTypes.bool,
  row: PropTypes.object,
  onViewHide: PropTypes.func.isRequired,
  MyResultViewDialog: PropTypes.elementType.isRequired
};
