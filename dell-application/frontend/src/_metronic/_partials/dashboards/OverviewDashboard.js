import React from 'react';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faVideo} from '@fortawesome/free-solid-svg-icons';

function OverviewDashboard() {
    return (
        <>
            <div className="container-fluid mt-4">
                <div className="row">
                    <div className="col-12 col-md-6 col-lg-3 mb-4"
                         // onClick={() => {
                         //     window.location.href = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/#/admin/investingforensic`;
                         // }}
                    >
                        <div className="card card-custom-hiro gutter-b"
                             style={{height: "150px", textDecoration: "none", cursor: "pointer"}}>
                            <div className="card-body-vfs">
                                <FontAwesomeIcon icon={faVideo} style={{color: '#2d8a9e', fontSize: '48px'}}/>
                                <div className="lead font-weight-bold mt-4">
                                    Total Location
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Card 2 (Non-clickable, no pointer cursor) */}
                    <div className="col-12 col-md-6 col-lg-3 mb-4">
                        <div className="card card-custom-hiro gutter-b"
                             style={{height: "150px", textDecoration: "none", cursor: "default"}}>
                            <div className="card-body-vfs">
                                {/*<FontAwesomeIcon icon={faPersonFalling} style={{color: '#2d8a9e', fontSize: '48px'}}/>*/}
                                <div className="lead font-weight-bold mt-4">
                                    Total Camera
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3 (Non-clickable, no pointer cursor) */}
                    <div className="col-12 col-md-6 col-lg-3 mb-4">
                        <div className="card card-custom-hiro gutter-b"
                             style={{height: "150px", textDecoration: "none", cursor: "default"}}>
                            <div className="card-body-vfs">
                                {/*<Videocam style={{fontSize: '50px', color: '#2d8a9e'}}/>*/}
                                <div className="lead font-weight-bold mt-4">
                                    Total Modal
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default OverviewDashboard;