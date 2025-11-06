import React from "react";
import {Button} from "reactstrap";

export default function CustomizedButtons({
                                              loading,
                                              size,
                                              title,
                                              submit,
                                              flag,
                                              color,
                                              className,
                                              dataTestId,
                                              icon, handleKeyDown, style, id
                                          }) {


    return (
        <Button
            id={id}
            style={style}
            onClick={submit}
            size={size ? size : "large"}
            onKeyDown={handleKeyDown}
            disabled={flag ? flag : false}
            className={className ? className : "ms-2"}
            color={color ? color : "primary"}
            data-testid={dataTestId ? dataTestId : ""}
        >
            {icon && <span>{icon}&nbsp;</span>}
            {title}{loading ? loading : ''}
        </Button>
    );
}
