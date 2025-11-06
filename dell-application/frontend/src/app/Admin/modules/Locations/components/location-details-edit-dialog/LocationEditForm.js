import React, {useCallback, useEffect, useState} from "react";
import { Form, Modal } from "react-bootstrap";
import { warningToast } from "../../../../../../utils/ToastMessage";
import Select from "react-select";
import {getAllCompany} from "../../_redux/LocationAPI";
import {Button} from "reactstrap";

export default function LocationEditForm({ saveLocation, locationData, onHide }) {
  const [formData, setFormData] = useState({
    locationName: "",
    id: "",
    companyId: null
  });
  const [error, setError] = useState({
    companyId: "",
    locationName: ""
  });


  const [companyLoading, setCompanyLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyOptions, setCompanyOptions] = useState([]);

  const isValidate = () => {
    let isValid = true;
    const newErrors = {
      companyId: "",
      locationName: ""
    };

    if (!formData.companyId) {
      newErrors.companyId = "Please select a Company";
      isValid = false;
    }

    if (!formData.locationName) {
      newErrors.locationName = "Please enter Location Name";
      isValid = false;
    }

    setError(newErrors);
    return isValid;
  };



  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error only on typing (not show anything new here)
    if (name === "locationName" && error.locationName) {
      setError(prev => ({ ...prev, locationName: "" }));
    }
  },[error,setError]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;

    if (name === "locationName" && !value.trim()) {
      setError(prev => ({ ...prev, locationName: "Please enter Location Name" }));
    }
  },[setError]);


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
          console.log(error?.detail || "Something went wrong");
        });
  }, []);

  useEffect(() => {
    setFormData({
      locationName: locationData?.location_name || "",
      id: locationData?.id || null,
      companyId: locationData?.company_id || null
    });

    if (locationData?.company_id && companyOptions.length > 0) {
      const selected = companyOptions.find(opt => opt.value === locationData.company_id);
      setSelectedCompany(selected);
    }
  }, [locationData, companyOptions]);



  const handleSubmit = useCallback(() => {
    if (isValidate()) {
      saveLocation(formData);
    }
  },[isValidate]);
  const handleChangeCompany = useCallback((selected) => {
    setSelectedCompany(selected);

    setFormData(prevData => ({
      ...prevData,
      companyId: selected?.value || null
    }));

    // Clear error on select
    if (selected?.value && error.companyId) {
      setError(prev => ({ ...prev, companyId: "" }));
    }
  },[error,setError]);

  const handleBlurCompany = useCallback(() => {
    if (!formData.companyId) {
      setError(prev => ({ ...prev, companyId: "Please select a Company" }));
    }
  },[setError,formData]);

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
          <Form.Group controlId="cameraSelect">
            <Form.Label>Select Company</Form.Label>
            <Select
                theme={selectTheme}
                isLoading={companyLoading}
                isSearchable
                placeholder="Select Company"
                className={`select-react-dropdown ${error.companyId ? 'is-invalid' : ''}`}
                value={selectedCompany}
                onBlur={handleBlurCompany}
                onChange={handleChangeCompany}
                options={companyOptions}
                isDisabled={locationData}
            />
            {error.companyId && (
                <div className="invalid-feedback d-block">{error.companyId}</div>
            )}
          </Form.Group>


          <Form.Group controlId="locationName">
            <Form.Label>Location Name</Form.Label>
            <Form.Control
                type="text"
                name="locationName"
                placeholder="Location name"
                value={formData.locationName}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={!!error.locationName}
            />
            {error.locationName && (
                <div className="invalid-feedback d-block">{error.locationName}</div>
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
