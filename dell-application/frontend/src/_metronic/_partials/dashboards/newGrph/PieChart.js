import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import Highcharts3D from 'highcharts/highcharts-3d';
import { Col, Row, Card, CardBody } from "reactstrap";

// Apply Highcharts3D functionality
Highcharts3D(Highcharts);

// Custom colors
export const colors = [
    '#5ca4a9', '#147b82', '#5c8aa8', '#d2784b', '#d1a654',
    '#a8546e', '#116065', '#7dc1c1', '#83aabc', '#b76e79',
    '#95d0d0', '#9fb7b9', '#cf9f96', '#cfb956', '#be7290',
    '#0f5e66', '#3b7071', '#2d8a9e'
];

const TopspinPieChart = ({ chairData, tableData }) => {
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state

    useEffect(() => {
        try {
            // If data is available, render the charts, otherwise show loader
            setLoading(false); // Assume the data is fetched or is in state
            const renderPieChart = (containerId, title, seriesData) => {

                if (!Array.isArray(seriesData)) {
                    throw new Error('Invalid data format for seriesData');
                }

                const updatedSeriesData = seriesData.map((data, index) => ({
                    ...data,
                    sliced: index === 0, // Highlight the largest slice (first slice after sorting)
                }));

                Highcharts.chart(containerId, {
                    chart: {
                        type: 'pie',
                        options3d: {
                            enabled: true,
                            alpha: 45,
                            beta: 0
                        }
                    },
                    title: {
                        text: ""
                    },
                    tooltip: {
                        pointFormat: '{series.name}: <b>{point.y}</b>%' // Show both value and percentage
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            depth: 35,
                            dataLabels: {
                                enabled: true, // Enable labels
                                useHTML: true, // Allow custom HTML styles
                                style: {
                                    color: '#000', // Set default color (optional)
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    textDecoration: 'none' // Remove underline
                                },
                                formatter: function () {
                                    // Apply slice color dynamically
                                    return `<span style="color:${this.color}; text-decoration: none;">${this.point.name}: ${this.point.y}%</span>`;
                                }
                            }
                        }
                    },
                    colors: colors, // Apply custom colors
                    credits: {
                        enabled: false // Disable Highcharts.com watermark
                    },
                    series: [{
                        type: 'pie',
                        name: 'Share',
                        data: updatedSeriesData
                    }]
                });
            };

            if (chairData && chairData.length) {
                // Render Pie Chart for Chair
                renderPieChart('pieChairContainer', 'Chair Occupancy Overview', chairData);
            }
            if (tableData && tableData.length) {
                // Render Pie Chart for Table
                renderPieChart('pieTableContainer', 'Table Occupancy Overview', tableData);
            }
        } catch (err) {
            setError(err.message); // Handle any errors that occur during chart rendering
            setLoading(false); // Stop loading after error occurs
        }
    }, [chairData, tableData]); // Re-render whenever the data changes

    const isNoData = (data) => {
        return !data || data.length === 0;
    };

    const renderContent = (loading, data, containerId) => {
        if (loading) {
            return <div className={'d-flex align-items-center justify-content-center h-100 h3'}>Loading...</div>;
        } else if (isNoData(data)) {
            return <div className={'d-flex align-items-center justify-content-center h-100 h3'}>No data available</div>;
        } else {
            return <div id={containerId}></div>;
        }
    };

    return (
        <>
            {error && <div style={{ color: 'red', textAlign: 'center' }}>{`Error: ${error}`}</div>} {/* Show error message */}
            <Row>
                {/* Pie Chart for Chair */}
                <Col xl={6} md={6} sm={12}>
                    <Card className="card-fixed-height">
                        <CardBody>
                            <div className={"chart-title"}>
                                {'Chair Occupancy Overview'}
                            </div>
                            {renderContent(loading, chairData, "pieChairContainer")}
                        </CardBody>
                    </Card>
                </Col>

                {/* Pie Chart for Table */}
                <Col xl={6} md={6} sm={12}>
                    <Card className="card-fixed-height">
                        <CardBody>
                            <div className={"chart-title"}>
                                {'Table Occupancy Overview'}
                            </div>
                            {renderContent(loading, tableData, "pieTableContainer")}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default TopspinPieChart;
