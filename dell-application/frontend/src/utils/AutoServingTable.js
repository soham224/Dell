import * as uiHelpers from "./UIHelpers";
import {
  getHandlerTableChange,
  NoRecordsFoundMessage,
  PleaseWaitMessage,
} from "../_metronic/_helpers";
import BootstrapTable from "react-bootstrap-table-next";
import React from "react";

export const AutoServingTable = ({
                                   items,
                                   columns,
                                   tableChangeHandler,
                                   paginationTableProps,
                                   selectRow,
                                 }) => {
  const page = paginationTableProps?.pagination?.options?.page || 1;
  const sizePerPage = paginationTableProps?.pagination?.options?.sizePerPage || items?.length || 10;
  const idxStart = (page - 1) * sizePerPage + 1;

  const enableRemote = !!paginationTableProps; // true only if remote pagination is being used

  return (
      <BootstrapTable
          wrapperClasses="table-responsive"
          bordered={false}
          classes="table employeeTable table-head-custom table-vertical-center table-horizontal-center overflow-hidden"
          bootstrap4
          remote={enableRemote}
          keyField="id"
          data={items?.map((i, idx) => ({ ...i, idx: idxStart + idx })) || []}
          columns={columns}
          defaultSorted={uiHelpers.defaultSorted}
          onTableChange={enableRemote ? getHandlerTableChange(tableChangeHandler) : undefined}
          hideSelectColumn
          {...(paginationTableProps || {})}
          selectRow={selectRow}
      >
        <PleaseWaitMessage entities={items} />
        <NoRecordsFoundMessage entities={items} />
      </BootstrapTable>
  );
};
