import React, {Component, Fragment} from "react";
import {
  Button,
  Col,
  Label,
  Row,
  Input,
} from "reactstrap";
import Select from "react-select";
import {
  assignLocationToSupervisor,
  deleteUserLocationById,
  getLocationList,
} from "./_redux";
import { successToast, warningToast } from "../../../../utils/ToastMessage";
import { addNotification } from "../Notification/_redux/notification";
import { connect } from "react-redux";
import * as auth from "../Auth";
import BlockUi from "@availity/block-ui";
import {Modal} from "react-bootstrap";

class AssignLocationModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalOpen: props.modalOpen,
      specific_user_id: props.specific_user_id,
      locationOptions: [],
      selectedLocationList: [],
      user_id: props.selectedUser.id,
      user_email: props.selectedUser.email,
      user_selected_location: props.selectedUserLocation,
      selectedLocation: [],
      blocking: false,
    };
  }

  componentDidMount() {
    this.populateLocationList();
  }

  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    this.setState({
      modalOpen: nextProps.modalOpen,
      user_id: nextProps.selectedUser.id,
      specific_user_id: nextProps.specific_user_id,
      user_email: nextProps.selectedUser.email,
      user_selected_location: nextProps.selectedUserLocation,
    });
    if (nextProps.modalOpen) {
      this.getCurrentUserLocationList();
    }
  }

  getCurrentUserLocationList = () => {
    let user_selected_location = this.state.user_selected_location;
    if (user_selected_location && user_selected_location.length > 0) {
      let selectedLocationArray = [];
      for (const location of user_selected_location) {
        selectedLocationArray.push(location.value);
      }

      this.setState({
        selectedLocation: user_selected_location,
        selectedLocationList: selectedLocationArray,
      });
    } else {
      this.setState({
        selectedLocation: [],
        selectedLocationList: [],
      });
    }
  };

  populateLocationList = () => {
    getLocationList(this.props.userRole,this.props.selectedUser?.company?.id).then((response) => {
      // eslint-disable-next-line
      if (response && response.data) {
        let list = this.generateOptions(response.data);
        this.setState({
          locationOptions: list,
        });
      }
    });
  };

  handleLocationChange = (selectedLocation) => {
    const difference = this.getLocationDifference(selectedLocation);

    if (!difference.length) {
      this.updateSelectedLocations(selectedLocation);
      return;
    }

    const removedLocation = difference[0];
    const params = { location_list: [removedLocation.value] };
    const { user, selectedUserLocation } = this.props;

    this.setState({ selectedLocation });

    if (selectedUserLocation.includes(removedLocation)) {
      this.setState({ blocking: true });

      deleteUserLocationById(params, this.state.specific_user_id)
          .then((response) => {
            this.setState({ blocking: false });

            if (response?.isSuccess) {
              this.updateSelectedLocations(selectedLocation);
              this.sendLocationDeletedNotification(user, removedLocation.label);
            } else {
              warningToast("Something went wrong");
            }
          })
          .catch((error) => {
            this.setState({ blocking: false });
            warningToast(error?.detail || "Something went Wrong");
          });
    } else {
      this.updateSelectedLocations(selectedLocation);
    }
  };

  getLocationDifference = (selectedLocation) => {
    return this.state.selectedLocation?.filter(
        (x) => !selectedLocation?.includes(x)
    ) || [];
  };

  updateSelectedLocations = (selectedLocation) => {
    const selectedLocationList = selectedLocation?.map((loc) => loc.value) || [];
    this.setState({
      selectedLocation,
      selectedLocationList,
    });
  };

  sendLocationDeletedNotification = (user, deletedLabel) => {
    const data = {
      notification_message: `Assign Location Deleted: ${deletedLabel}`,
      user_id: user.id,
      type_of_notification: "string",
      status: true,
      is_unread: true,
    };

    addNotification(data).then((response) => {
      if (response?.isSuccess) {
        successToast("Assign Location Deleted Successful");
      }
    });
  };

  assignLocation = () => {
    let parameters = {
      location_list: this.state.selectedLocationList,
    };
    if (
      this.state.selectedLocationList &&
      this.state.selectedLocationList.length > 0
    ) {
      assignLocationToSupervisor(parameters, this.state.specific_user_id).then(
        (response) => {
          const { user } = this.props;
          if (response && response.isSuccess) {
            this.props.blockAddSupervisor();
            this.props.toggleLocationModal();

            const addedLocation = this.state.selectedLocation.map(obj => obj.label).join(" ");


            let data = {
              notification_message: " Assign Location Added: " + addedLocation,
              user_id: user.id,
              type_of_notification: "string",
              status: true,
              is_unread: true,
            };
            addNotification(data).then((response) => {
              if (response && response.isSuccess) {
                successToast("Assign Location Added Successful");
              }
            });
          } else {
            warningToast("Something went wrong");
          }
        }
      );
    } else {
      warningToast("Please fill required fields");
    }
  };

  generateOptions = (array) => {
    let options = [];
    for (const data of array) {
      options.push({
        value: data.id,
        label: data.location_name,
      });
    }
    return options;
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
    const { locationOptions, selectedLocation, user_email } = this.state;
    return (
      <Fragment>
            <Modal
                backdrop="static"
                size="md"
                centered={false}
                show={this.state.modalOpen}
                onHide={this.props.toogleSupervisorModal}
                aria-labelledby="example-modal-sizes-title-lg"
            >
              <BlockUi tag="div" blocking={this.state.blocking} color="#147b82">
              <Modal.Header closeButton>
                <Modal.Title id="example-modal-sizes-title-lg">
                  Assign Location
                </Modal.Title>
              </Modal.Header>

            <Modal.Body>
              <Label for="user_email">User Email</Label>
              <Input
                disabled={true}
                type="user_email"
                value={user_email}
                name="user_email"
              />

              <Label className={"mt-2"} for="assign_location">
                Assign Location *
              </Label>
              <Select
                theme={this.selectTheme}
                isMulti={true}
                placeholder="Assign Location"
                value={selectedLocation}
                onChange={this.handleLocationChange}
                options={locationOptions}
              />
            </Modal.Body>
            <Modal.Footer>
              <Row className={"m-0"} style={{ width: "100%" }}>
                <Col className={"p-0"} xl={12}>
                  <div style={{ width: "100%", textAlign: "end" }}>
                    <Button
                      color={"secondary"}
                        onClick={this.props.toggleLocationModal}
                      className={'mr-2'}
                    >
                      Cancel
                    </Button>
                    <Button
                        color={"primary"}
                      onClick={this.assignLocation}

                    >
                      Assign Location
                    </Button>

                  </div>
                </Col>
              </Row>
            </Modal.Footer>
          </BlockUi>
        </Modal>
      </Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { auth } = state;
  return { user: auth.user };
}

export default connect(mapStateToProps, auth.actions)(AssignLocationModal);
