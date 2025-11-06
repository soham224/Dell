import React, {useCallback, useEffect, useState} from "react";
import { Form, Modal } from "react-bootstrap";
import { warningToast } from "../../../../../../utils/ToastMessage";
import { shallowEqual, useSelector } from "react-redux";
import { getLocationList} from "../../../AddSupervisor/_redux";
import Select from "react-select";
import {getAllCompany} from "../../../Locations/_redux/LocationAPI";
import {Button} from "reactstrap";

export default function CameraEditForm({ saveCamera, cameraData, onHide }) {
  const [formData, setFormData] = useState({
    cameraName: "",
    id: "",
    rtspUrl:"",
    processFps:"",
    companyId: null
  });
  const [error, setError] = useState({
    cameraName: "",
    rtspUrl: "",
    processFps: "",
    company: "",
    location: ""
  });

  const [companyLoading, setCompanyLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocation,setSelectedLocation] = useState(null)
  const [
    locationOptions,
    setLocationOptions,
  ] = useState([]);
  // eslint-disable-next-line
  const {userRole} = useSelector(
      ({auth}) => ({
        userRole: auth.user?.roles?.length && auth.user.roles[0]?.role
      }),
      shallowEqual
  );

  const isValidate = () => {
    let valid = true;
    const newErrors = {
      cameraName: "",
      rtspUrl: "",
      processFps: "",
      company: "",
      location: ""
    };

    if (!formData.cameraName) {
      newErrors.cameraName = "Please enter Camera Name";
      valid = false;
    }
    if (!selectedCompany?.value) {
      newErrors.company = "Please select a Company";
      valid = false;
    }
    if (!selectedLocation?.value) {
      newErrors.location = "Please select a Location";
      valid = false;
    }
    if (!formData.rtspUrl) {
      newErrors.rtspUrl = "Please enter RTSP URL";
      valid = false;
    }
    if (!formData.processFps) {
      newErrors.processFps = "Please enter Process FPS";
      valid = false;
    }

    setError(newErrors);
    return valid;
  };


  useEffect(() => {
    if(selectedCompany?.value){
      getAllLocations();
    }
    }, [selectedCompany?.value]);

  useEffect(() => {
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
  }, []);
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
            warningToast(error.detail);
          } else {
            warningToast("Something went Wrong");
          }
        });
  };
  const handleLocationChange = useCallback((selected) => {
    setSelectedLocation(selected);
    if (selected?.value) {
      setError(prev => ({ ...prev, location: "" }));
    }
  },[error,setError])

  const handleBlurLocation = useCallback(() => {
      if (!selectedLocation?.value) {
        setError(prev => ({ ...prev, location: "Please select a location" }));
      }
  },[error,setError]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error on change
    if (value.trim() !== "") {
      setError(prev => ({ ...prev, [name]: "" }));
    }
  },[error,setError]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;

    if (!value.trim()) {
      setError(prev => ({
        ...prev,
        [name]: `Please enter ${name === "processFps" ? "Process FPS" : name}`
      }));
    }
  },[error,setError]);



  useEffect(() => {
    setFormData({
      cameraName: cameraData?.camera_name || "",
      id: cameraData?.id || null,
      rtspUrl:cameraData?.rtsp_url || "",
      processFps:cameraData?.process_fps || "",
      companyId: cameraData?.location_details?.company_id || null
    });
    if (cameraData?.location_details?.company_id && companyOptions.length > 0) {
      const selected = companyOptions.find(opt => opt.value === cameraData?.location_details?.company_id);
      setSelectedCompany(selected);
    }
    if(cameraData?.location_details){
      setSelectedLocation({label :cameraData?.location_details?.location_name,value:cameraData?.location_details?.id || null});
    }
  }, [cameraData,companyOptions]);


  const handleChangeCompany = useCallback((selected) => {
    setSelectedCompany(selected);
    setFormData(prev => ({ ...prev, companyId: selected?.value || null }));
    setSelectedLocation(null);
    if (selected?.value) setError(prev => ({ ...prev, company: "" }));
  },[error,setError]);

  const handleBlurCompany = useCallback(() => {
    if (!selectedCompany?.value) {
      setError(prev => ({ ...prev, company: "Please select a Company" }));
    }
  },[error,setError]);


  const handleSubmit = useCallback(() => {
    let data = {
      rtsp_url: formData?.rtspUrl.trim() || "",
      camera_name: formData?.cameraName.trim() || "",
      location_id: selectedLocation?.value || null,
      process_fps: formData?.processFps || '',
      id: formData?.id || null
    };
    if (isValidate()) {
      saveCamera(data);
    }
  },[isValidate]);
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
          <Form.Group controlId="cameraName">
            <Form.Label>Camera Name</Form.Label>
            <Form.Control
                type="text"
                name="cameraName"
                placeholder="Camera name"
                value={formData.cameraName}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={!!error.cameraName}
            />
            {error.cameraName && (
                <div className="invalid-feedback d-block">{error.cameraName}</div>
            )}

          </Form.Group>

          <Form.Group controlId="companySelect">
            <Form.Label>Select Company</Form.Label>
            <Select
                theme={selectTheme}
                isLoading={companyLoading}
                isSearchable
                placeholder="Select Company"
                className={`select-react-dropdown ${error.company ? 'is-invalid' : ''}`}
                value={selectedCompany}
                onChange={handleChangeCompany}
                onBlur={handleBlurCompany}
                options={companyOptions}
                isDisabled={!!cameraData}
            />
            {error.company && <div className="invalid-feedback d-block">{error.company}</div>}
          </Form.Group>

          <Form.Group controlId="locationSelect">
            <Form.Label>Select Location</Form.Label>
            <Select
                theme={selectTheme}
                isLoading={locationLoading}
                isSearchable
                placeholder="Select Location"
                className={`select-react-dropdown ${error.location ? 'is-invalid' : ''}`}
                value={selectedLocation}
                onChange={handleLocationChange}
                onBlur={handleBlurLocation}
                options={locationOptions}
            />
            {error.location && (
                <div className="invalid-feedback d-block">{error.location}</div>
            )}

          </Form.Group>

          <Form.Group controlId="rtspUrl">
            <Form.Label>RTSP URL</Form.Label>
            <Form.Control
                type="text"
                name="rtspUrl"
                placeholder="RTSP URL"
                value={formData.rtspUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={!!error.rtspUrl}
            />
            {error.rtspUrl && (
                <div className="invalid-feedback d-block">{error.rtspUrl}</div>
            )}
          </Form.Group>

          <Form.Group controlId="processFps">
            <Form.Label>Process FPS</Form.Label>
            <Form.Control
                type="text"
                name="processFps"
                placeholder="Process FPS"
                value={formData.processFps}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={!!error.processFps}
            />
            {error.processFps && (
                <div className="invalid-feedback d-block">{error.processFps}</div>
            )}
          </Form.Group>
        </Form>

      </Modal.Body>
      <Modal.Footer>
        <Button
          color={'secondary'}
          onClick={onHide}
        >
          Cancel
        </Button>
        <> </>
        <Button
            color={'primary'}
          onClick={handleSubmit}
        >
          Save
        </Button>
      </Modal.Footer>
    </>
  );
}
