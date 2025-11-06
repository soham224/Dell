import React, { useCallback, useEffect, useState } from "react";
import { Col, FormControl, InputGroup, Row } from "react-bootstrap";
import { Card, CardBody } from "reactstrap";
import BlockUi from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import { warningToast } from "../../../../../../utils/ToastMessage";
import { ModelCard } from "./ModelCard";
import { useSubheader } from "../../../../../../_metronic/layout";

// Import your model data JSON (array of model objects)
import modelData from "./../model/modalData.json";
import * as action from "../../../Locations/_redux/LocationAction";
import FetchViolationModal from "../../../../../../utils/FetchViolationModal";
import {shallowEqual, useDispatch, useSelector} from "react-redux"; // Adjust path if needed

function ModelCategories({ user, isPublic }) {
    const dispatch = useDispatch();
    const [showBarTable, setShowBarTable] = useState(false);
    const [loaderState, setLoaderState] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [modalData, setModalData] = useState(modelData);
    const [searchDataCalled, setSearchDataCalled] = useState(false);
    
    const subheader = useSubheader();
    subheader.setTitle("Marketplace");


    const {popupData} = useSelector(
        state => ({
            popupData: state.location?.popupData,
        }),
        shallowEqual
    );

    // Search input handler
    const handleModelSearch = useCallback((e) => setSearchValue(e.target.value), []);

    // Fake search API to filter modelData locally
    const getSearchDataOfModal = async (query, userId, isPublic) => {
        const filtered = modelData.filter((model) =>
            model.model_name.toLowerCase().includes(query.toLowerCase())
        );
        return new Promise((resolve) =>
            setTimeout(() => resolve({ data: filtered }), 500)
        );
    };

    useEffect(() => {
        if (searchValue.length > 2) {
            const timeout = setTimeout(() => {
                searchData(searchValue);
            }, 500);

            return () => clearTimeout(timeout);
        } else if (searchValue.length === 0) {
            setModalData(modelData);
            setSearchDataCalled(false);
        }
    }, [searchValue]);

    const searchData = async (query = searchValue) => {
        if (!query) return;

        setLoaderState(true);
        setSearchDataCalled(true);

        try {
            const response = await getSearchDataOfModal(query, user?.id, isPublic);
            setModalData(response?.data || []);
        } catch (error) {
            warningToast(error?.detail || "Something went wrong");
            setModalData([]);
        } finally {
            setLoaderState(false);
        }
    };

    const handleCloseModal = useCallback(() =>{
        dispatch(action.clearPopupDataAction())
        setShowBarTable(false)
    }, [dispatch]);

    useEffect(() => {
        if(popupData.length > 0){
            setShowBarTable(true)
        }else {
            setShowBarTable(false)
        }
    }, [popupData]);

    let modelContent;
    if (modalData.length > 0) {
        modelContent = modalData.map((model, index) => (
            <Col key={model.id || index} md={4} sm={6} xs={12} className="mb-4">
                <ModelCard model={model} />
            </Col>
        ));
    } else if (searchDataCalled) {
        modelContent = (
            <Col>
                <p className="text-center text-muted mt-4">No models found.</p>
            </Col>
        );
    } else {
        modelContent = (
            <Col>
                <p className="text-center text-muted mt-4">Start searching for models.</p>
            </Col>
        );
    }

    return (
        <>
        <Card>
            <CardBody>
                <Row className="align-items-center mb-3">
                    <Col xs={12} md={6}>
                        <h4 className="mb-3 mb-md-0">Marketplace Details</h4>
                    </Col>
                    <Col xs={12} md={6} style={{ maxWidth: 500, minWidth: 280, marginLeft: "auto" }}>
                        <InputGroup size="lg" className="w-100">
                            <InputGroup.Text>Search Model</InputGroup.Text>
                            <FormControl
                                size="lg"
                                aria-label="Search Model"
                                value={searchValue}
                                onChange={handleModelSearch}
                                placeholder="Type at least 3 characters"
                            />
                        </InputGroup>
                    </Col>
                </Row>
                <hr />

                <BlockUi tag="div" blocking={loaderState}>
                    <Row>
                        {modelContent}
                    </Row>
                </BlockUi>
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

export default ModelCategories;
