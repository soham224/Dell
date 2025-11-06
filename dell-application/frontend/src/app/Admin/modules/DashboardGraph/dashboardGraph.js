import React, {Component, Fragment} from "react";
import {Col, Row} from "react-bootstrap";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import drilldown from "highcharts/modules/drilldown";
import stock from "highcharts/modules/stock";
import {getFilterGraphData} from "./_redux";
import {warningToast} from "../../../../utils/ToastMessage";
import {connect} from "react-redux";
import * as auth from "../Auth";
import moment from "moment";
import {getCurrentEndDate, getCurrentStartDate} from "../../../../utils/TimeZone";

drilldown(Highcharts);
stock(Highcharts);

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const valueOfMonth = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12
};

class DashboardGraph extends Component {
  constructor(props) {
    super(props);

    const processXAxis = (xAxis, durationType) => {
      if (durationType !== "month") {
        return xAxis;
      } else {
        return xAxis.map(xData => {
          let [year, month] = xData.split("-");
          return `${monthNames[month - 1]}-${year}`;
        });
      }
    };
    const calculateMax = (xAxisLength) => {
      // If more than 5 points, show the last 5 by default
      return xAxisLength > 5 ? xAxisLength - 1 : xAxisLength - 1;
    };

    const calculateMin = (xAxisLength) => {
      // Align viewport to the right to enable right-to-left scrolling
      return xAxisLength > 5 ? xAxisLength - 5 : 0;
    };

    const getYAxisType = (data) => {
      const min = Math.min(...data);
      const max = Math.max(...data);
      const threshold = 10; // Adjust threshold as needed
      return max / min > threshold ? 'logarithmic' : 'linear';
    };


    // Process X and Y axis data
    const mnthXaxis = processXAxis(this.props.xAxis, this.props.parameters.duration_type);
    const max = calculateMax(mnthXaxis.length);
    const min = calculateMin(mnthXaxis.length);

    // Determine Y-axis type dynamically
    const yAxisDataFlat = this.props.yAxis.flat(); // Ensure data is flat if nested
    const yAxisType = getYAxisType(yAxisDataFlat);


    this.state = {
      allowChartUpdate: true,
      xAxisData: [mnthXaxis],
      yAxisData: [this.props.yAxis],
      drilldownCount: 0,
      options: {
        chart: {
          type: "column",
          scrollablePlotArea: {
            scrollPositionX: 1,
          },
          events: {
            drilldown: this.addDrilldownSeries.bind(this),
            drillupall: this.addDrillUpSeries.bind(this)
          }
        },
        credits: {
          enabled: false
        },
        xAxis: {
          categories: mnthXaxis,
          min: min,
          max: max,
          scrollbar: {
            enabled: mnthXaxis.length > 5 // only show if more than 5
          },
          // events: {
          //   afterSetExtremes: function (e) {
          //     if (!this.hasUserSetExtremes) {
          //       const dataMax = this.dataMax;
          //       const range = this.max - this.min;
          //       this.setExtremes(dataMax - range, dataMax);
          //       this.hasUserSetExtremes = true;
          //     }
          //   }
          // }
        },
        yAxis: {
          type: 'logarithmic',
          //   title: {
          //     text: "Total count "
          //   },
          //   min: 1
        },
        title: {
          text: ""
        },
        legend: {
          enabled: true
        },
        plotOptions: {
          series: {
            turboThreshold: 0,
            cursor: "pointer",
            events: {
              legendItemClick: function (e) {
                e.preventDefault();
              }
            },
            point: {
              events: {
                click: this.displayTableOnLastDrilldown.bind(this)
              }
            }
          },
          column: {
            pointPadding: 0.2,
            borderWidth: 0
          }
        },

        tooltip: {
          headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
          pointFormat:
              '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b> of total<br/>'
        },
        series: this.props.yAxis,
      }
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {graphType: graphTypePrevProp} = prevProps;
    const {graphType: graphTypeCurrentProp} = this.props;
    const {chartObj: chartObjCurrentState} = this.state;
    const {dashboardGraphName: dashboardGraphName} = this.props;
    if (
        graphTypePrevProp !== graphTypeCurrentProp &&
        chartObjCurrentState !== undefined
    ) {
      let chartType = graphTypeCurrentProp;

      if (graphTypeCurrentProp === "stack") {
        chartType = "column";
        this.state.chartObj.update({
          chart: {
            type: chartType
          },
          plotOptions: {
            column: {
              stacking: "normal",
              grouping: false
            }
          }
        });
      } else {
        this.state.chartObj.update({
          chart: {
            type: chartType
          },
          plotOptions: {
            column: {
              grouping: true,
              stacking: false
            }
          }
        });
      }
    }
  }

  displayTableOnLastDrilldown = data => {
    this.props.displayDataTableFromBar(data.point.dataId, data.point.name);

  };

  addDrilldownSeries = e => {
    const {user} = this.props;
    let userRole = user.roles[0].role;
    this.state.chartObj.showLoading("Loading ...");
    this.setState({
      allowChartUpdate: false
    });

    let year = new Date().getFullYear();
    let startDate = "",
        endDate = "";
    let params = {};

    // this if is used for drill if month and year are same
    if (this.props.parameters.duration_type === "day") {
      if (this.state.xAxisData.length === 1) {
        // let date = e.point.category.split("-");
        // let date_GMT =
        //   date[0].toLocaleString("en-US", {
        //     minimumIntegerDigits: 2,
        //     useGrouping: false,
        //   }) +
        //   "-" +
        //   date[1].toLocaleString("en-US", {
        //     minimumIntegerDigits: 2,
        //     useGrouping: false,
        //   }) +
        //   "-" +
        //   date[2].toLocaleString("en-US", {
        //     minimumIntegerDigits: 2,
        //     useGrouping: false,
        //   });
        let count = this.state.drilldownCount + 1;
        this.setState({
          drilldownCount: count
        });

        if (
            this.props.parameters.start_date &&
            moment(this.props.parameters.start_date).isValid()
        ) {
          startDate = new Date(this.props.parameters.start_date);
        } else {
          startDate = getCurrentStartDate();
        }

        if (
            this.props.parameters.end_date &&
            moment(this.props.parameters.end_date).isValid()
        ) {
          endDate = new Date(this.props.parameters.end_date);
        } else {
          endDate = getCurrentEndDate();
        }

      }


      params.start_date = startDate;
      params.end_date = endDate;
      this.props.dashboardGraphName === "Label"
          ? (params.selected_model_labels_list = e.point.name)
          : (params.selected_event_list = e.point.name);
      params.duration_type = "hour";
      params.camera_id = this.props?.parameters?.camera_id;
      params.location_id = this.props.locationId;
      if (this.state.xAxisData && this.state.xAxisData.length !== 2) {
        getFilterGraphData(params, userRole, this.props.dashboardGraphName)
            .then(response => {
              if (response.data.length > 0) {
                let obj = response.data;
                let labels = [];
                let labelObj = obj[0];
                // eslint-disable-next-line
                Object.entries(labelObj).map(([key, value]) => {
                  labels.push(key);
                });
                if (params.duration_type === "hour") {
                  let local_time_arr = [];
                  let sortObj = obj;
                  obj.map((item, index) => {
                    sortObj[index]["_id"] = this.convertDateFromUTCToLocal(
                        item._id
                    );
                    local_time_arr.push(sortObj[index]["_id"]);
                    return null;
                  });
                  local_time_arr.sort(function (a, b) {
                    return (
                        new Date("1970/01/01 " + a) - new Date("1970/01/01 " + b)
                    );
                  });
                  sortObj.sort(
                      (a, b) =>
                          new Date("1970/01/01 " + a._id) -
                          new Date("1970/01/01 " + b._id)
                  );
                  obj = sortObj;
                }
                const index = labels.indexOf("_id");
                if (index > -1) {
                  labels.splice(index, 1);
                }
                const index2 = labels.indexOf("id");
                if (index2 > -1) {
                  labels.splice(index2, 1);
                }
                let series = [];
                for (let j = 0; j < labels.length; j++) {
                  let datalabel = labels[j];
                  series.push({name: datalabel, data: []});
                }
                let xAxis = [];
                for (let y = 0; y < obj.length; y++) {
                  let graphObj = obj[y];
                  // let convertedTime = this.convertDateFromUTCToLocal(graphObj._id);
                  xAxis.push(graphObj._id);
                }
                for (let i = 0; i < labels.length; i++) {
                  for (let p = 0; p < obj.length; p++) {
                    let obj1 = obj[p];
                    let data = obj1[labels[i]];
                    for (let s in series) {
                      if (labels[i] === series[s].name) {
                        series[s].data.push({
                          name: labels[i],
                          y: data,
                          drilldown: false,
                          dataId: obj1.id
                        });
                      }
                    }
                  }
                }

                let xAxisData = this.state.xAxisData;
                xAxisData.push(xAxis);
                let yAxisData = this.state.yAxisData;
                yAxisData.push(series);

                this.setState(
                    {
                      xAxisData: xAxisData,
                      yAxisData: yAxisData
                    },
                    () => {
                    }
                );
                const max = xAxis.length - 1;
                const min = xAxis.length > 5 ? xAxis.length - 5 : 0;
                this.props.setXAxisYAxisAfterDrilldown(xAxis, series[0], true);
                this.state.chartObj.addSeriesAsDrilldown(e.point, series[0]);
                this.state.chartObj.xAxis[0].update({
                  categories: xAxis,
                  min: min,
                  max: max,
                  scrollbar: {
                    enabled: xAxis.length > 5
                  }
                });

                this.state.chartObj.hideLoading();
              } else {
                this.state.chartObj.hideLoading();
                console.log("No Data Found");
                this.setState({
                  graphMessage: "No Data Found"
                });
              }
            })
            .catch(error => {
              this.state.chartObj.hideLoading();
              if (error.detail) {
                console.log(error.detail);
              }
            });
      }
    } // code to drilldown different months
    else {
      //on different months filter all days are coming yyyy-mm-dd
      if (this.state.xAxisData.length === 1) {
        //from filter apply month drill down
        let start_date;
        let end_date;
        if (this.props.parameters.selected_model_labels_list) {
          if (
              this.props.parameters.start_date &&
              moment(this.props.parameters.start_date).isValid()
          ) {
            let splitDate = e.point.category.split("-");
            let splitDateStartDateTime = this.props.parameters.start_date.split(
                "T"
            );
            let splitDateStartMonth = splitDateStartDateTime[0].split("-");

            if (Number(splitDateStartMonth[1]) === valueOfMonth[splitDate[0]]) {
              start_date = new Date(this.props.parameters.start_date);
            } else {
              let splitDate = e.point.category.split("-");
              let startTimeStemp1 = moment(
                  new Date(splitDate.join("-"))
              ).subtract(1, "days");
              let startDateNew1 = startTimeStemp1.format("YYYY-MM-DD");
              start_date = startDateNew1 + "T18:30:00.000Z";
            }
          } else {
            let splitDate = e.point.category.split("-");
            let startTimeStemp1 = moment(
                new Date(splitDate.join("-"))
            ).subtract(1, "days");
            let startDateNew1 = startTimeStemp1.format("YYYY-MM-DD");
            start_date = startDateNew1 + "T18:30:00.000Z";
            // start_date = getCurrentStartDate();
          }

          if (
              this.props.parameters.end_date &&
              moment(this.props.parameters.end_date).isValid()
          ) {
            let splitDate = e.point.category.split("-");
            let splitDateEndDateTime = this.props.parameters.end_date.split(
                "T"
            );
            let splitDateEndMonth = splitDateEndDateTime[0].split("-");
            if (Number(splitDateEndMonth[1]) === valueOfMonth[splitDate[0]]) {
              end_date = new Date(this.props.parameters.end_date);
            } else {
              let splitDate = e.point.category.split("-");
              let year = splitDate[1];
              let monthValue = valueOfMonth[splitDate[0]];
              let endDateNew = new Date(year, monthValue, 0);
              end_date =
                  moment(new Date(endDateNew)).format("YYYY-MM-DD") +
                  "T18:29:59.000Z";
            }
          } else {
            let splitDate = e.point.category.split("-");
            let year = splitDate[1];
            let monthValue = valueOfMonth[splitDate[0]];
            let endDateNew = new Date(year, monthValue, 0);
            end_date =
                moment(new Date(endDateNew)).format("YYYY-MM-DD") +
                "T18:29:59.000Z";
          }
          this.props.dashboardGraphName === "Label"
              ? (params.selected_model_labels_list = e.point.name)
              : (params.selected_event_list = e.point.name);
          let count = this.state.drilldownCount + 1;
          this.setState({
            drilldownCount: count
          });
          startDate = start_date;
          endDate = end_date;
          params.duration_type = "day";
        } else {
          let start_date;
          let correctDate;
          if (
              this.props.parameters.start_date &&
              moment(this.props.parameters.start_date).isValid()
          ) {
            let splitDate = e.point.category.split("-");
            let splitDateStartDateTime = this.props.parameters.start_date.split(
                "T"
            );
            let splitDateStartMonth = splitDateStartDateTime[0].split("-");
            if (Number(splitDateStartMonth[1]) === valueOfMonth[splitDate[0]]) {
              start_date = new Date(this.props.parameters.start_date);
            } else {
              let splitDate = e.point.category.split("-");
              let startTimeStemp1 = moment(
                  new Date(splitDate.join("-"))
              ).subtract(1, "days");
              let startDateNew1 = startTimeStemp1.format("YYYY-MM-DD");
              start_date = startDateNew1 + "T18:30:00.000Z";
            }
          } else {
            let splitDate = e.point.category.split("-");
            let startTimeStemp1 = moment(
                new Date(splitDate.join("-"))
            ).subtract(1, "days");
            let startDateNew1 = startTimeStemp1.format("YYYY-MM-DD");
            start_date = startDateNew1 + "T18:30:00.000Z";
          }

          if (
              this.props.parameters.end_date &&
              moment(this.props.parameters.end_date).isValid()
          ) {
            let splitDate = e.point.category.split("-");
            let splitDateEndDateTime = this.props.parameters.end_date.split(
                "T"
            );
            let splitDateEndMonth = splitDateEndDateTime[0].split("-");

            if (Number(splitDateEndMonth[1]) === valueOfMonth[splitDate[0]]) {
              correctDate = new Date(this.props.parameters.end_date);
            } else {
              let splitDate = e.point.category.split("-");
              let year = splitDate[1];
              let monthValue = valueOfMonth[splitDate[0]];
              let endDateNew = new Date(year, monthValue, 0);
              correctDate =
                  moment(new Date(endDateNew)).format("YYYY-MM-DD") +
                  "T18:29:59.000Z";
            }
          } else {
            let splitDate = e.point.category.split("-");
            let year = splitDate[1];
            let monthValue = valueOfMonth[splitDate[0]];
            let endDateNew = new Date(year, monthValue, 0);
            correctDate =
                moment(new Date(endDateNew)).format("YYYY-MM-DD") +
                "T18:29:59.000Z";
            // correctDate = getCurrentEndDate();
          }

          if (!moment(start_date).isValid() && !moment(correctDate).isValid()) {
            let splitDate = e.point.category.split("-");
            let startTimeStemp1 = moment(
                new Date(splitDate.join("-"))
            ).subtract(1, "days");
            let startDateNew1 = startTimeStemp1.format("YYYY-MM-DD");
            year = splitDate[1];
            let monthValue = valueOfMonth[splitDate[0]];
            start_date = startDateNew1 + "T18:30:00.000Z";
            let endDateNew = new Date(year, monthValue, 0);
            correctDate =
                moment(new Date(endDateNew)).format("YYYY-MM-DD") +
                "T18:29:59.000Z";
          }

          this.props.dashboardGraphName === "Label"
              ? (params.selected_model_labels_list = e.point.name)
              : (params.selected_event_list = e.point.name);
          let count = this.state.drilldownCount + 1;
          this.setState({
            drilldownCount: count
          });

          startDate = start_date;
          endDate = correctDate;
          params.duration_type = "day";
        }
      } else if (this.state.xAxisData.length === 2) {

        let start_date;
        let end_date;
        if (this.props.parameters.selected_model_labels_list) {
          let splitDate = e.point.category.split("-");

          let startTimeStemp = moment(new Date(splitDate.join("-"))).subtract(
              1,
              "days"
          );
          let endTimeStemp = moment(new Date(splitDate.join("-")));

          let startDateNew = startTimeStemp.format("YYYY-MM-DD");
          let endDateNew = endTimeStemp.format("YYYY-MM-DD");

          let splitDateStartDate = this.props.parameters.start_date.split("T");
          if (splitDateStartDate[0] === endDateNew) {
            start_date = new Date(this.props.parameters.start_date);
          } else {
            start_date = startDateNew + "T18:30:00.000Z";
          }

          let splitDateEndDate = this.props.parameters.end_date.split("T");
          if (splitDateEndDate[0] === endDateNew) {
            end_date = new Date(this.props.parameters.end_date);
          } else {
            end_date = endDateNew + "T18:29:59.000Z";
          }


          this.props.dashboardGraphName === "Label"
              ? (params.selected_model_labels_list = e.point.name)
              : (params.selected_event_list = e.point.name);
          let count = this.state.drilldownCount + 1;
          this.setState({
            drilldownCount: count
          });
          startDate = start_date;
          endDate = end_date;
          params.duration_type = "hour";
        } else {
          let start_date;
          let end_date;
          if (
              this.props.parameters.start_date &&
              moment(this.props.parameters.start_date).isValid()
          ) {
            // start_date = new Date(this.props.parameters.start_date);

            let splitDate = e.point.category.split("-");
            let splitDateStartDateTime = this.props.parameters.start_date.split(
                "T"
            );
            let splitDateStartMonth = splitDateStartDateTime[0].split("-");

            if (Number(splitDateStartMonth[1]) === valueOfMonth[splitDate[0]]) {
              start_date = new Date(this.props.parameters.start_date);
            } else {
              let splitDate = e.point.category.split("-");
              let startTimeStemp1 = moment(
                  new Date(splitDate.join("-"))
              ).subtract(1, "days");
              let startDateNew1 = startTimeStemp1.format("YYYY-MM-DD");
              start_date = startDateNew1 + "T18:30:00.000Z";
            }
          } else {
            let splitDate = e.point.category.split("-");
            let startTimeStemp1 = moment(
                new Date(splitDate.join("-"))
            ).subtract(1, "days");
            let startDateNew1 = startTimeStemp1.format("YYYY-MM-DD");
            start_date = startDateNew1 + "T18:30:00.000Z";
            // start_date = getCurrentStartDate();
          }

          if (
              this.props.parameters.end_date &&
              moment(this.props.parameters.end_date).isValid()
          ) {
            let splitDate = e.point.category.split("-");
            let splitDateEndDateTime = this.props.parameters.end_date.split(
                "T"
            );
            let splitDateEndMonth = splitDateEndDateTime[0].split("-");

            if (Number(splitDateEndMonth[1]) === valueOfMonth[splitDate[0]]) {
              end_date = new Date(this.props.parameters.end_date);
            } else {
              let splitDate = e.point.category.split("-");
              let endTimeStemp1 = moment(new Date(splitDate.join("-")));
              let endDateNew1 = endTimeStemp1.format("YYYY-MM-DD");
              end_date = endDateNew1 + "T18:29:59.000Z";
            }
          } else {
            let splitDate = e.point.category.split("-");
            let endTimeStemp1 = moment(new Date(splitDate.join("-")));
            let endDateNew1 = endTimeStemp1.format("YYYY-MM-DD");
            end_date = endDateNew1 + "T18:29:59.000Z";
            // end_date = getCurrentEndDate();
          }

          if (!moment(start_date).isValid() && !moment(end_date).isValid()) {
            let splitDate = e.point.category.split("-");
            let startTimeStemp = moment(new Date(splitDate.join("-"))).subtract(
                1,
                "days"
            );
            let endTimeStemp = moment(new Date(splitDate.join("-")));
            let startDateNew = startTimeStemp.format("YYYY-MM-DD");
            let endDateNew = endTimeStemp.format("YYYY-MM-DD");
            start_date = startDateNew + "T18:30:00.000Z";
            end_date = endDateNew + "T18:29:59.000Z";
          }
          this.props.dashboardGraphName === "Label"
              ? (params.selected_model_labels_list = e.point.name)
              : (params.selected_event_list = e.point.name);
          let count = this.state.drilldownCount + 1;
          this.setState({
            drilldownCount: count
          });
          startDate = start_date;
          endDate = end_date;
          params.duration_type = "hour";
        }
      }

      params.start_date = startDate;
      params.end_date = endDate;
      params.camera_id = this.props.cameraId;
      params.location_id = this.props.locationId;
      params.selected_model_labels_list = this.props.selected_model_labels_list;
      this.props.dashboardGraphName === "Label"
          ? (params.selected_model_labels_list = e.point.name)
          : (params.selected_event_list = e.point.name);
      if (this.state.xAxisData && this.state.xAxisData.length !== 3) {
        getFilterGraphData(params, userRole, this.props.dashboardGraphName)
            .then(response => {
              if (response.data.length > 0) {
                let obj = response.data;
                let local_time_arr = [];
                if (params.duration_type === "hour") {
                  let sortObj = obj;
                  obj.map((item, index) => {
                    sortObj[index]["_id"] = this.convertDateFromUTCToLocal(
                        item._id
                    );
                    local_time_arr.push(sortObj[index]["_id"]);
                    return null;
                  });
                  local_time_arr.sort(function (a, b) {
                    return (
                        new Date("1970/01/01 " + a) - new Date("1970/01/01 " + b)
                    );
                  });
                  sortObj.sort(
                      (a, b) =>
                          new Date("1970/01/01 " + a._id) -
                          new Date("1970/01/01 " + b._id)
                  );
                  obj = sortObj;
                }

                let labels = [];
                let labelObj = obj[0];
                // eslint-disable-next-line
                Object.entries(labelObj).map(([key, value]) => {
                  labels.push(key);
                });
                const index = labels.indexOf("_id");
                if (index > -1) {
                  labels.splice(index, 1);
                }
                if (params.duration_type === "hour") {
                  const index2 = labels.indexOf("id");
                  if (index2 > -1) {
                    labels.splice(index2, 1);
                  }
                }
                let series = [];
                for (let j = 0; j < labels.length; j++) {
                  let datalabel = labels[j];
                  series.push({name: datalabel, data: []});
                }
                let xAxis = [];
                for (let y = 0; y < obj.length; y++) {
                  let graphObj = obj[y];
                  if (params.duration_type === "hour") {
                    let convertedTime = this.convertDateFromUTCToLocal(
                        graphObj._id
                    );
                    let sortObj = convertedTime;
                    convertedTime = sortObj;
                    xAxis.push(graphObj._id);
                  } else {
                    xAxis.push(graphObj._id);
                  }
                }
                for (let i = 0; i < labels.length; i++) {
                  for (let p = 0; p < obj.length; p++) {
                    let obj1 = obj[p];
                    let data = obj1[labels[i]];
                    for (let s in series) {
                      if (labels[i] === series[s].name) {
                        const yValue = data > 0 ? data : 0; // Replace 0 with a small value for logarithmic scale
                        series[s].data.push({
                          name: labels[i],
                          y: yValue,
                          drilldown: params.duration_type === "day",
                          dataId: obj1.id,
                        });
                      }
                    }
                  }
                }

                let xAxisData = this.state.xAxisData;
                xAxisData.push(xAxis);
                let yAxisData = this.state.yAxisData;
                yAxisData.push(series);
                this.setState(
                    {
                      xAxisData: xAxisData,
                      yAxisData: yAxisData
                    },
                    () => {
                    }
                );
                const max = xAxis.length - 1;
                const min = xAxis.length > 5 ? xAxis.length - 5 : 0;
                this.props.setXAxisYAxisAfterDrilldown(xAxis, series[0], true);
                this.state.chartObj.addSeriesAsDrilldown(e.point, series[0]);
                this.state.chartObj.xAxis[0].update({
                  categories: xAxis,
                  min: min,
                  max: max,
                  scrollbar: {
                    enabled: xAxis.length > 5
                  }
                });

                this.state.chartObj.hideLoading();
              } else {
                this.state.chartObj.hideLoading();
                console.log("No Data Found");
                this.setState({
                  graphMessage: "No Data Found"
                });
              }
            })
            .catch(error => {
              this.state.chartObj.hideLoading();
              if (error.detail) {
                console.log("error", error);
              }
            });
      }
    } // end of if - else statement
  };


  convertDateFromUTCToLocal = utcTime => {
    const [hour, minute, second] = utcTime.split(':').map(Number);

    const date = new Date();
    date.setHours(hour, minute, second);

    // Format into 12-hour format with AM/PM
    const formatted = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    return formatted; //setting local time
  };

  addDrillUpSeries = e => {
    this.props.displayDataTableFromBar(null);
    let count = this.state.drilldownCount - 1;
    this.setState({
      drilldownCount: count
    });
    let xAxis = this.state.xAxisData;

    let yAxis = this.state.yAxisData;
    const max = xAxis[count].length - 1;
    const min = xAxis[count].length > 5 ? xAxis[count].length - 5 : 0;
    this.state.chartObj.xAxis[0].update({
      categories: xAxis[count],
      min: min,
      max: max,
      scrollbar: {
        enabled: xAxis[count].length > 5
      }
    });
    xAxis.splice(count + 1, 1);
    yAxis.splice(count + 1, 1);

    let drilldown = true;
    if (count === 0) {
      drilldown = false;
    }
    this.props.setXAxisYAxisAfterDrilldown(
        xAxis[count],
        yAxis[count],
        drilldown
    );

    this.setState({
      xAxisData: xAxis,
      yAxisData: yAxis
    });
  };

  chartCallback = e => {
    this.setState({
      chartObj: e
    });
    Highcharts.Tick.prototype.drillable = function () {
    };
  };

  render() {
    return (
        <Fragment>
          <Row>
            <Col xl={12}>
              <HighchartsReact
                  highcharts={Highcharts}
                  options={this.state.options}
                  callback={this.chartCallback}
                  allowChartUpdate={this.state.allowChartUpdate}
              />
            </Col>
          </Row>
        </Fragment>
    );
  }
}

function mapStateToProps(state) {
  const {auth} = state;
  return {user: auth.user};
}

export default connect(mapStateToProps, auth.actions)(DashboardGraph);