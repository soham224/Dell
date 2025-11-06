import React, {useCallback, useEffect, useState} from "react";
import { Form, Modal } from "react-bootstrap";
import { warningToast } from "../../../../../../utils/ToastMessage";
import Select from "react-select";
import { getAllCamera, getAllUsecase } from "../../_redux/UsecaseAPI";
import {getAllCompany} from "../../../Locations/_redux/LocationAPI";
import {getLocationList} from "../../../AddSupervisor/_redux";
import {shallowEqual, useSelector} from "react-redux";
import {Button} from "reactstrap";
import {SUPER_ADMIN_ROLE} from "../../../../../../enums/constant";

export default function UsecaseEditForm({ saveUsecase, usecaseData, onHide }) {
    const [cameraLoading, setCameraLoading] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [cameraOptions, setCameraOptions] = useState([]);
    const [timeBeforeEvent, setTimeBeforeEvent] = useState(1);
    const [timeAfterEvent, setTimeAfterEvent] = useState(1);
    const [inferenceOutput, setInferenceOutput] = useState(1);
    const [error, setError] = useState({});
    const [useCaseLoading, setUseCaseLoading] = useState(false);
    const [selectedUseCase, setSelectedUseCase] = useState(null);
    const [useCaseOptions, setUseCaseOptions] = useState([]);
    const [companyLoading, setCompanyLoading] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [selectedLocation,setSelectedLocation] = useState(null)
    const [
        locationOptions,
        setLocationOptions,
    ] = useState([]);

    const {userRole} = useSelector(
        ({auth}) => ({
            userRole: auth.user?.roles?.length && auth.user.roles[0]?.role
        }),
        shallowEqual
    );
    useEffect(() => {
        if (userRole === SUPER_ADMIN_ROLE) {
            getAllUseCases();
        }
        }, [userRole]);
    useEffect(() => {
        if(selectedLocation?.value && userRole === SUPER_ADMIN_ROLE){
            getAllCameras();
        }
    }, [selectedLocation?.value,userRole]);
    useEffect(() => {
        if(selectedCompany?.value && userRole === SUPER_ADMIN_ROLE){
            getAllLocations();
        }
    }, [selectedCompany?.value,userRole]);

    useEffect(() => {
        if (userRole === SUPER_ADMIN_ROLE) {
            setCompanyLoading(true);
            getAllCompany()
                .then(response => {
                    if (response?.data) {
                        const companyOptions = response.data.map(obj => ({
                            label: obj.company_name,
                            value: obj.id
                        }));
                        setCompanyOptions(companyOptions);
                    }
                    setCompanyLoading(false);
                })
                .catch(error => {
                    setCompanyLoading(false);
                    warningToast(error?.detail || "Something went wrong");
                });
        }
    }, [userRole]);

    const getAllLocations = () => {
        setLocationLoading(true);
        getLocationList(userRole,selectedCompany?.value)
            .then(response => {
                if (response && response.data) {
                    let locationOptions = [];
                    response.data.map(obj =>
                        locationOptions.push({label: obj.location_name, value: obj.id})
                    );
                    setLocationLoading(false);
                    setLocationOptions(locationOptions);
                }
            })
            .catch(error => {
                setLocationLoading(false);
                if (error.detail) {
                    console.log(error.detail);
                }
            });
    };

    const getAllUseCases = () => {
        setUseCaseLoading(true);
        getAllUsecase()
            .then(response => {
                if (response?.data) {
                    const usecaseOptions = response.data.map(obj => ({
                        label: obj.usecase,
                        value: obj.id
                    }));
                    setUseCaseOptions(usecaseOptions);
                }
                setUseCaseLoading(false);
            })
            .catch(error => {
                setUseCaseLoading(false);
                console.log(error?.detail || "Something went wrong");
            });
    };

    const getAllCameras = () => {
        setCameraLoading(true);
        getAllCamera(selectedLocation?.value)
            .then(response => {
                if (response?.data) {
                    const cameraOptions = response.data.map(obj => ({
                        label: obj.camera_name,
                        value: obj.id
                    }));
                    setCameraOptions(cameraOptions);
                }
                setCameraLoading(false);
            })
            .catch(error => {
                setCameraLoading(false);
                console.log(error?.detail || "Something went wrong");
            });
    };

    // Individual validators
    const validateCompany = (value, userRole) => {
        if (userRole === SUPER_ADMIN_ROLE && !value) return "Company is required";
        return "";
    };

    const validateLocation = (value) => (!value ? "Location is required" : "");

    const validateCamera = (value) => (!value ? "Camera is required" : "");

    const validateUseCase = (value) => (!value ? "Use case is required" : "");

    const validateTime = (value) => {
        const num = parseInt(value, 10);
        return isNaN(num) || num < 1 || num > 10 ? "Must be between 1 and 10" : "";
    };

    const validateInference = (value, selectedUseCase) => {
        const num = parseInt(value, 10);
        if (selectedUseCase?.label === "loitering" && (isNaN(num) || num < 1 || num > 180)) {
            return "Must be between 1 and 180";
        }
        return "";
    };

    // Main dispatcher
    const validateField = (field, value) => {
        let message = "";
        switch (field) {
            case "company":
                message = validateCompany(value, userRole);
                break;
            case "location":
                message = validateLocation(value);
                break;
            case "camera":
                message = validateCamera(value);
                break;
            case "useCase":
                message = validateUseCase(value);
                break;
            case "timeBeforeEvent":
            case "timeAfterEvent":
                message = validateTime(value);
                break;
            case "inference":
                message = validateInference(value, selectedUseCase);
                break;
            default:
                break;
        }
        setError(prev => ({ ...prev, [field]: message }));
        return !message;
    };

    const handleBlur = (field, value) => {
        validateField(field, value);
    };

    // Define the functions outside of the JSX
    const handleCompanyBlur = useCallback(() => handleBlur("company", selectedCompany?.value), [selectedCompany]);
    const handleLocationBlur = useCallback(() => handleBlur("location", selectedLocation?.value), [selectedLocation]);
    const handleCameraBlur = useCallback(() => handleBlur("camera", selectedCamera?.value), [selectedCamera]);
    const handleUseCaseBlur = useCallback(() => handleBlur("useCase", selectedUseCase?.value), [selectedUseCase]);
    const handleTimeBeforeEventBlur = useCallback(() => handleBlur("timeBeforeEvent", timeBeforeEvent), [timeBeforeEvent]);
    const handleTimeAfterEventBlur = useCallback(() => handleBlur("timeAfterEvent", timeAfterEvent), [timeAfterEvent]);
    const handleInferenceBlur = useCallback(() => handleBlur("inference", inferenceOutput), [inferenceOutput]);

    // Use useCallback for handleChangeCompany
    const handleChangeCompany = useCallback((selected) => {
        setSelectedCompany(selected);
        setSelectedLocation(null);
        setSelectedCamera(null);
        setSelectedUseCase(null);
        setTimeBeforeEvent(1);
        setTimeAfterEvent(1);
        setInferenceOutput(1);
        validateField("company", selected?.value);
    }, [validateField]);

    // Similarly, wrap other handlers with useCallback
    const handleLocationChange = useCallback((selected) => {
        setSelectedLocation(selected);
        setSelectedCamera(null);
        setSelectedUseCase(null);
        setTimeBeforeEvent(1);
        setTimeAfterEvent(1);
        setInferenceOutput(1);
        validateField("location", selected?.value);
    }, [validateField]);

    const handleCameraChange = useCallback((selected) => {
        setSelectedCamera(selected);
        setSelectedUseCase(null);
        setTimeBeforeEvent(1);
        setTimeAfterEvent(1);
        setInferenceOutput(1);
        validateField("camera", selected?.value);
    }, [validateField]);

    const handleUseCaseChange = useCallback((selected) => {
        setSelectedUseCase(selected);
        setTimeBeforeEvent(1);
        setTimeAfterEvent(1);
        setInferenceOutput(1);
        validateField("useCase", selected?.value);
        // Revalidate inference when switching use case
        if (selected?.label === "loitering") {
            validateField("inference", 1);
            validateField("timeBeforeEvent", 1);
            validateField("timeAfterEvent", 1);
        } else {
            // Clear any previous inference error
            setError(prev => ({ ...prev, inference: "" ,timeBeforeEvent:"",timeAfterEvent:""}));
        }
    }, [validateField, setError]);

    const handleVideoChange = useCallback((e) => {
        const { name, value } = e.target;
        const numValue = parseInt(value, 10);

        if (isNaN(numValue)) {
            if (name === "timeBeforeEvent") {
                setTimeBeforeEvent("");
                validateField("timeBeforeEvent", "");
            } else if (name === "timeAfterEvent") {
                setTimeAfterEvent("");
                validateField("timeAfterEvent", "");
            }
            return;
        }

        if (name === "timeBeforeEvent") {
            setTimeBeforeEvent(numValue);
            validateField("timeBeforeEvent", numValue);
        } else if (name === "timeAfterEvent") {
            setTimeAfterEvent(numValue);
            validateField("timeAfterEvent", numValue);
        }
    }, [validateField]);


    const handleInferenceChange = useCallback((e) => {
        const numValue = parseInt(e.target.value, 10);

        if (isNaN(numValue)) {
            setInferenceOutput("");
            validateField("inference", "");
            return;
        }

        setInferenceOutput(numValue);
        validateField("inference", numValue);
    },[validateField]);


    useEffect(() => {
        setSelectedCamera(usecaseData?.CameraManager ? { label: usecaseData?.CameraManager?.camera_name, value: usecaseData?.CameraManager?.id } : null);
        setSelectedUseCase(usecaseData?.UseCase ? { label: usecaseData?.UseCase?.usecase, value: usecaseData?.UseCase?.id } : null)
        setTimeBeforeEvent(usecaseData?.CameraUseCaseMapping?.second_before_event || 1);
        setTimeAfterEvent(usecaseData?.CameraUseCaseMapping?.second_after_event || 1);
        setInferenceOutput(usecaseData?.CameraUseCaseMapping?.usecase_timeout || 1);
        if (usecaseData?.Location?.company_id && companyOptions.length > 0) {
            const selected = companyOptions.find(opt => opt.value === usecaseData?.Location?.company_id);
            setSelectedCompany(selected);
        }

        if(usecaseData?.Location){
            setSelectedLocation({label :usecaseData?.Location?.location_name,value:usecaseData?.Location?.id || null});
        }
    }, [usecaseData,companyOptions]);

    const isValidate = () => {
        const fields = [
            { key: "company", value: selectedCompany?.value },
            { key: "location", value: selectedLocation?.value },
            { key: "camera", value: selectedCamera?.value },
            { key: "useCase", value: selectedUseCase?.value },
            { key: "timeBeforeEvent", value: timeBeforeEvent },
            { key: "timeAfterEvent", value: timeAfterEvent },
        ];
        if (selectedUseCase?.label === "loitering") {
            fields.push({ key: "inference", value: inferenceOutput });
        }

        let valid = true;
        fields.forEach(field => {
            const isFieldValid = validateField(field.key, field.value);
            if (!isFieldValid) valid = false;
        });
        return valid;
    };



    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (isValidate()) {
            const data = {
                camera_id: selectedCamera?.value || 0,
                usecase_id: selectedUseCase?.value || 0,
                second_before_event: timeBeforeEvent || 1,
                second_after_event: timeAfterEvent || 1,
                usecase_timeout: inferenceOutput || 1,
                id: usecaseData?.CameraUseCaseMapping?.id
            };
            saveUsecase(data);
        }
    }, [isValidate, saveUsecase, selectedCamera, selectedUseCase, timeBeforeEvent, timeAfterEvent, inferenceOutput, usecaseData]);

    // Define theme outside of conditional rendering
    const selectTheme = useCallback((theme) => ({
        ...theme,
        borderRadius: 0,
        colors: {
            ...theme.colors,
            primary25: "#5DBFC4",
            primary: "#147b82",
        },
    }), []);

    return (
        <>
            <Modal.Body>
                <Form>
                    {userRole === SUPER_ADMIN_ROLE && (
                        <Form.Group controlId="companySelect">
                            <Form.Label>Select Company</Form.Label>
                            <Select
                                theme={selectTheme}
                                isLoading={companyLoading}
                                isSearchable
                                placeholder="Select Company"
                                className={`select-react-dropdown ${error.company ? 'is-invalid' : ''}`}
                                value={selectedCompany}
                                onBlur={handleCompanyBlur}
                                onChange={handleChangeCompany}
                                options={companyOptions}
                                isDisabled={usecaseData}
                            />
                            {error.company && (
                                <div className="invalid-feedback d-block">{error.company}</div>
                            )}
                        </Form.Group>
                    )}


                    <Form.Group controlId="locationName">
                        <Form.Label>Select Location</Form.Label>
                        <Select
                            theme={selectTheme}
                            isLoading={locationLoading}
                            isSearchable
                            placeholder="Select Location"
                            className={`select-react-dropdown ${error.location ? 'is-invalid' : ''}`}
                            value={selectedLocation}
                            onBlur={handleLocationBlur}
                            onChange={handleLocationChange}
                            options={locationOptions}
                            isDisabled={usecaseData}
                        />
                        {error.location && (
                            <div className="invalid-feedback d-block">{error.location}</div>
                        )}
                    </Form.Group>

                    <Form.Group controlId="cameraSelect">
                        <Form.Label>Select Camera</Form.Label>
                        <Select
                            theme={selectTheme}
                            isLoading={cameraLoading}
                            isSearchable
                            placeholder="Select Camera"
                            className={`select-react-dropdown ${error.camera ? 'is-invalid' : ''}`}
                            value={selectedCamera}
                            onBlur={handleCameraBlur}
                            onChange={handleCameraChange}
                            options={cameraOptions}
                            isDisabled={usecaseData}
                        />
                        {error.camera && (
                            <div className="invalid-feedback d-block">{error.camera}</div>
                        )}
                    </Form.Group>

                    <Form.Group controlId="useCaseSelect">
                        <Form.Label>Select UseCase</Form.Label>
                        <Select
                            theme={selectTheme}
                            isLoading={useCaseLoading}
                            placeholder="Select UseCase"
                            className={`select-react-dropdown ${error.useCase ? 'is-invalid' : ''}`}
                            value={selectedUseCase}
                            onBlur={handleUseCaseBlur}
                            onChange={handleUseCaseChange}
                            options={useCaseOptions}
                            isDisabled={usecaseData}
                        />
                        {error.useCase && (
                            <div className="invalid-feedback d-block">{error.useCase}</div>
                        )}
                    </Form.Group>

                    <Form.Group controlId="timeBeforeEvent">
                        <Form.Label>Time Before Event</Form.Label>
                        <Form.Control
                            type="number"
                            name="timeBeforeEvent"
                            min={1}
                            max={10}
                            placeholder="Time Before Event"
                            value={timeBeforeEvent}
                            onBlur={handleTimeBeforeEventBlur}
                            onChange={handleVideoChange}
                            isInvalid={!!error.timeBeforeEvent}
                        />
                        <Form.Control.Feedback type="invalid">
                            {error.timeBeforeEvent}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="timeAfterEvent">
                        <Form.Label>Time After Event</Form.Label>
                        <Form.Control
                            type="number"
                            name="timeAfterEvent"
                            min={1}
                            max={10}
                            placeholder="Time After Event"
                            value={timeAfterEvent}
                            onChange={handleVideoChange}
                            onBlur={handleTimeAfterEventBlur}
                            isInvalid={!!error.timeAfterEvent}
                        />
                        <Form.Control.Feedback type="invalid">
                            {error.timeAfterEvent}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {selectedUseCase?.label === "loitering" &&
                        <Form.Group controlId="inferenceOutput">
                            <Form.Label>Inference Output</Form.Label>
                            <Form.Control
                                type="number"
                                min={1}
                                max={180}
                                placeholder="Inference Output"
                                value={inferenceOutput}
                                onChange={handleInferenceChange}
                                onBlur={handleInferenceBlur}
                                isInvalid={!!error.inference}
                            />
                            <Form.Control.Feedback type="invalid">
                                {error.inference}
                            </Form.Control.Feedback>
                        </Form.Group>}
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button color={'secondary'} onClick={onHide}>
                    Cancel
                </Button>
                <Button color={'primary'} onClick={handleSubmit}>
                    Save
                </Button>
            </Modal.Footer>
        </>
    );
}
