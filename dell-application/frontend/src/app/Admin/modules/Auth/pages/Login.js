import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { connect, useDispatch } from "react-redux";
import { FormattedMessage, injectIntl } from "react-intl";
import Cookies from "universal-cookie";
import * as auth from "../_redux/authRedux";
import { getCurrentUser, login } from "../_redux/authCrud";
import { warningToast  ,successToast} from "../../../../../utils/ToastMessage";
import {
  ADMIN_ROLE,
  SUPER_ADMIN_ROLE,
  SUPERVISOR_ROLE
} from "../../../../../enums/constant";
import {useNavigate} from "react-router-dom";

const initialValues = {
  email: "",
  password: ""
};

function Login(props) {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { intl } = props;
  const [loading, setLoading] = useState(false);

  const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email("Wrong email format")
      .min(3, "Minimum 3 symbols")
      .max(50, "Maximum 50 symbols")
      .required(
        intl.formatMessage({
          id: "AUTH.VALIDATION.REQUIRED_FIELD"
        })
      ),
    password: Yup.string()
      .min(3, "Minimum 3 symbols")
      .max(50, "Maximum 50 symbols")
      .required(
        intl.formatMessage({
          id: "AUTH.VALIDATION.REQUIRED_FIELD"
        })
      )
  });

  const enableLoading = () => {
    setLoading(true);
  };

  const disableLoading = () => {
    setLoading(false);
  };

  const getInputClasses = fieldName => {
    if (formik.touched[fieldName] && formik.errors[fieldName]) {
      return "is-invalid";
    }

    if (formik.touched[fieldName] && !formik.errors[fieldName]) {
      return "is-valid";
    }

    return "";
  };

  const verifyTokenAndSetUser = () => {
    getCurrentUser()
        .then(response => {
          const { data, isSuccess, failureStatus } = response;

          if (!isSuccess || !data) {
            if (failureStatus) {
              warningToast("Something went wrong");
            }
            return;
          }

          if (!data.user_status) {
            warningToast("This Account has been deactivated");
            return;
          }

          dispatch(props.setUser(data));

          const userRole = data.roles?.[0]?.role;
          if (isAdminRole(userRole)) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/violation');
          }
        })
        .catch(error => {
          warningToast(error?.detail || "Something went Wrong");
        });
  };


  const setTokenCookies = async (token, tokenType) => {
    const cookies = new Cookies();
    cookies.set("access_token", token, { httpOnly: false, path: "/" });
    cookies.set("token_type", tokenType, { httpOnly: false, path: "/" });
    verifyTokenAndSetUser();
  };

  const formik = useFormik({
    initialValues,
    validationSchema: LoginSchema,
    onSubmit: (values, { setStatus, setSubmitting }) => {
      enableLoading();
      const authData = new FormData();
      authData.append("username", values.email);
      authData.append("password", values.password);
      login(authData)
        .then(response => {
          let { access_token, token_type } = response.data;
          setTokenCookies(access_token, token_type);
          disableLoading();
        })
        .catch(err => {
          if (err.detail === "Inactive user") {
            successToast("ask admin to enable the user");
            disableLoading();
            setSubmitting(false);
            setStatus();
          } else {
            disableLoading();
            setSubmitting(false);
            setStatus(
              intl.formatMessage({
                id: "AUTH.VALIDATION.INVALID_LOGIN"
              })
            );
            if (err.detail) {
              warningToast(err.detail);
            } else {
              warningToast("Something went Wrong");
            }
          }
        });
    }
  });

  return (
    <div className="login-form login-signin" id="kt_login_signin_form">
      {/* begin::Head */}
      <div className="text-center mb-10 mb-lg-20">
        <h3 className="font-size-h1">
          <FormattedMessage id="AUTH.LOGIN.TITLE" />
        </h3>
        <p className="text-muted font-weight-bold">
          Enter your username and password
        </p>
      </div>
      {/* end::Head */}

      {/*begin::Form*/}
      <form
        onSubmit={formik.handleSubmit}
        className="form fv-plugins-bootstrap fv-plugins-framework"
      >
        {formik.status ? (
          <div className="mb-10 alert alert-custom alert-light-danger alert-dismissible">
            <div className="alert-text font-weight-bold">{formik.status}</div>
          </div>
        ) : null}

        <div className="form-group fv-plugins-icon-container">
          <input
            placeholder="Email"
            type="email"
            className={`form-control form-control-solid h-auto py-5 px-6 ${getInputClasses(
              "email"
            )}`}
            name="email"
            {...formik.getFieldProps("email")}
          />
          {formik.touched.email && formik.errors.email ? (
            <div className="fv-plugins-message-container">
              <div className="fv-help-block">{formik.errors.email}</div>
            </div>
          ) : null}
        </div>
        <div className="form-group fv-plugins-icon-container">
          <input
            autoComplete="on"
            placeholder="Password"
            type="password"
            className={`form-control form-control-solid h-auto py-5 px-6 ${getInputClasses(
              "password"
            )}`}
            name="password"
            {...formik.getFieldProps("password")}
          />
          {formik.touched.password && formik.errors.password ? (
            <div className="fv-plugins-message-container">
              <div className="fv-help-block">{formik.errors.password}</div>
            </div>
          ) : null}
        </div>
        <div className="form-group d-flex flex-wrap justify-content-between align-items-center">
          <button
            id="kt_login_signin_submit"
            type="submit"
            disabled={formik.isSubmitting}
            className={`btn btn-primary font-weight-bold px-9 py-4 my-3`}
          >
            <span>Sign In</span>
            {loading && <span className="ml-3 spinner spinner-white"></span>}
          </button>
        </div>
      </form>
      {/*end::Form*/}
    </div>
  );
}

function mapStateToProps(state) {
  const { auth } = state;
  return { user: auth.user };
}

export default injectIntl(connect(mapStateToProps, auth.actions)(Login));



// Helper function
const isAdminRole = (role) =>
    [ADMIN_ROLE, SUPERVISOR_ROLE, SUPER_ADMIN_ROLE].includes(role);
