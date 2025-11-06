import React from "react";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
export const CommonBoootstrapTable = ({
  columns,
  data,
  sizePerPage,
  onTableChange,
  page,
  totalSize,
  hideSizePerPage,
  alwaysShowAllBtns,
  hidePageListOnlyOnePage,
  sizePerPageList,
  showTotal
}) => {

    const paginationTest = paginationFactory({
        page: page,
        sizePerPage: sizePerPage,
        totalSize: totalSize,
        showTotal: showTotal ? showTotal : true,
        alwaysShowAllBtns: alwaysShowAllBtns ? alwaysShowAllBtns : true,
        hideSizePerPage: hideSizePerPage ? hideSizePerPage : false,
        hidePageListOnlyOnePage: hidePageListOnlyOnePage,
        sizePerPageList: sizePerPageList ,
    });


    return (
    <BootstrapTable
      keyField="_id"
      remote
      classes="table table-head-custom table-vertical-center table-horizontal-center overflow-hidden "
      bootstrap4
      bordered={false}
      wrapperClasses="table-responsive table-hight-custom"
      data={data}
      hideSizePerPage
      columns={columns}
      pagination={paginationTest}
      onTableChange={onTableChange}
    />
  );
};
