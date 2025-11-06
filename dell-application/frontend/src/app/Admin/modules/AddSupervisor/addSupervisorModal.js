import React, { Component, Fragment } from "react";
import {
  Button,
  Col,
  Input,
  Label,
  Row
} from "reactstrap";
import { addSupervisor, getCompaniesList } from "./_redux";
import { connect } from "react-redux";
import * as auth from "../Auth";
import { addNotification } from "../Notification/_redux/notification";
import Select from "react-select";
import { SUPER_ADMIN_ROLE } from "../../../../enums/constant";
import { Modal } from "react-bootstrap";
import {successToast, warningToast} from "../../../../utils/ToastMessage";

// constants.js
export const VALIDATION_MESSAGES = {
  PASSWORD_REQUIREMENTS: "Password must be at least 8 characters and include a letter, number, and symbol",
  EMAIL_REQUIREMENTS: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

class AddSupervisorModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalOpen: props.modalOpen,
      user_email: "",
      user_password: "",
      selectedCompanies: null,
      companyList: [],
      errors: {
        user_email: "",
        user_password: "",
        selectedCompanies: ""
      }
    };
  }

  componentDidMount() {
    if (this.props.userRole === SUPER_ADMIN_ROLE) {
      getCompaniesList()
          .then((res) => {
            if (res?.isSuccess && Array.isArray(res.data)) {
              this.setState({ companyList: res.data });
            }
          })
          .catch(() => {
            console.warn("Failed to fetch companies");
          });
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ modalOpen: nextProps.modalOpen });
  }

  handleOnChange = (event) => {
    const { name, value } = event.target;
    this.setState((prevState) => ({
      [name]: value,
      errors: {
        ...prevState.errors,
        [name]: ""
      }
    }));
  };

  handleBlur = (event) => {
    const { name, value } = event.target;
    const errors = { ...this.state.errors };

    if (name === "user_email") {
      if (!VALIDATION_MESSAGES?.EMAIL_REQUIREMENTS.test(value.trim())) {
        errors.user_email = "Please enter a valid email";
      }
    }

    if (name === "user_password") {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
      if (!passwordRegex.test(value)) {
        errors.user_password = VALIDATION_MESSAGES?.PASSWORD_REQUIREMENTS;
      }
    }

    this.setState({ errors });
  };

  handleCompanyChange = (selectedCompanies) => {
    this.setState((prevState) => ({
      selectedCompanies,
      errors: {
        ...prevState.errors,
        selectedCompanies: ""
      }
    }));
  };

  addSupervisorToList = () => {
    const { user, userRole } = this.props;
    const { user_email, user_password, selectedCompanies } = this.state;
    const errors = {};

    // Validation
    if (!VALIDATION_MESSAGES?.EMAIL_REQUIREMENTS.test(user_email.trim())) {
      errors.user_email = "Please enter a valid email";
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(user_password)) {
      errors.user_password =
         VALIDATION_MESSAGES?.PASSWORD_REQUIREMENTS;
    }

    if (userRole === SUPER_ADMIN_ROLE && !selectedCompanies) {
      errors.selectedCompanies = "Please select at least one company";
    }

    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    const param = {
      user_email,
      user_password,
      user_status: true
    };

    if (userRole === SUPER_ADMIN_ROLE) {
      param.company_id = selectedCompanies.value;
    }

    addSupervisor(param)
        .then((response) => {
          if (response?.isSuccess) {
            this.props.toggleSupervisorModal();

            const notificationData = {
              notification_message: `Supervisor Added: ${user_email}`,
              user_id: user.id,
              type_of_notification: "string",
              status: true,
              is_unread: true
            };

            addNotification(notificationData)
                .then(() => {
                  successToast("Create Supervisor Added Successful")
                    this.props.toggleSupervisorModal();
                })
                .catch((err) => {
                  console.warn(err?.detail || "Notification error");
                });
          }
        })
        .catch((err) => {
          warningToast(err?.detail);
          console.warn(err?.detail || "Something went wrong");
        });
  };
  selectTheme = (theme) => ({
    ...theme,
    borderRadius: 0,
    colors: {
      ...theme.colors,
      primary25: "#5DBFC4",
      primary: "#147b82",
    },
  })

  render() {
    const {
      user_email,
      user_password,
      selectedCompanies,
      companyList,
      errors
    } = this.state;
    const { userRole } = this.props;

    const companyOptions = companyList.map((company) => ({
      value: company.id,
      label: company.company_name
    }));

    return (
        <Fragment>
          <Modal
              backdrop="static"
              size="md"
              centered={false}
              show={this.state.modalOpen}
              onHide={this.props.toggleSupervisorModal}
              aria-labelledby="example-modal-sizes-title-lg"
          >
            <Modal.Header closeButton>
              <Modal.Title id="example-modal-sizes-title-lg">
                Add Supervisor
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {userRole === SUPER_ADMIN_ROLE && (
                  <>
                    <Label className="mt-2" for="assign_company">
                      Assign Company *
                    </Label>
                    <Select
                        placeholder="Assign Company"
                        value={selectedCompanies}
                        onChange={this.handleCompanyChange}
                        options={companyOptions}
                        className={errors.selectedCompanies ? "is-invalid" : ""}
                        theme={this.selectTheme}
                    />
                    {errors.selectedCompanies && (
                        <div className="text-danger mt-1">{errors.selectedCompanies}</div>
                    )}
                  </>
              )}

              <Label for="email" className="mt-3">
                Email *
              </Label>
              <Input
                  type="email"
                  name="user_email"
                  value={user_email}
                  onChange={this.handleOnChange}
                  onBlur={this.handleBlur}
                  invalid={!!errors.user_email}
              />
              {errors.user_email && (
                  <div className="text-danger mt-1">{errors.user_email}</div>
              )}

              <Label for="password" className="mt-2">
                Password *
              </Label>
              <Input
                  type="password"
                  name="user_password"
                  value={user_password}
                  onChange={this.handleOnChange}
                  onBlur={this.handleBlur}
                  invalid={!!errors.user_password}
              />
              {errors.user_password && (
                  <div className="text-danger mt-1">{errors.user_password}</div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Row className="m-0" style={{ width: "100%" }}>
                <Col className="p-0" xl={12}>
                  <div style={{ width: "100%", textAlign: "end" }}>
                    <Button
                        onClick={this.props.toggleSupervisorModal}
                        color={"secondary"}
                    >
                      Cancel
                    </Button>
                    <Button
                        onClick={this.addSupervisorToList}
                        color={"primary"}
                        className={"ml-3"}
                    >
                      Add Supervisor
                    </Button>
                  </div>
                </Col>
              </Row>
            </Modal.Footer>
          </Modal>
        </Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { auth } = state;
  return {
    user: auth.user,
    userRole: auth.user?.roles?.[0]?.role
  };
}

export default connect(mapStateToProps, auth.actions)(AddSupervisorModal);
