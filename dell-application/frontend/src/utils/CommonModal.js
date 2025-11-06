import React from "react";
import {Modal} from "react-bootstrap";
import CustomizedButtons from "./CustomizedButtons";

const CommonModal = ({
                         show,
                         title,
                         content,
                         backdrop,
                         keyboard,
                         scrollable,
                         size,
                         arialabelledby,
                         closeButtonFlag,
                         id,
                         handleClose,
                         submitEmployee,
                         flag,
                         dialogClassName,
                         fullscreen,applyButton,footerCustom,style,footerContent,animation,
                         hideFooter
    
                     }) => {
    return (<Modal show={show} onHide={handleClose}
                   backdrop={backdrop}
                   keyboard={keyboard}
                   scrollable={scrollable ? scrollable : true}
                   size={size}
                   dialogClassName={dialogClassName}
                   fullscreen={fullscreen ? fullscreen : false}
                   aria-labelledby={arialabelledby}
                   centered
                   style={style}
                   animation={animation}
    >
        <Modal.Header closeButton={closeButtonFlag ? closeButtonFlag : false}>
            <Modal.Title id="example-modal-sizes-title-lg">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{content}</Modal.Body>
        {!hideFooter &&
        <Modal.Footer style={{ display:footerCustom && "block" }}>
            {footerCustom ? footerContent :
                <>
            <CustomizedButtons
                size={"md"}
                color={"secondary"}
                title={"Cancel"}
                flag={false}
                submit={handleClose}
            />
            {applyButton &&
            <CustomizedButtons
                size={"md"}
                color={"primary"}
                title={id ? "Update" : "Save"}
                flag={flag}
                submit={submitEmployee}
            />}
                </>
        }
        </Modal.Footer>
        }
    </Modal>);
};

export default CommonModal;
