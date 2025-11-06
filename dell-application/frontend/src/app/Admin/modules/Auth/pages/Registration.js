import React from "react";
import { useFormik } from "formik";
import { connect} from "react-redux";
import * as Yup from "yup";
import { FormattedMessage, injectIntl } from "react-intl";
import * as auth from "../_redux/authRedux";
import { Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const initialCompanyValues = {
  company_name: "",
  company_email: "",
  company_description: "",
  company_address: "",
  company_pin_code: "",
  company_website: "",
  company_contact: "",
  company_poc: "",
  company_poc_contact: "",
};

const deploymentRegions = [
  {
    id: 1,
    name: "Ohio",
    value: "us-east-2",
  },
  {
    id: 2,
    name: "N. Virginia",
    value: "us-east-1",
  },
  {
    id: 3,
    name: "N. California",
    value: "us-west-1",
  },
  {
    id: 4,
    name: "Oregon",
    value: "us-west-2",
  },
  {
    id: 5,
    name: "Cape Town",
    value: "af-south-1",
  },
  {
    id: 6,
    name: "Hong Kong",
    value: "ap-east-1",
  },
  {
    id: 7,
    name: "Mumbai",
    value: "ap-south-1",
  },
  {
    id: 8,
    name: "Osaka",
    value: "ap-northeast-3",
  },
  {
    id: 9,
    name: "Seoul",
    value: "ap-northeast-2",
  },
  {
    id: 10,
    name: "Singapore",
    value: "ap-southeast-1",
  },
  {
    id: 11,
    name: "Sydney",
    value: "ap-southeast-2",
  },
  {
    id: 12,
    name: "Tokyo",
    value: "ap-northeast-1",
  },
  {
    id: 13,
    name: "Central",
    value: "ca-central-1",
  },
  {
    id: 14,
    name: "Frankfurt",
    value: "eu-central-1",
  },
  {
    id: 15,
    name: "Ireland",
    value: "eu-west-1",
  },
  {
    id: 16,
    name: "London",
    value: "eu-west-2",
  },
  {
    id: 17,
    name: "Milan",
    value: "eu-south-1",
  },
  {
    id: 18,
    name: "Paris",
    value: "eu-west-3",
  },
  {
    id: 19,
    name: "Stockholm",
    value: "eu-north-1",
  },
  {
    id: 20,
    name: "Bahrain",
    value: "mr-south-1",
  },
  {
    id: 21,
    name: "São Paulo",
    value: "sa-east-1",
  },
];

function FormField({ field, formik, ...props }) {
  let validationClass = "";
  if (formik.touched[field] && formik.errors[field]) {
    validationClass = "is-invalid";
  } else if (formik.touched[field] && !formik.errors[field]) {
    validationClass = "is-valid";
  }

  return (
    <div className="form-group fv-plugins-icon-container">
      <input
        {...props}
        className={`form-control form-control-solid h-auto py-5 px-6 ${validationClass}`}
        name={field}
        {...formik.getFieldProps(field)}
      />
      {formik.touched[field] && formik.errors[field] ? (
        <div className="fv-plugins-message-container">
          <div className="fv-help-block">{formik.errors[field]}</div>
        </div>
      ) : null}
    </div>
  );
}

function RegistrationCompany(props) {
  const navigate = useNavigate();

  const { intl } = props;
  const RegistrationCompanySchema = Yup.object().shape({
    company_name: Yup.string()
        .matches(/\D/, "Please Enter Valid Company Name")
        .min(3, "Minimum 3 symbols")
        .max(50, "Maximum 50 symbols")
        .required(
            intl.formatMessage({
              id: "AUTH.VALIDATION.REQUIRED_FIELD",
            })
        ),

    company_email: Yup.string()
      .email("Wrong email format")
      .min(3, "Minimum 3 symbols")
      .max(50, "Maximum 50 symbols")
      .required(
        intl.formatMessage({
          id: "AUTH.VALIDATION.REQUIRED_FIELD",
        })
      ),
    company_address: Yup.string()
      .min(3, "Minimum 3 symbols")
      .max(500, "Maximum 500 symbols")
      .required(
        intl.formatMessage({
          id: "AUTH.VALIDATION.REQUIRED_FIELD",
        })
      ),
    company_pin_code: Yup.string()
        .matches(/^\d{5,6}$/, "Please enter valid company pin code")
        .required(
            intl.formatMessage({
              id: "AUTH.VALIDATION.REQUIRED_FIELD",
            })
        ),
    company_website: Yup.string()
      .required(
        intl.formatMessage({
          id: "AUTH.VALIDATION.REQUIRED_FIELD",
        })
      ),
    company_contact: Yup.string()
        .matches(/^\d{10,11}$/, "Please enter valid contact number")
        .required(
            intl.formatMessage({
              id: "AUTH.VALIDATION.REQUIRED_FIELD",
            })
        ),
    company_poc: Yup.string()
      .min(3, "Minimum 3 symbols")
      .max(25, "Maximum 20 symbols")
      .required(
        intl.formatMessage({
          id: "AUTH.VALIDATION.REQUIRED_FIELD",
        })
      ),
    company_poc_contact: Yup.string()
        .matches(/^\d{10,11}$/, "Please enter valid contact number")
        .required(
            intl.formatMessage({
              id: "AUTH.VALIDATION.REQUIRED_FIELD",
            })
        ),
  });


  const getInputClasses = (fieldname) => {
    if (formik.touched[fieldname] && formik.errors[fieldname]) {
      return "is-invalid";
    }

    if (formik.touched[fieldname] && !formik.errors[fieldname]) {
      return "is-valid";
    }

    return "";
  };

  const formik = useFormik({
    initialValues: initialCompanyValues,
    validationSchema: RegistrationCompanySchema,
    onSubmit: (values) => {
      navigate("/auth/user-registration", {
        state: {
          company_address: values.company_address,
          company_contact: values.company_contact,
          company_email: values.company_email,
          company_name: values.company_name,
          company_description: values.company_name,
          company_pin_code: values.company_pin_code,
          company_poc: values.company_poc,
          company_poc_contact: values.company_poc_contact,
          company_website: values.company_website,
          deployment_region: 'ap-south-1',
        },
      });
    },
  });

  return (
    <div
      className="login-form login-signin"
      style={{ display: "block", overflow: "auto" }}
    >
      <div className="text-center mb-10 mb-lg-20">
        <h3 className="font-size-h1">
          <FormattedMessage id="AUTH.REGISTER.TITLE" />
        </h3>
        <p className="text-muted font-weight-bold">
          Enter your company details to complete Step 1/2
        </p>
      </div>

      <form
        id="kt_login_signin_form"
        className="form fv-plugins-bootstrap fv-plugins-framework animated animate__animated animate__backInUp"
        onSubmit={formik.handleSubmit}
      >
        {/* begin: Alert */}
        {formik.status && (
          <div className="mb-10 alert alert-custom alert-light-danger alert-dismissible">
            <div className="alert-text font-weight-bold">{formik.status}</div>
          </div>
        )}
        {/* end: Alert */}

        {/* begin: Company Name */}
        <FormField field="company_name" formik={formik} placeholder="Company Name" type="text" />
        {/* end: Company Name */}

        {/* begin: Company Email */}
        <FormField field="company_email" formik={formik} placeholder="Company Email" type="text" />
        {/* end: Company Email */}


        {/* begin: Company Address */}
        <FormField field="company_address" formik={formik} placeholder="Company Address" type="textarea" />
        {/* end: Company Address */}

        {/* begin: Company Pin Code */}
        <FormField field="company_pin_code" formik={formik} placeholder="Company Pin Code" type="text" />
        {/* end: Company Pin Code */}

        {/* begin: Company Website */}
        <FormField field="company_website" formik={formik} placeholder="Company Website" type="text" />
        {/* end: Company Website */}

        {/* begin: Company Contact */}
        <FormField field="company_contact" formik={formik} placeholder="Company Contact" type="text" />
        {/* end: Company Contact */}

        {/* begin: Company POC */}
        <FormField field="company_poc" formik={formik} placeholder="Company POC" type="text" />
        {/* end: Company POC */}

        {/* begin: Company POC Contact */}
        <FormField field="company_poc_contact" formik={formik} placeholder="Company POC Contact" type="text" />
        {/* end: Company POC Contact */}


        <div className="form-group d-flex flex-wrap flex-center">
          <button
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid}
            className="btn btn-primary font-weight-bold px-9 py-4 my-3 mx-4"
          >
            <span>Next</span>
          </button>
          
        </div>
      </form>
    </div>
  );
}

export default injectIntl(connect(null, auth.actions)(RegistrationCompany));
