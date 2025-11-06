import React from "react";
import paginationFactory, {PaginationProvider} from "react-bootstrap-table2-paginator";
import {Button, Modal} from "react-bootstrap";
import {Pagination} from "../../../../../../_metronic/_partials/controls";
import {AutoServingTable} from "../../../../../../utils/AutoServingTable";
import BlockUi from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import {getPaginationOptions} from "../../../../../../_metronic/_helpers";

export default function UsecaseTableModal({
                                              show,
                                              currentItems,
                                              filterEntities,
                                              closeModal,
                                              listLoading,
                                              columns,
                                              queryParams,
                                              setQueryParams,className

                                          }) {


    return (
        <Modal show={show} centered onHide={closeModal} style={{marginTop: "0vh"}} className={className }>
            <Modal.Header closeButton>
                <Modal.Title>Usecase Details</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {currentItems?.length > 0 ? (
                    <PaginationProvider
                        pagination={paginationFactory(
                            getPaginationOptions(filterEntities.length, queryParams)
                        )}
                    >
                        {({paginationProps, paginationTableProps}) => (
                            <>
                                <BlockUi tag="div" blocking={listLoading} color="#147b82">
                                    <div style={{flex: 1, height: "calc(100vh - 600px)", overflowX: "auto"}}>
                                        <AutoServingTable
                                            columns={columns}
                                            items={currentItems}
                                            tableChangeHandler={setQueryParams}
                                            paginationTableProps={paginationTableProps}
                                        />
                                    </div>

                                </BlockUi>
                                <Pagination isLoading={listLoading} paginationProps={paginationProps}/>
                            </>
                        )}
                    </PaginationProvider>
                ) : (
                    <h3 style={{paddingTop: "40px"}} className="text-center">
                        No Data Found
                    </h3>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
